'use strict';

const BACKGROUND_RENDER_ORDER = -1e4;
// Base size to generate.
const SKY_CLOUD_SIZE = vec2(12, 4);
// Make the image fit pixel style.
const SKY_CLOUD_PIXEL_SIZE = 0.07;
// How much the cloud follows the camera. Unused for now.
const SKY_CLOUD_PARALLAX = 0.18;
// Scroll along x axis.
const SKY_CLOUD_SCROLL_SPEED = 0.8;
// Randomize clouds.
const SKY_CLOUD_RANDOM_POS_X = 0.08;
const SKY_CLOUD_RANDOM_POS_Y = 0.2;
const SKY_CLOUD_RANDOM_SIZE = 0.12;
// Generate clouds in advance, then randomly select some to blit in render loop.
const SKY_CLOUD_POOL_COUNT = 10;
const SKY_CLOUD_MIN_COUNT = 1;
const SKY_CLOUD_MAX_COUNT = 5;
const SKY_CLOUD_MIN_SCALE = 0.2;
const SKY_CLOUD_MAX_SCALE = 1.2;

class Background extends EngineObject {
  constructor(theme) {
    super(vec2(), vec2(), undefined, 0, new Color, BACKGROUND_RENDER_ORDER);
    this.theme = theme;
    this.cloudPool = [];
    for (let i = 0; i < SKY_CLOUD_POOL_COUNT; ++i) {
      this.cloudPool.push(this.createCloudImage());
    }
    this.clouds = this.selectClouds();
  }

  render() {
    this.drawSky();
  }

  drawSky() {
    const context = mainContext;
    const gradient = context.createLinearGradient(0, 0, 0, mainCanvasSize.y);
    gradient.addColorStop(0, '#84d7ff');
    gradient.addColorStop(0.7, '#e7f8ff');
    gradient.addColorStop(1, '#fff0bd');
    context.fillStyle = gradient;
    context.fillRect(0, 0, mainCanvasSize.x, mainCanvasSize.y);

    context.imageSmoothingEnabled = false;
    for (const cloud of this.clouds) {
      this.drawCloud(context, cloud);
    }
  }

  drawCloud(context, cloud) {
    const pos = worldToScreen(cloud.pos.add(cameraPos.subtract(vec2(WORLD_WIDTH / 2, WORLD_HEIGHT / 2)).scale(SKY_CLOUD_PARALLAX)));
    const scale = SKY_CLOUD_PIXEL_SIZE * worldScale * cloud.scale;
    const width = cloud.image.canvas.width * scale;
    const height = cloud.image.canvas.height * scale;
    const loopWidth = mainCanvasSize.x + width;
    const scrollX = time * SKY_CLOUD_SCROLL_SPEED * worldScale * cloud.speed;
    const x = backgroundWrap(pos.x + cloud.image.minX * worldScale * cloud.scale - scrollX, loopWidth) - width;
    context.drawImage(
      cloud.image.canvas,
      x,
      pos.y + cloud.image.minY * worldScale * cloud.scale,
      width,
      height,
    );
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
    for (let y = 0; y < height; ++y) {
      for (let x = 0; x < width; ++x) {
        const worldX = minX + x * SKY_CLOUD_PIXEL_SIZE;
        const worldY = minY + y * SKY_CLOUD_PIXEL_SIZE;
        if (!this.isCloudPixel(worldX / SKY_CLOUD_SIZE.x, worldY / SKY_CLOUD_SIZE.y, lobes)) {
          continue;
        }
        // Make below half darker.
        context.fillStyle = worldY > SKY_CLOUD_SIZE.y * 0.16 ? '#dff3ff' : '#fff';
        context.fillRect(x, y, 1, 1);
      }
    }
    return { canvas, minX, minY };
  }

  selectClouds() {
    const clouds = [];
    const count = this.randomInt(SKY_CLOUD_MIN_COUNT, SKY_CLOUD_MAX_COUNT);
    const pool = this.cloudPool.slice();
    for (let i = 0; i < count; ++i) {
      const imageIndex = this.randomInt(0, pool.length - 1);
      clouds.push({
        image: pool.splice(imageIndex, 1)[0],
        pos: vec2(this.randomRange(4, WORLD_WIDTH - 4), this.randomRange(3, WORLD_HEIGHT - 3)),
        scale: this.randomRange(SKY_CLOUD_MIN_SCALE, SKY_CLOUD_MAX_SCALE),
        speed: this.randomRange(0.8, 1.2),
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
    const baseMinX = -0.42 + this.randomRange(-0.05, 0.03);
    const baseMaxX = 0.44 + this.randomRange(-0.03, 0.05);
    for (const lobe of lobes) {
      lobe[0] += this.randomRange(-SKY_CLOUD_RANDOM_POS_X, SKY_CLOUD_RANDOM_POS_X);
      lobe[1] += this.randomRange(-SKY_CLOUD_RANDOM_POS_Y, SKY_CLOUD_RANDOM_POS_Y);
      lobe[2] *= 1 + this.randomRange(-SKY_CLOUD_RANDOM_SIZE, SKY_CLOUD_RANDOM_SIZE);
      lobe[3] *= 1 + this.randomRange(-SKY_CLOUD_RANDOM_SIZE, SKY_CLOUD_RANDOM_SIZE);
    }
    // Return randomized lobes and the flat base horizontal range.
    return [lobes, baseMinX, baseMaxX];
  }

  randomRange(min, max) {
    return min + Math.random() * (max - min);
  }

  randomInt(min, max) {
    return min + Math.floor(Math.random() * (max - min + 1));
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
