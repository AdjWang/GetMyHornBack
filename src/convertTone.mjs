import { readFile, writeFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const INPUT_FILE = path.join(ROOT, 'assets', 'tone.txt');
const OUTPUT_FILE = path.join(ROOT, 'assets', 'music.js');

const DEFAULT_BPM = 60;
const DEFAULT_INSTRUMENT = [0.4, 0, 261.625565, 0.02, 0.8, 0.18, 0, 1.5];
const SCALE_OFFSETS = [0, 2, 4, 5, 7, 9, 11];
const STEPS_PER_BEAT = 4;

const toneText = await readFile(INPUT_FILE, 'utf8');
const channels = parseToneText(toneText);
const song = [
  [DEFAULT_INSTRUMENT],
  [channels.map(channel => [0, 0, ...channel])],
  [0],
  DEFAULT_BPM,
];

const output = [
  '\'use strict\';',
  '',
  `const MUSIC_BACKGROUND = ${formatValue(song)};`,
  'const BACKGROUND_MUSIC = MUSIC_BACKGROUND;',
  '',
].join('\n');

await writeFile(OUTPUT_FILE, output);
console.log(`Wrote ${path.relative(ROOT, OUTPUT_FILE)}`);

function parseToneText(text) {
  const blocks = [];
  let current = [];
  for (const rawLine of text.split(/\r?\n/)) {
    const line = stripComment(rawLine).trim();
    if (!line) {
      if (current.length) {
        blocks.push(current);
        current = [];
      }
      continue;
    }
    current.push(parseToneEvent(line));
  }
  if (current.length) {
    blocks.push(current);
  }
  if (!blocks.length) {
    throw new Error('tone.txt is empty');
  }
  return blocks;
}

function parseToneEvent(line) {
  const match = line.match(/^([.]*)?([0-7])([.]*)?(?:\s*,\s*(\[[^\]]*\]))?$/);
  if (!match) {
    throw new Error(`Invalid tone line: ${line}`);
  }

  const leftDots = match[1] || '';
  const digit = Number(match[2]);
  const rightDots = match[3] || '';
  const duration = match[4] ? parseDuration(match[4]) : [0, 1, 0, 0];
  const beats = duration.reduce((sum, value) => sum + value, 0);
  const steps = Math.max(1, Math.round(beats * STEPS_PER_BEAT));
  const note = digit == 0 ? 0 :
    12 + SCALE_OFFSETS[digit - 1] + (rightDots.length - leftDots.length) * 12;

  return expandEvent(note, steps);
}

function parseDuration(text) {
  const duration = JSON.parse(text);
  if (!Array.isArray(duration) || duration.length != 4) {
    throw new Error(`Duration must have 4 numbers: ${text}`);
  }
  return duration.map(Number);
}

function expandEvent(note, steps) {
  const channel = [];
  channel.push(note);
  for (let i = 1; i < steps; ++i) {
    channel.push(0);
  }
  return channel;
}

function stripComment(line) {
  return line.replace(/\/\/.*$/, '').replace(/#.*$/, '');
}

function formatValue(value, indent = 0) {
  if (Array.isArray(value)) {
    if (!value.length) {
      return '[]';
    }
    const nextIndent = '  '.repeat(indent + 1);
    return '[\n' + value.map(item => nextIndent + formatValue(item, indent + 1)).join(',\n') +
      '\n' + '  '.repeat(indent) + ']';
  }
  if (typeof value == 'number') {
    return formatNumber(value);
  }
  if (typeof value == 'string') {
    return JSON.stringify(value);
  }
  if (value && typeof value == 'object') {
    const entries = Object.entries(value);
    const nextIndent = '  '.repeat(indent + 1);
    return '{\n' + entries.map(([key, item]) => `${nextIndent}${key}: ${formatValue(item, indent + 1)}`).join(',\n') +
      '\n' + '  '.repeat(indent) + '}';
  }
  return String(value);
}

function formatNumber(value) {
  if (!Number.isFinite(value)) {
    return String(value);
  }
  const rounded = Math.abs(value) < 1e-12 ? 0 : value;
  const text = Number.isInteger(rounded) ? String(rounded) : String(Number(rounded.toFixed(6)));
  return text;
}
