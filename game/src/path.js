// The blight's road and the soil plots where wardens can be planted.
// The road snakes across the field; the Last Seed's heart-tree stands at its end.
export const WAYPOINTS = [
  { x: -40, y: 170 },
  { x: 940, y: 170 },
  { x: 940, y: 360 },
  { x: 220, y: 360 },
  { x: 220, y: 560 },
  { x: 1080, y: 560 },
  { x: 1080, y: 400 },
  { x: 1180, y: 400 }, // the Seed Heart
];

export function pathLength() {
  let total = 0;
  for (let i = 1; i < WAYPOINTS.length; i += 1) {
    total += Math.hypot(WAYPOINTS[i].x - WAYPOINTS[i - 1].x, WAYPOINTS[i].y - WAYPOINTS[i - 1].y);
  }
  return total;
}

// Position (and heading) at a distance along the road.
export function pointAt(distance) {
  let remaining = distance;
  for (let i = 1; i < WAYPOINTS.length; i += 1) {
    const a = WAYPOINTS[i - 1];
    const b = WAYPOINTS[i];
    const seg = Math.hypot(b.x - a.x, b.y - a.y);
    if (remaining <= seg) {
      const t = seg === 0 ? 0 : remaining / seg;
      return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, angle: Math.atan2(b.y - a.y, b.x - a.x) };
    }
    remaining -= seg;
  }
  const last = WAYPOINTS[WAYPOINTS.length - 1];
  return { x: last.x, y: last.y, angle: 0 };
}

// Buildable soil plots, placed beside the road so every tower can reach it.
export const PLOTS = [
  { x: 180, y: 90 }, { x: 380, y: 90 }, { x: 580, y: 90 }, { x: 780, y: 90 },
  { x: 180, y: 260 }, { x: 380, y: 260 }, { x: 580, y: 260 }, { x: 780, y: 260 },
  { x: 1060, y: 260 }, { x: 1060, y: 90 },
  { x: 90, y: 450 }, { x: 380, y: 450 }, { x: 580, y: 450 }, { x: 780, y: 450 },
  { x: 90, y: 650 }, { x: 380, y: 650 }, { x: 580, y: 650 }, { x: 780, y: 650 },
  { x: 940, y: 650 }, { x: 1180, y: 640 },
];
export function plotAt(x, y) {
  for (const plot of PLOTS) {
    if (Math.hypot(plot.x - x, plot.y - y) < 34) return plot;
  }
  return null;
}
