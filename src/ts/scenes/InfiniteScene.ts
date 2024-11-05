import { Context } from "../Context";
import { Scene } from "./BaseScene";
import { Vec2 } from "../core/Vec2";
import { clamp, equivalent, palette } from "../core/Common";


export class InfiniteScene extends Scene {
    private startTime = -1.0;
    private duration = 2.0;

    private size = Vec2.zero();
    private minSize = Vec2.zero();
    private maxSize = Vec2.zero();

    private iteration = 0;
    private screens: Array<OffscreenCanvas> = [];

    constructor(context: Context) {
        super(context);
    }

    onPointerDown(position: Vec2) {
        super.onPointerDown(position);

        if (this.autoPilotRunning())
            return

        this.drawPattern(this.screens[0]);
    }

    setup() { 
        super.setup(); 
        
        this.size = this.context.screenSize.copy();
        this.minSize = this.size.copy().mulSingle(0.5);
        this.maxSize = this.size.copy().mulSingle(2.0);


        for (let i = 0; i != 2; ++i) {
            const screen = new OffscreenCanvas(this.size.x, this.size.y);
            this.drawPattern(screen);
            this.screens.push(screen);
        }
    }

    private drawPattern(screen: OffscreenCanvas) {
        const ctx = screen.getContext('2d');
        if (ctx == null) return;

        const background = palette[(this.iteration + 0) % palette.length];
        const foreground = palette[(this.iteration + 1) % palette.length];
        this.iteration += 1;

        // draw background
        ctx.beginPath();
        ctx.fillStyle = background.toHex();
        ctx.rect(0.0, 0.0, this.size.x, this.size.y);
        ctx.fill();

        // draw balls 
        const ballSize = Math.min(screen.width, screen.height) * 0.1;

        ctx.beginPath();
        ctx.fillStyle = foreground.toHex();
        ctx.arc(screen.width / 2, screen.height / 2, ballSize, 0, Math.PI * 2);
        ctx.fill();



        ctx.beginPath();
        ctx.fillStyle = foreground.toHex();
        ctx.arc(ballSize * 2.0, ballSize * 2.0, ballSize, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.fillStyle = foreground.toHex();
        ctx.arc(ballSize * 2.0, screen.height - (ballSize * 2.0), ballSize, 0, Math.PI * 2);
        ctx.fill();



        ctx.beginPath();
        ctx.fillStyle = foreground.toHex();
        ctx.arc(screen.width - ballSize * 2.0, ballSize * 2.0, ballSize, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.fillStyle = foreground.toHex();
        ctx.arc(screen.width - ballSize * 2.0, screen.height - (ballSize * 2.0), ballSize, 0, Math.PI * 2);
        ctx.fill(); 
    }

    private regeneratePattern() {
        const a = this.screens[0];
        const b = this.screens[1];

        this.drawPattern(b);

        const ctx = b.getContext('2d');
        if (ctx == null) return;

        const center = this.size.copy().mulSingle(0.5);

        {
            const size = this.minSize;
            ctx.drawImage(a, 0, 0, this.size.x, this.size.y, 
                center.x - size.x / 2.0, center.y - size.y / 2.0, size.x, size.y);
        }

 
        this.screens = [b, a];
    }

    tearDown() {
        super.tearDown();

        this.screens = [];
        this.iteration = 0;
        this.startTime = -1;

    }

    update(): void {
        super.update();
    }

    render() {
        super.render();
        const ctx = this.context.ctx;

        if (this.startTime < 0.0)
            this.startTime = this.context.time;

        const delta = this.context.time - this.startTime;
        const percent = clamp(delta / this.duration, 0.0, 1.0);

        {
            const screen = this.screens[0];
            //const smoothed = Math.pow(percent, 3);
            const smoothed = Math.pow(percent, 0.88);
            const size = Vec2.lerp(this.maxSize, this.size, smoothed);
            ctx.drawImage(screen, 0, 0, this.size.x, this.size.y, -size.x / 2.0, -size.y / 2.0, size.x, size.y);
        }

        if (delta > this.duration || equivalent(delta, this.duration)) {
            this.regeneratePattern();
            this.startTime = this.context.time;
        }
    }
}