import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { Pip, Says } from "~/components/pip";
import { COURSES, GOALS, SOURCES, SPEAKS, custom, levelsFor } from "~/lib/courses";
import { post, write, type Unit } from "~/lib/store";

export const meta = () => [{ title: "Getting started · Otterspeak" }];

export default function Setup() {
  const [params] = useSearchParams();
  const go = useNavigate();
  const topic = params.get("topic");
  const course = topic ? custom(topic) : COURSES.find((c) => c.id === params.get("course"));
  const steps = ["hi", "heard", "speak", "level", "goal", "build"];
  const [at, setAt] = useState(0);
  const [heard, setHeard] = useState("");
  const [level, setLevel] = useState(-1);
  const [from, setFrom] = useState("");
  const [goal, setGoal] = useState(1);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const step = steps[at];

  useEffect(() => {
    if (step !== "build" || !course) return;
    setError("");
    post<{ units: Unit[] }>("/api/course", { name: course.name, from, level: levelsFor(course)[level] })
      .then(({ units }) => {
        write((s) => {
          if (heard) s.heard = heard;
          s.goal = GOALS[goal].xp;
          s.tracks[course.id] = { course, from, level, outline: units, done: 0 };
          s.active = course.id;
        });
        go("/lesson?n=0", { replace: true });
      })
      .catch((e: Error) => setError(e.message));
  }, [step, attempt]);

  if (!course) return <Link to="/welcome" className="btn btn-sea m-8">Pick a course</Link>;
  const levels = levelsFor(course);
  const ready = step === "hi" || (step === "heard" && heard) || (step === "speak" && from) || (step === "level" && level >= 0) || step === "goal";
  const choice = (id: string, label: string, on: boolean, pick: () => void, note?: string) => (
    <button key={label} id={id} onClick={pick} aria-pressed={on} className="option flex items-center justify-between">
      <span>{label}</span>
      {note && <span className="text-muted">{note}</span>}
    </button>
  );

  return (
    <div id="page-setup" className="flex min-h-svh flex-col">
      <header className="mx-auto flex w-full max-w-4xl items-center gap-4 px-5 pt-6">
        <button onClick={() => (at ? setAt(at - 1) : go("/welcome"))} aria-label="Back" className="text-2xl font-medium text-muted">←</button>
        <div className="bar flex-1"><span style={{ width: `${((at + 1) / steps.length) * 100}%` }} /></div>
      </header>
      <main className="mx-auto w-full max-w-xl flex-1 px-5 py-10">
        {step === "hi" && (
          <div className="pop mt-10 flex flex-col items-center gap-6 text-center">
            <div className="bubble">Hi there! I’m Pip!</div>
            <Pip size={180} />
          </div>
        )}
        {step === "heard" && (
          <section className="pop">
            <Says>How did you hear about Otterspeak?</Says>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">{SOURCES.map((s) => choice(`heard-${s}`, s, heard === s, () => setHeard(s)))}</div>
          </section>
        )}
        {step === "speak" && (
          <section className="pop">
            <Says>{course.lang ? "What language do you already speak?" : "Which language should your lessons be in?"}</Says>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">{SPEAKS.filter((l) => l !== course.name).map((l) => choice(`speak-${l}`, l, from === l, () => setFrom(l)))}</div>
          </section>
        )}
        {step === "level" && (
          <section className="pop">
            <Says>How much {course.name} do you know?</Says>
            <div className="mt-8 grid gap-3">{levels.map((l, i) => choice(`level-${i}`, l, level === i, () => setLevel(i)))}</div>
          </section>
        )}
        {step === "goal" && (
          <section className="pop">
            <Says>What’s your daily learning goal?</Says>
            <div className="mt-8 grid gap-3">{GOALS.map((g, i) => choice(`goal-${g.min}`, `${g.min} min / day`, goal === i, () => setGoal(i), g.label))}</div>
          </section>
        )}
        {step === "build" && (
          <div className="mt-10 flex flex-col items-center gap-6 text-center">
            <Pip mood={error ? "sad" : "hi"} size={160} className={error ? "" : "animate-bounce motion-reduce:animate-none"} />
            <p className="text-xl font-medium">{error ? "Pip dropped the pebble." : `Building your ${course.name} course…`}</p>
            {error && <p className="max-w-md text-muted">{error}</p>}
            {error && <button className="btn btn-sea" onClick={() => setAttempt(attempt + 1)}>Try again</button>}
          </div>
        )}
      </main>
      {step !== "build" && (
        <footer className="border-t border-line">
          <div className="mx-auto flex max-w-4xl justify-end px-5 py-6">
            <button id="setup-continue" className="btn btn-sea w-full sm:w-48" disabled={!ready} onClick={() => setAt(at + 1)}>Continue</button>
          </div>
        </footer>
      )}
    </div>
  );
}
