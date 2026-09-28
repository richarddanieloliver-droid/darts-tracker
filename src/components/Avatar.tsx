import type { Player } from '../types';
import { badgeColor, initials } from '../lib/colors';

interface Props {
  players: (Player | undefined)[];
  size?: number;
}

function Circle({ player, size }: { player: Player | undefined; size: number }) {
  const name = player?.name ?? '?';
  return (
    <span
      className="inline-flex items-center justify-center rounded-full font-semibold text-white ring-2 ring-black/60 select-none"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.38,
        background: badgeColor(player?.id ?? name),
      }}
    >
      {initials(name)}
    </span>
  );
}

/** One badge for a singles player, two overlapping badges for a pair. */
export function Avatar({ players, size = 36 }: Props) {
  if (players.length <= 1) return <Circle player={players[0]} size={size} />;
  const small = Math.round(size * 0.8);
  return (
    <span className="relative inline-block" style={{ width: small * 1.75, height: size }}>
      <span className="absolute left-0 top-0">
        <Circle player={players[0]} size={small} />
      </span>
      <span className="absolute right-0 bottom-0">
        <Circle player={players[1]} size={small} />
      </span>
    </span>
  );
}
