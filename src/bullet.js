'use strict';

class Bullet extends EngineObject {
  constructor(pos, attacker, velocity, damage) {
    super(pos, vec2());
    this.color = rgb(1, 1, 1);
    this.velocity = velocity;
    this.damping = 1;
    this.gravityScale = 1;
    this.renderOrder = 100;
    this.drawSize = vec2();
    this.setCollision(true, false);

    this._attacker = attacker;
    this._damage = damage;

    this._red = new Particle(
      this.pos.copy(),   // position
      undefined,  // tileInfo
      0, // angle
      new Color(1, 0, 0),  // colorStart
      new Color(1, 0, 0),  // colorEnd
      1e9, // lifeTime
      0.12, // sizeStart
      0.1, // sizeEnd
      0, // fadeRate
      false, // additive
      4.0, // trailScale
      undefined, // localSpaceEmitter
      undefined // destroyCallbac
    );
    this._red.velocity = this.velocity.copy();
    this._red.angleVelocity = 0;
    this._red.damping = 1;
    this._red.angleDamping = 1;
    this._red.restitution = 1;
    this._red.gravityScale = this.gravityScale;
    this._red.collideTiles = false;
    this._red.renderOrder = this.renderOrder;
  }

  update() {
    super.update();
  }

  render() {
    // Do not draw self.
    super.render();
  }

  collideWithObject(o) {
    this.destroy();
    return true;
  }

  collideWithTile(tileData, pos) {
    this.destroy();
    return true;
  }

  kill() {
    if (this.destroyed)
      return;
    this.destroy();
  }

  destroy() {
    if (this.destroyed)
      return;
    this._red.destroy();
    super.destroy();
  }
}
