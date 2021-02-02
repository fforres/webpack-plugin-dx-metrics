
# DX-analytics-webpack-plugin

> **DISCLAIMER**: THIS IS STILL A WIP. USE IT AT YOUR OWN RISK

[![Github test badge](https://github.com/fforres/webpack-plugin-dx-metrics/workflows/test/badge.svg)](https://github.com/fforres/webpack-plugin-dx-metrics/actions?query=workflow%3Atest) [![npm version](https://badge.fury.io/js/%40fforres%2Fwebpack-plugin-dx.svg)](https://www.npmjs.com/package/@fforres/webpack-plugin-dx)

This webpack plugin serves as a way to quickly gather meaningful information on a webpack project's usage and sending it to a statsd server written in typescript.
(For demo purposes, we are integrating with Datadog's [hot-shot](https://github.com/brightcove/hot-shots)).

Attaches itself to webpack hooks, and using a series of timers, calculates and reports on things like compilation or recompilation time.

## Install

If your are using yarn

```bash
yarn add --dev @fforres/webpack-plugin-dx
```

or if you use npm

```bash
npm install --save-dev @fforres/webpack-plugin-dx
```

## Usage

you can see some usage of it in [./webpack.config.dev.js](./webpack.config.dev.js)
But in essence you require the `@fforres/webpack-plugin-dx` and use in in the plugins in your webpack config.

```TYPESCRIPT
const UXWebpackPlugin = require('@fforres/webpack-plugin-dx');
module.exports = {
  {...}
  plugins: [
    new UXWebpackPlugin(),
  ],
};
```

## Development

- `git clone`
- `yarn`
- and `yarn dev` to run a super-simple webpack-dev-server with the plugin `debug` enabled
- or `yarn debug` to run webpack with node `--inspect-brk` flag, and be able to debug using the [NIM - Node Inspector Manager](https://chrome.google.com/webstore/detail/nodejs-v8-inspector-manag/gnhhdgbaldcilmgcpfddgdbkhjohddkj?hl=en) chrome extension
- Once you have this running, go ahead and change (and save) a file inside [./app/](./app)

## Deploy

To deploy, create a PR and bump the the version in `package.json`. Once the PR is merged it will deploy a new version of the package.

## Current things being tracked

| Metric               | Tracking key        | Description                                                                                                                                                                   |  How are we tracking  |
|----------------------|---------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------|
| compilation          | `compile`           | Tracks only the time an application takes to compile the code. Regarding wepback hooks tracks from `"beforeCompile"` to `"compilation"`                                       | histogram             |
| compilationSession   | `compile_session`   | Tracks the time from when a webpack process starts, until it finishes. Regarding wepback hooks tracks from `"environment"` to `"done"`                                        | histogram & increment |
| recompilation        | `recompile`         | Tracks "only" the time an application takes to re-compile the code. (After the initial compilation). Regarding wepback hooks tracks from `"beforeCompile"` to `"compilation"` | histogram             |
| recompilationSession | `recompile_session` | Tracks the time when a webpack recompilation starts, until it finishes. Regarding wepback hooks, it tracks from `"watchRun"` to `"done"`                                      | histogram & increment |

## Things we might want to track but no decision yet

- **System info** [🔗](https://github.com/sebhildebrandt/systeminformation)
  > Creepy factor. 😬 However maybe useful on companies/internally. Being able to debug, or on bigger companies it would be useful to figure out what type of devices are slower/faster.
- **git commit sha.**
  > Creepy factor. 🤔
- **branch**
  > Creepy factor. 🤔

## Some info I've gathered

Some info gathering on webpack compilation steps

| Webpack Hook name | Runs in compilation | Runs in re-compilaton  |
|---|:---:|:---:|
| `environment` | ✅ | ❌ |
| `afterEnvironment` | ✅ | ❌ |
| `entryOption` | ✅ | ❌ |
| `afterPlugins` | ✅ | ❌ |
| `afterResolvers` | ✅ | ❌ |
| `entryOption` | ✅ | ❌ |
| `watchRun` | ✅ | ✅ |
| `normalModuleFactory` | ✅ | ✅ |
| `contextModuleFactory` | ✅ | ✅ |
| `beforeCompile` | ✅ | ✅ |
| `compile` | ✅ | ✅ |
| `thisCompilation` | ✅ | ✅ |
| `compilation` | ✅ | ✅ |
| `make` | ✅ | ✅ |
| `afterCompile` | ✅ | ✅ |
| `shouldEmit` | ✅ | ✅ |
| `emit` | ✅ | ✅ |
| `afterEmit` | ✅ | ✅ |
| `done` | ✅ | ✅ |
