import { describe, expect, it } from "vitest";
import { themeRootProps } from "./theme";

describe("themeRootProps", () => {
  it("defaults to the evee class, inherit scheme and no vars", () => {
    expect(themeRootProps({ theme: null, colorScheme: "inherit" })).toEqual({
      className: "evee",
      "data-scheme": "inherit",
      style: {},
    });
  });

  it("a flat theme applies to both schemes", () => {
    const { style } = themeRootProps({ theme: { primary: "red", bubbleOwnForeground: "#fff" }, colorScheme: "dark" });
    expect(style).toEqual({
      "--evee-light-primary": "red",
      "--evee-dark-primary": "red",
      "--evee-light-bubble-own-foreground": "#fff",
      "--evee-dark-bubble-own-foreground": "#fff",
    });
  });

  it("a light/dark theme sets each scheme separately", () => {
    const { style } = themeRootProps({ theme: { light: { primary: "blue" }, dark: { muted: "black" } }, colorScheme: "system" });
    expect(style).toEqual({ "--evee-light-primary": "blue", "--evee-dark-muted": "black" });
  });
});
