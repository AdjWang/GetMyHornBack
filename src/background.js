'use strict';

const BACKGROUND_RENDER_ORDER = 1e4;
const SKY_CLOUD_POS = vec2(17, 14);
const SKY_CLOUD_SIZE = vec2(12, 4);
const SKY_CLOUD_PIXEL_SIZE = 0.07;
const SKY_CLOUD_PARALLAX = 0.18;
const SKY_CLOUD_SCROLL_SPEED = 0.4;

class Background extends EngineObject {
  constructor(theme) {
    super(vec2(), vec2(), undefined, 0, new Color, BACKGROUND_RENDER_ORDER);
    this.theme = theme;
    this.cloudCanvas = this.createCloudCanvas();
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

    const pos = worldToScreen(SKY_CLOUD_POS.add(cameraPos.subtract(vec2(WORLD_WIDTH / 2, WORLD_HEIGHT / 2)).scale(SKY_CLOUD_PARALLAX)));
    const scale = SKY_CLOUD_PIXEL_SIZE * worldScale;
    const width = this.cloudCanvas.width * scale;
    const loopWidth = mainCanvasSize.x + width;
    const scrollX = time * SKY_CLOUD_SCROLL_SPEED * worldScale;
    const x = backgroundWrap(pos.x + this.cloudMinX * worldScale - scrollX, loopWidth) - width;
    context.imageSmoothingEnabled = false;
    context.drawImage(
      this.cloudCanvas,
      x,
      pos.y + this.cloudMinY * worldScale,
      width,
      this.cloudCanvas.height * scale,
    );
  }

  createCloudCanvas() {
    this.cloudMinX = -SKY_CLOUD_SIZE.x * 0.75;
    this.cloudMinY = -SKY_CLOUD_SIZE.y * 0.85;
    const maxX = SKY_CLOUD_SIZE.x * 0.75;
    const maxY = SKY_CLOUD_SIZE.y * 0.55;
    const width = Math.ceil((maxX - this.cloudMinX) / SKY_CLOUD_PIXEL_SIZE);
    const height = Math.ceil((maxY - this.cloudMinY) / SKY_CLOUD_PIXEL_SIZE);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    for (let y = 0; y < height; ++y) {
      for (let x = 0; x < width; ++x) {
        const worldX = this.cloudMinX + x * SKY_CLOUD_PIXEL_SIZE;
        const worldY = this.cloudMinY + y * SKY_CLOUD_PIXEL_SIZE;
        if (!this.isCloudPixel(worldX / SKY_CLOUD_SIZE.x, worldY / SKY_CLOUD_SIZE.y)) {
          continue;
        }
        // Make below half darker.
        context.fillStyle = worldY > SKY_CLOUD_SIZE.y * 0.16 ? '#dff3ff' : '#fff';
        context.fillRect(x, y, 1, 1);
      }
    }
    return canvas;
  }

  // Check if inside draw area.
  isCloudPixel(x, y) {
    return this.inCloudLobe(x, y, -0.32, 0.1, 0.38, 0.45)
      || this.inCloudLobe(x, y, -0.12, -0.18, 0.42, 0.62)
      || this.inCloudLobe(x, y, 0.16, -0.08, 0.48, 0.52)
      || this.inCloudLobe(x, y, 0.38, 0.12, 0.36, 0.4)
      || y > 0.16 && y < 0.32 && x > -0.42 && x < 0.44;
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
