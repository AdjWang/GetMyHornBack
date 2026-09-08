'use strict';

const SLIME_JUMP_GAIN = 1.2;

const DRAGON_SLIME_ANIM_SPEED = 4;  // frame/sec
const DRAGON_SLIME_FRAME_COUNT = 2;
const DRAGON_SLIME_DRAW_BASE_FRAME = 3;
const DRAGON_SLIME_DRAW_X_OFFSETS = [-0.7, -0.7];
const DRAGON_SLIME_DRAW_Y_OFFSETS = [-1.1, -0.9];
const DRAGON_SLIME_HORN_OFFSET = vec2(-1.8, 0.1);
const DRAGON_SLIME_ATTACK_DISTANCE = 11;
const DRAGON_SLIME_LOCK_DISTANCE = 0.5;
const DRAGON_SLIME_VELOCITY = vec2(0.2, 0.05);
const DRAGON_SLIME_CHARGE_LENGTH = 25;
const DRAGON_SLIME_BEAM_SPEED = 0.45;
const DRAGON_SLIME_BEAM_DAMAGE = 1;
const DRAGON_SLIME_BEAM_RANGE = 50;
const DRAGON_SLIME_STAGE_IDLE = 0;
const DRAGON_SLIME_STAGE_LOCK = 1;
const DRAGON_SLIME_STAGE_FIRE = 2;
const DRAGON_SLIME_DAMAGED_TICKS = 90;
// Gain when unicorn jump over slime.
const STUPID_SLIME_ANIM_SPEED = 12;  // frame/sec

class DragonSlime extends EngineObject {
  constructor(pos, velocity, lockTime) {
    const colliderSize = vec2(0.9, 0.9);
    super(pos, colliderSize, undefined, 0, new Color, RENDER_ORDER_CHARACTER);
    this._frameInfoWing = characterRes.slime_wing;
    this._frameInfoBody = characterRes.slime_body;
    this._frameInfoHorn = characterRes.unicorn_horn;
    this._hasHorn = true;
    this._currentFrame = 0;
    this._offsetFrame = 0;
    this._frameTimer = new Timer(1.0 / DRAGON_SLIME_ANIM_SPEED);
    this._caughtObject = undefined;
    this._caughtSide = 1;
    this._stage = DRAGON_SLIME_STAGE_IDLE;
    this._lockTimer = new Timer;
    this._lockTimer.unset();
    this._charge = undefined;
    this._fireLockY = undefined;
    this._lockTime = lockTime;
    this._bossSlot = this.pos;
    this._motionX = new Lowpass(1.0 - velocity.x);
    this._motionY = new Lowpass(1.0 - velocity.y);
    // DEBUG
    this._health = 1;
    this._flashTick = 0;
    this.gravityScale = 0.0;
    this.mirror = true;
    this.mass = 0;
    this.damping = 1;
    this.friction = 1;
    this.setCollision(true, true, false);
  }

  update() {
    if (currentLevel != BOSS_LEVEL) {
      this._updateNormalState();
    } else {
      this._updateBossState();
    }
    super.update();
    if (this._frameTimer.elapsed()) {
      this._frameTimer.set(1.0 / DRAGON_SLIME_ANIM_SPEED);
      this._currentFrame = (this._currentFrame + 1) % DRAGON_SLIME_FRAME_COUNT;
    }
    this._offsetFrame = this._currentFrame + this._frameTimer.getPercent();
    if (this._health == 0) {
      theEnd(this.pos.copy());
      new Explode(this.pos, RAINBOW_COLORS);
      this.destroy();
    }
  }

  render() {
    let color = new Color(0, 0, 0, 1);
    if (this._flashTick > 0) {
      this._flashTick -= 1;
      color.a = (Math.sin(PI * 2 * 3 * (this._flashTick / DRAGON_SLIME_DAMAGED_TICKS)) + 1) / 2;
    }
    const currentFrame = this._currentFrame;
    const nextFrame = (currentFrame + 1) % DRAGON_SLIME_FRAME_COUNT;
    const framePercent = smoothStep(this._offsetFrame - currentFrame);
    const drawXOffset = lerp(DRAGON_SLIME_DRAW_X_OFFSETS[nextFrame], DRAGON_SLIME_DRAW_X_OFFSETS[currentFrame], framePercent)
      * (this.mirror ? -1 : 1);
    const drawYOffset = lerp(DRAGON_SLIME_DRAW_Y_OFFSETS[nextFrame], DRAGON_SLIME_DRAW_Y_OFFSETS[currentFrame], framePercent);
    const scaleY = 1;
    const drawPos = this.pos.add(vec2(drawXOffset, drawYOffset));
    if (currentFrame == 0) {
      drawAsepriteFrame(this._frameInfoWing[currentFrame + DRAGON_SLIME_DRAW_BASE_FRAME], drawPos, scaleY, color, 0, this.mirror);
      drawAsepriteFrame(this._frameInfoBody[currentFrame + DRAGON_SLIME_DRAW_BASE_FRAME], drawPos, scaleY, color, 0, this.mirror);
    } else {
      drawAsepriteFrame(this._frameInfoBody[currentFrame + DRAGON_SLIME_DRAW_BASE_FRAME], drawPos, scaleY, color, 0, this.mirror);
      drawAsepriteFrame(this._frameInfoWing[currentFrame + DRAGON_SLIME_DRAW_BASE_FRAME], drawPos, scaleY, color, 0, this.mirror);
    }
    if (this._hasHorn) {
      const hornPos = drawPos.add(DRAGON_SLIME_HORN_OFFSET.multiply(vec2(this._caughtSide, 1)));
      drawAsepriteFrame(this._frameInfoHorn[currentFrame], hornPos, scaleY, undefined, 0, this.mirror);
    }
    if (currentLevel == BOSS_LEVEL) {
      for (let i = 0; i < this._health; i++) {
        drawTextOverlay("💗", this.pos.add(vec2((i - 1) * 0.6, 1.4)), 0.5);
      }
    }
  }

  setHasHorn(has) {
    this._hasHorn = has;
  }

  collideWithObject(o) {
    if (o == player && o.velocity.y <= 0 && o.pos.y > this.pos.y) {
      o.groundObject = this;
      if (!this._caughtObject) {
        this.setTargetObject(o);
      }
    }
    return true;
  }

  get_jump_gain() {
    return SLIME_JUMP_GAIN;
  }

  hasTarget() {
    return this._caughtObject != undefined;
  }

  setTargetObject(o) {
    this._caughtObject = o;
    this._stage = DRAGON_SLIME_STAGE_IDLE;
    this._lockTimer.unset();
    this._charge = undefined;
    this._fireLockY = undefined;
    this.children.forEach(child => child.destroy());
    this.children = [];
  }

  setBossSlot(pos) {
    this._bossSlot = pos;
  }

  // Input 0 to left, 1 to right.
  setFaceDir(toLeft) {
    // -1 to left, 1 to right.
    this._caughtSide = toLeft * 2 - 1;
    this.mirror = this._caughtSide > 0;
  }

  acceptDamage() {
    if (currentLevel == BOSS_LEVEL) {
      this._health -= 1;
      this._flashTick = DRAGON_SLIME_DAMAGED_TICKS;
    }
  }

  fire(laserCount = 1, chargeTime = 1.0) {
    if (this._isFiring()) {
      return;
    }
    this._stage = DRAGON_SLIME_STAGE_FIRE;
    this._lockTimer.unset();
    this._fireLockY = this.pos.y;
    this._startCharge(laserCount, chargeTime);
  }

  _updateNormalState() {
    if (!this._caughtObject || this._caughtObject.destroyed) {
      return;
    }
    if (this._stage == DRAGON_SLIME_STAGE_IDLE) {
      this._stage = DRAGON_SLIME_STAGE_LOCK;
      this.pos.x = this._motionX.update(this.pos.x);
      this.pos.y = this._motionY.update(this.pos.y);
    } else if (this._stage == DRAGON_SLIME_STAGE_LOCK) {
      const targetPos = this._getTargetPos();
      const motionTargetPos = targetPos;
      this.pos.x = this._motionX.update(motionTargetPos.x);
      this.pos.y = this._motionY.update(motionTargetPos.y);
      this._handleLock(targetPos);
    } else if (this._stage == DRAGON_SLIME_STAGE_FIRE) {
      const targetPos = this._getTargetPos();
      const motionTargetPos = vec2(targetPos.x, this._fireLockY);
      this.pos.x = this._motionX.update(motionTargetPos.x);
      this.pos.y = this._motionY.update(motionTargetPos.y);
      this._handleFire();
    }
  }

  _updateBossState() {
    this.pos.x = this._motionX.update(this._bossSlot.x);
    this.pos.y = this._motionY.update(this._bossSlot.y);
    if (this._stage == DRAGON_SLIME_STAGE_FIRE) {
      this._handleFire();
    }
  }

  _handleLock(targetPos) {
    if (this._isLockTarget(targetPos)) {
      if (!this._lockTimer.isSet()) {
        this._lockTimer.set(this._lockTime);
      }
    } else {
      this._lockTimer.unset();
    }
    if (this._lockTimer.elapsed()) {
      this.fire();
    }
  }

  _handleFire() {
    if (!this._isFiring()) {
      this._charge = undefined;
      this._stage = DRAGON_SLIME_STAGE_IDLE;
      this._fireLockY = undefined;
    }
  }

  _getTargetPos() {
    return vec2(
      this._caughtObject.pos.x - this._caughtSide * DRAGON_SLIME_ATTACK_DISTANCE,
      this._caughtObject.pos.y
    );
  }

  _isLockTarget(targetPos) {
    return abs(this.pos.y - targetPos.y) <= DRAGON_SLIME_LOCK_DISTANCE;
  }

  _isFiring() {
    return this._charge && !this._charge.destroyed;
  }

  _startCharge(laserCount = 1, chargeTime = 1.0) {
    const length = DRAGON_SLIME_CHARGE_LENGTH * this._caughtSide;
    this.children.forEach(o => o.destroy());
    this.children = [];
    this._charge = new ChargeLaser(this.pos.copy(), length, chargeTime,
      () => this._shootRainbowBeam(vec2()));
    this.addChild(this._charge, vec2());
    for (let i = 1; i < laserCount; i++) {
      const offset1 = vec2(0, -i);
      const pos1 = this.pos.copy().add(offset1);
      const charge1 = new ChargeLaser(pos1, length, chargeTime,
        () => this._shootRainbowBeam(offset1));
      this.addChild(charge1, offset1);
      const offset2 = vec2(0, i);
      const pos2 = this.pos.copy().add(offset2);
      const charge2 = new ChargeLaser(pos2, length, chargeTime,
        () => this._shootRainbowBeam(offset2));
      this.addChild(charge2, offset2);
    }
  }

  _shootRainbowBeam(offset) {
    const speed = DRAGON_SLIME_BEAM_SPEED;
    const dir = this._caughtSide < 0 ? PRISM_TILE_DIR_LEFT : PRISM_TILE_DIR_RIGHT;
    new RainbowBeam(this.pos.copy().add(offset), this, speed, dir, DRAGON_SLIME_BEAM_DAMAGE, DRAGON_SLIME_BEAM_RANGE);
  }
}

class StupidSlime extends EngineObject {
  constructor(pos, sight, speed) {
    const colliderSize = vec2(0.9, 0.9);
    const anim = tile(0, 16, TEXTURE_INDEX_SLIME, 0);
    super(pos, colliderSize, anim, 0, new Color, RENDER_ORDER_CHARACTER);
    this._frameTimer = new Timer(1.0 / STUPID_SLIME_ANIM_SPEED);
    this._currentFrame = 0;
    this._initY = pos.y;
    this._scaleOffsetY = [1.0, 0.9, 0.8, 0.7, 0.7, 0.8, 0.9, 1.0];
    sight -= 1;  // fit tild object rect width
    this._sight = sight;
    this._step = speed / sight;
    this._patrolFromX = pos.x;
    this._patrolToX = pos.x + sight;
    this._patrolRatio = 0.0;
    this.gravityScale = 0.0;
    this.mirror = true;
    this.mass = 0;
    this.damping = 1;
    this.friction = 1;
    this.setCollision(true, true, false, false);
  }

  update() {
    this._updatePatrol();
    super.update();
    if (this._frameTimer.elapsed()) {
      this._frameTimer.set(1.0 / STUPID_SLIME_ANIM_SPEED);
      this._currentFrame = (this._currentFrame + 1) % this._scaleOffsetY.length;
    }
    if (!DEBUG_MODE && player && this.pos.distanceSquared(player.pos) <= 0.1) {
      resetPlayer(true);
    }
  }

  render() {
    const size = vec2(this.size.x, this.size.y * this._scaleOffsetY[this._currentFrame]);
    const pos = this.pos.add(vec2(0, (size.y - this.size.y) / 2));
    drawTile(pos, size, this.tileInfo, this.color, this.angle, this.mirror);
  }

  collideWithObject(o) {
    if (o == player && o.velocity.y <= 0 && o.pos.y > this.pos.y) {
      o.groundObject = this;
    }
    return true;
  }

  get_jump_gain() {
    return SLIME_JUMP_GAIN;
  }

  _updatePatrol() {
    this._patrolRatio += this._step;
    if (this._patrolRatio < 0.0) {
      this._patrolRatio = 0.0;
      this._step = -this._step;
      this.mirror = !this.mirror;
    } else if (this._patrolRatio > 1.0) {
      this._patrolRatio = 1.0;
      this._step = -this._step;
      this.mirror = !this.mirror;
    }
    this.pos.x = lerp(this._patrolFromX, this._patrolToX, this._patrolRatio);
    this.pos.y = this._initY;
  }
}

// For boss level.
class DragonSpawnPoint extends EngineObject {
  constructor(pos) {
    super(pos);
    this.gravityScale = 0.0;
    this.setCollision(false, false, false, false);
  }
  render() { }
}
