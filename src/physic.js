'use strict';

class Lowpass {
  constructor(ratio) {
    this._ratio = ratio;
    this._val = undefined;
  }

  update(target) {
    if (this._val) {
      this._val = target * (1.0 - this._ratio) + this._val * this._ratio;
    } else {
      this._val = target;
    }
    return this._val;
  }
}
