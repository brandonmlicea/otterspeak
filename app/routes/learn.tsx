import { useState } from "react";
import { Link, NavLink, Navigate, useNavigate } from "react-router";
import { Pip } from "~/components/pip";
import { Bolt, Flame, Heart, Logo, Splash } from "~/components/ui";
import { Mark, levelsFor } from "~/lib/courses";
import { nextHeartIn, post, quests, today, track, useStore, write, type State, type Unit } from "~/lib/store";

export const meta = () => [{ title: "Learn · Otterspeak" }];
export const clientLoader = () => null;
export const HydrateFallback = Splash;

const SWAY = [0, 56, 84, 56, 0];

export function Stats({ s }: { s: State }) {
  return (
    <div id="stats" className="flex items-center justify-between gap-5 font-medium">
      <span title={`${s.streak.count} day streak`} className={`flex items-center gap-1 ${s.streak.last === today() ? "text-coral-ink" : "text-muted"}`}>
        <Flame on={s.streak.last === today()} /> {s.streak.count}
      </span>
      <span title="Total XP" className="flex items-center gap-1"><Bolt /> {s.xp}</span>
      <span title={s.hearts.n < 5 ? `Next heart in ${Math.ceil(nextHeartIn(s) / 60000)} min` : "Full hearts"} className="flex items-center gap-1 text-bad-ink">
        <Heart /> {s.hearts.n}
      </span>
    </div>
  );
}

export function Side() {
  return (
    <nav id="side-nav" className="sticky top-0 hidden h-svh w-60 shrink-0 flex-col gap-2 border-r border-line px-4 py-6 lg:flex">
      <div className="mb-6 px-2"><Logo to="/learn" /></div>
      {[["/learn", "Learn"], ["/lesson?practice", "Practice"], ["/welcome", "Courses"], ["/profile", "Profile"]].map(([to, label]) => (
        <NavLink key={to} to={to} end className={({ isActive }) => `rounded-xl border px-4 py-3 font-medium ${isActive ? "border-sea bg-sea-wash text-sea-ink" : "border-transparent text-muted hover:bg-sea-wash"}`}>
          {label}
        </NavLink>
      ))}
    </nav>
  );
}

export default function Learn() {
  const s = useStore();
  const go = useNavigate();
  const [busy, setBusy] = useState("");
  if (!s) return <Splash />;
  const t = track(s);
  if (!t) return <Navigate to="/welcome" replace />;
  const total = t.outline.length * 5;
  const start = (n: number) => (s.hearts.n === 0 ? setBusy("hearts") : go(`/lesson?n=${n}`));
  const extend = async () => {
    setBusy("extend");
    try {
      const { units } = await post<{ units: Unit[] }>("/api/course", { name: t.course.name, from: t.from ?? "English", level: levelsFor(t.course)[t.level], after: t.outline.map((u) => u.title) });
      write((st) => void track(st)!.outline.push(...units));
      setBusy("");
    } catch (e) {
      setBusy((e as Error).message);
    }
  };

  return (
    <div id="page-learn" className="flex min-h-svh">
      <Side />
      <div className="flex min-w-0 flex-1 justify-center gap-10 px-4">
        <main className="w-full max-w-xl pb-24">
          <header className="sticky top-0 z-10 -mx-4 mb-4 border-b border-line bg-canvas px-4 py-3 xl:hidden">
            <div className="flex items-center justify-between gap-4">
              <Link to="/welcome" aria-label="Change course"><Mark c={t.course} size={36} /></Link>
              <Stats s={s} />
              <Link to="/profile" className="font-medium text-sea-ink lg:hidden">Me</Link>
            </div>
          </header>
          {busy === "hearts" && (
            <div className="card mt-6 flex items-center gap-4 border-heart p-4" role="alert">
              <Pip mood="sad" size={64} />
              <p className="flex-1 font-medium">You’re out of hearts. One comes back in {Math.ceil(nextHeartIn(s) / 60000)} min, or practise to earn one now.</p>
              <Link to="/lesson?practice" className="btn btn-sea">Practice</Link>
            </div>
          )}
          {t.outline.map((u, ui) => (
            <section key={ui} id={`unit-${ui}`} className="mt-6">
              <div className="card border-l-4 border-l-sea px-5 py-4">
                <p className="eyebrow">Unit {ui + 1}</p>
                <h2 className="text-xl">{u.title}</h2>
                <p className="mt-0.5 text-muted">{u.about}</p>
              </div>
              <ol className="relative mt-12 flex flex-col items-center gap-9">
                {u.lessons.map((focus, li) => {
                  const n = ui * 5 + li;
                  const state = n < t.done ? "done" : n === t.done ? "now" : "locked";
                  const x = SWAY[li] * (ui % 2 ? -1 : 1);
                  return (
                    <li key={li} style={{ transform: `translateX(${x}px)` }} className="relative">
                      {state === "now" && <span className="pop absolute -top-10 left-1/2 -translate-x-1/2 rounded-xl border border-line bg-surface px-3 py-1.5 text-sm font-medium whitespace-nowrap text-sea-ink">Start</span>}
                      <button
                        id={`lesson-${n}`}
                        title={focus}
                        disabled={state === "locked"}
                        onClick={() => start(n)}
                        className={`grid size-16 place-items-center rounded-full text-xl ${state === "locked" ? "border border-line bg-surface text-muted" : "btn-sea border"} ${state === "now" ? "ring-[6px] ring-sea-wash" : ""}`}
                      >
                        {state === "done" ? "✓" : state === "now" ? "★" : li + 1}
                      </button>
                    </li>
                  );
                })}
                <Pip size={110} mood={ui * 5 + 5 <= t.done ? "cheer" : "hi"} className={`absolute top-10 hidden sm:block ${ui % 2 ? "right-0" : "left-0"}`} />
              </ol>
            </section>
          ))}
          <div className="mt-12 text-center">
            {t.done >= total ? (
              <button id="course-extend" className="btn btn-sea" onClick={extend} disabled={busy === "extend"}>{busy === "extend" ? "Writing new units…" : "Unlock more units"}</button>
            ) : (
              <p className="font-medium text-muted">Finish every unit to unlock more.</p>
            )}
            {busy && !["hearts", "extend"].includes(busy) && <p className="mt-3 text-bad-ink">{busy}</p>}
          </div>
        </main>
        <aside className="sticky top-0 hidden h-svh w-80 shrink-0 flex-col gap-6 py-6 xl:flex">
          <div className="flex items-center justify-between">
            <Link to="/welcome" aria-label="Change course"><Mark c={t.course} size={36} /></Link>
            <Stats s={s} />
          </div>
          <section id="quests" className="card p-5">
            <h2 className="text-lg">Daily quests</h2>
            <ul className="mt-4 grid gap-4">
              {quests(s).map((q) => (
                <li key={q.label} className="flex items-center gap-3">
                  <Bolt />
                  <div className="flex-1">
                    <p className="font-medium">{q.label}</p>
                    <div className="bar mt-1.5"><span style={{ width: `${Math.min(100, (q.have / q.need) * 100)}%`, background: "var(--os-sun)" }} /></div>
                  </div>
                  <span className="text-sm font-medium text-muted">{Math.min(q.have, q.need)} / {q.need}</span>
                </li>
              ))}
            </ul>
          </section>
          <section className="card p-5">
            <h2 className="text-lg">{s.name ? `Hi, ${s.name}!` : "Save your progress"}</h2>
            <p className="mt-1 text-muted">{s.streakGoal ? `Streak goal: ${s.streak.count} of ${s.streakGoal} days.` : "Finish a lesson to set a streak goal."}</p>
            <Link to="/profile" className="btn btn-ghost mt-4 w-full">Profile</Link>
          </section>
        </aside>
      </div>
    </div>
  );
}
