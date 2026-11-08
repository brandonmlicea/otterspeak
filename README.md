# Otterspeak

**Learn anything in five minutes a day, with Pip the otter.** An open-source, Duolingo-style learning app: pick a language, math or any topic you type, and an AI model writes your course and every lesson at your level.

Live: https://otterspeak.brandonlicea61.workers.dev · Landing: https://otterspeak-landing.brandonlicea61.workers.dev ([source](https://github.com/brandonmlicea/otterspeak-landing))

- **Everything in your language.** Pip asks which of 40 languages you already speak. The whole interface switches to it (translated once by the model, proofread, then cached), Pip writes every instruction in it, and names the direction of each exercise ("Translate into Spanish: …"). A second, quick pass checks each exercise and drops the ones with a wrong or missing answer.
- **The whole learning loop.** Pick a course, meet Pip, set your language, level and daily goal, then learn on a path of units and lessons. After your first lesson you set a streak goal and a profile.
- **Five kinds of exercise.** Pick the answer, fill the blank, build a sentence from word tiles, type the answer, match the pairs. Mistakes come back at the end of the lesson, accents are forgiven with a hint, "Why?" asks Pip to explain, and language prompts are read aloud with the browser's own voices.
- **Game loop.** XP, streaks with a streak goal, 5 hearts that refill one every 30 minutes (or by practising), three daily quests, and a perfect-lesson bonus.
- **Any course.** 16 languages, math, or anything you type ("chess openings", "music theory"). The course plan is 6 units of 5 lessons, and "Unlock more units" writes the next 6.
- **No accounts, no database.** Progress lives in the browser's localStorage. The server only talks to the model, behind a per-IP rate limit, and caches each course plan and lesson for a week.

## Run it

```bash
git clone https://github.com/brandonmlicea/otterspeak && cd otterspeak
pnpm install
echo "AI_API_KEY=your-key" > .dev.vars
pnpm dev
```

## Any OpenAI-compatible model

Otterspeak calls `POST {AI_BASE_URL}/chat/completions` and reads one JSON object from the reply. By default that is [Celeris](https://celeris.ai) (`celeris-1`), set in `wrangler.json`:

```json
"vars": { "AI_BASE_URL": "https://inference.celeris.ai/celeris-1/v1", "AI_MODEL": "celeris-1" }
```

Point it at any other server that speaks the OpenAI chat API, open models included:

| Host | AI_BASE_URL | AI_MODEL |
| --- | --- | --- |
| Ollama (local) | `http://localhost:11434/v1` | `qwen3:8b` |
| vLLM / llama.cpp server | `http://localhost:8000/v1` | your model id |
| Together | `https://api.together.xyz/v1` | `meta-llama/Llama-3.3-70B-Instruct-Turbo` |
| OpenRouter | `https://openrouter.ai/api/v1` | any model id |
| OpenAI | `https://api.openai.com/v1` | `gpt-4o-mini` |

Put overrides in `.dev.vars` for local runs. A bigger model writes fewer wrong exercises. The server checks the shape of every exercise, then asks the model to review the lesson and drops what it flags; that catches most mistakes, not all.

## Deploy

```bash
pnpm wrangler login
pnpm run deploy
pnpm wrangler secret put AI_API_KEY
```

It is a Cloudflare Worker (React Router 8, Tailwind 4). Change `name` in `wrangler.json` first. Anyone with the URL can spend your model credits, up to the rate limit in `wrangler.json` (30 calls a minute per IP).

## Where things are

- `app/routes/welcome.tsx`, `setup.tsx`: the course picker and the onboarding questions
- `app/routes/learn.tsx`: the path, stats and daily quests
- `app/routes/lesson.tsx`, `app/components/exercise.tsx`, `after.tsx`: the lesson player and the screens after it
- `app/routes/api.course.ts`, `api.lesson.ts`, `api.explain.ts`, `app/lib/ai.server.ts`: the prompts, the checks and the model call
- `app/lib/store.ts`: progress, XP, streaks, hearts and quests
- `app/components/pip.tsx`: Pip, in three moods

Pip and Otterspeak are original and not affiliated with Duolingo.

## License

MIT
