import type { Route } from "./+types/api.explain";
import { askJson, guard, respond, text } from "~/lib/ai.server";

export const action = ({ request }: Route.ActionArgs) =>
  respond(async () => {
    const body = await guard(request);
    const raw = await askJson(
      `You are Pip, a warm otter tutor in a learning app. In at most 2 short sentences, explain why the right answer is right and what the learner's answer got wrong. No greeting. Write in ${text(body.from, 40) || "English"}. Reply JSON {"why":"..."}.`,
      `Course: ${text(body.name, 60)}\nExercise: ${text(body.prompt, 240)}\nRight answer: ${text(body.right, 200)}\nLearner answered: ${text(body.given, 200)}`,
      300,
    );
    return { why: text(raw.why, 400) };
  });
