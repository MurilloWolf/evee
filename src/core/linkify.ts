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
      /** Origin outside `allowedOrigins` (only when `allowExternal`). */
      external: boolean;
    };

export interface LinkifyOptions {
  /** Base for app-relative paths. Defaults to the first allowed origin. */
  base?: string;
  /** Also link http(s) URLs from other origins, flagged `external`. */
  allowExternal?: boolean;
}

// [label](url) | absolute http(s) URL | app-relative path ("/schedules/1?x=2").
const LINK_RE =
  /\[([^\]\n]{1,200})\]\(([^)\s]+)\)|\bhttps?:\/\/[^\s<>"']+|(?<![\w/\])])\/[\w\-./?=&%#:+~]*[\w\-/=&%#+~]/g;
// Trailing punctuation that is almost never part of a bare URL ("veja https://x.com.").
const TRAILING = /[.,;:!?)\]]+$/;

/**
 * Splits text into plain/link segments. Supports markdown-style `[label](url)`,
 * absolute http(s) URLs and app-relative paths. Only URLs whose origin is in
 * `allowedOrigins` become links, unless `allowExternal` (then other http(s)
 * origins become links flagged `external`); anything else stays as text.
 * A disallowed `[label](url)` renders as "label (url)" so the real target is visible.
 */
export function linkify(text: string, allowedOrigins: string[], options: LinkifyOptions = {}): TextSegment[] {
  const origin = options.base ?? allowedOrigins[0];
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
    const url = toUrl(href, origin);
    const internal = !!url && allowedOrigins.includes(url.origin);
    const allowed = !!url && (internal || !!options.allowExternal);

    pushText(text.slice(last, start));
    if (allowed)
      segments.push({ type: "link", value: raw, label: markdown ? mdLabel.trim() : raw, url, markdown, external: !internal });
    else pushText(markdown ? `${mdLabel} (${href})` : raw);
    last = start + raw.length;
  }
  pushText(text.slice(last));
  return segments;
}

/** Parses http(s) only; anything else (javascript:, data:, mailto:...) is rejected. */
function toUrl(raw: string, base?: string): URL | null {
  try {
    const url = base ? new URL(raw, base) : new URL(raw);
    return url.protocol === "http:" || url.protocol === "https:" ? url : null;
  } catch {
    return null;
  }
}
