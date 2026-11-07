import { useEffect, useMemo, useState } from "react";
import type { Exercise } from "~/lib/store";
import { Says } from "./pip";
import { Speaker, matches, speak } from "./ui";

export type Value = number | number[] | string | null;

const shuffle = <T,>(xs: T[]) => xs.map((x) => [Math.random(), x] as const).sort((a, b) => a[0] - b[0]).map(([, x]) => x);
const joiner = (tiles: string[]) => (tiles.some((t) => /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u.test(t)) ? "" : " ");

export const titleOf = (ex: Exercise, course: string) =>
  ({ choose: "Select the correct answer", fill: "Fill in the blank", build: "Translate this sentence", type: `Type the answer`, pairs: "Tap the matching pairs" })[ex.type] ?? course;

export function bankOf(ex: Exercise) {
  return ex.type === "build" ? shuffle([...ex.tiles, ...ex.extra]) : [];
}

export function grade(ex: Exercise, value: Value, bank: string[]): { ok: boolean; right: string; note?: string } {
  if (ex.type === "choose" || ex.type === "fill") return { ok: value === ex.answer, right: ex.choices[ex.answer] };
  if (ex.type === "build") {
    const right = ex.tiles.join(joiner(ex.tiles));
    const given = ((value as number[] | null) ?? []).map((i) => bank[i]).join(joiner(ex.tiles));
    return { right, ...matches(given, [right]) };
  }
  if (ex.type === "type") return { right: ex.answers[0], ...matches(String(value ?? ""), ex.answers) };
  return { ok: true, right: "" };
}

export function Exercise({ ex, lang, bank, locked, value, set, solved }: { ex: Exercise; lang?: string; bank: string[]; locked: boolean; value: Value; set: (v: Value) => void; solved: () => void }) {
  const say = "say" in ex ? ex.say : undefined;
  useEffect(() => {
    if (say) speak(say, lang);
  }, [ex]);

  const prompt = (
    <Says size={84}>
      <span className="flex items-center gap-3">
        {say && <Speaker text={say} lang={lang} />}
        <span>{ex.type === "fill" ? ex.prompt.replace("___", value !== null ? `[${ex.choices[value as number]}]` : "____") : ex.prompt}</span>
      </span>
    </Says>
  );

  if (ex.type === "choose" || ex.type === "fill")
    return (
      <>
        {prompt}
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {ex.choices.map((c, i) => (
            <button key={i} id={`choice-${i}`} disabled={locked} onClick={() => set(i)} aria-pressed={value === i} className="option flex items-center gap-3">
              <span className="grid size-7 shrink-0 place-items-center rounded-lg border border-line text-sm text-muted">{i + 1}</span>
              {c}
            </button>
          ))}
        </div>
      </>
    );

  if (ex.type === "build") {
    const picked = (value as number[] | null) ?? [];
    return (
      <>
        {prompt}
        <div id="answer-line" className="mt-8 flex min-h-[7.5rem] flex-wrap content-start gap-2 border-y border-line py-3">
          {picked.map((i, at) => (
            <button key={i} className="tile pop" disabled={locked} onClick={() => set(picked.filter((_, j) => j !== at))}>{bank[i]}</button>
          ))}
        </div>
        <div id="word-bank" className="mt-6 flex flex-wrap justify-center gap-2">
          {bank.map((w, i) => (
            <button key={i} className="tile" disabled={locked || picked.includes(i)} onClick={() => set([...picked, i])}>{w}</button>
          ))}
        </div>
      </>
    );
  }

  if (ex.type === "type")
    return (
      <>
        {prompt}
        <textarea
          id="answer-text"
          autoFocus
          disabled={locked}
          value={(value as string) ?? ""}
          onChange={(e) => set(e.target.value)}
          lang={lang}
          placeholder="Type your answer"
          className="mt-8 h-36 w-full resize-none rounded-2xl border border-line bg-surface p-4 text-lg outline-none focus:border-sea"
        />
      </>
    );

  return <Pairs pairs={ex.pairs} lang={lang} solved={solved} />;
}

function Pairs({ pairs, lang, solved }: { pairs: [string, string][]; lang?: string; solved: () => void }) {
  const left = useMemo(() => shuffle(pairs.map((p) => p[0])), [pairs]);
  const right = useMemo(() => shuffle(pairs.map((p) => p[1])), [pairs]);
  const [pick, setPick] = useState<{ l?: string; r?: string }>({});
  const [done, setDone] = useState<string[]>([]);
  const [miss, setMiss] = useState<string[]>([]);

  const choose = (side: "l" | "r", word: string) => {
    if (side === "l") speak(word, lang);
    const next = { ...pick, [side]: word };
    if (!next.l || !next.r) return setPick(next);
    setPick({});
    if (pairs.some((p) => p[0] === next.l && p[1] === next.r)) {
      const all = [...done, next.l];
      setDone(all);
      if (all.length === pairs.length) setTimeout(solved, 300);
    } else {
      setMiss([next.l, next.r]);
      setTimeout(() => setMiss([]), 500);
    }
  };
  const tone = (word: string, on: boolean, matched: boolean) => (matched ? "opacity-40" : miss.includes(word) ? "border-bad-ink bg-bad text-bad-ink" : on ? "border-sea bg-sea-wash text-sea-ink" : "");

  return (
    <div id="pairs" className="mt-4 grid grid-cols-2 gap-3">
      <div className="grid gap-3">
        {left.map((w) => (
          <button key={w} disabled={done.includes(w)} onClick={() => choose("l", w)} className={`option text-center ${tone(w, pick.l === w, done.includes(w))}`}>{w}</button>
        ))}
      </div>
      <div className="grid gap-3">
        {right.map((w) => {
          const matched = done.some((l) => pairs.some((p) => p[0] === l && p[1] === w));
          return <button key={w} disabled={matched} onClick={() => choose("r", w)} className={`option text-center ${tone(w, pick.r === w, matched)}`}>{w}</button>;
        })}
      </div>
    </div>
  );
}
