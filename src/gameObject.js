'use strict';

class GameObject extends EngineObject {
  constructor(pos, size, tileInfo, angle) {
    super(pos, size, tileInfo, angle);
    this.health = 0;
    this.isGameObject = 1;
    this.damageTimer = new Timer;
  }

  update() {
    super.update();

    // flash white when damaged
    let brightness = 0;
    if (!this.isDead() && this.damageTimer.isSet())
      brightness = .5 * percent(this.damageTimer, .15, 0);
    this.additiveColor = hsl(0, 0, brightness, 0);

    // kill if below level
    if (!this.isDead() && this.pos.y < -9)
      this.kill();
  }

  damage(damage, damagingObject) {
    ASSERT(damage >= 0);
    if (this.isDead())
      return 0;

    // set damage timer;
    this.damageTimer.set();
    for (const child of this.children)
      child.damageTimer && child.damageTimer.set();

    // apply damage and kill if necessary
    const newHealth = max(this.health - damage, 0);
    if (!newHealth)
      this.kill(damagingObject);

    // set new health and return amount damaged
    return this.health - (this.health = newHealth);
  }

  isDead() { return !this.health; }
  kill(damagingObject) { this.destroy(); }
}
