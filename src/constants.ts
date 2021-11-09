import packageJson from '../package.json';

export const DEBUG_STRING = 'ux:webpack_plugin';
export const PLUGIN_NAME = 'DXWebpackPlugin';
export const PLUGIN_VERSION = packageJson?.version || '0.0.0';
export const PLUGIN_PREFIX = 'ux.webpack.';
