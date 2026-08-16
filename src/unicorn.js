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
    this.#playerHead = tile(1, vec2(21, 24));
    this.#playerBody = tile(2, vec2(21, 24));
    this.#playerBag =  tile(3, vec2(21, 24));
    this.setCollision();
  }

  render() {
    drawTile(this.pos, this.#size, this.#playerHead);
    drawTile(this.pos, this.#size, this.#playerBody);
    drawTile(this.pos, this.#size, this.#playerBag);
  }
}
