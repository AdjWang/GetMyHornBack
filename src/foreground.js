'use strict';

const FOREGROUND_LEAF_TEXTURE_INDEX = 2;
const FOREGROUND_LEAF_TILE_SIZE = 8;
const FOREGROUND_LARGE_LEAF_SIZE_GATE = 0.5;
const FOREGROUND_LARGE_LEAF_ALPHA = 0.35;

class Foreground extends EngineObject {
  constructor(sceneTheme) {
    super()
    if (sceneTheme == THEME_INDEX_GRASS) {
      const color = new Color(1, 1, 1);
      const leafEmitter = new ParticleEmitter(
        vec2(),               // position
        210 * PI / 180,       // angle
        100,                  // emitSize
        0,                    // emitTime
        5,                    // emitRate
        0,                    // emitConeAngle
        tile(0, FOREGROUND_LEAF_TILE_SIZE, FOREGROUND_LEAF_TEXTURE_INDEX, 0),     // tileInfo
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
    } else if (sceneTheme == THEME_INDEX_ROCK) {
      const colorA = new Color(0.827, 0.808, 0.192, 0.5);
      const colorB = new Color(0.918, 0.957, 0.784, 0.5);
      // Firefly.
      new ParticleEmitter(
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
    }
  }
}
