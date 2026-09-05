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
        tile(0, LEAF_SIZE, TEXTURE_INDEX_LEAF, 0),     // tileInfo
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

function drawSpeechBubble(basePos, width, height) {
  const pos = worldToScreen(basePos.add(vec2(0, 1.4)));
  const w = worldScale * width;
  const h = worldScale * height;
  const x = pos.x - w / 2;
  const y = pos.y - h / 2;
  overlayContext.fillStyle = '#fff';
  overlayContext.strokeStyle = 'rgb(0 0 0 / 0.5)';
  overlayContext.lineWidth = worldScale * 0.06;
  const points = [
    vec2(x, y),
    vec2(x + w, y),
    vec2(x + w, y + h),
    vec2(pos.x + worldScale * 0.2, y + h),
    vec2(pos.x, y + h + worldScale * 0.35),
    vec2(pos.x - worldScale * 0.2, y + h),
    vec2(x, y + h),
  ];
  overlayContext.beginPath();
  overlayContext.moveTo(points[0].x, points[0].y);
  points.forEach(p => overlayContext.lineTo(p.x, p.y));
  overlayContext.closePath();
  overlayContext.fill();
  overlayContext.stroke();
};

function drawAngryMark(basePos) {
  const pos = worldToScreen(basePos);
  const s = worldScale * 0.18;
  const coeffs = [
    [vec2(-0.1, -0.6), vec2(0.0, 0.0), vec2(-0.9, 0.3)],
    [vec2(0.8, -0.6), vec2(0.3, 0.0), vec2(0.9, 0.3)],
    [vec2(-0.3, 1.0), vec2(0.0, 0.2), vec2(0.5, 0.8)],
  ];
  overlayContext.strokeStyle = 'rgb(0 0 0 / 0.5)';
  overlayContext.lineWidth = worldScale * 0.06;
  overlayContext.lineCap = 'round';
  overlayContext.lineJoin = 'round';
  for (const coeff of coeffs) {
    overlayContext.beginPath();
    const p = coeff.map(c => pos.add(c.multiply(vec2(s))));
    overlayContext.moveTo(p[0].x, p[0].y);
    overlayContext.quadraticCurveTo(p[1].x, p[1].y, p[2].x, p[2].y);
    overlayContext.stroke();
  }
};
