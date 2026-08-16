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
