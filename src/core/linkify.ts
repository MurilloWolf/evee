export type TextSegment =
  | { type: "text"; value: string }
  | {
      type: "link";
      /** Exact source text ("[label](url)" or the bare URL). */
      value: string;
      /** Text to display: the markdown label, or the URL itself when bare. */
      label: string;
      url: URL;
      /** true for "[label](url)", false for a bare URL/path. */
      markdown: boolean;
    };

// [label](url) | absolute http(s) URL | app-relative path ("/schedules/1?x=2").
const LINK_RE =
  /\[([^\]\n]{1,200})\]\(([^)\s]+)\)|\bhttps?:\/\/[^\s<>"']+|(?<![\w/\])])\/[\w\-./?=&%#:+~]*[\w\-/=&%#+~]/g;
// Trailing punctuation that is almost never part of a bare URL ("veja https://x.com.").
const TRAILING = /[.,;:!?)\]]+$/;

/**
 * Splits text into plain/link segments. Supports markdown-style `[label](url)`,
 * absolute http(s) URLs and app-relative paths. Only URLs whose origin is in
 * `allowedOrigins` become links; anything else stays as text (anti-phishing).
 * A disallowed `[label](url)` renders as "label (url)" so the real target is visible.
 */
export function linkify(text: string, allowedOrigins: string[], base?: string): TextSegment[] {
  const origin = base ?? allowedOrigins[0];
  const segments: TextSegment[] = [];
  let last = 0;
  const pushText = (value: string) => {
    if (!value) return;
    const prev = segments.at(-1);
    if (prev?.type === "text") prev.value += value;
    else segments.push({ type: "text", value });
  };

  for (const match of text.matchAll(LINK_RE)) {
    const [whole, mdLabel, mdHref] = match;
    const markdown = mdLabel !== undefined;
    const raw = markdown ? whole : whole.replace(TRAILING, "");
    const href = markdown ? mdHref! : raw;
    const start = match.index;
    const url = toAllowedUrl(href, allowedOrigins, origin);

    pushText(text.slice(last, start));
    if (url) segments.push({ type: "link", value: raw, label: markdown ? mdLabel.trim() : raw, url, markdown });
    else pushText(markdown ? `${mdLabel} (${href})` : raw);
    last = start + raw.length;
  }
  pushText(text.slice(last));
  return segments;
}

function toAllowedUrl(raw: string, allowedOrigins: string[], base?: string): URL | null {
  try {
    const url = base ? new URL(raw, base) : new URL(raw);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return allowedOrigins.includes(url.origin) ? url : null;
  } catch {
    return null;
  }
}
