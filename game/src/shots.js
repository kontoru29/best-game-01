// Deterministic screenshot scenes: each one plays the real rules forward
// from a fresh world with a fixed seed and a simple autopilot gardener, so
// every frame is what a short game really looks like.
import { FIELD, MAX_WAVE, STEP } from './config.js';
import { PLOTS } from './path.js';
import { placeTower, resetWorld, startWave, stepWorld, upgradeTower } from './world.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN } from './render.js';

// Plots nearest the road's busiest bends, in planting order.
const PLANT_ORDER = [3, 7, 2, 11, 6, 12, 1, 13, 5, 16, 8, 17, 0, 15, 4, 14, 9, 10, 18];
const TOWER_ROTATION = ['thorn', 'spore', 'thorn', 'frost', 'sun', 'thorn', 'spore', 'ember', 'frost', 'sun', 'thorn', 'spore', 'ember', 'frost', 'thorn', 'sun', 'ember', 'spore', 'thorn'];

function autopilotPlant(state) {
  // Spend seeds on the best free plots, then upgrade what is planted.
  let planted = 0;
  for (let i = 0; i < PLANT_ORDER.length && planted < 3; i += 1) {
    const plot = PLOTS[PLANT_ORDER[i]];
    const key = TOWER_ROTATION[i % TOWER_ROTATION.length];
    if (placeTower(state, key, plot)) planted += 1;
  }
  for (const tower of [...state.towers]) {
    if (state.seeds > 90) upgradeTower(state, tower);
  }
}
function runSeconds(state, seconds) {
  const steps = Math.round(seconds / STEP);
  for (let i = 0; i < steps; i += 1) {
    stepWorld(state, STEP);
    if (state.phase === 'over' || state.phase === 'win') break;
  }
}
// Play waves until the wave counter reaches `targetWave` (or the game ends).
function playUntilWave(state, targetWave) {
  let guard = 0;
  while (state.wave < targetWave && state.phase !== 'over' && state.phase !== 'win' && guard < 40) {
    guard += 1;
    autopilotPlant(state);
    if (!startWave(state)) break;
    runSeconds(state, 90);
    // Between waves, plant and upgrade again.
    autopilotPlant(state);
  }
}

export function stageShot(name, state) {
  resetWorld(state);
  if (name === 'win') {
    playUntilWave(state, 10);
    if (state.phase !== 'win') {
      // The autopilot could not close wave 10: finish the last wave with the
      // garden at full strength so the win screen is a real end state.
      state.seeds += 600;
      autopilotPlant(state);
      for (const tower of [...state.towers]) { upgradeTower(state, tower); upgradeTower(state, tower); }
      if (state.phase === 'build') startWave(state);
      runSeconds(state, 120);
    }
    return { screen: state.phase === 'win' ? SCREEN_WIN : SCREEN_OVER, best: state.score };
  }
  if (name === 'over') {
    // Plant nothing and keep starting waves until the blight takes the Seed.
    let guard = 0;
    while (state.phase !== 'over' && state.wave < MAX_WAVE && guard < 12) {
      guard += 1;
      if (state.phase === 'build') startWave(state);
      runSeconds(state, 150);
    }
    return { screen: state.phase === 'over' ? SCREEN_OVER : SCREEN_PLAY, best: state.score };
  }
  if (name === 'play') {
    playUntilWave(state, 3);
    // If wave 3 already ended, start wave 4 and catch it mid-fight.
    if (state.phase === 'build' && state.wave < 10) {
      autopilotPlant(state);
      startWave(state);
      runSeconds(state, 14);
    } else {
      runSeconds(state, 6);
    }
    return { screen: SCREEN_PLAY, best: state.score };
  }
  // Title: let the marsh drift for a few seconds behind the title.
  runSeconds(state, 5);
  return { screen: SCREEN_TITLE, best: 0 };
}
export { FIELD };
