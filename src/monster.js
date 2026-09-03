'use strict';

const DRAGON_SLIME_ANIM_SPEED = 4;  // frame/sec
const DRAGON_SLIME_FRAME_COUNT = 2;
const DRAGON_SLIME_DRAW_X_OFFSETS = [0.3, 0.3];
const DRAGON_SLIME_DRAW_Y_OFFSETS = [-0.1, 0.1];
const DRAGON_SLIME_HORN_OFFSET = vec2(0.2, 0.1);
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
// Gain when unicorn jump over slime.
const STUPID_SLIME_JUMP_GAIN = 1.2;
const STUPID_SLIME_ANIM_SPEED = 12;  // frame/sec
const STUPID_SLIME_PATROL_SPEED = 0.02;  // cells

class DragonSlime extends EngineObject {
  constructor(pos, velocity, lockTime) {
    const colliderSize = vec2(0.9, 0.9);
    super(pos, colliderSize, undefined, 0, new Color, RENDER_ORDER_CHARACTER);
    const res = createAsepriteResource(slimeAsepriteData, TEXTURE_INDEX_SLIME, ['body', 'wing']);
    const unicornRes = createAsepriteResource(unicornAsepriteData, TEXTURE_INDEX_UNICORN, ['body', 'head', 'horn']);
    this._frameInfoWing = res.wing;
    this._frameInfoBody = res.body;
    this._frameInfoHorn = unicornRes.horn;
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
    this._bossSlot = vec2();
    this._springHorizontal = new SpringDamping(this, 1, 0.06, 0.4, velocity, o => o.x, (o, v) => { o.x = v; });
    this._springVertical = new SpringDamping(this, 1, 0.06, 0.4, velocity, o => o.y, (o, v) => { o.y = v; });
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
  }

  render() {
    const currentFrame = this._currentFrame;
    const nextFrame = (currentFrame + 1) % DRAGON_SLIME_FRAME_COUNT;
    const framePercent = smoothStep(this._offsetFrame - currentFrame);
    const drawXOffset = lerp(DRAGON_SLIME_DRAW_X_OFFSETS[nextFrame], DRAGON_SLIME_DRAW_X_OFFSETS[currentFrame], framePercent)
      * (this.mirror ? -1 : 1);
    const drawYOffset = lerp(DRAGON_SLIME_DRAW_Y_OFFSETS[nextFrame], DRAGON_SLIME_DRAW_Y_OFFSETS[currentFrame], framePercent);
    const scaleY = 1;
    const drawPos = this.pos.add(vec2(drawXOffset, drawYOffset));
    if (currentFrame == 0) {
      drawAsepriteFrame(this._frameInfoWing[currentFrame], drawPos, scaleY, undefined, 0, this.mirror);
      drawAsepriteFrame(this._frameInfoBody[currentFrame], drawPos, scaleY, undefined, 0, this.mirror);
    } else {
      drawAsepriteFrame(this._frameInfoBody[currentFrame], drawPos, scaleY, undefined, 0, this.mirror);
      drawAsepriteFrame(this._frameInfoWing[currentFrame], drawPos, scaleY, undefined, 0, this.mirror);
    }
    if (this._hasHorn) {
      const hornPos = drawPos.add(DRAGON_SLIME_HORN_OFFSET.multiply(vec2(this._caughtSide, 1)));
      drawAsepriteFrame(this._frameInfoHorn[currentFrame], hornPos, scaleY, undefined, 0, this.mirror);
    }
  }

  setHasHorn(has) {
    this._hasHorn = has;
  }

  collideWithObject(o) {
    if (this._caughtObject) {
      return false;
    }
    if (o == player && o.velocity.y <= 0 && o.pos.y > this.pos.y) {
      o.groundObject = this;
      this.setTargetObject(o);
    }
    return true;
  }

  setTargetObject(o) {
    this._caughtObject = o;
    this._lockTimer.unset();
    this._fireLockY = undefined;
  }

  setBossSlot(pos) {
    this._bossSlot = pos;
  }

  // Input 0 to left, 1 to right.
  setFaceDir(toLeft) {
    this._caughtSide = toLeft * 2 - 1;
    this.mirror = this._caughtSide > 0;
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
    if (!this._caughtObject) {
      return;
    }
    if (this._stage == DRAGON_SLIME_STAGE_IDLE) {
      this._stage = DRAGON_SLIME_STAGE_LOCK;
    } else if (this._stage == DRAGON_SLIME_STAGE_LOCK) {
      const targetPos = this._getTargetPos();
      const motionTargetPos = targetPos;
      this._springHorizontal.update(motionTargetPos);
      this._springVertical.update(motionTargetPos);
      this._handleLock(targetPos);
    } else if (this._stage == DRAGON_SLIME_STAGE_FIRE) {
      const targetPos = this._getTargetPos();
      const motionTargetPos = vec2(targetPos.x, this._fireLockY);
      this._springHorizontal.update(motionTargetPos);
      this._springVertical.update(motionTargetPos);
      this._handleFire();
    }
  }

  _updateBossState() {
    this._springHorizontal.update(this._bossSlot);
    this._springVertical.update(this._bossSlot);
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
    const speed = DRAGON_SLIME_BEAM_SPEED * this._caughtSide;
    const dir = PRISM_TILE_DIR_RIGHT;
    new RainbowBeam(this.pos.copy().add(offset), this, speed, dir, DRAGON_SLIME_BEAM_DAMAGE, DRAGON_SLIME_BEAM_RANGE);
  }
}

class StupidSlime extends EngineObject {
  constructor(pos, patrolSight = 0) {
    const colliderSize = vec2(0.9, 0.9);
    const anim = tile(0, 16, TEXTURE_INDEX_SLIME, 0);
    super(pos, colliderSize, anim, 0, new Color, RENDER_ORDER_CHARACTER);
    this._frameTimer = new Timer(1.0 / STUPID_SLIME_ANIM_SPEED);
    this._currentFrame = 0;
    this._scaleOffsetY = [1.0, 0.9, 0.8, 0.7, 0.7, 0.8, 0.9, 1.0];
    this._patrolSight = patrolSight;
    this._patrolCenterX = pos.x;
    this._patrolTargetX = pos.x + patrolSight;
    this.mirror = false;
    this.mass = 1;
    this.damping = 1;
    this.friction = 1;
    this.setCollision();
  }

  update() {
    this._updatePatrol();
    super.update();
    if (this.pos.y < -this.size.y) {
      this.destroy();
      return;
    }
    if (this._frameTimer.elapsed()) {
      this._frameTimer.set(1.0 / STUPID_SLIME_ANIM_SPEED);
      this._currentFrame = (this._currentFrame + 1) % this._scaleOffsetY.length;
    }
  }

  render() {
    const size = vec2(this.size.x, this.size.y * this._scaleOffsetY[this._currentFrame]);
    const pos = this.pos.add(vec2(0, (size.y - this.size.y) / 2));
    drawTile(pos, size, this.tileInfo, this.color, this.angle, this.mirror);
  }

  get_jump_gain() {
    return STUPID_SLIME_JUMP_GAIN;
  }

  _updatePatrol() {
    this.color = new Color;
    if (!this._patrolSight) {
      this.velocity.x = 0;
      return;
    }
    const move = this._updateMoveToTarget(this._patrolTargetX, STUPID_SLIME_PATROL_SPEED);
    if (move.reached || move.blocked || move.cliff) {
      this._patrolTargetX = this._patrolTargetX == this._patrolCenterX + this._patrolSight ?
        this._patrolCenterX - this._patrolSight :
        this._patrolCenterX + this._patrolSight;
    }
  }

  _updateMoveToTarget(targetX, speed) {
    const direction = sign(targetX - this.pos.x) || (this.mirror ? 1 : -1) || 1;
    const nextPos = this.pos.add(vec2(direction * speed, 0));
    const nextFootY = this.pos.y - this.size.y / 2 - .01;
    const nextFootX = nextPos.x + direction * this.size.x / 2;
    const blocked = engineObjectsRaycast(this.pos, nextPos).some(o =>
      o != this && o.mass && o.collideSolidObjects && o.isSolid);
    const cliff = !getTileCollisionData(vec2(nextFootX, nextFootY));
    const reached = abs(this.pos.x - targetX) <= speed;
    this.velocity.x = blocked || cliff ? 0 : reached ? targetX - this.pos.x : direction * speed;
    this.mirror = direction > 0;
    return { blocked, cliff, reached };
  }
}

class DragonSpawnPoint extends EngineObject {
  constructor(pos) {
    super(pos);
    this.gravityScale = 0.0;
    this.setCollision(false, false, false, false);
  }
}
