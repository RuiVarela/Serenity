import { Context } from "../Context";
import { Color } from "../core/Color";
import { palette } from "../core/Common";
import { Polygon,  createCircle, createStar } from "../core/Polygon";
import { Vec2 } from "../core/Vec2";
import { Scene } from "./BaseScene";

export class MarblingScene extends Scene {
    private polygons = new Array<Polygon>();

    private maxPolygons = 500;
    private marblingSpeed = 1.0;
    private hexagonSplits = 10;
    private dropSegments = 50;

    private pointerPosition: Vec2 | null = null;
    private pointerPolygon: Polygon | null = null;
    private dropCount = 0;

    constructor(context: Context) {
        super(context);
    }

    onPointerDown(position: Vec2) {
        //console.log(`onPointerDown ${position}`);   
        super.onPointerDown(position);

        const screenSize = this.context.screenSize;

        this.pointerPosition = new Vec2(position.x - screenSize.x / 2.0, position.y - screenSize.y / 2.0);
    }

    onPointerUp(position: Vec2) {
        //console.log(`onPointerUp ${position}`); 
        super.onPointerUp(position); 

        this.pointerPolygon = null;
        this.pointerPosition = null;
    }
    

    setup() { 
        super.setup();  

        let screenSize = this.context.screenSize;
        const hexagonRadius = Math.min(screenSize.x, screenSize.y) * 0.1
        const hexagonHeight = 2.0 * hexagonRadius * Math.cos(Math.PI / 6)

        let grid = 4;
        let xOffset = 3.0 * hexagonRadius;
        let yOffset = hexagonHeight;

        let useHexagons = true;//;coinFlip()

        for (let plane = 0; plane != 2; ++plane) {
            for (let y = -grid; y != (grid + 1); ++y) {
                for (let x = -grid; x != (grid + 1); ++x) {
                    let xPos = x * xOffset;
                    let yPos = y * yOffset;

                    if (plane == 1) {
                        xPos += hexagonRadius * 1.5;
                        yPos += hexagonHeight / 2.0
                    }
        
                    let poly: Polygon;
                    if (useHexagons) {
                        poly = createCircle(hexagonRadius * 0.7, 6, this.hexagonSplits);
                    } else {
                        poly = createStar(hexagonRadius);
                    }


                    let offset = new Vec2(xPos, yPos);

                    poly.translate(offset);

                    poly.fillColor = Color.GREEN;
                    if (plane == 1) {
                        poly.fillColor = Color.YELLOW;
                    }
            
                    poly.strokeColor = Color.BLACK;
                    poly.strokeWidth = hexagonRadius * 0.02;
            
                    //poly.vertexColor = Color.BLUE;
                    //poly.vertexRadius = hexagonRadius * 0.06;
            
                    this.polygons.push(poly);
                }  
            }
        }
    }

    tearDown() {
        super.tearDown();

        this.polygons = [];
    }

    update(): void {
        super.update();

        const context = this.context


        //
        // slowly rotate the polygons
        //
        const timeSlot = context.time / 5.0;
        const timeSlotInt = Math.floor(timeSlot);

        if (timeSlotInt % 2 == 0) {
            const delta = context.deltaTime * 0.01;

            for (const polygon of this.polygons) {
               // console.log(`rotating ${delta} + ${this.rotationAngle}`);
                polygon.rotate(delta);
            }
        }

        //
        // remove older polygons
        //
        while (this.polygons.length > this.maxPolygons) {
            this.polygons.shift();
        }


        //
        // update the pointer polygon
        //
        const screenSize = context.screenSize;
        if (this.pointerPosition != null && this.pointerPolygon == null) {
            const radius = Math.min(screenSize.x, screenSize.y) * 0.04;

            this.pointerPolygon = createCircle(radius, this.dropSegments);
            this.pointerPolygon.fillColor = palette[this.dropCount % palette.length];
            this.pointerPolygon.strokeColor = Color.NONE;
            //this.pointerPolygon.strokeWidth = this.pointerRadius * 0.02;

            this.pointerPolygon.centerOnPosition(this.pointerPosition);

            this.polygons.push(this.pointerPolygon);

            this.dropCount++;

            //console.log(`drop id=${this.dropCount} count=${this.polygons.length}`);
        }

        
        //
        // marbling drop effect
        //
        if (this.pointerPosition != null && this.pointerPolygon != null) {
            const radius = Math.min(screenSize.x, screenSize.y) * context.deltaTime * this.marblingSpeed;

            for (const polygon of this.polygons) {
                for (const point of polygon.points) {
                
                    this.marblePoint(point, this.pointerPosition, radius);
                }
            }

        }
    }

    marblePoint(vertex: Vec2, dropCenter: Vec2, dropRadius: number): void {
        const VC = vertex.copy().sub(dropCenter);
        const dist = VC.length();
        const scaler = Math.sqrt(1.0 + (dropRadius * dropRadius) / (dist * dist));
        vertex.set(dropCenter).add(VC.mulSingle(scaler))
    }

    render() {
        super.render();

        const context = this.context;

        for (let polygon of this.polygons) {
            polygon.render(context.ctx);
        }

        this.pointerPolygon?.render(context.ctx);
    }
}