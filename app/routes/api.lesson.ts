import type { Route } from "./+types/api.lesson";
import { Refusal, askJson, cached, guard, respond, text, texts } from "~/lib/ai.server";
import type { Exercise, Lesson } from "~/lib/store";

const shuffle = <T,>(xs: T[]) => xs.map((x) => [Math.random(), x] as const).sort((a, b) => a[0] - b[0]).map(([, x]) => x);

function clean(e: Record<string, unknown>, lang: boolean): Exercise | null {
  const prompt = text(e.prompt, 240);
  const say = lang ? text(e.say, 200) || undefined : undefined;
  if (e.type === "choose" || e.type === "fill") {
    const choices = [...new Set(texts(e.choices, 80))].slice(0, 4);
    const right = choices[Number(e.answer)];
    if (!prompt || choices.length < 2 || right === undefined || (e.type === "fill" && !prompt.includes("___"))) return null;
    const mixed = shuffle(choices);
    const quiet = say && choices.some((c) => say.toLowerCase().includes(c.toLowerCase())) ? undefined : say;
    return { type: e.type, prompt, say: quiet, choices: mixed, answer: mixed.indexOf(right) };
  }
  if (e.type === "build" && lang) {
    const tiles = texts(e.tiles, 40).slice(0, 12);
    if (tiles.length < 3) return null;
    const extra = texts(e.extra, 40).filter((x) => !tiles.includes(x)).slice(0, 6);
    const flat = (x: string) => x.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
    return prompt && tiles.length ? { type: "build", prompt, say: say && flat(say) === flat(tiles.join("")) ? undefined : say, tiles, extra } : null;
  }
  if (e.type === "type") {
    const answers = texts(e.answers, 120).slice(0, 6);
    return prompt && answers.length ? { type: "type", prompt, say, answers } : null;
  }
  if (e.type === "pairs" && Array.isArray(e.pairs)) {
    const pairs = e.pairs.map((p) => texts(p, 60)).filter((p) => p.length === 2).slice(0, 5) as [string, string][];
    const unique = new Set(pairs.map((p) => p[0])).size === pairs.length && new Set(pairs.map((p) => p[1])).size === pairs.length;
    return pairs.length >= 3 && unique ? { type: "pairs", prompt: prompt || "Tap the matching pairs", pairs } : null;
  }
  return null;
}

export const action = ({ request }: Route.ActionArgs) =>
  respond(async () => {
    const body = await guard(request);
    const name = text(body.name, 60);
    const lang = text(body.lang, 10);
    const level = text(body.level, 80);
    const unit = text(body.unit, 200);
    const focus = text(body.focus, 200);
    const words = texts(body.words, 40).slice(0, 40);
    const review = body.review === true;
    if (!name || !focus) throw new Refusal("Missing lesson", 400);
    const from = text(body.from, 40) || "English";
    const kinds = lang
      ? `- choose: what a ${name} word or phrase means. {"type":"choose","prompt":"What does «el gato» mean?","choices":["the cat","the dog","the house"],"answer":0,"say":"el gato"}
- build: translate a whole sentence of 3 to 8 words by putting word tiles in order; tiles are the exact answer split into words (or characters for languages without spaces), extra are 2 to 4 wrong tiles. Alternate directions: ${from} to ${name} ({"type":"build","prompt":"Translate into ${name}: I drink water every day","tiles":["Bebo","agua","todos","los","días"],"extra":["como","leche"]}) and ${name} to ${from} (then "say" is the ${name} sentence).
- type: write a short translation of a phrase of 2 to 6 words; answers lists every natural accepted answer. {"type":"type","prompt":"Write in ${name}: good morning, Ana","answers":["buenos días, Ana","buen día, Ana"]}
- fill: a ${name} sentence with ___ for the missing word, 3 choices. {"type":"fill","prompt":"Yo ___ agua. (I drink water.)","choices":["bebo","bebes","beben"],"answer":0}
- pairs: match 4 or 5 ${name} words with their ${from} meanings. {"type":"pairs","pairs":[["gato","cat"],["perro","dog"],["casa","house"],["agua","water"]]}
"say" is the ${name} text to read aloud, never the answer itself. Write ${name} in its own script with its accents, never romanized.`
      : `- choose: a question with 3 or 4 choices. {"type":"choose","prompt":"...","choices":["...","...","..."],"answer":0}
- fill: a statement with ___ for the gap and 3 or 4 choices. {"type":"fill","prompt":"... ___ ...","choices":["...","...","..."],"answer":0}
- type: a short question whose answer is a number or a word or two; answers lists every accepted form. {"type":"type","prompt":"...","answers":["12","twelve"]}
- pairs: match 4 or 5 terms with their meanings or results. {"type":"pairs","pairs":[["...","..."],["...","..."],["...","..."],["...","..."]]}`;
    const system = `You write one bite-sized lesson for a learning app. The learner speaks ${from}${lang ? ` and is learning ${name}` : ""}. Reply with one JSON object only, shaped {"exercises":[...],"words":["..."]}.
Write 10 exercises, easy to harder, that drill the lesson focus at the learner's level, mixing these kinds ("answer" is the index of the right choice):
${kinds}
Rules:
- Write every prompt and every explanation in ${from}. A prompt says exactly what to do${lang ? ` and which language to answer in ("Translate into ${name}: …", "What does «…» mean?"). Never a bare "Translate: X"` : ""}.
- Use real, useful content a teacher would choose, never filler or trick questions.
- Each exercise has exactly one right answer, the right answer is always among the choices, and the wrong choices are clearly wrong.
"words" lists the key ${lang ? `${name} words` : "terms"} this lesson teaches.`;
    const user = `Course: ${name}\nLevel: ${level}\nUnit: ${unit}\nLesson focus: ${focus}${words.length ? `\nWords the learner already met (reuse some for review): ${words.join(", ")}` : ""}${review ? "\nThis is a review lesson: practise only what the learner already met." : ""}`;
    const audit = `You check exercises written for a ${name} lesson for a learner who speaks ${from}. Reply with one JSON object only: {"bad":[indexes]}. List an exercise's index when its right answer is wrong, another choice could also be accepted (a synonym or another normal way to say it), the right answer is missing from the choices, its ${lang ? `${name} has a mistake, ` : ""}or its prompt is unclear about what to do. List nothing else.`;
    const make = async (): Promise<Lesson> => {
      for (let attempt = 0; attempt < 2; attempt++) {
        const raw = await askJson(system, user, 3000);
        const drafted = (Array.isArray(raw.exercises) ? raw.exercises : []).map((e: Record<string, unknown>) => clean(e, !!lang)).filter((e): e is Exercise => !!e).slice(0, 12);
        const shown = drafted.map((e, i) => `${i}. ${JSON.stringify("choices" in e ? { ...e, right: e.choices[e.answer] } : e)}`).join("\n");
        const verdict = drafted.length ? await askJson(audit, shown, 300, 0.1).catch(() => ({ bad: [] })) : { bad: [] };
        const bad = new Set((Array.isArray(verdict.bad) ? verdict.bad : []).map(Number));
        const exercises = drafted.filter((_, i) => !bad.has(i));
        if (exercises.length >= 6) return { exercises, words: texts(raw.words, 40).slice(0, 12) };
      }
      throw new Refusal("The lesson came back short. Try again.", 502);
    };
    return review ? make() : cached(`lesson:v5:${from}:${name}:${level}:${unit}:${focus}`, make);
  });
