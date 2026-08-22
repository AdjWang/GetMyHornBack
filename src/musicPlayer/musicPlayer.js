'use strict';

const CHANNEL_PATH = '../assets/channels/';
const OUTPUT = document.getElementById('output');
const REPLAY = document.getElementById('replay');
const LOOP = document.getElementById('loop');
const NOTE_NAMES = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const NOTE_OFFSETS = [0, 2, 4, 5, 7, 9, 11];
const ROOT_NOTE = 12;
const BPM = 125;
const C_FREQUENCY = 261.625565;
const DEFAULT_DURATION = [0, 0.03, 0, 0];
const INSTRUMENTS = [
  [2, 0, 4000, , , 0.03, , 1.25, , , , , 0.02, 6.8, -0.3, , 0.5],
  [, 0, 655, , , 0.09, 3, 1.65, , , , , 0.02, 3.8, -0.1, , 0.2],
  [0.75, 0, 196, , 0.08, 0.18, 3],
  [, 0, 100, , 0.5, 0.3, 2, 0.2, , , 9, 0.02, , 0.1, 0.12, , 0.06],
  [, 0, 100, , 0.2, 0.05, 2, 0.2, , , 9, 0.02, , 0.1, 0.12, , 0.06],
];

let currentMusic;
let currentChannels;
let currentMusicData;
let musicReady = false;
let autoPlayPending = true;

REPLAY.addEventListener('click', playToneOnce);
window.addEventListener('pointerdown', playToneOnce, { once: true });
window.addEventListener('keydown', playToneOnce, { once: true });
window.addEventListener('load', () => loadToneMusic(true), { once: true });

async function playToneOnce() {
  autoPlayPending = true;
  return startPlayback();
}

async function startPlayback() {
  try {
    if (!musicReady) {
      OUTPUT.textContent = 'Loading channel files...';
      return;
    }
    audioInit();
    if (audioContext.state != 'running')
      await audioContext.resume();
    currentMusic?.stop();
    currentMusic = new ZzFXMusic(currentMusicData);
    currentMusic.playMusic(1, LOOP.checked);
    autoPlayPending = false;
    OUTPUT.textContent = formatChannels(currentChannels) + '\nPlaying...';
  } catch (error) {
    OUTPUT.textContent = `Failed to play channel files\n${error.message}`;
  }
}

async function loadToneMusic(autoStart = false) {
  if (musicReady) {
    return;
  }
  currentChannels = await loadToneChannels();
  currentMusicData = buildMusic(currentChannels);
  musicReady = true;
  OUTPUT.textContent = formatChannels(currentChannels) + '\nReady';
  if (autoStart && autoPlayPending)
    await startPlayback();
  return currentMusicData;
}

async function loadToneChannels() {
  const fileNames = await loadToneChannelFileNames();
  if (!fileNames.length)
    throw new Error(`No channel files found in ${CHANNEL_PATH}`);

  const channels = [];
  for (const fileName of fileNames) {
    const response = await fetch(`${CHANNEL_PATH}${fileName}`, { cache: 'no-store' });
    if (!response.ok)
      throw new Error(`Missing channel file: ${CHANNEL_PATH}${fileName}`);
    channels.push(parseToneText(await response.text(), fileName));
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

async function loadToneChannelFileNames() {
  const response = await fetch(CHANNEL_PATH, { cache: 'no-store' });
  if (!response.ok)
    return ['1.txt'];
  const html = await response.text();
  const fileNames = [...html.matchAll(/href="([^"]+\.txt)"/gi)]
    .map(match => decodeURIComponent(match[1].split('/').pop()))
    .filter(name => /^\d+\.txt$/.test(name))
    .sort((a, b) => Number(a) - Number(b));
  return fileNames.length ? fileNames : ['1.txt'];
}

function parseToneText(text, channelName) {
  const parsed = parseToneSections(text);
  const lines = parsed.track || parsed.lines;
  const selectedLines = parsed.track ? lines : selectPlayableLines(lines);
  const events = parseToneLines(selectedLines);
  events.meta = parsed.meta;
  if (events.length)
    return events;
  if (selectedLines != lines) {
    const fallbackEvents = parseToneLines(lines);
    fallbackEvents.meta = parsed.meta;
    return fallbackEvents;
  }
  throw new Error(`Channel ${channelName} is empty`);
}

function parseToneSections(text) {
  const sections = {};
  let sectionName = '';

  for (const rawLine of trimTrailingBlankLines(text.split(/\r?\n/))) {
    const line = stripComment(rawLine).trim();
    if (!line && rawLine.trim())
      continue;

    const sectionMatch = line.match(/^\[([a-z]+)\]$/i);
    if (sectionMatch) {
      sectionName = sectionMatch[1].toLowerCase();
      sections[sectionName] = sections[sectionName] || [];
      continue;
    }
    (sections[sectionName] = sections[sectionName] || []).push(rawLine);
  }

  return {
    meta: parseMetaLines(sections.meta || []),
    track: sections.track,
    lines: sections[''] || [],
  };
}

function parseMetaLines(lines) {
  const meta = {};
  for (const rawLine of lines) {
    const line = stripComment(rawLine).trim();
    if (!line)
      continue;

    const match = line.match(/^([a-z][a-z0-9_]*)\s*=\s*(.+)$/i);
    if (!match)
      throw new Error(`Invalid meta line: ${line}`);

    const value = match[2].trim();
    meta[match[1]] = /^-?\d+(?:\.\d+)?$/.test(value) ? Number(value) : value;
  }
  return meta;
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

  for (let channelIndex = 0; channelIndex < channels.length; ++channelIndex) {
    const channelEvents = channels[channelIndex];
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
      instruments.push(makeInstrument(event.duration, channelIndex, channelEvents.meta));
    }
  }

  if (!pattern.length)
    pattern.push([0, 0]);

  return [instruments.length ? instruments : [INSTRUMENTS[0]], [pattern], [0], BPM];
}

function makeInstrument(duration, channelIndex, meta) {
  const beatLength = 60 / BPM;
  const instrumentNumber = meta?.instrument || channelIndex + 1;
  if (instrumentNumber < 1 || instrumentNumber > INSTRUMENTS.length)
    throw new Error(`Instrument must be between 1 and ${INSTRUMENTS.length}: ${instrumentNumber}`);
  const instrumentIndex = instrumentNumber - 1;
  const instrument = [...INSTRUMENTS[instrumentIndex % INSTRUMENTS.length]];
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
