'use strict';

const RAINBOW_CELL_TIME = 1.0;
const RAINBOW_CELL_RENDER_ORDER = RENDER_ORDER_BULLET - 0.5;
const RAINBOW_CELL_PREVIEW_COLOR = new Color(1, 1, 1, 0.15);
const RAINBOW_CELL_ACTIVE_COLOR = new Color(1, 1, 1, 1);

class RainbowCell extends EngineObject {
  constructor() {
    super(vec2(), vec2(1), undefined, 0, RAINBOW_CELL_PREVIEW_COLOR, RAINBOW_CELL_RENDER_ORDER);
    this.mass = 0;
    this.setCollision(true, true, false, true);
  }

  update() {
    this.pos = mousePos.floor().add(vec2(0.5));
  }

  render() {
    drawRect(this.pos, this.size, RAINBOW_CELL_PREVIEW_COLOR);
  }

  createStandableCell() {
    new RainbowStandableCell(this.pos);
  }

  collideWithObject(o) {
    return false;
  }
}

class RainbowStandableCell extends EngineObject {
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
