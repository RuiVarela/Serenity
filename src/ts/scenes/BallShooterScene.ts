import { Context } from "../Context";
import { Scene } from "./BaseScene";
import { Vec2 } from "../core/Vec2";
import { BallPhysics } from "../core/BallPhysics";
import { angleToVec, degresToRadians, directionAngle, radiansToDegrees, randomRangeValue } from "../core/Common";
import { createCapsule, createCircle, Polygon } from "../core/Polygon";
import { Color } from "../core/Color";


export class BallShooterScene extends Scene {
    private orb: Polygon = createCircle(1.0)
    private orbTick: Polygon = createCapsule(1.0, 1.0)

    private orbAngle = -45.0;

    private shooter = new BallPhysics();

    constructor(context: Context) {
        super(context);
    }

    setup() { 
        super.setup(); 

        //this.disableAutoPilot();

        this.autoPilotIdleDuration = 2000;

        this.shooter.gravity = new Vec2(0.0, 9.8);

        let screenSize = this.context.screenSize;
        const radius = Math.min(screenSize.x, screenSize.y) * 0.08

        this.orb = createCircle(radius);
        this.orb.fillColor = Color.NONE;
        this.orb.strokeColor = Color.WHITE;
        this.orb.strokeWidth = radius * 0.03;

        this.orbTick = createCapsule(radius * 3.0, radius * 0.25, 8, 2);
        this.orbTick.fillColor = Color.NONE;
        this.orbTick.strokeColor = Color.WHITE;
        this.orbTick.strokeWidth = radius * 0.03;
    }

    tearDown() {
        super.tearDown();
        this.shooter = new BallPhysics();
    }
        
    onPointerMove(position: Vec2): void {
        super.onPointerMove(position);

        const screenSize = this.context.screenSize;
        const dir = position.copy().subScalar(screenSize.x / 2.0, screenSize.y);
        this.orbAngle = radiansToDegrees(directionAngle(dir));
    }

    onPointerUp(position: Vec2) {
        super.onPointerUp(position); 
        this.shoot()
    }

    update(): void {
        super.update();

        if (this.autoPilotRunning()) {
            this.orbAngle += 10.0 * this.context.deltaTime;
            if (this.orbAngle > 0.0) 
                this.orbAngle -= 180.0;    
        }

        this.shooter.update(this.context);
        
        if (this.shooter.ballCount() == 0)
            this.shoot();


    }


    shoot() {
        const screenSize = this.context.screenSize;
        const point = this.shooter.vecInMeters(new Vec2(0.0, screenSize.y / 2.0));
        const angle = this.orbAngle;
        const speed = 9.0;

        let direction = angleToVec(degresToRadians(angle)).mulSingle(speed);

        this.shooter.addBall(point, direction);
    }
    
    render() {
        super.render();

        this.shooter.render(this.context);

        const ctx = this.context.ctx;


        ctx.save();
            ctx.translate(0.0, this.context.screenSize.y / 2.0)
            this.orb.render(ctx);

            ctx.rotate(degresToRadians(this.orbAngle));
            this.orbTick.render(ctx);
        ctx.restore();
    }
}