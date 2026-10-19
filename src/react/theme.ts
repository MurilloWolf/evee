import type { CSSProperties } from "react";
import type { ChatConfig, ChatThemeTokens } from "../core/types";

/** Token keys. Keep in sync with the generated blocks in styles.css. */
export const THEME_TOKENS = [
  "background", "foreground", "card", "primary", "primaryForeground", "secondary", "secondaryForeground",
  "muted", "mutedForeground", "accent", "accentForeground", "border", "input", "ring", "destructive", "warning",
  "bubbleOwn", "bubbleOwnForeground", "bubbleOther", "bubbleOtherForeground",
] as const satisfies readonly (keyof ChatThemeTokens)[];

const kebab = (s: string) => s.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

/** Root props that scope the evee tokens: class, data-scheme and the theme as CSS vars. */
export function themeRootProps(config: Pick<ChatConfig, "theme" | "colorScheme">) {
  const { theme } = config;
  const style: Record<string, string> = {};
  if (theme) {
    const split = "light" in theme || "dark" in theme;
    const light = split ? (theme as { light?: ChatThemeTokens }).light : (theme as ChatThemeTokens);
    const dark = split ? (theme as { dark?: ChatThemeTokens }).dark : (theme as ChatThemeTokens);
    for (const key of THEME_TOKENS) {
      if (light?.[key]) style[`--evee-light-${kebab(key)}`] = light[key]!;
      if (dark?.[key]) style[`--evee-dark-${kebab(key)}`] = dark[key]!;
    }
  }
  return { className: "evee", "data-scheme": config.colorScheme, style: style as CSSProperties };
}
