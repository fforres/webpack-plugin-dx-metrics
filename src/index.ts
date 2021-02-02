import { Compiler } from 'webpack';
import debugFactory from 'debug';
import { v4 } from 'uuid';
import deepmerge from 'deepmerge';
import { Timer } from './timer';
import {
  Full,
  DXWebpackPluginProps,
  TrackingMetrics,
  TrackingMetricKeys,
} from './types';
import {
  DEBUG_STRING,
  PLUGIN_NAME,
} from './constants';

const sessionId = v4();
const debug = debugFactory(DEBUG_STRING);

// const dogapi = require('dogapi');
// dogapi.initialize({});

const timersCache = {
  [TrackingMetrics.recompile]: new Timer(TrackingMetrics.recompile),
  [TrackingMetrics.recompile_session]: new Timer(TrackingMetrics.recompile_session),
  [TrackingMetrics.compile]: new Timer(TrackingMetrics.compile),
  [TrackingMetrics.compile_session]: new Timer(TrackingMetrics.compile_session),
} as {[key: string]: Timer};

const timer = {
  start: (timerName: TrackingMetricKeys) => {
    debug('starting "%s" timer', timerName);
    timersCache[timerName].start();
  },
  stop: (timerName: TrackingMetricKeys) => {
    debug('stopping "%s" timer', timerName);
    timersCache[timerName].stop();
  },
  clear: (timerName: TrackingMetricKeys) => {
    debug('clearing "%s" timer', timerName);
    timersCache[timerName].clear();
  },
  getTime: (timerName: TrackingMetricKeys) => {
    const milliseconds = timersCache[timerName].milliseconds();
    debug('TIME (in miliseconds) for "%s" timer => %d', timerName, milliseconds);
    return milliseconds;
  },
};

class DXWebpackPlugin {
  private defaultOptions: Full<DXWebpackPluginProps> = {};

  private options: DXWebpackPluginProps = {};

  private isRecompilation: boolean = false

  private constructor(options = {}) {
    this.options = deepmerge<DXWebpackPluginProps>(options, this.defaultOptions);
    this.preflightCheck();
  }

  private preflightCheck = () => {}

  private finishInitialCompilation() {
    this.isRecompilation = true;
  }

  private apply(compiler: Compiler) {
    debug('Starting %s session. ID: "%s"', PLUGIN_NAME, sessionId);

    compiler.hooks.environment.tap(PLUGIN_NAME, () => {
      timer.start(TrackingMetrics.compile_session);
    });

    compiler.hooks.watchRun.tap(PLUGIN_NAME, () => {
      if (this.isRecompilation) {
        timer.start(TrackingMetrics.recompile_session);
      }
    });

    compiler.hooks.beforeCompile.tap(PLUGIN_NAME, () => {
      if (this.isRecompilation) {
        timer.start(TrackingMetrics.recompile);
      } else {
        timer.start(TrackingMetrics.compile);
      }
    });

    compiler.hooks.afterCompile.tap(PLUGIN_NAME, () => {
      if (this.isRecompilation) {
        timer.getTime(TrackingMetrics.recompile);
        timer.clear(TrackingMetrics.recompile);
      } else {
        timer.getTime(TrackingMetrics.compile);
        timer.clear(TrackingMetrics.compile);
      }
    });

    compiler.hooks.done.tap(PLUGIN_NAME, () => {
      if (this.isRecompilation) {
        timer.getTime(TrackingMetrics.recompile_session);
        timer.clear(TrackingMetrics.recompile_session);
      } else {
        timer.getTime(TrackingMetrics.compile_session);
        timer.clear(TrackingMetrics.compile_session);
        // This call marks the end of initial compilation, everyting after this
        // can be considered a re-compilation
        this.finishInitialCompilation();
      }
    });
  }
}

export = DXWebpackPlugin
