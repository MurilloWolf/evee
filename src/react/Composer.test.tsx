import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { createChat } from "../core/createChat";
import { Composer } from "./Composer";

afterEach(cleanup);

const setup = (maxChar = 10) => {
  const chat = createChat({ currentUser: { id: "me", name: "Me" }, maxChar });
  render(<Composer chat={chat} />);
  return { chat, input: screen.getByLabelText("Mensagem") as HTMLTextAreaElement, send: screen.getByLabelText("Enviar") };
};

describe("Composer", () => {
  it("shows the char count and applies maxLength", () => {
    const { chat, input } = setup(10);
    fireEvent.change(input, { target: { value: "abc" } });
    expect(screen.getByText("3/10")).toBeTruthy();
    act(() => chat.setMaxChar(200));
    expect(screen.getByText("3/200")).toBeTruthy();
    expect(input.maxLength).toBe(200);
  });

  it("disables send above the limit (maxChar lowered after typing)", () => {
    const { chat, input, send } = setup(10);
    fireEvent.change(input, { target: { value: "abcdef" } });
    act(() => chat.setMaxChar(3));
    expect((send as HTMLButtonElement).disabled).toBe(true);
    fireEvent.keyDown(input, { key: "Enter" });
    expect(chat.getState().messages).toHaveLength(0);
  });

  it("Enter sends, Shift+Enter does not", () => {
    const { chat, input } = setup();
    fireEvent.change(input, { target: { value: "oi" } });
    fireEvent.keyDown(input, { key: "Enter", shiftKey: true });
    expect(chat.getState().messages).toHaveLength(0);
    fireEvent.keyDown(input, { key: "Enter" });
    expect(chat.getState().messages).toHaveLength(1);
    expect(input.value).toBe("");
  });

  it("disableInput disables the textarea and shows the reason", () => {
    const { chat, input } = setup();
    act(() => chat.disableInput("Encerrado"));
    expect(input.disabled).toBe(true);
    expect(input.placeholder).toBe("Encerrado");
  });
});
