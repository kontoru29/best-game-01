// Warden towers: what they cost, how far they reach, how hard they hit,
// and how they grow when upgraded. A tower lives on a soil plot.
import { MAX_TOWER_LEVEL, TOWERS, UPGRADE_COST_RATE } from './config.js';

export function towerStats(def, level) {
  const mult = 1 + (level - 1) * 0.5;
  return {
    damage: Math.round(def.damage * mult),
    range: Math.round(def.range * (1 + (level - 1) * 0.1)),
    rate: def.rate * (1 + (level - 1) * 0.12),
    splash: def.splash ? Math.round(def.splash * (1 + (level - 1) * 0.12)) : 0,
  };
}
export function upgradeCost(def, level) {
  return Math.round(def.cost * UPGRADE_COST_RATE * level);
}
export function createTower(defKey, plot) {
  const def = TOWERS[defKey];
  return {
    key: defKey, def, plot, level: 1, cooldown: 0, angle: -Math.PI / 2,
    flash: 0, kills: 0, totalSpent: def.cost,
  };
}
export function canUpgrade(tower) { return tower.level < MAX_TOWER_LEVEL; }
export function sellValue(tower) {
  return Math.floor(tower.totalSpent * 0.7);
}
