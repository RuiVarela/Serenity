import { Context } from "../Context";
import { Scene } from "./BaseScene";
import { Vec2 } from "../core/Vec2";
import { equivalent } from "../core/Common";
import { Color } from "../core/Color";

interface Snake {
    keypoints: Array<Vec2>
    direction: Vec2
    collidedWithWall: boolean
}

enum Wall {
    Up,
    Down,
    Left,
    Right,
  }

interface WallCollision {
    hit: Vec2,
    respawnHead: Vec2,
    respawnTail: Vec2,
    wall: Wall
}

export class SnakeScene extends Scene {
    snakeLength = 0.0
    snakeSide = 0.0

    snakes: Array<Snake> = []

    constructor(context: Context) {
        super(context);
    }

    setup() { 
        super.setup(); 

        //this.disableAutoPilot();
        this.autoPilotMoveHalts = true;
        this.autoPilotIdleDuration = 2500;
        
        const screenSize = this.context.screenSize;
        this.snakeLength = screenSize.x * 0.45
        this.snakeSide = this.context.baseFontSize;

        const snake: Snake = {
            keypoints: [],
            direction: new Vec2(-1.0, 0.0),
            collidedWithWall: false
        };

        const start = new Vec2(0.0, 0.0);
        snake.keypoints.push(start);
        snake.keypoints.push(start.copy().addScalar(this.snakeLength * -snake.direction.x, this.snakeLength * -snake.direction.y));

        this.snakes.push(snake);
    }

    tearDown() {
        super.tearDown();
        this.snakes = []
    }

    onPointerUp(position: Vec2): void {
        super.onPointerUp(position);
        const screenSize = this.context.screenSize;

        if (this.snakes.length == 0) 
            return;

        const snake = this.snakes[this.snakes.length - 1];
        const head = snake.keypoints[0];

        const minX = -screenSize.x / 2.0;
        const maxX = screenSize.x / 2.0;
        const minY = -screenSize.y / 2.0;
        const maxY = screenSize.y / 2.0;

        if (head.x <= minX || head.x >= maxX || head.y <= minY || head.y >= maxY) 
            return;



        let p = new Vec2(position.x - screenSize.x / 2.0, position.y - screenSize.y / 2.0);

        const snakeRay = snake.direction.normalize();
        const pointRay = p.sub(head).normalize();
        const side = Math.sign(snakeRay.cross(pointRay));

        snake.keypoints.splice(1, 0, head.copy());
        snake.direction.setScalar(snake.direction.y * -side, snake.direction.x * side);
    }

    update(): void {
        super.update();

        const remove: Array<number> = [];  
        const count = this.snakes.length;
        for (let i = 0; i != count; ++i) {
            const snake = this.snakes[i];
            this.updateSnake(snake);

            // is the snake fully outside the field?
            if (this.isSnakeOutOfBounds(snake)) {

                remove.push(i);

            } else if (!snake.collidedWithWall) {
                
                // check if the snake has collided with the wall
                const head = snake.keypoints[0];
                const collision = this.snakeWallCollision(snake, head);
                if (collision) {
                    snake.collidedWithWall = true;
                    const dir = collision.respawnHead.copy().sub(collision.respawnTail).normalize(); 
                    this.snakes.push({
                        keypoints: [collision.respawnHead, collision.respawnTail],
                        direction: dir,
                        collidedWithWall: false
                    });
                    //console.log("Added snake " + this.snakes.length);
                }

            }
        }
        
        remove.sort().forEach((index) => {
            //console.log("Removing snake at index: " + index);
            this.snakes.splice(index, 1);
        });
    }

    private snakeWallCollision(snake: Snake, keypoint: Vec2): WallCollision | null {
        const screenSize = this.context.screenSize;

        const threshold = this.snakeSide * 2.0; 
        const minX = -screenSize.x / 2.0 - threshold;
        const maxX = screenSize.x / 2.0 + threshold;
        const minY = -screenSize.y / 2.0 - threshold;
        const maxY = screenSize.y / 2.0 + threshold;

        if (keypoint.x > minX && keypoint.x < maxX && 
            keypoint.y > minY && keypoint.y < maxY) 
            return null;

        if (keypoint.x < minX) {    
            return { 
                hit: keypoint,
                respawnHead: new Vec2(maxX, keypoint.y), 
                respawnTail: new Vec2(maxX + this.snakeLength, keypoint.y),
                wall: Wall.Left
            };
        } else if (keypoint.x > maxX) {
            return { 
                hit: keypoint, 
                respawnHead: new Vec2(minX, keypoint.y), 
                respawnTail: new Vec2(minX - this.snakeLength, keypoint.y),
                wall: Wall.Right 
            };
        } else if (keypoint.y < minY) {
            return { 
                hit: keypoint, 
                respawnHead: new Vec2(keypoint.x, maxY), 
                respawnTail: new Vec2(keypoint.x, maxY + this.snakeLength),
                wall: Wall.Up 
            };
        } else /*if (keypoint.y > maxY)*/ {
            return { 
                hit: keypoint, 
                respawnHead: new Vec2(keypoint.x, minY), 
                respawnTail: new Vec2(keypoint.x, minY - this.snakeLength),
                wall: Wall.Down 
            };
        }
    }

    private isSnakeOutOfBounds(snake: Snake) {
        for (const keypoint of snake.keypoints) 
            if (!this.snakeWallCollision(snake, keypoint)) 
                return false;
        
        return true;
    }


    private updateSnake(snake: Snake) {
        if (snake.keypoints.length <= 1) 
            return;

        //console.log(this.snake.keypoints);
/*
        this.snake.keypoints = [ 
            new Vec2(-195.9, -154.6),
            new Vec2(2.6, -154.6),
            new Vec2(2.6, -11.96)
        ];
        */

        const speed = 80.0;
        const distance = this.context.deltaTime * speed;

        const head = snake.keypoints[0];
        head.addScalar(snake.direction.x * distance, snake.direction.y * distance);

        const tailIndex = snake.keypoints.length - 1;
        const tail = snake.keypoints[tailIndex];
        const beforeTail = snake.keypoints[tailIndex - 1];

        const deltaToTail = beforeTail.copy().sub(tail);
        const distanceToTail = deltaToTail.length();

        const delta = deltaToTail.normalize().mulSingle(distance);

        if (snake.keypoints.length > 2) {
            if (equivalent(distanceToTail, 0.0) || distanceToTail <= distance) {
                snake.keypoints.pop();
                return
            }
        }

        tail.add(delta);
    }

    private renderFullSnake(snake: Snake, dilation: number, color: Color) {
        const ctx = this.context.ctx;

        for (let i = snake.keypoints.length - 1; i != 0; --i) {
            ctx.lineWidth = this.snakeSide * dilation;
            ctx.strokeStyle = color.toHex();
            ctx.lineCap = "round";
            ctx.lineJoin = "round";
            ctx.beginPath();
            ctx.moveTo(snake.keypoints[0].x, snake.keypoints[0].y);
            for (let i = 1; i != snake.keypoints.length; ++i) 
                ctx.lineTo(snake.keypoints[i].x, snake.keypoints[i].y);
            ctx.stroke();
        }
    }

    private renderSnake(snake: Snake, dilation: number = 1.2) {
        if (snake.keypoints.length <= 1) 
            return;

        //this.renderFullSnake(snake, dilation, Color.BLACK);
        //this.renderFullSnake(snake, 1.0, Color.WHITE);

        this.renderSegmentedSnake(snake, dilation)
    }

    private renderSegmentedSnake(snake: Snake, dilation: number) {
        const ctx = this.context.ctx;

        for (let i = snake.keypoints.length - 1; i != 0; --i) {
            for (let p = 0; p != 2; ++p) {
                const snakeSide = this.snakeSide * ((p == 0) ? dilation : 1.0);

                ctx.lineWidth = snakeSide;
                ctx.strokeStyle = (p == 0) ? Color.BLACK.toHex() : Color.WHITE.toHex();
                ctx.lineCap = "round";
                ctx.lineJoin = "round";

                ctx.save();
                    let start = snake.keypoints[i - 1];
                    let end = snake.keypoints[i];

                    if (i != snake.keypoints.length - 1) {
                        //
                        // compute clip rect, to cut a bit of the union start 
                        //
                        const halfSnakeSide = snakeSide / 2.0

                        let dir = start.copy().sub(end).normalize();
                        let clipStart = start.copy().add(dir.copy().mulSingle(snakeSide));
                        let clipEnd = end.copy().add(dir.copy().mulSingle(halfSnakeSide * 0.9));

                        let rectOffsetX = 0.0;
                        let rectOffsetY = 0.0;
                        let size = clipEnd.copy().sub(clipStart);
                        if (size.x === 0.0) {
                            rectOffsetX = halfSnakeSide;
                            size.x = snakeSide;
                        } else if (size.y === 0.0) {
                            rectOffsetY = halfSnakeSide * 1.0;
                            size.y = snakeSide;
                        }
                        let region = new Path2D();
                        region.rect(clipStart.x - rectOffsetX, clipStart.y - rectOffsetY, size.x, size.y);
                        ctx.clip(region);
                    }


                    ctx.beginPath();
                        if (i >= 2) {
                            ctx.moveTo(snake.keypoints[i - 2].x, snake.keypoints[i - 2].y);
                            ctx.lineTo(start.x, start.y);
                            ctx.lineTo(end.x, end.y);
                        } else {
                            ctx.moveTo(start.x, start.y);
                            ctx.lineTo(end.x, end.y);
                        }
                    ctx.stroke();
                ctx.restore();
            }
        }
    }



    render() {
        super.render();
        const ctx = this.context.ctx;

        for (let i = 0; i != this.snakes.length; ++i) {
            const snake = this.snakes[i];
            const dilation = 1.4;

            ctx.imageSmoothingEnabled = false;

            ctx.save();
                this.renderSnake(snake, dilation);
            ctx.restore();
        }
    }
}