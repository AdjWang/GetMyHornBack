'use strict';

const FOREGROUND_LARGE_LEAF_SIZE_GATE = 0.5;
const FOREGROUND_LARGE_LEAF_ALPHA = 0.35;

class Foreground extends EngineObject {
  constructor(sceneTheme) {
    super(vec2(), vec2());
    this.renderOrder = RENDER_ORDER_FOREGROUND;
    this.mass = 0;
    this.gravityScale = 0;
    this.emitters = [];
    if (sceneTheme == THEME_INDEX_GRASS) {
      const color = new Color(1, 1, 1);
      const leafEmitter = new ParticleEmitter(
        vec2(),               // position
        210 * PI / 180,       // angle
        100,                  // emitSize
        0,                    // emitTime
        5,                    // emitRate
        0,                    // emitConeAngle
        new TileInfo(vec2(64, 16), vec2(8), textureInfos[TEXTURE_INDEX_LEAF]),  // tileInfo
        color,                // colorStartA
        color,                // colorStartB
        color,                // colorEndA
        color,                // colorEndB
        10,                   // particleTime
        0.5,                  // sizeStart
        0.2,                  // sizeEnd
        0.07,                 // speed
        0.05,                 // angleSpeed
        1.0,                  // damping
        1.0,                  // angleDamping
        0.0,                  // gravityScale
        PI / 2,               // particleConeAngle
        0.1,                  // fadeRate
        0.6,                  // randomness
        false,                // collideTiles
        false                 // additive
      );
      leafEmitter.particleCreateCallback = particle => {
        if (particle.sizeStart > FOREGROUND_LARGE_LEAF_SIZE_GATE) {
          particle.colorStart.a *= FOREGROUND_LARGE_LEAF_ALPHA;
        }
      };
      this.emitters.push(leafEmitter);
    } else if (sceneTheme == THEME_INDEX_ROCK) {
      const colorA = new Color(0.827, 0.808, 0.192, 0.5);
      const colorB = new Color(0.918, 0.957, 0.784, 0.5);
      // Firefly.
      const fireflyEmitter = new ParticleEmitter(
        vec2(),               // position
        0,                    // angle
        100,                  // emitSize
        0,                    // emitTime
        30,                   // emitRate
        PI,                   // emitConeAngle
        undefined,            // tileInfo
        colorA,               // colorStartA
        colorB,               // colorStartB
        colorB,               // colorEndA
        colorA,               // colorEndB
        1.2,                  // particleTime
        0.12,                 // sizeStart
        0.05,                 // sizeEnd
        0.02,                 // speed
        0.0,                  // angleSpeed
        1.0,                  // damping
        1.0,                  // angleDamping
        0.0,                  // gravityScale
        PI,                   // particleConeAngle
        0.1,                  // fadeRate
        0.3,                  // randomness
        false,                // collideTiles
        false                 // additive
      );
      this.emitters.push(fireflyEmitter);
    }
  }

  updatePos(pos) {
    this.pos = pos.copy();
    for (const emitter of this.emitters) {
      emitter.pos = this.pos;
      emitter.emitSize = vec2(VIEW_WIDTH, VIEW_HEIGHT);
    }
  }
}
