'use strict';
const BACKGROUND_COLOR_THEME_DAY = 0;
const BACKGROUND_COLOR_THEME_NIGHT = 1;
// 4 color bands from the top of the view (index 0) down to the ground: day / night.
const BACKGROUND_BAND_COLORS = [
  [new Color(.52, .84, 1), new Color(.7, .91, 1), new Color(.91, .97, 1), new Color(1, .94, .74)],
  [new Color(.02, .07, .29), new Color(.04, .09, .35), new Color(.06, .12, .4), new Color(.15, .19, .52)],
];
// The sky is divided into bands by 3 sine curves. The curves flow over time (idle scroll), and each
// curve additionally slides with the camera by its own parallax factor: curve 0 sits high
// (far -> slow), curve 2 sits low (near -> fast).
const BACKGROUND_WAVE_AMPLITUDE = 1.6;
const BACKGROUND_WAVE_FREQUENCY = 0.28;
const BACKGROUND_WAVE_PHASE_STEP = 1.7;
const BACKGROUND_WAVE_SCROLL_SPEED = 0.6; // phase growth per second, moves the curves while idle
const BACKGROUND_WAVE_PARALLAX = [0.15, 0.4, 0.7];
const BACKGROUND_WAVE_STEP = 0.5;
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
    this.colorTheme = sceneTheme == THEME_INDEX_ROCK
      ? BACKGROUND_COLOR_THEME_NIGHT : BACKGROUND_COLOR_THEME_DAY;
    this.bands = BACKGROUND_BAND_COLORS[this.colorTheme];
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
    const viewMin = this.pos.subtract(vec2(VIEW_WIDTH / 2, VIEW_HEIGHT / 2));
    const camX = this.pos.x;
    for (const c of this.pngClouds) {
      const width = BACKGROUND_PNG_CLOUD_SIZE * c.scale;
      const height = width * 12 / 16; // match the 16x12 crop aspect
      const x = backgroundWrap(c.x - time * c.speed - camX * c.parallax, VIEW_WIDTH + width) - width;
      drawTile(viewMin.add(vec2(x + width / 2, c.y)), vec2(width, height), this.cloudTileInfo);
    }
  }

  drawBandSky() {
    const viewMin = this.pos.subtract(vec2(VIEW_WIDTH / 2, VIEW_HEIGHT / 2));
    const camX = this.pos.x;
    const bands = this.bands;
    const bandHeight = VIEW_HEIGHT / bands.length;
    for (let x = 0; x < VIEW_WIDTH; x += BACKGROUND_WAVE_STEP) {
      let prevCanvasY = 0;
      for (let b = 0; b < bands.length; ++b) {
        let canvasY;
        if (b == bands.length - 1) {
          canvasY = VIEW_HEIGHT; // last band is flat and reaches the bottom of the view
        } else {
          // phase = idle flow over time + camera parallax (far curves barely move, near follow faster)
          const phase = x * BACKGROUND_WAVE_FREQUENCY
            + time * BACKGROUND_WAVE_SCROLL_SPEED
            + camX * BACKGROUND_WAVE_FREQUENCY * BACKGROUND_WAVE_PARALLAX[b]
            + b * BACKGROUND_WAVE_PHASE_STEP;
          canvasY = (b + 1) * bandHeight + Math.sin(phase) * BACKGROUND_WAVE_AMPLITUDE;
        }
        const topWorld = viewMin.y + VIEW_HEIGHT - prevCanvasY;
        const bottomWorld = viewMin.y + VIEW_HEIGHT - canvasY;
        drawRect(viewMin.add(vec2(x + BACKGROUND_WAVE_STEP / 2, (topWorld + bottomWorld) / 2)),
          vec2(BACKGROUND_WAVE_STEP, topWorld - bottomWorld), bands[b]);
        prevCanvasY = canvasY;
      }
    }
  }
}

function backgroundWrap(value, size) {
  return (value % size + size) % size;
}
