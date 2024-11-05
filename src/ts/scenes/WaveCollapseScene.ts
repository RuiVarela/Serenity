import { Context } from "../Context";
import { Color } from "../core/Color";
import { randomElement } from "../core/Common";
import { createCross, createL, createRectangle, createT, Polygon } from "../core/Polygon";
import { QuantumField } from "../core/QuantumField";
import { Vec2 } from "../core/Vec2";
import { Scene } from "./BaseScene";

export class WaveCollapseScene extends Scene {
    cellSize = 0.0
    pipeSize = 0.0

    field: QuantumField = new QuantumField(1, 1, []);
    polygons: Map<string, Polygon> = new Map<string, Polygon>();

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
            this.autoPilotIdleDuration = 10;
        }

        const size = this.context.screenSize;

        this.cellSize = this.context.baseFontSize * 2.0;
        this.pipeSize = this.cellSize * 0.25;

        let columns = Math.ceil(size.x / this.cellSize);
        if (columns % 2 == 0) 
            columns += 1;

        let rows = Math.ceil(size.y / this.cellSize);
        if (rows % 2 == 0) 
            rows += 1;
        
        const result = this.buildAtoms();
        const atoms = result[0];
        this.polygons = result[1];

        this.field = new QuantumField(columns, rows, atoms);

        this.reset();

        console.log(`WaveCollapseScene ${columns} ${rows}`);
    }

    reset() {
        this.field.reset();

        // random selected the center atom
        let keys = Array.from(this.polygons.keys());
        let center = randomElement(keys);
        if (center == "__")
            center = "tb";

        console.log("center: " + center);
        
        const centerX = Math.floor(this.field.columns / 2);
        const centerY = Math.floor(this.field.rows / 2);
        this.field.put(centerX, centerY, center);
    }

    onPointerDown(position: Vec2) {
        super.onPointerDown(position);

        if (!this.field.canCollapse()) {
            this.reset();
        } else {
            this.field.collapse();
        }
    }

    buildAtoms(): [string[], Map<string, Polygon>] {
        const atoms: string[] = [];
        const polygons: Map<string, Polygon> = new Map<string, Polygon>();

        let cellSize = Math.ceil(this.cellSize) + 1;
     
        const names = ["tb", "lr", 
                        "tblr", 
                        "tl", "tr", "br", "bl",
                        "blr", "tlr", "ltb", "rtb"];

        for (const name of names) {
            let poly = new Polygon();

            if (name == "__") {
                poly = createRectangle(this.pipeSize * 0.5, this.pipeSize * 0.5);
            } else if (name == "tb") {
                poly = createRectangle(this.pipeSize, cellSize);
            } else if (name == "lr") {
                poly = createRectangle(cellSize, this.pipeSize);
            } else if (name == "tblr") {
                poly = createCross(cellSize, this.pipeSize);
            } 
            
            else if (name == "tr") {
                poly = createL(cellSize, this.pipeSize, 1.0, 1.0);
            } else if (name == "br") {
                poly = createL(cellSize, this.pipeSize, 1.0, -1.0);
            } else if (name == "bl") {
                poly = createL(cellSize, this.pipeSize, -1.0, -1.0);
            } else if (name == "tl") {
                poly = createL(cellSize, this.pipeSize, -1.0, 1.0);
            } 

            else if (name == "blr") {
                poly = createT(cellSize, this.pipeSize, 1.0, 1.0);
            } else if (name == "tlr") {
                poly = createT(cellSize, this.pipeSize, 1.0, -1.0);
            } else if (name == "ltb") {
                poly = createT(cellSize, this.pipeSize, -1.0, 1.0);
            } else if (name == "rtb") {
                poly = createT(cellSize, this.pipeSize, -1.0, -1.0);
            } 

            atoms.push(name);

            poly.fillColor = Color.WHITE;
            polygons.set(name, poly);
        }

        return [atoms, polygons];
    }

    tearDown() {
        super.tearDown();

        this.field = new QuantumField(1, 1, []);
        this.polygons.clear();
    }

    update(): void {
        super.update();
    }

    render() {
        super.render();

        const ctx = this.context.ctx;

        const startX = -((this.field.columns - 1) * this.cellSize) / 2.0;
        const startY = -((this.field.rows - 1) * this.cellSize) / 2.0;


        //console.log(`startX=${startY} startX=${startY} cellSize=${this.cellSize} pipeSize=${this.pipeSize} `)
        
        for (let y = 0; y != this.field.rows; ++y) {
            for (let x = 0; x != this.field.columns; ++x) {
                const atom = this.field.get(x, y);
                const polygon = this.polygons.get(atom);
                const posX = startX + x * this.cellSize;
                const posY = startY + y * this.cellSize;         

                if (polygon && atom != "__") {
                    // draw outline
                    ctx.save();
                    {
                        ctx.translate(posX, posY);

                        let region = new Path2D();
                        region.rect(-this.cellSize / 2.0, -this.cellSize / 2.0, this.cellSize, this.cellSize);
                        ctx.clip(region);

                        const scale = 1.5;
                        ctx.scale(scale, scale);

       

                        const color = polygon.fillColor;
                        polygon.fillColor = Color.BLACK;
                        polygon.render(ctx);
                        polygon.fillColor = color; 
                    }
                    ctx.restore();


                    // draw color
                    ctx.save();
                    {
                        ctx.translate(posX, posY);
                        polygon.render(ctx);
                    }
                    ctx.restore();
                }

            }
        }

         
        // draw debug
        if (false) {
            for (let y = 0; y != this.field.rows; ++y) {
                for (let x = 0; x != this.field.columns; ++x) {
                    const debug = this.field.debug(x, y);

                    const posX = startX + x * this.cellSize;
                    const posY = startY + y * this.cellSize;         

                    if (debug != "") {
                        ctx.save();
                        {
                            ctx.translate(posX, posY);
                            ctx.font = "15px Sans-serif";
                            ctx.textAlign = "center";
                            ctx.textBaseline = "middle";

                            ctx.strokeStyle = Color.BLACK.toHex();
                            ctx.lineWidth = 5;
                            ctx.strokeText(debug, 0, 0);

                            ctx.fillStyle = Color.WHITE.toHex();
                            ctx.fillText(debug, 0, 0);

                        }
                        ctx.restore();
                    }

                }
            }
        }

    }
}