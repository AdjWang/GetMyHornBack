'use strict';

// Size of single frame.
const UNICORN_WIDTH = 21;  // pixels
const UNICORN_HEIGHT = 24;  // pixels

// Motion.
const UNICORN_MAX_SPEED_X = 0.22;
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

// Animation.
const UNICORN_DRAW_OFFSET = vec2(0.1, 0.3)
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

class Unicorn extends EngineObject {
  #ANIM_STATE_IDLE = 0;
  #ANIM_STATE_RUN = 1;
  #ANIM_STATE_JUMP = 2;

  #FRAME_INDEX_IDLE = 0;
  #FRAME_INDEX_JUMP = 0;
  #FRAME_INDEX_RUN = 1;
  #FRAME_COUNT_RUN = 2;
  #ANIM_RUN_SPEED = 8;  // frame/sec

  #frameInfoHead;
  #frameInfoBody;
  #frameInfoBag;

  // Motion.
  #moveX = 0;
  #moveY = 0;
  #lastMoveX = 1;
  #wasGrounded = false;
  #jumpBufferTimer = new Timer;
  #coyoteTimer = new Timer;

  // Animation.
  #animState = this.#ANIM_STATE_IDLE;
  #runFrame = this.#FRAME_INDEX_IDLE;
  #runFrameTimer = new Timer(1.0 / this.#ANIM_RUN_SPEED);
  #landScaleTimer = new Timer;

  constructor(pos) {
    const colliderSize = vec2(0.9, 0.9);
    const frameSize = vec2(UNICORN_WIDTH, UNICORN_HEIGHT);
    super(pos, colliderSize);
    this.#frameInfoHead = tile(0, frameSize, 1);
    this.#frameInfoBody = tile(0, frameSize, 2);
    this.#frameInfoBag = tile(0, frameSize, 3);
    this.damping = 1;
    this.friction = 1;
    this.setCollision();
  }

  update() {
    // Update motion before updating physic.
    this.#updateMotion();
    this.#updateAirCornerCorrection();
    super.update();
    this.#updateBufferedJump();
    this.#updateAnim();
  }

  #updateMotion() {
    const leftDown = keyIsDown(INPUT_KEY_LEFT);
    const rightDown = keyIsDown(INPUT_KEY_RIGHT);
    const upDown = keyIsDown(INPUT_KEY_UP);
    const downDown = keyIsDown(INPUT_KEY_DOWN);
    const left = leftDown ? 1 : 0;
    const right = rightDown ? 1 : 0;
    const up = upDown ? 1 : 0;
    const down = downDown ? 1 : 0;
    if (keyWasPressed(INPUT_KEY_LEFT)) {
      this.#lastMoveX = -1;
    }
    if (keyWasPressed(INPUT_KEY_RIGHT)) {
      this.#lastMoveX = 1;
    }
    this.#moveX = rightDown && leftDown ? this.#lastMoveX : right - left;
    this.#moveY = up - down;

    const jumpPressed = keyWasPressed(INPUT_KEY_UP);
    const jumpReleased = keyWasReleased(INPUT_KEY_UP);
    const jumpHeld = upDown;
    const grounded = !!this.groundObject;
    if (grounded) {
      this.#coyoteTimer.set(UNICORN_COYOTE_TIME);
    }
    const impulse = grounded ? UNICORN_GROUND_IMPULSE : UNICORN_AIR_IMPULSE;
    const damping = grounded ? UNICORN_GROUND_DAMPING : UNICORN_AIR_DAMPING;
    this.velocity.x = this.velocity.x * (1.0 - damping) + this.#moveX * impulse;
    this.velocity.x = clamp(this.velocity.x, -UNICORN_MAX_SPEED_X, UNICORN_MAX_SPEED_X);
    if (jumpPressed && (grounded || this.#coyoteTimer.active())) {
      this.velocity.y = UNICORN_JUMP_INITIAL_SPEED;
      this.#coyoteTimer.unset();
    }
    else if (jumpPressed) {
      this.#jumpBufferTimer.set(UNICORN_JUMP_BUFFER_TIME);
    }
    if (jumpReleased && this.velocity.y > 0) {
      this.velocity.y *= 1.0 - UNICORN_JUMP_RELEASE_DAMPING;
    }
    if (jumpReleased) {
      this.#jumpBufferTimer.unset();
    }
    this.gravityScale = jumpHeld && !grounded && abs(this.velocity.y) < UNICORN_JUMP_PEAK_SPEED ?
      UNICORN_JUMP_PEAK_GRAVITY_SCALE : 1;
    if (this.#moveX) {
      this.mirror = this.#moveX > 0;
    }
  }

  #updateAirCornerCorrection() {
    if (this.groundObject) {
      return;
    }
    this.#updateMoveCornerCorrection();
    this.#updateJumpCornerCorrection();
  }

  #isTileBlockedAt(pos) {
    const tileData = getTileCollisionData(pos);
    return tileData && this.collideWithTile(tileData, pos);
  }

  #updateMoveCornerCorrection() {
    // Use direction moving or intend to move.
    const horizontalMoveDirection = sign(this.velocity.x) || this.#moveX;
    if (!horizontalMoveDirection) {
      return;
    }
    const epsilon = .001;
    const horizontalMove = this.velocity.x ||
      horizontalMoveDirection * UNICORN_AIR_CORNER_VERTICAL_CORRECTION_MAX;
    const cornerX = this.pos.x + horizontalMove + horizontalMoveDirection * this.size.x / 2;
    const topY = this.pos.y + this.size.y / 2 - epsilon;
    const bottomY = this.pos.y - this.size.y / 2 + epsilon;
    const topBlocked = this.#isTileBlockedAt(vec2(cornerX, topY));
    const bottomBlocked = this.#isTileBlockedAt(vec2(cornerX, bottomY));
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

  #updateJumpCornerCorrection() {
    // Use direction moving or intend to move.
    const verticalMoveDirection = this.velocity.y > 0.0 ? 1 : 0 || this.#moveY;
    if (!verticalMoveDirection) {
      return;
    }
    const epsilon = .001;
    const verticalMove = this.velocity.y ||
      verticalMoveDirection * UNICORN_AIR_CORNER_HORIZONTAL_CORRECTION_MAX;
    const cornerY = this.pos.y + verticalMove + verticalMoveDirection * this.size.y / 2;
    const leftX = this.pos.x - this.size.x / 2 + epsilon;
    const rightX = this.pos.x + this.size.x / 2 - epsilon;
    const leftBlocked = this.#isTileBlockedAt(vec2(leftX, cornerY));
    const rightBlocked = this.#isTileBlockedAt(vec2(rightX, cornerY));
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
          if (!this.velocity.y) {
            this.velocity.y = UNICORN_JUMP_INITIAL_SPEED;
          }
          return;
        }
      }
    }
  }

  #updateBufferedJump() {
    if (!this.#jumpBufferTimer.active() || !this.groundObject) {
      return;
    }
    this.velocity.y = UNICORN_JUMP_INITIAL_SPEED;
    this.groundObject = 0;
    this.#jumpBufferTimer.unset();
    this.#coyoteTimer.unset();
  }

  #updateAnim() {
    const grounded = !!this.groundObject;
    if (grounded && !this.#wasGrounded) {
      this.#landScaleTimer.set(UNICORN_LAND_SCALE_TIME);
    }
    this.#wasGrounded = grounded;

    if (!grounded) {
      this.#animState = this.#ANIM_STATE_JUMP;
      this.#runFrame = this.#FRAME_INDEX_JUMP;
      return;
    }

    this.#animState = abs(this.velocity.x) > .01 ? this.#ANIM_STATE_RUN : this.#ANIM_STATE_IDLE;
    if (this.#animState == this.#ANIM_STATE_IDLE) {
      this.#runFrame = this.#FRAME_INDEX_IDLE;
      return;
    }

    if (this.#runFrame < this.#FRAME_INDEX_RUN) {
      this.#runFrame = this.#FRAME_INDEX_RUN;
    }
    else if (this.#runFrameTimer.elapsed()) {
      this.#runFrameTimer.set(1.0 / this.#ANIM_RUN_SPEED);
      this.#runFrame = this.#FRAME_INDEX_RUN +
        (this.#runFrame - this.#FRAME_INDEX_RUN + 1) % this.#FRAME_COUNT_RUN;
    }
  }

  #getJumpScaleY() {
    if (this.#landScaleTimer.active()) {
      const p = smoothStep(this.#landScaleTimer.getPercent());
      return lerp(UNICORN_LAND_SHRINK_SCALE_Y, 1, p);
    }
    return this.#animState == this.#ANIM_STATE_JUMP ? UNICORN_JUMP_AIR_SCALE_Y : 1;
  }

  render() {
    const runCycle = Math.sin(time * UNICORN_RUN_HEAD_BOB_SPEED);
    const headBob = this.#animState == this.#ANIM_STATE_IDLE ?
      Math.sin(time * UNICORN_IDLE_HEAD_BOB_SPEED) * UNICORN_IDLE_HEAD_BOB_AMPLIFY + UNICORN_IDLE_HEAD_BOB_OFFSET :
      this.#animState == this.#ANIM_STATE_RUN ?
        runCycle * UNICORN_RUN_HEAD_BOB_AMPLIFY : 0;
    const headPos = this.pos.add(vec2(0, headBob));
    const runRotate = this.#animState == this.#ANIM_STATE_RUN ?
      this.#lastMoveX * UNICORN_RUN_ROTATE_ANGLE : 0;
    const runScaleY = this.#animState == this.#ANIM_STATE_RUN ?
      1 + runCycle * UNICORN_RUN_SCALE_Y_AMPLIFY : 1;
    const drawOffset = vec2(UNICORN_DRAW_OFFSET.x * (this.mirror ? -1.0 : 1.0), UNICORN_DRAW_OFFSET.y);
    const drawSize = vec2(UNICORN_WIDTH / TILE_SIZE, UNICORN_HEIGHT / TILE_SIZE);
    const drawSizeStretch = vec2(drawSize.x, drawSize.y * runScaleY * this.#getJumpScaleY());
    const scaleAnchorOffset = vec2(0, (drawSizeStretch.y - drawSize.y) / 2);
    const drawPos = this.pos.add(scaleAnchorOffset);
    drawTile(headPos.add(scaleAnchorOffset).add(drawOffset), drawSizeStretch, this.#frameInfoHead, undefined, runRotate, this.mirror);
    drawTile(drawPos.add(drawOffset), drawSizeStretch, this.#frameInfoBody.frame(this.#runFrame), undefined, runRotate, this.mirror);
    drawTile(drawPos.add(drawOffset), drawSize, this.#frameInfoBag, undefined, runRotate, this.mirror);
  }
}
