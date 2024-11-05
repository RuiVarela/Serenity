import { Context } from "../Context";
import { Color } from "../core/Color";
import { palette, repeatSpace } from "../core/Common";
import { createStar, Polygon } from "../core/Polygon";
import { Vec2 } from "../core/Vec2";
import { Scene } from "./BaseScene";

interface Star {
    center: Vec2;
    size: number;
    scale: number;
    polygon: Polygon;
}

export class StartfieldScene extends Scene {
    private objects: Array<Star> = [];
    private time = 0;

    constructor(context: Context) {
        super(context);
    }

    onPointerDown(position: Vec2) {
        super.onPointerDown(position);
        this.nuke(position);
    }

    onPointerMove(position: Vec2): void {
        super.onPointerMove(position)
        this.nuke(position)
    }

    nuke(position: Vec2) {
        const screenSize = this.context.screenSize;
        const pos = position.copy().sub(screenSize.copy().divSingle(2));

        const threshold = Math.min(screenSize.x, screenSize.y) * 0.025;
        const toDelete: Array<number> = [];
        for (let i = 0; i < this.objects.length; i++) {
            const object = this.objects[i];
            const distance = pos.copy().sub(this.objectPosition(object, this.time)).length();

            if (distance < threshold)
                toDelete.push(i);
        }

        this.objects = this.objects.filter((v, i) => toDelete.indexOf(i) == -1)

        //console.log("Should delete", toDelete);
    }
    
    setup() { 
        super.setup(); 

        if (false) {
            this.disableAutoPilot();
        } else {
            this.autoPilotMoveHalts = true;
            this.autoPilotPressMinDuration = 50;
            this.autoPilotPressMaxDuration = 50;
            this.autoPilotIdleDuration = 250;
        }

        const screenSize = this.context.screenSize;

        const size = Math.min(screenSize.x, screenSize.y) * 0.025

        let layers = 10;
        let max = 30;

        for (let l = 0; l < layers; l++) {
            let star = createStar(size);
            star.fillColor = palette[l % palette.length];
            star.strokeColor = Color.WHITE;
            star.strokeWidth = size * 0.05;

            const scale = (l + 1) / layers;

            for (let s = 0; s < max; s++) {
                let object: Star = {
                    center: Vec2.random().mul(screenSize).sub(screenSize.copy().divSingle(2)),
                    size: size,
                    scale: scale * (Math.random() * 0.2 + 0.8),
                    polygon: star
                };  

                this.objects.push(object);
            }
        }
    }

    tearDown() {
        super.tearDown();
        this.objects = [];
    }

    update(): void {
        super.update();
        this.time = this.context.time;
    }

    objectPosition(object: Star, time: number): Vec2 {
        let position = new Vec2(time * -50.0 * object.scale, time)
        position.add(object.center);
        position.x = repeatSpace(this.context.screenSize.x / 2 + object.size, position.x);
        position.y = repeatSpace(this.context.screenSize.y / 2 + object.size, position.y);
        return position;
    }

    render() {
        const context = this.context;

        super.render();

        for (let current of this.objects) {
            context.ctx.save();

            let position = this.objectPosition(current, context.time);

            context.ctx.translate(position.x, position.y);
            context.ctx.scale(current.scale, current.scale);
            context.ctx.rotate((1.0 - current.scale) * context.time);

            current.polygon.render(context.ctx);
            
            context.ctx.restore();
        }

    }
}