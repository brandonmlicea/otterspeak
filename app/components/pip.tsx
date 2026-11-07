export type Mood = "hi" | "cheer" | "sad";

export function Pip({ mood = "hi", size = 120, className = "" }: { mood?: Mood; size?: number; className?: string }) {
  const lift = mood === "cheer" ? -8 : 0;
  return (
    <svg viewBox="0 0 120 120" width={size} height={size} className={`pip ${className}`} data-mood={mood} role="img" aria-label="Pip the otter">
      <ellipse cx="60" cy="113" rx="32" ry="5" fill="var(--os-shade)" />
      <path d="M86 100c22 4 30-8 26-22-3 9-12 14-26 12z" fill="#7d5034" />
      <ellipse cx="60" cy="86" rx="34" ry="27" fill="#8a5a3b" />
      <ellipse cx="60" cy="92" rx="22" ry="17" fill="#ecd3b2" />
      <ellipse cx="44" cy="111" rx="10" ry="4.5" fill="#6e4529" />
      <ellipse cx="76" cy="111" rx="10" ry="4.5" fill="#6e4529" />
      <circle cx="30" cy="27" r="8.5" fill="#8a5a3b" />
      <circle cx="90" cy="27" r="8.5" fill="#8a5a3b" />
      <circle cx="30" cy="27" r="4" fill="#5e3a22" />
      <circle cx="90" cy="27" r="4" fill="#5e3a22" />
      <ellipse cx="60" cy="50" rx="36" ry="31" fill="#9a6544" />
      <ellipse cx="60" cy="60" rx="25" ry="18" fill="#f3dcc0" />
      <circle cx="37" cy="61" r="4.5" fill="#f2a48a" opacity=".7" />
      <circle cx="83" cy="61" r="4.5" fill="#f2a48a" opacity=".7" />
      {mood === "cheer" ? (
        <g fill="none" stroke="#1d2b2f" strokeWidth="3.4" strokeLinecap="round">
          <path d="M40 48q6-8 12 0" />
          <path d="M68 48q6-8 12 0" />
        </g>
      ) : (
        <g className="pip-eyes">
          <circle cx="46" cy="46" r="5.8" fill="#1d2b2f" />
          <circle cx="74" cy="46" r="5.8" fill="#1d2b2f" />
          <circle cx="48" cy="44" r="2" fill="#fff" />
          <circle cx="76" cy="44" r="2" fill="#fff" />
        </g>
      )}
      {mood === "sad" && (
        <g fill="none" stroke="#5e3a22" strokeWidth="2.6" strokeLinecap="round">
          <path d="M39 38l11-4" />
          <path d="M81 38l-11-4" />
        </g>
      )}
      <ellipse cx="60" cy="56" rx="6.5" ry="4.4" fill="#2a1d17" />
      <path d={mood === "sad" ? "M53 67q7-5 14 0" : "M53 62q3.5 5 7 0q3.5 5 7 0"} fill="none" stroke="#2a1d17" strokeWidth="2.4" strokeLinecap="round" />
      <g stroke="#6e4529" strokeWidth="1.6" strokeLinecap="round">
        <path d="M40 58l-15-3M40 62l-15 1" />
        <path d="M80 58l15-3M80 62l15 1" />
      </g>
      <g transform={`translate(0 ${lift})`}>
        <ellipse cx="60" cy="83" rx="11.5" ry="8.5" fill="var(--os-sea)" />
        <ellipse cx="56" cy="80" rx="3.5" ry="2" fill="#fff" opacity=".45" />
        <circle cx="48" cy="84" r="6.5" fill="#9a6544" />
        <circle cx="72" cy="84" r="6.5" fill="#9a6544" />
      </g>
      {mood === "cheer" && (
        <g fill="var(--os-sun)">
          <path d="M14 20l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" />
          <path d="M104 10l1.5 4 4 1.5-4 1.5-1.5 4-1.5-4-4-1.5 4-1.5z" />
        </g>
      )}
    </svg>
  );
}

export function Says({ children, mood, size = 96 }: { children: React.ReactNode; mood?: Mood; size?: number }) {
  return (
    <div className="flex items-center gap-4">
      <Pip mood={mood} size={size} className="shrink-0" />
      <div className="bubble">{children}</div>
    </div>
  );
}
