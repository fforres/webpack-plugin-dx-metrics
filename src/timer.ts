import { hrtime } from 'process';
import debugFactory from 'debug';
import { DEBUG_STRING } from './constants';

const debug = debugFactory(`${DEBUG_STRING}:timer`);
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

  private timeSinceStart = (bigInt1: bigint) => {
    const substracted = bigInt1 - this.startTime;
    return Math.floor(Number(substracted / BigInt(1000000)));
  };

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
      const milliseconds = this.timeSinceStart(hrtime.bigint());
      debug('Time for "%s" => "%d ms"', this.props.label, milliseconds);
      return milliseconds;
    }
    const milliseconds = this.timeSinceStart(this.stopTime);
    debug('Time for "%s" => "%d ms"', this.props.label, milliseconds);
    return milliseconds;
  }
}
