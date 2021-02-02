"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const process_1 = require("process");
const debug_1 = __importDefault(require("debug"));
const uuid_1 = __importDefault(require("uuid"));
const sessionId = uuid_1.default.v4();
const debugString = 'ux:webpack_plugin';
const debug = debug_1.default(debugString);
const pluginName = 'UXWebpackPlugin';
// const dogapi = require('dogapi');
// dogapi.initialize({});
const diffingBigIntsToMilliseconds = (bigInt1, bigInt2) => {
    const substracted = (bigInt1 - bigInt2);
    return Math.floor(Number(substracted / BigInt(1000000)));
};
class Timer {
    constructor(label) {
        this.props = {
            label: '',
        };
        this.startTime = BigInt(0);
        this.stopTime = BigInt(0);
        this.isRunning = false;
        this.started = false;
        this.props = { label };
    }
    start() {
        this.startTime = process_1.hrtime.bigint();
        this.started = true;
        this.isRunning = true;
    }
    stop() {
        this.stopTime = process_1.hrtime.bigint();
        this.isRunning = false;
    }
    clear() {
        this.startTime = BigInt(0);
        this.stopTime = BigInt(0);
        this.isRunning = false;
        this.started = false;
    }
    milliseconds() {
        if (!this.started) {
            throw new Error(`Timer "${this.props.label}" was never started`);
        }
        if (this.isRunning) {
            return diffingBigIntsToMilliseconds(process_1.hrtime.bigint(), this.startTime);
        }
        return diffingBigIntsToMilliseconds(this.stopTime, this.startTime);
    }
}
const timerKeys = {
    recompile: 'recompile',
    recompileSession: 'recompileSession',
    compile: 'compile',
    compileSession: 'compileSession',
};
const timersCache = {
    [timerKeys.recompile]: new Timer(timerKeys.recompile),
    [timerKeys.recompileSession]: new Timer(timerKeys.recompileSession),
    [timerKeys.compile]: new Timer(timerKeys.compile),
    [timerKeys.compileSession]: new Timer(timerKeys.compileSession),
};
const timer = {
    start: (timerName) => {
        debug('starting "%s" timer', timerName);
        timersCache[timerName].start();
    },
    stop: (timerName) => {
        debug('stopping "%s" timer', timerName);
        timersCache[timerName].stop();
    },
    clear: (timerName) => {
        debug('clearing "%s" timer', timerName);
        timersCache[timerName].clear();
    },
    getTime: (timerName) => {
        const milliseconds = timersCache[timerName].milliseconds();
        debug('TIME (in miliseconds) for "%s" timer => %d', timerName, milliseconds);
        return milliseconds;
    },
};
class UXWebpackPlugin {
    constructor(options = {}) {
        this.options = {};
        this.isRecompilation = false;
        this.options = options;
    }
    finishInitialCompilation() {
        this.isRecompilation = true;
    }
    apply(compiler) {
        debug('Starting UXWebpackPlugin session. ID: "%s"', sessionId);
        compiler.hooks.environment.tap(pluginName, () => {
            timer.start(timerKeys.compileSession);
        });
        compiler.hooks.watchRun.tap(pluginName, () => {
            if (this.isRecompilation) {
                timer.start(timerKeys.recompileSession);
            }
        });
        compiler.hooks.beforeCompile.tap(pluginName, () => {
            if (this.isRecompilation) {
                timer.start(timerKeys.recompile);
            }
            else {
                timer.start(timerKeys.compile);
            }
        });
        compiler.hooks.afterCompile.tap(pluginName, () => {
            if (this.isRecompilation) {
                timer.getTime(timerKeys.recompile);
                timer.clear(timerKeys.recompile);
            }
            else {
                timer.getTime(timerKeys.compile);
                timer.clear(timerKeys.compile);
            }
        });
        compiler.hooks.done.tap(pluginName, () => {
            if (this.isRecompilation) {
                timer.getTime(timerKeys.recompileSession);
                timer.clear(timerKeys.recompileSession);
            }
            else {
                timer.getTime(timerKeys.compileSession);
                timer.clear(timerKeys.compileSession);
                // marks the end of initial compilation, everyting after this can be
                // considered a re-compilation
                this.finishInitialCompilation();
            }
        });
    }
}
exports.default = UXWebpackPlugin;
