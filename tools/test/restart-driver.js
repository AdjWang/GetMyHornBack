// Injected as an extra <script> into a copy of the minified build.
// The compiler hides all game internals, so this drives the real artifact with
// synthetic keyboard events and only observes public state: the canvas pixels
// and localStorage. If an in-place restart broke the game loop, the canvas
// would stop changing.
(function () {
  const log = [], errors = [];
  // bumps on every execution of this script; a page reload would re-run it
  const boots = window.__boots = (window.__boots || 0) + 1;
  window.addEventListener('error', e => errors.push('error: ' + e.message));
  const ok = (c, m) => log.push((c ? 'PASS' : 'FAIL') + ' ' + m);
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const fire = (type, code) => window.dispatchEvent(new KeyboardEvent(type, { code, bubbles: true }));
  const holds = [];
  const hold = (code) => { fire('keydown', code); holds.push(setInterval(() => fire('keydown', code), 300)); };
  const release = () => { holds.forEach(clearInterval); holds.length = 0; };
  const checksum = () => {
    const c = document.querySelector('canvas');
    if (!c) return 'no-canvas';
    const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
    let h = 0;
    for (let i = 0; i < d.length; i += 997) h = (h * 31 + d[i]) | 0;
    return c.width + 'x' + c.height + ':' + h;
  };
  const animating = async () => { const a = checksum(); await sleep(1000); return a !== checksum(); };
  const save = () => {
    const d = localStorage['gmhb_0_0_0_'];
    if (!d) return 'none';
    const j = JSON.parse(d);
    return 'level=' + j.level + ' idx=' + j.idx + ' bytes=' + d.length;
  };

  (async function () {
    try {
      await sleep(1500);
      ok(document.hasFocus(), 'page has focus (key events reach the engine)');
      ok(await animating(), 'built game boots and animates');

      // start the comic, then walk right into the level 1 doorway
      hold('ArrowDown');
      await sleep(400);
      hold('ArrowRight');
      await sleep(4500);
      const s1 = save();
      ok(/level=1/.test(s1), 'level switch through the in-place restart saved: ' + s1);

      // keep running: pits and spikes kill the player, each death restarts in place
      await sleep(10000);
      const s2 = save();
      ok(/level=1/.test(s2), 'save data still there after the deaths: ' + s2);
      ok(await animating(), 'game loop alive after repeated death restarts');
      ok(errors.length === 0, 'no runtime errors: ' + JSON.stringify(errors.slice(0, 3)));

      // instant restart path, what the R key does
      release();
      fire('keydown', 'KeyR');
      await sleep(1500);
      ok(await animating(), 'game loop alive after the R key restart');
      ok(errors.length === 0, 'still no runtime errors');

      // the old build reloaded the page here; this must not happen any more
      ok(boots === 1, 'no page reload during the whole run (script boots: ' + boots + ')');
      ok(performance.getEntriesByType('navigation').length === 1,
         'exactly one document navigation: ' + performance.getEntriesByType('navigation').length);
    } catch (e) {
      errors.push('harness: ' + (e && e.stack || e));
    }
    const pre = document.createElement('pre');
    pre.id = 'test-result';
    pre.textContent = log.filter(l => l[0] === 'F').length + ' failures, ' + errors.length + ' errors\n'
      + log.join('\n') + '\n' + errors.join('\n');
    document.body.appendChild(pre);
  })();
})();
