'use strict';

const UNICORN_WIDTH = 21;  // pixels
const UNICORN_HEIGHT = 24;  // pixels
const UNICORN_MAX_SPEED_X = 0.30;
const UNICORN_AIR_IMPULSE = 0.04;
const UNICORN_GROUND_IMPULSE = 0.08;
const UNICORN_AIR_DAMPING = 0.15;
const UNICORN_GROUND_DAMPING = 0.3;
const UNICORN_JUMP_INITIAL_SPEED = 0.27;
const UNICORN_IDLE_HEAD_BOB_OFFSET = -0.03;
const UNICORN_IDLE_HEAD_BOB_AMPLIFY = 0.03;
const UNICORN_IDLE_HEAD_BOB_SPEED = 8;
const UNICORN_RUN_HEAD_BOB_AMPLIFY = 0.06;
const UNICORN_RUN_HEAD_BOB_SPEED = 16;
const UNICORN_RUN_ROTATE_ANGLE = 0.22;
const UNICORN_RUN_SCALE_Y_AMPLIFY = 0.02;
const UNICORN_JUMP_START_SCALE_TIME = 0.25;
const UNICORN_JUMP_START_SHRINK_SCALE_Y = 0.75;
const UNICORN_JUMP_START_STRETCH_SCALE_Y = 1.35;
const UNICORN_JUMP_AIR_SCALE_Y = 1.08;
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
  #animState = this.#ANIM_STATE_IDLE;
  #moveX = 0;
  #lastMoveX = 1;
  #wasGrounded = false;
  #runFrame = this.#FRAME_INDEX_IDLE;
  #runFrameTimer = new Timer(1.0 / this.#ANIM_RUN_SPEED);
  #jumpStartScaleTimer = new Timer;
  #landScaleTimer = new Timer;

  constructor(pos) {
    const size = vec2(UNICORN_WIDTH / TILE_SIZE, UNICORN_HEIGHT / TILE_SIZE);
    super(pos, size);
    this.#frameInfoHead = tile(0, vec2(UNICORN_WIDTH, UNICORN_HEIGHT), 1);
    this.#frameInfoBody = tile(0, vec2(UNICORN_WIDTH, UNICORN_HEIGHT), 2);
    this.#frameInfoBag = tile(0, vec2(UNICORN_WIDTH, UNICORN_HEIGHT), 3);
    this.damping = 1;
    this.friction = 1;
    this.setCollision();
  }

  update() {
    this.#updateInput();
    super.update();
    this.#updateAnim();
  }

  #updateInput() {
    const leftDown = keyIsDown(INPUT_KEY_LEFT);
    const rightDown = keyIsDown(INPUT_KEY_RIGHT);
    const left = leftDown ? 1 : 0;
    const right = rightDown ? 1 : 0;
    if (keyWasPressed(INPUT_KEY_LEFT)) {
      this.#lastMoveX = -1;
    }
    if (keyWasPressed(INPUT_KEY_RIGHT)) {
      this.#lastMoveX = 1;
    }
    this.#moveX = rightDown && leftDown ? this.#lastMoveX : right - left;

    const jumpPressed = keyWasPressed(INPUT_KEY_UP) || keyWasPressed(INPUT_KEY_JUMP);
    const grounded = !!this.groundObject;

    const impulse = grounded ? UNICORN_GROUND_IMPULSE : UNICORN_AIR_IMPULSE;
    const damping = grounded ? UNICORN_GROUND_DAMPING : UNICORN_AIR_DAMPING;
    this.velocity.x = this.velocity.x * (1.0 - damping) + this.#moveX * impulse;
    this.velocity.x = clamp(this.velocity.x, -UNICORN_MAX_SPEED_X, UNICORN_MAX_SPEED_X);
    if (jumpPressed && grounded) {
      this.velocity.y = UNICORN_JUMP_INITIAL_SPEED;
      this.#jumpStartScaleTimer.set(UNICORN_JUMP_START_SCALE_TIME);
    }
    if (this.#moveX) {
      this.mirror = this.#moveX > 0;
    }
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
    if (this.#jumpStartScaleTimer.active()) {
      const p = this.#jumpStartScaleTimer.getPercent();
      if (p < .35) {
        return lerp(1, UNICORN_JUMP_START_SHRINK_SCALE_Y, smoothStep(p / .35));
      }
      return lerp(
        UNICORN_JUMP_START_SHRINK_SCALE_Y,
        UNICORN_JUMP_START_STRETCH_SCALE_Y,
        smoothStep((p - .35) / .65));
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
    const drawSize = vec2(this.size.x, this.size.y * runScaleY * this.#getJumpScaleY());
    drawTile(headPos, drawSize, this.#frameInfoHead, undefined, runRotate, this.mirror);
    drawTile(this.pos, drawSize, this.#frameInfoBody.frame(this.#runFrame), undefined, runRotate, this.mirror);
    drawTile(this.pos, drawSize, this.#frameInfoBag, undefined, runRotate, this.mirror);
  }
}
