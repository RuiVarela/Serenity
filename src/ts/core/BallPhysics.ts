import { Context } from "../Context";
import { Color } from "./Color";
import { clamp, palette } from "./Common";
import { Vec2 } from "./Vec2";
import { Rect } from "./Rect";
import { RunningAverage } from "./RunningAverage";

class Ball {
    color: Color = Color.BLUE;
    position: Vec2;
    velocity: Vec2;
    impulse: Vec2;
    gravity: Vec2;
    mass: number;
    radius: number;

    motionX: RunningAverage;
    motionY: RunningAverage;
    previousPosition: Vec2 = Vec2.zero();

    creationStep: number = 0;

    constructor(position: Vec2, mass: number, velocity: Vec2, gravity: Vec2) {
        this.position = position;
        this.velocity = velocity;
        this.gravity = gravity;
        this.impulse = Vec2.zero();

        this.previousPosition = position.copy();
        this.motionX = new RunningAverage(60, 0.015);
        this.motionY = new RunningAverage(60, 0.015);

        this.mass = mass;

        const density = 15.0;
        const area = mass / density;
        this.radius = Math.sqrt(area / Math.PI);
    }

    applyImpulse(force: Vec2) {
        this.impulse.add(force.copy().divSingle(this.mass));
    }

    update(dt: number, fricction: number) {

        //
        // update motion
        //
        const motionDelta = this.position.copy().sub(this.previousPosition);
        this.motionX.addSample(Math.abs(motionDelta.x));
        this.motionY.addSample(Math.abs(motionDelta.y));
        this.previousPosition = this.position.copy();


        const zero = Vec2.zero();


        // not very accurate but good enough for now
        const impulse = this.impulse.copy().mulSingle(dt);
        this.impulse.sub(impulse);
        if (this.impulse.sameAs(zero)) 
            this.impulse = zero;

        const acceleration = impulse.add(this.gravity.copy().mulSingle(dt));


        this.velocity.add(acceleration);
        if (fricction >= 0.0) 
            this.velocity.mulSingle(1.0 - fricction);

        this.position.add(this.velocity.copy().mulSingle(dt));
    }

    collide(other: Ball) {
        const impactVector = other.position.copy().sub(this.position);
        let d = impactVector.length();
        if (d < (this.radius + other.radius)) {
            impactVector.normalize();
            // push the particles apart
            const overlap = d - (this.radius + other.radius);
            let dir = impactVector.copy().mulSingle(overlap * 0.5);

            this.position.add(dir);
            other.position.sub(dir);

            // Correct the distance!
            d = this.radius + other.radius;
            impactVector.mulSingle(d);

            // calculate the new velocities
            let massSum = this.mass + other.mass;
            let velocityDiff = other.velocity.copy().sub(this.velocity);

            // this particle 
            let num = velocityDiff.dot(impactVector);
            let den = massSum * d * d;
            let deltaVelocity = impactVector.copy().mulSingle((2 * other.mass * num) / den);
            this.velocity.add(deltaVelocity);

            // other particle
            deltaVelocity = impactVector.copy().mulSingle((-2 * this.mass * num) / den);
            other.velocity.add(deltaVelocity);  
        }
    }

    collideInside(rect: Rect) {
        if (this.position.x > (rect.right - this.radius)) {
            this.position.x = rect.right - this.radius;
            this.velocity.x *= -1.0;
        } else if (this.position.x < (rect.left + this.radius)) {
            this.position.x = rect.left + this.radius;
            this.velocity.x *= -1.0;
        }

        if (this.position.y > (rect.bottom - this.radius)) {
            this.position.y = rect.bottom - this.radius;
            this.velocity.y *= -1.0;
        } else if (this.position.y < (rect.top + this.radius)) {
            this.position.y = rect.top + this.radius;
            this.velocity.y *= -1.0;
        }
    }

    motionValue(): number {
        const x = this.motionX.average();
        const y = this.motionY.average();
        return Math.sqrt(x * x + y * y);
    }

    lifeTime(step: number): number {
        return step - this.creationStep ;
    }
}


export class BallPhysics {
    readonly stepsPerSecond = 60.0;
    readonly stepTime = 1.0 / this.stepsPerSecond;

    private metersToPixelsFactor = 0.0;

    private currentStep = 0;
    private acumulatedTime = 0.0;

    private bounds = Rect.zero();

    private ballId = 0;
    private balls: Array<Ball> = new Array<Ball>;

    private fricction = 0.01; //-1.0;
    gravity = Vec2.zero();

    lifeTimeThreshold = 10 * this.stepsPerSecond;

    ballCount(): number {   
        return this.balls.length;
    }

    addBall(position: Vec2, velocity: Vec2) {
        this.ballId += 1;

        const mass = 1;
        const ball = new Ball(position, mass, velocity, this.gravity);
     
        ball.creationStep = this.currentStep;
        ball.color = palette[this.ballId % palette.length];
        this.balls.push(ball);
    }

    vecInMeters(position: Vec2): Vec2 {
        return new Vec2(position.x / this.metersToPixelsFactor, position.y / this.metersToPixelsFactor);
    }

    update(context: Context) {
        if (this.metersToPixelsFactor <= 0.0) {
            // a full screen is around 4 meters
            this.metersToPixelsFactor = context.screenSize.y / 4.0;
            //console.log(`metersToPixelsFactor=${this.metersToPixelsFactor}`)
        }

        // update bounds
        const halfWidth = context.screenSize.x / 2.0;
        const halfHeight = context.screenSize.y / 2.0;
        this.bounds.set(
            -halfWidth / this.metersToPixelsFactor, -halfHeight / this.metersToPixelsFactor, 
            halfWidth / this.metersToPixelsFactor, halfHeight / this.metersToPixelsFactor);

        // step simulation
        this.acumulatedTime += context.deltaTime;
        while(this.acumulatedTime > this.stepTime) {
            this.updateStep(context)
            this.acumulatedTime -= this.stepTime;
        }
    }

    private updateStep(context: Context) {
        this.currentStep += 1

        //
        // update individual particles
        //
        for (const ball of this.balls) {
            ball.update(this.stepTime, this.fricction);
            ball.collideInside(this.bounds);
        }

        //
        // resolve intercollisions
        //
        this.resolveCollisions();


        // 
        // remove dead particles
        //
        this.balls = this.balls.filter((ball) => {
            const speed = ball.motionValue();
            if (speed < 0.0003)
                return false;

            if (ball.lifeTime(this.currentStep) > this.lifeTimeThreshold)
                return false;

            return true;
        });
    }

    resolveCollisions() {
        if (this.balls.length < 2) return;

        for (let i = 0; i < this.balls.length; i++) {
            for (let j = i + 1; j < this.balls.length; j++) {
                const a = this.balls[i];
                const b = this.balls[j];
                a.collide(b);
            }
        }
    }


    render(context: Context) {
        const ctx = context.ctx;

        ctx.save();
        ctx.scale(this.metersToPixelsFactor, this.metersToPixelsFactor);

        for (const ball of this.balls) {
            context.ctx.save();
            context.ctx.translate(ball.position.x, ball.position.y);

            const speed = ball.motionValue();
            const speedFactor = clamp(speed / 0.01 , 0.0, 1.0);
            const timeToLive = this.lifeTimeThreshold - ball.lifeTime(this.currentStep);
            const timeFactor = clamp(timeToLive / this.stepsPerSecond, 0.0, 1.0);
            const factor = Math.min(speedFactor, timeFactor);

            ctx.fillStyle = ball.color.withAlpha(factor).toHex();
            ctx.strokeStyle = Color.WHITE.withAlpha(factor).toHex();
            ctx.lineWidth = 0.005;
    
            ctx.beginPath();
            ctx.arc(0.0, 0.0, ball.radius, 0, Math.PI * 2);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            
            
            ctx.restore();
        }

        ctx.restore();
    }
}


