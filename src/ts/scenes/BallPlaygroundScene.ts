import { Context } from "../Context";
import { Scene } from "./BaseScene";
import { Vec2 } from "../core/Vec2";
import { BallPhysics } from "../core/BallPhysics";
import { angleToVec, degresToRadians, randomRangeValue } from "../core/Common";


export class BallPlaygroundScene extends Scene {
    private shooter = new BallPhysics();
    private pressed: Vec2 | undefined = undefined;

    constructor(context: Context) {
        super(context);
    }

    setup() { 
        super.setup(); 

        //this.disableAutoPilot();
    }

    tearDown() {
        super.tearDown();
        this.shooter = new BallPhysics();
    }

    onPointerDown(position: Vec2) {
        super.onPointerDown(position);


        const screenSize = this.context.screenSize;
        const p = new Vec2(position.x - screenSize.x / 2.0, position.y - screenSize.y / 2.0);


        if (this.autoPilotRunning()) {
            this.shootFromPoint(this.shooter.vecInMeters(p));
            return;
        }


        this.pressed = p;
    }
    
    onPointerUp(position: Vec2) {
        super.onPointerUp(position); 

        const pressed = this.pressed;
        if (pressed === undefined) return;

        const screenSize = this.context.screenSize;

        const released = new Vec2(position.x - screenSize.x / 2.0, position.y - screenSize.y / 2.0);
        let delta = this.shooter.vecInMeters(released.sub(pressed)).mulSingle(4.0);

        if (delta.sameAs(Vec2.zero())) 
            delta = new Vec2(1.0, 0.0);
        
        const p = this.shooter.vecInMeters(pressed);
        this.shooter.addBall(p, delta);

        this.pressed = undefined;
    }

    shootFromPoint(point: Vec2) {
        const angle = randomRangeValue(0, 360);
        const speed = (0.1 + randomRangeValue(0, 0.9)) * 4.0;

        let direction = angleToVec(degresToRadians(angle)).mulSingle(speed);

        this.shooter.addBall(point, direction);
    }
    
    update(): void {
        super.update();

        this.shooter.update(this.context);

        if (this.shooter.ballCount() == 0) {
            this.shootFromPoint(Vec2.zero());
        }
    
    }
    
    render() {
        super.render();

        this.shooter.render(this.context);
    }
}