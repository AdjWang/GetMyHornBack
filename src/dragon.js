'use strict';
const DRAGON_ANIM_SPEED = 4;  // frame/sec
const DRAGON_FRAME_COUNT = 2;
const DRAGON_DRAW_Y_OFFSETS = [0.0, 0.2];

class Dragon extends EngineObject {
  constructor(pos) {
    const colliderSize = vec2(0.9, 0.9);
    super(pos, colliderSize, undefined, 0, new Color, RENDER_ORDER_CHARACTER);
    this.mirror = false;
    const res = createAsepriteResource(dragonAsepriteData, TEXTURE_INDEX_DRAGON, ['tail', 'body', 'wing']);
    this._frameInfoWing = res.wing;
    this._frameInfoBody = res.body;
    this._frameInfoTail = res.tail;
    this._currentFrame = 0;
    this._frameTimer = new Timer(1.0 / DRAGON_ANIM_SPEED);
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
  }

  render() {
    const scaleY = 1;
    const drawPos = this.pos.add(vec2(0.0, DRAGON_DRAW_Y_OFFSETS[this._currentFrame]));
    drawAsepriteFrame(this._frameInfoWing[this._currentFrame], drawPos, scaleY, undefined, 0, this.mirror);
    drawAsepriteFrame(this._frameInfoBody[this._currentFrame], drawPos, scaleY, undefined, 0, this.mirror);
    drawAsepriteFrame(this._frameInfoTail[0], drawPos, scaleY, undefined, 0, this.mirror);
  }
}
