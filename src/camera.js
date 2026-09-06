'use strict';

const MOTION_OFFSET_X_FACTOR = 14;
const MOTION_OFFSET_X_MAX = 3;  // cells
const CAMERA_MASS = 1.0;
const CAMERA_SPRING = 0.04;
const CAMERA_DAMPING = 0.4;
const CAMERA_MAX_VELOCITY = vec2(10, 10);
const cameraSpringObject = {
  get pos() { return cameraPos; },
  set pos(value) { cameraPos = value; },
};

let cameraMotion;

function initWorldCamera() {
  const targetPos = vec2(VIEW_WIDTH / 2, VIEW_HEIGHT / 2);
  cameraPos = targetPos;
  cameraMotion = new Lowpass(0.9);
}

function updateWorldCamera() {
  if (currentLevel != BOSS_LEVEL) {
    let targetPos = vec2(VIEW_WIDTH / 2, VIEW_HEIGHT / 2);
    let motionOffset = 0;
    if (player) {
      targetPos = vec2(player.pos.x, VIEW_HEIGHT / 2);
      motionOffset = MOTION_OFFSET_X_FACTOR * Math.abs(player.velocity.x) * player.getFacingX();
      motionOffset = Math.min(motionOffset, MOTION_OFFSET_X_MAX);
    }
    targetPos = targetPos.add(vec2(motionOffset, 0));
    cameraPos.x = cameraMotion.update(targetPos.x);
    if (cameraPos.x < VIEW_WIDTH / 2) {
      cameraPos.x = VIEW_WIDTH / 2;
    }
    const levelSize = getLevelSize(currentLevel);
    if (cameraPos.x > levelSize.x - VIEW_WIDTH / 2) {
      cameraPos.x = levelSize.x - VIEW_WIDTH / 2;
    }
  } else {
    cameraPos = vec2(VIEW_WIDTH / 2, VIEW_HEIGHT / 2).add(vec2(-0.5, 0));
  }
  cameraScale = worldScale;
}
