import debugFactory from 'debug';
import { v4 } from 'uuid';
import { Timer } from './timer';
import { DEBUG_STRING } from './constants';
import { TrackingMetrics } from './types';

const debug = debugFactory(`${DEBUG_STRING}:timers`);

const timersMap = new Map<string, Timer>();

const multiplerTimersIdCache = {
  [TrackingMetrics.recompile]: new Set<string>(),
  [TrackingMetrics.compile]: new Set<string>(),
};

const singleTimersIdCache = {
  [TrackingMetrics.recompile_session]: null as string | null,
  [TrackingMetrics.compile_session]: null as string | null,
};

const createAndAssignTimer = (id: string) => {
  if (timersMap.has(id)) {
    debug('There\'s already a timer for id %s', id);
  }
  const timer = new Timer(id);
  timer.start();
  timersMap.set(id, timer);
};

export const createTimer = (trackingMetric: 'recompile' | 'compile') => {
  const key = v4();
  createAndAssignTimer(`${trackingMetric} - ${key}`);
  multiplerTimersIdCache[trackingMetric].add(key);
  return key;
};

export const createSingleTimer = (trackingMetric: 'recompile_session' | 'compile_session') => {
  const key = v4();
  createAndAssignTimer(trackingMetric);
  singleTimersIdCache[trackingMetric] = key;
  return key;
};

export const getTimerMilliseconds = (key: string) => {
  const timer = timersMap.get(key);
  if (!timer) {
    return null;
  }
  return timer.milliseconds();
};

export const getSingleTimerMilliseconds = (key: 'recompile_session' | 'compile_session') => getTimerMilliseconds(key);
