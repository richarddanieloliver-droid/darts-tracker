import { describe, expect, it } from 'vitest';
import type { Entry, Match } from '../types';
import { byeForRound, roundRobin } from './roundRobin';
import { computeStandings } from './standings';
import { validateScore, quickScores } from './validateScore';
import { createFinal, createSemis, groupComplete } from './playoffs';

const ids = (n: number) => Array.from({ length: n }, (_, i) => `e${i + 1}`);
const entries = (n: number): Entry[] => ids(n).map((id) => ({ id, playerIds: [id] }));

describe('roundRobin', () => {
  for (const n of [2, 3, 4, 5, 6, 7, 8, 11]) {
    it(`every pair meets exactly once with ${n} entries`, () => {
      const list = ids(n);
      const matches = roundRobin(list);
      expect(matches).toHaveLength((n * (n - 1)) / 2);
      const seen = new Set<string>();
      for (const m of matches) {
        const key = [m.homeEntryId, m.awayEntryId].sort().join('|');
        expect(seen.has(key)).toBe(false);
        seen.add(key);
        expect(m.homeEntryId).not.toBe(m.awayEntryId);
      }
      const rounds = n % 2 === 0 ? n - 1 : n;
      expect(Math.max(...matches.map((m) => m.round))).toBe(rounds);
      for (let r = 1; r <= rounds; r++) {
        const inRound = matches.filter((m) => m.round === r);
        const players = inRound.flatMap((m) => [m.homeEntryId, m.awayEntryId]);
        expect(new Set(players).size).toBe(players.length);
        if (n % 2 === 1) expect(byeForRound(list, matches, r)).toBeDefined();
      }
    });
  }

  it('gives each entry exactly one bye with an odd count', () => {
    const list = ids(5);
    const matches = roundRobin(list);
    const byes = [1, 2, 3, 4, 5].map((r) => byeForRound(list, matches, r));
    expect(new Set(byes).size).toBe(5);
  });
});

describe('validateScore', () => {
  it('accepts valid best-of-3 results', () => {
    for (const [h, a] of [[2, 0], [2, 1], [1, 2], [0, 2]]) expect(validateScore(h, a, 3)).toBeNull();
  });
  it('rejects invalid results', () => {
    for (const [h, a] of [[1, 1], [2, 2], [3, 0], [1, 0], [0, 0], [-1, 2]]) {
      expect(validateScore(h, a, 3)).not.toBeNull();
    }
  });
  it('lists quick scores', () => {
    expect(quickScores(3)).toEqual([[2, 0], [2, 1], [1, 2], [0, 2]]);
  });
});

const m = (h: string, a: string, hl: number, al: number, stage: Match['stage'] = 'group'): Match => ({
  id: `${h}${a}${stage}`,
  stage,
  round: 1,
  homeEntryId: h,
  awayEntryId: a,
  homeLegs: hl,
  awayLegs: al,
});

describe('computeStandings', () => {
  it('counts W/L/legs/points and sorts by points then leg difference', () => {
    const matches = [
      m('e1', 'e2', 2, 1), // e1 win
      m('e3', 'e1', 2, 0), // e3 win
      m('e2', 'e3', 2, 1), // e2 win
    ];
    const table = computeStandings(entries(3), matches);
    // all on 2 points; e3 LD +1 (3-2), e1 LD -1 (2-3), e2 LD 0 (3-3)
    expect(table.map((r) => r.entryId)).toEqual(['e3', 'e2', 'e1']);
    const e3 = table[0];
    expect(e3).toMatchObject({ played: 2, won: 1, lost: 1, legsFor: 3, legsAgainst: 2, legDiff: 1, points: 2 });
  });

  it('ignores unplayed and play-off matches', () => {
    const matches: Match[] = [
      { id: 'x', stage: 'group', round: 1, homeEntryId: 'e1', awayEntryId: 'e2' },
      m('e1', 'e2', 0, 2, 'final'),
    ];
    const table = computeStandings(entries(2), matches);
    expect(table.every((r) => r.played === 0 && r.points === 0)).toBe(true);
  });
});

describe('playoffs', () => {
  it('seeds 1v4 and 2v3 and builds the final from the semi winners', () => {
    const table = computeStandings(entries(5), [
      m('e1', 'e2', 2, 0), m('e1', 'e3', 2, 0), m('e1', 'e4', 2, 0), m('e1', 'e5', 2, 0),
      m('e2', 'e3', 2, 0), m('e2', 'e4', 2, 0), m('e2', 'e5', 2, 0),
      m('e3', 'e4', 2, 0), m('e3', 'e5', 2, 0),
      m('e4', 'e5', 2, 0),
    ]);
    const semis = createSemis(table);
    expect(semis.map((s) => [s.homeEntryId, s.awayEntryId])).toEqual([['e1', 'e4'], ['e2', 'e3']]);
    expect(createFinal(semis)).toBeUndefined();
    semis[0].homeLegs = 1; semis[0].awayLegs = 2; // e4 wins
    semis[1].homeLegs = 2; semis[1].awayLegs = 0; // e2 wins
    const final = createFinal(semis)!;
    expect([final.homeEntryId, final.awayEntryId]).toEqual(['e4', 'e2']);
  });

  it('knows when the group is complete', () => {
    expect(groupComplete([m('e1', 'e2', 2, 0)])).toBe(true);
    expect(groupComplete([{ id: 'x', stage: 'group', round: 1, homeEntryId: 'e1', awayEntryId: 'e2' }])).toBe(false);
  });
});
