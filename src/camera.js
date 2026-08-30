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

let cameraSpringDamping;

function initWorldCamera() {
  const targetPos = vec2(VIEW_WIDTH / 2, VIEW_HEIGHT / 2);
  cameraPos = targetPos;
  cameraSpringDamping = new SpringDamping(cameraSpringObject, CAMERA_MASS, CAMERA_SPRING, CAMERA_DAMPING, CAMERA_MAX_VELOCITY, o => o.x, (o, v) => { o.x = v; });
}

function updateWorldCamera() {
  let targetPos = vec2(VIEW_WIDTH / 2, VIEW_HEIGHT / 2);
  let motionOffset = 0;
  if (player) {
    targetPos = vec2(player.pos.x, VIEW_HEIGHT / 2);
    motionOffset = MOTION_OFFSET_X_FACTOR * Math.abs(player.velocity.x) * player.getFacingX();
    motionOffset = Math.min(motionOffset, MOTION_OFFSET_X_MAX);
  }
  cameraSpringDamping.update(targetPos.add(vec2(motionOffset, 0)));
  if (cameraPos.x < VIEW_WIDTH / 2) {
    cameraPos.x = VIEW_WIDTH / 2;
    cameraSpringDamping.velocity.x = max(0, cameraSpringDamping.velocity.x);
  }
  cameraScale = worldScale;
}
