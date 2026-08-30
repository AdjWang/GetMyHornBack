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

class SpringDamping {
  constructor(obj, mass, spring, damping, maxVelocity, getAxis = obj => obj.x, setAxis = (obj, value) => { obj.x = value; }) {
    this.obj = obj;
    this.mass = mass;
    this.spring = spring;
    this.damping = damping;
    this.maxVelocity = maxVelocity;
    this._getAxis = getAxis;
    this._setAxis = setAxis;
    this.velocity = vec2();
  }

  update(targetPos) {
    const frameScale = timeDelta * 60;
    const pos = this.obj.pos;
    const axis = this._getAxis(pos);
    const targetAxis = this._getAxis(targetPos);
    const axisVelocity = this._getAxis(this.velocity);
    const maxAxisVelocity = this._getAxis(this.maxVelocity);
    const springForce = (targetAxis - axis) * this.spring;
    const dampingForce = -axisVelocity * this.damping;
    const acceleration = (springForce + dampingForce) / this.mass;
    const nextVelocity = clamp((axisVelocity + acceleration * frameScale) * frameScale, -maxAxisVelocity, maxAxisVelocity);
    this._setAxis(this.velocity, nextVelocity);
    this._setAxis(pos, axis + nextVelocity);
  }
}

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
