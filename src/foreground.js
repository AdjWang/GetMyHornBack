'use strict';

const FOREGROUND_LEAF_TEXTURE_INDEX = 2;
const FOREGROUND_LEAF_TILE_SIZE = 8;
const FOREGROUND_LARGE_LEAF_SIZE_GATE = 0.5;
const FOREGROUND_LARGE_LEAF_ALPHA = 0.35;

class Foreground extends EngineObject {
  constructor(sceneTheme) {
    super()
    if (sceneTheme == THEME_INDEX_GRASS) {
      const leafEmitter = new ParticleEmitter(
        vec2(),               // position
        210 * PI / 180,       // angle
        100,                  // emitSize
        0,                    // emitTime
        5,                    // emitRate
        0,                    // emitConeAngle
        tile(0, FOREGROUND_LEAF_TILE_SIZE, FOREGROUND_LEAF_TEXTURE_INDEX, 0),     // tileInfo
        new Color(1, 1, 1),   // colorStartA
        new Color(1, 1, 1),   // colorStartB
        new Color(1, 1, 1),   // colorEndA
        new Color(1, 1, 1),   // colorEndB
        10,                   // particleTime
        0.5,                  // sizeStart
        0.2,                  // sizeEnd
        0.07,                 // speed
        0.05,                 // angleSpeed
        1.0,                  // damping
        1.0,                  // angleDamping
        0.0,                  // gravityScale
        1.57,                 // particleConeAngle
        0.1,                  // fadeRate
        0.6,                  // randomness
        false,                // collideTiles
        false                  // additive
      );
      leafEmitter.particleCreateCallback = particle => {
        if (particle.sizeStart > FOREGROUND_LARGE_LEAF_SIZE_GATE) {
          particle.colorStart.a *= FOREGROUND_LARGE_LEAF_ALPHA;
        }
      };
    }
  }
}
