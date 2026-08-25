'use strict';

const DRAGON_ANIM_SPEED = 4;  // frame/sec
const DRAGON_FRAME_COUNT = 2;
const DRAGON_DRAW_Y_OFFSETS = [0.0, 0.2];
const SLIME_ANIM_SPEED = 12;  // frame/sec
const SLIME_STATE_GUARD = 0;
const SLIME_STATE_MANIFEST = 1;
const SLIME_STATE_DASH = 2;
const SLIME_MANIFEST_TIME = 0.8;
const SLIME_DASH_SPEED = 0.28;
const SLIME_HIT_KNOCKBACK_CELLS = 6;
const SLIME_SIGHT_HEIGHT = 1.2;
const SLIME_HINT_COLOR = new Color(1, 0.45, 0.45);

class Dragon extends EngineObject {
  constructor(pos) {
    const colliderSize = vec2(0.9, 0.9);
    super(pos, colliderSize, undefined, 0, new Color, RENDER_ORDER_CHARACTER);
    const res = createAsepriteResource(dragonAsepriteData, TEXTURE_INDEX_DRAGON, ['tail', 'body', 'wing']);
    this._frameInfoWing = res.wing;
    this._frameInfoBody = res.body;
    this._frameInfoTail = res.tail;
    this._currentFrame = 0;
    this._offsetFrame = 0;
    this._frameTimer = new Timer(1.0 / DRAGON_ANIM_SPEED);
    this.mirror = false;
    this.damping = 1;
    this.friction = 1;
    this.setCollision();
  }

  update() {
    super.update();
    if (this._frameTimer.elapsed()) {
      this._frameTimer.set(1.0 / DRAGON_ANIM_SPEED);
      this._currentFrame = (this._currentFrame + 1) % DRAGON_FRAME_COUNT;
    }
    this._offsetFrame = this._currentFrame + this._frameTimer.getPercent();
  }

  render() {
    const currentFrame = this._currentFrame;
    const nextFrame = (currentFrame + 1) % DRAGON_FRAME_COUNT;
    const framePercent = smoothStep(this._offsetFrame - currentFrame);
    const drawYOffset = lerp(DRAGON_DRAW_Y_OFFSETS[nextFrame], DRAGON_DRAW_Y_OFFSETS[currentFrame], framePercent);
    const scaleY = 1;
    const drawPos = this.pos.add(vec2(0.0, drawYOffset));
    drawAsepriteFrame(this._frameInfoWing[currentFrame], drawPos, scaleY, undefined, 0, this.mirror);
    drawAsepriteFrame(this._frameInfoBody[currentFrame], drawPos, scaleY, undefined, 0, this.mirror);
    drawAsepriteFrame(this._frameInfoTail[0], drawPos, scaleY, undefined, 0, this.mirror);
  }
}

class Slime extends EngineObject {
  constructor(pos, sight = 0) {
    const colliderSize = vec2(0.9, 0.9);
    const anim = tile(0, 16, TEXTURE_INDEX_SLIME, 0);
    super(pos, colliderSize, anim, 0, new Color, RENDER_ORDER_CHARACTER);
    this._frameTimer = new Timer(1.0 / SLIME_ANIM_SPEED);
    this._manifestTimer = new Timer;
    this._currentFrame = 0;
    this._scaleOffsetY = [1.0, 0.9, 0.8, 0.7, 0.7, 0.8, 0.9, 1.0];
    this._sight = sight;
    this._state = SLIME_STATE_GUARD;
    this._caughtObject = undefined;
    this._caughtPos = undefined;
    this._dashDirection = 0;
    this.mirror = false;
    this.mass = 1;
    this.damping = 1;
    this.friction = 1;
    this.setCollision();
  }

  update() {
    this._updateBehavior();
    super.update();
    if (this._state == SLIME_STATE_DASH) {
      this._stopDashAtCaughtPos();
    }
    if (this.pos.y < -this.size.y) {
      this.destroy();
      return;
    }
    if (this._frameTimer.elapsed()) {
      this._frameTimer.set(1.0 / SLIME_ANIM_SPEED);
      this._currentFrame = (this._currentFrame + 1) % this._scaleOffsetY.length;
    }
  }

  render() {
    const size = vec2(this.size.x, this.size.y * this._scaleOffsetY[this._currentFrame]);
    const pos = this.pos.add(vec2(0, (size.y - this.size.y) / 2));
    drawTile(pos, size, this.tileInfo, this.color, this.angle, this.mirror);
  }

  collideWithObject(o) {
    if (this._state == SLIME_STATE_DASH && o != this._caughtObject && o.mass) {
      this._caughtObject = o;
    }
    if (this._state == SLIME_STATE_DASH && o == this._caughtObject) {
      this._hitCaughtObject(o);
      return false;
    }
    return true;
  }

  _updateBehavior() {
    if (this._state == SLIME_STATE_GUARD) {
      this.color = new Color;
      this.velocity.x = 0;
      const caughtObject = this._getCaughtObject();
      if (caughtObject) {
        this._caughtObject = caughtObject;
        this._caughtPos = caughtObject.pos.copy();
        this._manifestTimer.set(SLIME_MANIFEST_TIME);
        this._state = SLIME_STATE_MANIFEST;
      }
      return;
    }
    if (this._state == SLIME_STATE_MANIFEST) {
      this.color = SLIME_HINT_COLOR;
      this.velocity.x = 0;
      if (this._manifestTimer.elapsed()) {
        this._startDash();
      }
      return;
    }
    if (this._state == SLIME_STATE_DASH) {
      this.color = new Color;
    }
  }

  _getCaughtObject() {
    if (!this._sight) {
      return undefined;
    }
    const sightSize = vec2(this._sight, SLIME_SIGHT_HEIGHT);
    const leftSightPos = this.pos.add(vec2(-(this.size.x + this._sight) / 2, 0));
    const rightSightPos = this.pos.add(vec2((this.size.x + this._sight) / 2, 0));
    const objects = engineObjectsCollect(leftSightPos, sightSize)
      .concat(engineObjectsCollect(rightSightPos, sightSize));
    let caughtObject;
    let caughtDistance = Infinity;
    for (const o of objects) {
      if (o == this || !o.mass || !o.collideSolidObjects || !o.isSolid) {
        continue;
      }
      const distance = this.pos.distanceSquared(o.pos);
      if (distance < caughtDistance) {
        caughtObject = o;
        caughtDistance = distance;
      }
    }
    return caughtObject;
  }

  _startDash() {
    if (!this._caughtObject || this._caughtObject.destroyed) {
      this._resetGuard();
      return;
    }
    this._caughtPos = this._caughtObject.pos.copy();
    const dashDirection = sign(this._caughtPos.x - this.pos.x) || (this.mirror ? 1 : -1);
    this._dashDirection = dashDirection;
    this.mirror = dashDirection > 0;
    this.velocity.x = dashDirection * SLIME_DASH_SPEED;
    this._state = SLIME_STATE_DASH;
  }

  _stopDashAtCaughtPos() {
    if (!this._caughtPos) {
      this._resetGuard();
      return;
    }
    if ((this.pos.x - this._caughtPos.x) * this._dashDirection >= 0) {
      this.pos.x = this._caughtPos.x;
      this._resetGuard();
    }
  }

  _hitCaughtObject(o) {
    if (o.takeKnockback) {
      const forceDirection = sign(o.pos.x - this.pos.x) || sign(this.velocity.x) || 1;
      o.takeKnockback(forceDirection * SLIME_HIT_KNOCKBACK_CELLS);
    }
    this._resetGuard();
  }

  _resetGuard() {
    this.velocity.x = 0;
    this.color = new Color;
    this._caughtObject = undefined;
    this._caughtPos = undefined;
    this._dashDirection = 0;
    this._state = SLIME_STATE_GUARD;
  }
}
