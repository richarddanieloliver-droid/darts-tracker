import { useEffect, useState } from 'react';
import type { Entry, Match, Player } from '../types';
import { Avatar } from './Avatar';
import { Button } from './Layout';
import { entryName } from '../store';
import { legsToWin, quickScores, validateScore } from '../lib/validateScore';

interface Props {
  match: Match;
  label: string;
  entries: Entry[];
  players: Player[];
  bestOf: number;
  onSave: (home: number, away: number) => void;
  onClear: () => void;
  onClose: () => void;
}

function Stepper({ value, onChange, max }: { value: number; onChange: (n: number) => void; max: number }) {
  const btn =
    'h-11 w-11 rounded-full bg-card-2 text-2xl font-semibold leading-none hover:bg-line disabled:opacity-30';
  return (
    <div className="flex items-center gap-3">
      <button className={btn} onClick={() => onChange(Math.max(0, value - 1))} disabled={value <= 0} aria-label="Minus">
        −
      </button>
      <span className="num w-10 text-center text-[56px] leading-none font-bold">{value}</span>
      <button className={btn} onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max} aria-label="Plus">
        +
      </button>
    </div>
  );
}

export function ScoreSheet({ match, label, entries, players, bestOf, onSave, onClear, onClose }: Props) {
  const [home, setHome] = useState(match.homeLegs ?? 0);
  const [away, setAway] = useState(match.awayLegs ?? 0);
  const homeEntry = entries.find((e) => e.id === match.homeEntryId);
  const awayEntry = entries.find((e) => e.id === match.awayEntryId);
  const error = validateScore(home, away, bestOf);
  const max = legsToWin(bestOf);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const sidePlayers = (e: Entry | undefined) => (e?.playerIds ?? []).map((id) => players.find((p) => p.id === id));

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 sm:items-center" onClick={onClose}>
      <div
        role="dialog"
        aria-label="Enter score"
        className="w-full max-w-xl rounded-t-3xl bg-[#111] px-4 pt-3 pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/20 sm:hidden" />
        <div className="text-center text-[13px] font-semibold text-muted">
          {label} · Best of {bestOf}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4">
          {[
            { entry: homeEntry, value: home, set: setHome },
            { entry: awayEntry, value: away, set: setAway },
          ].map(({ entry, value, set }, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <Avatar players={sidePlayers(entry)} size={44} />
              <span className="line-clamp-2 min-h-[2.5em] text-center text-[15px] leading-tight font-semibold">
                {entryName(entry, players)}
              </span>
              <Stepper value={value} onChange={set} max={max} />
            </div>
          ))}
        </div>

        <div className="mt-5 grid grid-cols-4 gap-2">
          {quickScores(bestOf).map(([h, a]) => {
            const selected = h === home && a === away;
            return (
              <button
                key={`${h}-${a}`}
                onClick={() => {
                  setHome(h);
                  setAway(a);
                }}
                className={`num rounded-xl py-2.5 text-[22px] font-bold transition ${
                  selected ? 'bg-accent text-black' : 'bg-card-2 text-white hover:bg-line'
                }`}
              >
                {h}–{a}
              </button>
            );
          })}
        </div>

        <div className="mt-3 min-h-5 text-center text-[13px] text-muted">
          {error && (home > 0 || away > 0) ? error : ''}
        </div>

        <div className="mt-2 flex gap-2">
          {match.homeLegs !== undefined && (
            <Button variant="danger" onClick={onClear}>
              Clear
            </Button>
          )}
          <Button variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button onClick={() => onSave(home, away)} disabled={!!error} className="flex-1">
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}
