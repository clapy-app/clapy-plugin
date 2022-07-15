import { flags } from '../../common/app-config';

export interface PerfContext {
  initial: number;
  prev: number;
}

let context: PerfContext = makeNewContext();

export function perfReset(logMessage?: string) {
  if (flags.measurePerf && logMessage) {
    console.log(logMessage);
  }
  context = makeNewContext();
}

export function perfMeasure(label = 'Exec time:', threshold?: number) {
  if (flags.measurePerf) {
    const now = new Date().getTime();
    const measured = Math.round(now - context.prev) / 1000;
    if (threshold == null || measured > threshold) {
      console.log(label, measured, 's');
    }
    context.prev = now;
    return measured;
  }
}

export function perfTotal(label = 'Done in') {
  const now = new Date().getTime();
  console.log(label, Math.round(now - context.initial) / 1000, 's');
  context.prev = now;
}

function makeNewContext(): PerfContext {
  const initial = new Date().getTime();
  return {
    initial,
    prev: initial,
  };
}
