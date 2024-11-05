import { Vec2 } from "./Vec2";

export class Rect {
    left: number;
    top: number;
    right: number;
    bottom: number;

    constructor(left: number, top: number, right: number, bottom: number) {
        this.left = left;
        this.top = top;
        this.right = right;
        this.bottom = bottom;
    }

    static fromSize(x: number, y: number, width: number, height: number): Rect {
        return new Rect(x, y, x + width, y + height);
    }
    
    static zero(): Rect { return new Rect(0, 0, 0, 0); };

    isZero(): boolean {
        return this.width() == 0 && this.height() == 0;
    }

    width(): number { return this.right - this.left; }
    height(): number { return this.bottom - this.top; }

    set(left: number, top: number, right: number, bottom: number): void {
        this.left = left;
        this.top = top;
        this.right = right;
        this.bottom = bottom;
    }

    setSize(x: number, y: number, width: number, height: number): void {
        this.left = x;
        this.top = y;
        this.right = x + width;
        this.bottom = y + height;
    }

    center(): Vec2 {
        return new Vec2((this.left + this.right) / 2, (this.top + this.bottom) / 2);
    }

    offset(x: number, y: number): void {
        this.left += x;
        this.top += y;
        this.right += x;
        this.bottom += y;
    }

    toString(): string {
        return `(${this.left}, ${this.top}, ${this.right}, ${this.bottom})`;
    }
}