import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Layout, SectionLabel } from '../components/Layout';
import { Avatar } from '../components/Avatar';
import { MatchCard } from '../components/MatchCard';
import { AddPlayerForm } from './Players';
import { drawFixtures, entryName, makeEntries, useStore } from '../store';
import type { Entry, Match } from '../types';
import { todayIso } from '../lib/format';
import { byeForRound } from '../lib/roundRobin';
import { PLAYOFF_PLACES } from '../lib/playoffs';

type Step = 'setup' | 'draw';

export function NewTournament() {
  const navigate = useNavigate();
  const players = useStore((s) => s.players);
  const tournaments = useStore((s) => s.tournaments);
  const createTournament = useStore((s) => s.createTournament);

  const [step, setStep] = useState<Step>('setup');
  const [name, setName] = useState(`EBDO Tournament ${tournaments.length + 1}`);
  const [date, setDate] = useState(todayIso());
  const [type, setType] = useState<'singles' | 'pairs'>('singles');
  const [bestOf, setBestOf] = useState(3);
  const [selected, setSelected] = useState<string[]>([]);
  const [pairs, setPairs] = useState<[string, string][]>([]);
  const [pairPick, setPairPick] = useState<string | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);

  const active = useMemo(
    () => players.filter((p) => p.active).sort((a, b) => a.name.localeCompare(b.name)),
    [players],
  );
  const pName = (id: string) => players.find((p) => p.id === id)?.name ?? '?';

  const paired = new Set(pairs.flat());
  const unpaired = selected.filter((id) => !paired.has(id));

  const toggle = (id: string) => {
    if (selected.includes(id)) {
      setSelected(selected.filter((x) => x !== id));
      setPairs(pairs.filter((p) => !p.includes(id)));
      if (pairPick === id) setPairPick(null);
    } else {
      setSelected([...selected, id]);
    }
  };

  const pickForPair = (id: string) => {
    if (!pairPick) return setPairPick(id);
    if (pairPick === id) return setPairPick(null);
    setPairs([...pairs, [pairPick, id]]);
    setPairPick(null);
  };

  const entryGroups: string[][] = type === 'singles' ? selected.map((id) => [id]) : pairs;
  const entryCount = entryGroups.length;
  const nameOk = name.trim().length > 0;
  const pairsOk = type === 'singles' || unpaired.length === 0;
  const canDraw = nameOk && entryCount >= 2 && pairsOk;

  const makeDraw = () => {
    const es = makeEntries(entryGroups);
    setEntries(es);
    setMatches(drawFixtures(es));
    setStep('draw');
    window.scrollTo(0, 0);
  };

  const redraw = () => setMatches(drawFixtures(entries));

  const confirm = () => {
    const id = createTournament({ name: name.trim(), date, type, bestOf, entries, matches });
    navigate(`/t/${id}`, { replace: true });
  };

  if (step === 'draw') {
    const rounds = Math.max(0, ...matches.map((m) => m.round));
    const entryIds = entries.map((e) => e.id);
    return (
      <Layout title="The draw" back>
        <div className="mt-1 rounded-2xl bg-card px-4 py-3 text-[14px] text-white/80">
          <div className="text-[17px] font-semibold text-white">{name}</div>
          {entries.length} {type === 'pairs' ? 'pairs' : 'players'} · {matches.length} matches · {rounds} rounds · best
          of {bestOf}
          {entries.length < PLAYOFF_PLACES && (
            <div className="mt-1 text-[13px] text-amber-400">
              Fewer than 4 entries — there will be no play-offs; the table decides the winner.
            </div>
          )}
        </div>

        {Array.from({ length: rounds }, (_, i) => i + 1).map((r) => {
          const bye = byeForRound(entryIds, matches, r);
          return (
            <div key={r}>
              <SectionLabel
                right={
                  bye && (
                    <span className="normal-case tracking-normal">
                      Bye: {entryName(entries.find((e) => e.id === bye), players)}
                    </span>
                  )
                }
              >
                Round {r}
              </SectionLabel>
              <div className="space-y-2">
                {matches
                  .filter((m) => m.round === r)
                  .map((m) => (
                    <MatchCard key={m.id} match={m} entries={entries} players={players} label={`Round ${r}`} />
                  ))}
              </div>
            </div>
          );
        })}

        <div className="sticky bottom-0 -mx-3 mt-6 flex gap-2 bg-gradient-to-t from-black via-black to-transparent px-3 pt-6 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
          <Button variant="secondary" onClick={() => setStep('setup')}>
            Back
          </Button>
          <Button variant="secondary" onClick={redraw} className="flex-1">
            ↻ Redraw
          </Button>
          <Button onClick={confirm} className="flex-1">
            Start ▸
          </Button>
        </div>
      </Layout>
    );
  }

  const field = 'w-full rounded-xl bg-card px-4 py-3 text-[16px] outline-none focus:ring-2 focus:ring-accent';
  const seg = (on: boolean) =>
    `flex-1 rounded-lg py-2 text-[14px] font-semibold transition ${on ? 'bg-white text-black' : 'text-white/70'}`;

  return (
    <Layout title="New tournament" back>
      <SectionLabel>Details</SectionLabel>
      <div className="space-y-2">
        <input className={field} value={name} onChange={(e) => setName(e.target.value)} aria-label="Tournament name" placeholder="Tournament name" />
        <input className={field} type="date" value={date} onChange={(e) => setDate(e.target.value)} aria-label="Date" />
        <div className="flex gap-2">
          <div className="flex flex-1 rounded-xl bg-card p-1">
            <button className={seg(type === 'singles')} onClick={() => setType('singles')}>
              Singles
            </button>
            <button className={seg(type === 'pairs')} onClick={() => setType('pairs')}>
              Pairs
            </button>
          </div>
          <label className="flex items-center gap-2 rounded-xl bg-card px-3 text-[14px] text-white/70">
            Best of
            <select
              value={bestOf}
              onChange={(e) => setBestOf(Number(e.target.value))}
              className="num bg-transparent text-[20px] font-bold text-white outline-none"
            >
              {[1, 3, 5, 7, 9].map((n) => (
                <option key={n} value={n} className="bg-card">
                  {n}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <SectionLabel
        right={
          active.length > 0 && (
            <button
              className="normal-case tracking-normal text-accent"
              onClick={() => {
                if (selected.length === active.length) {
                  setSelected([]);
                  setPairs([]);
                } else setSelected(active.map((p) => p.id));
              }}
            >
              {selected.length === active.length ? 'Clear all' : 'Select all'}
            </button>
          )
        }
      >
        Who's playing? ({selected.length})
      </SectionLabel>
      <div className="flex flex-wrap gap-2">
        {active.map((p) => {
          const on = selected.includes(p.id);
          return (
            <button
              key={p.id}
              onClick={() => toggle(p.id)}
              className={`flex items-center gap-2 rounded-full py-1 pr-3.5 pl-1 text-[15px] font-medium transition ${
                on ? 'bg-accent/20 text-white ring-2 ring-accent' : 'bg-card text-white/70'
              }`}
            >
              <Avatar players={[p]} size={28} />
              {p.name}
              {on && <span className="text-accent">✓</span>}
            </button>
          );
        })}
      </div>
      <div className="mt-3">
        <AddPlayerForm onAdded={(p) => setSelected((s) => [...s, p.id])} />
      </div>

      {type === 'pairs' && (
        <>
          <SectionLabel>Make pairs</SectionLabel>
          {selected.length < 2 ? (
            <p className="px-1 text-[14px] text-muted">Select players above, then tap two players to pair them.</p>
          ) : (
            <>
              {unpaired.length > 0 && (
                <>
                  <p className="mb-2 px-1 text-[13px] text-muted">
                    {pairPick ? `Now tap ${pName(pairPick)}'s partner` : 'Tap two players to pair them'}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {unpaired.map((id) => (
                      <button
                        key={id}
                        onClick={() => pickForPair(id)}
                        className={`rounded-full px-3.5 py-1.5 text-[15px] font-medium transition ${
                          pairPick === id ? 'bg-white text-black' : 'bg-card-2 text-white'
                        }`}
                      >
                        {pName(id)}
                      </button>
                    ))}
                  </div>
                </>
              )}
              {pairs.length > 0 && (
                <div className="mt-3 divide-y divide-line/60 rounded-2xl bg-card">
                  {pairs.map((pair, i) => (
                    <div key={pair.join()} className="flex items-center gap-3 px-4 py-2.5">
                      <Avatar players={pair.map((id) => players.find((p) => p.id === id))} size={30} />
                      <span className="flex-1 text-[15px] font-medium">
                        {pName(pair[0])} & {pName(pair[1])}
                      </span>
                      <button
                        onClick={() => setPairs(pairs.filter((_, j) => j !== i))}
                        className="text-[13px] font-semibold text-white/60 hover:text-white"
                      >
                        Split
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {unpaired.length === 1 && (
                <p className="mt-2 px-1 text-[13px] text-amber-400">
                  Odd number of players — {pName(unpaired[0])} needs a partner.
                </p>
              )}
            </>
          )}
        </>
      )}

      <div className="sticky bottom-0 -mx-3 mt-6 bg-gradient-to-t from-black via-black to-transparent px-3 pt-6 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        <Button onClick={makeDraw} disabled={!canDraw} className="w-full py-3.5 text-[16px]">
          🎯 Make the draw{entryCount >= 2 ? ` (${entryCount} ${type === 'pairs' ? 'pairs' : 'players'})` : ''}
        </Button>
      </div>
    </Layout>
  );
}
