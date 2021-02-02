export type Full<T> = {
  [P in keyof T]-?: T[P];
}

export type DXWebpackPluginProps = {}

export const TrackingMetrics = {
  recompile: 'recompile',
  recompile_session: 'recompile_session',
  compile: 'compile',
  compile_session: 'compile_session',
} as const;

export type TrackingMetricKeys = keyof typeof TrackingMetrics;
