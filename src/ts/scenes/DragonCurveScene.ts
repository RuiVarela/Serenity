import { Context } from "../Context";
import { Scene } from "./BaseScene";
import { Vec2 } from "../core/Vec2";
import { Color } from "../core/Color";
import { boundingBox, clamp, computeLetterbox, palette } from "../core/Common";
import { Rect } from "../core/Rect";
import { debugPoints } from "../core/Render";

export class DragonCurveScene extends Scene {
    points: Array<Vec2> = [];

    interpolationStartPoints: Array<Vec2> = [];
    interpolationEndPoints: Array<Vec2> = [];
    interpolationPoints: Array<Vec2> = [];
    animationStartTime: number = -1.0;

    currentIteration: number = 0;
    splitting: boolean = false;
    maxIterations: number = 12;

    animationDuration: number = 0.5;    

    constructor(context: Context) {
        super(context);
    }

    setup() { 
        super.setup();
        
        if (false) {
            this.disableAutoPilot();
        } else {
            this.autoPilotInactivityTimeout = 2500;
            this.autoPilotPressMaxDuration = 1;
            this.autoPilotIdleDuration = 250;
        } 

        this.reset();
    }

    tearDown() {
        super.tearDown();

        this.points = []
    }

    onPointerDown(position: Vec2) {
        super.onPointerDown(position);

        if (this.animationStartTime < 0.0) {
            this.iterate();
        }
    }

    update(): void {
        super.update();

        // animation code
        if (this.animationStartTime < 0.0) 
            return;

        const progress = clamp((this.context.time - this.animationStartTime) / this.animationDuration, 0.0, 1.0);

        if (this.interpolationStartPoints.length != this.interpolationEndPoints.length) throw new Error("Interpolation points mismatch (start/end)");
        if (this.interpolationStartPoints.length != this.interpolationPoints.length) throw new Error("Interpolation points mismatch (start/points)");

        for (let i = 0; i < this.interpolationStartPoints.length; i++) {
            const start = this.interpolationStartPoints[i];
            const end = this.interpolationEndPoints[i];
            this.interpolationPoints[i] = Vec2.lerp(start, end, progress);
        }

        if (progress === 1.0) {
            this.points = this.interpolationEndPoints;
            this.interpolationStartPoints = [];
            this.interpolationEndPoints = [];
            this.interpolationPoints = [];
            this.animationStartTime = -1.0;

            if (!this.splitting) 
                this.nukeOddPoints();
            
            //console.log("Animation done");
            //this.dumpBB();
        }
    }

    reset() {

        this.points = [];

        if (false) {
            const lineSize = Math.min(this.context.screenSize.x, this.context.screenSize.y) * 0.75;
            this.points.push(new Vec2(-lineSize / 2.0, 0.0));
            this.points.push(new Vec2(lineSize / 2.0, 0.0));
        } else {
            //
            // centering params
            //

            const topFactor = 0.6666666666666666;
            const leftFactor = 0.22105263157894736; 
            const rightFactor = 0.8947368421052632;
            const aspect = 1.507936507936508;

            const expandedRect = computeLetterbox(this.context.screenSize, new Vec2(aspect, 1.0));
            expandedRect.offset(-this.context.screenSize.x / 2.0, -this.context.screenSize.y / 2.0);

            const left = expandedRect.left + expandedRect.width() * leftFactor;
            const right = expandedRect.left + expandedRect.width() * rightFactor;
            const y = expandedRect.top + expandedRect.height() * topFactor;

            this.points.push(new Vec2(left, y));
            this.points.push(new Vec2(right, y));
        }


        this.interpolationStartPoints = [];
        this.interpolationEndPoints = [];
        this.interpolationPoints = [];
        this.animationStartTime = -1.0;

        this.currentIteration = 0;
        this.splitting = true;
    }

    split() {
        if (this.points.length < 2) 
            return;

        this.interpolationStartPoints = [];
        this.interpolationEndPoints = [];

        this.interpolationStartPoints.push(this.points[0]);
        this.interpolationEndPoints.push(this.points[0]);

        for (let i = 1; i < this.points.length; i++) {
            const p1 = this.points[i - 1];
            const p2 = this.points[i + 0];

            const dir = (i % 2 === 0) ? -1 : 1;
            const mid = p1.copy().add(p2).mulSingle(0.5);
            const perpendicular = p1.copy().sub(p2).mulSingle(0.5).rotate90().mulSingle(dir);
            
            const target = mid.copy().add(perpendicular);

            this.interpolationEndPoints.push(target);
            this.interpolationEndPoints.push(p2);

            this.interpolationStartPoints.push(mid);
            this.interpolationStartPoints.push(p2);
        }

        this.interpolationPoints = this.interpolationStartPoints.slice();
        this.currentIteration = this.currentIteration + 1;
        this.animationStartTime = this.context.time;

        //console.log("splitting : " + this.currentIteration + " " + this.interpolationEndPoints.length);
    }

    dumpBB() {
        const bb = boundingBox(this.points);

        const top = (this.points[0].y - bb.top) / bb.height();
        const left = (this.points[0].x - bb.left) / bb.width();
        const right = (this.points[this.points.length - 1].x - bb.left) / bb.width();

        console.log(`iteration=${this.currentIteration} top=${top} left=${left} right=${right} | aspect=${bb.width() / bb.height()}`);
    }

    nukeOddPoints() {
        if (this.points.length < 2) 
            return;

        const computed: Array<Vec2> = [];
        computed.push(this.points[0]);
        for (let i = 1; i < this.points.length; i++) 
            if (i % 2 === 0) 
                computed.push(this.points[i]);
        this.points = computed;
    }

    unsplit() {
        if (this.points.length < 2) 
            return;


        this.interpolationStartPoints = [];
        this.interpolationEndPoints = [];

        this.interpolationStartPoints.push(this.points[0]);
        this.interpolationEndPoints.push(this.points[0]);

        for (let i = 1; i < this.points.length; i++) {
            if (i % 2 === 0) {
                this.interpolationStartPoints.push(this.points[i]);
                this.interpolationEndPoints.push(this.points[i]);
            } else {
                this.interpolationStartPoints.push(this.points[i]);

                if ((i + 1) >= this.points.length) throw new Error("Unsplitting error, size must be odd");

                const prev = this.points[i - 1];
                const next = this.points[i + 1];
                const mid = prev.copy().add(next).mulSingle(0.5);

                this.interpolationEndPoints.push(mid);
            }
        }

        this.interpolationPoints = this.interpolationStartPoints.slice();
        this.currentIteration = this.currentIteration - 1;
        this.animationStartTime = this.context.time;

        //console.log("unsplitting : " + this.currentIteration);
    }

    iterate() { 

        if (this.splitting) {
            if (this.currentIteration >= this.maxIterations) {
                console.log("Max iterations reached -> unsplitting");
                this.splitting = false;
            }
        } else {
            if (this.currentIteration == 0) {
                console.log("Min iterations reached -> splitting");
                this.splitting = true;
            }
        }

        if (this.splitting) {
            this.split();
        } else {
            this.unsplit();
        }
    }

    private renderLines(points: Vec2[], color: Color, lineScale: number = 1.0) {
        const ctx = this.context.ctx;

        if (points.length < 2) 
            return;

        ctx.lineWidth = this.context.baseFontSize * lineScale;
        ctx.strokeStyle = color.toHex();
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        
        for (let i = 1; i < points.length; i++) 
            ctx.lineTo(points[i].x, points[i].y);
        
        ctx.stroke();
    }

    
    render() {
        super.render();

        const points = (this.animationStartTime < 0.0) ? this.points : this.interpolationPoints;

        this.renderLines(points, palette[8], 0.2);
        this.renderLines(points, palette[5], 0.1);
        //debugPoints(this.context, points, Color.WHITE);
    }
}