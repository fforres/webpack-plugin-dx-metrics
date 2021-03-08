import { BufferedMetricsLoggerOptions } from 'datadog-metrics';
import webpack from 'webpack';

export type Full<T> = {
  [P in keyof T]-?: T[P];
};

export const TrackingMetrics = {
  recompile: 'recompile',
  recompile_session: 'recompile_session',
  compile: 'compile',
  compile_session: 'compile_session',
} as const;

export type TrackingMetricKeys = keyof typeof TrackingMetrics;

export type DXWebpackPluginProps = {
  datadogConfig?: BufferedMetricsLoggerOptions;
  enabledKeysToTrack?: TrackingMetricKeys[];
  tags?: { [key: string]: string };
  projectName: string;
  dryRun?: boolean;
};

export const trackingMetricKeys = Object.keys(
  TrackingMetrics,
) as TrackingMetricKeys[];

export type UXPluginExtendedCompilation = webpack.compilation.Compilation & {
  __id?: string;
};
