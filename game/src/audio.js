// Tiny procedural sound: every effect is a short WebAudio oscillator burst,
// so the game ships no audio files and works offline.
export function createAudio() {
  let ctx = null;
  let muted = false;
  function ensure() {
    if (ctx) return ctx;
    try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { ctx = null; }
    return ctx;
  }
  function blip(freq, dur, type, vol, slideTo) {
    if (muted) return;
    const c = ensure();
    if (!c || c.state === 'suspended') { if (c) c.resume(); return; }
    const t = c.currentTime;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type || 'square';
    osc.frequency.setValueAtTime(freq, t);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    gain.gain.setValueAtTime(vol || 0.05, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain); gain.connect(c.destination);
    osc.start(t); osc.stop(t + dur + 0.02);
  }
  return {
    toggleMute() { muted = !muted; return muted; },
    get muted() { return muted; },
    shoot() { blip(660, 0.07, 'square', 0.03, 440); },
    spore() { blip(300, 0.12, 'sine', 0.05, 140); },
    frost() { blip(880, 0.15, 'sine', 0.04, 1200); },
    kill() { blip(220, 0.1, 'triangle', 0.06, 90); },
    coin() { blip(990, 0.09, 'sine', 0.05, 1320); },
    place() { blip(180, 0.12, 'triangle', 0.07, 320); },
    hurt() { blip(140, 0.25, 'sawtooth', 0.08, 70); },
    wave() { blip(392, 0.18, 'triangle', 0.06, 523); },
    dawn() { blip(523, 0.4, 'sine', 0.08, 1046); },
    win() { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => blip(f, 0.25, 'triangle', 0.06), i * 120)); },
    lose() { [392, 330, 262, 196].forEach((f, i) => setTimeout(() => blip(f, 0.3, 'sawtooth', 0.05), i * 150)); },
  };
}
