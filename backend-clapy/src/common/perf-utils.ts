import { performance } from 'perf_hooks';
import { flags } from '../env-and-config/app-config';

export interface PerfContext {
  initial: number;
  prev: number;
}

let context: PerfContext = makeNewContext();

export function perfReset(logMessage?: string) {
  if (logMessage) {
    console.log(logMessage);
  }
  context = makeNewContext();
}

export function perfMeasure(label = 'Exec time:') {
  if (flags.measurePerf) {
    const now = performance.now();
    console.log(label, Math.round(now - context.prev) / 1000, 's');
    context.prev = now;
  }
}

export function perfTotal(label = 'Done in') {
  const now = performance.now();
  console.log(label, Math.round(now - context.initial) / 1000, 's');
  context.prev = now;
}

function makeNewContext(): PerfContext {
  const initial = performance.now();
  return {
    initial,
    prev: initial,
  };
}
