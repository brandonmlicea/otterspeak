import { Link } from "react-router";
import { Pip } from "./pip";

export const GITHUB = "https://github.com/brandonmlicea/otterspeak";

export function Logo({ to = "/" }: { to?: string }) {
  return (
    <Link to={to} id="logo" className="flex items-center gap-2 text-2xl font-black tracking-tight text-sea-ink">
      <Pip size={40} />
      otterspeak
    </Link>
  );
}

export function Flame({ on = true, size = 24 }: { on?: boolean; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden>
      <path d="M12 2c1 4 6 6 6 12a6 6 0 0 1-12 0c0-3 2-5 3-6 0 2 1 3 2 3 0-3-1-6 1-9z" fill={on ? "var(--os-coral)" : "var(--os-locked)"} />
      <path d="M12 12c1 2 3 3 3 5a3 3 0 0 1-6 0c0-1 1-2 1-3 1 1 2 0 2-2z" fill={on ? "var(--os-sun)" : "var(--os-line)"} />
    </svg>
  );
}

export function Bolt({ size = 24 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden>
      <path d="M13 2 4 14h7l-1 8 9-12h-7z" fill="var(--os-sun)" stroke="color-mix(in oklab, var(--os-sun), black 25%)" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  );
}

export function Heart({ on = true, size = 24 }: { on?: boolean; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden>
      <path d="M12 21s-8-5-8-11a4.5 4.5 0 0 1 8-3 4.5 4.5 0 0 1 8 3c0 6-8 11-8 11z" fill={on ? "var(--os-heart)" : "var(--os-locked)"} />
      <ellipse cx="8.5" cy="9" rx="2" ry="1.3" fill="#fff" opacity=".5" />
    </svg>
  );
}

export function Speaker({ text, lang }: { text: string; lang?: string }) {
  if (!lang) return null;
  return (
    <button type="button" onClick={() => speak(text, lang)} aria-label="Listen" className="btn btn-sea size-12 shrink-0 px-0">
      <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" aria-hidden>
        <path d="M4 9h4l5-4v14l-5-4H4z" />
        <path d="M16 8a5 5 0 0 1 0 8M18.5 5.5a8.5 8.5 0 0 1 0 13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </button>
  );
}

export function speak(text: string, lang?: string) {
  if (!lang || typeof speechSynthesis === "undefined") return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang;
  u.rate = 0.9;
  speechSynthesis.speak(u);
}

export function Splash() {
  return (
    <main className="grid min-h-svh place-items-center">
      <Pip size={120} className="animate-bounce motion-reduce:animate-none" />
    </main>
  );
}

const loose = (s: string) => s.toLowerCase().replace(/[.,!?¿¡;:"“”«»。、！？]/g, "").replace(/\s+/g, " ").trim();
const bare = (s: string) => loose(s).normalize("NFD").replace(/\p{M}/gu, "").replace(/\s/g, "");

export function matches(given: string, accepted: string[]) {
  if (accepted.some((a) => loose(a).replace(/\s/g, "") === loose(given).replace(/\s/g, ""))) return { ok: true };
  const close = accepted.find((a) => bare(a) === bare(given));
  return close ? { ok: true, note: `Mind the accents: ${close}` } : { ok: false };
}
