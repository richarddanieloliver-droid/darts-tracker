import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Entry, Match, Player, Tournament } from './types';
import { newId } from './lib/id';
import { roundRobin } from './lib/roundRobin';
import { computeStandings } from './lib/standings';
import { createFinal, createSemis, groupComplete, PLAYOFF_PLACES } from './lib/playoffs';

export interface NewTournamentInput {
  name: string;
  date: string;
  type: 'singles' | 'pairs';
  bestOf: number;
  entries: Entry[];
  matches: Match[];
}

export interface BackupData {
  app: 'ebdo-darts';
  version: 1;
  exportedAt: string;
  players: Player[];
  tournaments: Tournament[];
}

interface State {
  players: Player[];
  tournaments: Tournament[];

  addPlayer: (name: string) => Player;
  renamePlayer: (id: string, name: string) => void;
  setPlayerActive: (id: string, active: boolean) => void;
  deletePlayer: (id: string) => void;

  createTournament: (input: NewTournamentInput) => string;
  deleteTournament: (id: string) => void;
  recordScore: (tournamentId: string, matchId: string, homeLegs?: number, awayLegs?: number) => void;
  startPlayoffs: (tournamentId: string) => void;
  cancelPlayoffs: (tournamentId: string) => void;

  exportData: () => BackupData;
  importData: (data: BackupData) => void;
  resetAll: () => void;
}

export function entryName(entry: Entry | undefined, players: Player[]): string {
  if (!entry) return '?';
  return entry.playerIds.map((id) => players.find((p) => p.id === id)?.name ?? '?').join(' & ');
}

export function makeEntries(groups: string[][]): Entry[] {
  return groups.map((playerIds) => ({ id: newId(), playerIds }));
}

export function drawFixtures(entries: Entry[]): Match[] {
  return roundRobin(entries.map((e) => e.id));
}

function updateTournament(
  tournaments: Tournament[],
  id: string,
  fn: (t: Tournament) => Tournament,
): Tournament[] {
  return tournaments.map((t) => (t.id === id ? fn(t) : t));
}

/** Re-derive play-off matches/status after any score change. */
function progress(t: Tournament): Tournament {
  if (t.entries.length < PLAYOFF_PLACES) {
    // too few entries for play-offs: the table decides it
    return { ...t, status: groupComplete(t.matches) ? 'complete' : 'group' };
  }
  if (t.status === 'group') return t;
  let matches = t.matches;
  const semis = matches.filter((m) => m.stage === 'semi');
  const final = matches.find((m) => m.stage === 'final');
  const newFinal = createFinal(matches);

  if (!newFinal) {
    // semis not both decided: no final yet
    if (final) matches = matches.filter((m) => m.stage !== 'final');
  } else if (!final) {
    matches = [...matches, newFinal];
  } else if (final.homeEntryId !== newFinal.homeEntryId || final.awayEntryId !== newFinal.awayEntryId) {
    // a semi result was edited and changed the finalists
    matches = matches.map((m) => (m.stage === 'final' ? { ...newFinal, id: m.id } : m));
  }

  const currentFinal = matches.find((m) => m.stage === 'final');
  const done =
    semis.length === 2 && currentFinal?.homeLegs !== undefined && currentFinal?.awayLegs !== undefined;
  return { ...t, matches, status: done ? 'complete' : 'playoffs' };
}

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      players: [],
      tournaments: [],

      addPlayer: (name) => {
        const player: Player = { id: newId(), name: name.trim(), active: true };
        set((s) => ({ players: [...s.players, player] }));
        return player;
      },
      renamePlayer: (id, name) =>
        set((s) => ({ players: s.players.map((p) => (p.id === id ? { ...p, name: name.trim() } : p)) })),
      setPlayerActive: (id, active) =>
        set((s) => ({ players: s.players.map((p) => (p.id === id ? { ...p, active } : p)) })),
      deletePlayer: (id) => set((s) => ({ players: s.players.filter((p) => p.id !== id) })),

      createTournament: (input) => {
        const t: Tournament = {
          id: newId(),
          ...input,
          status: 'group',
          createdAt: Date.now(),
        };
        set((s) => ({ tournaments: [t, ...s.tournaments] }));
        return t.id;
      },
      deleteTournament: (id) => set((s) => ({ tournaments: s.tournaments.filter((t) => t.id !== id) })),

      recordScore: (tournamentId, matchId, homeLegs, awayLegs) =>
        set((s) => ({
          tournaments: updateTournament(s.tournaments, tournamentId, (t) =>
            progress({
              ...t,
              matches: t.matches.map((m) => (m.id === matchId ? { ...m, homeLegs, awayLegs } : m)),
            }),
          ),
        })),

      startPlayoffs: (tournamentId) =>
        set((s) => ({
          tournaments: updateTournament(s.tournaments, tournamentId, (t) => {
            if (!groupComplete(t.matches)) return t;
            const table = computeStandings(t.entries, t.matches, (id) =>
              entryName(t.entries.find((e) => e.id === id), s.players),
            );
            const semis = createSemis(table);
            if (semis.length === 0) return t;
            return progress({
              ...t,
              matches: [...t.matches.filter((m) => m.stage === 'group'), ...semis],
              status: 'playoffs',
            });
          }),
        })),

      cancelPlayoffs: (tournamentId) =>
        set((s) => ({
          tournaments: updateTournament(s.tournaments, tournamentId, (t) => ({
            ...t,
            matches: t.matches.filter((m) => m.stage === 'group'),
            status: 'group',
          })),
        })),

      exportData: () => ({
        app: 'ebdo-darts',
        version: 1,
        exportedAt: new Date().toISOString(),
        players: get().players,
        tournaments: get().tournaments,
      }),
      importData: (data) => set({ players: data.players, tournaments: data.tournaments }),
      resetAll: () => set({ players: [], tournaments: [] }),
    }),
    { name: 'ebdo-darts', version: 1 },
  ),
);
