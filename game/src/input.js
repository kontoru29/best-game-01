// Keyboard and mouse input, reduced to actions the game reads once a frame.
// Mouse position is reported in logical field coordinates (the renderer scales).
export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_RESTART = 4;
export const ACTION_SPEED = 8;
export const ACTION_DAWN = 16;

export function createInput(canvas) {
  const keys = new Set();
  const mouse = { x: 0, y: 0, clicked: false, down: false };
  let actions = 0;
  let hotkey = null;

  function toLogical(event) {
    const rect = canvas.getBoundingClientRect();
    const scale = Math.min(rect.width / 1280, rect.height / 720);
    const ox = (rect.width - 1280 * scale) / 2;
    const oy = (rect.height - 720 * scale) / 2;
    mouse.x = (event.clientX - rect.left - ox) / scale;
    mouse.y = (event.clientY - rect.top - oy) / scale;
  }
  canvas.addEventListener('mousemove', toLogical);
  canvas.addEventListener('mousedown', (event) => { toLogical(event); mouse.down = true; mouse.clicked = true; });
  canvas.addEventListener('mouseup', () => { mouse.down = false; });
  window.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    keys.add(event.key.toLowerCase());
    if (event.key === ' ' || event.key === 'Enter') { actions |= ACTION_CONFIRM; event.preventDefault(); }
    if (event.key.toLowerCase() === 'p' || event.key === 'Escape') actions |= ACTION_PAUSE;
    if (event.key.toLowerCase() === 'r') actions |= ACTION_RESTART;
    if (event.key.toLowerCase() === 'f') actions |= ACTION_SPEED;
    if (event.key.toLowerCase() === 'q') actions |= ACTION_DAWN;
    if (['1', '2', '3', '4', '5'].includes(event.key)) hotkey = event.key;
    if (event.key.toLowerCase() === 'm') actions |= 32; // mute toggle, read by main
  });
  window.addEventListener('keyup', (event) => keys.delete(event.key.toLowerCase()));

  return {
    mouse,
    takeActions() { const a = actions; actions = 0; return a; },
    takeHotkey() { const h = hotkey; hotkey = null; return h; },
    takeClick() { const c = mouse.clicked; mouse.clicked = false; return c; },
    direction() { return 0; }, // tower defence: no movement keys
  };
}
