'use strict';
const BACKGROUND_COLOR_THEME_DAY = 0;
const BACKGROUND_COLOR_THEME_NIGHT = 1;
// 4 color bands from the top of the view (index 0) down to the ground: day / night.
const BACKGROUND_BAND_COLORS = [
  [new Color(.52, .84, 1), new Color(.7, .91, 1), new Color(.91, .97, 1), new Color(1, .94, .74)],
  [new Color(.02, .07, .29), new Color(.04, .09, .35), new Color(.06, .12, .4), new Color(.15, .19, .52)],
];
// Clouds are drawn from the cloud.png sprite (crop its 16x12 cloud body, enlarge when drawn).
// They are far away, so their camera parallax stays small.
const BACKGROUND_PNG_CLOUD_COUNT = 5;
const BACKGROUND_PNG_CLOUD_SIZE = 3.5; // width in world units when scale = 1
const BACKGROUND_PNG_CLOUD_MIN_Y = 6;
const BACKGROUND_PNG_CLOUD_MAX_Y = 14;

class Background extends EngineObject {
  constructor(sceneTheme) {
    super(vec2(), vec2(), undefined, 0, new Color, RENDER_ORDER_BACKGROUND);
    this.mass = 0;
    this.gravityScale = 0;
    if (sceneTheme == THEME_INDEX_ROCK) {
      this.bands = BACKGROUND_BAND_COLORS[BACKGROUND_COLOR_THEME_NIGHT];
    } else {
      this.bands = BACKGROUND_BAND_COLORS[BACKGROUND_COLOR_THEME_DAY];
    }
    this.pngClouds = [];
    for (let i = 0; i < BACKGROUND_PNG_CLOUD_COUNT; ++i) {
      this.pngClouds.push({
        x: randomRange(0, VIEW_WIDTH),
        y: randomRange(BACKGROUND_PNG_CLOUD_MIN_Y, BACKGROUND_PNG_CLOUD_MAX_Y),
        scale: randomRange(0.7, 1.6),
        parallax: randomRange(0.05, 0.25),
        speed: randomRange(0.3, 0.9),
      });
    }
    // Crop the cloud body (top 12 rows) out of the 16x16 cloud.png sprite.
    this.cloudTileInfo = tile(vec2(), vec2(16, 12), TEXTURE_INDEX_CLOUD, 0);
  }

  render() {
    this.drawSky();
  }

  updatePos(pos) {
    this.pos = pos.copy();
  }

  drawSky() {
    this.drawBandSky();
    this.drawClouds();
  }

  drawBandSky() {
    const MOUNTAIN_DENSITY = [PI * 8, PI * 5, PI * 3];
    const MOUNTAIN_AMPLITUDE = [0.03, 0.05, 0.08];
    const HEIGHT = [0.6, 0.4, 0.2];
    const scroll = [cameraPos.x * 0.05, cameraPos.x * 0.1, cameraPos.x * 0.2];
    const MOUNTAIN_PIXEL_STEP = 3;
    drawCanvas2D(vec2(), vec2(1), 0, false, (ctx) => {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      const width = mainCanvasSize.x | 0;
      const height = mainCanvasSize.y | 0;
      ctx.shadowBlur = 15;
      ctx.fillStyle = this.bands[0];
      ctx.fillRect(0, 0, width, height);
      for (let x = 0; x < width; x += MOUNTAIN_PIXEL_STEP) {
        const ratio = (x + MOUNTAIN_PIXEL_STEP / 2) / width;
        for (let i = 0; i < 3; ++i) {
          const phase = lerp(0, MOUNTAIN_DENSITY[i], ratio) + scroll[i];
          const y = Math.floor(((Math.sin(phase) * MOUNTAIN_AMPLITUDE[i] + HEIGHT[i]) * height)
                               / MOUNTAIN_PIXEL_STEP) * MOUNTAIN_PIXEL_STEP;
          ctx.shadowColor = this.bands[i + 1];
          ctx.fillStyle = this.bands[i + 1];
          ctx.fillRect(x, height, MOUNTAIN_PIXEL_STEP, -y);
        }
      }
    }, /*screenSpace*/ true);
  }

  drawClouds() {
    const viewMin = this.pos.subtract(vec2(VIEW_WIDTH / 2, VIEW_HEIGHT / 2));
    const camX = this.pos.x;
    for (const c of this.pngClouds) {
      const width = BACKGROUND_PNG_CLOUD_SIZE * c.scale;
      const height = width * 12 / 16; // match the 16x12 crop aspect
      const x = backgroundWrap(c.x - time * c.speed - camX * c.parallax, VIEW_WIDTH + width) - width;
      drawTile(viewMin.add(vec2(x + width / 2, c.y)), vec2(width, height), this.cloudTileInfo);
    }
  }
}

function backgroundWrap(value, size) {
  return (value % size + size) % size;
}
