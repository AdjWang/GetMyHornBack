'use strict';

const ASEPRITE_ENTRY_TILEINFO = 0;
const ASEPRITE_ENTRY_SIZE = 1;
const ASEPRITE_ENTRY_OFFSET = 2;

function createAsepriteResource() {
  const textureInfo = textureInfos[TEXTURE_INDEX_UNICORN];
  return {
    slime_body: [
      undefined,
      undefined,
      undefined,
      [
        new TileInfo(vec2(1.5, 1.5), vec2(15, 15), textureInfo),
        vec2(1, 1),
        vec2(0.75, 1.125),
      ],
      [
        new TileInfo(vec2(1.5, 1.5), vec2(15, 15), textureInfo),
        vec2(1, 1),
        vec2(0.75, 1.125),
      ],
    ],
    slime_wing: [
      undefined,
      undefined,
      undefined,
      [
        new TileInfo(vec2(19.5, 1.5), vec2(30, 14), textureInfo),
        vec2(1.9375, 0.9375),
        vec2(1.03125, 1.34375),
      ],
      [
        new TileInfo(vec2(52.5, 1.5), vec2(31, 15), textureInfo),
        vec2(2, 1),
        vec2(1, 0.9375),
      ],
    ],
    unicorn_body: [
      [
        new TileInfo(vec2(86.5, 1.5), vec2(8, 7), textureInfo),
        vec2(0.5625, 0.5),
        vec2(-1.09375, 0.5),
      ],
      [
        new TileInfo(vec2(97.5, 1.5), vec2(5, 7), textureInfo),
        vec2(0.375, 0.5),
        vec2(-1.0625, 0.5),
      ],
      [
        new TileInfo(vec2(105.5, 1.5), vec2(8, 7), textureInfo),
        vec2(0.5625, 0.5),
        vec2(-1.09375, 0.5),
      ],
    ],
    unicorn_head: [
      [
        new TileInfo(vec2(116.5, 1.5), vec2(16, 14), textureInfo),
        vec2(1.0625, 0.9375),
        vec2(-1.15625, 0.96875),
      ],
      [
        new TileInfo(vec2(116.5, 1.5), vec2(16, 14), textureInfo),
        vec2(1.0625, 0.9375),
        vec2(-1.15625, 0.96875),
      ],
      [
        new TileInfo(vec2(116.5, 1.5), vec2(16, 14), textureInfo),
        vec2(1.0625, 0.9375),
        vec2(-1.15625, 0.96875),
      ],
    ],
    unicorn_horn: [
      [
        new TileInfo(vec2(135.5, 1.5), vec2(7, 8), textureInfo),
        vec2(0.5, 0.5625),
        vec2(-1.3125, 1.46875),
      ],
      [
        new TileInfo(vec2(135.5, 1.5), vec2(7, 8), textureInfo),
        vec2(0.5, 0.5625),
        vec2(-1.3125, 1.46875),
      ],
      [
        new TileInfo(vec2(135.5, 1.5), vec2(7, 8), textureInfo),
        vec2(0.5, 0.5625),
        vec2(-1.3125, 1.46875),
      ],
    ],
  };
}

function drawAsepriteFrame(frame, pos, scaleY, color, angle, mirror) {
  const frameTileInfo = frame[ASEPRITE_ENTRY_TILEINFO];
  const frameOffset = frame[ASEPRITE_ENTRY_OFFSET];
  const frameSize = frame[ASEPRITE_ENTRY_SIZE];
  let offset = vec2(frameOffset.x * (mirror ? -1 : 1), frameOffset.y * scaleY);
  const size = vec2(frameSize.x, frameSize.y * scaleY);
  drawTile(pos.add(offset), size, frameTileInfo, color, angle, mirror);
}

function remapImageDataColors(imageData, from_idx, toIdx) {
  if (from_idx == toIdx) {
    return imageData;
  }
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    for (const remap of TILE_COLOR_REMAP) {
      const fromColor = remap[from_idx];
      const toColor = remap[toIdx];
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
  return imageData;
}

async function createRemappedTextureInfo(textureIndex, toIdx, from_idx = THEME_INDEX_ROCK) {
  const imageSource = IMAGE_SOURCES[textureIndex];
  const image = await loadImage(imageSource);
  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;
  const context = canvas.getContext('2d');
  context.drawImage(image, 0, 0);
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  remapImageDataColors(imageData, from_idx, toIdx);
  context.putImageData(imageData, 0, 0);
  return new TextureInfo(canvas);
}

async function remapTilesetColor(textureIndex, toIdx) {
  textureInfos[textureIndex] = await createRemappedTextureInfo(textureIndex, toIdx);
}

function loadImage(source) {
  return new Promise(resolve => {
    const image = new Image;
    image.onload = () => resolve(image);
    image.src = source;
  });
}
