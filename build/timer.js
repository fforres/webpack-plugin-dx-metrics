"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Timer = void 0;
const process_1 = require("process");
const diffingBigIntsToMilliseconds = (bigInt1, bigInt2) => {
    const substracted = (bigInt1 - bigInt2);
    return Math.floor(Number(substracted / BigInt(1000000)));
};
class Timer {
    constructor(label) {
        this.props = {
            label: '',
        };
        this.startTime = BigInt(0);
        this.stopTime = BigInt(0);
        this.isRunning = false;
        this.started = false;
        this.props = { label };
    }
    start() {
        this.startTime = process_1.hrtime.bigint();
        this.started = true;
        this.isRunning = true;
    }
    stop() {
        this.stopTime = process_1.hrtime.bigint();
        this.isRunning = false;
    }
    clear() {
        this.startTime = BigInt(0);
        this.stopTime = BigInt(0);
        this.isRunning = false;
        this.started = false;
    }
    milliseconds() {
        if (!this.started) {
            throw new Error(`Timer "${this.props.label}" was never started`);
        }
        if (this.isRunning) {
            return diffingBigIntsToMilliseconds(process_1.hrtime.bigint(), this.startTime);
        }
        return diffingBigIntsToMilliseconds(this.stopTime, this.startTime);
    }
}
exports.Timer = Timer;
