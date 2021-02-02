<img src="https://github.com/fforres/webpack-plugin-dx-metrics/workflows/test/badge.svg"/>

Things I'd like to track 

## Timers
- compilation time: from "beforeCompile" to "compilation"
- compilationSession time: from "environment" to "done"
- recompilation time: from "beforeCompile" to "compilation"
- recompilationSession time: from "watchRun" to "done"

> Should we gather the following as well.
- Device info
- Current Github account (maybe too creepy?)
- Branch

## Some info I've gathered

### Order of hooks on full run:

1. environment
1. afterEnvironment
1. entryOption
1. afterPlugins
1. afterResolvers
1. entryOption
1. watchRun
1. normalModuleFactory
1. contextModuleFactory
1. beforeCompile
1. compile
1. thisCompilation
1. compilation
1. make
1. afterCompile
1. shouldEmit
1. emit
1. afterEmit
1. done


### Order of hooks on recompile


`invalid [ '/Users/fforres/BREX/ux-webpack-plugin/app/index.js', 1612211541086 ]` *(Also...this happened, not sure why)*

1. watchRun
1. normalModuleFactory
1. contextModuleFactory
1. beforeCompile
1. compile
1. thisCompilation
1. compilation
1. make
1. afterCompile
1. shouldEmit
1. emit
1. afterEmit
1. done

