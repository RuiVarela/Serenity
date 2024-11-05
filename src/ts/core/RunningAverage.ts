
export class RunningAverage {
    private samples: Array<number> = new Array<number>();
    private currentAverage: number = 0;
    private currentSum: number = 0;
    private window: number = 0;

    constructor(window: number, initialValue: number) {
        this.window = window;
        this.reset(initialValue);
    }

    reset(initialValue: number) {
        this.samples = [];
        this.currentAverage = 0.0;
        this.currentSum = 0.0;

        this.addSample(initialValue);
    }

    addSample(sample: number) {
        this.samples.push(sample);
        this.currentSum += sample;

        if (this.samples.length > this.window) {
            this.currentSum -= this.samples[0];
            this.samples.shift();
        }

        this.currentAverage = this.currentSum / this.samples.length;
    }

    average(): number { return this.currentAverage; }

}