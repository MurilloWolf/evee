import { describe, expect, it } from "vitest";
import { parseMessage, type RichNode } from "./format";

const app = "https://app.clinic.com";
const p = (text: string, external = false) => parseMessage(text, [app], { allowExternal: external });
const t = (value: string): RichNode => ({ type: "text", value });

describe("parseMessage", () => {
  it("bold, italic (_ and *), strike", () => {
    expect(p("a **b** _c_ *d* ~~e~~")).toEqual([
      t("a "),
      { type: "bold", children: [t("b")] },
      t(" "),
      { type: "italic", children: [t("c")] },
      t(" "),
      { type: "italic", children: [t("d")] },
      t(" "),
      { type: "strike", children: [t("e")] },
    ]);
  });

  it("nests emphasis", () => {
    expect(p("**negrito _itálico_**")).toEqual([
      { type: "bold", children: [t("negrito "), { type: "italic", children: [t("itálico")] }] },
    ]);
  });

  it("does not style math, snake_case or URLs with underscores", () => {
    expect(p("5 * 3 * 2 e snake_case_name")).toEqual([t("5 * 3 * 2 e snake_case_name")]);
    const nodes = p(`${app}/a_b_c`);
    expect(nodes).toHaveLength(1);
    expect(nodes[0]).toMatchObject({ type: "link", url: new URL(`${app}/a_b_c`) });
  });

  it("code is never styled or linked", () => {
    expect(p("use `**x** /schedules/1` agora")).toEqual([t("use "), { type: "code", value: "**x** /schedules/1" }, t(" agora")]);
    expect(p("```ts\nconst a = **1**;\n```")).toEqual([{ type: "code-block", value: "const a = **1**;" }]);
  });

  it("formats around links: the Slack example", () => {
    const nodes = p("Viu sua **VAGABUNDA** 🙂   Tente esse link: [smart-clinic-delta.vercel.app/login](https://smart-clinic-delta.vercel.app/login)", true);
    expect(nodes.slice(0, 3)).toEqual([t("Viu sua "), { type: "bold", children: [t("VAGABUNDA")] }, t(" 🙂   Tente esse link: ")]);
    expect(nodes[3]).toMatchObject({ type: "link", label: "smart-clinic-delta.vercel.app/login", external: true });
  });

  it("external link stays text without allowExternal", () => {
    expect(p("[x](https://other.app/y)")).toEqual([t("x (https://other.app/y)")]);
  });

  it("unclosed markers stay as text", () => {
    expect(p("**abc e _def")).toEqual([t("**abc e _def")]);
  });
});
