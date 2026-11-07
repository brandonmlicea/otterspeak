export type Course = { id: string; name: string; lang?: string; hue: number; mark: string };

export const COURSES: Course[] = [
  { id: "es", name: "Spanish", lang: "es-ES", hue: 30, mark: "ES" },
  { id: "fr", name: "French", lang: "fr-FR", hue: 255, mark: "FR" },
  { id: "math", name: "Math", hue: 190, mark: "+−" },
  { id: "en", name: "English", lang: "en-US", hue: 220, mark: "EN" },
  { id: "ja", name: "Japanese", lang: "ja-JP", hue: 15, mark: "あ" },
  { id: "de", name: "German", lang: "de-DE", hue: 80, mark: "DE" },
  { id: "it", name: "Italian", lang: "it-IT", hue: 145, mark: "IT" },
  { id: "pt", name: "Portuguese", lang: "pt-BR", hue: 160, mark: "PT" },
  { id: "ko", name: "Korean", lang: "ko-KR", hue: 300, mark: "한" },
  { id: "zh", name: "Chinese", lang: "zh-CN", hue: 25, mark: "中" },
  { id: "hi", name: "Hindi", lang: "hi-IN", hue: 60, mark: "हि" },
  { id: "ar", name: "Arabic", lang: "ar-SA", hue: 170, mark: "ع" },
  { id: "ru", name: "Russian", lang: "ru-RU", hue: 240, mark: "Ру" },
  { id: "nl", name: "Dutch", lang: "nl-NL", hue: 50, mark: "NL" },
  { id: "sv", name: "Swedish", lang: "sv-SE", hue: 230, mark: "SV" },
  { id: "tr", name: "Turkish", lang: "tr-TR", hue: 20, mark: "TR" },
];

export const custom = (topic: string): Course => ({ id: `topic:${topic.toLowerCase().trim().replace(/\s+/g, "-")}`, name: topic.trim(), hue: 280, mark: topic.trim().slice(0, 1).toUpperCase() });

export const levelsFor = (c: Course) =>
  c.lang
    ? [`I'm new to ${c.name}`, "I know some common words", "I can have basic conversations", "I can talk about various topics", "I can discuss most topics in detail"]
    : c.id === "math"
      ? ["Counting and adding", "Times tables and fractions", "Pre-algebra", "Algebra and geometry", "Calculus and beyond"]
      : ["I'm brand new to this", "I know the basics", "I'm comfortable with it", "I want expert-level depth"];

export const GOALS = [
  { min: 5, xp: 10, label: "Casual" },
  { min: 10, xp: 20, label: "Regular" },
  { min: 15, xp: 30, label: "Serious" },
  { min: 20, xp: 50, label: "Intense" },
];

export const STREAKS = [
  { days: 7, label: "Good" },
  { days: 14, label: "Great" },
  { days: 30, label: "Incredible" },
  { days: 50, label: "Unstoppable" },
];

export const SPEAKS = ["English", "Spanish", "Portuguese", "French", "German", "Italian", "Hindi", "Chinese", "Japanese", "Korean", "Arabic", "Russian", "Turkish", "Dutch"];

export const SOURCES = ["Friends or family", "Google Search", "YouTube", "TikTok", "Instagram or Facebook", "News, article or blog", "GitHub", "Podcast", "Other"];

export function Mark({ c, size = 56 }: { c: Course; size?: number }) {
  return (
    <span
      aria-hidden
      className="inline-grid shrink-0 place-items-center rounded-lg font-medium text-white"
      style={{ width: size, height: size * 0.74, fontSize: size * 0.32, background: `oklch(0.5 0.09 ${c.hue})`, boxShadow: `inset 0 1px 0 oklch(1 0 0 / 0.2), 0 0 0 1px oklch(0.4 0.08 ${c.hue})` }}
    >
      {c.mark}
    </span>
  );
}
