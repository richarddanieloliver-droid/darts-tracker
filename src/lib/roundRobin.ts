import type { Match } from '../types';
import { newId } from './id';

export function shuffle<T>(items: T[], random: () => number = Math.random): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Single round robin using the circle method. With an odd number of entries,
 * one entry sits out (has a bye) each round. Home/away alternates so nobody
 * is always listed first.
 */
export function roundRobin(entryIds: string[], random: () => number = Math.random): Match[] {
  if (entryIds.length < 2) return [];
  const ids: (string | null)[] = shuffle(entryIds, random);
  if (ids.length % 2 === 1) ids.push(null); // bye
  const n = ids.length;
  const rounds = n - 1;
  const matches: Match[] = [];

  for (let r = 0; r < rounds; r++) {
    for (let i = 0; i < n / 2; i++) {
      const a = ids[i];
      const b = ids[n - 1 - i];
      if (a === null || b === null) continue;
      const swap = (i === 0 && r % 2 === 1) || (i > 0 && (r + i) % 2 === 1);
      matches.push({
        id: newId(),
        stage: 'group',
        round: r + 1,
        homeEntryId: swap ? b : a,
        awayEntryId: swap ? a : b,
      });
    }
    // rotate all but the first
    ids.splice(1, 0, ids.pop()!);
  }
  return matches;
}

/** Entry sitting out in a given round (odd entry counts only). */
export function byeForRound(entryIds: string[], matches: Match[], round: number): string | undefined {
  const playing = new Set<string>();
  for (const m of matches) {
    if (m.stage === 'group' && m.round === round) {
      playing.add(m.homeEntryId);
      playing.add(m.awayEntryId);
    }
  }
  return entryIds.find((id) => !playing.has(id));
}
