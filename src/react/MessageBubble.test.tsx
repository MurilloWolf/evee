import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { defaultLabels } from "./labels";
import { MessageBubble } from "./MessageBubble";

afterEach(cleanup);

const renderText = (text: string, externalLinks = false) =>
  render(
    <MessageBubble
      message={{ id: "1", authorId: "a", text, createdAt: new Date() }}
      author={{ id: "a", name: "A" }}
      own={false}
      first
      showAvatar={false}
      showTimestamp={false}
      showAuthorName={false}
      locale="pt-BR"
      allowedLinkOrigins={["https://app.clinic.com"]}
      externalLinks={externalLinks}
      labels={defaultLabels}
    />,
  );

describe("MessageBubble rich text", () => {
  it("renders bold/italic/code as elements, never as HTML", () => {
    const { container } = renderText("**oi** _tudo_ `x` <img src=x onerror=alert(1)>");
    expect(container.querySelector("strong")?.textContent).toBe("oi");
    expect(container.querySelector("em")?.textContent).toBe("tudo");
    expect(container.querySelector("code")?.textContent).toBe("x");
    expect(container.querySelector("img")).toBeNull();
  });

  it("external links open in a new tab with noopener", () => {
    renderText("[Login](https://other.app/login)", true);
    const a = screen.getByRole("link", { name: /Login/ });
    expect(a.getAttribute("target")).toBe("_blank");
    expect(a.getAttribute("rel")).toBe("noopener noreferrer");
  });

  it("internal links stay in the same tab", () => {
    renderText("[Agenda](/schedules/1)");
    expect(screen.getByRole("link", { name: /Agenda/ }).getAttribute("target")).toBeNull();
  });
});
