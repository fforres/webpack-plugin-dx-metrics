import { hrtime } from 'process';
import debugFactory from 'debug';
import { DEBUG_STRING } from './constants';

const debug = debugFactory(`${DEBUG_STRING}:timer`);

const diffingBigIntsToMilliseconds = (bigInt1: bigint, bigInt2: bigint) => {
  const substracted = bigInt1 - bigInt2;
  return Math.floor(Number(substracted / BigInt(1000000)));
};

export class Timer {
  props: { label: string } = {
    label: '',
  };

  startTime: bigint = BigInt(0);

  stopTime: bigint = BigInt(0);

  isRunning: boolean = false;

  started: boolean = false;

  constructor(label: string) {
    this.props = { label };
  }

  start() {
    debug('Starting timer - "%s"', this.props.label);
    this.startTime = hrtime.bigint();
    this.started = true;
    this.isRunning = true;
  }

  stop() {
    debug('Stopping timer - "%s"', this.props.label);
    this.stopTime = hrtime.bigint();
    this.isRunning = false;
  }

  clear() {
    debug('Clearing timer - "%s"', this.props.label);
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
      const milliseconds = diffingBigIntsToMilliseconds(
        hrtime.bigint(),
        this.startTime,
      );
      debug('Time for "%s" => "%d ms"', this.props.label, milliseconds);
      return milliseconds;
    }
    const milliseconds = diffingBigIntsToMilliseconds(
      this.stopTime,
      this.startTime,
    );
    debug('Time for "%s" => "%d ms"', this.props.label, milliseconds);
    return milliseconds;
  }
}
