'use strict';

const MOTION_OFFSET_X_FACTOR = 14;
const MOTION_OFFSET_X_MAX = 3;  // cells
const CAMERA_MASS = 1.0;
const CAMERA_SPRING = 0.04;
const CAMERA_DAMPING = 0.4;
const CAMERA_MAX_VELOCITY = vec2(10, 10);
let cameraVelocity = vec2(0, 0);

function initWorldCamera() {
  const targetPos = vec2(VIEW_WIDTH / 2, VIEW_HEIGHT / 2);
  cameraPos = targetPos;
}

function updateWorldCamera() {
  let targetPos = vec2(VIEW_WIDTH / 2, VIEW_HEIGHT / 2);
  let motionOffset = 0;
  if (player) {
    targetPos = vec2(player.pos.x, VIEW_HEIGHT / 2);
    motionOffset = MOTION_OFFSET_X_FACTOR * Math.abs(player.velocity.x) * player.getFacingX();
    motionOffset = Math.min(motionOffset, MOTION_OFFSET_X_MAX);
  }
  const targetCameraPos = targetPos.add(vec2(motionOffset, 0));
  const frameScale = timeDelta * 60;
  const springForce = targetCameraPos.subtract(cameraPos).scale(CAMERA_SPRING);
  const dampingForce = cameraVelocity.scale(-CAMERA_DAMPING);
  const acceleration = springForce.add(dampingForce).scale(1 / CAMERA_MASS);
  cameraVelocity = cameraVelocity.add(acceleration.scale(frameScale));
  cameraVelocity = cameraVelocity.scale(frameScale);
  cameraVelocity.x = clamp(cameraVelocity.x, -CAMERA_MAX_VELOCITY.x, CAMERA_MAX_VELOCITY.x);
  cameraVelocity.y = clamp(cameraVelocity.y, -CAMERA_MAX_VELOCITY.y, CAMERA_MAX_VELOCITY.y);
  cameraPos = cameraPos.add(cameraVelocity);
  if (cameraPos.x < VIEW_WIDTH / 2) {
    cameraPos.x = VIEW_WIDTH / 2;
    cameraVelocity.x = max(0, cameraVelocity.x);
  }
  cameraScale = worldScale;
}
