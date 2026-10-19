import { describe, expect, it, vi } from "vitest";
import { createChat } from "./createChat";

const me = { id: "me", name: "Me" };
let n = 0;
const setup = (opts: Parameters<typeof createChat>[0] extends infer O ? Partial<O> : never = {}) =>
  createChat({ currentUser: me, generateId: () => `id-${++n}`, ...opts });

describe("createChat", () => {
  it("sends: pending → sent, merging server fields", async () => {
    const chat = setup({ onSend: async () => ({ meta: { server: true } }) });
    const msg = chat.sendMessage("  oi  ")!;
    expect(msg.text).toBe("oi");
    expect(chat.getState().messages[0]!.status).toBe("pending");
    await vi.waitFor(() => expect(chat.getState().messages[0]!.status).toBe("sent"));
    expect(chat.getState().messages[0]!.meta).toEqual({ server: true });
  });

  it("marks failed on reject, emits error, and retry re-sends", async () => {
    let fail = true;
    const onError = vi.fn();
    const chat = setup({
      onSend: async () => {
        if (fail) throw new Error("x");
      },
    });
    chat.on("error", onError);
    const msg = chat.sendMessage("oi")!;
    await vi.waitFor(() => expect(chat.getState().messages[0]!.status).toBe("failed"));
    expect(onError).toHaveBeenCalledOnce();
    fail = false;
    chat.retry(msg.id);
    await vi.waitFor(() => expect(chat.getState().messages[0]!.status).toBe("sent"));
  });

  it("blocks empty, over maxChar and disabled input", () => {
    const chat = setup({ maxChar: 3 });
    expect(chat.sendMessage("   ")).toBeNull();
    expect(chat.sendMessage("abcd")).toBeNull();
    chat.disableInput("closed");
    expect(chat.sendMessage("ab")).toBeNull();
    expect(chat.getState().disabledReason).toBe("closed");
    chat.enableInput();
    expect(chat.sendMessage("ab")).not.toBeNull();
  });

  it("sendMessage() without args sends and clears the draft", () => {
    const chat = setup();
    chat.setDraft("rascunho");
    chat.sendMessage();
    expect(chat.getState().draft).toBe("");
    expect(chat.getState().messages[0]!.text).toBe("rascunho");
  });

  it("setMaxChar clamps to a positive integer", () => {
    const chat = setup();
    chat.setMaxChar(200.7);
    expect(chat.getState().config.maxChar).toBe(200);
    chat.setMaxChar(-5);
    expect(chat.getState().config.maxChar).toBe(1);
  });

  it("prependMessages puts older first without duplicating ids", () => {
    const at = new Date();
    const chat = setup({ messages: [{ id: "b", authorId: "x", text: "b", createdAt: at }], hasMore: true });
    chat.loadMore();
    expect(chat.getState().loadingMore).toBe(true);
    chat.prependMessages(
      [
        { id: "a", authorId: "x", text: "a", createdAt: at },
        { id: "b", authorId: "x", text: "dup", createdAt: at },
      ],
      false,
    );
    const s = chat.getState();
    expect(s.messages.map((m) => m.id)).toEqual(["a", "b"]);
    expect(s.messages[1]!.text).toBe("b");
    expect(s.hasMore).toBe(false);
    expect(s.loadingMore).toBe(false);
  });

  it("loadMore emits once while loading and not when hasMore=false", () => {
    const chat = setup({ hasMore: true });
    const onLoad = vi.fn();
    chat.on("loadMore", onLoad);
    chat.loadMore();
    chat.loadMore();
    expect(onLoad).toHaveBeenCalledOnce();
    chat.setHasMore(false);
    chat.loadMore();
    expect(onLoad).toHaveBeenCalledOnce();
  });

  it("addMessage ignores duplicates, clears typing and emits; on() unsubscribes", () => {
    const chat = setup();
    const onMsg = vi.fn();
    const off = chat.on("message", onMsg);
    chat.setTyping({ id: "x", name: "X" });
    const m = { id: "1", authorId: "x", text: "hi", createdAt: new Date() };
    chat.addMessage(m);
    chat.addMessage(m);
    expect(chat.getState().messages).toHaveLength(1);
    expect(chat.getState().typing).toBeNull();
    off();
    chat.addMessage({ ...m, id: "2" });
    expect(onMsg).toHaveBeenCalledOnce();
  });

  it("header setters create/patch the header; setHeader(null) hides it", () => {
    const chat = setup();
    expect(chat.getState().header).toBeNull();
    chat.setTitle("Suporte");
    chat.setSubtitle("Online");
    chat.setAvatar("https://img/a.png");
    expect(chat.getState().header).toEqual({ title: "Suporte", subtitle: "Online", avatarUrl: "https://img/a.png" });
    chat.setAvatar(null);
    expect(chat.getState().header?.avatarUrl).toBeUndefined();
    chat.setHeader(null);
    expect(chat.getState().header).toBeNull();
  });

  it("counts unread only while closed and only from others; open() resets", () => {
    const chat = setup({ open: false });
    const onOpen = vi.fn();
    chat.on("open", onOpen);
    const msg = (id: string, authorId = "admin") => ({ id, authorId, text: id, createdAt: new Date() });
    chat.addMessage(msg("1"));
    chat.addMessage(msg("2"));
    chat.addMessage(msg("mine", "me"));
    expect(chat.getState().unreadCount).toBe(2);
    expect(chat.getState().unreadMarkerId).toBe("1");
    chat.toggle();
    expect(chat.getState()).toMatchObject({ isOpen: true, unreadCount: 0, unreadMarkerId: "1" });
    expect(onOpen).toHaveBeenCalledOnce();
    chat.addMessage(msg("3"));
    expect(chat.getState().unreadCount).toBe(0);
    chat.close();
    expect(chat.getState().unreadMarkerId).toBeNull();
    chat.setUnreadCount(4.6);
    expect(chat.getState().unreadCount).toBe(4);
  });
});
