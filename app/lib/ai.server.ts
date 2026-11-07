import { env } from "cloudflare:workers";

type Limit = { limit(o: { key: string }): Promise<{ success: boolean }> };
const vars = env as { AI_BASE_URL?: string; AI_MODEL?: string; AI_API_KEY?: string; LIMIT?: Limit };

export class Refusal extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

export async function guard(request: Request) {
  if (request.method !== "POST") throw new Refusal("POST only.", 405);
  const ip = request.headers.get("cf-connecting-ip") ?? "local";
  if (vars.LIMIT && !(await vars.LIMIT.limit({ key: ip })).success) throw new Refusal("Pip needs a breather. Try again in a minute.", 429);
  return (await request.json()) as Record<string, unknown>;
}

export async function askJson(system: string, user: string, maxTokens: number): Promise<Record<string, unknown>> {
  const base = (vars.AI_BASE_URL || "https://inference.celeris.ai/celeris-1/v1").replace(/\/+$/, "");
  if (!vars.AI_API_KEY) throw new Refusal("No AI key yet. Put AI_API_KEY in .dev.vars (or run wrangler secret put AI_API_KEY).", 503);
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${vars.AI_API_KEY}` },
      body: JSON.stringify({
        model: vars.AI_MODEL || "celeris-1",
        max_tokens: maxTokens,
        temperature: attempt ? 0.4 : 0.7,
        ...(base.includes("celeris.ai") ? { chat_template_kwargs: { enable_thinking: false } } : {}),
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });
    if (!res.ok) throw new Refusal(`The AI API answered ${res.status}: ${(await res.text()).slice(0, 300)}`, 502);
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const text = data.choices?.[0]?.message?.content ?? "";
    try {
      return JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1));
    } catch {
      if (attempt >= 2) throw new Refusal("The model did not answer in JSON. Try again.", 502);
    }
  }
}

export async function cached<T>(key: string, make: () => Promise<T>): Promise<T> {
  const store = (globalThis.caches as unknown as { default?: Cache }).default;
  const url = `https://cache.otterspeak.local/${encodeURIComponent(key)}`;
  const hit = await store?.match(url);
  if (hit) return hit.json() as Promise<T>;
  const value = await make();
  await store?.put(url, new Response(JSON.stringify(value), { headers: { "Cache-Control": "max-age=604800", "Content-Type": "application/json" } }));
  return value;
}

export async function respond(work: () => Promise<unknown>) {
  try {
    return Response.json(await work());
  } catch (e) {
    if (e instanceof Refusal) return new Response(e.message, { status: e.status });
    throw e;
  }
}

export const text = (v: unknown, max = 200) => (typeof v === "string" ? v.trim().slice(0, max) : "");
export const texts = (v: unknown, max = 200) => (Array.isArray(v) ? v.map((x) => text(x, max)).filter(Boolean) : []);
