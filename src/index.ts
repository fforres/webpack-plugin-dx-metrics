import { Compiler } from 'webpack';
import { hrtime } from 'process';
import debugFactory from 'debug';
import { v4 } from 'uuid';

const sessionId = v4();
const debugString = 'ux:webpack_plugin';
const debug = debugFactory(debugString);
const pluginName = 'UXWebpackPlugin';

// const dogapi = require('dogapi');
// dogapi.initialize({});

const diffingBigIntsToMilliseconds = (bigInt1: bigint, bigInt2: bigint) => {
  const substracted = (bigInt1 - bigInt2);
  return Math.floor(Number(substracted / BigInt(1000000)));
};

class Timer {
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

const timerKeys = {
  recompile: 'recompile',
  recompileSession: 'recompileSession',
  compile: 'compile',
  compileSession: 'compileSession',
} as const;

const timersCache = {
  [timerKeys.recompile]: new Timer(timerKeys.recompile),
  [timerKeys.recompileSession]: new Timer(timerKeys.recompileSession),
  [timerKeys.compile]: new Timer(timerKeys.compile),
  [timerKeys.compileSession]: new Timer(timerKeys.compileSession),
} as {[key: string]: Timer};

type Keys = keyof typeof timerKeys;

const timer = {
  start: (timerName: Keys) => {
    debug('starting "%s" timer', timerName);
    timersCache[timerName].start();
  },
  stop: (timerName: Keys) => {
    debug('stopping "%s" timer', timerName);
    timersCache[timerName].stop();
  },
  clear: (timerName: Keys) => {
    debug('clearing "%s" timer', timerName);
    timersCache[timerName].clear();
  },
  getTime: (timerName: Keys) => {
    const milliseconds = timersCache[timerName].milliseconds();
    debug('TIME (in miliseconds) for "%s" timer => %d', timerName, milliseconds);
    return milliseconds;
  },
};

export default class UXWebpackPlugin {
  options: {} = {};

  isRecompilation: boolean = false

  constructor(options = {}) {
    this.options = options;
  }

  finishInitialCompilation() {
    this.isRecompilation = true;
  }

  apply(compiler: Compiler) {
    debug('Starting UXWebpackPlugin session. ID: "%s"', sessionId);

    compiler.hooks.environment.tap(pluginName, () => {
      timer.start(timerKeys.compileSession);
    });
    compiler.hooks.watchRun.tap(pluginName, () => {
      if (this.isRecompilation) {
        timer.start(timerKeys.recompileSession);
      }
    });

    compiler.hooks.beforeCompile.tap(pluginName, () => {
      if (this.isRecompilation) {
        timer.start(timerKeys.recompile);
      } else {
        timer.start(timerKeys.compile);
      }
    });
    compiler.hooks.afterCompile.tap(pluginName, () => {
      if (this.isRecompilation) {
        timer.getTime(timerKeys.recompile);
        timer.clear(timerKeys.recompile);
      } else {
        timer.getTime(timerKeys.compile);
        timer.clear(timerKeys.compile);
      }
    });
    compiler.hooks.done.tap(pluginName, () => {
      if (this.isRecompilation) {
        timer.getTime(timerKeys.recompileSession);
        timer.clear(timerKeys.recompileSession);
      } else {
        timer.getTime(timerKeys.compileSession);
        timer.clear(timerKeys.compileSession);
        // marks the end of initial compilation, everyting after this can be
        // considered a re-compilation
        this.finishInitialCompilation();
      }
    });
  }
}
