// The simulation: seeds, lives, waves, towers firing, enemies walking the
// road, the Dawnburst ability, and the win/lose rules. No drawing here.
import {
  DAWNBURST, EMBERS_PER_KILL, MAX_WAVE, START_LIVES, START_SEEDS,
  TOWERS, waveClearBonus,
} from './config.js';
import { createTower, sellValue, towerStats, upgradeCost } from './towers.js';
import { damageEnemy, enemyPosition, freezeEnemy, slowEnemy, stepEnemy } from './enemies.js';
import { createWaveScheduler, stepWaveScheduler } from './waves.js';
import { burst, createParticles, floatText, stepParticles } from './particles.js';

export const PHASE_BUILD = 'build';
export const PHASE_WAVE = 'wave';
export const PHASE_WIN = 'win';
export const PHASE_OVER = 'over';

export function createWorld(random) {
  const state = {
    random, seeds: START_SEEDS, embers: 0, lives: START_LIVES,
    wave: 0, score: 0, kills: 0, earned: 0, leaked: 0,
    towers: [], enemies: [], projectiles: [],
    phase: PHASE_BUILD, scheduler: null, now: 0,
    dawnCooldown: 0, speed: 1, particles: createParticles(),
    events: [], waveKills: 0,
  };
  return state;
}

export function resetWorld(state) {
  const fresh = createWorld(state.random);
  Object.keys(state).forEach((k) => delete state[k]);
  Object.assign(state, fresh);
}

export function placeTower(state, defKey, plot) {
  const def = TOWERS[defKey];
  if (!def || state.phase === PHASE_WIN || state.phase === PHASE_OVER) return false;
  if (state.seeds < def.cost) return false;
  if (def.unlockWave && state.wave + 1 < def.unlockWave) return false;
  if (state.towers.some((t) => t.plot === plot)) return false;
  state.seeds -= def.cost;
  state.towers.push(createTower(defKey, plot));
  state.events.push('place');
  return true;
}
export function towerAtPlot(state, plot) {
  return state.towers.find((t) => t.plot === plot) || null;
}
export function upgradeTower(state, tower) {
  const cost = upgradeCost(tower.def, tower.level);
  if (tower.level >= 3 || state.seeds < cost) return false;
  state.seeds -= cost;
  tower.level += 1;
  tower.totalSpent += cost;
  state.events.push('place');
  return true;
}
export function sellTower(state, tower) {
  state.seeds += sellValue(tower);
  state.towers = state.towers.filter((t) => t !== tower);
  state.events.push('coin');
  return true;
}
export function startWave(state) {
  if (state.phase !== PHASE_BUILD || state.wave >= MAX_WAVE) return false;
  state.wave += 1;
  state.phase = PHASE_WAVE;
  state.scheduler = createWaveScheduler(state.wave, state.random);
  state.waveKills = 0;
  state.events.push('wave');
  return true;
}
export function castDawnburst(state) {
  if (state.embers < DAWNBURST.costEmbers || state.dawnCooldown > 0) return false;
  if (state.phase !== PHASE_WAVE) return false;
  state.embers -= DAWNBURST.costEmbers;
  state.dawnCooldown = DAWNBURST.cooldown;
  for (const enemy of state.enemies) {
    freezeEnemy(enemy, DAWNBURST.freeze, state.now);
    damageEnemy(enemy, DAWNBURST.damage, state.now);
  }
  burst(state.particles, 640, 360, '#ffd93c', 60, 220);
  state.events.push('dawn');
  return true;
}

function killEnemy(state, enemy, tower) {
  enemy.dead = true;
  state.kills += 1;
  state.waveKills += 1;
  let reward = enemy.def.reward;
  if (tower && tower.key === 'sun') reward += tower.def.bonusSeeds || 0;
  state.seeds += reward;
  state.earned += reward;
  state.embers += EMBERS_PER_KILL;
  state.score += 10 + enemy.def.reward;
  const pos = enemyPosition(enemy, state.now);
  burst(state.particles, pos.x, pos.y, enemy.def.color, 10, 110);
  floatText(state.particles, pos.x, pos.y - 14, `+${reward}`, '#f2c94c');
  state.events.push('kill');
  if (reward >= 12) state.events.push('coin');
}

function fireTower(state, tower) {
  const stats = towerStats(tower.def, tower.level);
  // Target the enemy furthest along the road within range.
  let target = null;
  let bestDist = -1;
  for (const enemy of state.enemies) {
    if (enemy.dead || enemy.reached) continue;
    const pos = enemyPosition(enemy, state.now);
    const d = Math.hypot(pos.x - tower.plot.x, pos.y - tower.plot.y);
    if (d <= stats.range && enemy.distance > bestDist) { target = enemy; bestDist = enemy.distance; }
  }
  if (!target) return;
  tower.cooldown = 1 / stats.rate;
  tower.flash = 0.12;
  const pos = enemyPosition(target, state.now);
  tower.angle = Math.atan2(pos.y - tower.plot.y, pos.x - tower.plot.x);
  state.projectiles.push({
    x: tower.plot.x, y: tower.plot.y - 10, target, stats, tower,
    speed: 520, color: tower.def.color, slow: tower.def.slow, slowTime: tower.def.slowTime,
  });
  state.events.push(tower.key === 'spore' ? 'spore' : tower.key === 'frost' ? 'frost' : 'shoot');
}

function stepProjectiles(state, dt) {
  for (const proj of state.projectiles) {
    if (!proj.target || proj.target.dead || proj.target.reached) { proj.spent = true; continue; }
    const pos = enemyPosition(proj.target, state.now);
    const dx = pos.x - proj.x;
    const dy = pos.y - proj.y;
    const dist = Math.hypot(dx, dy);
    const step = proj.speed * dt;
    if (dist <= step + 6) {
      proj.spent = true;
      if (proj.stats.splash) {
        burst(state.particles, pos.x, pos.y, proj.color, 12, 130);
        for (const enemy of state.enemies) {
          if (enemy.dead || enemy.reached) continue;
          const ep = enemyPosition(enemy, state.now);
          if (Math.hypot(ep.x - pos.x, ep.y - pos.y) <= proj.stats.splash) {
            if (damageEnemy(enemy, proj.stats.damage, state.now)) killEnemy(state, enemy, proj.tower);
          }
        }
      } else {
        if (proj.slow) slowEnemy(proj.target, 1 - proj.slow, proj.slowTime || 1.5, state.now);
        if (damageEnemy(proj.target, proj.stats.damage, state.now)) killEnemy(state, proj.target, proj.tower);
        else burst(state.particles, pos.x, pos.y, proj.color, 4, 70);
      }
    } else {
      proj.x += (dx / dist) * step;
      proj.y += (dy / dist) * step;
    }
  }
  state.projectiles = state.projectiles.filter((p) => !p.spent);
}

export function stepWorld(state, dt) {
  const scaled = dt * state.speed;
  state.now += scaled;
  if (state.dawnCooldown > 0) state.dawnCooldown -= scaled;
  stepParticles(state.particles, scaled);

  if (state.phase === PHASE_WAVE && state.scheduler) {
    stepWaveScheduler(state.scheduler, scaled, state.random, (enemy) => state.enemies.push(enemy));
  }
  for (const enemy of state.enemies) {
    if (!enemy.dead && !enemy.reached) stepEnemy(enemy, scaled, state.now);
  }
  // Leaks: an enemy that reaches the Seed Heart costs lives.
  for (const enemy of state.enemies) {
    if (enemy.reached && !enemy.dead) {
      enemy.dead = true;
      state.lives -= enemy.def.lives;
      state.leaked += 1;
      state.events.push('hurt');
      burst(state.particles, 1180, 400, '#e5534b', 16, 140);
      if (state.lives <= 0) {
        state.lives = 0;
        state.phase = PHASE_OVER;
        state.events.push('lose');
      }
    }
  }
  state.enemies = state.enemies.filter((e) => !e.dead);

  for (const tower of state.towers) {
    if (tower.cooldown > 0) tower.cooldown -= scaled;
    if (tower.flash > 0) tower.flash -= scaled;
    if (state.phase === PHASE_WAVE && tower.cooldown <= 0) fireTower(state, tower);
  }
  stepProjectiles(state, scaled);

  if (state.phase === PHASE_WAVE && state.scheduler && state.scheduler.done && state.enemies.length === 0) {
    const bonus = waveClearBonus(state.wave);
    state.seeds += bonus;
    state.score += 100 * state.wave;
    state.events.push('coin');
    if (state.wave >= MAX_WAVE) {
      state.phase = PHASE_WIN;
      state.score += state.lives * 50;
      state.events.push('win');
    } else {
      state.phase = PHASE_BUILD;
    }
  }
}
export function takeEvents(state) {
  const ev = state.events;
  state.events = [];
  return ev;
}
