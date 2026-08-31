'use strict';

const BULLET_TRAIL_POINT_COUNT = 8;
const BULLET_TRAIL_THICKNESS = 0.05;
const BULLET_TRAIL_TIME = 0.25;
const RAINBOW_BULLET_COLOR_SPACING = 0.05;
const RAINBOW_COLORS = [
  new Color(1.0, 0.2, 0.0),
  new Color(1.0, 0.5, 0.0),
  new Color(1.0, 1.0, 0.0),
  new Color(0.0, 0.8, 0.2),
  new Color(0.0, 0.8, 1.0),
  new Color(0.1, 0.2, 1.0),
  new Color(0.6, 0.0, 1.0),
];

class RainbowBeam extends EngineObject {
  constructor(pos, attacker, velocity, damage, range) {
    super(pos, vec2(0.01, 0.01));
    const colors = RAINBOW_COLORS;
    this.color = colors[colors.length / 2 | 0];
    this.velocity = velocity;
    this.damping = 1;
    this.gravityScale = 0.0;
    this.renderOrder = RENDER_ORDER_BULLET;
    this.drawSize = vec2();
    this.setCollision(true, false);

    this._attacker = attacker;
    this._damage = damage;
    this._startPos = pos.copy();
    this._range = range;
    this._colors = colors;
    this._colorOffsets = this._createColorOffsets(colors.length, velocity);
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
    if (this._range && this.pos.distanceSquared(this._startPos) >= this._range * this._range) {
      this._explode();
    }
  }

  render() {
    drawRainbowBeamTrail(this._trailPoints, 1, this._colors, this._colorOffsets);
  }

  collideWithObject(o) {
    if (o == this._attacker) {
      return false;
    }
    this._explode();
    return true;
  }

  collideWithTile(tileData, pos) {
    if (tileLayer instanceof TileLayer) {
      const data = tileLayer.getData(pos);
      if (data && data.tile == DESTROYABLE_TILE_ID) {
        tileLayer.setData(pos, new TileLayerData);
        setTileCollisionData(pos, 0);
        tileLayer.redraw();
        new Explode(pos, RAINBOW_COLORS);
      }
    }
    return false;
  }

  destroy() {
    if (this.destroyed)
      return;
    new RainbowBeamTrail(this._trailPoints, this.renderOrder, this._colors, this._colorOffsets);
    super.destroy();
  }

  _createColorOffsets(count, velocity) {
    const offsets = [];
    const center = (count - 1) / 2;
    const direction = velocity.lengthSquared() ? velocity.normalize() : vec2(1, 0);
    const offsetDirection = vec2(-direction.y, direction.x);
    for (let i = 0; i < count; ++i) {
      offsets.push(offsetDirection.scale((center - i) * RAINBOW_BULLET_COLOR_SPACING));
    }
    return offsets;
  }

  _explode() {
    new Explode(this.pos, RAINBOW_COLORS);
    this.destroy();
  }
}

class RainbowBeamTrail extends EngineObject {
  constructor(points, renderOrder, colors, colorOffsets) {
    super(vec2(), vec2(), undefined, 0, new Color, renderOrder);
    this.points = points.map(p => p.copy());
    this.colors = colors;
    this.colorOffsets = colorOffsets;
    this.lifeTimer = new Timer(BULLET_TRAIL_TIME);
    this.setCollision(false, false, false, false);
  }

  update() {
    const p = this.lifeTimer.getPercent();
    const head = this.points[this.points.length - 1];
    for (let i = 0; i < this.points.length; ++i) {
      const targetIndex = Math.min(i + 1, this.points.length - 1);
      this.points[i] = this.points[i].lerp(this.points[targetIndex], p);
    }
    if (this.points.length) {
      this.points[this.points.length - 1] = head;
    }
    if (this.lifeTimer.elapsed()) {
      this.destroy();
    }
  }

  render() {
    drawRainbowBeamTrail(this.points, 1 - this.lifeTimer.getPercent(), this.colors, this.colorOffsets);
  }
}

function drawRainbowBeamTrail(points, alphaScale, colors, colorOffsets) {
  for (let colorIndex = 0; colorIndex < colors.length; ++colorIndex) {
    const color = colors[colorIndex];
    const offset = colorOffsets[colorIndex];
    for (let i = 1; i < points.length; ++i) {
      const alpha = i / (points.length - 1) * alphaScale;
      drawLine(points[i - 1].add(offset), points[i].add(offset), BULLET_TRAIL_THICKNESS,
        new Color(color.r, color.g, color.b, alpha));
    }
  }
}

class FireBall extends EngineObject {
  constructor(pos, attacker, velocity, damage, range) {
    super(pos, vec2(0.45, 0.45),
          tile(1, FIREBALL_SIZE, TEXTURE_INDEX_FIREBALL, 0));
    this.velocity = velocity;
    this.damping = 1;
    this.gravityScale = 0;
    this.renderOrder = RENDER_ORDER_BULLET;
    this.setCollision(true, false);

    this._attacker = attacker;
    this._damage = damage;
    this._startPos = pos.copy();
    this._range = range;
  }

  update() {
    super.update();
    if (this.destroyed) {
      return;
    }
    if (this._range && this.pos.distanceSquared(this._startPos) >= this._range * this._range) {
      this._explode();
    }
  }

  collideWithObject(o) {
    if (o == this._attacker) {
      return false;
    }
    this._explode();
    return true;
  }

  collideWithTile(tileData, pos) {
    this._explode();
    return true;
  }

  _explode() {
    this.destroy();
  }
}
