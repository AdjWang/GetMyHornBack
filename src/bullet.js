'use strict';

const BULLET_TRAIL_POINT_COUNT = 8;
const BULLET_TRAIL_THICKNESS = 0.05;
const BULLET_TRAIL_TIME = 0.25;
const BULLET_TRAIL_DAMPING = 1.0;

class Bullet extends EngineObject {
  constructor(pos, attacker, velocity, damage) {
    super(pos, vec2());
    this.color = new Color(1, 1, 0);
    this.velocity = velocity;
    this.damping = 1;
    this.gravityScale = 0.8;
    this.renderOrder = 100;
    this.drawSize = vec2();
    this.setCollision(true, false);

    this._attacker = attacker;
    this._damage = damage;
    this._trailPoints = [this.pos.copy()];
  }

  update() {
    super.update();
    if (this.destroyed) {
      return;
    }
    this._trailPoints.push(this.pos.copy());
    if (this._trailPoints.length > BULLET_TRAIL_POINT_COUNT) {
      this._trailPoints.shift();
    }
  }

  render() {
    drawBulletTrail(this._trailPoints, 1, this.color);
  }

  collideWithObject(o) {
    if (o == this._attacker) {
      return false;
    }
    this.destroy();
    return true;
  }

  collideWithTile(tileData, pos) {
    this.destroy();
    return true;
  }

  destroy() {
    if (this.destroyed)
      return;
    new BulletTrail(this._trailPoints, this.velocity, this.renderOrder, this.color);
    super.destroy();
  }
}

class BulletTrail extends EngineObject {
  constructor(points, velocity, renderOrder, color) {
    super(vec2(), vec2(), undefined, 0, color, renderOrder);
    this.points = points.map(p => p.copy());
    this.velocity = velocity.copy();
    this.lifeTimer = new Timer(BULLET_TRAIL_TIME);
  }

  update() {
    for (let i = 0; i < this.points.length; ++i) {
      this.points[i] = this.points[i].add(this.velocity);
    }
    this.velocity = this.velocity.scale(BULLET_TRAIL_DAMPING);
    if (this.lifeTimer.elapsed()) {
      this.destroy();
    }
  }

  render() {
    drawBulletTrail(this.points, 1 - this.lifeTimer.getPercent(), this.color);
  }
}

function drawBulletTrail(points, alphaScale, color) {
  for (let i = 1; i < points.length; ++i) {
    const alpha = i / (points.length - 1) * alphaScale;
    drawLine(points[i - 1], points[i], BULLET_TRAIL_THICKNESS,
      new Color(color.r, color.g, color.b, alpha), false);
  }
}
