'use strict';

const CHANNEL_PATH = '../assets/channels/';
const OUTPUT = document.getElementById('output');
const REPLAY = document.getElementById('replay');
const LOOP = document.getElementById('loop');
const NOTE_NAMES = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const NOTE_OFFSETS = [0, 2, 4, 5, 7, 9, 11];
const ROOT_NOTE = 12;
const BPM = 80;
const ROOT_FREQUENCY = 261.625565;
const DEFAULT_DURATION = [0, 1, 0, 0];
const INSTRUMENT = [.28, .01, ROOT_FREQUENCY, .001, .03, .16, 1, 1.2, 0, 0, 0, 0, 0, 0, 0, 0, .02, .45, .03, 0, 0];

let currentMusic;

REPLAY.addEventListener('click', playToneOnce);
window.addEventListener('load', playToneOnce, { once: true });

async function playToneOnce() {
  try {
    const channels = await loadToneChannels();
    const music = buildMusic(channels);
    currentMusic?.stop();
    currentMusic = new ZzFXMusic(music);
    audioInit();
    currentMusic.playMusic(1, LOOP.checked);
    OUTPUT.textContent = formatChannels(channels);
  } catch (error) {
    OUTPUT.textContent = `Failed to play channel files\n${error.message}`;
  }
}

async function loadToneChannels() {
  const channels = [];
  for (let index = 1; ; ++index) {
    const response = await fetch(`${CHANNEL_PATH}${index}.txt`, { cache: 'no-store' });
    if (!response.ok) {
      if (index == 1)
        throw new Error(`Missing channel file: ${CHANNEL_PATH}1.txt`);
      break;
    }
    const text = await response.text();
    channels.push(parseToneText(text, index));
  }
  if (!channels.length)
    throw new Error('No channel files found');

  const length = channels[0].length;
  for (let i = 1; i < channels.length; ++i) {
    if (channels[i].length != length)
      throw new Error(`Channel length mismatch: channel 1 has ${length} beats, channel ${i + 1} has ${channels[i].length} beats`);
  }
  return channels;
}

function parseToneText(text, channelIndex) {
  const lines = trimTrailingBlankLines(text.split(/\r?\n/).filter(line => !line.trim().startsWith('#')));
  const selectedLines = selectPlayableLines(lines);
  const events = parseToneLines(selectedLines);
  if (events.length)
    return events;
  if (selectedLines != lines)
    return parseToneLines(lines);
  throw new Error(`Channel ${channelIndex} is empty`);
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
    events[beat] = parseToneLine(line, beat);
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
  const note = digit ? ROOT_NOTE + NOTE_OFFSETS[digit - 1] + (rightDots - leftDots) * 12 : 0;
  return { note, beat, beats, duration, name: NOTE_NAMES[digit - 1], text: line };
}

function parseDuration(text) {
  const duration = JSON.parse(text);
  if (!Array.isArray(duration) || duration.length != 4)
    throw new Error(`Duration must have 4 numbers: ${text}`);
  return duration.map(Number);
}

function buildMusic(channels) {
  const instruments = [];
  const pattern = [];

  for (const channelEvents of channels) {
    for (let beat = 0; beat < channelEvents.length; ++beat) {
      const event = channelEvents[beat];
      if (!event)
        continue;

      const durationBeats = Math.max(1, Math.ceil(event.beats));
      const channel = [instruments.length, 0];
      for (let i = 0; i < beat; ++i)
        channel.push(0);
      channel.push(event.note);
      for (let i = 1; i < durationBeats; ++i)
        channel.push(0);
      pattern.push(channel);
      instruments.push(makeInstrument(event.duration));
    }
  }

  if (!pattern.length)
    pattern.push([0, 0]);

  return [instruments.length ? instruments : [INSTRUMENT], [pattern], [0], BPM];
}

function makeInstrument(duration) {
  const beatLength = 60 / BPM;
  const instrument = [...INSTRUMENT];
  instrument[3] = duration[0] * beatLength;
  instrument[4] = duration[1] * beatLength;
  instrument[16] = duration[2] * beatLength;
  instrument[5] = duration[3] * beatLength;
  return instrument;
}

function stripComment(line) {
  return line.replace(/\/\/.*$/, '').replace(/#.*$/, '');
}

function formatChannels(channels) {
  return channels.map((channel, index) => `Channel ${index + 1}: ${channel.length} beats`).join('\n');
}
