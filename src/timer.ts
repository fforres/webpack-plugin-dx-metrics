import { hrtime } from 'process';

const diffingBigIntsToMilliseconds = (bigInt1: bigint, bigInt2: bigint) => {
  const substracted = (bigInt1 - bigInt2);
  return Math.floor(Number(substracted / BigInt(1000000)));
};

export class Timer {
  props: {label: string} = {
    label: '',
  }

  startTime: bigint = BigInt(0)

  stopTime: bigint = BigInt(0)

  isRunning: boolean = false

  started: boolean = false

  constructor(label: string) {
    this.props = { label };
  }

  start() {
    this.startTime = hrtime.bigint();
    this.started = true;
    this.isRunning = true;
  }

  stop() {
    this.stopTime = hrtime.bigint();
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
      return diffingBigIntsToMilliseconds(hrtime.bigint(), this.startTime);
    }
    return diffingBigIntsToMilliseconds(this.stopTime, this.startTime);
  }
}
