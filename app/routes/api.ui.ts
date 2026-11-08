import type { Route } from "./+types/api.ui";
import { Refusal, askJson, cached, guard, respond, text } from "~/lib/ai.server";
import { EN } from "~/lib/en";

const keys = Object.keys(EN) as (keyof typeof EN)[];
const holes = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort().join();

export const action = ({ request }: Route.ActionArgs) =>
  respond(async () => {
    const lang = text((await guard(request)).lang, 40);
    if (!lang) throw new Refusal("Missing language", 400);
    return cached(`ui:v2:${keys.length}:${lang}`, async () => {
      const raw = await askJson(
        `Translate the values of this JSON object from English into ${lang}, for the buttons and messages of a friendly learning app. Keep every key exactly, keep every {placeholder} exactly, and keep each value as short and natural as the English. Pip and Otterspeak are names: never translate them. Reply with the JSON object only.`,
        JSON.stringify(EN),
        8000,
        0.2,
      );
      const proof = await askJson(
        `You proofread a ${lang} translation of a learning app's interface. Fix every spelling, grammar or wording mistake so each value reads like a native ${lang} app (for example, the button "skip" must be the usual ${lang} word for skip). Keep every key and {placeholder} exactly. Reply with the corrected JSON object only.`,
        JSON.stringify(raw),
        8000,
        0.1,
      ).catch(() => raw);
      return Object.fromEntries(keys.map((k) => {
        const v = text(proof[k], 240) || text(raw[k], 240);
        return [k, v && holes(v) === holes(EN[k]) ? v : EN[k]];
      }));
    });
  });
