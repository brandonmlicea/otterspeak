import { useEffect } from "react";
import type { Course } from "./courses";
import { EN, type Key } from "./en";
import { post, read, track, useStore, write } from "./store";

const loading = new Set<string>();

export function loadWords(lang: string) {
  if (!lang || lang === "English" || loading.has(lang) || read().ui?.[lang]) return;
  loading.add(lang);
  post<Record<string, string>>("/api/ui", { lang })
    .then((dict) => write((s) => void (s.ui = { ...s.ui, [lang]: dict })))
    .catch(() => {})
    .finally(() => loading.delete(lang));
}

export type Say = (key: Key, vars?: Record<string, string | number>) => string;

export function useWords(lang?: string): Say {
  const s = useStore();
  const from = lang ?? (s ? track(s)?.from : undefined) ?? "English";
  const dict = s?.ui?.[from];
  useEffect(() => loadWords(from), [from]);
  return (key, vars) => (dict?.[key] || EN[key]).replace(/\{(\w+)\}/g, (_, v) => String(vars?.[v] ?? ""));
}

export const courseName = (w: Say, c: Course) => (`course_${c.id}` in EN ? w(`course_${c.id}` as Key) : c.name);
