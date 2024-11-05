import { Context } from "../Context";
import { createCapsule, createCircle, createCross, createRectangle, createStar, Polygon } from "../core/Polygon";
import { defaultParticleEmitterSettings, ParticleEmitter } from "../core/ParticleEmitter";
import { Scene } from "./BaseScene";
import { Vec2 } from "../core/Vec2";
import { directionAngle, radiansToDegrees } from "../core/Common";


export class CannonScene extends Scene {
    private geometries: Polygon[] = []; 
    private emitters: ParticleEmitter[] = [];

    private angleAperture = 15.0;

    constructor(context: Context) {
        super(context);
    }

    setup() { 
        super.setup(); 

        this.autoPilotIdleDuration = 1000;
        this.autoPilotMoveHalts = true;

        this.addEmitter(0);
        this.addEmitter(1);
        this.addEmitter(2);
        this.addEmitter(3);
        this.addEmitter(4);   
    }

    addEmitter(kind: number) {
        
        //
        // geometry
        //
        {
            let geometry: Polygon;
            if (kind == 4) {
                geometry = createCross(0.25, 0.02);
            } else if (kind == 3) {
                geometry = createStar(0.1);
            } else if (kind == 2) {
                geometry = createCapsule(0.1, 0.1, 16); 
            } else if (kind == 1) {
                geometry = createRectangle(0.1, 0.1); 
            } else {
                geometry = createCircle(0.1, 16); // a circle with a 10cm in radius
            }
            this.geometries.push(geometry);
        }

        //
        // Emitter
        //
        {
            let settings = defaultParticleEmitterSettings();
            settings.acceleration = new Vec2(0.0, 4.8)
            settings.maxAge = 3.2;
            settings.particleGenerationRate = 3.0;

            settings.fadeInPoint = 0.15;
            settings.fadeOutPoint = 0.85;

            settings.speedStart = 3.0;
            settings.speedEnd = 5.5;

            const center = 270;
            settings.angleStart = center - this.angleAperture;
            settings.angleEnd = center + this.angleAperture;

            settings.scaleStart = 0.5;
            settings.scaleEnd = 1.5;

            this.emitters.push(new ParticleEmitter(settings));
        }
    }

    tearDown() {
        super.tearDown();
        this.geometries = [];
        this.emitters = [];
    }

    onPointerDown(position: Vec2) {
        super.onPointerDown(position);
        this.updateEmittersWithPosition(position);
    }

    
    onPointerMove(position: Vec2): void {
        super.onPointerMove(position);
        this.updateEmittersWithPosition(position);
    }

    private updateEmittersWithPosition(position: Vec2) {
        const screenSize = this.context.screenSize;
        let p = new Vec2(position.x - screenSize.x / 2.0, position.y - screenSize.y / 2.0);


        for (const emitter of this.emitters) {
            let targetInMeters = emitter.positionInMeters(p);
            let dir = targetInMeters.copy().sub(emitter.settings.position).normalize();

            const center = radiansToDegrees(directionAngle(dir));
            emitter.settings.angleStart = center - this.angleAperture;
            emitter.settings.angleEnd = center + this.angleAperture;
        }
    }
    


    update(): void {
        super.update();

        for (const emitter of this.emitters) {
            emitter.update(this.context);
        }
    }
    
    render() {
        super.render();

        for (let i = 0; i < this.emitters.length; i++) {
            const emitter = this.emitters[i];
            const geometry = this.geometries[i];
            emitter.render(this.context, geometry);
        }
    }
}