'use strict';

class ParticleEmitter extends EngineObject {
    constructor(pos, angle = 0, emitSize = 0, emitTime = 0, emitRate = 100, emitConeAngle = PI, tileInfo, colorStartA = new Color, colorStartB = new Color, colorEndA = new Color(1, 1, 1, 0), colorEndB = new Color(1, 1, 1, 0), particleTime = .5, sizeStart = .1, sizeEnd = 1, speed = .1, angleSpeed = .05, damping = 1, angleDamping = 1, gravityScale = 0, particleConeAngle = PI, fadeRate = .1, randomness = .2, collideTiles = false, additive = false) {
        super(pos, vec2(), tileInfo, angle, new Color, additive ? 1e9 : 0);
        this.emitSize = emitSize;
        this.emitTime = emitTime;
        this.emitRate = emitRate;
        this.emitConeAngle = emitConeAngle;
        this.colorStartA = colorStartA;
        this.colorStartB = colorStartB;
        this.colorEndA = colorEndA;
        this.colorEndB = colorEndB;
        this.particleTime = particleTime;
        this.sizeStart = sizeStart;
        this.sizeEnd = sizeEnd;
        this.speed = speed;
        this.angleSpeed = angleSpeed;
        this.damping = damping;
        this.angleDamping = angleDamping;
        this.gravityScale = gravityScale;
        this.particleConeAngle = particleConeAngle;
        this.fadeRate = fadeRate;
        this.randomness = randomness;
        this.collideTiles = collideTiles;
        this.additive = additive;
        this.emitTimeBuffer = 0
    }

    update() {
        if (this.emitTime && this.getAliveTime() > this.emitTime) return this.destroy();
        if (this.emitRate) for (this.emitTimeBuffer += timeDelta;
            this.emitTimeBuffer > 0;
            this.emitTimeBuffer -= 1 / this.emitRate)this.emitParticle()
    }

    emitParticle() {
        let p = typeof this.emitSize == 'number' ? randInCircle(this.emitSize / 2) : vec2(rand(-.5, .5), rand(-.5, .5)).multiply(this.emitSize).rotate(this.angle);
        p = this.pos.add(p);
        const r = this.randomness, scale = v => v + v * rand(r, -r);
        const a = rand(this.particleConeAngle, -this.particleConeAngle);
        const q = new Particle(p, this.tileInfo, a, randColor(this.colorStartA, this.colorStartB), randColor(this.colorEndA, this.colorEndB), scale(this.particleTime), scale(this.sizeStart), scale(this.sizeEnd), this.fadeRate, this.additive);
        q.velocity = vec2().setAngle(this.angle + rand(this.emitConeAngle, -this.emitConeAngle), scale(this.speed));
        q.angleVelocity = scale(this.angleSpeed) * randSign();
        q.damping = this.damping;
        q.angleDamping = this.angleDamping;
        q.gravityScale = this.gravityScale;
        q.collideTiles = this.collideTiles;
        q.renderOrder = this.renderOrder;
        return q
    }
    render() { }
}

function randColor(a, b) { return new Color(rand(a.r, b.r), rand(a.g, b.g), rand(a.b, b.b), rand(a.a, b.a)) }

class Particle extends EngineObject {
    constructor(pos, tileInfo, angle, colorStart, colorEnd, life, sizeStart, sizeEnd, fadeRate, additive) {
        super(pos, vec2(), tileInfo, angle);
        this.colorStart = colorStart;
        this.colorEndDelta = colorEnd.subtract(colorStart);
        this.lifeTime = life;
        this.sizeStart = sizeStart;
        this.sizeEndDelta = sizeEnd - sizeStart;
        this.fadeRate = fadeRate;
        this.additive = additive;
        this.clampSpeed = false
    }

    render() {
        const p = this.lifeTime ? min((time - this.spawnTime) / this.lifeTime, 1) : 1;
        const r = this.sizeStart + p * this.sizeEndDelta;
        const f = this.fadeRate / 2;
        const a = (this.colorStart.a + p * this.colorEndDelta.a) * (p < f ? p / f : p > 1 - f ? (1 - p) / f : 1);
        this.additive && setAdditiveBlendMode();
        drawTile(this.pos, vec2(r), this.tileInfo, new Color(this.colorStart.r + p * this.colorEndDelta.r, this.colorStart.g + p * this.colorEndDelta.g, this.colorStart.b + p * this.colorEndDelta.b, a), this.angle, this.mirror);
        this.additive && setAdditiveBlendMode(false);
        p == 1 && (this.destroyed = 1)
    }
}
