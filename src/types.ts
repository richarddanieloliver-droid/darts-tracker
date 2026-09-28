export interface Player {
  id: string;
  name: string;
  active: boolean;
}

/** A singles player or a pair. */
export interface Entry {
  id: string;
  playerIds: string[];
}

export type Stage = 'group' | 'semi' | 'final';

export interface Match {
  id: string;
  stage: Stage;
  /** Round number for group matches; 1 or 2 for the semis; 1 for the final. */
  round: number;
  homeEntryId: string;
  awayEntryId: string;
  homeLegs?: number;
  awayLegs?: number;
}

export type TournamentStatus = 'group' | 'playoffs' | 'complete';

export interface Tournament {
  id: string;
  name: string;
  date: string;
  type: 'singles' | 'pairs';
  bestOf: number;
  entries: Entry[];
  matches: Match[];
  status: TournamentStatus;
  createdAt: number;
}

export interface StandingRow {
  entryId: string;
  played: number;
  won: number;
  lost: number;
  legsFor: number;
  legsAgainst: number;
  legDiff: number;
  points: number;
}
