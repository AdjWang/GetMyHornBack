'use strict';

const DRAGON_SLIME_ANIM_SPEED = 4;  // frame/sec
const DRAGON_SLIME_FRAME_COUNT = 2;
const DRAGON_SLIME_DRAW_X_OFFSETS = [0.3, 0.3];
const DRAGON_SLIME_DRAW_Y_OFFSETS = [-0.1, 0.1];
const DRAGON_SLIME_ATTACK_DISTANCE = 11;
const DRAGON_SLIME_LOCK_DISTANCE = 0.5;
const DRAGON_SLIME_LOCK_TIME = 0.6;
const DRAGON_SLIME_VELOCITY = vec2(0.2, 0.05);
const DRAGON_SLIME_STAGE_LOCK = 0;
const DRAGON_SLIME_STAGE_FIRE = 1;
// Gain when unicorn jump over slime.
const DASH_SLIME_JUMP_GAIN = 1.2;
const DASH_SLIME_ANIM_SPEED = 12;  // frame/sec
const DASH_SLIME_STATE_PATROL = 0;
const DASH_SLIME_STATE_MANIFEST = 1;
const DASH_SLIME_STATE_DASH = 2;
const DASH_SLIME_MANIFEST_TIME = 0.33;
const DASH_SLIME_DASH_SPEED = 0.28;
const DASH_SLIME_PATROL_SPEED = 0.02;  // cells
const DASH_SLIME_DASH_MAX_DISTANCE = 4;
const DASH_SLIME_HIT_KNOCKBACK_CELLS = 6;
const DASH_SLIME_SIGHT_HEIGHT = 0.95;
const DASH_SLIME_HINT_COLOR = new Color(1, 0.45, 0.45);
const DASH_SLIME_GHOST_COUNT = 5;
const DASH_SLIME_GHOST_ALPHA = 0.45;
const JUMP_SLIME_TIME = 1.2;
const JUMP_SLIME_HEIGHT = 3.0;

class DragonSlime extends EngineObject {
  constructor(pos) {
    const colliderSize = vec2(0.9, 0.9);
    super(pos, colliderSize, undefined, 0, new Color, RENDER_ORDER_CHARACTER);
    const res = createAsepriteResource(slimeAsepriteData, TEXTURE_INDEX_SLIME, ['body', 'wing']);
    this._frameInfoWing = res.wing;
    this._frameInfoBody = res.body;
    this._currentFrame = 0;
    this._offsetFrame = 0;
    this._frameTimer = new Timer(1.0 / DRAGON_SLIME_ANIM_SPEED);
    this._caughtObject = undefined;
    this._caughtSide = 1;
    this._stage = DRAGON_SLIME_STAGE_LOCK;
    this._lockTimer = new Timer;
    this._lockTimer.unset();
    this._laser = undefined;
    this._fireLockY = undefined;
    this._springHorizontal = new SpringDamping(this, 1, 0.06, 0.4, DRAGON_SLIME_VELOCITY, o => o.x, (o, v) => { o.x = v; });
    this._springVertical = new SpringDamping(this, 1, 0.06, 0.4, DRAGON_SLIME_VELOCITY, o => o.y, (o, v) => { o.y = v; });
    this.gravityScale = 0.0;
    this.mirror = true;
    this.mass = 0;
    this.damping = 1;
    this.friction = 1;
    this.setCollision(true, true, false);
  }

  update() {
    if (this._caughtObject) {
      const lockTargetPos = this._getTargetPos();
      const motionTargetPos = this._stage == DRAGON_SLIME_STAGE_FIRE && this._fireLockY !== undefined ?
        vec2(lockTargetPos.x, this._fireLockY) :
        lockTargetPos;
      this._springHorizontal.update(motionTargetPos);
      this._springVertical.update(motionTargetPos);
      if (this._stage == DRAGON_SLIME_STAGE_LOCK) {
        if (this._isLockTarget(lockTargetPos)) {
          if (!this._lockTimer.isSet()) {
            this._lockTimer.set(DRAGON_SLIME_LOCK_TIME);
          }
        } else {
          this._lockTimer.unset();
        }
        if (this._lockTimer.elapsed()) {
          this._stage = DRAGON_SLIME_STAGE_FIRE;
          this._lockTimer.unset();
          this._fireLockY = this.pos.y;
          this._fireLaser();
        }
      } else if (this._stage == DRAGON_SLIME_STAGE_FIRE) {
        if (!this._isFiring()) {
          this._laser = undefined;
          this._stage = DRAGON_SLIME_STAGE_LOCK;
          this._fireLockY = undefined;
        }
      }
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
  }

  collideWithObject(o) {
    if (this._caughtObject) {
      return false;
    }
    if (o == player && o.velocity.y <= 0 && o.pos.y > this.pos.y) {
      o.groundObject = this;
      this._setTargetObject(o);
    }
    return true;
  }

  _setTargetObject(o) {
    this._caughtObject = o;
    this._stage = DRAGON_SLIME_STAGE_LOCK;
    this._lockTimer.unset();
    this._fireLockY = undefined;
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
    return this._laser && !this._laser.destroyed;
  }

  _fireLaser() {
    const LASER_CHARGE_TIME = 1.0;
    const LASER_FIRE_TIME = 0.14;
    this._laser = new Laser(this.pos.copy(), this._caughtSide * VIEW_WIDTH * 2,
      LASER_CHARGE_TIME, LASER_FIRE_TIME);
    this.addChild(this._laser, vec2());
  }
}

class DashSlime extends EngineObject {
  constructor(pos, patrolSight = 0, dashSight = 0) {
    const colliderSize = vec2(0.9, 0.9);
    const anim = tile(0, 16, TEXTURE_INDEX_SLIME, 0);
    super(pos, colliderSize, anim, 0, new Color, RENDER_ORDER_CHARACTER);
    this._frameTimer = new Timer(1.0 / DASH_SLIME_ANIM_SPEED);
    this._manifestTimer = new Timer;
    this._currentFrame = 0;
    this._scaleOffsetY = [1.0, 0.9, 0.8, 0.7, 0.7, 0.8, 0.9, 1.0];
    this._patrolSight = patrolSight;
    this._dashSight = dashSight;
    this._state = DASH_SLIME_STATE_PATROL;
    this._caughtObject = undefined;
    this._caughtPos = undefined;
    this._dashDirection = 0;
    this._patrolCenterX = pos.x;
    this._patrolTargetX = pos.x + patrolSight;
    this._ghostTrail = new GhostTrail(DASH_SLIME_GHOST_COUNT, DASH_SLIME_GHOST_ALPHA);
    this.mirror = false;
    this.mass = 1;
    this.damping = 1;
    this.friction = 1;
    this.setCollision();
  }

  update() {
    this._updateBehavior();
    super.update();
    if (this.pos.y < -this.size.y) {
      this.destroy();
      return;
    }
    if (this._frameTimer.elapsed()) {
      this._frameTimer.set(1.0 / DASH_SLIME_ANIM_SPEED);
      this._currentFrame = (this._currentFrame + 1) % this._scaleOffsetY.length;
    }
  }

  render() {
    const size = vec2(this.size.x, this.size.y * this._scaleOffsetY[this._currentFrame]);
    const pos = this.pos.add(vec2(0, (size.y - this.size.y) / 2));
    drawTile(pos, size, this.tileInfo, this.color, this.angle, this.mirror);
  }

  destroy() {
    this._ghostTrail.destroy();
    super.destroy();
  }

  collideWithObject(o) {
    if (this._state == DASH_SLIME_STATE_DASH && o != this._caughtObject && o.mass) {
      this._caughtObject = o;
    }
    if (this._state == DASH_SLIME_STATE_DASH && o == this._caughtObject) {
      this._hitCaughtObject(o);
      return false;
    }
    return true;
  }

  get_jump_gain() {
    return DASH_SLIME_JUMP_GAIN;
  }

  _updateBehavior() {
    if (this._state == DASH_SLIME_STATE_PATROL) {
      this.color = new Color;
      if (!this._patrolSight && !this._dashSight) {
        this.velocity.x = 0;
        return;
      }
      const caughtObject = this._getCaughtObject();
      if (caughtObject) {
        this._caughtObject = caughtObject;
        this._caughtPos = caughtObject.pos.copy();
        this._faceTargetX(this._caughtPos.x);
      this._manifestTimer.set(DASH_SLIME_MANIFEST_TIME);
        this._state = DASH_SLIME_STATE_MANIFEST;
        return;
      }
      const move = this._updateMoveToTarget(this._patrolTargetX, DASH_SLIME_PATROL_SPEED);
      if (move.blocked || move.cliff) {
        this._patrolTargetX = this._patrolTargetX == this._patrolCenterX + this._patrolSight ?
          this._patrolCenterX - this._patrolSight :
          this._patrolCenterX + this._patrolSight;
      }
      return;
    }
      if (this._state == DASH_SLIME_STATE_MANIFEST) {
      this.color = DASH_SLIME_HINT_COLOR;
      this.velocity.x = 0;
      if (this._manifestTimer.elapsed()) {
        this._startDash();
      }
      return;
    }
    if (this._state == DASH_SLIME_STATE_DASH) {
      this.color = new Color;
      if (!this._caughtPos) {
        this._resetGuard();
        return;
      }
      const move = this._updateMoveToTarget(this._caughtPos.x, DASH_SLIME_DASH_SPEED);
      if (move.blocked) {
        this._hitCaughtObject(this._caughtObject);
        return;
      }
      if (move.cliff) {
        this._resetGuard();
        return;
      }
      if (move.reached) {
        this.pos.x = this._caughtPos.x;
        this._resetGuard();
      }
    }
  }

  _getCaughtObject() {
    if (!this._dashSight) {
      return undefined;
    }
    const sightSize = vec2(this._dashSight, DASH_SLIME_SIGHT_HEIGHT);
    const leftSightPos = this.pos.add(vec2(-(this.size.x + this._dashSight) / 2, 0));
    const rightSightPos = this.pos.add(vec2((this.size.x + this._dashSight) / 2, 0));
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
    this._caughtPos.x = clamp(this._caughtPos.x,
      this.pos.x - DASH_SLIME_DASH_MAX_DISTANCE,
      this.pos.x + DASH_SLIME_DASH_MAX_DISTANCE);
    this._dashDirection = sign(this._caughtPos.x - this.pos.x) || (this.mirror ? 1 : -1);
    this._faceTargetX(this._caughtPos.x);
    this.velocity.x = 0;
    this._ghostTrail.attach(this);
    this._state = DASH_SLIME_STATE_DASH;
  }

  _updateMoveToTarget(targetX, speed) {
    const direction = sign(targetX - this.pos.x) || (this.mirror ? 1 : -1) || 1;
    const nextPos = this.pos.add(vec2(direction * speed, 0));
    const nextFootY = this.pos.y - this.size.y / 2 - .01;
    const nextFootX = nextPos.x + direction * this.size.x / 2;
    const blocked = engineObjectsRaycast(this.pos, nextPos).some(o =>
      o != this && o != this._caughtObject && o.mass && o.collideSolidObjects && o.isSolid);
    const cliff = !getTileCollisionData(vec2(nextFootX, nextFootY));
    const reached = abs(this.pos.x - targetX) <= speed;
    this.velocity.x = blocked || cliff ? 0 : reached ? targetX - this.pos.x : direction * speed;
    this.mirror = direction > 0;
    return { blocked, cliff, reached };
  }

  _hitCaughtObject(o) {
    const verticalDelta = abs(o.pos.y - this.pos.y);
    const verticalThreshold = this.size.y / 2 - this.size.y * 0.05;
    if (o.takeKnockback && verticalDelta < verticalThreshold) {
      const forceDirection = sign(o.pos.x - this.pos.x) || sign(this.velocity.x) || 1;
      o.takeKnockback(forceDirection * DASH_SLIME_HIT_KNOCKBACK_CELLS);
    }
    this._resetGuard();
  }

  _faceTargetX(targetX) {
    this.mirror = targetX > this.pos.x;
  }

  _resetGuard() {
    this.velocity.x = 0;
    this.color = new Color;
    this._caughtObject = undefined;
    this._caughtPos = undefined;
    this._dashDirection = 0;
    this._patrolTargetX = this._patrolCenterX + this._patrolSight;
    this._ghostTrail.detach();
    this._state = DASH_SLIME_STATE_PATROL;
  }
}

class JumpSlime extends EngineObject {
  constructor(pointA, pointB, timeGap = 1.0) {
    const colliderSize = vec2(0.9, 0.9);
    const anim = tile(0, 16, TEXTURE_INDEX_SLIME, 0);
    super(pointA, colliderSize, anim, 0, new Color, RENDER_ORDER_CHARACTER);
    this._pointA = pointA.copy();
    this._pointB = pointB.copy();
    this._from = this._pointA;
    this._to = this._pointB;
    this._timeGap = timeGap;
    this._waitTimer = new Timer(timeGap);
    this._jumpTimer = new Timer;
    this._jumpTimer.unset();
    this._jumping = false;
    this.mirror = this._pointB.x > this._pointA.x;
    this.mass = 0;
    this.damping = 1;
    this.friction = 1;
    this.gravityScale = 0;
    this.setCollision(true, true, false);
  }

  update() {
    const oldPos = this.pos.copy();
    if (this._jumping) {
      this._updateJump();
    } else if (this._waitTimer.elapsed()) {
      this._startJump();
    }
    this.velocity = this.pos.subtract(oldPos);
  }

  collideWithObject(o) {
    if (o == player && o.velocity.y <= 0 && o.pos.y > this.pos.y) {
      o.groundObject = this;
    }
    return true;
  }

  _startJump() {
    this._jumping = true;
    this._jumpTimer.set(JUMP_SLIME_TIME);
    this.mirror = this._to.x > this._from.x;
  }

  _updateJump() {
    const p = clamp(this._jumpTimer.getPercent(), 0, 1);
    this.pos = this._from.lerp(this._to, p);
    this.pos.y += JUMP_SLIME_HEIGHT * 4 * p * (1 - p);
    if (this._jumpTimer.elapsed()) {
      this.pos = this._to.copy();
      const nextFrom = this._to;
      this._to = this._from;
      this._from = nextFrom;
      this._jumping = false;
      this._waitTimer.set(this._timeGap);
    }
  }
}
