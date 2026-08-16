'use strict';

const UNICORN_WIDTH = 21;  // pixels
const UNICORN_HEIGHT = 24;  // pixels
const UNICORN_RUN_SPEED = .08;
const UNICORN_JUMP_INITIAL_SPEED = .22;

class Unicorn extends EngineObject {
  #ANIM_STATE_IDLE = 0;
  #ANIM_STATE_RUN = 1;

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
  #runFrame = this.#FRAME_INDEX_IDLE;
  #runFrameTimer = new Timer(1.0 / this.#ANIM_RUN_SPEED);

  constructor(pos) {
    const size = vec2(UNICORN_WIDTH / TILE_SIZE, UNICORN_HEIGHT / TILE_SIZE);
    super(pos, size);
    this.#frameInfoHead = tile(0, vec2(UNICORN_WIDTH, UNICORN_HEIGHT), 1);
    this.#frameInfoBody = tile(0, vec2(UNICORN_WIDTH, UNICORN_HEIGHT), 2);
    this.#frameInfoBag =  tile(0, vec2(UNICORN_WIDTH, UNICORN_HEIGHT), 3);
    this.setCollision();
  }

  update() {
    super.update();
    this.#updateInput();
    this.#updateAnim();
  }

  #updateInput() {
    this.#moveX = keyDirection(INPUT_KEY_UP, INPUT_KEY_DOWN, INPUT_KEY_LEFT, INPUT_KEY_RIGHT).x;
    const jumpPressed = keyWasPressed(INPUT_KEY_UP) || keyWasPressed(INPUT_KEY_JUMP);
    const grounded = !!this.groundObject;

    this.velocity.x = this.#moveX * UNICORN_RUN_SPEED;
    if (jumpPressed && grounded) {
      this.velocity.y = UNICORN_JUMP_INITIAL_SPEED;
    }
    if (this.#moveX) {
      this.mirror = this.#moveX > 0;
    }
  }

  #updateAnim() {
    if (!this.groundObject) {
      this.#runFrame = this.#FRAME_INDEX_JUMP;
      return;
    }

    this.#animState = this.#moveX ? this.#ANIM_STATE_RUN : this.#ANIM_STATE_IDLE;
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

  render() {
    drawTile(this.pos, this.size, this.#frameInfoHead, undefined, 0, this.mirror);
    drawTile(this.pos, this.size, this.#frameInfoBody.frame(this.#runFrame), undefined, 0, this.mirror);
    drawTile(this.pos, this.size, this.#frameInfoBag, undefined, 0, this.mirror);
  }
}
