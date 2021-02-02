import { ClientOptions } from 'hot-shots';
export declare type Full<T> = {
    [P in keyof T]-?: T[P];
};
export declare const TrackingMetrics: {
    readonly recompile: "recompile";
    readonly recompile_session: "recompile_session";
    readonly compile: "compile";
    readonly compile_session: "compile_session";
};
export declare type TrackingMetricKeys = keyof typeof TrackingMetrics;
export declare type DXWebpackPluginProps = {
    datadogConfig: ClientOptions;
    enabledKeysToTrack: TrackingMetricKeys[];
    dryRun: boolean;
};
export declare const trackingMetricKeys: ("recompile" | "recompile_session" | "compile" | "compile_session")[];
//# sourceMappingURL=types.d.ts.map