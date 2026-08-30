'use strict';

class GhostTrail extends EngineObject {
  constructor(length, alpha) {
    super(vec2(), vec2(), undefined, 0, new Color, RENDER_ORDER_CHARACTER - .01);
    this._obj = undefined;
    this._length = length;
    this._alpha = alpha;
    this._ghosts = [];
    this.mass = 0;
    this.gravityScale = 0;
    this.damping = 1;
    this.friction = 1;
    this.setCollision(false, false, false, false);
  }

  attach(obj) {
    this._obj = obj;
    this._ghosts = [];
    this.renderOrder = obj.renderOrder - .01;
  }

  detach() {
    this._obj = undefined;
    this._ghosts = [];
  }

  update() {
    if (!this._obj || this._obj.destroyed) {
      return;
    }
    this._ghosts.push(this._sampleGhost());
    if (this._ghosts.length > this._length) {
      this._ghosts.shift();
    }
  }

  render() {
    if (!this._obj || this._obj.destroyed) {
      return;
    }
    for (let i = 0; i < this._ghosts.length; ++i) {
      const ghost = this._ghosts[i];
      const alpha = this._alpha * (i + 1) / this._ghosts.length;
      drawTile(ghost.pos, ghost.size, ghost.tileInfo, new Color(1, 1, 1, alpha), ghost.angle, ghost.mirror);
    }
  }

  _sampleGhost() {
    const obj = this._obj;
    if (obj._scaleOffsetY && obj._currentFrame != undefined) {
      const size = vec2(obj.size.x, obj.size.y * obj._scaleOffsetY[obj._currentFrame]);
      return {
        pos: obj.pos.add(vec2(0, (size.y - obj.size.y) / 2)),
        size,
        angle: obj.angle,
        mirror: obj.mirror,
        tileInfo: obj.tileInfo,
      };
    }
    return {
      pos: obj.pos.copy(),
      size: obj.drawSize ? obj.drawSize.copy() : obj.size.copy(),
      angle: obj.angle,
      mirror: obj.mirror,
      tileInfo: obj.tileInfo,
    };
  }
}
