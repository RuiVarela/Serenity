import { Context } from "../Context";
import { Vec2 } from "../core/Vec2";

enum AutoPilotState {
    DISABLED,
    INACTIVE,
    ACTIVE,
    PRESSING_BUTTON,
    IDLE,
}

export class Scene {
    protected autoPilotPressMinDuration = 50;
    protected autoPilotPressMaxDuration = 1000;
    protected autoPilotIdleDuration = 500;
    protected autoPilotInactivityTimeout = 5000;
    protected autoPilotMoveHalts = false;

    private autoPilotState = AutoPilotState.INACTIVE;
    private autoPilotStartTs = Date.now();
    private autoPilotStateTs = Date.now();
    private autoPilotPosition = new Vec2(0.0, 0.0);
    private autoPilotPressDuration = 0;

    protected pressCounter = 0;
    private lastPointerDownTs = Date.now();

    protected context: Context;

    constructor(context: Context) {
        this.context = context;
    }

    private mouseEventHandler = (event: MouseEvent) => {
        if (this.context.isSwitchingScene()) return;

        if (event.type == 'pointerdown') {
            this.dispatchPointerDown(event, new Vec2(event.clientX, event.clientY));
        } else if (event.type == 'pointerup') {
            this.onPointerUp(new Vec2(event.clientX, event.clientY));
        } else if (event.type == 'pointermove') {
            this.dispatchPointerMove(event, new Vec2(event.clientX, event.clientY));
        }
        //console.log(`mouseEventHandler ${event.type} ${event.clientX} ${event.clientY}`);
    };
    

    disableAutoPilot() {
        this.autoPilotState = AutoPilotState.DISABLED;
    }
    
    setup() { 
        this.context.canvas.addEventListener('pointerdown', this.mouseEventHandler);
        this.context.canvas.addEventListener('pointerup', this.mouseEventHandler);
        this.context.canvas.addEventListener('pointermove', this.mouseEventHandler);
    }

    tearDown() {
        this.context.canvas.removeEventListener('pointerdown', this.mouseEventHandler);
        this.context.canvas.removeEventListener('pointerup', this.mouseEventHandler);
        this.context.canvas.removeEventListener('pointermove', this.mouseEventHandler);
    }

    update(): void {
        if (this.autoPilotState === AutoPilotState.INACTIVE) {
            const deltaInteraction = Date.now() - this.lastPointerDownTs;
            if (deltaInteraction > this.autoPilotInactivityTimeout) {
                this.startAutoPilot(this.context);
            }
        } else if (this.autoPilotState !== AutoPilotState.DISABLED) {
            this.processAutoPilot(this.context);
        }
    }

    render() {
     
    }

    //
    // auto pilot
    //
    startAutoPilot(context: Context) {
        console.log('startAutoPilot');

        this.autoPilotState = AutoPilotState.IDLE;
        this.autoPilotStateTs = this.lastPointerDownTs;
        this.autoPilotStartTs = Date.now();
    }

    endAutoPilot() {
        console.log('endAutoPilot');

        if (this.autoPilotState === AutoPilotState.PRESSING_BUTTON) {
            this.onPointerUp(this.autoPilotPosition);
        }

        this.lastPointerDownTs = Date.now();
        this.autoPilotState = AutoPilotState.INACTIVE;
        this.autoPilotStateTs = Date.now();
        
    }

    processAutoPilot(context: Context) {
        const deltaState = Date.now() - this.autoPilotStateTs;
        if (this.autoPilotState === AutoPilotState.PRESSING_BUTTON) {

            if (deltaState > this.autoPilotPressDuration) {
                this.onPointerUp(this.autoPilotPosition);
    
                this.autoPilotState = AutoPilotState.IDLE;
                this.autoPilotStateTs = Date.now();
            }

        } else if (this.autoPilotState === AutoPilotState.IDLE) {
            if (deltaState > this.autoPilotIdleDuration) {
                this.autoPilotState = AutoPilotState.PRESSING_BUTTON;
                this.autoPilotStateTs = Date.now();
                this.autoPilotPosition = Vec2.random().mul(context.screenSize);

                this.autoPilotPressDuration = this.autoPilotPressMinDuration + Math.random() * (this.autoPilotPressMaxDuration - this.autoPilotPressMinDuration);
                this.onPointerDown(this.autoPilotPosition);
            }
        }

    }
    
    autoPilotRunning() {
        return this.autoPilotState !== AutoPilotState.INACTIVE && this.autoPilotState !== AutoPilotState.DISABLED;
    }   

    //
    // mouse interaction
    //
    dispatchPointerDown(event: MouseEvent, position: Vec2) {
        this.lastPointerDownTs = Date.now();
        if (this.autoPilotRunning()) {
            this.endAutoPilot();
        }
        this.onPointerDown(position);
    }

    dispatchPointerMove(event: MouseEvent, position: Vec2) {
        if (this.autoPilotMoveHalts) {
            this.lastPointerDownTs = Date.now();
            if (this.autoPilotRunning()) {
                this.endAutoPilot();
            }
        }
        this.onPointerMove(position);
    }

    autoPilotElapsed(): number {
        if (this.autoPilotRunning()) {
            const delta = Date.now() - this.autoPilotStartTs;
            return delta / 1000.0;
        }

        return 0;
    }


    onPointerDown(position: Vec2) {
        this.pressCounter = this.pressCounter + 1;
    }

    onPointerUp(position: Vec2) {

    }

    onPointerMove(position: Vec2) {

    }
}