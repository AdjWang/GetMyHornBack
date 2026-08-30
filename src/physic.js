'use strict';

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
