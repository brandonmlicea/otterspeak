import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Logo } from "~/components/ui";
import { COURSES, Mark, custom, type Course } from "~/lib/courses";
import { read, write } from "~/lib/store";
import { courseName, useWords } from "~/lib/words";

export const meta = () => [{ title: "I want to learn… · Otterspeak" }];

export default function Welcome() {
  const go = useNavigate();
  const w = useWords();
  const [topic, setTopic] = useState("");
  const pick = (c: Course) => {
    if (read().tracks[c.id]) {
      write((s) => void (s.active = c.id));
      return go("/learn");
    }
    go(`/setup?${c.id.startsWith("topic:") ? `topic=${encodeURIComponent(c.name)}` : `course=${c.id}`}`);
  };
  return (
    <div id="page-welcome" className="min-h-svh">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
        <Logo />
        <Link to="/learn" className="text-sm font-medium text-muted hover:text-sea-ink">{w("myProgress")}</Link>
      </header>
      <main className="mx-auto max-w-4xl px-5 pb-16">
        <h1 className="mt-8 text-center text-3xl">{w("wantLearn")}</h1>
        <ul id="courses" className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {COURSES.map((c) => (
            <li key={c.id}>
              <button id={`course-${c.id}`} onClick={() => pick(c)} className="card flex w-full flex-col items-center gap-3 px-4 py-7 hover:bg-sea-wash">
                <Mark c={c} />
                <span className="font-medium">{courseName(w, c)}</span>
              </button>
            </li>
          ))}
        </ul>
        <form
          id="course-anything"
          className="card mt-8 flex flex-col gap-3 p-5 sm:flex-row sm:items-center"
          onSubmit={(e) => {
            e.preventDefault();
            if (topic.trim()) pick(custom(topic));
          }}
        >
          <label htmlFor="topic" className="shrink-0 font-medium">{w("anything")}</label>
          <input id="topic" value={topic} onChange={(e) => setTopic(e.target.value)} maxLength={60} placeholder={w("topicHint")} className="h-12 min-w-0 flex-1 rounded-xl border border-line bg-canvas px-4 outline-none focus:border-sea" />
          <button className="btn btn-sea" disabled={!topic.trim()}>{w("start")}</button>
        </form>
      </main>
    </div>
  );
}
