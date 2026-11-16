// Wave scheduling: a wave is a list of spawn groups; the scheduler drips
// enemies onto the road on a timer and reports when the wave is spent.
import { WAVES } from './config.js';
import { createEnemy } from './enemies.js';

export function createWaveScheduler(wave, random) {
  const groups = WAVES[wave - 1].list.map(([kind, count, gap]) => ({ kind, left: count, gap, timer: 0.4 }));
  return { wave, groups, done: false };
}
export function stepWaveScheduler(scheduler, dt, random, onSpawn) {
  if (scheduler.done) return;
  let anyLeft = false;
  for (const group of scheduler.groups) {
    if (group.left <= 0) continue;
    anyLeft = true;
    group.timer -= dt;
    if (group.timer <= 0) {
      onSpawn(createEnemy(group.kind, scheduler.wave, random));
      group.left -= 1;
      group.timer = group.gap;
    }
  }
  if (!anyLeft) scheduler.done = true;
}
export function waveTotalCount(wave) {
  return WAVES[wave - 1].list.reduce((sum, [, count]) => sum + count, 0);
}
