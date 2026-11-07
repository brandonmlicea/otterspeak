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
    const kinds = lang
      ? `- choose: pick the meaning of a word or phrase. {"type":"choose","prompt":"Which one means \\"the cat\\"?","choices":["el gato","el perro","la casa"],"answer":0,"say":"el gato"}
- build: translate a sentence by putting word tiles in order; tiles are the exact answer split into words (or characters for languages without spaces), extra are 2 to 4 wrong tiles. {"type":"build","prompt":"I drink water","tiles":["Yo","bebo","agua"],"extra":["como","leche"]} Mix directions: sometimes the prompt is in ${name} and the tiles in English (then "say" is the ${name} prompt).
- type: write a short translation; answers lists every accepted answer. {"type":"type","prompt":"Translate: good morning","answers":["buenos días","buen día"]}
- fill: complete the sentence; the prompt has ___ for the gap. {"type":"fill","prompt":"Yo ___ agua.","choices":["bebo","bebes","beben"],"answer":0}
- pairs: match 4 or 5 ${name} words with their English meanings. {"type":"pairs","pairs":[["gato","cat"],["perro","dog"],["casa","house"],["agua","water"]]}
"say" is the ${name} text to read aloud (omit it when the prompt is English only). Write ${name} in its own script with its accents, never romanized. In a choose exercise "say" must not give the answer away.`
      : `- choose: a question with 3 or 4 choices. {"type":"choose","prompt":"...","choices":["...","...","..."],"answer":0}
- fill: a statement with ___ for the gap and 3 or 4 choices. {"type":"fill","prompt":"... ___ ...","choices":["...","...","..."],"answer":0}
- type: a short question whose answer is a number or a word or two; answers lists every accepted form. {"type":"type","prompt":"...","answers":["12","twelve"]}
- pairs: match 4 or 5 terms with their meanings or results. {"type":"pairs","pairs":[["...","..."],["...","..."],["...","..."],["...","..."]]}`;
    const system = `You write one bite-sized lesson for a friendly learning app. Reply with one JSON object only, shaped {"exercises":[...],"words":["..."]}.
Write 10 exercises, easy to harder, that drill the lesson focus at the learner's level, mixing these kinds (put "answer" as the index of the right choice):
${kinds}
Every exercise must have exactly one right answer and be correct. Keep prompts short. "words" lists the key ${lang ? `${name} words` : "terms"} this lesson teaches.`;
    const user = `Course: ${name}\nLevel: ${level}\nUnit: ${unit}\nLesson focus: ${focus}${words.length ? `\nWords the learner already met (reuse some for review): ${words.join(", ")}` : ""}${review ? "\nThis is a review lesson: practise only what the learner already met." : ""}`;
    const make = async (): Promise<Lesson> => {
      for (let attempt = 0; attempt < 2; attempt++) {
        const raw = await askJson(system, user, 3000);
        const exercises = (Array.isArray(raw.exercises) ? raw.exercises : []).map((e: Record<string, unknown>) => clean(e, !!lang)).filter((e): e is Exercise => !!e).slice(0, 12);
        if (exercises.length >= 6) return { exercises, words: texts(raw.words, 40).slice(0, 12) };
      }
      throw new Refusal("The lesson came back short. Try again.", 502);
    };
    return review ? make() : cached(`lesson:v3:${name}:${level}:${unit}:${focus}`, make);
  });
