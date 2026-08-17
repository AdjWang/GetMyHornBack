'use strict';

const BACKGROUND_RENDER_ORDER = -1e4;
const BACKGROUND_LAYER_COUNT = 4;
const BACKGROUND_TEXTURE_WIDTH = WORLD_WIDTH * TILE_SIZE;
const BACKGROUND_TEXTURE_HEIGHT = WORLD_HEIGHT * TILE_SIZE;

class Background extends EngineObject {
  constructor(theme) {
    super(vec2(), vec2(), undefined, 0, new Color, BACKGROUND_RENDER_ORDER);
    this.theme = theme;
    this.layers = [];
    for (let i = 0; i < BACKGROUND_LAYER_COUNT; ++i) {
      this.layers.push(new ParallaxLayer(theme, i));
    }
  }

  render() {
    const context = mainContext;
    const gradient = context.createLinearGradient(0, 0, 0, mainCanvasSize.y);
    if (this.theme == THEME_INDEX_CLOUD) {
      gradient.addColorStop(0, '#86d8ff');
      gradient.addColorStop(.65, '#e8f7ff');
      gradient.addColorStop(1, '#fff3c4');
    } else if (this.theme == THEME_INDEX_GRASS) {
      gradient.addColorStop(0, '#244a5a');
      gradient.addColorStop(.58, '#2f7b47');
      gradient.addColorStop(1, '#16351e');
    } else {
      gradient.addColorStop(0, '#14161d');
      gradient.addColorStop(.55, '#242229');
      gradient.addColorStop(1, '#08090d');
    }
    context.fillStyle = gradient;
    context.fillRect(0, 0, mainCanvasSize.x, mainCanvasSize.y);

    for (const layer of this.layers) {
      layer.render(context);
    }
  }
}

class ParallaxLayer {
  constructor(theme, index) {
    this.index = index;
    this.speed = .08 + index * .12;
    this.alpha = .35 + index * .14;
    this.canvas = document.createElement('canvas');
    this.canvas.width = BACKGROUND_TEXTURE_WIDTH;
    this.canvas.height = BACKGROUND_TEXTURE_HEIGHT;
    this.context = this.canvas.getContext('2d');
    this.generate(theme);
  }

  render(context) {
    const scale = worldScale / TILE_SIZE;
    const width = this.canvas.width * scale;
    const height = this.canvas.height * scale;
    const offsetX = -backgroundWrap(cameraPos.x * TILE_SIZE * this.speed * scale, width);
    const offsetY = (cameraPos.y - WORLD_HEIGHT / 2) * TILE_SIZE * this.speed * scale;

    context.save();
    context.globalAlpha = this.alpha;
    for (let x = offsetX - width; x < mainCanvasSize.x + width; x += width) {
      context.drawImage(this.canvas, x, offsetY, width, height);
    }
    context.restore();
  }

  generate(theme) {
    if (theme == THEME_INDEX_CLOUD) {
      this.generateSky();
    } else if (theme == THEME_INDEX_GRASS) {
      this.generateJungle();
    } else {
      this.generateCave();
    }
  }

  generateCave() {
    const context = this.context;
    const h = this.canvas.height;
    const color = ['#101015', '#1b1a21', '#29252a', '#3a3032'][this.index];
    context.fillStyle = color;
    const baseY = h * (.38 + this.index * .1);
    context.beginPath();
    context.moveTo(0, h);
    for (let x = 0; x <= this.canvas.width; x += 24) {
      context.lineTo(x, baseY + backgroundNoise(x, this.index) * 42);
    }
    context.lineTo(this.canvas.width, h);
    context.fill();

    for (let x = -20; x < this.canvas.width + 20; x += 34 - this.index * 3) {
      const n = backgroundNoise(x + 41, this.index);
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x + 10 + n * 10, h * (.14 + n * .22));
      context.lineTo(x + 24 + n * 12, 0);
      context.fill();
    }
  }

  generateJungle() {
    const context = this.context;
    const h = this.canvas.height;
    const trunkColor = ['#153322', '#1e4d2c', '#2f6b38', '#4f873e'][this.index];
    const leafColor = ['#1f5b36', '#2f7d3e', '#52a847', '#82bd4b'][this.index];
    for (let x = -40; x < this.canvas.width + 40; x += 44 - this.index * 4) {
      const n = backgroundNoise(x, this.index);
      const top = h * (.18 + n * .22);
      context.strokeStyle = trunkColor;
      context.lineWidth = 5 + this.index * 2;
      context.beginPath();
      context.moveTo(x + n * 20, h);
      context.bezierCurveTo(x - 20, h * .7, x + 30, h * .45, x + n * 20, top);
      context.stroke();

      context.fillStyle = leafColor;
      for (let j = 0; j < 5; ++j) {
        const leafX = x + backgroundNoise(x + j * 13, this.index) * 42;
        const leafY = top + j * 18;
        context.beginPath();
        context.ellipse(leafX, leafY, 34 - j * 2, 12, n + j, 0, PI * 2);
        context.fill();
      }
    }
  }

  generateSky() {
    const context = this.context;
    const cloudColor = ['#ffffff', '#eef8ff', '#d9edff', '#c3e0ff'][this.index];
    context.fillStyle = cloudColor;
    for (let x = -80; x < this.canvas.width + 80; x += 110 - this.index * 12) {
      const n = backgroundNoise(x, this.index);
      const y = this.canvas.height * (.18 + .13 * this.index + n * .15);
      for (let j = 0; j < 5; ++j) {
        context.beginPath();
        context.ellipse(x + j * 25, y + backgroundNoise(x + j * 9, this.index) * 12, 28 - j, 13 + j, 0, 0, PI * 2);
        context.fill();
      }
    }
  }
}

function backgroundNoise(x, seed) {
  return backgroundWrap(Math.sin(x * 12.9898 + seed * 78.233) * 43758.5453, 1);
}

function backgroundWrap(value, size) {
  return (value % size + size) % size;
}
