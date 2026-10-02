import type { Tournament } from '../types';
import { isPlayed } from './standings';

export interface PlayerStats {
  playerId: string;
  played: number;
  won: number;
  lost: number;
  legsWon: number;
  legsLost: number;
  /** Legs won as a % of legs played, rounded to 1 dp; null when no legs played. */
  legWinPct: number | null;
}

export function legWinPct(legsWon: number, legsLost: number): number | null {
  const total = legsWon + legsLost;
  if (total === 0) return null;
  return Math.round((legsWon / total) * 1000) / 10;
}

/**
 * Individual career stats per player across every scored singles match
 * (group and play-offs). Pairs events are ignored.
 */
export function computePlayerStats(tournaments: Tournament[]): PlayerStats[] {
  const stats = new Map<string, PlayerStats>();
  const get = (playerId: string) => {
    let s = stats.get(playerId);
    if (!s) {
      s = { playerId, played: 0, won: 0, lost: 0, legsWon: 0, legsLost: 0, legWinPct: null };
      stats.set(playerId, s);
    }
    return s;
  };

  for (const t of tournaments) {
    if (t.type !== 'singles') continue;
    const playerOf = (entryId: string) => t.entries.find((e) => e.id === entryId)?.playerIds[0];
    for (const m of t.matches) {
      if (!isPlayed(m)) continue;
      const sides = [
        { playerId: playerOf(m.homeEntryId), legsFor: m.homeLegs!, legsAgainst: m.awayLegs! },
        { playerId: playerOf(m.awayEntryId), legsFor: m.awayLegs!, legsAgainst: m.homeLegs! },
      ];
      for (const { playerId, legsFor, legsAgainst } of sides) {
        if (!playerId) continue;
        const s = get(playerId);
        s.played++;
        if (legsFor > legsAgainst) s.won++;
        else if (legsFor < legsAgainst) s.lost++;
        s.legsWon += legsFor;
        s.legsLost += legsAgainst;
      }
    }
  }

  const list = [...stats.values()];
  for (const s of list) s.legWinPct = legWinPct(s.legsWon, s.legsLost);
  return list;
}

export function formatPct(pct: number | null): string {
  return pct === null ? '–' : `${pct.toFixed(1)}%`;
}
