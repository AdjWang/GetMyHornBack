'use strict';

class Unicorn extends EngineObject {
  #playerHead;
  #playerBody;
  #playerBag ;
  #size;

  constructor(pos) {
    const size = vec2(21.0/16, 24/16.0);
    super(pos, size);
    this.#size = size;
    this.#playerHead = tile(0, vec2(21, 24), 1);
    this.#playerBody = tile(0, vec2(21, 24), 2);
    this.#playerBag =  tile(0, vec2(21, 24), 3);
    this.setCollision();
  }

  render() {
    drawTile(this.pos, this.#size, this.#playerHead);
    drawTile(this.pos, this.#size, this.#playerBody);
    drawTile(this.pos, this.#size, this.#playerBag);
  }
}
