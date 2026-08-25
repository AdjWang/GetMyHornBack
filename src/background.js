'use strict';
const BACKGROUND_LAYER_COUNT = 3;
const BACKGROUND_COLOR_THEME_DAY = 0;
const BACKGROUND_COLOR_THEME_NIGHT = 1;
const BACKGROUND_SKY_GRADIENT_TEXTURE_WIDTH = 384;
const BACKGROUND_SKY_GRADIENT_TEXTURE_HEIGHT = 256;
const BACKGROUND_SKY_GRADIENT_PIXEL_BLOCK = 2;
const BACKGROUND_SKY_GRADIENT_BAND_COLORS = [
  ['#84d7ff', '#b3e8ff', '#e7f8ff', '#fff0bd'],
  ['#06114b', '#0b1859', '#101f67', '#263185'],
];
const BACKGROUND_CLOUD_BASE_COLORS = [
  [255, 255, 255],
  [74, 70, 169],
];
const BACKGROUND_CLOUD_SHADOW_DELTAS = [
  [32, 12],
  [18, 16],
];
const BACKGROUND_STAR_COUNT = 40;
// Only show stars above this height.
const BACKGROUND_STAR_HEIGHT = 12;
const BACKGROUND_STAR_COLOR_A = new Color(1, 1, 1, 0.9);
const BACKGROUND_STAR_COLOR_B = new Color(0.7, 0.8, 1, 0.7);
// Base size to generate.
const SKY_CLOUD_SIZE = vec2(12, 4);
// Make the image fit pixel style.
const SKY_CLOUD_PIXEL_SIZE = 0.07;
// How much the cloud follows the camera. Unused for now.
const SKY_CLOUD_PARALLAX = 0.18;
// Scroll along x axis.
const SKY_CLOUD_SCROLL_SPEED = 0.8;
// Randomize clouds.
const SKY_CLOUD_LOBE_RANDOM_POS_X = 0.08;
const SKY_CLOUD_LOBE_RANDOM_POS_Y = 0.2;
const SKY_CLOUD_RANDOM_POS_X = 4;
const SKY_CLOUD_RANDOM_POS_Y = 4.5;
const SKY_CLOUD_RANDOM_SIZE = 0.12;
// Generate clouds in advance, then randomly select some to blit in render loop.
// Clouds are randomly put to layers.
const SKY_CLOUD_POOL_COUNT = 20;
const SKY_CLOUD_MIN_COUNT = 1;
const SKY_CLOUD_MAX_COUNT = 5;
const SKY_CLOUD_MIN_SCALE = 0.2;
const SKY_CLOUD_MAX_SCALE = 1.2;

class Background extends EngineObject {
  constructor(sceneTheme) {
    super(vec2(), vec2(), undefined, 0, new Color, RENDER_ORDER_BACKGROUND);
    this.mass = 0;
    this.gravityScale = 0;
    if (sceneTheme == THEME_INDEX_ROCK) {
      this.colorTheme = BACKGROUND_COLOR_THEME_NIGHT;
    } else {
      this.colorTheme = BACKGROUND_COLOR_THEME_DAY;
    }
    this.createSkyTexture();
    if (this.colorTheme == BACKGROUND_COLOR_THEME_NIGHT) {
      this.stars = [];
      for (let i = 0; i < BACKGROUND_STAR_COUNT; ++i) {
        this.stars.push({
          pos: vec2(randomRange(0, VIEW_WIDTH), randomRange(BACKGROUND_STAR_HEIGHT, VIEW_HEIGHT)),
          size: randomRange(0.02, 0.05),
          color: Math.random() < 0.5 ? BACKGROUND_STAR_COLOR_A : BACKGROUND_STAR_COLOR_B,
        });
      }
    }
    this.cloudPool = [];
    for (let i = 0; i < SKY_CLOUD_POOL_COUNT; ++i) {
      this.cloudPool.push(this.createCloudImage());
    }
    this.clouds = this.selectClouds();
  }

  render() {
    this.drawSky();
  }

  updatePos(pos) {
    this.pos = pos.copy();
  }

  drawSky() {
    const viewMin = this.pos.subtract(vec2(VIEW_WIDTH / 2, VIEW_HEIGHT / 2));
    drawTile(this.pos, vec2(VIEW_WIDTH, VIEW_HEIGHT), this.skyTileInfo);
    if (this.stars) {
      for (const star of this.stars) {
        drawRect(viewMin.add(star.pos), vec2(star.size), star.color);
      }
    }
    for (const cloud of this.clouds) {
      this.drawCloud(cloud, viewMin);
    }
  }

  createSkyTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = BACKGROUND_SKY_GRADIENT_TEXTURE_WIDTH;
    canvas.height = BACKGROUND_SKY_GRADIENT_TEXTURE_HEIGHT;
    const context = canvas.getContext('2d');
    const colors = BACKGROUND_SKY_GRADIENT_BAND_COLORS[this.colorTheme];
    const block = BACKGROUND_SKY_GRADIENT_PIXEL_BLOCK;
    const bandHeight = canvas.height / colors.length;
    const waveAmplitude = Math.floor(bandHeight * 0.22);
    const waveCycles = 2;
    for (let x = 0; x < canvas.width; x += block) {
      const phase = x / canvas.width * Math.PI * 2 * waveCycles;
      let top = 0;
      for (let bandIndex = 0; bandIndex < colors.length; ++bandIndex) {
        const bottom = bandIndex == colors.length - 1 ? canvas.height :
          Math.round((bandIndex + 1) * bandHeight + Math.sin(phase + bandIndex * 1.7) * waveAmplitude);
        context.fillStyle = colors[bandIndex];
        context.fillRect(x, top, block, bottom - top);
        top = bottom;
      }
    }

    const textureInfo = new TextureInfo(canvas);
    this.skyTileInfo = new TileInfo(vec2(), vec2(canvas.width, canvas.height), textureInfo, 0);
  }

  drawCloud(cloud, viewMin) {
    // Adjust parallax, scroll speed, alpha and blur value according to layer depth.
    const layerDepth = cloud.layer / (BACKGROUND_LAYER_COUNT - 1);
    const layerParallax = SKY_CLOUD_PARALLAX * (0.45 + layerDepth * 0.75);
    const basePos = cloud.pos.add(this.pos.subtract(vec2(VIEW_WIDTH / 2, VIEW_HEIGHT / 2)).scale(layerParallax));
    const width = cloud.canvas.width * SKY_CLOUD_PIXEL_SIZE * cloud.scale;
    const height = cloud.canvas.height * SKY_CLOUD_PIXEL_SIZE * cloud.scale;
    const loopWidth = VIEW_WIDTH + width;
    const scrollX = time * SKY_CLOUD_SCROLL_SPEED * cloud.speed * (0.55 + layerDepth * 0.45);
    const x = backgroundWrap(basePos.x + cloud.minX * cloud.scale - scrollX, loopWidth) - width;
    const cloudPos = viewMin.add(vec2(x + width / 2, basePos.y + cloud.minY * cloud.scale + height / 2));
    const cloudColor = new Color(1, 1, 1, 0.65 + layerDepth * 0.35);
    drawTile(cloudPos, vec2(width, height), cloud.tileInfo, cloudColor);
  }

  createCloudImage() {
    const lobes = this.createCloudLobes();
    const minX = -SKY_CLOUD_SIZE.x * 0.9;
    const minY = -SKY_CLOUD_SIZE.y * 1.1;
    const maxX = SKY_CLOUD_SIZE.x * 0.9;
    const maxY = SKY_CLOUD_SIZE.y * 0.8;
    const width = Math.ceil((maxX - minX) / SKY_CLOUD_PIXEL_SIZE);
    const height = Math.ceil((maxY - minY) / SKY_CLOUD_PIXEL_SIZE);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    const cloudBaseColor = BACKGROUND_CLOUD_BASE_COLORS[this.colorTheme];
    const cloudShadowDelta = BACKGROUND_CLOUD_SHADOW_DELTAS[this.colorTheme];
    const shadowStartY = 0.16;
    const shadowBlendRange = 0.08;
    const shadowRedDelta = cloudShadowDelta[0];
    const shadowGreenDelta = cloudShadowDelta[1];
    for (let y = 0; y < height; ++y) {
      for (let x = 0; x < width; ++x) {
        const worldX = minX + x * SKY_CLOUD_PIXEL_SIZE;
        const worldY = minY + y * SKY_CLOUD_PIXEL_SIZE;
        if (!this.isCloudPixel(worldX / SKY_CLOUD_SIZE.x, worldY / SKY_CLOUD_SIZE.y, lobes)) {
          continue;
        }
        // Blend to the lower shadow across a small vertical range.
        const shade = clamp((worldY / SKY_CLOUD_SIZE.y - shadowStartY) / shadowBlendRange, 0, 1);
        // Make light to dark transition soft.
        context.fillStyle = `rgb(${Math.round(cloudBaseColor[0] - shadowRedDelta * shade)},${Math.round(cloudBaseColor[1] - shadowGreenDelta * shade)},${cloudBaseColor[2]})`;
        context.fillRect(x, y, 1, 1);
      }
    }
    const textureInfo = new TextureInfo(canvas);
    return { canvas, textureInfo, tileInfo: new TileInfo(vec2(), vec2(canvas.width, canvas.height), textureInfo, 0), minX, minY };
  }

  selectClouds() {
    const clouds = [];
    const count = randomInt(SKY_CLOUD_MIN_COUNT, SKY_CLOUD_MAX_COUNT);
    const pool = this.cloudPool.slice();
    for (let i = 0; i < count; ++i) {
      const imageIndex = randomInt(0, pool.length - 1);
      const minX = SKY_CLOUD_RANDOM_POS_X
      const maxX = VIEW_WIDTH - SKY_CLOUD_RANDOM_POS_X
      const minY = SKY_CLOUD_RANDOM_POS_Y
      const maxY = VIEW_HEIGHT - SKY_CLOUD_RANDOM_POS_Y
      clouds.push({
        ...pool.splice(imageIndex, 1)[0],
        pos: vec2(randomRange(minX, maxX), randomRange(minY, maxY)),
        scale: randomRange(SKY_CLOUD_MIN_SCALE, SKY_CLOUD_MAX_SCALE),
        speed: randomRange(0.8, 1.2),
        layer: randomInt(0, BACKGROUND_LAYER_COUNT - 1),
      });
    }
    return clouds;
  }

  // Check if inside draw area.
  isCloudPixel(x, y, cloudData) {
    const lobes = cloudData[0];
    const baseMinX = cloudData[1];
    const baseMaxX = cloudData[2];
    for (const lobe of lobes) {
      if (this.inCloudLobe(x, y, lobe[0], lobe[1], lobe[2], lobe[3])) {
        return true;
      }
    }
    return y > 0.16 && y < 0.32 && x > baseMinX && x < baseMaxX;
  }

  createCloudLobes() {
    const lobes = [
      [-0.32, 0.1, 0.38, 0.45],
      [-0.12, -0.18, 0.42, 0.62],
      [0.16, -0.08, 0.48, 0.52],
      [0.38, 0.12, 0.36, 0.4],
    ];
    const baseMinX = -0.42 + randomRange(-0.05, 0.03);
    const baseMaxX = 0.44 + randomRange(-0.03, 0.05);
    for (const lobe of lobes) {
      lobe[0] += randomRange(-SKY_CLOUD_LOBE_RANDOM_POS_X, SKY_CLOUD_LOBE_RANDOM_POS_X);
      lobe[1] += randomRange(-SKY_CLOUD_LOBE_RANDOM_POS_Y, SKY_CLOUD_LOBE_RANDOM_POS_Y);
      lobe[2] *= 1 + randomRange(-SKY_CLOUD_RANDOM_SIZE, SKY_CLOUD_RANDOM_SIZE);
      lobe[3] *= 1 + randomRange(-SKY_CLOUD_RANDOM_SIZE, SKY_CLOUD_RANDOM_SIZE);
    }
    // Return randomized lobes and the flat base horizontal range.
    return [lobes, baseMinX, baseMaxX];
  }

  inCloudLobe(x, y, cx, cy, rx, ry) {
    const dx = (x - cx) / rx;
    const dy = (y - cy) / ry;
    return dx * dx + dy * dy < 1;
  }
}

function backgroundWrap(value, size) {
  return (value % size + size) % size;
}
