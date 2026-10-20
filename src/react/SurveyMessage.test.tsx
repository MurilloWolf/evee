import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createChat } from "../core/createChat";
import { MessageList } from "./MessageList";

afterEach(cleanup);
// jsdom has no scrollTo; MessageList scrolls on mount.
Element.prototype.scrollTo = () => {};

const setup = () => {
  const onAction = vi.fn(async () => ({ meta: { answered: true } }));
  const chat = createChat({
    currentUser: { id: "me", name: "Me" },
    messages: [{ id: "s1", authorId: "bot", text: "", createdAt: new Date(), kind: "survey", meta: {} }],
    onAction,
  });
  render(<MessageList chat={chat} />);
  const submit = () => screen.getByRole("button", { name: "Enviar avaliação" }) as HTMLButtonElement;
  return { chat, onAction, submit };
};

describe("SurveyMessage", () => {
  it("requires a reason for ratings <= 2", () => {
    const { submit } = setup();
    expect(submit().disabled).toBe(true);
    fireEvent.click(screen.getByRole("radio", { name: "2 estrelas" }));
    const reason = screen.getByLabelText(/obrigatório/);
    expect(submit().disabled).toBe(true);
    fireEvent.change(reason, { target: { value: "demorou" } });
    expect(submit().disabled).toBe(false);
    fireEvent.click(screen.getByRole("radio", { name: "4 estrelas" }));
    expect(screen.queryByLabelText(/obrigatório/)).toBeNull();
    expect(submit().disabled).toBe(false);
  });

  it("submits via runAction and shows the thanks state", async () => {
    const { onAction, submit } = setup();
    fireEvent.click(screen.getByRole("radio", { name: "1 estrela" }));
    fireEvent.change(screen.getByLabelText(/obrigatório/), { target: { value: "  ruim  " } });
    await act(async () => fireEvent.click(submit()));
    expect(onAction).toHaveBeenCalledWith(expect.objectContaining({ id: "s1" }), {
      id: "survey.submit",
      value: { rating: 1, reason: "ruim" },
    });
    expect(screen.getByText("Obrigado pela avaliação!")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Enviar avaliação" })).toBeNull();
  });

  it("arrow keys move the rating", () => {
    setup();
    const group = screen.getByRole("radiogroup");
    fireEvent.keyDown(group, { key: "ArrowRight" });
    fireEvent.keyDown(group, { key: "ArrowRight" });
    expect(screen.getByRole("radio", { name: "2 estrelas" }).getAttribute("aria-checked")).toBe("true");
  });
});
