import type { Match, StandingRow } from '../types';
import { newId } from './id';
import { isPlayed, winnerOf } from './standings';

export const PLAYOFF_PLACES = 4;

export function groupComplete(matches: Match[]): boolean {
  const group = matches.filter((m) => m.stage === 'group');
  return group.length > 0 && group.every(isPlayed);
}

/** Semi 1: 1st v 4th. Semi 2: 2nd v 3rd. Higher seed listed first. */
export function createSemis(standings: StandingRow[]): Match[] {
  if (standings.length < PLAYOFF_PLACES) return [];
  const [s1, s2, s3, s4] = standings.map((r) => r.entryId);
  return [
    { id: newId(), stage: 'semi', round: 1, homeEntryId: s1, awayEntryId: s4 },
    { id: newId(), stage: 'semi', round: 2, homeEntryId: s2, awayEntryId: s3 },
  ];
}

export function createFinal(matches: Match[]): Match | undefined {
  const semis = matches.filter((m) => m.stage === 'semi').sort((a, b) => a.round - b.round);
  if (semis.length !== 2 || !semis.every(isPlayed)) return undefined;
  return {
    id: newId(),
    stage: 'final',
    round: 1,
    homeEntryId: winnerOf(semis[0])!,
    awayEntryId: winnerOf(semis[1])!,
  };
}
