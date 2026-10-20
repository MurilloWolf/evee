import { describe, expect, it } from "vitest";
import { linkify } from "./linkify";

const app = "https://app.clinic.com";

describe("linkify", () => {
  it("links allowed absolute URLs and strips trailing punctuation", () => {
    expect(linkify(`veja ${app}/schedules/1.`, [app])).toEqual([
      { type: "text", value: "veja " },
      { type: "link", value: `${app}/schedules/1`, label: `${app}/schedules/1`, url: new URL(`${app}/schedules/1`), markdown: false, external: false },
      { type: "text", value: "." },
    ]);
  });

  it("resolves app-relative paths against the first allowed origin", () => {
    const segs = linkify("abra /schedules/123?doctorId=42 agora", [app]);
    expect(segs[1]).toMatchObject({ type: "link", value: "/schedules/123?doctorId=42", markdown: false });
    expect(segs[1]!.type === "link" && segs[1]!.url.href).toBe(`${app}/schedules/123?doctorId=42`);
  });

  it("parses [label](url) and keeps only the label", () => {
    const segs = linkify("Veja [a agenda do Dr. X](/schedules/1?doctorId=2).", [app]);
    expect(segs).toEqual([
      { type: "text", value: "Veja " },
      {
        type: "link",
        value: "[a agenda do Dr. X](/schedules/1?doctorId=2)",
        label: "a agenda do Dr. X",
        url: new URL(`${app}/schedules/1?doctorId=2`),
        markdown: true,
        external: false,
      },
      { type: "text", value: "." },
    ]);
  });

  it("shows the real target of a disallowed [label](url) as text", () => {
    expect(linkify("[Login](https://evil.com/x)", [app])).toEqual([{ type: "text", value: "Login (https://evil.com/x)" }]);
  });

  it("keeps disallowed origins and javascript: as plain text", () => {
    const text = "https://evil.com/login e javascript:alert(1) e [x](javascript:alert(1))";
    expect(linkify(text, [app])).toEqual([{ type: "text", value: "https://evil.com/login e javascript:alert(1) e x (javascript:alert(1)" + ")" }]);
  });

  it("does not treat fractions or words with slashes as paths", () => {
    expect(linkify("10/12 e/ou", [app])).toEqual([{ type: "text", value: "10/12 e/ou" }]);
  });

  it("returns text only when no origin is allowed", () => {
    expect(linkify("/schedules/1", [])).toEqual([{ type: "text", value: "/schedules/1" }]);
  });

  it("allowExternal links other http(s) origins, flagged external; still rejects javascript:", () => {
    const segs = linkify("veja [o login](https://other.app/login) ou javascript:alert(1)", [app], { allowExternal: true });
    expect(segs[1]).toMatchObject({ type: "link", label: "o login", external: true, markdown: true });
    expect(segs.at(-1)).toEqual({ type: "text", value: " ou javascript:alert(1)" });
  });
});
