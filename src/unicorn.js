'use strict';

// Size of single frame.
const UNICORN_WIDTH = 21;  // pixels
const UNICORN_HEIGHT = 24;  // pixels

// Motion.
const UNICORN_MAX_SPEED_X = 0.22;
const UNICORN_MAX_SPEED_Y = 0.5;
const UNICORN_AIR_IMPULSE = 0.04;
const UNICORN_GROUND_IMPULSE = 0.08;
const UNICORN_AIR_DAMPING = 0.15;
const UNICORN_GROUND_DAMPING = 0.3;
const UNICORN_JUMP_INITIAL_SPEED = 0.3;
// Reach peak earlier if player release jump button.
const UNICORN_JUMP_RELEASE_DAMPING = 0.5;
// Tricks.
// https://www.maddymakesgames.com/articles/celeste_and_forgiveness/index.html
const UNICORN_JUMP_BUFFER_TIME = 0.12;
const UNICORN_COYOTE_TIME = 0.10;
const UNICORN_JUMP_PEAK_GRAVITY_SCALE = 0.5;
const UNICORN_JUMP_PEAK_SPEED = 0.02;
// Correct x axis pos if not aligned.
// Movement overall speed is way more faster than jump speed, therefore leave
// larger breath room for correction.
const UNICORN_AIR_CORNER_HORIZONTAL_CORRECTION_MAX = 0.5;
const UNICORN_AIR_CORNER_HORIZONTAL_CORRECTION_STEP = 0.05;
// Correct y axis pos if not aligned.
const UNICORN_AIR_CORNER_VERTICAL_CORRECTION_MAX = 0.3;
const UNICORN_AIR_CORNER_VERTICAL_CORRECTION_STEP = 0.03;
const UNICORN_FIRE_COOLDOWN = 0.8;

// Animation.
const UNICORN_DRAW_OFFSET = vec2(0.1, 0.3);
// Head bob animation.
const UNICORN_IDLE_HEAD_BOB_OFFSET = -0.03;
const UNICORN_IDLE_HEAD_BOB_AMPLIFY = 0.03;
const UNICORN_IDLE_HEAD_BOB_SPEED = 8;
// When running, use zero bob offset.
const UNICORN_RUN_HEAD_BOB_AMPLIFY = 0.06;
const UNICORN_RUN_HEAD_BOB_SPEED = 16;
// Slightly rotate body when running to make it looks weight.
const UNICORN_RUN_ROTATE_ANGLE = 0.22;
// Stretch when running to make it looks dynamic.
const UNICORN_RUN_SCALE_Y_AMPLIFY = 0.02;
// Stretch when jumping to make it looks dynamic.
const UNICORN_JUMP_AIR_SCALE_Y = 1.12;
const UNICORN_LAND_SCALE_TIME = 0.25;
const UNICORN_LAND_SHRINK_SCALE_Y = 0.86;

const UNICORN_ANIM_STATE_IDLE = 0;
const UNICORN_ANIM_STATE_RUN = 1;
const UNICORN_ANIM_STATE_JUMP = 2;
const UNICORN_FRAME_INDEX_IDLE = 0;
const UNICORN_FRAME_INDEX_JUMP = 0;
const UNICORN_FRAME_INDEX_RUN = 1;
const UNICORN_FRAME_COUNT_RUN = 2;
const UNICORN_ANIM_RUN_SPEED = 8;  // frame/sec

class Unicorn extends EngineObject {
  constructor(pos) {
    const colliderSize = vec2(0.9, 0.9);
    super(pos, colliderSize);
    this.mirror = false;
    this._frameInfoHead = unicornResource.head;
    this._frameInfoBody = unicornResource.body;
    this._frameInfoBag = unicornResource.bag;
    this._moveX = 0;
    this._moveY = 0;
    this._lastMoveX = 1;
    this._wasGrounded = false;
    this._jumpBufferTimer = new Timer;
    this._coyoteTimer = new Timer;
    // When jump with 0 initial speed with corner correction, the correction
    // stops object after correcting instead of perform jumping. Use this flag
    // to restore jump.
    this._jumpNeedsCornerRestore = false;
    this._animState = UNICORN_ANIM_STATE_IDLE;
    this._runFrame = UNICORN_FRAME_INDEX_IDLE;
    this._runFrameTimer = new Timer(1.0 / UNICORN_ANIM_RUN_SPEED);
    this._landScaleTimer = new Timer;
    this._fireCooldownTimer = new Timer(0);
    this.damping = 1;
    this.friction = 1;
    this.setCollision();

    const dustGrey = 0.8;
    this._jumpDustEmitter = new ParticleEmitter(
      vec2(),               // position
      70 * PI / 180,        // angle
      0.1,                  // emitSize
      0.08,                 // emitTime
      24,                   // emitRate
      15 * PI / 180,        // emitConeAngle
      undefined,            // tileInfo
      new Color(1, 1, 1),   // colorStartA
      new Color(1, 1, 1),   // colorStartB
      new Color(dustGrey, dustGrey, dustGrey),     // colorEndA
      new Color(dustGrey, dustGrey, dustGrey),     // colorEndB
      0.28,                 // particleTime
      0.12,                 // sizeStart
      0.08,                 // sizeEnd
      0.1,                  // speed
      0.1,                  // angleSpeed
      0.9,                  // damping
      0.9,                  // angleDamping
      0.0,                  // gravityScale
      0,                    // particleConeAngle
      0.9,                  // fadeRate
      0.2,                  // randomness
      false,                // collideTiles
      false                 // additive
    );
  }

  update() {
    // Update motion before updating physic.
    this._updateMotion();
    this._updateAirCornerCorrection();
    super.update();
    this._updateJumpCornerRestoreState();
    this._updateBufferedJump();
    this._updateFire();
    this._updateAnim();
  }

  render() {
    const runCycle = Math.sin(time * UNICORN_RUN_HEAD_BOB_SPEED);
    const headBob = this._animState == UNICORN_ANIM_STATE_IDLE ?
      Math.sin(time * UNICORN_IDLE_HEAD_BOB_SPEED) * UNICORN_IDLE_HEAD_BOB_AMPLIFY + UNICORN_IDLE_HEAD_BOB_OFFSET :
      this._animState == UNICORN_ANIM_STATE_RUN ?
        runCycle * UNICORN_RUN_HEAD_BOB_AMPLIFY : 0;
    const headPos = this.pos.add(vec2(0, headBob));
    const runRotate = this._animState == UNICORN_ANIM_STATE_RUN ?
      this._lastMoveX * UNICORN_RUN_ROTATE_ANGLE : 0;
    const runScaleY = this._animState == UNICORN_ANIM_STATE_RUN ?
      1 + runCycle * UNICORN_RUN_SCALE_Y_AMPLIFY : 1;
    const drawOffset = vec2(UNICORN_DRAW_OFFSET.x * (this.mirror ? -1.0 : 1.0), UNICORN_DRAW_OFFSET.y);
    const drawSize = vec2(UNICORN_WIDTH / TILE_SIZE, UNICORN_HEIGHT / TILE_SIZE);
    const drawSizeStretch = vec2(drawSize.x, drawSize.y * runScaleY * this._getJumpScaleY());
    const scaleAnchorOffset = vec2(0, (drawSizeStretch.y - drawSize.y) / 2);
    const drawPos = this.pos.add(scaleAnchorOffset);
    drawAsepriteFrame(this._frameInfoHead[this._runFrame], headPos.add(scaleAnchorOffset).add(drawOffset), runScaleY * this._getJumpScaleY(), undefined, runRotate, this.mirror);
    drawAsepriteFrame(this._frameInfoBody[this._runFrame], drawPos.add(drawOffset), runScaleY * this._getJumpScaleY(), undefined, runRotate, this.mirror);
    drawAsepriteFrame(this._frameInfoBag[this._runFrame], drawPos.add(drawOffset), 1, undefined, runRotate, this.mirror);
  }

  _updateMotion() {
    const leftDown = keyIsDown(INPUT_KEY_LEFT);
    const rightDown = keyIsDown(INPUT_KEY_RIGHT);
    const upDown = keyIsDown(INPUT_KEY_UP);
    const downDown = keyIsDown(INPUT_KEY_DOWN);
    const left = leftDown ? 1 : 0;
    const right = rightDown ? 1 : 0;
    const up = upDown ? 1 : 0;
    const down = downDown ? 1 : 0;
    if (keyWasPressed(INPUT_KEY_LEFT)) {
      this._lastMoveX = -1;
    }
    if (keyWasPressed(INPUT_KEY_RIGHT)) {
      this._lastMoveX = 1;
    }
    this._moveX = rightDown && leftDown ? this._lastMoveX : right - left;
    this._moveY = up - down;

    const jumpPressed = keyWasPressed(INPUT_KEY_UP);
    const jumpReleased = keyWasReleased(INPUT_KEY_UP);
    const jumpHeld = upDown;
    const grounded = !!this.groundObject;
    if (grounded) {
      this._coyoteTimer.set(UNICORN_COYOTE_TIME);
    }
    const impulse = grounded ? UNICORN_GROUND_IMPULSE : UNICORN_AIR_IMPULSE;
    const damping = grounded ? UNICORN_GROUND_DAMPING : UNICORN_AIR_DAMPING;
    this.velocity.x = this.velocity.x * (1.0 - damping) + this._moveX * impulse;
    this.velocity.x = clamp(this.velocity.x, -UNICORN_MAX_SPEED_X, UNICORN_MAX_SPEED_X);
    if (jumpPressed && (grounded || this._coyoteTimer.active())) {
      this._startJump(false);
    }
    else if (jumpPressed) {
      this._jumpBufferTimer.set(UNICORN_JUMP_BUFFER_TIME);
    }
    if (jumpReleased && this.velocity.y > 0) {
      this.velocity.y *= 1.0 - UNICORN_JUMP_RELEASE_DAMPING;
    }
    if (jumpReleased) {
      this._jumpBufferTimer.unset();
    }
    this.gravityScale = jumpHeld && !grounded && abs(this.velocity.y) < UNICORN_JUMP_PEAK_SPEED ?
      UNICORN_JUMP_PEAK_GRAVITY_SCALE : 1;
    if (this._moveX) {
      this.mirror = this._moveX > 0;
    }
    this.velocity.y = clamp(this.velocity.y, -UNICORN_MAX_SPEED_Y, UNICORN_MAX_SPEED_Y);
  }

  _updateAirCornerCorrection() {
    if (this.groundObject) {
      return;
    }
    this._updateMoveCornerCorrection();
    this._updateJumpCornerCorrection();
  }

  _isTileBlockedAt(pos) {
    const tileData = getTileCollisionData(pos);
    return tileData && this.collideWithTile(tileData, pos);
  }

  _updateMoveCornerCorrection() {
    // Use direction moving or intend to move.
    const horizontalMoveDirection = sign(this.velocity.x) || this._moveX;
    if (!horizontalMoveDirection) {
      return;
    }
    const epsilon = .001;
    const horizontalMove = this.velocity.x ||
      horizontalMoveDirection * UNICORN_AIR_CORNER_VERTICAL_CORRECTION_MAX;
    const cornerX = this.pos.x + horizontalMove + horizontalMoveDirection * this.size.x / 2;
    const topY = this.pos.y + this.size.y / 2 - epsilon;
    const bottomY = this.pos.y - this.size.y / 2 + epsilon;
    const topBlocked = this._isTileBlockedAt(vec2(cornerX, topY));
    const bottomBlocked = this._isTileBlockedAt(vec2(cornerX, bottomY));
    if (!topBlocked && !bottomBlocked || topBlocked && bottomBlocked) {
      return;
    }
    const verticalCorrectionDirections = topBlocked ? [-1] : [1];
    for (let offset = UNICORN_AIR_CORNER_VERTICAL_CORRECTION_STEP;
      offset <= UNICORN_AIR_CORNER_VERTICAL_CORRECTION_MAX;
      offset += UNICORN_AIR_CORNER_VERTICAL_CORRECTION_STEP) {
      for (const verticalDirection of verticalCorrectionDirections) {
        const correctedY = this.pos.y + offset * verticalDirection;
        const correctedPos = vec2(this.pos.x, correctedY);
        const correctedNextPos = vec2(this.pos.x + horizontalMove, correctedY);
        if (!tileCollisionTest(correctedPos, this.size, this) &&
          !tileCollisionTest(correctedNextPos, this.size, this)) {
          this.pos.y = correctedY;
          return;
        }
      }
    }
  }

  _updateJumpCornerCorrection() {
    // Use direction moving or intend to move.
    const verticalMoveDirection = (this.velocity.y > 0.0 ? 1 : 0) || this._moveY;
    if (!verticalMoveDirection) {
      return;
    }
    const epsilon = .001;
    const verticalMove = this.velocity.y ||
      verticalMoveDirection * UNICORN_AIR_CORNER_HORIZONTAL_CORRECTION_MAX;
    const cornerY = this.pos.y + verticalMove + verticalMoveDirection * this.size.y / 2;
    const leftX = this.pos.x - this.size.x / 2 + epsilon;
    const rightX = this.pos.x + this.size.x / 2 - epsilon;
    const leftBlocked = this._isTileBlockedAt(vec2(leftX, cornerY));
    const rightBlocked = this._isTileBlockedAt(vec2(rightX, cornerY));
    if (!leftBlocked && !rightBlocked || leftBlocked && rightBlocked) {
      return;
    }
    const horizontalCorrectionDirections = leftBlocked ? [1] : [-1];
    for (let offset = UNICORN_AIR_CORNER_HORIZONTAL_CORRECTION_STEP;
      offset <= UNICORN_AIR_CORNER_HORIZONTAL_CORRECTION_MAX;
      offset += UNICORN_AIR_CORNER_HORIZONTAL_CORRECTION_STEP) {
      for (const horizontalDirection of horizontalCorrectionDirections) {
        const correctedX = this.pos.x + offset * horizontalDirection;
        const correctedPos = vec2(correctedX, this.pos.y);
        const correctedNextPos = vec2(correctedX, this.pos.y + verticalMove);
        if (!tileCollisionTest(correctedPos, this.size, this) &&
          !tileCollisionTest(correctedNextPos, this.size, this)) {
          this.pos.x = correctedX;
          const restoreJump = verticalMoveDirection > 0 && this.velocity.y <= 0 &&
            (this._jumpBufferTimer.active() || this._jumpNeedsCornerRestore);
          if (restoreJump) {
            this._startJump(false);
          }
          return;
        }
      }
    }
  }

  _updateJumpCornerRestoreState() {
    if (!this._jumpNeedsCornerRestore) {
      return;
    }
    if (this.velocity.y != 0 || !keyIsDown(INPUT_KEY_UP)) {
      this._jumpNeedsCornerRestore = false;
    }
  }

  _updateBufferedJump() {
    if (!this._jumpBufferTimer.active() || !this.groundObject) {
      return;
    }
    this._startJump(true);
  }

  _startJump(clearGroundObject) {
    this.velocity.y = UNICORN_JUMP_INITIAL_SPEED;
    this._jumpNeedsCornerRestore = true;
    if (clearGroundObject) {
      this.groundObject = 0;
    }
    this._jumpBufferTimer.unset();
    this._coyoteTimer.unset();
    this._emitDust();
  }

  _updateFire() {
    const fireDown = keyIsDown(INPUT_KEY_FIRE);
    if (!fireDown || !this._fireCooldownTimer.elapsed()) {
      return;
    }
    this._fireCooldownTimer.set(UNICORN_FIRE_COOLDOWN);
    const bulletVelocity = vec2(0.5 * (this.mirror ? 1.0 : -1.0), 0.2);
    const damage = 1;
    new Bullet(this.pos.add(vec2(0.0, -0.2)), this.parent, bulletVelocity, damage);
  }

  _updateAnim() {
    const grounded = !!this.groundObject;
    if (grounded && !this._wasGrounded) {
      // Just landed.
      this._landScaleTimer.set(UNICORN_LAND_SCALE_TIME);
      this._emitDust();
    }
    this._wasGrounded = grounded;

    if (!grounded) {
      this._animState = UNICORN_ANIM_STATE_JUMP;
      this._runFrame = UNICORN_FRAME_INDEX_JUMP;
      return;
    }

    this._animState = abs(this.velocity.x) > .01 ? UNICORN_ANIM_STATE_RUN : UNICORN_ANIM_STATE_IDLE;
    if (this._animState == UNICORN_ANIM_STATE_IDLE) {
      this._runFrame = UNICORN_FRAME_INDEX_IDLE;
      return;
    }

    if (this._runFrame < UNICORN_FRAME_INDEX_RUN) {
      this._runFrame = UNICORN_FRAME_INDEX_RUN;
    }
    else if (this._runFrameTimer.elapsed()) {
      this._runFrameTimer.set(1.0 / UNICORN_ANIM_RUN_SPEED);
      this._runFrame = UNICORN_FRAME_INDEX_RUN +
        (this._runFrame - UNICORN_FRAME_INDEX_RUN + 1) % UNICORN_FRAME_COUNT_RUN;
    }
  }

  _getJumpScaleY() {
    if (this._landScaleTimer.active()) {
      const p = smoothStep(this._landScaleTimer.getPercent());
      return lerp(UNICORN_LAND_SHRINK_SCALE_Y, 1, p);
    }
    return this._animState == UNICORN_ANIM_STATE_JUMP ? UNICORN_JUMP_AIR_SCALE_Y : 1;
  }

  _emitDust() {
    const footPos = vec2(this.pos.x, this.pos.y - this.size.y / 2);
    this._jumpDustEmitter.pos = footPos;
    const emitCount = 3;
    for (let i = 0; i < emitCount; i++) {
      this._jumpDustEmitter.emitParticle();
    }
    this._jumpDustEmitter.angle = -this._jumpDustEmitter.angle;
    for (let i = 0; i < emitCount; i++) {
      this._jumpDustEmitter.emitParticle();
    }
  }
}
