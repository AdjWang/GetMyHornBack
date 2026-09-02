'use strict';

const CHARGE_THICKNESS_OUTER = 1.0;
const CHARGE_THICKNESS_INNER = 0.12;
const CHARGE_ALPHA = 0.2;
const SOUND_EXPLODE = new Sound([1.3,.15,224,.01,,.16,,1.5,-8,-13,,,,.2,,.3,,.64,.01,,868]);
const SOUND_EXPLODE_VOLUME = 0.7;

class Explode {
  constructor(pos, colors) {
    SOUND_EXPLODE.play(pos, SOUND_EXPLODE_VOLUME);
    const emitter = new ParticleEmitter(
      pos.copy(),            // position
      0,                     // angle
      0.1,                   // emitSize
      0.02,                  // emitTime
      24,                    // emitRate
      PI * 2,                // emitConeAngle
      undefined,             // tileInfo
      new Color,             // colorStartA
      new Color,             // colorStartB
      new Color,             // colorEndA
      new Color,             // colorEndB
      0.08,                  // particleTime
      0.15,                  // sizeStart
      0.15,                  // sizeEnd
      0.1,                   // speed
      0.1,                   // angleSpeed
      1.0,                   // damping
      1.0,                   // angleDamping
      0.0,                   // gravityScale
      0,                     // particleConeAngle
      0.3,                   // fadeRate
      0.0,                   // randomness
      false,                 // collideTiles
      false                  // additive
    );
    colors.forEach(color => {
      const debris = emitter.emitParticle();
      debris.pos = pos.add(randInCircle(0.08));
      debris.colorStart = color;
      debris.colorEndDelta = new Color(0, 0, 0, 0).subtract(color);
    });
    emitter.destroy();
  }
}

class ChargeLaser extends EngineObject {
  constructor(pos, length, chargeTime, doneCallback = () => {}) {
    super(pos, vec2(0.1, 0.1));
    this._length = abs(length);
    this._direction = sign(length) || 1;
    this._chargeTimer = new Timer(chargeTime);
    this._doneCallback = doneCallback;
    this._startPos = pos.copy();
    this._endPos = pos.copy();
    this.mass = 0;
    this.damping = 1;
    this.gravityScale = 0;
    this.renderOrder = RENDER_ORDER_BULLET;
    this.setCollision(false, false, false, false);
  }

  update() {
    this._refreshGeometry();
    if (this._chargeTimer.elapsed()) {
      this._doneCallback();
      this.destroy();
    }
  }

  render() {
    this._refreshGeometry();
    const p = smoothStep(this._chargeTimer.getPercent());
    const outerThickness = lerp(CHARGE_THICKNESS_OUTER, CHARGE_THICKNESS_INNER, p);
    const chargeColor = new Color(1, 1 - p, 1 - p, CHARGE_ALPHA);
    this._drawCharge(outerThickness, chargeColor);
  }

  _refreshGeometry() {
    this._startPos = this.pos.copy();
    this._endPos = this._startPos.add(vec2(this._length * this._direction, 0));
  }

  _drawCharge(outerThickness, color) {
    const outerColor = new Color(color.r, color.g, color.b, CHARGE_ALPHA * 0.5);
    const innerColor = new Color(color.r, color.g, color.b, CHARGE_ALPHA);
    drawLine(this._startPos, this._endPos, outerThickness, outerColor);
    drawLine(this._startPos, this._endPos, CHARGE_THICKNESS_INNER, innerColor);
  }
}

class GhostTrail extends EngineObject {
  constructor(length, alpha) {
    super(vec2(), vec2(), undefined, 0, new Color, RENDER_ORDER_CHARACTER - .01);
    this._obj = undefined;
    this._length = length;
    this._alpha = alpha;
    this._ghosts = [];
    this.mass = 0;
    this.gravityScale = 0;
    this.damping = 1;
    this.friction = 1;
    this.setCollision(false, false, false, false);
  }

  attach(obj) {
    this._obj = obj;
    this._ghosts = [];
    this.renderOrder = obj.renderOrder - .01;
  }

  detach() {
    this._obj = undefined;
    this._ghosts = [];
  }

  update() {
    if (!this._obj || this._obj.destroyed) {
      return;
    }
    this._ghosts.push(this._sampleGhost());
    if (this._ghosts.length > this._length) {
      this._ghosts.shift();
    }
  }

  render() {
    if (!this._obj || this._obj.destroyed) {
      return;
    }
    for (let i = 0; i < this._ghosts.length; ++i) {
      const ghost = this._ghosts[i];
      const alpha = this._alpha * (i + 1) / this._ghosts.length;
      drawTile(ghost.pos, ghost.size, ghost.tileInfo, new Color(1, 1, 1, alpha), ghost.angle, ghost.mirror);
    }
  }

  _sampleGhost() {
    const obj = this._obj;
    if (obj._scaleOffsetY && obj._currentFrame != undefined) {
      const size = vec2(obj.size.x, obj.size.y * obj._scaleOffsetY[obj._currentFrame]);
      return {
        pos: obj.pos.add(vec2(0, (size.y - obj.size.y) / 2)),
        size,
        angle: obj.angle,
        mirror: obj.mirror,
        tileInfo: obj.tileInfo,
      };
    }
    return {
      pos: obj.pos.copy(),
      size: obj.drawSize ? obj.drawSize.copy() : obj.size.copy(),
      angle: obj.angle,
      mirror: obj.mirror,
      tileInfo: obj.tileInfo,
    };
  }
}
