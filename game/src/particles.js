// Particles and floating text: sparks, petals, damage pops and "+6" seed
// gains. Purely visual; the simulation never reads them.
export function createParticles() {
  return { list: [], texts: [] };
}
export function burst(particles, x, y, color, count, speed) {
  for (let i = 0; i < count; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const v = (speed || 90) * (0.4 + Math.random() * 0.8);
    particles.list.push({
      x, y, vx: Math.cos(angle) * v, vy: Math.sin(angle) * v - 30,
      life: 0.5 + Math.random() * 0.4, maxLife: 0.9, color, size: 2 + Math.random() * 3,
    });
  }
}
export function floatText(particles, x, y, text, color) {
  particles.texts.push({ x, y, text, color: color || '#f2c94c', life: 1.0 });
}
export function stepParticles(particles, dt) {
  for (const p of particles.list) {
    p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 160 * dt; p.life -= dt;
  }
  particles.list = particles.list.filter((p) => p.life > 0);
  for (const t of particles.texts) { t.y -= 34 * dt; t.life -= dt; }
  particles.texts = particles.texts.filter((t) => t.life > 0);
}
