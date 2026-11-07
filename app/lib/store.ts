import { useSyncExternalStore } from "react";
import type { Course } from "./courses";

export type Unit = { title: string; about: string; lessons: string[] };
export type Exercise =
  | { type: "choose"; prompt: string; say?: string; choices: string[]; answer: number }
  | { type: "fill"; prompt: string; say?: string; choices: string[]; answer: number }
  | { type: "build"; prompt: string; say?: string; tiles: string[]; extra: string[] }
  | { type: "type"; prompt: string; say?: string; answers: string[] }
  | { type: "pairs"; prompt: string; pairs: [string, string][] };
export type Lesson = { exercises: Exercise[]; words: string[] };
export type Track = { course: Course; from?: string; level: number; outline: Unit[]; done: number };
export type Day = { date: string; xp: number; lessons: number; run: number; best: number };

export type State = {
  active: string | null;
  tracks: Record<string, Track>;
  xp: number;
  lessons: number;
  day: Day;
  streak: { count: number; last: string };
  streakGoal: number;
  goal: number;
  hearts: { n: number; at: number };
  heard: string;
  name: string;
  words: string[];
  seen: { quests: string; profile: boolean };
};

export const MAX_HEARTS = 5;
const REFILL = 30 * 60 * 1000;
const KEY = "otterspeak";

export const today = (d = new Date()) => d.toLocaleDateString("en-CA");
const yesterday = () => today(new Date(Date.now() - 864e5));
const blankDay = (): Day => ({ date: today(), xp: 0, lessons: 0, run: 0, best: 0 });

const fresh = (): State => ({
  active: null,
  tracks: {},
  xp: 0,
  lessons: 0,
  day: blankDay(),
  streak: { count: 0, last: "" },
  streakGoal: 0,
  goal: 20,
  hearts: { n: MAX_HEARTS, at: Date.now() },
  heard: "",
  name: "",
  words: [],
  seen: { quests: "", profile: false },
});

let cache: State | null = null;
const subs = new Set<() => void>();

function settle(s: State) {
  if (s.day.date !== today()) s.day = blankDay();
  if (s.streak.last !== today() && s.streak.last !== yesterday()) s.streak.count = 0;
  const gained = Math.floor((Date.now() - s.hearts.at) / REFILL);
  if (s.hearts.n >= MAX_HEARTS) s.hearts = { n: MAX_HEARTS, at: Date.now() };
  else if (gained > 0) s.hearts = { n: Math.min(MAX_HEARTS, s.hearts.n + gained), at: s.hearts.at + gained * REFILL };
  return s;
}

export function read(): State {
  if (!cache) {
    try {
      cache = settle({ ...fresh(), ...JSON.parse(localStorage.getItem(KEY) || "{}") });
    } catch {
      cache = fresh();
    }
  }
  return cache;
}

export function write(change: (s: State) => void) {
  const s = settle(structuredClone(read()));
  change(s);
  cache = s;
  localStorage.setItem(KEY, JSON.stringify(s));
  subs.forEach((f) => f());
}

export function reset() {
  localStorage.removeItem(KEY);
  cache = null;
  subs.forEach((f) => f());
}

export function useStore(): State | null {
  return useSyncExternalStore(
    (f) => {
      subs.add(f);
      return () => subs.delete(f);
    },
    read,
    () => null,
  );
}

export const track = (s: State) => (s.active ? s.tracks[s.active] : undefined);

export function quests(s: State) {
  return [
    { label: `Earn ${s.goal} XP`, have: s.day.xp, need: s.goal },
    { label: "Complete 2 lessons", have: s.day.lessons, need: 2 },
    { label: "Get 10 in a row correct", have: s.day.best, need: 10 },
  ];
}

export const questsDone = (s: State) => quests(s).every((q) => q.have >= q.need);

export function finish(s: State, xp: number, words: string[], lessonIndex: number | null) {
  s.xp += xp;
  s.lessons += 1;
  s.day.xp += xp;
  s.day.lessons += 1;
  if (s.streak.last !== today()) {
    s.streak.count = s.streak.last === yesterday() ? s.streak.count + 1 : 1;
    s.streak.last = today();
  }
  s.words = [...new Set([...words, ...s.words])].slice(0, 200);
  const t = track(s);
  if (t && lessonIndex !== null && lessonIndex >= t.done) t.done = lessonIndex + 1;
}

export function loseHeart(s: State) {
  if (s.hearts.n >= MAX_HEARTS) s.hearts.at = Date.now();
  s.hearts.n = Math.max(0, s.hearts.n - 1);
}

export function nextHeartIn(s: State) {
  return s.hearts.n >= MAX_HEARTS ? 0 : Math.max(0, s.hearts.at + REFILL - Date.now());
}

export async function post<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error((await res.text()) || `Error ${res.status}`);
  return res.json();
}
