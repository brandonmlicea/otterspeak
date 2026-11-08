import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Pip } from "~/components/pip";
import { Bolt, Flame, GITHUB, Heart, Splash } from "~/components/ui";
import { Mark } from "~/lib/courses";
import { reset, useStore, write } from "~/lib/store";
import { Side } from "./learn";
import { courseName, useWords } from "~/lib/words";

export const meta = () => [{ title: "Profile · Otterspeak" }];
export const clientLoader = () => null;
export const HydrateFallback = Splash;

export default function Profile() {
  const s = useStore();
  const w = useWords();
  const go = useNavigate();
  const [name, setName] = useState(s?.name ?? "");
  if (!s) return <Splash />;
  const tracks = Object.values(s.tracks);
  return (
    <div id="page-profile" className="flex min-h-svh">
      <Side />
      <main className="mx-auto w-full max-w-2xl px-5 py-8">
        <Link to="/learn" className="font-medium text-sea-ink lg:hidden">← {w("learn")}</Link>
        <div className="mt-4 flex items-center gap-5">
          <Pip size={110} mood="cheer" />
          <div>
            <h1 className="text-3xl">{s.name || w("learner")}</h1>
            {s.heard && <p className="text-muted">{w("heardFrom", { x: s.heard })}</p>}
          </div>
        </div>
        <form className="mt-6 flex gap-3" onSubmit={(e) => (e.preventDefault(), write((st) => ((st.name = name.trim()), (st.seen.profile = true))))}>
          <input id="profile-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} placeholder={w("yourName")} className="h-12 min-w-0 flex-1 rounded-xl border border-line bg-surface px-4 font-medium outline-none focus:border-sea" />
          <button className="btn btn-sea" disabled={name.trim() === s.name}>{w("save")}</button>
        </form>
        <h2 className="mt-10 text-xl">{w("statistics")}</h2>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {[
            [<Flame key="f" />, s.streak.count, w("dayStreakLabel")],
            [<Bolt key="b" />, s.xp, w("totalXp")],
            [<Heart key="h" />, s.hearts.n, w("hearts")],
            [<span key="l" className="text-xl">★</span>, s.lessons, w("lessons")],
          ].map(([icon, n, label]) => (
            <div key={String(label)} className="card flex items-center gap-3 p-4">
              {icon}
              <div>
                <p className="text-xl font-medium">{n}</p>
                <p className="text-sm text-muted">{label}</p>
              </div>
            </div>
          ))}
        </div>
        <h2 className="mt-10 text-xl">{w("courses")}</h2>
        <ul className="mt-4 grid gap-3">
          {tracks.map((t) => (
            <li key={t.course.id}>
              <button className="option flex items-center gap-4" aria-pressed={s.active === t.course.id} onClick={() => (write((st) => void (st.active = t.course.id)), go("/learn"))}>
                <Mark c={t.course} size={40} />
                <span className="flex-1">{courseName(w, t.course)}</span>
                <span className="text-sm text-muted">{w("lessonCount", { n: t.done })}</span>
              </button>
            </li>
          ))}
          <li><Link to="/welcome" className="btn btn-ghost w-full">{w("addCourse")}</Link></li>
        </ul>
        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6 text-sm font-medium text-muted">
          <a href={GITHUB} className="underline">{w("openSource")}</a>
          <button className="font-medium text-bad-ink" onClick={() => confirm(w("resetConfirm")) && (reset(), go("/welcome"))}>{w("reset")}</button>
        </div>
      </main>
    </div>
  );
}
