'use strict';

const BACKGROUND_RENDER_ORDER = -1e4;
const SKY_CLOUD_POS = vec2(17, 14);
const SKY_CLOUD_SIZE = vec2(12, 4);
const SKY_CLOUD_PIXEL_SIZE = 0.17;
const SKY_CLOUD_PARALLAX = 0.18;

class Background extends EngineObject {
  constructor(theme) {
    super(vec2(), vec2(), undefined, 0, new Color, BACKGROUND_RENDER_ORDER);
    this.theme = theme;
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
    const size = SKY_CLOUD_SIZE.scale(worldScale);
    this.drawCloud(context, pos, size, SKY_CLOUD_PIXEL_SIZE * worldScale);
  }

  drawCloud(context, pos, size, pixelSize) {
    const minX = -size.x * 0.75;
    const maxX = size.x * 0.75;
    const minY = -size.y * 0.85;
    const maxY = size.y * 0.55;
    for (let y = minY; y <= maxY; y += pixelSize) {
      for (let x = minX; x <= maxX; x += pixelSize) {
        if (!this.isCloudPixel(x / size.x, y / size.y)) {
          continue;
        }
        context.fillStyle = y > size.y * 0.16 ? '#dff3ff' : '#fff';
        context.fillRect(pos.x + x, pos.y + y, pixelSize, pixelSize);
      }
    }
  }

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
