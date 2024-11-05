import { Context } from "../Context";
import { Color } from "../core/Color";
import { angleBetween, degresToRadians, directionAngle, easeOutCubic, palette, radiansToDegrees, rotate2d } from "../core/Common";
import { Vec2 } from "../core/Vec2";
import { Scene } from "./BaseScene";

interface FollowerPoint {
    center: Vec2;
    radius: number;
    color: Color;

    direction: Vec2;
    right: Vec2;
    left: Vec2;
}

interface Follower {
    points: Array<FollowerPoint>;
}

export class FollowerScene extends Scene {
    private followers: Array<Follower> = [];

    private target = new Vec2(0, 0);

    private maxTurnPerSecondHead = 90.0;
    private maxTurnOnChain = 35.0;
    private moveThreshold = 5;
    private moveSpeed = 250.0;

    constructor(context: Context) {
        super(context);
    }

    onPointerDown(position: Vec2) {
        super.onPointerDown(position);
        const screenSize = this.context.screenSize;

        this.target = new Vec2(position.x - screenSize.x / 2.0, position.y - screenSize.y / 2.0);
        //console.log(`onPointerDown ${this.target}`);
    }

    onPointerUp(position: Vec2) {
        super.onPointerUp(position); 
        //console.log(`onPointerUp ${position}`);
    }

    onPointerMove(position: Vec2): void {
        super.onPointerMove(position);

        if (this.autoPilotRunning()) 
            return;

        const screenSize = this.context.screenSize;
        
        //console.log(`onPointerMove ${position}`);
        this.target = new Vec2(position.x - screenSize.x / 2.0, position.y - screenSize.y / 2.0);
    }
    

    setup() { 
        super.setup(); 

        if (false) {
            this.disableAutoPilot();
        } else {
            this.autoPilotMoveHalts = true;
            this.autoPilotPressMinDuration = 50;
            this.autoPilotPressMaxDuration = 50;
            this.autoPilotIdleDuration = 250;
        }

        this.createFollower(this.target);

    }

    tearDown() {
        super.tearDown();
        this.followers = [];
        this.target = new Vec2(0, 0);
    }

    update(): void {
        super.update();

        for (const follower of this.followers) 
            this.updateFollower(follower);
    }

    render() {
        super.render();

        for (const follower of this.followers) 
            this.renderFollower(follower);
    }

    private renderFollower(follower: Follower) {
        const context = this.context;

        // itereate with indexes
        for (let i = 0; i < follower.points.length; i++) {
            const point = follower.points[i];
            const previous = i > 0 ? follower.points[i - 1] : null;
            const previousCenterDelta = previous ? previous.center.copy().sub(point.center) : Vec2.zero();

            context.ctx.save();
            context.ctx.translate(point.center.x, point.center.y);

            context.ctx.strokeStyle = point.color.toHex();
            context.ctx.lineWidth = 3;

             // outer circle
            if ( i == follower.points.length - 1) {
                const arcDirection = i == 0 ? -1.0 : 1.0;
                const angle = directionAngle(point.direction) + arcDirection * Math.PI / 2.0;
                context.ctx.beginPath();
                context.ctx.arc(0, 0, point.radius, angle, angle + Math.PI);
                context.ctx.stroke();
            }

            if (i == 0) {
                // center point
                context.ctx.fillStyle = point.color.toHex();
                context.ctx.beginPath();
                context.ctx.arc(0, 0, 5, 0, Math.PI * 2);
                context.ctx.fill();
            }

            //
            // right point
            //
            context.ctx.fillStyle = point.color.toHex();
            context.ctx.beginPath();
            context.ctx.arc(point.right.x, point.right.y, 5, 0, Math.PI * 2);
            context.ctx.fill();
            if (previous) {
                context.ctx.beginPath();
                context.ctx.moveTo(point.right.x, point.right.y);
                context.ctx.lineTo(previousCenterDelta.x + previous.right.x, previousCenterDelta.y + previous.right.y);
                context.ctx.stroke();
            }

            // left point
            context.ctx.fillStyle = point.color.toHex();
            context.ctx.beginPath();
            context.ctx.arc(point.left.x, point.left.y, 5, 0, Math.PI * 2);
            context.ctx.fill();
            if (previous) {
                context.ctx.beginPath();
                context.ctx.moveTo(point.left.x, point.left.y);
                context.ctx.lineTo(previousCenterDelta.x + previous.left.x, previousCenterDelta.y + previous.left.y);
                context.ctx.stroke();
            }


            if (i == 0) {
                // direction line
                const dirMarker = 0.3;
                const begin = point.direction.copy().mulSingle(point.radius * (1.0 - dirMarker));
                const end = point.direction.copy().mulSingle(point.radius * (1.0 + dirMarker));
                const mid = point.direction.copy().mulSingle(point.radius * 1.0);
                context.ctx.strokeStyle = point.color.toHex(); 
                context.ctx.beginPath();
                context.ctx.moveTo(begin.x, begin.y);
                context.ctx.lineTo(end.x, end.y);
                context.ctx.stroke();

                // front point
                context.ctx.fillStyle = point.color.toHex();
                context.ctx.beginPath();
                context.ctx.arc(mid.x, mid.y, 5, 0, Math.PI * 2);
                context.ctx.fill();

                context.ctx.beginPath();
                context.ctx.moveTo(point.right.x, point.right.y);
                context.ctx.lineTo(mid.x, mid.y);
                context.ctx.stroke();

                context.ctx.beginPath();
                context.ctx.moveTo(point.left.x, point.left.y);
                context.ctx.lineTo(mid.x, mid.y);
                context.ctx.stroke();
            }

    
            context.ctx.restore();
        }
    }

    private updateFollower(follower: Follower, forcedDelta?: Vec2) {
        const context = this.context

        // iterate points with index
        for (let i = 0; i < follower.points.length; i++) {
            const center = follower.points[i].center;
            const direction = follower.points[i].direction;
            const right = follower.points[i].right;
            const left = follower.points[i].left;
            const radius = follower.points[i].radius;

            if (i == 0) {
                let delta: Vec2;
                let distance: number;
  
                if (forcedDelta !== undefined) {
                    delta = forcedDelta;
                    distance = delta.length(); 
                } else {
                    delta = this.target.copy().sub(center);
                    distance = delta.length(); 
                    if (distance < this.moveThreshold) {
                        // follower arrived at target
                        return;
                    }
                }

       
                let newDirection = delta.copy().normalize();
                // force max head turn per second
                const angle = radiansToDegrees(angleBetween(direction, newDirection));
                const maxAngle = this.maxTurnPerSecondHead * context.deltaTime * 2.0;
                if (Math.abs(angle) > maxAngle)
                    newDirection = rotate2d(direction, degresToRadians(maxAngle) * Math.sign(angle));
                
            
                direction.set(newDirection);  

                // slow down when near target
                let speed = this.moveSpeed;
                if (distance < speed) {
                    speed = easeOutCubic(distance / speed) * speed;
                }
                center.add(direction.copy().mulSingle(speed * context.deltaTime));
               
            } else {
                // other points follow the previous point
                const prevCenter = follower.points[i - 1].center.copy();
                const prevDirection = follower.points[i - 1].direction.copy();
                let newDirection = prevCenter.copy().sub(center).normalize();

                // force max angle
                const angle = radiansToDegrees(angleBetween(prevDirection, newDirection));
                const maxAngle = this.maxTurnOnChain;
                if (Math.abs(angle) > maxAngle)
                    newDirection = rotate2d(prevDirection, degresToRadians(maxAngle) * Math.sign(angle));
                

                direction.set(newDirection);

                center.set(prevCenter.sub(direction.copy().mulSingle(radius)));
            }
  
            right.setScalar(-direction.y, direction.x).normalize().mulSingle(radius);
            left.setScalar(direction.y, -direction.x).normalize().mulSingle(radius);
        }
    }

    private createFollower(target: Vec2) {
        const context = this.context
        const screenSize = context.screenSize;
        const ref = Math.min(screenSize.x, screenSize.y);
      
        let sizes: Array<number> = []
        sizes = sizes.concat([ref * 0.04, ref * 0.03]);

        for (let i = 0; i != 4; ++i) sizes.push(ref * (0.02 + i * 0.01));
        for (let i = 0; i != 2; ++i) sizes.push(ref * 0.05);
        for (let i = 0; i != 8; ++i) sizes.push(ref * (0.05 - i * 0.005));

        for (let i = 0; i != 25; ++i) sizes.push(ref * (0.01));
            
        
            //sizes.push(ref * 0.06);
        //sizes = sizes.concat([ref * 0.05, ref * 0.06]);


        const points = new Array<FollowerPoint>();
        let lastCenter: Vec2 | null = null;
        let count = 0;
        for (let radius of sizes) {
            const center = target.copy();

            if (lastCenter !== null) {
                center.setScalar(lastCenter.x - radius, lastCenter.y);
            }
            
            const color = palette[count % palette.length];

            points.push({ 
                center: center, 
                radius: radius, 
                color: color,

                direction: Vec2.zero(),
                right: Vec2.zero(),
                left: Vec2.zero()
            });

            lastCenter = center;
            count++;
        }


        this.followers.push({ points: points });
        
        const forcedDelta = new Vec2(1.0, 0);
        this.updateFollower(this.followers[this.followers.length - 1], forcedDelta); 
    }
}