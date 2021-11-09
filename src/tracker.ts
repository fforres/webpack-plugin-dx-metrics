import datadogMetrics from 'datadog-metrics';
import debug from 'debug';
import { DEBUG_STRING, PLUGIN_VERSION } from './constants';
import { DXWebpackPluginProps, TrackingMetricKeys } from './types';

const d = debug(`${DEBUG_STRING}:track`);

// TODO: Extract this into it's own thing. Or make 'webpack-plugin-dx-metrics'
// and this plugin, a mono-repo.
export class Tracker {
  private sessionId: string;

  private trackingEnabled: boolean = false;

  private enabledKeysSet: Set<TrackingMetricKeys> = new Set();

  private datadogClient = datadogMetrics;

  private datadogConfig:
    | datadogMetrics.BufferedMetricsLoggerOptions
    | undefined;

  private internallyDefinedTags: string[] = [];

  constructor(options: DXWebpackPluginProps, sessionId: string) {
    this.trackingEnabled = !options.dryRun;
    this.enabledKeysSet = new Set(options.enabledKeysToTrack);
    this.datadogConfig = options.datadogConfig;
    this.internallyDefinedTags = this.generateInternalTags(options);
    this.sessionId = sessionId;
    this.preflightCheck();
  }

  private generateInternalTags = (options: DXWebpackPluginProps): string[] => {
    const optionTags = Object.entries(options.tags || {}).map((tag) =>
      tag.join(':'),
    );

    const internalTags = [
      `projectName:${options.projectName}`,
      `pluginVersion:${PLUGIN_VERSION}`,
      `sessionId:${this.sessionId}`,
    ];

    d('internally defined tags => %o', internalTags);
    return [...optionTags, ...internalTags];
  };

  private preflightCheck = () => {
    try {
      if (!this.trackingEnabled) {
        return;
      }
      if (!this.datadogConfig) {
        throw new Error(
          'Datadog config was not initialized, and this is not a dry run',
        );
      }
      this.datadogClient.init(this.datadogConfig);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Tracker preflight Check was not successful ❌');
      // eslint-disable-next-line no-console
      console.error(e);
    }
  };

  private extendTags = (tags: any[] = []) => [
    ...this.internallyDefinedTags,
    ...tags,
  ];

  private shouldTrack = (
    key: TrackingMetricKeys,
    value: number,
    typeOfTracking: 'histogram' | 'gauge' | 'increment',
  ) => {
    d('Tracking "%s" as "%s". With value %s', key, typeOfTracking, value);
    if (!this.trackingEnabled) {
      d('Tracking disabled, will not track %s', key);
      return false;
    }
    if (!this.enabledKeysSet.has(key)) {
      d('Tracking key is not allowed, will not track %s', key);
      return false;
    }
    return true;
  };

  trackHistogram = (key: TrackingMetricKeys, value: number) => {
    if (!this.shouldTrack(key, value, 'histogram')) {
      return;
    }
    this.datadogClient.histogram(key, value, this.extendTags());
  };

  trackGauge = (key: TrackingMetricKeys, value: number) => {
    if (!this.shouldTrack(key, value, 'gauge')) {
      return;
    }
    this.datadogClient.gauge(key, value, this.extendTags());
  };

  trackIncrement = (key: TrackingMetricKeys, value: number = 1) => {
    if (!this.shouldTrack(key, value, 'increment')) {
      return;
    }
    this.datadogClient.increment(key, value, this.extendTags());
  };

  trackAll = (key: TrackingMetricKeys, value: number) => {
    this.trackHistogram(key, value);
    this.trackGauge(key, value);
    this.trackIncrement(key, value);
  };
}
