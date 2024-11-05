import { Context } from "../Context";
import { Scene } from "./BaseScene";
import { Vec2 } from "../core/Vec2";
import { angleBetween, angleToVec, degresToRadians, directionAngle, equivalent, palette, radiansToDegrees, randomly, repeatSpace, rotate2d } from "../core/Common";
import { debugPoint } from "../core/Render";

export class SpaceshipScene extends Scene {
    target = Vec2.zero();
    position = Vec2.zero();
    velocity = Vec2.zero();
    direction = Vec2.zero();
    move: boolean  =false

    constructor(context: Context) {
        super(context);
    }

    setup() { 
        super.setup();
        
        if (false) {
            this.disableAutoPilot();
        } else {
            this.autoPilotInactivityTimeout = 4000;
            this.autoPilotPressMaxDuration = 2000;
            this.autoPilotIdleDuration = 850;
            this.autoPilotMoveHalts = true;
        } 

        this.target = Vec2.zero();
        this.position = Vec2.zero();
        this.velocity = Vec2.zero();
        this.direction = new Vec2(1.0, 0.0);
        this.move = false
    }

    tearDown() {
        super.tearDown();

    }

    onPointerDown(position: Vec2) {
        super.onPointerDown(position);

        this.setTarget(position);
        this.move = true;
    }

    onPointerUp(position: Vec2): void {
        super.onPointerUp(position);

        this.move = false;
    }

    onPointerMove(position: Vec2): void {
        super.onPointerMove(position);

        if (this.autoPilotRunning()) 
            return;

        this.setTarget(position);
    }

    private setTarget(click: Vec2) {
        const screenSize = this.context.screenSize;
    
        this.target = new Vec2(click.x - screenSize.x / 2.0, click.y - screenSize.y / 2.0);
    }

    update(): void {
        super.update();

        const maxTurn = 90;
        const speed = 300.0;
        const damping = 0.5;
        const maxVelocity = 20.0;

        //
        // direction
        //
        {
            const delta = this.target.copy().sub(this.position);
            const distance = delta.length();
            if (equivalent(distance, 0.0)) {

            } else {
                let direction = delta.copy().normalize();
                const angle = radiansToDegrees(angleBetween(this.direction, direction));
                const maxAngle = maxTurn * this.context.deltaTime;
                if (Math.abs(angle) > maxAngle) {
                    direction = rotate2d(this.direction, degresToRadians(maxAngle) * Math.sign(angle));
                }
                this.direction.set(direction);
            }
        }



        //
        // update velocity
        //
        {
            if (this.move) {
                this.velocity.add(this.direction.copy().mulSingle(this.context.deltaTime * speed)); 
            }

            const magnitude = this.velocity.length();
            if (this.velocity.length() > magnitude) {
                this.velocity.normalize().mulSingle(maxVelocity);
            } else {
                this.velocity.mulSingle(1.0 - (damping * this.context.deltaTime));
            }
        }


        //
        // position
        //
        this.position.add(this.velocity.copy().mulSingle(this.context.deltaTime));
        this.position.setScalar(
            repeatSpace(this.context.screenSize.x / 2, this.position.x),
            repeatSpace(this.context.screenSize.y / 2, this.position.y)
        )
    }

    renderSpaceship(position: Vec2, angle: number, flameOn: boolean) {
        const ctx = this.context.ctx;

        const size = this.context.baseFontSize;

        const forward = position.copy().add(angleToVec(angle).mulSingle(size * 3.0));
        const right = position.copy().add(angleToVec(angle + Math.PI / 2).mulSingle(size * 1.0));
        const left = position.copy().add(angleToVec(angle - Math.PI / 2).mulSingle(size * 1.0));
        const rightTail = forward.copy().add( right.copy().sub(forward).mulSingle(1.5) );
        const leftTail = forward.copy().add( left.copy().sub(forward).mulSingle(1.5) );

        let flamePoint = Vec2.zero();

        {
            const lr = rightTail.copy().sub(leftTail);
            let progress = Math.sin(this.context.time * 50.0) * 0.5 + 0.5;
            flamePoint = leftTail.copy().add(lr.mulSingle(progress));
        }

        ctx.lineWidth = this.context.baseFontSize * 0.3;
        ctx.strokeStyle = palette[6 % palette.length].toHex();
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        {
            ctx.beginPath();
            ctx.moveTo(left.x, left.y);
            ctx.lineTo(right.x,right.y);
            ctx.stroke();
        }

        {
            ctx.beginPath();
            ctx.moveTo(forward.x, forward.y);
            ctx.lineTo(rightTail.x, rightTail.y);
            ctx.stroke();
        }

        {
            ctx.beginPath();
            ctx.moveTo(forward.x, forward.y);
            ctx.lineTo(leftTail.x,leftTail.y);
            ctx.stroke();
        }

        if (flameOn){
            const fire = position.copy().add( flamePoint.copy().sub(position).normalize().mulSingle(size) );
            ctx.beginPath();
            ctx.moveTo(position.x, position.y);
            ctx.lineTo(fire.x,fire.y);
            ctx.stroke();
        }


        //debugPoint(this.context, new Vec2(0.0, 0.0), Color.WHITE);
        //debugPoint(this.context, right, Color.GREEN);
        //debugPoint(this.context, rightTail, Color.GREEN);
        //debugPoint(this.context, left, Color.BLUE);
        //debugPoint(this.context, leftTail, Color.BLUE);
        //debugPoint(this.context, forward, Color.RED);
        //debugPoint(this.context, flamePoint, Color.MAGENTA);
    }
    
    render() {
        super.render();
        const screenSize = this.context.screenSize;

        this.renderSpaceship(this.position, directionAngle(this.direction), this.move);
        this.renderSpaceship(new Vec2(this.position.x + screenSize.x, this.position.y), directionAngle(this.direction), this.move);
        this.renderSpaceship(new Vec2(this.position.x - screenSize.x, this.position.y), directionAngle(this.direction), this.move);
        this.renderSpaceship(new Vec2(this.position.x, this.position.y + screenSize.y), directionAngle(this.direction), this.move);
        this.renderSpaceship(new Vec2(this.position.x, this.position.y - screenSize.y), directionAngle(this.direction), this.move);
    }
}