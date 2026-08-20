'use strict';

const SOURCE_FILE = '../assets/tone.txt';
const OUTPUT = document.getElementById('output');
const REPLAY = document.getElementById('replay');
const LOOP = document.getElementById('loop');
const SCALE_OFFSETS = [0, 2, 4, 5, 7, 9, 11];
const BPM = 80;
const ROOT_FREQUENCY = 261.625565;
const DEFAULT_DURATION = [0, 1, 0, 0];
const INSTRUMENT = [.28, .01, ROOT_FREQUENCY, .001, .03, .16, 1, 1.2, 0, 0, 0, 0, 0, 0, 0, 0, .02, .45, .03, 0, 0];

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
    currentMusic.playMusic(1, LOOP.checked);
    OUTPUT.textContent = formatEvents(events);
  } catch (error) {
    OUTPUT.textContent = `Failed to play tone.txt\n${error.message}`;
  }
}

function parseToneText(text) {
  const lines = trimTrailingBlankLines(text.split(/\r?\n/));
  const selectedLines = selectPlayableLines(lines);
  const events = parseToneLines(selectedLines);
  if (events.length)
    return events;
  if (selectedLines != lines)
    return parseToneLines(lines);
  throw new Error('tone.txt is empty');
}

function selectPlayableLines(lines) {
  const blankIndex = lines.findIndex(line => !line.trim());
  if (blankIndex < 0)
    return lines;

  let endIndex = lines.length;
  for (let i = blankIndex + 1; i < lines.length; ++i) {
    if (!lines[i].trim()) {
      endIndex = i;
      break;
    }
  }
  return lines.slice(blankIndex + 1, endIndex);
}

function trimTrailingBlankLines(lines) {
  let end = lines.length;
  while (end > 0 && !lines[end - 1].trim())
    --end;
  return lines.slice(0, end);
}

function parseToneLines(lines) {
  const events = [];
  for (let beat = 0; beat < lines.length; ++beat) {
    const rawLine = lines[beat];
    const line = stripComment(rawLine).trim();
    if (!line)
      continue;
    events.push(parseToneLine(line, beat));
  }
  return events;
}

function parseToneLine(line, beat) {
  const match = line.match(/^([.]*)\s*([0-7])\s*([.]*)\s*(?:,\s*(\[[^\]]*\]))?$/);
  if (!match)
    throw new Error(`Invalid tone line: ${line}`);

  const leftDots = match[1].length;
  const digit = Number(match[2]);
  const rightDots = match[3].length;
  const duration = match[4] ? parseDuration(match[4]) : DEFAULT_DURATION;
  const beats = duration.reduce((sum, value) => sum + value, 0);
  const note = digit ? 12 + SCALE_OFFSETS[digit - 1] + (rightDots - leftDots) * 12 : 0;
  return { note, beat, beats, duration, text: line };
}

function parseDuration(text) {
  const duration = JSON.parse(text);
  if (!Array.isArray(duration) || duration.length != 4)
    throw new Error(`Duration must have 4 numbers: ${text}`);
  return duration.map(Number);
}

function buildMusic(events) {
  const instruments = [];
  const channels = [];
  let totalBeats = 0;

  for (const event of events) {
    const durationBeats = Math.max(.25, event.beats);
    const endBeat = event.beat + durationBeats;
    totalBeats = Math.max(totalBeats, Math.ceil(endBeat));
  }

  for (const event of events) {
    const instrumentIndex = instruments.push(makeInstrument(event.duration)) - 1;
    const channel = [instrumentIndex, 0];
    for (let beat = 0; beat < totalBeats; ++beat)
      channel.push(beat == event.beat ? event.note : 0);
    channels.push(channel);
  }

  if (!channels.length)
    channels.push([0, 0]);

  return [instruments.length ? instruments : [INSTRUMENT], [channels], [0], BPM];
}

function makeInstrument(durationBeats) {
  const beatLength = 60 / BPM;
  const instrument = [...INSTRUMENT];
  instrument[3] = durationBeats[0] * beatLength;
  instrument[4] = durationBeats[1] * beatLength;
  instrument[16] = durationBeats[2] * beatLength;
  instrument[5] = durationBeats[3] * beatLength;
  return instrument;
}

function stripComment(line) {
  return line.replace(/\/\/.*$/, '').replace(/#.*$/, '');
}

function formatEvents(events) {
  return events.map(event => `${event.text} -> beat ${event.beat}, note ${event.note}, duration ${event.beats}`).join('\n');
}
