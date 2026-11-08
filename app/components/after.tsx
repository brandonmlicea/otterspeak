import { useState } from "react";
import { STREAKS } from "~/lib/courses";
import { quests, read, today, write } from "~/lib/store";
import { Pip } from "./pip";
import { Bolt, Flame } from "./ui";
import { useWords } from "~/lib/words";

export type Stage = { kind: "done"; xp: number; accuracy: number; seconds: number; perfect: boolean } | { kind: "streak" } | { kind: "quests" } | { kind: "profile" };

function Stat({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="card w-32 px-4 py-3 text-center">
      <p className="eyebrow flex items-center justify-center gap-1.5"><span className="size-2 rounded-full" style={{ background: tone }} />{label}</p>
      <p className="mt-1 text-2xl font-medium">{value}</p>
    </div>
  );
}

export function After({ stages, done }: { stages: Stage[]; done: () => void }) {
  const w = useWords();
  const [at, setAt] = useState(0);
  const [goal, setGoal] = useState(0);
  const [name, setName] = useState("");
  const stage = stages[at];
  const s = read();
  const next = () => (at + 1 < stages.length ? setAt(at + 1) : done());

  let body: React.ReactNode;
  let button = <button id="after-continue" autoFocus className="btn btn-sea w-full sm:w-56" onClick={next}>{w("continue")}</button>;
  let later: React.ReactNode = null;

  if (stage.kind === "done") {
    const mm = `${Math.floor(stage.seconds / 60)}:${String(stage.seconds % 60).padStart(2, "0")}`;
    body = (
      <>
        <Pip mood="cheer" size={170} />
        <h1 className="text-3xl text-sea-ink">{stage.perfect ? w("perfect") : w("complete")}</h1>
        <div className="flex flex-wrap justify-center gap-3">
          <Stat label={w("totalXp")} value={`${stage.xp}`} tone="var(--os-sun)" />
          <Stat label={w("accuracy")} value={`${stage.accuracy}%`} tone="var(--os-sea)" />
          <Stat label={w("time")} value={mm} tone="var(--os-coral)" />
        </div>
      </>
    );
  } else if (stage.kind === "streak") {
    body = (
      <>
        <div className="flex items-center gap-2 text-5xl font-medium text-coral-ink"><Flame size={56} /> {s.streak.count}</div>
        <h1 className="text-2xl">{w("streakTitle")}</h1>
        <p className="text-muted">{w("streakBody")}</p>
        <div className="grid w-full max-w-md gap-3">
          {STREAKS.map((g, i) => (
            <button key={g.days} id={`streak-${g.days}`} aria-pressed={goal === i} onClick={() => setGoal(i)} className="option flex justify-between">
              <span>{w("dayStreak", { n: g.days })}</span>
              <span className="text-muted">{w(g.label)}</span>
            </button>
          ))}
        </div>
      </>
    );
    button = (
      <button id="streak-commit" className="btn btn-sea w-full sm:w-56" onClick={() => (write((st) => void (st.streakGoal = STREAKS[goal].days)), next())}>
        {w("commit")}
      </button>
    );
  } else if (stage.kind === "quests") {
    body = (
      <>
        <Pip mood="cheer" size={150} />
        <h1 className="text-3xl">{w("questsDone")}</h1>
        <ul className="grid w-full max-w-md gap-3">
          {quests(s).map((q) => (
            <li key={q.key} className="card flex items-center gap-3 p-4">
              <Bolt />
              <div className="flex-1">
                <p className="font-medium">{w(q.key, { n: q.need })}</p>
                <div className="bar mt-2"><span style={{ width: "100%", background: "var(--os-sun)" }} /></div>
              </div>
              <span className="font-medium text-muted">{q.need} / {q.need}</span>
            </li>
          ))}
        </ul>
      </>
    );
    button = <button id="quests-continue" className="btn btn-sea w-full sm:w-56" onClick={() => (write((st) => void (st.seen.quests = today())), next())}>{w("continue")}</button>;
  } else {
    body = (
      <>
        <Pip size={150} />
        <h1 className="text-3xl">{w("profileTitle")}</h1>
        <p className="max-w-sm text-muted">{w("profileBody")}</p>
        <input id="profile-name" autoFocus value={name} onChange={(e) => setName(e.target.value)} maxLength={40} placeholder={w("yourName")} className="h-12 w-full max-w-sm rounded-xl border border-line bg-surface px-4 text-lg font-medium outline-none focus:border-sea" />
      </>
    );
    button = (
      <button id="profile-create" className="btn btn-sea w-full sm:w-56" disabled={!name.trim()} onClick={() => (write((st) => ((st.name = name.trim()), (st.seen.profile = true))), next())}>
        {w("createProfile")}
      </button>
    );
    later = <button id="profile-later" className="font-medium text-sea-ink" onClick={() => (write((st) => void (st.seen.profile = true)), next())}>{w("later")}</button>;
  }

  return (
    <div id="page-after" className="flex min-h-svh flex-col">
      <main key={at} className="pop mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-6 px-5 py-10 text-center">{body}</main>
      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-4xl flex-col-reverse items-center gap-4 px-5 py-6 sm:flex-row sm:justify-end">{later}{button}</div>
      </footer>
    </div>
  );
}
