import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ASEPRITE_APP = 'https://www.aseprite.org/';

const inputFile = process.argv[2];
if (inputFile) {
  convertJson(path.resolve(process.cwd(), inputFile), process.argv[3]);
}
else {
  scanAssets(path.join(__dirname, 'assets'));
}

function scanAssets(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanAssets(fullPath);
    }
    else if (entry.isFile() && path.extname(entry.name) == '.json' && isAsepriteJson(fullPath)) {
      convertJson(fullPath);
    }
  }
}

function isAsepriteJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8')).meta?.app == ASEPRITE_APP;
  }
  catch {
    return false;
  }
}

function convertJson(input, output) {
  const data = JSON.parse(fs.readFileSync(input, 'utf8'));
  if (data.meta?.app != ASEPRITE_APP) {
    return;
  }

  const partNames = data.meta.layers.map(layer => layer.name);
  const framesByPart = partNames.map(() => []);

  for (const name in data.frames) {
    const match = /\(([^)]+)\)\s*(\d+)/.exec(name);
    if (!match) {
      continue;
    }

    const partIndex = partNames.indexOf(match[1]);
    if (partIndex < 0) {
      continue;
    }

    const frameIndex = match[2] | 0;
    const frameData = data.frames[name];
    const frame = frameData.frame;
    const source = frameData.sourceSize;
    const sprite = frameData.spriteSourceSize;
    const offsetX = sprite.x + frame.w / 2 - source.w / 2;
    const offsetY = source.h / 2 - sprite.y - frame.h / 2;
    framesByPart[partIndex][frameIndex] = [frame.x, frame.y, frame.w, frame.h, offsetX, offsetY];
  }

  const parsed = path.parse(input);
  const outputFile = output ? path.resolve(process.cwd(), output) :
    path.join(parsed.dir, parsed.name + 'Resource.js');
  const variableName = safeIdentifier(parsed.name) + 'AsepriteData';
  fs.writeFileSync(outputFile,
    `'use strict';\nconst ${variableName}=${JSON.stringify(framesByPart)};\n`);
  console.log(`Built ${path.relative(process.cwd(), outputFile)}`);
}

function safeIdentifier(name) {
  return name.replace(/[^a-zA-Z0-9_$]/g, '_').replace(/^[^a-zA-Z_$]/, '_');
}
