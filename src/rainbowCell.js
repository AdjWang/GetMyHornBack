'use strict';

const RAINBOW_CELL_TIME = 1.0;
const RAINBOW_CELL_RENDER_ORDER = RENDER_ORDER_BULLET - 0.5;
const RAINBOW_CELL_PREVIEW_DASH_COUNT = 6;
const RAINBOW_CELL_PREVIEW_DASH_THICKNESS = 0.1;
const RAINBOW_CELL_PREVIEW_DARK_COLOR = new Color(0, 0, 0, 0.9);
const RAINBOW_CELL_PREVIEW_LIGHT_COLOR = new Color(1, 1, 1, 0.9);
const RAINBOW_CELL_ACTIVE_COLOR = new Color(1, 1, 1, 1);

class RainbowCellPreview extends EngineObject {
  constructor() {
    super(vec2(), vec2(1), undefined, 0, new Color, RAINBOW_CELL_RENDER_ORDER);
    this.mass = 0;
    this._bullet = undefined;
    this.setCollision(false, false, false, false);
  }

  lock(pos, bullet) {
    this.pos = pos.floor().add(vec2(0.5));
    this._bullet = bullet;
    this.setCollision(true, true, false, true);
  }

  render() {
    if (!this._bullet) {
      return;
    }
    drawRainbowCellPreview(this.pos, this.size);
  }

  isLockedFor(bullet) {
    return this._bullet == bullet;
  }

  onBulletHit(bullet, hitCell) {
    if (!this.isLockedFor(bullet)) {
      return;
    }
    if (hitCell) {
      new RainbowCell(this.pos);
    }
    this.clear();
  }

  clear() {
    this._bullet = undefined;
    this.setCollision(false, false, false, false);
  }

  collideWithObject(o) {
    return false;
  }
}

class RainbowCellMousePreview extends EngineObject {
  constructor() {
    super(vec2(), vec2(1), undefined, 0, new Color, RAINBOW_CELL_RENDER_ORDER);
    this.setCollision(false, false, false, false);
  }

  update() {
    this.pos = mousePos.floor().add(vec2(0.5));
  }

  render() {
    drawRainbowCellPreview(this.pos, this.size);
  }
}

function drawRainbowCellPreview(pos, size) {
  const minX = pos.x - size.x / 2;
  const maxX = pos.x + size.x / 2;
  const minY = pos.y - size.y / 2;
  const maxY = pos.y + size.y / 2;
  drawRainbowCellPreviewSide(vec2(minX, minY), vec2(maxX, minY));
  drawRainbowCellPreviewSide(vec2(maxX, minY), vec2(maxX, maxY));
  drawRainbowCellPreviewSide(vec2(maxX, maxY), vec2(minX, maxY));
  drawRainbowCellPreviewSide(vec2(minX, maxY), vec2(minX, minY));
}

function drawRainbowCellPreviewSide(start, end) {
  for (let i = 0; i < RAINBOW_CELL_PREVIEW_DASH_COUNT; ++i) {
    const dashStart = start.lerp(end, i / RAINBOW_CELL_PREVIEW_DASH_COUNT);
    const dashEnd = start.lerp(end, (i + 0.5) / RAINBOW_CELL_PREVIEW_DASH_COUNT);
    const color = i % 2 ? RAINBOW_CELL_PREVIEW_DARK_COLOR : RAINBOW_CELL_PREVIEW_LIGHT_COLOR;
    drawLine(dashStart, dashEnd, RAINBOW_CELL_PREVIEW_DASH_THICKNESS, color);
  }
}

class RainbowCell extends EngineObject {
  constructor(pos) {
    super(pos.floor().add(vec2(0.5)), vec2(1), undefined, 0, RAINBOW_CELL_ACTIVE_COLOR, RAINBOW_CELL_RENDER_ORDER);
    this.mass = 0;
    this._timer = new Timer(RAINBOW_CELL_TIME);
    this.setCollision(true, true, false, true);
  }

  update() {
    if (this._timer.elapsed()) {
      this.destroy();
    }
  }

  render() {
    drawRect(this.pos, this.size, RAINBOW_CELL_ACTIVE_COLOR);
  }

  collideWithObject(o) {
    return !(o instanceof RainbowBullet);
  }
}
