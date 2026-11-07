import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Pip } from "~/components/pip";
import { Bolt, Flame, GITHUB, Heart, Splash } from "~/components/ui";
import { Mark } from "~/lib/courses";
import { reset, useStore, write } from "~/lib/store";
import { Side } from "./learn";

export const meta = () => [{ title: "Profile · Otterspeak" }];
export const clientLoader = () => null;
export const HydrateFallback = Splash;

export default function Profile() {
  const s = useStore();
  const go = useNavigate();
  const [name, setName] = useState(s?.name ?? "");
  if (!s) return <Splash />;
  const tracks = Object.values(s.tracks);
  return (
    <div id="page-profile" className="flex min-h-svh">
      <Side />
      <main className="mx-auto w-full max-w-2xl px-5 py-8">
        <Link to="/learn" className="font-extrabold text-sea-ink lg:hidden">← Learn</Link>
        <div className="mt-4 flex items-center gap-5">
          <Pip size={110} mood="cheer" />
          <div>
            <h1 className="text-3xl">{s.name || "Learner"}</h1>
            <p className="font-semibold text-muted">Heard about us from {s.heard || "somewhere nice"}</p>
          </div>
        </div>
        <form className="mt-6 flex gap-3" onSubmit={(e) => (e.preventDefault(), write((st) => ((st.name = name.trim()), (st.seen.profile = true))))}>
          <input id="profile-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} placeholder="Your name" className="h-12 min-w-0 flex-1 rounded-xl border-2 border-line bg-surface px-4 font-bold outline-none focus:border-sea" />
          <button className="btn btn-sea" disabled={name.trim() === s.name}>Save</button>
        </form>
        <h2 className="mt-10 text-xl">Statistics</h2>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {[
            [<Flame key="f" />, s.streak.count, "Day streak"],
            [<Bolt key="b" />, s.xp, "Total XP"],
            [<Heart key="h" />, s.hearts.n, "Hearts"],
            [<span key="l" className="text-xl">★</span>, s.lessons, "Lessons"],
          ].map(([icon, n, label]) => (
            <div key={String(label)} className="card flex items-center gap-3 p-4">
              {icon}
              <div>
                <p className="text-xl font-black">{n}</p>
                <p className="text-sm font-semibold text-muted">{label}</p>
              </div>
            </div>
          ))}
        </div>
        <h2 className="mt-10 text-xl">Courses</h2>
        <ul className="mt-4 grid gap-3">
          {tracks.map((t) => (
            <li key={t.course.id}>
              <button className="option flex items-center gap-4" aria-pressed={s.active === t.course.id} onClick={() => (write((st) => void (st.active = t.course.id)), go("/learn"))}>
                <Mark c={t.course} size={40} />
                <span className="flex-1">{t.course.name}</span>
                <span className="text-sm text-muted">{t.done} {t.done === 1 ? "lesson" : "lessons"}</span>
              </button>
            </li>
          ))}
          <li><Link to="/welcome" className="btn btn-ghost w-full">Add a course</Link></li>
        </ul>
        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t-2 border-line pt-6 text-sm font-bold text-muted">
          <a href={GITHUB} className="underline">Otterspeak is open source</a>
          <button className="font-extrabold tracking-wide text-bad-ink uppercase" onClick={() => confirm("Erase all progress on this device?") && (reset(), go("/welcome"))}>Reset progress</button>
        </div>
      </main>
    </div>
  );
}
