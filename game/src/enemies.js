// Blight enemies: their bodies, their walk along the road, and the damage
// they take. Enemies carry a slow timer (from Frostbloom) and a freeze timer.
import { ENEMIES, waveHpScale } from './config.js';
import { pathLength, pointAt } from './path.js';

let nextId = 1;
export function createEnemy(kind, wave, random) {
  const def = ENEMIES[kind];
  const hp = Math.round(def.hp * waveHpScale(wave) * (kind === 'boss' ? 1 : 1));
  return {
    id: nextId += 1, kind, def, wave,
    hp, maxHp: hp, distance: -random() * 20,
    speed: def.speed * (0.92 + random() * 0.16),
    slowUntil: 0, slowFactor: 1, frozenUntil: 0,
    wobble: random() * Math.PI * 2, dead: false, reached: false,
  };
}
export function enemyPosition(enemy, now) {
  const pos = pointAt(Math.max(0, enemy.distance));
  const wob = Math.sin(now * 2 + enemy.wobble) * 3;
  return { x: pos.x, y: pos.y + wob, angle: pos.angle };
}
export function stepEnemy(enemy, dt, now) {
  if (enemy.frozenUntil > now) return;
  const slow = enemy.slowUntil > now ? enemy.slowFactor : 1;
  enemy.distance += enemy.speed * slow * dt;
  if (enemy.distance >= pathLength()) enemy.reached = true;
}
export function damageEnemy(enemy, amount, now) {
  enemy.hp -= amount;
  if (enemy.hp <= 0) enemy.dead = true;
  return enemy.dead;
}
export function slowEnemy(enemy, factor, seconds, now) {
  enemy.slowFactor = factor;
  enemy.slowUntil = now + seconds;
}
export function freezeEnemy(enemy, seconds, now) {
  enemy.frozenUntil = now + seconds;
}
