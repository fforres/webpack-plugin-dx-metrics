import debugFactory from 'debug';
import { Timer } from './timer';
import { TrackingMetricKeys } from './types';
import { DEBUG_STRING } from './constants';

const debug = debugFactory(`${DEBUG_STRING}:timers`);

const timersMap = new Map<string, Timer>();

const createAndAssignTimer = (id: string) => {
  if (timersMap.has(id)) {
    debug("There's already a timer for id %s", id);
  }
  const timer = new Timer(id);
  timer.start();
  timersMap.set(id, timer);
};

export const timerExists = (id: string) => timersMap.has(id);

export const createTimer = (trackingMetric: TrackingMetricKeys) => {
  createAndAssignTimer(trackingMetric);
  return trackingMetric;
};

export const getTimerMilliseconds = (trackingMetric: TrackingMetricKeys) => {
  const timer = timersMap.get(trackingMetric);
  if (!timer) {
    debug('ERROR: Could not find timer for key %s', trackingMetric);
    return null;
  }
  const time = timer.milliseconds();
  timersMap.delete(trackingMetric);
  return time;
};
