/* eslint-disable no-unused-vars */
declare class TimerNode {
  _endTime: [number, number];

  start: (string: string) => TimerNode

  stop: () => void

  isRunning: () => boolean

  milliseconds: () => number
}

declare module 'timer-node' {
  export = TimerNode
}
