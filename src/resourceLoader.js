'use strict';

function createAsepriteResource(data, textureIndex) {
  return {
    bag: createAsepriteFrames(data[0], textureIndex),
    body: createAsepriteFrames(data[1], textureIndex),
    head: createAsepriteFrames(data[2], textureIndex),
  };
}

function createAsepriteFrames(data, textureIndex) {
  const frames = [];
  for (let i = 0; i < data.length; ++i) {
    const frame = data[i];
    frames[i] = {
      tileInfo: new TileInfo(vec2(frame[0], frame[1]), vec2(frame[2], frame[3]), textureInfos[textureIndex]),
      size: vec2(frame[2] / TILE_SIZE, frame[3] / TILE_SIZE),
      offset: vec2(frame[4] / TILE_SIZE, frame[5] / TILE_SIZE),
    };
  }
  return frames;
}

function drawAsepriteFrame(frame, pos, scaleY, color, angle, mirror) {
  const offset = vec2(frame.offset.x * (mirror ? -1 : 1), frame.offset.y * scaleY);
  const size = vec2(frame.size.x, frame.size.y * scaleY);
  drawTile(pos.add(offset), size, frame.tileInfo, color, angle, mirror);
}

const TILE_COLOR_REMAP_INDEX_ROCK = 0;
const TILE_COLOR_REMAP_INDEX_GRASS = 1;
const TILE_COLOR_REMAP_INDEX_CLOUD = 2;

const TILE_COLOR_REMAP = [
  [0x322b28, 0x59c135, 0xb9bffb],
  [0x4a5462, 0x14a02e, 0xffffff],
  [0x333941, 0x1a7a3e, 0xffffff],
  [0x221c1a, 0x24523b, 0x249fde],
  [0x3b1725, 0x423934, 0xe3e6ff],
];

async function remapTilesetColor(textureIndex, to_idx) {
  const from_idx = TILE_COLOR_REMAP_INDEX_ROCK;
  if (to_idx == TILE_COLOR_REMAP_INDEX_ROCK) {
    return;
  }
  const imageSource = IMAGE_SOURCES[textureIndex];
  const image = await loadImage(imageSource);
  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;
  const context = canvas.getContext('2d');
  context.drawImage(image, 0, 0);
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    for (const remap of TILE_COLOR_REMAP) {
      const fromColor = remap[from_idx];
      const toColor = remap[to_idx];
      if (fromColor === undefined || toColor === undefined) {
        continue;
      }
      if ((data[i] << 16 | data[i + 1] << 8 | data[i + 2]) == fromColor) {
        data[i] = toColor >> 16 & 255;
        data[i + 1] = toColor >> 8 & 255;
        data[i + 2] = toColor & 255;
        break;
      }
    }
  }
  context.putImageData(imageData, 0, 0);
  textureInfos[textureIndex] = new TextureInfo(canvas);
}

function loadImage(source) {
  return new Promise(resolve => {
    const image = new Image;
    image.onload = () => resolve(image);
    image.src = source;
  });
}
