import { useState } from 'react';
import { Button, Layout, SectionLabel } from '../components/Layout';
import { Avatar } from '../components/Avatar';
import { useStore } from '../store';
import type { Player } from '../types';

export function AddPlayerForm({ onAdded }: { onAdded?: (p: Player) => void }) {
  const players = useStore((s) => s.players);
  const addPlayer = useStore((s) => s.addPlayer);
  const [name, setName] = useState('');
  const trimmed = name.trim();
  const duplicate = players.some((p) => p.name.toLowerCase() === trimmed.toLowerCase());

  return (
    <form
      className="flex gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (!trimmed || duplicate) return;
        const p = addPlayer(trimmed);
        setName('');
        onAdded?.(p);
      }}
    >
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="New player name"
        className="min-w-0 flex-1 rounded-xl bg-card px-4 py-3 text-[16px] outline-none ring-accent placeholder:text-muted focus:ring-2"
        aria-label="New player name"
      />
      <Button type="submit" disabled={!trimmed || duplicate}>
        Add
      </Button>
    </form>
  );
}

function PlayerRow({ player }: { player: Player }) {
  const { renamePlayer, setPlayerActive, deletePlayer } = useStore();
  const used = useStore((s) => s.tournaments.some((t) => t.entries.some((e) => e.playerIds.includes(player.id))));
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(player.name);

  return (
    <div className="flex items-center gap-3 px-4 py-2.5">
      <Avatar players={[player]} size={32} />
      {editing ? (
        <form
          className="flex min-w-0 flex-1 gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (name.trim()) renamePlayer(player.id, name);
            setEditing(false);
          }}
        >
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="min-w-0 flex-1 rounded-lg bg-card-2 px-3 py-1.5 outline-none focus:ring-2 focus:ring-accent"
          />
          <button type="submit" className="text-[14px] font-semibold text-accent">
            Save
          </button>
        </form>
      ) : (
        <>
          <span className={`min-w-0 flex-1 truncate text-[16px] ${player.active ? '' : 'text-muted line-through'}`}>
            {player.name}
          </span>
          <button onClick={() => setEditing(true)} className="text-[13px] font-semibold text-white/60 hover:text-white">
            Rename
          </button>
          {used ? (
            <button
              onClick={() => setPlayerActive(player.id, !player.active)}
              className="text-[13px] font-semibold text-white/60 hover:text-white"
            >
              {player.active ? 'Archive' : 'Restore'}
            </button>
          ) : (
            <button
              onClick={() => confirm(`Delete ${player.name}?`) && deletePlayer(player.id)}
              className="text-[13px] font-semibold text-danger/80 hover:text-danger"
            >
              Delete
            </button>
          )}
        </>
      )}
    </div>
  );
}

export function Players() {
  const players = useStore((s) => s.players);
  const sorted = [...players].sort((a, b) => a.name.localeCompare(b.name));
  const active = sorted.filter((p) => p.active);
  const archived = sorted.filter((p) => !p.active);

  return (
    <Layout title="Players" back>
      <div className="mt-2">
        <AddPlayerForm />
      </div>
      <SectionLabel right={<span>{active.length}</span>}>Squad</SectionLabel>
      {active.length === 0 ? (
        <p className="px-1 text-[14px] text-muted">No players yet — add your first above.</p>
      ) : (
        <div className="divide-y divide-line/60 rounded-2xl bg-card">
          {active.map((p) => (
            <PlayerRow key={p.id} player={p} />
          ))}
        </div>
      )}
      {archived.length > 0 && (
        <>
          <SectionLabel>Archived</SectionLabel>
          <p className="mb-2 px-1 text-[12px] text-muted">
            Archived players are hidden from selection but kept in past results.
          </p>
          <div className="divide-y divide-line/60 rounded-2xl bg-card">
            {archived.map((p) => (
              <PlayerRow key={p.id} player={p} />
            ))}
          </div>
        </>
      )}
    </Layout>
  );
}
