import type { Entry, Match, StandingRow } from '../types';

export const POINTS_PER_WIN = 2;

export function isPlayed(m: Match): boolean {
  return m.homeLegs !== undefined && m.awayLegs !== undefined;
}

export function winnerOf(m: Match): string | undefined {
  if (!isPlayed(m) || m.homeLegs === m.awayLegs) return undefined;
  return m.homeLegs! > m.awayLegs! ? m.homeEntryId : m.awayEntryId;
}

/**
 * Group-stage table. Ranked on Points, then Leg Difference, then Legs For,
 * then name (alphabetical) so the order is always stable.
 */
export function computeStandings(
  entries: Entry[],
  matches: Match[],
  nameOf: (entryId: string) => string = (id) => id,
): StandingRow[] {
  const rows = new Map<string, StandingRow>();
  for (const e of entries) {
    rows.set(e.id, {
      entryId: e.id,
      played: 0,
      won: 0,
      lost: 0,
      legsFor: 0,
      legsAgainst: 0,
      legDiff: 0,
      points: 0,
    });
  }

  for (const m of matches) {
    if (m.stage !== 'group' || !isPlayed(m)) continue;
    const home = rows.get(m.homeEntryId);
    const away = rows.get(m.awayEntryId);
    if (!home || !away) continue;
    const h = m.homeLegs!;
    const a = m.awayLegs!;
    home.played++;
    away.played++;
    home.legsFor += h;
    home.legsAgainst += a;
    away.legsFor += a;
    away.legsAgainst += h;
    if (h > a) {
      home.won++;
      away.lost++;
      home.points += POINTS_PER_WIN;
    } else if (a > h) {
      away.won++;
      home.lost++;
      away.points += POINTS_PER_WIN;
    }
  }

  const list = [...rows.values()];
  for (const r of list) r.legDiff = r.legsFor - r.legsAgainst;

  return list.sort(
    (x, y) =>
      y.points - x.points ||
      y.legDiff - x.legDiff ||
      y.legsFor - x.legsFor ||
      nameOf(x.entryId).localeCompare(nameOf(y.entryId)),
  );
}
