import type { Route } from "./+types/api.course";
import { Refusal, askJson, cached, guard, respond, text, texts } from "~/lib/ai.server";
import type { Unit } from "~/lib/store";

export const action = ({ request }: Route.ActionArgs) =>
  respond(async () => {
    const body = await guard(request);
    const name = text(body.name, 60);
    const level = text(body.level, 80);
    const after = texts(body.after, 80).slice(-40);
    const from = text(body.from, 40) || "English";
    if (!name || !level) throw new Refusal("Missing course", 400);
    const system = `You plan bite-sized self-study courses in the style of a friendly learning app. Reply with one JSON object only, shaped {"units":[{"title":"...","about":"...","lessons":["...","...","...","...","..."]}]}.
Write 6 units in the "units" array, each with exactly 5 lessons. A title is 2 to 5 words. "about" is one short sentence of what the learner can do after the unit. Each lesson is a short, concrete focus (for a language: the words, phrases or grammar it drills, e.g. "Greetings: hola, adiós, buenos días"). Start exactly at the learner's level and build up gradually. The learner speaks ${from}: write titles, "about" and lessons in ${from}, quoting the course's own words where they belong.`;
    const user = `Course: ${name}\nLearner's level: ${level}${after.length ? `\nThe learner already finished these units, so continue after them: ${after.join("; ")}` : ""}`;
    return cached(`course:v2:${from}:${name}:${level}:${after.join("|")}`, async () => {
      const raw = await askJson(system, user, 2500);
      const units: Unit[] = (Array.isArray(raw.units) ? raw.units : [])
        .map((u: Record<string, unknown>) => ({ title: text(u.title, 60), about: text(u.about, 160), lessons: texts(u.lessons, 120).slice(0, 5) }))
        .filter((u: Unit) => u.title && u.lessons.length === 5);
      if (units.length < 3) throw new Refusal("The course plan came back short. Try again.", 502);
      return { units };
    });
  });
