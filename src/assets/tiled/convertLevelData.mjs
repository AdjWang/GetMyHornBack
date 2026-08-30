import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const levelJsPath = path.resolve(scriptDir, '../../level.js');
const levelFilePattern = /^level(\d+)\.tmx$/;
const watchMode = process.argv.includes('--watch');

const OBJECT_SPECS = {
  DashSlime: ['patrolSight', 'dashSight'],
};

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
  return {
    ...level,
    ...parseLevelTiles(text, level.fileName),
    objects: parseLevelObjects(text, level),
  };
}

function parseLevelTiles(text, fileName) {
  const mapMatch = text.match(/<map\b([^>]*)>/);
  const dataMatch = text.match(/<data\b([^>]*)>([\s\S]*?)<\/data>/);
  if (!mapMatch || !dataMatch) {
    throw new Error(`${fileName}: missing map or data section`);
  }
  if (!/\bencoding="csv"/.test(dataMatch[1])) {
    throw new Error(`${fileName}: only csv encoded data is supported`);
  }

  const width = readXmlNumber(mapMatch[1], 'width', fileName);
  const height = readXmlNumber(mapMatch[1], 'height', fileName);
  const data = dataMatch[2].split(',')
    .map(value => value.trim())
    .filter(Boolean)
    .map(Number);
  if (data.some(value => !Number.isFinite(value))) {
    throw new Error(`${fileName}: data has non-number tile ids`);
  }
  if (data.length != width * height) {
    throw new Error(`${fileName}: expected ${width * height} tiles, got ${data.length}`);
  }
  return { width, height, data };
}

function parseLevelObjects(text, level) {
  try {
    return parseLevelObjectsStrict(text, level);
  } catch (error) {
    console.error(error.message);
    return [];
  }
}

function parseLevelObjectsStrict(text, level) {
  const objects = [];
  const objectGroupRegex = /<objectgroup\b[^>]*>([\s\S]*?)<\/objectgroup>/g;
  for (const groupMatch of text.matchAll(objectGroupRegex)) {
    const groupText = groupMatch[1];
    const objectRegex = /<object\b([^>]*?)(?:\/>|>([\s\S]*?)<\/object>)/g;
    for (const objectMatch of groupText.matchAll(objectRegex)) {
      objects.push(parseObject(objectMatch[1], objectMatch[2] || '', level.fileName));
    }
  }
  return objects;
}

function parseObject(attributes, body, fileName) {
  const type = readXmlString(attributes, 'type', fileName);
  const spec = OBJECT_SPECS[type];
  if (!spec) {
    throw new Error(`${fileName}: unsupported object type ${type}`);
  }
  const x = readXmlNumber(attributes, 'x', fileName);
  const y = readXmlNumber(attributes, 'y', fileName);
  const properties = parseObjectProperties(body, fileName);
  const unexpected = Object.keys(properties).filter(name => !spec.includes(name));
  if (unexpected.length) {
    throw new Error(`${fileName}: ${type} has unexpected properties ${unexpected.join(', ')}`);
  }
  const missing = spec.filter(name => !(name in properties));
  if (missing.length) {
    throw new Error(`${fileName}: ${type} missing properties ${missing.join(', ')}`);
  }
  return { type, x, y, properties };
}

function parseObjectProperties(body, fileName) {
  const properties = {};
  const propertyRegex = /<property\b([^>]*)\/>/g;
  for (const match of body.matchAll(propertyRegex)) {
    const attributes = match[1];
    const name = readXmlString(attributes, 'name', fileName);
    const type = readXmlString(attributes, 'type', fileName);
    const value = readXmlString(attributes, 'value', fileName);
    properties[name] = parseXmlValue(value, type, fileName, name);
  }
  return properties;
}

function readXmlNumber(attributes, name, fileName) {
  const match = attributes.match(new RegExp(`\\b${name}="([-+]?\\d+(?:\\.\\d+)?)"`));
  if (!match) {
    throw new Error(`${fileName}: missing ${name}`);
  }
  return Number(match[1]);
}

function readXmlString(attributes, name, fileName) {
  const match = attributes.match(new RegExp(`\\b${name}="([^"]*)"`));
  if (!match) {
    throw new Error(`${fileName}: missing ${name}`);
  }
  return match[1];
}

function parseXmlValue(value, type, fileName, name) {
  if (type == 'int' || type == 'float') {
    const number = Number(value);
    if (!Number.isFinite(number)) {
      throw new Error(`${fileName}: invalid value for ${name}`);
    }
    return number;
  }
  if (type == 'bool') {
    return value == 'true';
  }
  return value;
}

function writeTileLevel(level) {
  const rows = [];
  for (let y = 0; y < level.height; ++y) {
    const row = level.data.slice(y * level.width, (y + 1) * level.width);
    rows.push(`  ${row.join(', ')}`);
  }
  return `const LEVEL${level.idx} = [\n${rows.join(',\n')}\n];`;
}

function writeLevelObjects(levels) {
  return `const LEVELS_OBJS = [\n${levels.map(formatLevelObjectList).join(',\n')},\n];`;
}

function formatLevelObjectList(level) {
  if (!level.objects.length) {
    return '  []';
  }
  const rows = level.objects.map(formatObjectEntry);
  return `  [\n${rows.join(',\n')}\n  ]`;
}

function formatObjectEntry(object) {
  const spec = OBJECT_SPECS[object.type];
  const args = [
    `screenToWorld(vec2(${object.x}, ${object.y}))`,
    ...spec.map(name => formatLiteral(object.properties[name])),
  ];
  return `    [ ${object.type}, ${args.join(', ')} ]`;
}

function formatLiteral(value) {
  if (typeof value == 'number') {
    return `${value}`;
  }
  if (typeof value == 'boolean') {
    return value ? 'true' : 'false';
  }
  return JSON.stringify(value);
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
    text = replaceConstBlock(text, `LEVEL${level.idx}`, writeTileLevel(level));
  }
  text = replaceConstBlock(text, 'LEVELS', `const LEVELS = [\n${levels.map(level => `  LEVEL${level.idx}`).join(',\n')},\n];`);
  text = replaceConstBlock(text, 'LEVELS_SIZE', `const LEVELS_SIZE = [\n${levels.map(level => `  vec2(${level.width}, ${level.height})`).join(',\n')},\n];`);
  text = replaceConstBlock(text, 'LEVELS_OBJS', writeLevelObjects(levels));
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
