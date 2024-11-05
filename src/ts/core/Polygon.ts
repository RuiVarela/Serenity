import { Vec2 } from './Vec2';
import { Color } from './Color';
import { degresToRadians } from './Common';

export class Polygon {
    points = new Array<Vec2>();
    
    fillColor = Color.NONE;

    strokeColor = Color.NONE;
    strokeWidth = 0;

    vertexColor = Color.NONE;
    vertexRadius = 1;

    constructor() { }

    copy(): Polygon {
        const p = new Polygon();

        for (const point of this.points)
            p.add(point.copy());

        p.fillColor = this.fillColor.copy();
        
        p.strokeColor = this.strokeColor.copy();
        p.strokeWidth = this.strokeWidth;

        p.vertexColor = this.vertexColor.copy();
        p.vertexRadius = this.vertexRadius;

        return p;
    }

    add(point: Vec2): Polygon {
        this.points.push(point);
        return this;
    }

    

    computeCenter(): Vec2 {
        let center = new Vec2(0, 0);

        for (const point of this.points)
            center.add(point);

        return center.divSingle(this.points.length);
    }

    //
    // Centers the object
    //
    centerOnPosition(position: Vec2): Polygon {
        let center = this.computeCenter();
        return this.translate(position.copy().sub(center));
    }
    
    centerOnOrigin(): Polygon {
        return this.centerOnPosition(new Vec2(0, 0));
    }

    //
    // translates all points by the given offset
    //
    translate(offset: Vec2): Polygon {
        for (const point of this.points)
            point.add(offset);

        return this;
    }

    //
    // rotates all points around the center of the polygon
    //
    rotate(angle: number): Polygon {
        let center = this.computeCenter();

        for (const point of this.points) {
            const x = point.x - center.x;
            const y = point.y - center.y;
            point.x = center.x + x * Math.cos(angle) - y * Math.sin(angle);
            point.y = center.y + x * Math.sin(angle) + y * Math.cos(angle);
        }

        return this
    }

    //
    // scales all points by the given factor using the center of the polygon
    //
    scale(factor: Vec2): Polygon {
        let center = this.computeCenter();

        for (const point of this.points) {
            const x = point.x - center.x;
            const y = point.y - center.y;
            point.x = center.x + x * factor.x;
            point.y = center.y + y * factor.x;
        }

        return this;
    }

    //
    // duplicates the polygon by flipping it horizontally or vertically
    //
    duplicateHorizontally(): Polygon {
        return this.duplicateByVector(new Vec2(-1.0, 1.0));
    }

    duplicateVertically(): Polygon {
        return this.duplicateByVector(new Vec2(1.0, -1.0));
    }

    private duplicateByVector(vector: Vec2): Polygon {
        const flipped = new Array<Vec2>();   

        for (const point of this.points)
            flipped.push(point.copy().mul(vector));

        flipped.reverse();

        for (const point of flipped)
            this.points.push(point);
   
        return this;
    }

    removeDuplicatePoints(): Polygon {
        const uniquePoints = new Array<Vec2>();

        for (const point of this.points) {
            let found = false;
            for (const uniquePoint of uniquePoints) {
                if (uniquePoint.sameAs(point)) {
                    found = true;
                    break;
                }
            }
            if (!found)
                uniquePoints.push(point);
        }

        this.points = uniquePoints;
        return this;
    }

    //
    // Turtle graphics
    //
    private turtleAngle = 0;
    private turtlePosition = new Vec2(0, 0);

    turtleReset(): Polygon {
        this.turtleAngle = 0;
        this.turtlePosition = new Vec2(0, 0);
        return this;
    }

    turtleForward(distance: number): Polygon {
        this.turtlePosition.x += Math.cos(this.turtleAngle) * distance;
        this.turtlePosition.y += Math.sin(this.turtleAngle) * distance;
        this.add(this.turtlePosition.copy());
        return this;
    }

    turtleTurn(degrees: number): Polygon {
        this.turtleAngle += degresToRadians(degrees);
        return this;
    }


    //
    // rendering
    //
    render(ctx: CanvasRenderingContext2D): void {
        if (this.points.length < 2) 
            return;
        
        ctx.fillStyle = this.fillColor.toHex();
        ctx.strokeStyle = this.strokeColor.toHex();

        if (this.strokeWidth > 0)
            ctx.lineWidth = this.strokeWidth;
      
        ctx.beginPath();
        ctx.moveTo(this.points[0].x, this.points[0].y);
        for (let i = 1; i < this.points.length; i++)
            ctx.lineTo(this.points[i].x, this.points[i].y);
        
        ctx.closePath();

        if (!this.fillColor.isNone()) 
            ctx.fill();

        if (!this.strokeColor.isNone() && this.strokeWidth > 0) 
            ctx.stroke(); 

        if (!this.vertexColor.isNone() && this.vertexRadius > 0) {
            ctx.fillStyle = this.vertexColor.toHex();
            for (let i = 0; i < this.points.length; i++) {
                ctx.beginPath();
                ctx.arc(this.points[i].x, this.points[i].y, this.vertexRadius, 0, Math.PI * 2);
                ctx.closePath();
                ctx.fill();
            }
        }
    }
}

export function createRectangle(w: number, h: number): Polygon {
    const p = new Polygon();

    p.add(new Vec2(-w / 2.0, -h / 2.0));
    p.add(new Vec2( w / 2.0, -h / 2.0));
    p.add(new Vec2( w / 2.0,  h / 2.0));
    p.add(new Vec2(-w / 2.0,  h / 2.0));
    return p 
}

export function createCapsule(w: number, h: number, 
    leftSegments: number = 8, rightSegments: number = 8): Polygon {
    const p = new Polygon();

    if (leftSegments < 1) 
        leftSegments = 1;

    if (rightSegments < 1) 
        rightSegments = 1;

    const radius = h / 2;
    const halfW = w / 2;
    const halfH = h / 2;

    p.add(new Vec2(-halfW,  -halfH));
    for (let i = 0; i < rightSegments; i++) {
        const angle = i / rightSegments * Math.PI - Math.PI / 2;
        const x = halfW + Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        p.add(new Vec2(x, y));
    }

    p.add(new Vec2(halfW, halfH));
    for (let i = 0; i < leftSegments; i++) {
        const angle = i / leftSegments * Math.PI + Math.PI / 2;
        const x = -halfW + Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        p.add(new Vec2(x, y));
    }

    return p;
}

export function createCircle(radius: number, segments: number = 32, splits: number = 1): Polygon {
    const p = new Polygon();
    
    if (segments < 3) 
        segments = 3;

    const delta = Math.PI * 2 / segments
    for (let i = 0; i < segments; i++) {
        const angleA = i * delta;
        let a = new Vec2(Math.cos(angleA) * radius, Math.sin(angleA) * radius);

        p.add(a);

        if (splits > 1) {
            const angleB = (i + 1) * delta;
            let b = new Vec2(Math.cos(angleB) * radius, Math.sin(angleB) * radius);

            for (let s = 1; s != splits; ++s) {
                let t = s / splits;
                p.add(Vec2.lerp(a, b, t));
            }
        }
    }
    
    
    return p;
}

export function createCross(size: number, thinkness: number): Polygon {
    const halfSize = size / 2;
    const halfThinkness = thinkness / 2;

    const p = new Polygon();
    return p
        .add(new Vec2(-halfSize, 0.0))
        .add(new Vec2(-halfSize, -halfThinkness))
        .add(new Vec2(-halfThinkness, -halfThinkness))
        .add(new Vec2(-halfThinkness, -halfSize))
        .add(new Vec2(0.0, -halfSize))
        .duplicateHorizontally()
        .duplicateVertically()
        .removeDuplicatePoints();
}

export function createStar(size: number): Polygon {
    const p = new Polygon();
    p
        .turtleForward(0.0)
        .turtleTurn(90 - 18)

    for (let i = 0; i < 5; i++) {
        p
            .turtleForward(size)
            .turtleTurn(-72)
            .turtleForward(size)
            .turtleTurn(180 - 36)
    }

    return p.centerOnOrigin();
}

export function expandLine(p0: Vec2, p1: Vec2,
    side: number, 
    startSegments: number = 8, endSegments: number = 8
): Polygon {
    const p = new Polygon();

    const dir = p1.copy().sub(p0);
    const baseAngle = dir.angle();
    const distance = dir.length();

    dir.normalize();
    const normal = dir.copy().rotate90();


    const corner0 = p0.copy().add(normal.copy().mulSingle(side));
    const corner1 = corner0.copy().add(dir.copy().mulSingle(distance));
    const corner2 = corner1.copy().add(normal.copy().mulSingle(-2.0 * side));
    const corner3 = corner2.copy().add(dir.copy().mulSingle(-distance));

    p.add(corner0);
    p.add(corner1);


    for (let i = 0; i < endSegments; i++) {
        const center = corner1.copy().add(corner2).divSingle(2.0);

        const angle = baseAngle - (i / endSegments * Math.PI - Math.PI / 2);
        const x = Math.cos(angle) * side;
        const y = Math.sin(angle) * side;
        p.add(center.addScalar(x, y));
    }
    
    p.add(corner2);
    p.add(corner3);


    for (let i = 0; i < startSegments; i++) {
        const center = corner0.copy().add(corner3).divSingle(2.0);

        const angle = baseAngle - (Math.PI / 2) - (i / startSegments * Math.PI);
        const x = Math.cos(angle) * side;
        const y = Math.sin(angle) * side;
        p.add(center.addScalar(x, y));
    }

    return p;
}

export function createL(size: number, thinkness: number, x: number = 1.0, y: number = 1.0): Polygon {
    const halfSize = size / 2;
    const halfThinkness = thinkness / 2;

    const p = new Polygon();
    return p
        .add(new Vec2(x * halfSize, y * -halfThinkness))
        .add(new Vec2(x * halfThinkness, y * -halfThinkness))
        .add(new Vec2(x * halfThinkness, y * -halfSize))
        .add(new Vec2(x * -halfThinkness, y * -halfSize))
        .add(new Vec2(x * -halfThinkness, y * halfThinkness))
        .add(new Vec2(x * halfSize, y * halfThinkness));
}

export function createT(size: number, thinkness: number, x: number = 1.0, y: number = 1.0): Polygon {
    const halfSize = size / 2;
    const halfThinkness = thinkness / 2;

    const p = new Polygon();
    if (x > 0.0) {
        return p
        .add(new Vec2(-halfSize,        y * -halfThinkness))
        .add(new Vec2(halfSize,         y * -halfThinkness))
        .add(new Vec2(halfSize,         y * halfThinkness))
        .add(new Vec2(halfThinkness,    y * halfThinkness))
        .add(new Vec2(halfThinkness,    y * halfSize))
        .add(new Vec2(-halfThinkness,   y * halfSize))
        .add(new Vec2(-halfThinkness,   y * halfThinkness))
        .add(new Vec2(-halfSize,        y * halfThinkness))
        ;
    } else {
        return p
        .add(new Vec2(y * -halfSize,        -halfThinkness))
        .add(new Vec2(y * -halfThinkness,   -halfThinkness))
        .add(new Vec2(y * -halfThinkness,   -halfSize))
        .add(new Vec2(y * halfThinkness,    -halfSize))
        .add(new Vec2(y * halfThinkness,    halfSize))
        .add(new Vec2(y * -halfThinkness,   halfSize))
        .add(new Vec2(y * -halfThinkness,   halfThinkness))
        .add(new Vec2(y * -halfSize,        halfThinkness))
        ;
    }
 

}