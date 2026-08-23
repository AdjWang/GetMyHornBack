'use strict';

const DRAGON_ANIM_SPEED = 4;  // frame/sec
const DRAGON_FRAME_COUNT = 2;
const DRAGON_DRAW_Y_OFFSETS = [0.0, 0.2];
const SLIME_ANIM_SPEED = 12;  // frame/sec

class Dragon extends EngineObject {
  constructor(pos) {
    const colliderSize = vec2(0.9, 0.9);
    super(pos, colliderSize, undefined, 0, new Color, RENDER_ORDER_CHARACTER);
    const res = createAsepriteResource(dragonAsepriteData, TEXTURE_INDEX_DRAGON, ['tail', 'body', 'wing']);
    this._frameInfoWing = res.wing;
    this._frameInfoBody = res.body;
    this._frameInfoTail = res.tail;
    this._currentFrame = 0;
    this._offsetFrame = 0;
    this._frameTimer = new Timer(1.0 / DRAGON_ANIM_SPEED);
    this.mirror = false;
    this.damping = 1;
    this.friction = 1;
    this.setCollision();
  }

  update() {
    super.update();
    if (this._frameTimer.elapsed()) {
      this._frameTimer.set(1.0 / DRAGON_ANIM_SPEED);
      this._currentFrame = (this._currentFrame + 1) % DRAGON_FRAME_COUNT;
    }
    this._offsetFrame = this._currentFrame + this._frameTimer.getPercent();
  }

  render() {
    const currentFrame = this._currentFrame;
    const nextFrame = (currentFrame + 1) % DRAGON_FRAME_COUNT;
    const framePercent = smoothStep(this._offsetFrame - currentFrame);
    const drawYOffset = lerp(DRAGON_DRAW_Y_OFFSETS[nextFrame], DRAGON_DRAW_Y_OFFSETS[currentFrame], framePercent);
    const scaleY = 1;
    const drawPos = this.pos.add(vec2(0.0, drawYOffset));
    drawAsepriteFrame(this._frameInfoWing[currentFrame], drawPos, scaleY, undefined, 0, this.mirror);
    drawAsepriteFrame(this._frameInfoBody[currentFrame], drawPos, scaleY, undefined, 0, this.mirror);
    drawAsepriteFrame(this._frameInfoTail[0], drawPos, scaleY, undefined, 0, this.mirror);
  }
}

class Slime extends EngineObject {
  constructor(pos) {
    const colliderSize = vec2(0.9, 0.9);
    const anim = tile(0, 16, TEXTURE_INDEX_SLIME, 0);
    super(pos, colliderSize, anim, 0, new Color, RENDER_ORDER_CHARACTER);
    this._frameTimer = new Timer(1.0 / SLIME_ANIM_SPEED);
    this._currentFrame = 0;
    this._scaleOffsetY = [1.0, 0.9, 0.8, 0.7, 0.7, 0.8, 0.9, 1.0];
    this.mirror = false;
    this.damping = 1;
    this.friction = 1;
    this.setCollision();
  }

  update() {
    super.update();
    if (this._frameTimer.elapsed()) {
      this._frameTimer.set(1.0 / SLIME_ANIM_SPEED);
      this._currentFrame = (this._currentFrame + 1) % this._scaleOffsetY.length;
    }
  }

  render() {
    const size = vec2(this.size.x, this.size.y * this._scaleOffsetY[this._currentFrame]);
    const pos = this.pos.add(vec2(0, (size.y - this.size.y) / 2));
    drawTile(pos, size, this.tileInfo, this.color, this.angle, this.mirror);
  }
}
