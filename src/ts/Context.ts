import { Color } from "./core/Color";
import { clamp, degresToRadians, randomElement } from "./core/Common";
import { createCircle, Polygon } from "./core/Polygon";
import { Vec2 } from "./core/Vec2";

const Songs = [
    new URL('/assets/songs/autumn-sky-meditation-7618.mp3', import.meta.url),
    new URL('/assets/songs/deep-meditation-192828.mp3', import.meta.url),
    new URL('/assets/songs/frequency-of-sleep-meditation-113050.mp3', import.meta.url),
    new URL('/assets/songs/meditation-amp-relax-238980.mp3', import.meta.url),
    new URL('/assets/songs/meditation-music-184575.mp3', import.meta.url),
    new URL('/assets/songs/relaxing-meditation-231762.mp3', import.meta.url),
];

enum SwitchState {
    FadeOut,
    FadeIn,
    Switching,
    None
}

export class Context {
    songsEnabled = true;
    transitionEnabled = true;
    autoAdvanceScene = true;
    

    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;

    playedSongs: String[] = [];
    currentSong: HTMLAudioElement | undefined;

    screenSize = new Vec2(0.0, 0.0);

    timeStart: number = 0.0;
    timeLast: number = -1.0;
    time: number = 0.0;
    deltaTime: number = 0.0;

    switchState = SwitchState.None;
    switchStateTime = 0.0;
    switchDuration = this.transitionEnabled ? 1.5 : 0.001;

    switchPolygonSize = 25.0;
    switchPolygonPosition = new Vec2(0.0, 0.0);
    switchPolygon: Polygon;

    autoAdvanceSceneInactivity = 60 * 2.6;

    inititialized: boolean = false;

    baseFontSize: number = 1;

    constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
        this.canvas = canvas;
        this.ctx = ctx;

        this.switchPolygon = createCircle(this.switchPolygonSize, 3);
        this.switchPolygon.fillColor = Color.RED;
        this.switchPolygon.strokeWidth = 2;
    
        this.canvas.addEventListener('pointerdown', this.onClick.bind(this));

        this.baseFontSize = parseFloat(getComputedStyle(canvas).fontSize);
    }

    playSong() {
        const song = this.currentSong;
        if (song) {
            song.pause();
            console.log('Stopping song ' + song.src);
            song.remove();
            this.currentSong = undefined;
        }


        let availableSongs = Songs.filter(s => !this.playedSongs.includes(s.toString()));
        if (availableSongs.length == 0) {
            this.playedSongs = [];
            availableSongs = Songs;
        }

        console.log('Available songs: ' + availableSongs.length);
        const nextUrl = randomElement(availableSongs);
        this.playedSongs.push(nextUrl.toString());
        console.log('Playing song ' + nextUrl);


        const nextSong = new Audio(nextUrl.toString());
        this.currentSong = nextSong;

        nextSong.play();
        nextSong.onended = () => {
            this.playSong();
        };

    }

    isSwitchingScene() {
        return this.switchState != SwitchState.None;
    }

    resetForScene() {
        this.timeLast = -1.0;
        this.time = 0.0;
        this.deltaTime = 0.0;

        this.switchState = SwitchState.FadeIn;
        this.switchStateTime = 0.0;
    }

    onClick(event: MouseEvent) {
        const position = new Vec2(event.clientX, event.clientY);

        if (this.songsEnabled && this.currentSong === undefined) {
            this.playSong();
        }

        if (this.switchState != SwitchState.None) 
            return;

        const delta = position.copy().sub(this.switchPolygonPosition).length();
        if (delta < this.switchPolygonSize / 1.3) {
            this.startSceneSwitch();
        }
    }

    startSceneSwitch() {
        this.switchState = SwitchState.FadeOut;
        this.switchStateTime = this.time;
    }

    update(timestamp: number): boolean {
        if (this.timeLast < 0.0) {
            this.timeStart = timestamp;
            this.timeLast = timestamp;
        }

        this.time = (timestamp - this.timeStart) / 1000.0;
        this.deltaTime = (timestamp - this.timeLast) / 1000.0;
        this.timeLast = timestamp;

        this.screenSize = new Vec2(this.canvas.width, this.canvas.height);
        const bSize = this.switchPolygonSize * 1.5;
        this.switchPolygonPosition = new Vec2(this.screenSize.x - bSize, bSize);
        this.switchPolygon.strokeColor = Color.WHITE.withAlpha(Math.sin(this.time * 2.0) * 0.5 + 0.5);

        if (!this.inititialized) {
            this.inititialized = true;
            return true;
        }

        return this.switchState == SwitchState.Switching;
    }

    updateInactivity(elapsed: number) {
        if (!this.autoAdvanceScene) 
            return;

        if (this.switchState != SwitchState.None) 
            return;

    
        if (elapsed > this.autoAdvanceSceneInactivity) {
            //console.log(`startSceneSwitch ${elapsed}`)
            this.startSceneSwitch();
        }
    }

    private createBackgroundGradient() {
        const angle = degresToRadians((this.time * 10.0) % 360.0);
        const x1 = this.canvas.width * Math.cos(angle);
        const y1 = this.canvas.height * Math.sin(angle);
        const gradient = this.ctx.createLinearGradient(0,0, x1, y1);
        gradient.addColorStop(0.0, "#0F2027");
        gradient.addColorStop(0.5, "#203A43");
        gradient.addColorStop(1.0, "#2C5364");
        return gradient;
    }

    private createTransitionGradient(alpha: number) {
        const angle = degresToRadians(45.0);
        const x1 = this.canvas.width * Math.cos(angle);
        const y1 = this.canvas.height * Math.sin(angle);
        const gradient = this.ctx.createLinearGradient(0,0, x1, y1);
        gradient.addColorStop(0.0, Color.fromHex("#373B44").withAlpha(alpha).toHex());
        gradient.addColorStop(0.5, Color.fromHex("#4286f4").withAlpha(alpha).toHex());
        return gradient;
    }

    beginRender() {
        this.ctx.fillStyle = this.createBackgroundGradient();
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.save();
        this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
    }

    endRender() {
        this.ctx.restore();

        this.ctx.save();
        this.ctx.translate(this.switchPolygonPosition.x, this.switchPolygonPosition.y);
        this.switchPolygon.render(this.ctx);
        this.ctx.restore();


        if (this.switchState == SwitchState.FadeOut || this.switchState == SwitchState.FadeIn) {
            const duration = this.switchDuration;
            const out = this.switchState == SwitchState.FadeOut;
            const delta = this.time - this.switchStateTime;
            const factor = clamp(delta / duration, 0.0, 1.0);
            const alpha = out ? factor : 1.0 - factor;

            this.ctx.fillStyle = this.createTransitionGradient(alpha);
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            if (factor == 1.0) {
                if (out) {
                    this.switchState = SwitchState.Switching;
                    this.switchStateTime = this.time;
                } else {
                    this.switchState = SwitchState.None;
                } 
                this.switchStateTime = this.time;
            }
        }
    }
}