import { Compiler } from 'webpack';
import debugFactory from 'debug';
import { v4 } from 'uuid';
import deepmerge from 'deepmerge';
import datadogMetrics from 'datadog-metrics';
import { Timer } from './timer';
import {
  DXWebpackPluginProps,
  TrackingMetrics,
  TrackingMetricKeys,
  trackingMetricKeys,
} from './types';
import {
  DEBUG_STRING,
  PLUGIN_NAME,
} from './constants';

const sessionId = v4();
const debug = debugFactory(DEBUG_STRING);

const timersCache = {
  [TrackingMetrics.recompile]: new Timer(TrackingMetrics.recompile),
  [TrackingMetrics.recompile_session]: new Timer(TrackingMetrics.recompile_session),
  [TrackingMetrics.compile]: new Timer(TrackingMetrics.compile),
  [TrackingMetrics.compile_session]: new Timer(TrackingMetrics.compile_session),
};

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
    debug('TIME (in miliseconds) for "%s" => "%d miliseconds"', timerName, milliseconds);
    return milliseconds;
  },
};

class DXWebpackPlugin {
  private options: Required<DXWebpackPluginProps> | null = null;

  private statsDClient = datadogMetrics

  private defaultOptions: Partial<DXWebpackPluginProps> = {
    enabledKeysToTrack: trackingMetricKeys,
    dryRun: false,
    datadogConfig: {
      prefix: 'ux.webpack.',
      flushIntervalSeconds: 2,
    },
  };

  private isRecompilation: boolean = false

  private trackingEnabled: boolean = true

  private enabledKeysSet: Set<TrackingMetricKeys> = new Set()

  private constructor(options: DXWebpackPluginProps) {
    this.options = deepmerge<Required<DXWebpackPluginProps>>(this.defaultOptions, options);
    this.trackingEnabled = !this.options.dryRun;
    this.enabledKeysSet = new Set(this.options.enabledKeysToTrack);
    this.preflightCheck();
  }

  private preflightCheck = () => {
    if (!this.options) {
      throw new Error('Options not initialized');
    }
    if (!this.statsDClient) {
      throw new Error('StatsD Client not initialized');
    }
    debug('Options: %O', this.options);
    this.statsDClient.init(this.options.datadogConfig);
    // eslint-disable-next-line no-console
    console.info('Preflight check successful ✅. Ready to Start');
  }

  private finishInitialCompilation = () => {
    this.isRecompilation = true;
  }

  private shouldTrack = (key: TrackingMetricKeys, value: number) => {
    if (!this.trackingEnabled) {
      debug('Tracking disabled, will not track %s', key);
      return false;
    }
    if (!this.enabledKeysSet.has(key)) {
      debug('Tracking key is not allowed, will not track %s', key);
      return false;
    }
    debug('Tracking  %s with value %s', key, value);
    return true;
  }

  private trackHistogram = (key: TrackingMetricKeys, value: number) => {
    if (this.shouldTrack(key, value)) {
      this.statsDClient.histogram(key, value);
    }
  }

  private trackIncrement = (key: TrackingMetricKeys, value: number = 1) => {
    if (this.shouldTrack(key, value)) {
      this.statsDClient.increment(key, value);
    }
  }

  private apply(compiler: Compiler) {
    debug('Starting %s session. ID: "%s"', PLUGIN_NAME, sessionId);

    compiler.hooks.environment.tap(PLUGIN_NAME, () => {
      timer.start(TrackingMetrics.compile_session);
      this.trackIncrement(TrackingMetrics.compile_session);
    });

    compiler.hooks.watchRun.tap(PLUGIN_NAME, () => {
      if (this.isRecompilation) {
        timer.start(TrackingMetrics.recompile_session);
        this.trackIncrement(TrackingMetrics.recompile_session);
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
        const time = timer.getTime(TrackingMetrics.recompile);
        this.trackHistogram(TrackingMetrics.recompile, time);
        timer.clear(TrackingMetrics.recompile);
      } else {
        const time = timer.getTime(TrackingMetrics.compile);
        this.trackHistogram(TrackingMetrics.compile, time);
        timer.clear(TrackingMetrics.compile);
      }
    });

    compiler.hooks.done.tap(PLUGIN_NAME, () => {
      if (this.isRecompilation) {
        const time = timer.getTime(TrackingMetrics.recompile_session);
        this.trackHistogram(TrackingMetrics.recompile_session, time);
        timer.clear(TrackingMetrics.recompile_session);
      } else {
        const time = timer.getTime(TrackingMetrics.compile_session);
        this.trackHistogram(TrackingMetrics.compile_session, time);
        timer.clear(TrackingMetrics.compile_session);
        // Once we reach "done" for the first time, we can mark the end of
        // initial compilation, everyting after this, can be considered a
        // re-compilation, so we switch the flag
        this.finishInitialCompilation();
      }
    });
  }
}

export = DXWebpackPlugin
