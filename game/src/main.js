// Boot and the one loop: input is read every frame, the world advances in
// fixed 1/60 s steps, and the renderer paints what is there. The game moves
// between title, play, paused, win and game-over screens.
// ?seed=N fixes the falling pattern. ?shot=title|play|win|over (with
// &seed=N) stages that scene instead of running the loop, paints it twice
// and sets window.__shotReady for a screenshot.
import { BEST_KEY, STEP, TOWERS } from './config.js';
import { createRandom } from './random.js';
import { createWorld, castDawnburst, placeTower, resetWorld, sellTower, startWave, stepWorld, takeEvents, upgradeTower, towerAtPlot } from './world.js';
import { ACTION_CONFIRM, ACTION_DAWN, ACTION_PAUSE, ACTION_RESTART, ACTION_SPEED, createInput } from './input.js';
import { createAudio } from './audio.js';
import { plotAt } from './path.js';
import { buttonAt, cardAt, createRenderer, hudButtons, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN } from './render.js';
import { stageShot } from './shots.js';

const MAX_FRAME = 0.25;
const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const state = createWorld(createRandom(seed));
const renderer = createRenderer(canvas);
const audio = createAudio();

function readBest() {
  try { return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0; } catch { return 0; }
}
function saveBest(value) {
  try { window.localStorage.setItem(BEST_KEY, String(value)); } catch { /* storage off: best lasts this visit only */ }
}

function runShot(name) {
  const scene = stageShot(name, state);
  let painted = 0;
  function paint() {
    renderer.draw(state, scene.screen, scene.best, null, null);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas);
  let screen = SCREEN_TITLE;
  let best = readBest();
  let accumulator = 0;
  let last = performance.now();
  let selectedKey = 'thorn';
  let selectedTower = null;
  let muted = false;

  function announce(message) { status.textContent = message; }
  function playEvents() {
    for (const ev of takeEvents(state)) {
      if (ev === 'shoot') audio.shoot();
      else if (ev === 'spore') audio.spore();
      else if (ev === 'frost') audio.frost();
      else if (ev === 'kill') audio.kill();
      else if (ev === 'coin') audio.coin();
      else if (ev === 'place') audio.place();
      else if (ev === 'hurt') audio.hurt();
      else if (ev === 'wave') audio.wave();
      else if (ev === 'dawn') audio.dawn();
      else if (ev === 'win') audio.win();
      else if (ev === 'lose') audio.lose();
    }
  }
  function startGame() {
    resetWorld(state);
    selectedTower = null;
    selectedKey = 'thorn';
    screen = SCREEN_PLAY;
    announce('Playing. Plant wardens, then start wave 1.');
  }
  function endGame(win) {
    screen = win ? SCREEN_WIN : SCREEN_OVER;
    if (state.score > best) { best = state.score; saveBest(best); }
    announce(win ? `Victory. Score ${state.score}.` : `Game over. Score ${state.score}.`);
  }
  function handleClick() {
    if (!input.takeClick()) return;
    const { x, y } = input.mouse;
    if (screen === SCREEN_TITLE) { startGame(); return; }
    if (screen === SCREEN_WIN || screen === SCREEN_OVER) { startGame(); return; }
    if (screen === SCREEN_PAUSED) { screen = SCREEN_PLAY; return; }
    // HUD buttons first.
    const hb = buttonAt(hudButtons(state), x, y);
    if (hb) {
      if (hb.id === 'wave') { if (startWave(state)) announce(`Wave ${state.wave} begins.`); }
      else if (hb.id === 'speed') { state.speed = state.speed === 2 ? 1 : 2; }
      else if (hb.id === 'dawn') { castDawnburst(state); }
      return;
    }
    // Shop cards.
    const card = cardAt(x, y);
    if (card) {
      const locked = card.def.unlockWave && state.wave + 1 < card.def.unlockWave;
      if (!locked) { selectedKey = card.key; selectedTower = null; }
      return;
    }
    // A planted tower: first click selects, second click on it sells,
    // U upgrades — here a click on a selected tower upgrades it.
    const plot = plotAt(x, y);
    if (plot) {
      const tower = towerAtPlot(state, plot);
      if (tower) {
        if (selectedTower === tower) { upgradeTower(state, tower); }
        else selectedTower = tower;
      } else if (selectedKey) {
        if (placeTower(state, selectedKey, plot)) announce(`${TOWERS[selectedKey].name} planted.`);
        else announce('Not enough seeds for that warden.');
      }
      return;
    }
    selectedTower = null;
  }
  function handleActions() {
    const actions = input.takeActions();
    const hotkey = input.takeHotkey();
    if (actions & 32) { muted = audio.toggleMute(); }
    if (hotkey) {
      const key = Object.keys(TOWERS).find((k) => TOWERS[k].hotkey === hotkey);
      if (key) { selectedKey = key; selectedTower = null; }
    }
    if (actions & ACTION_RESTART) { startGame(); return; }
    if (actions & ACTION_CONFIRM) {
      if (screen === SCREEN_TITLE || screen === SCREEN_WIN || screen === SCREEN_OVER) startGame();
      else if (screen === SCREEN_PAUSED) screen = SCREEN_PLAY;
      else if (screen === SCREEN_PLAY) startWave(state);
      return;
    }
    if (actions & ACTION_PAUSE) {
      if (screen === SCREEN_PLAY) { screen = SCREEN_PAUSED; announce('Paused.'); }
      else if (screen === SCREEN_PAUSED) screen = SCREEN_PLAY;
      return;
    }
    if (actions & ACTION_SPEED && screen === SCREEN_PLAY) state.speed = state.speed === 2 ? 1 : 2;
    if (actions & ACTION_DAWN && screen === SCREEN_PLAY) castDawnburst(state);
  }
  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    handleActions();
    handleClick();
    if (screen === SCREEN_PLAY) {
      while (accumulator >= STEP) {
        stepWorld(state, STEP);
        accumulator -= STEP;
        if (state.phase === 'win') { playEvents(); endGame(true); break; }
        if (state.phase === 'over') { playEvents(); endGame(false); break; }
      }
      playEvents();
    } else {
      accumulator = 0;
      // The title screen's marsh still drifts.
      if (screen === SCREEN_TITLE) state.now += STEP;
    }
    renderer.draw(state, screen, best, selectedKey, selectedTower);
  }
  announce('Rootwarden. Press Space or click to start.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
