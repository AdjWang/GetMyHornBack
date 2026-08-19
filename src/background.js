'use strict';
const BACKGROUND_LAYER_COUNT = 3;
const BACKGROUND_COLOR_THEME_DAY = 0;
const BACKGROUND_COLOR_THEME_NIGHT = 1;
const BACKGROUND_SKY_GRADIENT_COLORS = [
  ['#84d7ff', '#e7f8ff', '#fff0bd'],
  ['#06114b', '#101f67', '#263185'],
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
    if (sceneTheme == THEME_INDEX_ROCK) {
      this.colorTheme = BACKGROUND_COLOR_THEME_NIGHT;
    } else {
      this.colorTheme = BACKGROUND_COLOR_THEME_DAY;
    }
    if (this.colorTheme == BACKGROUND_COLOR_THEME_NIGHT) {
      // Static star field for night scenes.
      this.starEmitter = new ParticleEmitter(
        vec2(WORLD_WIDTH / 2, WORLD_HEIGHT / 2),   // position
        0,                                         // angle
        vec2(WORLD_WIDTH, WORLD_HEIGHT * 0.9),     // emitSize
        0,                                         // emitTime
        0,                                         // emitRate
        0,                                         // emitConeAngle
        undefined,                                 // tileInfo
        BACKGROUND_STAR_COLOR_A,                   // colorStartA
        BACKGROUND_STAR_COLOR_B,                   // colorStartB
        new Color(0, 0, 0, 0),                     // colorEndA
        new Color(0, 0, 0, 0),                     // colorEndB
        1e9,                                       // particleTime
        0.04,                                      // sizeStart
        0.04,                                      // sizeEnd
        0,                                         // speed
        0,                                         // angleSpeed
        1,                                         // damping
        1,                                         // angleDamping
        0,                                         // gravityScale
        PI,                                        // particleConeAngle
        0,                                         // fadeRate
        0.3,                                       // randomness
        false,                                     // collideTiles
        true,                                      // additive
        true,                                      // randomColorLinear
        RENDER_ORDER_BACKGROUND_STAR               // renderOrder
      );
      for (let i = 0; i < BACKGROUND_STAR_COUNT; ++i) {
        let star = this.starEmitter.emitParticle();
        if (star.pos.y < BACKGROUND_STAR_HEIGHT) {
          star.destroy();
        }
      }
      this.starEmitter.emitRate = 0;
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

  drawSky() {
    const context = mainContext;
    const gradient = context.createLinearGradient(0, 0, 0, mainCanvasSize.y);
    const colors = BACKGROUND_SKY_GRADIENT_COLORS[this.colorTheme];
    gradient.addColorStop(0, colors[0]);
    gradient.addColorStop(0.7, colors[1]);
    gradient.addColorStop(1, colors[2]);
    context.fillStyle = gradient;
    context.fillRect(0, 0, mainCanvasSize.x, mainCanvasSize.y);

    context.imageSmoothingEnabled = false;
    for (const cloud of this.clouds) {
      this.drawCloud(context, cloud);
    }
  }

  drawCloud(context, cloud) {
    // Adjust parallax, scroll speed, alpha and blur value according to layer depth.
    const layerDepth = cloud.layer / (BACKGROUND_LAYER_COUNT - 1);
    const layerParallax = SKY_CLOUD_PARALLAX * (0.45 + layerDepth * 0.75);
    const pos = worldToScreen(cloud.pos.add(cameraPos.subtract(vec2(WORLD_WIDTH / 2, WORLD_HEIGHT / 2)).scale(layerParallax)));
    const scale = SKY_CLOUD_PIXEL_SIZE * worldScale * cloud.scale;
    const width = cloud.image.canvas.width * scale;
    const height = cloud.image.canvas.height * scale;
    const loopWidth = mainCanvasSize.x + width;
    const scrollX = time * SKY_CLOUD_SCROLL_SPEED * worldScale * cloud.speed * (0.55 + layerDepth * 0.45);
    const x = backgroundWrap(pos.x + cloud.image.minX * worldScale * cloud.scale - scrollX, loopWidth) - width;
    context.save();
    context.globalAlpha = 0.65 + layerDepth * 0.35;
    context.filter = cloud.layer == 0 ? 'blur(2px)' : cloud.layer == 1 ? 'blur(1px)' : 'none';
    context.drawImage(
      cloud.image.canvas,
      x,
      pos.y + cloud.image.minY * worldScale * cloud.scale,
      width,
      height,
    );
    context.restore();
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
        const shade = Math.max(0, Math.min(1, (worldY / SKY_CLOUD_SIZE.y - shadowStartY) / shadowBlendRange));
        // Make light to dark transition soft.
        context.fillStyle = `rgb(${Math.round(cloudBaseColor[0] - shadowRedDelta * shade)},${Math.round(cloudBaseColor[1] - shadowGreenDelta * shade)},${cloudBaseColor[2]})`;
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
      const minX = SKY_CLOUD_RANDOM_POS_X
      const maxX = WORLD_WIDTH - SKY_CLOUD_RANDOM_POS_X
      const minY = SKY_CLOUD_RANDOM_POS_Y
      const maxY = WORLD_HEIGHT - SKY_CLOUD_RANDOM_POS_Y
      clouds.push({
        image: pool.splice(imageIndex, 1)[0],
        pos: vec2(this.randomRange(minX, maxX), this.randomRange(minY, maxY)),
        scale: this.randomRange(SKY_CLOUD_MIN_SCALE, SKY_CLOUD_MAX_SCALE),
        speed: this.randomRange(0.8, 1.2),
        layer: this.randomInt(0, BACKGROUND_LAYER_COUNT - 1),
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
      lobe[0] += this.randomRange(-SKY_CLOUD_LOBE_RANDOM_POS_X, SKY_CLOUD_LOBE_RANDOM_POS_X);
      lobe[1] += this.randomRange(-SKY_CLOUD_LOBE_RANDOM_POS_Y, SKY_CLOUD_LOBE_RANDOM_POS_Y);
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
