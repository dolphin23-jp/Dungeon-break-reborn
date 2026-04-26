export const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
export const rand = (min, max) => Math.random() * (max - min) + min;
export const randInt = (min, max) => Math.floor(rand(min, max + 1));
export const distSq = (a, b) => {
  const dx = a.x - b.x, dy = a.y - b.y;
  return dx * dx + dy * dy;
};
export const dist = (a, b) => Math.sqrt(distSq(a, b));
export const normalize = (x, y) => {
  const l = Math.hypot(x, y) || 1;
  return { x: x / l, y: y / l };
};
export const pick = arr => arr[Math.floor(Math.random() * arr.length)];
export const format = n => {
  if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return Math.floor(n).toString();
};
export function weightedPick(items) {
  const total = items.reduce((s, it) => s + it.weight, 0);
  let r = Math.random() * total;
  for (const it of items) { r -= it.weight; if (r <= 0) return it; }
  return items[items.length - 1];
}
