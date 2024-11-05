export class Color {
    r: number = 0.0;
    g: number = 0.0;
    b: number = 0.0;
    a: number = 1.0;

    copy(): Color {
        return new Color(this.r, this.g, this.b, this.a);
    }

    static TRANSPARENT = new Color(0.0, 0.0, 0.0, 0.0);
    static NONE = new Color(0.0, 0.0, 0.0, 0.0);

    static WHITE = new Color(1.0, 1.0, 1.0);
    static BLACK = new Color(0.0, 0.0, 0.0);

    static RED = new Color(1.0, 0.0, 0.0);
    static GREEN = new Color(0.0, 1.0, 0.0);
    static BLUE = new Color(0.0, 0.0, 1.0);
    static YELLOW = new Color(1.0, 1.0, 0.0);
    static CYAN = new Color(0.0, 1.0, 1.0);
    static MAGENTA = new Color(1.0, 0.0, 1.0);

    static iRGB(r: number, g: number, b: number): Color {
        return new Color(r / 255.0, g / 255.0, b / 255.0);
    }
    static fromHex(hex: string): Color {
        let start = 0;
        if (hex.startsWith('#')) 
            start = 1;

        const r = parseInt(hex.substring(start + 0, start + 0 + 2), 16) / 255.0;
        const g = parseInt(hex.substring(start + 2, start + 2 + 2), 16) / 255.0;
        const b = parseInt(hex.substring(start + 4, start + 4 + 2), 16) / 255.0;
        let a = 1.0

        if ((start == 0 && hex.length === 8) || (start == 1 && hex.length === 9)) 
            a = parseInt(hex.substring(start + 6, start + 6 + 2), 16) / 255.0;
        
        return new Color(r, g, b, a);
    }

    constructor(r: number, g: number, b: number, a: number = 1.0) {
        this.set(r, g, b, a);
    }

    isNone(): boolean {
        return this.r === Color.NONE.r && this.g === Color.NONE.g && this.b === Color.NONE.b && this.a === Color.NONE.a;
    }

    set(r: number, g: number, b: number, a: number = 1.0): Color {
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
        return this;
    }

    withAlpha(a: number): Color {
        return new Color(this.r, this.g, this.b, a);
    }

    toStr(): string {
        return `Color(${this.r}, ${this.g}, ${this.b}, ${this.a})`;
    }


    toHex(): string {
        let r = Math.floor(this.r * 255).toString(16).padStart(2, '0');
        let g = Math.floor(this.g * 255).toString(16).padStart(2, '0');
        let b = Math.floor(this.b * 255).toString(16).padStart(2, '0');
        let a = Math.floor(this.a * 255).toString(16).padStart(2, '0');
        let hex = `#${r}${g}${b}${a}`;
        return hex;
    }
}