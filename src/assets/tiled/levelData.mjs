import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const levelJsPath = path.resolve(scriptDir, '../../level.js');
const levelFilePattern = /^level(\d+)\.tmx$/;
const watchMode = process.argv.includes('--watch');

function readLevels() {
  return fs.readdirSync(scriptDir)
    .map(fileName => {
      const match = fileName.match(levelFilePattern);
      return match && {
        idx: Number(match[1]),
        fileName,
        path: path.join(scriptDir, fileName),
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.idx - b.idx)
    .map(readLevel);
}

function readLevel(level) {
  const text = fs.readFileSync(level.path, 'utf8');
  const mapMatch = text.match(/<map\b([^>]*)>/);
  const dataMatch = text.match(/<data\b([^>]*)>([\s\S]*?)<\/data>/);
  if (!mapMatch || !dataMatch) {
    throw new Error(`${level.fileName}: missing map or data section`);
  }
  if (!/\bencoding="csv"/.test(dataMatch[1])) {
    throw new Error(`${level.fileName}: only csv encoded data is supported`);
  }

  const width = readXmlNumber(mapMatch[1], 'width', level.fileName);
  const height = readXmlNumber(mapMatch[1], 'height', level.fileName);
  const data = dataMatch[2].split(',')
    .map(value => value.trim())
    .filter(Boolean)
    .map(Number);
  if (data.some(value => !Number.isFinite(value))) {
    throw new Error(`${level.fileName}: data has non-number tile ids`);
  }
  if (data.length != width * height) {
    throw new Error(`${level.fileName}: expected ${width * height} tiles, got ${data.length}`);
  }
  return { ...level, width, height, data };
}

function readXmlNumber(attributes, name, fileName) {
  const match = attributes.match(new RegExp(`\\b${name}="(\\d+)"`));
  if (!match) {
    throw new Error(`${fileName}: missing ${name}`);
  }
  return Number(match[1]);
}

function formatLevel(level) {
  const rows = [];
  for (let y = 0; y < level.height; ++y) {
    const row = level.data.slice(y * level.width, (y + 1) * level.width);
    rows.push(`  ${row.join(', ')}`);
  }
  return `const LEVEL${level.idx} = [\n${rows.join(',\n')}\n];`;
}

function replaceConstBlock(text, name, value) {
  const pattern = new RegExp(`const ${name} = \\[[\\s\\S]*?\\];`);
  if (!pattern.test(text)) {
    throw new Error(`level.js: missing const ${name}`);
  }
  return text.replace(pattern, value);
}

function writeLevels() {
  const levels = readLevels();
  let text = fs.readFileSync(levelJsPath, 'utf8');
  for (const level of levels) {
    text = replaceConstBlock(text, `LEVEL${level.idx}`, formatLevel(level));
  }
  text = replaceConstBlock(text, 'LEVELS', `const LEVELS = [\n${levels.map(level => `  LEVEL${level.idx}`).join(',\n')},\n];`);
  text = replaceConstBlock(text, 'LEVELS_SIZE', `const LEVELS_SIZE = [\n${levels.map(level => `  vec2(${level.width}, ${level.height})`).join(',\n')},\n];`);
  fs.writeFileSync(levelJsPath, text);
  console.log(`Updated ${path.relative(process.cwd(), levelJsPath)} from ${levels.length} TMX files.`);
}

let timer;
function scheduleWrite() {
  clearTimeout(timer);
  timer = setTimeout(() => {
    try {
      writeLevels();
    } catch (error) {
      console.error(error.message);
    }
  }, 100);
}

writeLevels();

if (watchMode) {
  console.log(`Watching ${path.relative(process.cwd(), scriptDir)}\\level*.tmx`);
  fs.watch(scriptDir, (eventType, fileName) => {
    if (fileName && levelFilePattern.test(fileName)) {
      scheduleWrite();
    }
  });
}
