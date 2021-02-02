export declare class Timer {
    props: {
        label: string;
    };
    startTime: bigint;
    stopTime: bigint;
    isRunning: boolean;
    started: boolean;
    constructor(label: string);
    start(): void;
    stop(): void;
    clear(): void;
    milliseconds(): number;
}
//# sourceMappingURL=timer.d.ts.map