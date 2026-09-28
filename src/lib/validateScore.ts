export function legsToWin(bestOf: number): number {
  return Math.floor(bestOf / 2) + 1;
}

/** Returns an error message, or null when the score is a valid completed match. */
export function validateScore(home: number, away: number, bestOf: number): string | null {
  const target = legsToWin(bestOf);
  if (!Number.isInteger(home) || !Number.isInteger(away) || home < 0 || away < 0) {
    return 'Legs must be whole numbers';
  }
  if (home === away) return 'A match cannot be drawn';
  const winner = Math.max(home, away);
  const loser = Math.min(home, away);
  if (winner !== target) return `The winner must win ${target} legs (best of ${bestOf})`;
  if (loser >= target) return `The loser can win at most ${target - 1} legs`;
  return null;
}

/** All valid results as [home, away] pairs, e.g. best of 3 → 2-0, 2-1, 1-2, 0-2. */
export function quickScores(bestOf: number): [number, number][] {
  const target = legsToWin(bestOf);
  const home: [number, number][] = [];
  for (let l = 0; l < target; l++) home.push([target, l]);
  const away: [number, number][] = home.map(([w, l]) => [l, w] as [number, number]).reverse();
  return [...home, ...away];
}
