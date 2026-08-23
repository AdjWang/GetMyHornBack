'use strict';

const CROSSHAIR_RENDER_ORDER = RENDER_ORDER_BULLET - 0.5;
const CROSSHAIR_RADIUS = 0.35;
const CROSSHAIR_GAP = 0.12;
const CROSSHAIR_LINE_LENGTH = 0.22;
const CROSSHAIR_LINE_THICKNESS = 0.04;
const CROSSHAIR_DARK_COLOR = new Color(0, 0, 0, 0.9);
const CROSSHAIR_LIGHT_COLOR = new Color(1, 1, 1, 0.9);

class Crosshair extends EngineObject {
  constructor() {
    super(vec2(), vec2(), undefined, 0, new Color, CROSSHAIR_RENDER_ORDER);
    this.setCollision(false, false, false, false);
  }

  update() {
    this.pos = mousePos.copy();
  }

  render() {
    this.drawCrosshair(CROSSHAIR_DARK_COLOR, CROSSHAIR_LINE_THICKNESS * 1.8);
    this.drawCrosshair(CROSSHAIR_LIGHT_COLOR, CROSSHAIR_LINE_THICKNESS);
  }

  drawCrosshair(color, thickness) {
    const p = this.pos;
    drawLine(p.add(vec2(-CROSSHAIR_RADIUS, 0)), p.add(vec2(-CROSSHAIR_GAP, 0)), thickness, color);
    drawLine(p.add(vec2(CROSSHAIR_GAP, 0)), p.add(vec2(CROSSHAIR_RADIUS, 0)), thickness, color);
    drawLine(p.add(vec2(0, -CROSSHAIR_RADIUS)), p.add(vec2(0, -CROSSHAIR_GAP)), thickness, color);
    drawLine(p.add(vec2(0, CROSSHAIR_GAP)), p.add(vec2(0, CROSSHAIR_RADIUS)), thickness, color);
    drawRect(p, vec2(CROSSHAIR_LINE_LENGTH), color, PI / 4, false);
  }

  renderDebugInfo() {
  }
}
