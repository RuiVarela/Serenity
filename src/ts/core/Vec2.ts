import { equivalent, lerp } from "./Common";

export class Vec2 {
    x: number;
    y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    toString(): string {
        return `(${this.x}, ${this.y})`;
    }

    isZero(): boolean {
        return equivalent(this.x, 0.0) && equivalent(this.y, 0.0);
    }
    static zero(): Vec2 { return new Vec2(0, 0) };

    copy(): Vec2 {
        return new Vec2(this.x, this.y);
    }

    set(v: Vec2): Vec2 { return this.setScalar(v.x, v.y); }
    setSingle(s: number): Vec2 { return this.setScalar(s, s); }
    setScalar(x: number, y: number): Vec2 {
        this.x = x;
        this.y = y;
        return this;
    }

    add(v: Vec2): Vec2 { return this.addScalar(v.x, v.y); }
    addScalar(x: number, y: number): Vec2 {
        this.x += x;
        this.y += y;
        return this;
    }

    sub(v: Vec2): Vec2 { return this.subScalar(v.x, v.y); }
    subScalar(x: number, y: number): Vec2 {
        this.x -= x;
        this.y -= y;
        return this;
    }

    mul(v: Vec2): Vec2 { return this.mulScalar(v.x, v.y); }
    mulSingle(s: number): Vec2 { return this.mulScalar(s, s); }
    mulScalar(x: number, y: number): Vec2 {
        this.x *= x;
        this.y *= y;
        return this;
    }
    
    div(s: Vec2): Vec2 { return this.divScalar(s.x, s.y); }
    divSingle(s: number): Vec2 { return this.divScalar(s, s); }
    divScalar(x: number, y: number): Vec2 {
        this.x /= x;
        this.y /= y;
        return this;
    }


    squaredLength(): number {
        return this.x * this.x + this.y * this.y;
    }

    length(): number {
        return Math.sqrt(this.squaredLength());
    }

    normalize(): Vec2 {
        let len = this.length();

        if (equivalent(len, 0.0)) {
            this.setSingle(0);
            return this;
        }
    
        return this.divSingle(len);
    }

    dot(v: Vec2): number {
        return this.x * v.x + this.y * v.y;
    }

    // 2D vector cross product analog.
    // The cross product of 2D vectors results in a 3D vector with only a z component.
    // This function returns the magnitude of the z value.
    cross(v: Vec2): number { 
        return this.x * v.y - this.y * v.x
    }

    rotate90(): Vec2 {
        let x = this.x;
        this.x = -this.y;
        this.y = x;
        return this;
    }

    angle(): number {
        return Math.atan2(this.y, this.x);
    }

    static lerp(a: Vec2, b: Vec2, t: number): Vec2 {
        return new Vec2(lerp(a.x, b.x, t), lerp(a.y, b.y, t));
    }

    static random(): Vec2 {
        return new Vec2(Math.random(), Math.random());
    }

    sameAs(v: Vec2): boolean {
        return equivalent(this.x, v.x) && equivalent(this.y, v.y);
    }
}