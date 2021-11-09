/* eslint-disable no-param-reassign */
import debugFactory from 'debug';
import { v4 } from 'uuid';
import deepmerge from 'deepmerge';
import datadogMetrics from 'datadog-metrics';
import {
  Compiler,
  DXWebpackPluginProps,
  trackingMetricKeys,
  UXPluginExtendedCompilation,
} from './types';
import { DEBUG_STRING, PLUGIN_NAME, PLUGIN_PREFIX } from './constants';
import { timerExists, createTimer, getTimerMilliseconds } from './timers';
import { Tracker } from './tracker';

const debug = debugFactory(DEBUG_STRING);

class DXWebpackPlugin {
  private sessionId = v4();

  private options: Required<DXWebpackPluginProps>;

  private datadogClient = datadogMetrics;

  private defaultOptions: Partial<DXWebpackPluginProps> = {
    enabledKeysToTrack: trackingMetricKeys,
    dryRun: false,
    tags: {},
    datadogConfig: {
      prefix: PLUGIN_PREFIX,
      flushIntervalSeconds: 2,
    },
    memoryTracking: {
      enabled: true,
      lapseTimeInMilliseconds: 2000,
    },
  };

  private isRecompilation: boolean = false;

  private memoryTrackingInterval: ReturnType<typeof setInterval> | null = null;

  private tracker: Tracker;

  constructor(options: DXWebpackPluginProps) {
    this.options = deepmerge<Required<DXWebpackPluginProps>>(
      this.defaultOptions,
      options,
    );
    this.tracker = new Tracker(this.options, this.sessionId);
    this.preflightCheck();
  }

  private trackMemoryUsage = () => {
    const { rss, heapUsed, heapTotal } = process.memoryUsage();
    this.tracker.trackAll('process_memory', rss / 1024);
    this.tracker.trackAll('heap_total', heapTotal / 1024);
    this.tracker.trackAll('heap_used', heapUsed / 1024);
  };

  private initializeMemoryUsageTracking = () => {
    if (this.options.memoryTracking.enabled) {
      this.memoryTrackingInterval = setInterval(
        this.trackMemoryUsage,
        this.options.memoryTracking.lapseTimeInMilliseconds,
      );
    }
  };

  private preflightCheck = () => {
    try {
      if (!this.options) {
        throw new Error('Options not initialized');
      }
      if (!this.options.projectName) {
        throw new Error('No project name was defined');
      }
      debug('Options: %O', this.options);
      this.initializeMemoryUsageTracking();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('DXWebpackPlugin Preflight Check was not successful ❌');
      // eslint-disable-next-line no-console
      console.error(e);
    }
    // eslint-disable-next-line no-console
    console.info(
      'DXWebpackPlugin Preflight Check successful ✅. Ready to Start',
    );
  };

  private finishInitialCompilation = () => {
    this.isRecompilation = true;
  };

  private apply(compiler: Compiler) {
    debug('Starting %s session. ID: "%s"', PLUGIN_NAME, this.sessionId);
    compiler.hooks.environment.tap(PLUGIN_NAME, () => {
      createTimer('compile_session');
      this.tracker.trackIncrement('compile_session');
    });

    compiler.hooks.watchRun.tap(PLUGIN_NAME, () => {
      if (this.isRecompilation) {
        createTimer('recompile_session');
        this.tracker.trackIncrement('recompile_session');
      }
    });

    compiler.hooks.beforeCompile.tapAsync(
      PLUGIN_NAME,
      (compilationParams: any, callback) => {
        const id = this.isRecompilation ? 'recompile' : 'compile';
        if (!timerExists(id)) {
          const recompilationId = createTimer(id);
          compilationParams.__id = recompilationId;
        }
        callback();
      },
    );

    compiler.hooks.compilation.tap(
      PLUGIN_NAME,
      (compilation: UXPluginExtendedCompilation, compilationParams: any) => {
        /** This steps is here ATM to map the ID generated on the "beforeCompile"
         * step, into the final "Compilation" object. This will allows us to
         * match a "beforeCompile" hook with its corresponding "afterCompile" one.
         */
        if (this.isRecompilation && compilationParams.__id) {
          compilation.__id = compilationParams.__id;
        }
      },
    );

    compiler.hooks.afterCompile.tap(
      PLUGIN_NAME,
      (compilation: UXPluginExtendedCompilation) => {
        // Figure out (in here? maybe?) what type of compilation was this. CSS/JS/ESM/SVG/ETC
        if (!compilation.__id) {
          debug('no compilation id present');
          return;
        }
        const time = getTimerMilliseconds(compilation.__id);
        if (!time) {
          debug("timer %s didn't return any milliseconds", compilation.__id);
          return;
        }
        if (this.isRecompilation) {
          this.tracker.trackAll('recompile', time);
        } else {
          this.tracker.trackAll('compile', time);
        }
      },
    );

    compiler.hooks.done.tap(PLUGIN_NAME, () => {
      debug('done');
      if (this.isRecompilation) {
        const time = getTimerMilliseconds('recompile_session');
        if (!time) {
          debug("timer %s didn't return any milliseconds", 'recompile_session');
          return;
        }
        this.tracker.trackAll('recompile_session', time);
      } else {
        const time = getTimerMilliseconds('compile_session');
        if (!time) {
          debug("timer %s didn't return any milliseconds", 'compile_session');
          return;
        }
        this.tracker.trackAll('compile_session', time);
        // Once we reach "done" for the first time, we can mark the end of
        // initial compilation, everyting after this, can be considered a
        // re-compilation, so we switch the flag
        this.finishInitialCompilation();
      }
    });
  }
}

export = DXWebpackPlugin;
