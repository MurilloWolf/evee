import { linkify, type LinkifyOptions, type TextSegment } from "./linkify";

export type RichNode =
  | { type: "text"; value: string }
  | { type: "bold" | "italic" | "strike"; children: RichNode[] }
  | { type: "code"; value: string }
  | { type: "code-block"; value: string }
  | Extract<TextSegment, { type: "link" }>;

const CODE_BLOCK = /```(?:[\w-]*\n)?([\s\S]*?)```/g;
const CODE_SPAN = /`([^`\n]+)`/g;
// Order = priority. Content must start/end with non-space ("5 * 3 * 2" stays text);
// `_`/`*` italics can't touch word chars, so snake_case and 2*x*y stay text.
const EMPHASIS =
  /\*\*(\S(?:[\s\S]*?\S)?)\*\*|~~(\S(?:[\s\S]*?\S)?)~~|(?<![\w*])\*(\S(?:[\s\S]*?\S)?)\*(?![\w*])|(?<![\w_])_(\S(?:[\s\S]*?\S)?)_(?![\w_])/;

/**
 * Parses the chat's lightweight markdown into nodes (rendered as React elements, never HTML):
 * ```code block```, `code`, links (see `linkify`), **bold**, _italic_ / *italic*, ~~strike~~.
 * Code is parsed first and links before emphasis, so URLs and code are never styled.
 * ponytail: emphasis can't span across a link or code span; nest the other way ("[**x**](url)" shows "**x**").
 */
export function parseMessage(text: string, allowedOrigins: string[], options: LinkifyOptions = {}): RichNode[] {
  return splitBy(text, CODE_BLOCK, (code) => ({ type: "code-block", value: code.replace(/\n$/, "") }), (rest) =>
    splitBy(rest, CODE_SPAN, (code) => ({ type: "code", value: code }), (plain) =>
      linkify(plain, allowedOrigins, options).flatMap((seg) => (seg.type === "link" ? [seg] : emphasis(seg.value))),
    ),
  );
}

function splitBy(
  text: string,
  re: RegExp,
  onMatch: (inner: string) => RichNode,
  onRest: (text: string) => RichNode[],
): RichNode[] {
  const out: RichNode[] = [];
  let last = 0;
  for (const m of text.matchAll(re)) {
    if (m.index > last) out.push(...onRest(text.slice(last, m.index)));
    out.push(onMatch(m[1]!));
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(...onRest(text.slice(last)));
  return out;
}

function emphasis(text: string): RichNode[] {
  const m = EMPHASIS.exec(text);
  if (!m) return text ? [{ type: "text", value: text }] : [];
  const [whole, bold, strike, starItalic, underItalic] = m;
  const type = bold !== undefined ? "bold" : strike !== undefined ? "strike" : "italic";
  const inner = bold ?? strike ?? starItalic ?? underItalic!;
  return [
    ...emphasis(text.slice(0, m.index)),
    { type, children: emphasis(inner) },
    ...emphasis(text.slice(m.index + whole.length)),
  ];
}
