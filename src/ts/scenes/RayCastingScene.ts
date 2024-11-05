import { Context } from "../Context";
import { Scene } from "./BaseScene";
import { Vec2 } from "../core/Vec2";
import { createCapsule, createCross, createStar, Polygon } from "../core/Polygon";
import { Color } from "../core/Color";
import { angleToVec, degresToRadians, directionAngle, lerp, radiansToDegrees, randomly } from "../core/Common";
import { insideConvexPolygon, intersectRayLine, intersectRayPoly, LineSegment, Ray } from "../core/Collision";

export class RayCastingScene extends Scene {
    polygons: Polygon[] = []
    insidePolygon = -1;

    position: Vec2 = Vec2.zero()
    collisions: Vec2[] = []

    targetPolygonCorners = true; // send rays to the corners of the polygons
    targetScreenCorners = true; // send rays to the screen corners
    sweepCircle = false; // sweep a ciclre around the current position withn rayCount rays
    rayCount = 25;

    targetOffset = 0.5; // the offset used to trace addicional rays to the corners of the polygons
    similarThreshold = 0.5; // the threshold used to remove very close points

    drawRays = false;
    drawDots = false;
    drawOverlay = true;
    drawOrigin = true;

    target = Vec2.zero();
    direction = new Vec2(1.0, 0.0);

    useMotionToChangePosition = true

    constructor(context: Context) {
        super(context);
    }

    setup() { 
        super.setup();
        
        if (false) {
            this.disableAutoPilot();
        } else {
            this.autoPilotInactivityTimeout = 500;
            this.autoPilotPressMaxDuration = 1000;
            this.autoPilotIdleDuration = 50;
            this.autoPilotMoveHalts = true;
        } 

        const referenceSize = this.context.baseFontSize;
       
        {
            const poly = createCapsule(referenceSize * 5, referenceSize * 4,  3, 5)
                        .rotate(degresToRadians(-30))
                        .translate(new Vec2(referenceSize * 15, referenceSize * 15));
            poly.strokeColor = Color.WHITE;
            poly.strokeWidth = referenceSize * 0.1;

            this.polygons.push(poly);
        }

                
        {
            const poly = createCapsule(referenceSize * 3, referenceSize * 3,  2, 2)
                        .rotate(degresToRadians(-45))
                        .translate(new Vec2(referenceSize * 1, referenceSize * 8));
            poly.strokeColor = Color.WHITE;
            poly.strokeWidth = referenceSize * 0.1;

            this.polygons.push(poly);
        }

        {
            const poly = createCapsule(referenceSize * 5, referenceSize * 5,  1, 1)
                        .translate(new Vec2(referenceSize * 4.5, -referenceSize * 9));
            poly.strokeColor = Color.WHITE;
            poly.strokeWidth = referenceSize * 0.1;

            this.polygons.push(poly);
        }
        
        {
            const poly = createCapsule(referenceSize * 5, referenceSize * 5,  1, 1)
                        .rotate(degresToRadians(-45))
                        .translate(new Vec2(referenceSize * 15, -referenceSize * 15));
            poly.strokeColor = Color.WHITE;
            poly.strokeWidth = referenceSize * 0.1;

            this.polygons.push(poly);
        }

        {
            const poly = createStar(referenceSize * 2)
                        .rotate(degresToRadians(-45))
                        .translate(new Vec2(-referenceSize * 15, -referenceSize * 15));
            poly.strokeColor = Color.WHITE;
            poly.strokeWidth = referenceSize * 0.1;

            this.polygons.push(poly);
        }

        {
            const poly = createStar(referenceSize * 3)
                        .rotate(degresToRadians(-45))
                        .translate(new Vec2(-referenceSize * 15, 0));
            poly.strokeColor = Color.WHITE;
            poly.strokeWidth = referenceSize * 0.1;

            this.polygons.push(poly);
        }

        {
            const poly = createCross(referenceSize * 5, referenceSize)
                        .rotate(degresToRadians(-45))
                        .translate(new Vec2(-referenceSize * 15, referenceSize * 15));
            poly.strokeColor = Color.WHITE;
            poly.strokeWidth = referenceSize * 0.1;

            this.polygons.push(poly);
        }
        

        this.position = Vec2.zero();
    }

    private setPosition(click: Vec2) {
        const screenSize = this.context.screenSize;
        
        // avoid setting the position too close to the screen border
        const margin = 5;
        if (click.x < margin || click.y < margin || 
            click.x > screenSize.x - margin || click.y > screenSize.y - margin) return;

        const position = new Vec2(click.x - screenSize.x / 2.0, click.y - screenSize.y / 2.0);

        if (this.useMotionToChangePosition && !this.autoPilotRunning()) {
            this.position = position;
        } else {
            this.target = position;
        }
    }

    onPointerDown(position: Vec2) {
        super.onPointerDown(position);
        this.setPosition(position);
    }

    onPointerMove(position: Vec2): void {
        super.onPointerMove(position);
        this.setPosition(position);
    }

    tearDown() {
        super.tearDown();

        this.polygons = [];
        this.position = Vec2.zero();
        this.collisions = [];
    }


    update(): void {
        super.update();

        //
        // update center position
        //
        if (!this.useMotionToChangePosition || this.autoPilotRunning()) {
            let dir = this.target.copy().sub(this.position);
            if (dir.length() > 1.0) {
                dir.normalize();
                this.direction.add( dir.sub(this.direction).mulSingle(this.context.deltaTime * 3.0) );
            }

            this.position.add(this.direction.copy().mulSingle(300.0 * this.context.deltaTime));
        }



        this.collisions = [];
        this.insidePolygon = -1;

        // check if the position is inside a polygon
        for (let i = 0; i != this.polygons.length; i++) {
            if (insideConvexPolygon(this.position, this.polygons[i])) {
                //console.log("Inside polygon", i);
                this.insidePolygon = i;
                break;
            }
        }

        // collect the points of interest where we will send rays
        if (this.insidePolygon == -1) {
            let targetPoints: Vec2[] = [];

            // screen corners
            if (this.targetScreenCorners) {
                const halfSize = this.context.screenSize.copy().mulSingle(0.5);

                targetPoints = targetPoints.concat([
                    new Vec2(-halfSize.x, -halfSize.y),
                    new Vec2(halfSize.x, -halfSize.y),
                    new Vec2(halfSize.x, halfSize.y),
                    new Vec2(-halfSize.x, halfSize.y)
                ]);
            }

            // polygon corners
            if (this.targetPolygonCorners) {
                for (const poly of this.polygons) {
                    for (const point of poly.points) {
                        targetPoints.push(point);

                        // addtional points, to hit the back walls
                        const dir = point.copy().sub(this.position).normalize().rotate90();
                        targetPoints.push(point.copy().add(dir.copy().mulSingle(this.targetOffset)));
                        targetPoints.push(point.copy().add(dir.copy().mulSingle(-this.targetOffset)));
                    }
                }
            }

            // cast rays
            for (const point of targetPoints) {
                const ray: Ray = {
                    origin: this.position,
                    direction: point.copy().sub(this.position).normalize()
                };
    
                this.collisions.push(this.getCollision(ray));
            }


            // cast rays in a circle
            if (this.sweepCircle) {
                for (let i = 0; i != this.rayCount; i++) {  
                    const angle = i * (2.0 * Math.PI / this.rayCount);
                    const direction = angleToVec(angle);
        
                    const ray: Ray = {
                        origin: this.position,
                        direction: direction
                    };
        
                    this.collisions.push(this.getCollision(ray));
                }

            }
        }

        //
        // sort the array of collisions by angle
        //
        this.collisions.sort((a: Vec2, b:Vec2): number =>{
            const aAngle = directionAngle(a.copy().sub(this.position).normalize());
            const bAngle = directionAngle(b.copy().sub(this.position).normalize());
            //console.log("angles", aAngle, bAngle);  
            if (aAngle < bAngle) return -1;
            else if (aAngle > bAngle) return 1;
            else return 0;
        });
        
        //
        // remove very close points
        //
        this.collisions = this.collisions.filter((value, index, self) => {
            if (index == 0) return true;
            const prev = self[index - 1];
            return value.copy().sub(prev).length() > this.similarThreshold;
        });
    }

    checkWallCollisions(r: Ray): Vec2[] {
        const output: Vec2[] = [];

        const screenSize = this.context.screenSize;
        const halfSize = screenSize.copy().mulSingle(0.5);

        const segments: LineSegment[] = [
            {a: new Vec2(-halfSize.x, -halfSize.y), b: new Vec2(halfSize.x, -halfSize.y)},
            {a: new Vec2(halfSize.x, -halfSize.y), b: new Vec2(halfSize.x, halfSize.y)},
            {a: new Vec2(halfSize.x, halfSize.y), b: new Vec2(-halfSize.x, halfSize.y)},
            {a: new Vec2(-halfSize.x, halfSize.y), b: new Vec2(-halfSize.x, -halfSize.y)}
        ];

        for (const segment of segments) {
            const intersection = intersectRayLine(r, segment);
            if (intersection) 
                output.push(intersection.position);
        }

        return output;
    }

    checkPolygonCollisions(r: Ray): Vec2[] {
        const output: Vec2[] = [];

        for (const poly of this.polygons) {
            const result = intersectRayPoly(r, poly);

            output.push(...result);
        }

        return output;
    }

    getCollision(r: Ray) {
        const merged = this.checkWallCollisions(r).concat(this.checkPolygonCollisions(r));

        let position = Vec2.zero();
        let distance = Number.MAX_VALUE;

        for (const p of merged) {
            const d = p.copy().sub(r.origin).length();
            if (d < distance) {
                distance = d;
                position = p;
            }
        }

        return position;
    }
    
    render() {
        super.render();

        const ctx = this.context.ctx;
        const screenSize = this.context.screenSize;

        for (let i = 0; i != this.polygons.length; i++) {
            if (this.insidePolygon == i) {
                this.polygons[i].fillColor = Color.WHITE.withAlpha(0.5);
            } else {
                this.polygons[i].fillColor = Color.TRANSPARENT;
            }

            this.polygons[i].render(this.context.ctx);
        }

        // origin
        if (this.drawOrigin)
        {
            ctx.fillStyle = Color.RED.toHex();
            ctx.beginPath();
            ctx.arc(this.position.x, this.position.y, this.context.baseFontSize * 0.3, 0, Math.PI * 2);
            ctx.fill();
        }

        if (this.drawDots || this.drawRays) {
            for (const collsion of this.collisions) {
                ctx.fillStyle = Color.GREEN.toHex();
                ctx.lineWidth = this.context.baseFontSize * 0.1;

                if (this.drawRays) {
                    ctx.beginPath();
                    ctx.moveTo(this.position.x, this.position.y);
                    ctx.lineTo(collsion.x, collsion.y);
                    ctx.stroke();
                }

                if (this.drawDots) {
                    ctx.beginPath();
                    ctx.arc(collsion.x, collsion.y, this.context.baseFontSize * 0.3, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }

        if (this.drawOverlay && this.collisions.length > 2) {
            ctx.fillStyle = Color.WHITE.withAlpha(0.25).toHex();
            ctx.beginPath();
            ctx.moveTo(this.collisions[0].x, this.collisions[0].y);
            for (let i = 1; i != this.collisions.length; i++) {
                ctx.lineTo(this.collisions[i].x, this.collisions[i].y);
            }
            ctx.closePath();
            ctx.fill();
        }
    }
}