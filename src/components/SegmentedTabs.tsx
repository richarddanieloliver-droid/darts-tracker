interface Props<T extends string> {
  tabs: { id: T; label: string }[];
  value: T;
  onChange: (id: T) => void;
}

/** Text tabs in the style of Apple Sports' Yesterday / Today / Upcoming. */
export function SegmentedTabs<T extends string>({ tabs, value, onChange }: Props<T>) {
  return (
    <div role="tablist" className="flex justify-around px-2">
      {tabs.map((t) => {
        const active = t.id === value;
        return (
          <button
            key={t.id}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(t.id)}
            className={`px-3 py-2 text-[15px] font-semibold transition-colors ${
              active ? 'text-white' : 'text-white/45 hover:text-white/70'
            }`}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
