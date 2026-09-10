'use strict';

let audioContext;
let audioMasterGain;

function audioInit()
{
    audioContext = new AudioContext;
    if (!soundEnable || headlessMode) return;
    audioMasterGain = audioContext.createGain();
    audioMasterGain.connect(audioContext.destination);
    audioMasterGain.gain.value = soundVolume;
}

class Sound
{
    constructor(zzfxSound, range=soundDefaultRange, taper=soundDefaultTaper)
    {
        if (!soundEnable || headlessMode) return;
        this.range = range;
        this.taper = taper;
        this.randomness = zzfxSound[1] != undefined ? zzfxSound[1] : .05;
        zzfxSound[1] = 0;
        this.samples = zzfxG(...zzfxSound);
    }

    play(pos, volume=1)
    {
        if (!this.samples || !soundEnable || headlessMode) return;

        let pan = 0;
        if (pos)
        {
            const d = cameraPos.distanceSquared(pos);
            if (d > this.range*this.range) return;
            volume *= percent(d**.5, this.range, this.range*this.taper);
            pan = worldToScreen(pos).x * 2/mainCanvas.width - 1;
        }

        const gain = audioContext.createGain();
        return playSamples(this.samples, volume, 1 + this.randomness*rand(-1, 1), pan, gain);
    }
}

function playSamples(samples, volume, rate, pan, gain)
{
    const buffer = audioContext.createBuffer(1, samples.length, 44100);
    const source = audioContext.createBufferSource();
    buffer.getChannelData(0).set(samples);
    source.buffer = buffer;
    source.playbackRate.value = rate;
    gain.gain.value = volume;
    gain.connect(audioMasterGain);
    source.connect(new StereoPannerNode(audioContext, {pan: clamp(pan, -1, 1)})).connect(gain);
    if (audioContext.state != 'running')
        audioContext.resume().then(() => source.start());
    else
        source.start();
    return source;
}

function zzfxG
(
    volume=1, randomness=.05, frequency=220, attack=0, sustain=0,
    release=.1, shape=0, shapeCurve=1, slide=0, deltaSlide=0,
    pitchJump=0, pitchJumpTime=0, repeatTime=0, noise=0, modulation=0,
    bitCrush=0, delay=0, sustainVolume=1, decay=0, tremolo=0, filter=0
)
{
    let PI2=PI*2, sampleRate=44100,
        startSlide=slide*=500*PI2/sampleRate/sampleRate,
        startFrequency=frequency*=rand(1+randomness, 1-randomness)*PI2/sampleRate,
        b=[],t=0,tm=0,i=0,j=1,r=0,c=0,s=0,f,length,
        quality=2,w=PI2*abs(filter)*2/sampleRate,
        cos=Math.cos(w),alpha=Math.sin(w)/2/quality,
        a0=1+alpha,a1=-2*cos/a0,a2=(1-alpha)/a0,
        b0=(1+sign(filter)*cos)/2/a0,
        b1=-(sign(filter)+cos)/a0,b2=b0,x2=0,x1=0,y2=0,y1=0;

    attack=attack*sampleRate||9;
    decay*=sampleRate;
    sustain*=sampleRate;
    release*=sampleRate;
    delay*=sampleRate;
    deltaSlide*=500*PI2/sampleRate**3;
    modulation*=PI2/sampleRate;
    pitchJump*=PI2/sampleRate;
    pitchJumpTime*=sampleRate;
    repeatTime=repeatTime*sampleRate|0;

    for (length=attack+decay+sustain+release+delay|0;i<length;b[i++]=s*volume)
    {
        if (!(++c%(bitCrush*100|0)))
        {
            s=shape?shape>1?shape>2?shape>3?shape>4?
                (t/PI2%1<shapeCurve/2?1:-1):
                Math.sin(t**3):
                clamp(Math.tan(t),-1,1):
                1-(2*t/PI2%2+2)%2:
                1-4*abs(Math.round(t/PI2)-t/PI2):
                Math.sin(t);
            s=(repeatTime?1-tremolo+tremolo*Math.sin(PI2*i/repeatTime):1)*
                (shape>4?s:sign(s)*(abs(s)**shapeCurve))*
                (i<attack?i/attack:
                i<attack+decay?1-((i-attack)/decay)*(1-sustainVolume):
                i<attack+decay+sustain?sustainVolume:
                i<length-delay?(length-i-delay)/release*sustainVolume:0);
            s=delay?s/2+(delay>i?0:
                (i<length-delay?1:(length-i)/delay)*b[i-delay|0]/2/volume):s;
            if (filter)
                s=y1=b2*x2+b1*(x2=x1)+b0*(x1=s)-a2*y2-a1*(y2=y1);
        }
        f=(frequency+=slide+=deltaSlide)*Math.cos(modulation*tm++);
        t+=f+f*noise*Math.sin(i**5);
        if (j&&++j>pitchJumpTime)
        {
            frequency+=pitchJump;
            startFrequency+=pitchJump;
            j=0;
        }
        if (repeatTime&&!(++r%repeatTime))
        {
            frequency=startFrequency;
            slide=startSlide;
            j=j||1;
        }
    }
    return b;
}
