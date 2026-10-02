import type { Tournament } from '../types';
import { isPlayed } from './standings';

export type StatsFilter = 'all' | 'singles' | 'pairs';

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
 * Career stats per player across every scored match (group and play-offs).
 * In pairs events each partner is credited with the pair's result and legs.
 */
export function computePlayerStats(tournaments: Tournament[], filter: StatsFilter = 'all'): PlayerStats[] {
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
    if (filter !== 'all' && t.type !== filter) continue;
    const playersOf = (entryId: string) => t.entries.find((e) => e.id === entryId)?.playerIds ?? [];
    for (const m of t.matches) {
      if (!isPlayed(m)) continue;
      const sides = [
        { players: playersOf(m.homeEntryId), legsFor: m.homeLegs!, legsAgainst: m.awayLegs! },
        { players: playersOf(m.awayEntryId), legsFor: m.awayLegs!, legsAgainst: m.homeLegs! },
      ];
      for (const side of sides) {
        for (const playerId of side.players) {
          const s = get(playerId);
          s.played++;
          if (side.legsFor > side.legsAgainst) s.won++;
          else if (side.legsFor < side.legsAgainst) s.lost++;
          s.legsWon += side.legsFor;
          s.legsLost += side.legsAgainst;
        }
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
