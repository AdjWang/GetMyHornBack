'use strict';

class Unicorn extends EngineObject {
  #FRAME_INDEX_IDLE = 0;
  #FRAME_INDEX_RUN = 1;
  #FRAME_COUNT_RUN = 2;
  #ANIM_RUN_SPEED = 8;  // frame/sec

  #playerHead;
  #playerBody;
  #playerBag;
  #runFrame = 0;
  #runFrameTimer = new Timer(1.0 / this.#ANIM_RUN_SPEED);

  constructor(pos) {
    const size = vec2(21.0/16, 24/16.0);
    super(pos, size);
    this.#playerHead = tile(0, vec2(21, 24), 1);
    this.#playerBody = tile(0, vec2(21, 24), 2);
    this.#playerBag =  tile(0, vec2(21, 24), 3);
    this.setCollision();
  }

  update() {

  }

  render() {
    drawTile(this.pos, this.size, this.#playerHead);
    drawTile(this.pos, this.size, this.#playerBody.frame(this.#runFrame + this.#FRAME_INDEX_RUN));
    if (this.#runFrameTimer.elapsed()) {
      this.#runFrameTimer.set(1.0 / this.#ANIM_RUN_SPEED);
      this.#runFrame = (this.#runFrame + 1) % this.#FRAME_COUNT_RUN;
    }
    drawTile(this.pos, this.size, this.#playerBag);
  }
}
