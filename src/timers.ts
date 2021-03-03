import debugFactory from 'debug';
import { v4 } from 'uuid';
import { Timer } from './timer';
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

export const createTimer = (trackingMetric: 'recompile' | 'compile') => {
  const key = v4();
  const id = `${trackingMetric}:${key}`;
  createAndAssignTimer(id);
  return id;
};

export const createSingleTimer = (
  trackingMetric: 'recompile_session' | 'compile_session',
) => {
  createAndAssignTimer(trackingMetric);
  return trackingMetric;
};

export const getTimerMilliseconds = (key: string) => {
  const timer = timersMap.get(key);
  if (!timer) {
    debug('ERROR: Could not find timer for key %s', key);
    return null;
  }
  const time = timer.milliseconds();
  timersMap.delete(key);
  return time;
};

export const getSingleTimerMilliseconds = (
  key: 'recompile_session' | 'compile_session',
) => getTimerMilliseconds(key);
