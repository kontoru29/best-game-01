// Seeded random numbers (mulberry32). The same seed always gives the same
// falling pattern, so screenshots are reproducible and the game is fair.
export function createRandom(seed) {
  let a = seed >>> 0;
  return function random() {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function pickRandom(random, list) { return list[Math.floor(random() * list.length)]; }
