'use strict';

const CHARGE_THICKNESS_OUTER = 1.0;
const CHARGE_THICKNESS_INNER = 0.12;
const CHARGE_ALPHA = 0.2;
const SOUND_CHARGE = new Sound([.7,,189,.02,.24,.14,,2.5,4,,,,,,,,,.75,.23,,286]);
const SOUND_CHARGE_VOLUME = 0.7;
const SOUND_EXPLODE = new Sound([1.3,.15,224,.01,,.16,,1.5,-8,-13,,,,.2,,.3,,.64,.01,,868]);
const SOUND_EXPLODE_VOLUME = 0.7;
const SOUND_SAVE = new Sound([.9,,683,,.07,.11,1,1.2,8,,384,.05,,,,,,.97,.02,,117]);
const SOUND_SAVE_VOLUME = 0.9;

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
    SOUND_CHARGE.play(pos, SOUND_CHARGE_VOLUME);
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
  constructor(obj, length, gap, draw = (ratio, pos) => { }) {
    super(vec2(), vec2(), undefined, 0, new Color, RENDER_ORDER_CHARACTER - .01);
    this._obj = obj;
    this._length = length;
    this._gap = gap;
    this._draw = draw;
    this._drawTimer = new Timer;
    this._drawTimer.set(this._gap);
    this._durationTimer = new Timer;
    this._pos = [];
    this._enable = true;
    this.mass = 0;
    this.gravityScale = 0;
    this.damping = 1;
    this.friction = 1;
    this.setCollision(false, false, false, false);
  }

  setEnable(on, duration = -1) {
    this._enable = on;
    if (duration > 0) {
      this._durationTimer.set(duration);
    }
  }

  update() {
    if (this._durationTimer.isSet() && this._durationTimer.elapsed()) {
      this._durationTimer.unset();
      this._enable = false;
    }
    if (this._drawTimer.elapsed()) {
      this._drawTimer.set(this._gap);
      if (this._enable) {
        this._pos.push(this._obj.pos.copy());
        if (this._pos.length > this._length) {
          this._pos.shift();
        }
      } else {
        this._pos.shift();
      }
    }
  }

  render() {
    this._pos.forEach((_, i) => {
      const drawIdx = this._pos.length - i - 1;
      const ratio = drawIdx / this._pos.length;
      this._draw(ratio, this._pos[drawIdx]);
    });
  }
}

function saveSplash(pos) {
  SOUND_SAVE.play(pos, SOUND_SAVE_VOLUME);
  const emitter = new ParticleEmitter(
    pos.copy(),                 // position
    0,                          // angle
    0.15,                       // emitSize
    0.03,                       // emitTime
    180,                        // emitRate
    PI * 2,                     // emitConeAngle
    undefined,                  // tileInfo
    new Color,                  // colorStartA
    new Color,                  // colorStartB
    new Color,                  // colorEndA
    new Color,                  // colorEndB
    0.28,                       // particleTime
    0.18,                       // sizeStart
    0.05,                       // sizeEnd
    0.16,                       // speed
    0.1,                        // angleSpeed
    1.0,                        // damping
    1.0,                        // angleDamping
    0.0,                        // gravityScale
    PI,                         // particleConeAngle
    0.2,                        // fadeRate
    0.35,                       // randomness
    false,                      // collideTiles
    false                       // additive
  );
  RAINBOW_COLORS.forEach(color => {
    const p = emitter.emitParticle();
    p.pos = pos.add(randInCircle(0.08));
    p.colorStart = color;
    p.colorEndDelta = new Color(0, 0, 0, 0).subtract(color);
  });
  emitter.destroy();
}
