'use strict';

const SOURCE_FILE = '../assets/tone.txt';
const OUTPUT = document.getElementById('output');
const REPLAY = document.getElementById('replay');
const SCALE_OFFSETS = [0, 2, 4, 5, 7, 9, 11];
const STEPS_PER_BEAT = 4;
const BPM = 120;
const ROOT_FREQUENCY = 261.625565;
const DEFAULT_DURATION = [0, 1, 0, 0];
const INSTRUMENT = [.4, 0, ROOT_FREQUENCY, .02, .8, .18, 0, 1.5];

let currentMusic;

REPLAY.addEventListener('click', playToneOnce);
window.addEventListener('load', playToneOnce, { once: true });

async function playToneOnce() {
  try {
    const text = await fetch(SOURCE_FILE, { cache: 'no-store' }).then(response => response.text());
    const events = parseToneText(text);
    const music = buildMusic(events);
    currentMusic?.stop();
    currentMusic = new ZzFXMusic(music);
    audioInit();
    currentMusic.playMusic(1, false);
    OUTPUT.textContent = formatEvents(events);
  } catch (error) {
    OUTPUT.textContent = `Failed to play tone.txt\n${error.message}`;
  }
}

function parseToneText(text) {
  const lines = selectPlayableLines(text.split(/\r?\n/));
  const events = [];
  for (const rawLine of lines) {
    const line = stripComment(rawLine).trim();
    if (!line)
      continue;
    events.push(parseToneLine(line));
  }
  if (!events.length)
    throw new Error('tone.txt is empty');
  return events;
}

function selectPlayableLines(lines) {
  if (!lines.some(line => !stripComment(line).trim()))
    return lines;

  let started = false;
  const section = [];
  for (const rawLine of lines) {
    const line = stripComment(rawLine).trim();
    if (!line) {
      if (started)
        break;
      started = true;
      continue;
    }
    if (started)
      section.push(rawLine);
  }
  return section;
}

function parseToneLine(line) {
  const match = line.match(/^([.]*)\s*([0-7])\s*([.]*)\s*(?:,\s*(\[[^\]]*\]))?$/);
  if (!match)
    throw new Error(`Invalid tone line: ${line}`);

  const leftDots = match[1].length;
  const digit = Number(match[2]);
  const rightDots = match[3].length;
  const duration = match[4] ? parseDuration(match[4]) : DEFAULT_DURATION;
  const beats = duration.reduce((sum, value) => sum + value, 0);
  const steps = Math.max(1, Math.round(beats * STEPS_PER_BEAT));
  const note = digit ? 12 + SCALE_OFFSETS[digit - 1] + (rightDots - leftDots) * 12 : 0;
  return { note, steps, text: line };
}

function parseDuration(text) {
  const duration = JSON.parse(text);
  if (!Array.isArray(duration) || duration.length != 4)
    throw new Error(`Duration must have 4 numbers: ${text}`);
  return duration.map(Number);
}

function buildMusic(events) {
  const channel = [0, 0];
  for (const event of events) {
    channel.push(event.note);
    for (let i = 1; i < event.steps; ++i)
      channel.push(0);
  }
  return [[INSTRUMENT], [[channel]], [0], BPM];
}

function stripComment(line) {
  return line.replace(/\/\/.*$/, '').replace(/#.*$/, '');
}

function formatEvents(events) {
  return events.map(event => `${event.text} -> note ${event.note}, ${event.steps} steps`).join('\n');
}
