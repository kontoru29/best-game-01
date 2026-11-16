// All drawing: the marsh, the road, the Seed Heart, wardens, blight,
// HUD, shop and every screen. Nothing here changes the simulation.
import { DAWNBURST, FIELD, MAX_WAVE, PALETTE, TOWER_ORDER, TOWERS, waveClearBonus } from './config.js';
import { PLOTS, WAYPOINTS } from './path.js';
import { enemyPosition } from './enemies.js';
import { sellValue, towerStats, upgradeCost } from './towers.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_WIN = 'win';
export const SCREEN_OVER = 'over';

const SHOP_Y = 636;
const SHOP_H = 84;
const CARD_W = 196;
const CARD_H = 68;

export function shopCards() {
  return TOWER_ORDER.map((key, i) => ({
    key, def: TOWERS[key],
    x: 24 + i * (CARD_W + 10), y: SHOP_Y + 8, w: CARD_W, h: CARD_H,
  }));
}
export function cardAt(x, y) {
  if (y < SHOP_Y || y > SHOP_Y + SHOP_H) return null;
  for (const card of shopCards()) {
    if (x >= card.x && x <= card.x + card.w && y >= card.y && y <= card.y + card.h) return card;
  }
  return null;
}
// Buttons drawn on the HUD / screens; hit-tested by main.js.
export function hudButtons(state) {
  const buttons = [];
  buttons.push({ id: 'wave', label: state.phase === 'build' ? `START WAVE ${state.wave + 1}` : `WAVE ${state.wave}…`, x: 1000, y: 10, w: 160, h: 34, enabled: state.phase === 'build' });
  buttons.push({ id: 'speed', label: state.speed === 2 ? 'SPEED ×2' : 'SPEED ×1', x: 860, y: 10, w: 130, h: 34, enabled: true });
  buttons.push({ id: 'dawn', label: `DAWNBURST ${state.dawnCooldown > 0 ? Math.ceil(state.dawnCooldown) + 's' : '◈ ' + DAWNBURST.costEmbers}`, x: 700, y: 10, w: 150, h: 34, enabled: state.embers >= DAWNBURST.costEmbers && state.dawnCooldown <= 0 && state.phase === 'wave' });
  return buttons;
}
export function buttonAt(buttons, x, y) {
  for (const b of buttons) {
    if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) return b;
  }
  return null;
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  const grassDots = [];
  for (let i = 0; i < 220; i += 1) {
    grassDots.push({ x: Math.random() * FIELD.width, y: 54 + Math.random() * 570, r: 1 + Math.random() * 2.5 });
  }
  const fireflies = [];
  for (let i = 0; i < 26; i += 1) {
    fireflies.push({ x: Math.random() * FIELD.width, y: 60 + Math.random() * 560, s: 0.5 + Math.random(), p: Math.random() * 6 });
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  function text(str, x, y, size, color, align, weight) {
    ctx.fillStyle = color || PALETTE.text;
    ctx.font = `${weight || 600} ${size}px system-ui, sans-serif`;
    ctx.textAlign = align || 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(str, x, y);
  }
  function drawBackground(now) {
    ctx.fillStyle = PALETTE.grassDark;
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    // Checker grass.
    for (let gy = 0; gy < 10; gy += 1) {
      for (let gx = 0; gx < 20; gx += 1) {
        if ((gx + gy) % 2 === 0) {
          ctx.fillStyle = PALETTE.grassLight;
          ctx.fillRect(gx * 64, 54 + gy * 58, 64, 58);
        }
      }
    }
    ctx.fillStyle = PALETTE.grassTuft;
    for (const d of grassDots) { ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2); ctx.fill(); }
    // The road.
    ctx.strokeStyle = PALETTE.pathEdge;
    ctx.lineWidth = 46;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(WAYPOINTS[0].x, WAYPOINTS[0].y);
    for (let i = 1; i < WAYPOINTS.length; i += 1) ctx.lineTo(WAYPOINTS[i].x, WAYPOINTS[i].y);
    ctx.stroke();
    ctx.strokeStyle = PALETTE.path;
    ctx.lineWidth = 36;
    ctx.stroke();
    // Fireflies drifting over the marsh.
    for (const f of fireflies) {
      const a = 0.25 + 0.35 * Math.abs(Math.sin(now * f.s + f.p));
      ctx.fillStyle = `rgba(255, 217, 60, ${a})`;
      ctx.beginPath();
      ctx.arc(f.x + Math.sin(now * 0.3 + f.p) * 12, f.y + Math.cos(now * 0.23 + f.p) * 8, 2.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  function drawHeart(state, now) {
    const x = 1180; const y = 400;
    const pulse = 1 + 0.06 * Math.sin(now * 2.4);
    const glow = ctx.createRadialGradient(x, y, 4, x, y, 90 * pulse);
    glow.addColorStop(0, 'rgba(123, 228, 149, 0.55)');
    glow.addColorStop(1, 'rgba(123, 228, 149, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(x - 95, y - 95, 190, 190);
    // Trunk and canopy of the Last Seed's tree.
    ctx.strokeStyle = '#4a3220';
    ctx.lineWidth = 12;
    ctx.beginPath(); ctx.moveTo(x, y + 34); ctx.lineTo(x, y - 6); ctx.stroke();
    ctx.fillStyle = '#2f7a3a';
    ctx.beginPath(); ctx.arc(x, y - 22, 34 * pulse, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#4c9a4a';
    ctx.beginPath(); ctx.arc(x - 14, y - 34, 20, 0, Math.PI * 2); ctx.arc(x + 16, y - 36, 18, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffd93c';
    ctx.beginPath(); ctx.arc(x, y - 22, 7, 0, Math.PI * 2); ctx.fill();
    text('THE LAST SEED', x, y + 56, 13, PALETTE.text, 'center', 700);
  }
  function drawPlots(state, selected) {
    for (const plot of PLOTS) {
      const tower = state.towers.find((t) => t.plot === plot);
      ctx.fillStyle = PALETTE.plot;
      ctx.beginPath(); ctx.arc(plot.x, plot.y, 26, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = PALETTE.plotEdge;
      ctx.lineWidth = 3;
      ctx.stroke();
      if (!tower) {
        ctx.fillStyle = 'rgba(242, 234, 216, 0.35)';
        ctx.beginPath(); ctx.arc(plot.x - 8, plot.y - 6, 3, 0, Math.PI * 2); ctx.arc(plot.x + 8, plot.y + 4, 3, 0, Math.PI * 2); ctx.fill();
      }
      if (selected && selected.plot === plot) {
        ctx.strokeStyle = '#ffd93c';
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(plot.x, plot.y, 32, 0, Math.PI * 2); ctx.stroke();
      }
    }
  }
  function drawTower(tower, now) {
    const { x, y } = tower.plot;
    const def = tower.def;
    const stats = towerStats(def, tower.level);
    if (tower.flash > 0) {
      ctx.fillStyle = 'rgba(255, 217, 60, 0.18)';
      ctx.beginPath(); ctx.arc(x, y, stats.range, 0, Math.PI * 2); ctx.fill();
    }
    // Base + body per kind.
    ctx.fillStyle = def.dark;
    ctx.beginPath(); ctx.arc(x, y, 20, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = def.color;
    if (tower.key === 'thorn') {
      for (let i = 0; i < 5; i += 1) {
        const a = -Math.PI / 2 + (i - 2) * 0.5;
        ctx.beginPath();
        ctx.moveTo(x + Math.cos(a) * 22, y + Math.sin(a) * 22);
        ctx.lineTo(x + Math.cos(a - 0.18) * 8, y + Math.sin(a - 0.18) * 8);
        ctx.lineTo(x + Math.cos(a + 0.18) * 8, y + Math.sin(a + 0.18) * 8);
        ctx.closePath(); ctx.fill();
      }
      ctx.beginPath(); ctx.arc(x, y, 9, 0, Math.PI * 2); ctx.fill();
    } else if (tower.key === 'spore') {
      ctx.beginPath(); ctx.arc(x, y - 6, 13, Math.PI, 0); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#f2ead8';
      ctx.beginPath(); ctx.arc(x - 5, y - 10, 2.5, 0, Math.PI * 2); ctx.arc(x + 5, y - 12, 2.5, 0, Math.PI * 2); ctx.fill();
    } else if (tower.key === 'frost') {
      for (let i = 0; i < 6; i += 1) {
        const a = (i / 6) * Math.PI * 2 + now * 0.2;
        ctx.beginPath();
        ctx.ellipse(x + Math.cos(a) * 11, y + Math.sin(a) * 11, 8, 4, a, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#eaf7ff';
      ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI * 2); ctx.fill();
    } else if (tower.key === 'sun') {
      for (let i = 0; i < 8; i += 1) {
        const a = (i / 8) * Math.PI * 2;
        ctx.beginPath();
        ctx.ellipse(x + Math.cos(a) * 13, y + Math.sin(a) * 13, 7, 4, a, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#8a5a00';
      ctx.beginPath(); ctx.arc(x, y, 8, 0, Math.PI * 2); ctx.fill();
    } else {
      // Embermaw: a heavy jaw that tracks its target.
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(tower.angle);
      ctx.fillStyle = def.color;
      ctx.beginPath(); ctx.moveTo(18, 0); ctx.lineTo(-12, -12); ctx.lineTo(-12, 12); ctx.closePath(); ctx.fill();
      ctx.restore();
      ctx.fillStyle = '#fff3d6';
      ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill();
    }
    // Level pips.
    for (let i = 0; i < tower.level; i += 1) {
      ctx.fillStyle = '#ffd93c';
      ctx.beginPath(); ctx.arc(x - 12 + i * 12, y + 26, 3.5, 0, Math.PI * 2); ctx.fill();
    }
  }
  function drawEnemy(enemy, now) {
    const pos = enemyPosition(enemy, now);
    const def = enemy.def;
    const frozen = enemy.frozenUntil > now;
    const slowed = enemy.slowUntil > now;
    ctx.fillStyle = frozen ? '#bfe9ff' : def.dark;
    ctx.beginPath(); ctx.arc(pos.x, pos.y, def.radius, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = frozen ? '#eaf7ff' : def.color;
    ctx.beginPath(); ctx.arc(pos.x, pos.y, def.radius * 0.72, 0, Math.PI * 2); ctx.fill();
    // Eyes face the direction of travel.
    const ex = Math.cos(pos.angle) * def.radius * 0.3;
    const ey = Math.sin(pos.angle) * def.radius * 0.3;
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath(); ctx.arc(pos.x + ex - 4, pos.y + ey - 3, 2.4, 0, Math.PI * 2); ctx.arc(pos.x + ex + 4, pos.y + ey - 3, 2.4, 0, Math.PI * 2); ctx.fill();
    if (enemy.kind === 'boss') {
      ctx.fillStyle = '#ffd93c';
      ctx.beginPath();
      ctx.moveTo(pos.x - 18, pos.y - 24); ctx.lineTo(pos.x - 9, pos.y - 38); ctx.lineTo(pos.x, pos.y - 26);
      ctx.lineTo(pos.x + 9, pos.y - 38); ctx.lineTo(pos.x + 18, pos.y - 24); ctx.closePath(); ctx.fill();
    }
    if (slowed) {
      ctx.strokeStyle = '#7dd8ff';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(pos.x, pos.y, def.radius + 4, 0, Math.PI * 2); ctx.stroke();
    }
    // Health bar.
    const w = Math.max(28, def.radius * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(pos.x - w / 2, pos.y - def.radius - 12, w, 5);
    ctx.fillStyle = enemy.hp / enemy.maxHp > 0.5 ? '#7be495' : enemy.hp / enemy.maxHp > 0.25 ? '#f2c94c' : '#e5534b';
    ctx.fillRect(pos.x - w / 2, pos.y - def.radius - 12, w * Math.max(0, enemy.hp / enemy.maxHp), 5);
  }
  function drawProjectiles(state) {
    for (const p of state.projectiles) {
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.beginPath(); ctx.arc(p.x - 1, p.y - 1, 2, 0, Math.PI * 2); ctx.fill();
    }
    for (const part of state.particles.list) {
      ctx.globalAlpha = Math.max(0, part.life / part.maxLife);
      ctx.fillStyle = part.color;
      ctx.beginPath(); ctx.arc(part.x, part.y, part.size, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
    for (const t of state.particles.texts) {
      ctx.globalAlpha = Math.max(0, t.life);
      text(t.text, t.x, t.y, 15, t.color, 'center', 800);
    }
    ctx.globalAlpha = 1;
  }
  function drawHud(state) {
    ctx.fillStyle = PALETTE.panel;
    ctx.fillRect(0, 0, FIELD.width, 54);
    ctx.fillStyle = PALETTE.panelEdge;
    ctx.fillRect(0, 54, FIELD.width, 3);
    text('🌱 ROOTWARDEN', 20, 28, 22, PALETTE.text, 'left', 800);
    text(`◈ Seeds ${state.seeds}`, 240, 28, 18, PALETTE.gold, 'left', 700);
    text(`✦ Embers ${state.embers}`, 380, 28, 18, PALETTE.ember, 'left', 700);
    text(`♥ ${state.lives}`, 510, 28, 18, state.lives <= 5 ? PALETTE.danger : PALETTE.heart, 'left', 700);
    text(`Wave ${Math.min(state.wave, MAX_WAVE)}/${MAX_WAVE}`, 580, 28, 17, PALETTE.text, 'left', 700);
    for (const b of hudButtons(state)) {
      ctx.fillStyle = b.enabled ? (b.id === 'wave' ? '#2f7a3a' : '#3a5a3c') : '#2a2f2a';
      roundRect(b.x, b.y, b.w, b.h, 8); ctx.fill();
      ctx.strokeStyle = b.enabled ? '#7be495' : '#555';
      ctx.lineWidth = 2; ctx.stroke();
      text(b.label, b.x + b.w / 2, b.y + b.h / 2 + 1, 14, b.enabled ? PALETTE.text : '#888', 'center', 700);
    }
  }
  function drawShop(state, selectedKey, selectedTower) {
    ctx.fillStyle = PALETTE.panel;
    ctx.fillRect(0, SHOP_Y, FIELD.width, SHOP_H);
    ctx.fillStyle = PALETTE.panelEdge;
    ctx.fillRect(0, SHOP_Y, FIELD.width, 3);
    for (const card of shopCards()) {
      const locked = card.def.unlockWave && state.wave + 1 < card.def.unlockWave;
      const afford = state.seeds >= card.def.cost;
      const isSel = selectedKey === card.key;
      ctx.fillStyle = isSel ? '#3a5a3c' : locked ? '#222' : '#2a3a2b';
      roundRect(card.x, card.y, card.w, card.h, 10); ctx.fill();
      ctx.strokeStyle = isSel ? '#ffd93c' : afford && !locked ? card.def.color : '#444';
      ctx.lineWidth = isSel ? 3 : 2; ctx.stroke();
      ctx.fillStyle = card.def.color;
      ctx.beginPath(); ctx.arc(card.x + 24, card.y + 22, 12, 0, Math.PI * 2); ctx.fill();
      text(card.def.name, card.x + 44, card.y + 16, 15, locked ? '#888' : PALETTE.text, 'left', 700);
      text(locked ? `Unlocks wave ${card.def.unlockWave}` : `◈ ${card.def.cost}  ·  [${card.def.hotkey}]`, card.x + 44, card.y + 38, 13, afford && !locked ? PALETTE.gold : PALETTE.muted, 'left', 600);
      text(card.def.blurb, card.x + 10, card.y + 56, 11, PALETTE.muted, 'left', 500);
    }
    // Selected tower panel on the right.
    if (selectedTower) {
      const stats = towerStats(selectedTower.def, selectedTower.level);
      const x = 1030; const y = SHOP_Y + 8;
      ctx.fillStyle = '#2a3a2b';
      roundRect(x, y, 226, CARD_H, 10); ctx.fill();
      ctx.strokeStyle = '#ffd93c'; ctx.lineWidth = 2; ctx.stroke();
      text(`${selectedTower.def.name}  Lv${selectedTower.level}`, x + 12, y + 16, 14, PALETTE.text, 'left', 700);
      text(`DMG ${stats.damage} · RNG ${stats.range} · Kills ${selectedTower.kills}`, x + 12, y + 36, 12, PALETTE.muted, 'left', 600);
      text(selectedTower.level < 3 ? `U: upgrade ◈ ${upgradeCost(selectedTower.def, selectedTower.level)}` : 'MAX LEVEL', x + 12, y + 54, 12, PALETTE.gold, 'left', 600);
      text('Sell: click tower again', x + 130, y + 54, 11, PALETTE.muted, 'left', 500);
    } else {
      text('Click a card, then a plot to plant.', 1030, SHOP_Y + 32, 12, PALETTE.muted, 'left', 600);
      text('Click a tower to upgrade or sell.', 1030, SHOP_Y + 54, 12, PALETTE.muted, 'left', 600);
    }
  }
  function overlay(title, lines, accent) {
    ctx.fillStyle = 'rgba(10, 18, 10, 0.72)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    text(title, FIELD.width / 2, 250, 54, accent || PALETTE.text, 'center', 800);
    lines.forEach((line, i) => text(line, FIELD.width / 2, 320 + i * 34, 20, PALETTE.text, 'center', 600));
  }

  function draw(state, screen, best, selectedKey, selectedTower) {
    const now = state.now;
    ctx.clearRect(0, 0, FIELD.width, FIELD.height);
    if (screen === SCREEN_TITLE) {
      drawBackground(now);
      drawHeart(state, now);
      for (const plot of PLOTS) {
        ctx.fillStyle = PALETTE.plot;
        ctx.beginPath(); ctx.arc(plot.x, plot.y, 20, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = 'rgba(10, 18, 10, 0.55)';
      ctx.fillRect(0, 0, FIELD.width, FIELD.height);
      text('🌱 ROOTWARDEN', FIELD.width / 2, 180, 72, PALETTE.text, 'center', 800);
      text('Defend the Last Seed through ten nights of blight', FIELD.width / 2, 240, 24, PALETTE.gold, 'center', 600);
      text('Plant wardens on the soil plots · Earn seeds from every kill · Hold the road', FIELD.width / 2, 300, 18, PALETTE.text, 'center', 600);
      text('1–5 pick a warden · Click a plot to plant · SPACE starts the next wave', FIELD.width / 2, 336, 18, PALETTE.muted, 'center', 600);
      text('Q Dawnburst · F fast-forward · P pause · R restart · M mute', FIELD.width / 2, 368, 18, PALETTE.muted, 'center', 600);
      if (best > 0) text(`Best score: ${best}`, FIELD.width / 2, 420, 20, PALETTE.gold, 'center', 700);
      const pulse = 0.6 + 0.4 * Math.sin(now * 3);
      ctx.globalAlpha = pulse;
      text('— CLICK OR PRESS SPACE TO START —', FIELD.width / 2, 480, 24, '#7be495', 'center', 800);
      ctx.globalAlpha = 1;
      text('10 waves · 5 wardens · 6 blight kinds · one Seed to save', FIELD.width / 2, 540, 16, PALETTE.muted, 'center', 600);
      return;
    }
    drawBackground(now);
    drawHeart(state, now);
    drawPlots(state, selectedTower);
    // Range ring for the selected tower.
    if (selectedTower) {
      const stats = towerStats(selectedTower.def, selectedTower.level);
      ctx.strokeStyle = 'rgba(255, 217, 60, 0.5)';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(selectedTower.plot.x, selectedTower.plot.y, stats.range, 0, Math.PI * 2); ctx.stroke();
    }
    for (const tower of state.towers) drawTower(tower, now);
    for (const enemy of state.enemies) drawEnemy(enemy, now);
    drawProjectiles(state);
    drawHud(state);
    drawShop(state, selectedKey, selectedTower);
    if (screen === SCREEN_PAUSED) {
      overlay('PAUSED', ['Press P or click to keep defending', 'R restarts the garden from wave 1'], PALETTE.text);
    } else if (screen === SCREEN_WIN) {
      const stars = state.lives >= 15 ? '★★★' : state.lives >= 8 ? '★★☆' : '★☆☆';
      overlay('🌿 THE SEED ENDURES', [
        `You held the road through all ${MAX_WAVE} waves — the garden lives.`,
        `${stars}   Score ${state.score}   ·   Kills ${state.kills}   ·   Lives left ${state.lives}`,
        `Seeds earned ${state.earned}   ·   Leaked ${state.leaked}`,
        'Press R or click to play again',
      ], '#7be495');
    } else if (screen === SCREEN_OVER) {
      overlay('🥀 THE BLIGHT TOOK THE SEED', [
        `The road was overrun on wave ${state.wave} of ${MAX_WAVE}.`,
        `Score ${state.score}   ·   Kills ${state.kills}   ·   Waves cleared ${state.wave - 1}`,
        `Next wave clears for ◈ ${waveClearBonus(state.wave)} — plant more, upgrade sooner.`,
        'Press R or click to try again',
      ], PALETTE.danger);
    } else if (state.phase === 'build' && state.wave === 0) {
      text('Plant your first wardens, then press SPACE or START WAVE', FIELD.width / 2, 600, 18, '#ffd93c', 'center', 700);
    }
  }
  return { draw, canvas };
}
