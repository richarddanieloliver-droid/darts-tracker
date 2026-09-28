/** Stable hue per player so each player keeps "their" colour, like a team badge. */
export function hueFor(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  // golden-angle step so near-identical seeds still land far apart
  return Math.round((h % 1000) * 137.508) % 360;
}

export function badgeColor(seed: string): string {
  return `hsl(${hueFor(seed)} 55% 42%)`;
}

export function tintColor(seed: string, alpha = 0.35): string {
  return `hsl(${hueFor(seed)} 60% 30% / ${alpha})`;
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
