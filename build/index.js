"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const debug_1 = __importDefault(require("debug"));
const uuid_1 = require("uuid");
const deepmerge_1 = __importDefault(require("deepmerge"));
const timer_1 = require("./timer");
const types_1 = require("./types");
const constants_1 = require("./constants");
const sessionId = uuid_1.v4();
const debug = debug_1.default(constants_1.DEBUG_STRING);
// const dogapi = require('dogapi');
// dogapi.initialize({});
const timersCache = {
    [types_1.TrackingMetrics.recompile]: new timer_1.Timer(types_1.TrackingMetrics.recompile),
    [types_1.TrackingMetrics.recompile_session]: new timer_1.Timer(types_1.TrackingMetrics.recompile_session),
    [types_1.TrackingMetrics.compile]: new timer_1.Timer(types_1.TrackingMetrics.compile),
    [types_1.TrackingMetrics.compile_session]: new timer_1.Timer(types_1.TrackingMetrics.compile_session),
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
class DXWebpackPlugin {
    constructor(options = {}) {
        this.defaultOptions = {};
        this.options = {};
        this.isRecompilation = false;
        this.preflightCheck = () => { };
        this.options = deepmerge_1.default(options, this.defaultOptions);
        this.preflightCheck();
    }
    finishInitialCompilation() {
        this.isRecompilation = true;
    }
    apply(compiler) {
        debug('Starting %s session. ID: "%s"', constants_1.PLUGIN_NAME, sessionId);
        compiler.hooks.environment.tap(constants_1.PLUGIN_NAME, () => {
            timer.start(types_1.TrackingMetrics.compile_session);
        });
        compiler.hooks.watchRun.tap(constants_1.PLUGIN_NAME, () => {
            if (this.isRecompilation) {
                timer.start(types_1.TrackingMetrics.recompile_session);
            }
        });
        compiler.hooks.beforeCompile.tap(constants_1.PLUGIN_NAME, () => {
            if (this.isRecompilation) {
                timer.start(types_1.TrackingMetrics.recompile);
            }
            else {
                timer.start(types_1.TrackingMetrics.compile);
            }
        });
        compiler.hooks.afterCompile.tap(constants_1.PLUGIN_NAME, () => {
            if (this.isRecompilation) {
                timer.getTime(types_1.TrackingMetrics.recompile);
                timer.clear(types_1.TrackingMetrics.recompile);
            }
            else {
                timer.getTime(types_1.TrackingMetrics.compile);
                timer.clear(types_1.TrackingMetrics.compile);
            }
        });
        compiler.hooks.done.tap(constants_1.PLUGIN_NAME, () => {
            if (this.isRecompilation) {
                timer.getTime(types_1.TrackingMetrics.recompile_session);
                timer.clear(types_1.TrackingMetrics.recompile_session);
            }
            else {
                timer.getTime(types_1.TrackingMetrics.compile_session);
                timer.clear(types_1.TrackingMetrics.compile_session);
                // This call marks the end of initial compilation, everyting after this
                // can be considered a re-compilation
                this.finishInitialCompilation();
            }
        });
    }
}
module.exports = DXWebpackPlugin;
