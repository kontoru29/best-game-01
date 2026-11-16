// ROOTWARDEN — every tuning number, colour and definition in one place.
// The playfield is a fixed 1280x720 logical area; the renderer scales it to
// the window, so no rule below depends on the screen size.
export const FIELD = { width: 1280, height: 720 };
export const STEP = 1 / 60;
export const START_SEEDS = 170;
export const START_LIVES = 20;
export const MAX_WAVE = 10;
export const BEST_KEY = 'rootwarden.best';
export const GRID = 64;

export const PALETTE = {
  grassLight: '#3d7a44',
  grassDark: '#356b3c',
  grassTuft: '#4c8f52',
  path: '#8a6b46',
  pathEdge: '#6e5436',
  plot: '#5d4a2f',
  plotEdge: '#7d6540',
  panel: '#1e2b1f',
  panelEdge: '#3a5a3c',
  text: '#f2ead8',
  muted: '#b8c4a8',
  gold: '#f2c94c',
  ember: '#ff7a3c',
  heart: '#7be495',
  danger: '#e5534b',
  frost: '#7dd8ff',
  thorn: '#9be15d',
  spore: '#c78bfa',
  sun: '#ffd93c',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

// Five warden towers. cost is seeds; range in px; rate is shots per second.
export const TOWERS = {
  thorn: {
    key: 'thorn', name: 'Thornspike', hotkey: '1', cost: 40, range: 118, damage: 13,
    rate: 2.0, color: '#9be15d', dark: '#5da32e',
    blurb: 'Fast, cheap, reliable.',
  },
  spore: {
    key: 'spore', name: 'Sporeburst', hotkey: '2', cost: 70, range: 122, damage: 9,
    rate: 0.85, splash: 58, color: '#c78bfa', dark: '#8a4fd0',
    blurb: 'Splash damage in a crowd.',
  },
  frost: {
    key: 'frost', name: 'Frostbloom', hotkey: '3', cost: 60, range: 132, damage: 5,
    rate: 1.3, slow: 0.45, slowTime: 1.6, color: '#7dd8ff', dark: '#3a9bc2',
    blurb: 'Slows the blight by 45%.',
  },
  sun: {
    key: 'sun', name: 'Sunpetal', hotkey: '4', cost: 50, range: 104, damage: 9,
    rate: 1.0, bonusSeeds: 4, color: '#ffd93c', dark: '#d9a400',
    blurb: 'Kills ripen into +4 seeds.',
  },
  ember: {
    key: 'ember', name: 'Embermaw', hotkey: '5', cost: 120, range: 152, damage: 48,
    rate: 0.5, unlockWave: 4, color: '#ff7a3c', dark: '#c24e12',
    blurb: 'Slow, heavy bite. Wave 4+.',
  },
};
export const TOWER_ORDER = ['thorn', 'spore', 'frost', 'sun', 'ember'];
export const UPGRADE_COST_RATE = 0.6;
export const MAX_TOWER_LEVEL = 3;
export const SELL_RATE = 0.7;

// Six blight kinds. hp scales per wave; reward is seeds on kill.
export const ENEMIES = {
  mite: { key: 'mite', name: 'Blight Mite', hp: 30, speed: 72, reward: 6, lives: 1, radius: 11, color: '#d96a4f', dark: '#8f3a28' },
  beetle: { key: 'beetle', name: 'Husk Beetle', hp: 95, speed: 46, reward: 10, lives: 1, radius: 15, color: '#7a5fd0', dark: '#4a3290' },
  moth: { key: 'moth', name: 'Gloom Moth', hp: 46, speed: 112, reward: 9, lives: 1, radius: 10, color: '#e8e0f0', dark: '#8a7fa0' },
  spitter: { key: 'spitter', name: 'Spore Spitter', hp: 64, speed: 56, reward: 12, lives: 1, radius: 12, color: '#7bc96a', dark: '#3f7a32' },
  burrower: { key: 'burrower', name: 'Burrower', hp: 150, speed: 40, reward: 16, lives: 2, radius: 16, color: '#c98a3c', dark: '#7a4e12' },
  boss: { key: 'boss', name: 'Blightheart', hp: 2600, speed: 30, reward: 200, lives: 5, radius: 30, color: '#ff2e63', dark: '#8f1030' },
};

// Wave compositions: [kind, count, gapSeconds]. hpScale grows with the wave.
export const WAVES = [
  { list: [['mite', 8, 1.1]] },
  { list: [['mite', 10, 0.9], ['beetle', 3, 1.4]] },
  { list: [['mite', 10, 0.8], ['moth', 6, 1.0], ['beetle', 4, 1.2]] },
  { list: [['beetle', 8, 1.0], ['moth', 8, 0.8], ['spitter', 4, 1.3]] },
  { list: [['mite', 14, 0.6], ['beetle', 8, 0.9], ['spitter', 6, 1.1], ['moth', 6, 0.8]] },
  { list: [['burrower', 5, 1.6], ['beetle', 10, 0.8], ['moth', 10, 0.7]] },
  { list: [['spitter', 10, 0.9], ['burrower', 6, 1.4], ['moth', 12, 0.6], ['beetle', 8, 0.8]] },
  { list: [['burrower', 8, 1.3], ['beetle', 12, 0.7], ['spitter', 10, 0.8], ['moth', 10, 0.6]] },
  { list: [['moth', 16, 0.5], ['burrower', 9, 1.2], ['beetle', 12, 0.7], ['spitter', 10, 0.8]] },
  { list: [['boss', 1, 0], ['beetle', 10, 0.9], ['moth', 10, 0.7], ['burrower', 6, 1.3], ['spitter', 8, 0.9]] },
];
export function waveHpScale(wave) { return 1 + (wave - 1) * 0.18; }
export function waveClearBonus(wave) { return 40 + wave * 10; }

export const DAWNBURST = { costEmbers: 25, damage: 70, freeze: 2.0, cooldown: 20 };
export const EMBERS_PER_KILL = 1;
