export declare type Full<T> = {
    [P in keyof T]-?: T[P];
};
export declare type DXWebpackPluginProps = {};
export declare const TrackingMetrics: {
    readonly recompile: "recompile";
    readonly recompile_session: "recompile_session";
    readonly compile: "compile";
    readonly compile_session: "compile_session";
};
export declare type TrackingMetricKeys = keyof typeof TrackingMetrics;
//# sourceMappingURL=types.d.ts.map