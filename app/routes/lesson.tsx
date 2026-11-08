import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { After, type Stage } from "~/components/after";
import { Exercise, bankOf, grade, type Value } from "~/components/exercise";
import { Pip } from "~/components/pip";
import { Heart, Splash } from "~/components/ui";
import { levelsFor } from "~/lib/courses";
import { useWords } from "~/lib/words";
import { MAX_HEARTS, finish, loseHeart, post, questsDone, read, today, track, useStore, write, type Lesson as LessonData } from "~/lib/store";

export const meta = () => [{ title: "Lesson · Otterspeak" }];
export const clientLoader = () => null;
export const HydrateFallback = Splash;

type Result = { ok: boolean; right: string; note?: string; why?: string };

export default function Lesson() {
  const [params] = useSearchParams();
  const go = useNavigate();
  const s = useStore();
  const w = useWords();
  const practice = params.has("practice");
  const n = Number(params.get("n") ?? 0);
  const [{ t, setupError }] = useState(() => {
    const t = track(read());
    return { t, setupError: !t ? "noCourse" : !practice && (n > t.done || n >= t.outline.length * 5) ? "locked" : "" };
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
      from: t.from ?? "English",
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
          <h1 className="text-2xl">{out ? w("outTitle") : w("dropped")}</h1>
          <p className="text-muted">{out ? w("outBody") : error === "noCourse" || error === "locked" ? w(error) : error}</p>
          <div className="flex flex-wrap justify-center gap-3">
            {out ? <Link to="/lesson?practice" reloadDocument className="btn btn-sea">{w("practice")}</Link> : !setupError && <button className="btn btn-sea" onClick={() => setAttempt(attempt + 1)}>{w("tryAgain")}</button>}
            <Link to="/learn" className="btn btn-ghost">{w("back")}</Link>
          </div>
        </div>
      </main>
    );
  if (!lesson || !ex || !s || !t)
    return (
      <main className="grid min-h-svh place-items-center text-center">
        <div className="flex flex-col items-center gap-4">
          <Pip size={130} className="animate-bounce motion-reduce:animate-none" />
          <p className="text-lg font-medium">{practice ? w("gathering") : w("preparing")}</p>
        </div>
      </main>
    );

  const empty = value === null || value === "" || (Array.isArray(value) && !value.length);
  return (
    <div id="page-lesson" className="flex min-h-svh flex-col">
      <header className="mx-auto flex w-full max-w-4xl items-center gap-4 px-5 pt-6">
        <button id="lesson-quit" onClick={() => setQuit(true)} aria-label={w("quitLesson")} className="text-3xl leading-none font-medium text-muted">×</button>
        <div className="bar flex-1"><span style={{ width: `${(solved / lesson.exercises.length) * 100}%` }} /></div>
        <span id="lesson-hearts" className="flex items-center gap-1 font-medium text-bad-ink" title={practice ? w("practiceFree") : `${s.hearts.n} ${w("hearts")}`}>
          <Heart /> {practice ? "∞" : s.hearts.n}
        </span>
      </header>
      <main key={pos} className="pop mx-auto w-full max-w-2xl flex-1 px-5 py-8">
        {missed.has(index) && !result && <p className="mb-2 text-sm font-medium text-coral-ink">{w("previousMistake")}</p>}
        <h1 className="mb-6 text-2xl">{w(ex.type)}</h1>
        <Exercise w={w} ex={ex} lang={t.course.lang} bank={bank} locked={!!result} value={value} set={setValue} solved={() => answer({ ok: true, right: "" })} />
      </main>
      <footer className={`border-t ${result ? (result.ok ? "border-transparent bg-good" : "border-transparent bg-bad") : "border-line"}`}>
        <div className="mx-auto flex max-w-4xl flex-col gap-4 px-5 py-6 sm:flex-row sm:items-center sm:justify-between">
          {result ? (
            <div id="lesson-feedback" className={result.ok ? "text-good-ink" : "text-bad-ink"} role="status">
              <p className="text-2xl font-medium">{result.ok ? w((["praise0", "praise1", "praise2", "praise3"] as const)[pos % 4]) : w("notQuite")}</p>
              {!result.ok && <p className="mt-1 font-medium">{w("correctAnswer", { x: result.right })}</p>}
              {result.note && <p className="mt-1 font-medium">{w("accents", { x: result.note })}</p>}
              {result.why && <p className="mt-1 max-w-xl">{result.why}</p>}
              {!result.ok && !result.why && (
                <button
                  className="mt-1 text-sm font-medium underline"
                  onClick={async () => {
                    const given = Array.isArray(value) ? value.map((i) => bank[i]).join(" ") : ex.type === "choose" || ex.type === "fill" ? ex.choices[value as number] : String(value);
                    const r = await post<{ why: string }>("/api/explain", { name: t.course.name, from: t.from ?? "English", prompt: ex.prompt, right: result.right, given }).catch(() => ({ why: w("whyFail") }));
                    setResult({ ...result, why: r.why });
                  }}
                >
                  {w("why")}
                </button>
              )}
            </div>
          ) : (
            <button className="btn btn-ghost hidden sm:inline-flex" onClick={() => answer({ ...grade(ex, null, bank), ok: false })} disabled={ex.type === "pairs"}>{w("skip")}</button>
          )}
          {ex.type !== "pairs" || result ? (
            <button id="lesson-check" autoFocus={!!result} className={`btn w-full sm:w-48 ${result ? (result.ok ? "btn-good" : "btn-bad") : "btn-sea"}`} disabled={!result && empty} onClick={result ? next : check}>
              {result ? w("continue") : w("check")}
            </button>
          ) : null}
        </div>
      </footer>
      {quit && (
        <div className="fixed inset-0 z-10 grid place-items-center bg-black/50 p-5" role="dialog" aria-modal="true" aria-labelledby="quit-title">
          <div className="pop card flex w-full max-w-sm flex-col items-center gap-4 p-6 text-center">
            <Pip mood="sad" size={110} />
            <h2 id="quit-title" className="text-xl">{w("quitTitle")}</h2>
            <button autoFocus className="btn btn-sea w-full" onClick={() => setQuit(false)}>{w("keepLearning")}</button>
            <Link to="/learn" className="font-medium text-bad-ink">{w("endSession")}</Link>
          </div>
        </div>
      )}
    </div>
  );
}
