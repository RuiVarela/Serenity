import { Context } from "../Context";
import { Vec2 } from "../core/Vec2";
import { Scene } from "./BaseScene";

enum CellState {
    Empty,

    Sand0, Sand1, Sand2, Sand3, Sand4,
}

export class DesertScene extends Scene {
    private updateInterval = 1.0 / 60.0;
    private lastUpdate = 0;
    private sandCount = 0;

    private size: Vec2 = new Vec2(0, 0);

    private offscreenCanvas: OffscreenCanvas | null = null;
    private image: Uint8ClampedArray | null = null;
    private imageData: ImageData | null = null;
    private cells: Array<CellState> = []

    private relativePress: Vec2 | null = null;

    private fillRateThreshold = 0.5
    private fillFush = 0.45

    private stateColors: Array<Array<number>> = [   
        [0, 0, 0, 0],
        [246, 215, 176, 255],
        [242, 210, 169, 255],
        [236, 204, 162, 255],
        [231, 196, 150, 255],
        [225,191,146, 255],
    ]; 

    constructor(context: Context) {
        super(context);
    }

    onPointerDown(position: Vec2) {
        super.onPointerDown(position);

        this.relativePress = new Vec2(position.x / this.context.screenSize.x, position.y / this.context.screenSize.y);
    }

    onPointerMove(position: Vec2): void {
        super.onPointerMove(position);

        if (this.relativePress == null) return;

        this.relativePress = new Vec2(position.x / this.context.screenSize.x, position.y / this.context.screenSize.y);
    }

    onPointerUp(position: Vec2): void {
        super.onPointerUp(position);
        this.relativePress = null;
    }

    setup() { 
        super.setup(); 

        //this.disableAutoPilot();
        this.autoPilotMoveHalts = true;
        this.autoPilotIdleDuration = 1000;
        
        const screenSize = this.context.screenSize;
        const max = 320;
        const scale = max / Math.max(screenSize.x, screenSize.y);
        const width = Math.floor(screenSize.x * scale);
        const height = Math.floor(screenSize.y * scale);

        this.size = new Vec2(width, height);


        this.image = new Uint8ClampedArray(this.size.x * this.size.y * 4);
        this.imageData = new ImageData(this.image, this.size.x, this.size.y);
        this.offscreenCanvas = new OffscreenCanvas(this.size.x, this.size.y);

        this.cells = new Array<CellState>(width * height);
        this.cells.fill(CellState.Empty);

        
        console.log(`gridSize: ${this.size} `);
    }

    tearDown() {
        super.tearDown();
        this.image = null;
        this.imageData = null;
        this.offscreenCanvas = null;
        this.cells = [];
        this.lastUpdate = 0;
    }

    getState(x: number, y: number) {
        if (x >= 0 && x < this.size.x && 
            y >= 0 && y < this.size.y) {
            const cellIndex = (y * this.size.x + x);
            return this.cells[cellIndex];
        }
        
        return CellState.Empty;
    }


    setState(x: number, y: number, state: CellState) {
        if (x < 0 || x >= this.size.x ||
            y < 0 || y >= this.size.y) 
            return;

        const color = this.stateColors[state];
        const cellIndex = (y * this.size.x + x);
        const colorIndex = cellIndex * 4;
        const image = this.image;

        if (image != null) {
            image[colorIndex + 0] = color[0];
            image[colorIndex + 1] = color[1];
            image[colorIndex + 2] = color[2];
            image[colorIndex + 3] = color[3];

            this.cells[cellIndex] = state;
        }
    }


    update(): void {
        super.update();

        const deltaTime = this.context.time - this.lastUpdate;
        if (deltaTime < this.updateInterval) return 


        const image = this.image;
        if (image == null) return;

        let pixelCount = 0;
        for (let y = this.size.y - 1; y >= 0; --y) {
            for (let x = 0; x != this.size.x; ++x) {
                this.updateCell(x, y);

                if (this.getState(x, y) != CellState.Empty)
                    pixelCount += 1
            }
        }
        const fillRate = pixelCount / (this.size.x * this.size.y);


        // remove lines
        if (fillRate > this.fillRateThreshold) {
            console.log(`flushing! ${fillRate}`)
            let edgeY = this.size.y - Math.floor(this.fillFush * this.size.y);
            if (edgeY > 0 && edgeY < (this.size.y - 2)) {
                for (let y = this.size.y - 1; y >= edgeY; --y) {
                    for (let x = 0; x != this.size.x; ++x) {
                        this.setState(x, y, CellState.Empty); 
                    }
                }
            }
        }
        

        let press = this.relativePress;
        if (press != null) {

            let colorOffset = this.sandCount;
            let xOffset = (this.sandCount % 3) - 1;
            this.sandCount += 1;

            let cx = Math.floor(press.x * this.size.x) + xOffset;
            let cy = Math.floor(press.y * this.size.y);
            let sand = [CellState.Sand0, CellState.Sand1, CellState.Sand2, CellState.Sand3, CellState.Sand4];

            this.setState(cx, cy, sand[(0 + colorOffset) % sand.length]);

            let maskSize = 2;
            for (let i = 1; i != maskSize; ++i) {
                let delta = i * 2;
                this.setState(cx - delta, cy - delta, sand[(1 + colorOffset) % sand.length]);
                this.setState(cx - delta, cy + delta, sand[(2 + colorOffset) % sand.length]);
                this.setState(cx + delta, cy - delta, sand[(3 + colorOffset) % sand.length]);
                this.setState(cx + delta, cy + delta, sand[(4 + colorOffset) % sand.length]);
            }
        }

        this.lastUpdate = this.context.time;

        const imageData = this.imageData;
        if (imageData == null) return;
        this.offscreenCanvas?.getContext('2d')?.putImageData(imageData, 0, 0);
    }

    updateCell(x: number, y: number) {
        const tc = this.getState(x, y - 1);
        const tl = this.getState(x - 1, y - 1);
        const tr = this.getState(x + 1, y - 1);

        const c = this.getState(x, y);
        const l = this.getState(x - 1, y);
        const r = this.getState(x + 1, y);

        if (c == CellState.Empty) {
            if (tc != CellState.Empty) {
                this.setState(x, y, tc);
                this.setState(x, y - 1, CellState.Empty);
            } else if (tl != CellState.Empty && l != CellState.Empty) {
                this.setState(x, y, tl);
                this.setState(x - 1, y - 1, CellState.Empty);
            } else if (tr != CellState.Empty && r != CellState.Empty) {
                this.setState(x, y, tr);
                this.setState(x + 1, y - 1, CellState.Empty);
            }
        }
    }

    render() {
        super.render();
        
        const ctx = this.context.ctx;
        const offscreen = this.offscreenCanvas;
        if (offscreen == null) return;

        const screenSize = this.context.screenSize;
        const imageSmoothingEnabled = ctx.imageSmoothingEnabled;

        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(offscreen, 
            0, 0, this.size.x, this.size.y,
            -screenSize.x / 2.0, -screenSize.y / 2.0, screenSize.x, screenSize.y);

        ctx.imageSmoothingEnabled = imageSmoothingEnabled;
    }
}