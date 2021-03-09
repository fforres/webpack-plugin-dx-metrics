/* eslint-disable no-param-reassign */
import { Compiler } from 'webpack';
import debugFactory from 'debug';
import { v4 } from 'uuid';
import deepmerge from 'deepmerge';
import datadogMetrics from 'datadog-metrics';
import {
  DXWebpackPluginProps,
  TrackingMetricKeys,
  trackingMetricKeys,
  UXPluginExtendedCompilation,
} from './types';
import { DEBUG_STRING, PLUGIN_NAME, PLUGIN_VERSION } from './constants';
import { timerExists, createTimer, getTimerMilliseconds } from './timers';

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
      prefix: 'ux.webpack.',
      flushIntervalSeconds: 2,
    },
  };

  private isRecompilation: boolean = false;

  private trackingEnabled: boolean = true;

  private enabledKeysSet: Set<TrackingMetricKeys> = new Set();

  private internallyDefinedTags: string[] = [];

  private constructor(options: DXWebpackPluginProps) {
    this.options = deepmerge<Required<DXWebpackPluginProps>>(
      this.defaultOptions,
      options,
    );
    this.trackingEnabled = !this.options.dryRun;
    this.enabledKeysSet = new Set(this.options.enabledKeysToTrack);
    this.internallyDefinedTags = this.generateInternalTags();

    this.preflightCheck();
  }

  private preflightCheck = () => {
    try {
      if (!this.options) {
        throw new Error('Options not initialized');
      }
      if (!this.options.projectName) {
        throw new Error('No project name was defined');
      }
      debug('Options: %O', this.options);
      this.datadogClient.init(this.options.datadogConfig);
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

  private generateInternalTags = (): string[] => {
    const optionTags = Object.entries(this.options.tags).map((tag) =>
      tag.join(':'),
    );

    const internalTags = [
      `projectName:${this.options.projectName}`,
      `pluginVersion:${PLUGIN_VERSION}`,
    ];

    debug('internallyDefinedTags %o', internalTags);

    return [...optionTags, ...internalTags];
  };

  private finishInitialCompilation = () => {
    this.isRecompilation = true;
  };

  private extendTags = (tags: any[] = []) => [
    `sessionId:${this.sessionId}`,
    ...this.internallyDefinedTags,
    ...tags,
  ];

  private shouldTrack = (
    key: TrackingMetricKeys,
    value: number,
    typeOfTracking: 'histogram' | 'gauge' | 'increment',
  ) => {
    if (!this.trackingEnabled) {
      debug('Tracking disabled, will not track %s', key);
      return false;
    }
    if (!this.enabledKeysSet.has(key)) {
      debug('Tracking key is not allowed, will not track %s', key);
      return false;
    }
    debug('Tracking "%s" as "%s". With value %s', key, typeOfTracking, value);
    return true;
  };

  private trackHistogram = (
    key: TrackingMetricKeys,
    value: number,
    tags?: string[],
    timestamp?: number,
  ) => {
    if (this.shouldTrack(key, value, 'histogram')) {
      this.datadogClient.histogram(
        key,
        value,
        this.extendTags(tags),
        timestamp,
      );
    }
  };

  private trackGauge = (
    key: TrackingMetricKeys,
    value: number,
    tags?: string[],
    timestamp?: number,
  ) => {
    if (this.shouldTrack(key, value, 'gauge')) {
      this.datadogClient.gauge(key, value, this.extendTags(tags), timestamp);
    }
  };

  private trackIncrement = (
    key: TrackingMetricKeys,
    value: number = 1,
    tags?: string[],
    timestamp?: number,
  ) => {
    if (this.shouldTrack(key, value, 'increment')) {
      this.datadogClient.increment(
        key,
        value,
        this.extendTags(tags),
        timestamp,
      );
    }
  };

  private apply(compiler: Compiler) {
    debug('Starting %s session. ID: "%s"', PLUGIN_NAME, this.sessionId);
    compiler.hooks.environment.tap(PLUGIN_NAME, () => {
      createTimer('compile_session');
      this.trackIncrement('compile_session');
    });

    compiler.hooks.watchRun.tap(PLUGIN_NAME, () => {
      if (this.isRecompilation) {
        createTimer('recompile_session');
        this.trackIncrement('recompile_session');
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
          this.trackHistogram('recompile', time);
          this.trackGauge('recompile', time);
        } else {
          this.trackHistogram('compile', time);
          this.trackGauge('compile', time);
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
        this.trackHistogram('recompile_session', time);
        this.trackGauge('recompile_session', time);
      } else {
        const time = getTimerMilliseconds('compile_session');
        if (!time) {
          debug("timer %s didn't return any milliseconds", 'compile_session');
          return;
        }
        this.trackHistogram('compile_session', time);
        this.trackGauge('compile_session', time);
        // Once we reach "done" for the first time, we can mark the end of
        // initial compilation, everyting after this, can be considered a
        // re-compilation, so we switch the flag
        this.finishInitialCompilation();
      }
    });
  }
}

export = DXWebpackPlugin;
