import { Context } from "../Context";
import { Color } from "./Color";
import { angleToVec, clamp, degresToRadians, palette, randomElement, randomRangeValue } from "./Common";
import { Polygon } from "./Polygon";
import { Vec2 } from "./Vec2";

export interface ParticleEmitterSettings {
    particleGenerationRate: number, // number of particles created per second
    maxAge: number,                 // max age of a particle in seconds

    position: Vec2,                 // initial position of the particles
    acceleration: Vec2,             // acceleration of the particles
    maxSpeed: number,               // max speed of the particles

    fadeInPoint: number,            // percentage of the particle life time that will be used to end the fade in
    fadeOutPoint: number,           // percentage of the particle life time that will be used to start the fade out

    palette: Array<Color>,          // color palette

    scaleStart: number,             // scale particles is a random value between scaleStart and scaleEnd degrees
    scaleEnd: number,

    speedStart: number,             // the magnitude of the initial direction vector is a random value between speedStart and speedEnd
    speedEnd: number, 

    angleStart: number,             // initial direction of the particles is a random value between angleStart and angleEnd degrees
    angleEnd: number, 
}

export function defaultParticleEmitterSettings(): ParticleEmitterSettings {
    return {
        maxAge: 1.0,
        particleGenerationRate: 1.0,
        position: new Vec2(0.0, 0.0),

        fadeInPoint: -1.0,
        fadeOutPoint: -1.0,

        acceleration: new Vec2(0.0, 9.8),
        maxSpeed: -1.0,

        palette: palette,

        scaleStart: 1.0,
        scaleEnd: 1.0,

        speedStart: 1.0,
        speedEnd: 1.0, 

        angleStart: 0.0,
        angleEnd: 0.0,
    }
} 

class Particle {
    creationStep: number = 0;
    
    scale: number = 1.0;
    alpha: number = 1.0;
    color: Color = Color.BLUE;
    
    position: Vec2 = Vec2.zero()
    velocity: Vec2 = Vec2.zero()
}
 

export class ParticleEmitter {
    readonly stepsPerSecond = 60.0;
    readonly stepTime = 1.0 / this.stepsPerSecond;

    private currentStep = Math.ceil(this.stepsPerSecond * 100 * Math.random()); // avoid having all emitters syncronized on the same step
    private acumulatedTime = 0.0;
    private metersToPixelsFactor = 0.0;
    private maxAgeSteps = 0;

    settings: ParticleEmitterSettings;
    particles: Array<Particle> = new Array<Particle>;


    static default() {
        return new ParticleEmitter(defaultParticleEmitterSettings())
    }
    
    constructor(settings: ParticleEmitterSettings) {
        this.settings = settings;
        this.maxAgeSteps = Math.ceil(this.stepsPerSecond * settings.maxAge)
        //console.log(`maxAgeSteps=${this.maxAgeSteps}`)
    }

    update(context: Context) {
        if (this.metersToPixelsFactor <= 0.0) {
            // a full screen is around 4 meters
            this.metersToPixelsFactor = context.screenSize.y / 4.0;
            //console.log(`metersToPixelsFactor=${this.metersToPixelsFactor}`)
        }

        //console.log(`begin update ${this.currentStep} ${context.time}`)
        this.acumulatedTime += context.deltaTime;
        while(this.acumulatedTime > this.stepTime) {
            this.updateStep()
            this.acumulatedTime -= this.stepTime;
        }
        //console.log(`end update ${this.currentStep} ${context.time}`)
    }

    private updateStep() {
        this.currentStep += 1

        //
        // update particles
        //
        for (const particle of this.particles)
            this.updateStepParticle(particle);

        //
        // generate
        //
        let rate = this.settings.particleGenerationRate;
        while (rate > 0) {
            const currentRate = Math.min(rate, this.stepsPerSecond);
            const interval = Math.floor(this.stepsPerSecond / currentRate)
            //console.log(`particleGenerationRate=${this.settings.particleGenerationRate} | currentRate=${currentRate} | interval=${interval}`)

            if ((this.currentStep % interval) == 0) {
                const particle = this.generateParticle();
                this.particles.push(particle);
                //console.log(`Generate particle ${this.particles.length}. ${this.currentStep}`);
            }

            rate -= currentRate;
        }

        // 
        // remove dead particles
        //
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            if ((this.currentStep - particle.creationStep) > this.maxAgeSteps) {
                //console.log(`Remove particle ${i}`);
                this.particles.splice(i, 1);
            }
        }
    
    }

    private generateParticle(): Particle {
        const particle = new Particle();
        particle.position = this.settings.position.copy();

        particle.scale = randomRangeValue(this.settings.scaleStart, this.settings.scaleEnd);

        const angle = randomRangeValue(this.settings.angleStart, this.settings.angleEnd);
        const speed = randomRangeValue(this.settings.speedStart, this.settings.speedEnd);
        particle.velocity = angleToVec(degresToRadians(angle)).mulSingle(speed);
        
        if (this.settings.palette.length >= 0) {
            const color = 
            particle.color = randomElement(this.settings.palette);
        }

        particle.creationStep = this.currentStep;

        if (this.settings.fadeInPoint > 0)
            particle.alpha = 0.0;
        
        return particle;
    }



    private updateStepParticle(particle: Particle) {
        particle.velocity.x += this.settings.acceleration.x * this.stepTime;
        particle.velocity.y += this.settings.acceleration.y * this.stepTime;
     
        if (this.settings.maxSpeed > 0) {
            const speed = particle.velocity.length();
            if (speed > this.settings.maxSpeed) {
                particle.velocity.normalize().mulSingle(this.settings.maxSpeed);
            }
        }

        particle.position.x += particle.velocity.x * this.stepTime;
        particle.position.y += particle.velocity.y * this.stepTime;


        if (this.settings.fadeInPoint > 0) {
            const fadeInStep = Math.floor(this.maxAgeSteps * this.settings.fadeInPoint);
            const relativeStep = this.currentStep - particle.creationStep;
            if (relativeStep <= fadeInStep) {
                const percentage = clamp(relativeStep / fadeInStep, 0.0, 1.0);
                particle.alpha = percentage;
            }
        }

        if (this.settings.fadeOutPoint > 0) {
            const fadeOutStep = Math.floor(this.maxAgeSteps * this.settings.fadeOutPoint);
            const fadeOutSteps = this.maxAgeSteps - fadeOutStep;
            const relativeStep = this.currentStep - particle.creationStep - fadeOutStep;
            if (relativeStep >= 0) {
                const percentage = clamp(relativeStep / fadeOutSteps, 0.0, 1.0);
                particle.alpha = 1.0 - percentage;
            }
        }
    }


    positionInMeters(position: Vec2): Vec2 {
        return new Vec2(position.x / this.metersToPixelsFactor, position.y / this.metersToPixelsFactor);
    }

    render(context: Context, polygon: Polygon) {
        const ctx = context.ctx;
        const globalAlpha = ctx.globalAlpha;
        const color = polygon.fillColor;

        ctx.save();
        ctx.scale(this.metersToPixelsFactor, this.metersToPixelsFactor);

        for (const particle of this.particles) {
            context.ctx.save();
            context.ctx.translate(particle.position.x, particle.position.y);
            context.ctx.scale(particle.scale, particle.scale);
    
            ctx.globalAlpha = particle.alpha;
            if (particle.color == Color.NONE) {
                polygon.fillColor = color; 
            } else {
                polygon.fillColor = particle.color; 
            }

            polygon.render(context.ctx);

            ctx.restore();
        }

        ctx.restore();
        ctx.globalAlpha = globalAlpha;
        polygon.fillColor = color;
    }
    
}