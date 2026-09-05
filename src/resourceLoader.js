'use strict';

function createAsepriteResource(data, textureIndex, frameNames) {
  const res = {};
  for (let i = 0; i < data.length; ++i) {
    const frameName = frameNames && frameNames[i] || i;
    res[frameName] = createAsepriteFrames(data[i], textureIndex);
  }
  return res;
}

function createAsepriteFrames(data, textureIndex) {
  const frames = [];
  for (let i = 0; i < data.length; ++i) {
    const frame = data[i];
    // Fix incorrect image cutting align value.
    const bleedFix = 0.5;
    frames[i] = {
      tileInfo: new TileInfo(
        vec2(frame[0] + bleedFix, frame[1] + bleedFix),
        vec2(frame[2] - bleedFix * 2, frame[3] - bleedFix * 2),
        textureInfos[textureIndex],
      ),
      size: vec2(frame[2] / TILE_SIZE, frame[3] / TILE_SIZE),
      offset: vec2(frame[4] / TILE_SIZE, frame[5] / TILE_SIZE),
    };
  }
  return frames;
}

function drawAsepriteFrame(frame, pos, scaleY, color, angle, mirror) {
  let offset = vec2(frame.offset.x * (mirror ? -1 : 1), frame.offset.y * scaleY);
  const size = vec2(frame.size.x, frame.size.y * scaleY);
  drawTile(pos.add(offset), size, frame.tileInfo, color, angle, mirror);
}

async function remapTilesetColor(textureIndex, toIdx) {
  const from_idx = THEME_INDEX_ROCK;
  if (from_idx == toIdx) {
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
