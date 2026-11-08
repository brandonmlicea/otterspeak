import { EN, type Key } from "./en";

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

export const levelKeys = (c: Course) =>
  (c.lang ? ["lang0", "lang1", "lang2", "lang3", "lang4"] : c.id === "math" ? ["math0", "math1", "math2", "math3", "math4"] : ["topic0", "topic1", "topic2", "topic3"]) as Key[];

export const levelsFor = (c: Course) => levelKeys(c).map((k) => EN[k].replace("{course}", c.name));

export const GOALS = [
  { min: 5, xp: 10, label: "casual" },
  { min: 10, xp: 20, label: "regular" },
  { min: 15, xp: 30, label: "serious" },
  { min: 20, xp: 50, label: "intense" },
] as const;

export const STREAKS = [
  { days: 7, label: "good" },
  { days: 14, label: "great" },
  { days: 30, label: "incredible" },
  { days: 50, label: "unstoppable" },
] as const;

export const SPEAKS: [string, string][] = [
  ["English", "English"], ["Spanish", "Español"], ["Portuguese", "Português"], ["French", "Français"], ["German", "Deutsch"],
  ["Italian", "Italiano"], ["Dutch", "Nederlands"], ["Swedish", "Svenska"], ["Norwegian", "Norsk"], ["Danish", "Dansk"],
  ["Finnish", "Suomi"], ["Polish", "Polski"], ["Czech", "Čeština"], ["Slovak", "Slovenčina"], ["Hungarian", "Magyar"],
  ["Romanian", "Română"], ["Greek", "Ελληνικά"], ["Turkish", "Türkçe"], ["Russian", "Русский"], ["Ukrainian", "Українська"],
  ["Arabic", "العربية"], ["Hebrew", "עברית"], ["Persian", "فارسی"], ["Hindi", "हिन्दी"], ["Bengali", "বাংলা"],
  ["Urdu", "اردو"], ["Punjabi", "ਪੰਜਾਬੀ"], ["Tamil", "தமிழ்"], ["Telugu", "తెలుగు"], ["Marathi", "मराठी"],
  ["Chinese", "中文"], ["Japanese", "日本語"], ["Korean", "한국어"], ["Vietnamese", "Tiếng Việt"], ["Thai", "ไทย"],
  ["Indonesian", "Bahasa Indonesia"], ["Malay", "Bahasa Melayu"], ["Filipino", "Filipino"], ["Swahili", "Kiswahili"], ["Catalan", "Català"],
];

export const SOURCES = ["src0", "src1", "src2", "src3", "src4", "src5", "src6", "src7", "src8"] as const;

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
