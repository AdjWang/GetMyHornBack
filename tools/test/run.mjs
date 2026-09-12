#!/usr/bin/env node
/**
 * Local test runner for the in-place level restart.
 *
 *   node tools/test/run.mjs src     - test the readable sources in src/
 *   node tools/test/run.mjs build   - test the real artifact inside game.zip
 *
 * Serves the files over http (the game needs a real origin for its images and
 * for localStorage), drives headless Chrome over CDP and prints the assertions
 * the test page collected. Exits non-zero when anything fails, so `npm test`
 * works. Requires Google Chrome; set CHROME=/path/to/chrome to override.
 */
import { createServer } from 'node:http';
import { spawn, execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync, mkdtempSync, rmSync, statSync } from 'node:fs';
import { extname, join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { setTimeout as delay } from 'node:timers/promises';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../..');
const mode = process.argv[2] === 'build' ? 'build' : 'src';

const chromePath = [
  process.env.CHROME,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser',
].filter(Boolean).find(p => existsSync(p));
if (!chromePath) {
  console.error('No Chrome found. Install Chrome or set CHROME=/path/to/chrome');
  process.exit(1);
}

// ---------------------------------------------------------------- page setup
let serveRoot = root;
let pagePath = '/tools/test/restart-test.html';
const tempDirs = [];
const tempDir = (tag) => {
  const dir = mkdtempSync(join(tmpdir(), `rd-${tag}-`));
  tempDirs.push(dir);
  return dir;
};

if (mode === 'build') {
  // build.mjs zips from src/build, so the artifact lands in src/
  const zip = [join(root, 'src/game.zip'), join(root, 'game.zip')].find(p => existsSync(p));
  if (!zip) {
    console.error('game.zip not found - run `npm run build` first');
    process.exit(1);
  }
  const dir = tempDir('zip');
  execFileSync('unzip', ['-oq', zip, '-d', dir]);
  const index = readFileSync(join(dir, 'index.html'), 'utf8');
  const driver = readFileSync(join(here, 'restart-driver.js'), 'utf8');
  // the generated html has no closing tags, so append at the very end
  writeFileSync(join(dir, 'test.html'), index + '<script>\n' + driver + '\n</script>');
  serveRoot = dir;
  pagePath = '/test.html';
  console.log(`== testing the shipped bundle: game.zip (${statSync(zip).size} bytes)`);
} else {
  console.log('== testing the readable sources in src/');
}

// -------------------------------------------------------------- static server
const TYPES = {
  '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.png': 'image/png', '.json': 'application/json', '.zip': 'application/zip',
};
const server = createServer((req, res) => {
  const path = decodeURIComponent(new URL(req.url, 'http://local').pathname);
  const file = join(serveRoot, path);
  if (!file.startsWith(serveRoot) || !existsSync(file) || statSync(file).isDirectory()) {
    res.writeHead(404).end('not found');
    return;
  }
  res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream' });
  res.end(readFileSync(file));
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const url = `http://127.0.0.1:${server.address().port}${pagePath}`;

// ------------------------------------------------------------- chrome + cdp
const chrome = spawn(chromePath, [
  '--headless=new', '--no-sandbox', '--disable-crash-reporter', '--disable-breakpad',
  '--no-first-run', '--no-default-browser-check', '--mute-audio', '--window-size=800,600',
  `--user-data-dir=${tempDir('profile')}`, '--remote-debugging-port=0', 'about:blank',
], { stdio: 'ignore' });

let chromeAlive = true;
const cleanup = () => {
  if (chromeAlive) { chromeAlive = false; try { chrome.kill('SIGKILL'); } catch {} }
  try { server.close(); } catch {}
  for (const dir of tempDirs) { try { rmSync(dir, { recursive: true, force: true }); } catch {} }
};
process.on('exit', cleanup);
process.on('SIGINT', () => { cleanup(); process.exit(130); });

// read the chosen debugging port back out of stderr/stdout is unreliable, so
// ask chrome for it through the profile's DevToolsActivePort file instead
const profileDir = tempDirs[tempDirs.length - 1];
let wsUrl;
for (let i = 0; i < 150; ++i) {
  const portFile = join(profileDir, 'DevToolsActivePort');
  if (existsSync(portFile)) {
    const [port] = readFileSync(portFile, 'utf8').split('\n');
    try {
      const info = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json();
      wsUrl = info.webSocketDebuggerUrl;
      break;
    } catch {}
  }
  await delay(200);
}
if (!wsUrl) { console.error('Chrome did not start'); cleanup(); process.exit(1); }

const ws = new WebSocket(wsUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
let nextId = 1;
const pending = new Map();
const exceptions = [];
ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); return; }
  if (msg.method === 'Runtime.exceptionThrown')
    exceptions.push(msg.params.exceptionDetails.exception?.description || msg.params.exceptionDetails.text);
};
const send = (method, params = {}, sessionId) => new Promise(res => {
  const id = nextId++;
  pending.set(id, res);
  ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
});

const { result: target } = await send('Target.createTarget', { url: 'about:blank' });
const { result: attached } = await send('Target.attachToTarget', { targetId: target.targetId, flatten: true });
const session = attached.sessionId;
await send('Runtime.enable', {}, session);
await send('Page.enable', {}, session);
console.log(`== ${url}`);
await send('Page.navigate', { url }, session);

// ------------------------------------------------------------- collect result
const readResult = async () => {
  const r = await send('Runtime.evaluate', {
    expression: `(()=>{const e=document.getElementById('test-result');return e?e.textContent:''})()`,
    returnByValue: true,
  }, session);
  return r.result?.result?.value || '';
};

let output = '';
for (let i = 0; i < 180 && !output; ++i) {
  await delay(500);
  output = await readResult();
}

if (exceptions.length) {
  console.log('\npage exceptions:');
  exceptions.slice(0, 5).forEach(e => console.log('  ' + e.split('\n')[0]));
}
if (!output) {
  console.log('\nTIMED OUT - the test page never produced a result (game loop stuck?)');
  cleanup();
  process.exit(1);
}
console.log('\n' + output);
const failed = !/^0 failures, 0 errors/.test(output);
console.log(failed ? '\nFAILED' : '\nOK');
cleanup();
process.exit(failed ? 1 : 0);
