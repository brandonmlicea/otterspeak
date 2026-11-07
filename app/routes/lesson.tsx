import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { After, type Stage } from "~/components/after";
import { Exercise, bankOf, grade, titleOf, type Value } from "~/components/exercise";
import { Pip } from "~/components/pip";
import { Heart, Splash } from "~/components/ui";
import { levelsFor } from "~/lib/courses";
import { MAX_HEARTS, finish, loseHeart, post, questsDone, read, today, track, useStore, write, type Lesson as LessonData } from "~/lib/store";

export const meta = () => [{ title: "Lesson · Otterspeak" }];
export const clientLoader = () => null;
export const HydrateFallback = Splash;

type Result = { ok: boolean; right: string; note?: string; why?: string };

export default function Lesson() {
  const [params] = useSearchParams();
  const go = useNavigate();
  const s = useStore();
  const practice = params.has("practice");
  const n = Number(params.get("n") ?? 0);
  const [{ t, setupError }] = useState(() => {
    const t = track(read());
    return { t, setupError: !t ? "No course yet." : !practice && (n > t.done || n >= t.outline.length * 5) ? "That lesson is still locked." : "" };
  });
  const [lesson, setLesson] = useState<LessonData | null>(null);
  const [error, setError] = useState(setupError);
  const [attempt, setAttempt] = useState(0);
  const [queue, setQueue] = useState<number[]>([]);
  const [pos, setPos] = useState(0);
  const [value, setValue] = useState<Value>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [missed, setMissed] = useState<Set<number>>(new Set());
  const [solved, setSolved] = useState(0);
  const [started] = useState(Date.now());
  const [quit, setQuit] = useState(false);
  const [stages, setStages] = useState<Stage[]>([]);

  useEffect(() => {
    if (!t || setupError) return;
    setError("");
    const unit = t.outline[Math.floor(n / 5)] ?? t.outline[0];
    const st = read();
    post<LessonData>("/api/lesson", {
      name: t.course.name,
      lang: t.course.lang ?? "",
      level: levelsFor(t.course)[t.level],
      unit: practice ? "Review" : `${unit.title}: ${unit.about}`,
      focus: practice ? "Mixed review of everything learned so far" : unit.lessons[n % 5],
      words: st.words.slice(0, practice ? 40 : 20),
      review: practice,
    })
      .then((l) => {
        setLesson(l);
        setQueue(l.exercises.map((_, i) => i));
      })
      .catch((e: Error) => setError(e.message));
  }, [attempt]);

  const index = queue[pos];
  const ex = lesson?.exercises[index];
  const bank = useMemo(() => (ex ? bankOf(ex) : []), [ex, pos]);
  const out = !practice && s !== null && s.hearts.n === 0 && !stages.length && !result;

  const answer = (r: Result) => {
    setResult(r);
    write((st) => {
      st.day.run = r.ok ? st.day.run + 1 : 0;
      st.day.best = Math.max(st.day.best, st.day.run);
      if (!r.ok && !practice) loseHeart(st);
    });
    if (r.ok) setSolved((x) => x + 1);
    else {
      setMissed((m) => new Set(m).add(index));
      setQueue((q) => [...q, index]);
    }
  };

  const check = () => {
    if (!ex || result || value === null || value === "" || (Array.isArray(value) && !value.length)) return;
    answer(grade(ex, value, bank));
  };

  const next = useCallback(() => {
    if (!lesson) return;
    if (pos + 1 < queue.length) {
      setPos(pos + 1);
      setValue(null);
      setResult(null);
      return;
    }
    const perfect = missed.size === 0;
    const xp = practice ? 10 : 10 + (perfect ? 5 : 0);
    const before = read();
    const doneBefore = questsDone(before);
    write((st) => {
      finish(st, xp, lesson.words, practice ? null : n);
      if (practice) st.hearts.n = Math.min(MAX_HEARTS, st.hearts.n + 1);
    });
    const after = read();
    const accuracy = Math.round(((lesson.exercises.length - missed.size) / lesson.exercises.length) * 100);
    setStages([
      { kind: "done", xp, accuracy, seconds: Math.round((Date.now() - started) / 1000), perfect },
      ...(!after.streakGoal ? [{ kind: "streak" } as const] : []),
      ...(!doneBefore && questsDone(after) && after.seen.quests !== today() ? [{ kind: "quests" } as const] : []),
      ...(!after.name && !after.seen.profile ? [{ kind: "profile" } as const] : []),
    ]);
  }, [lesson, pos, queue, missed]);

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (stages.length || quit || !ex) return;
      if (e.key === "Enter" && !(e.target instanceof HTMLTextAreaElement && e.shiftKey)) {
        e.preventDefault();
        result ? next() : check();
      }
      const k = Number(e.key);
      if (!result && (ex.type === "choose" || ex.type === "fill") && k >= 1 && k <= ex.choices.length && !(e.target instanceof HTMLTextAreaElement)) setValue(k - 1);
    };
    addEventListener("keydown", key);
    return () => removeEventListener("keydown", key);
  });

  if (stages.length) return <After stages={stages} done={() => go("/learn")} />;
  if (error || out)
    return (
      <main className="grid min-h-svh place-items-center p-8 text-center">
        <div className="flex max-w-md flex-col items-center gap-4">
          <Pip mood="sad" size={150} />
          <h1 className="text-2xl">{out ? "You ran out of hearts" : "Pip dropped the pebble"}</h1>
          <p className="text-muted">{out ? "Hearts come back one every 30 minutes. A practice lesson earns one right away." : error}</p>
          <div className="flex flex-wrap justify-center gap-3">
            {out ? <Link to="/lesson?practice" reloadDocument className="btn btn-sea">Practice</Link> : !setupError && <button className="btn btn-sea" onClick={() => setAttempt(attempt + 1)}>Try again</button>}
            <Link to="/learn" className="btn btn-ghost">Back</Link>
          </div>
        </div>
      </main>
    );
  if (!lesson || !ex || !s || !t)
    return (
      <main className="grid min-h-svh place-items-center text-center">
        <div className="flex flex-col items-center gap-4">
          <Pip size={130} className="animate-bounce motion-reduce:animate-none" />
          <p className="text-lg font-extrabold">{practice ? "Gathering your words to practise…" : "Getting your lesson ready…"}</p>
        </div>
      </main>
    );

  const empty = value === null || value === "" || (Array.isArray(value) && !value.length);
  return (
    <div id="page-lesson" className="flex min-h-svh flex-col">
      <header className="mx-auto flex w-full max-w-4xl items-center gap-4 px-5 pt-6">
        <button id="lesson-quit" onClick={() => setQuit(true)} aria-label="Quit lesson" className="text-3xl leading-none font-black text-muted">×</button>
        <div className="bar flex-1"><span style={{ width: `${(solved / lesson.exercises.length) * 100}%` }} /></div>
        <span id="lesson-hearts" className="flex items-center gap-1 font-extrabold text-bad-ink" title={practice ? "Practice doesn’t cost hearts" : `${s.hearts.n} hearts`}>
          <Heart /> {practice ? "∞" : s.hearts.n}
        </span>
      </header>
      <main key={pos} className="pop mx-auto w-full max-w-2xl flex-1 px-5 py-8">
        {missed.has(index) && !result && <p className="mb-2 text-sm font-extrabold tracking-wide text-coral-ink uppercase">Previous mistake</p>}
        <h1 className="mb-6 text-2xl">{titleOf(ex, t.course.name)}</h1>
        <Exercise ex={ex} lang={t.course.lang} bank={bank} locked={!!result} value={value} set={setValue} solved={() => answer({ ok: true, right: "" })} />
      </main>
      <footer className={`border-t-2 ${result ? (result.ok ? "border-transparent bg-good" : "border-transparent bg-bad") : "border-line"}`}>
        <div className="mx-auto flex max-w-4xl flex-col gap-4 px-5 py-6 sm:flex-row sm:items-center sm:justify-between">
          {result ? (
            <div id="lesson-feedback" className={result.ok ? "text-good-ink" : "text-bad-ink"} role="status">
              <p className="text-2xl font-black">{result.ok ? ["Nice!", "Great job!", "Correct!", "You got it!"][pos % 4] : "Not quite"}</p>
              {!result.ok && <p className="mt-1 font-bold">Correct answer: {result.right}</p>}
              {result.note && <p className="mt-1 font-bold">{result.note}</p>}
              {result.why && <p className="mt-1 max-w-xl font-semibold">{result.why}</p>}
              {!result.ok && !result.why && (
                <button
                  className="mt-1 text-sm font-extrabold uppercase underline"
                  onClick={async () => {
                    const given = Array.isArray(value) ? value.map((i) => bank[i]).join(" ") : ex.type === "choose" || ex.type === "fill" ? ex.choices[value as number] : String(value);
                    const r = await post<{ why: string }>("/api/explain", { name: t.course.name, prompt: ex.prompt, right: result.right, given }).catch(() => ({ why: "Pip couldn’t explain this one right now." }));
                    setResult({ ...result, why: r.why });
                  }}
                >
                  Why?
                </button>
              )}
            </div>
          ) : (
            <button className="btn btn-ghost hidden sm:inline-flex" onClick={() => answer({ ...grade(ex, null, bank), ok: false })} disabled={ex.type === "pairs"}>Skip</button>
          )}
          {ex.type !== "pairs" || result ? (
            <button id="lesson-check" autoFocus={!!result} className={`btn w-full sm:w-48 ${result ? (result.ok ? "btn-good" : "btn-bad") : "btn-sea"}`} disabled={!result && empty} onClick={result ? next : check}>
              {result ? "Continue" : "Check"}
            </button>
          ) : null}
        </div>
      </footer>
      {quit && (
        <div className="fixed inset-0 z-10 grid place-items-center bg-black/50 p-5" role="dialog" aria-modal="true" aria-labelledby="quit-title">
          <div className="pop card flex w-full max-w-sm flex-col items-center gap-4 p-6 text-center">
            <Pip mood="sad" size={110} />
            <h2 id="quit-title" className="text-xl">Wait, don’t go! You’ll lose your progress in this lesson.</h2>
            <button autoFocus className="btn btn-sea w-full" onClick={() => setQuit(false)}>Keep learning</button>
            <Link to="/learn" className="font-extrabold tracking-wide text-bad-ink uppercase">End session</Link>
          </div>
        </div>
      )}
    </div>
  );
}
