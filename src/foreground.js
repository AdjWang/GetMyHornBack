'use strict';

class Foreground extends EngineObject {
  constructor(sceneTheme) {
    super()
    if (sceneTheme == THEME_INDEX_GRASS) {
      new ParticleEmitter(
        vec2(),               // position
        210 * PI / 180,       // angle
        100,                  // emitSize
        0,                    // emitTime
        9,                    // emitRate
        0,                    // emitConeAngle
        tile(0, 8, 2, 0),     // tileInfo
        new Color(1, 1, 1),   // colorStartA
        new Color(1, 1, 1),   // colorStartB
        new Color(1, 1, 1),   // colorEndA
        new Color(1, 1, 1),   // colorEndB
        10,                   // particleTime
        0.4,                  // sizeStart
        0.2,                  // sizeEnd
        0.1,                  // speed
        0.05,                 // angleSpeed
        1.0,                  // damping
        1.0,                  // angleDamping
        0.0,                  // gravityScale
        1.57,                 // particleConeAngle
        0.1,                  // fadeRate
        0.3,                  // randomness
        false,                // collideTiles
        true                  // additive
      );
    }
  }
}
