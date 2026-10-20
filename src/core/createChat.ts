import type {
  ActionMeta,
  ChatConfig,
  ChatHeaderState,
  ChatEvents,
  ChatMessage,
  ChatState,
  ChatTheme,
  ChatUser,
  ColorScheme,
  CreateChatOptions,
} from "./types";

type Listener = () => void;
type EventHandler<K extends keyof ChatEvents> = (payload: ChatEvents[K]) => void;

/** DOM hooks registered by the React components so imperative calls can reach them. */
export interface ChatViewHandle {
  focusInput?: () => void;
  scrollToBottom?: (behavior?: ScrollBehavior) => void;
}

const DEFAULT_CONFIG: ChatConfig = {
  maxChar: 1000,
  placeholder: "Digite sua mensagem",
  locale: "pt-BR",
  showAvatars: true,
  showTimestamps: true,
  showAuthorName: false,
  theme: null,
  colorScheme: "inherit",
  externalLinks: false,
  allowedLinkOrigins: typeof window !== "undefined" ? [window.location.origin] : [],
};

const defaultId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

export function createChat(options: CreateChatOptions) {
  const {
    currentUser,
    users = [],
    messages = [],
    hasMore = false,
    header = null,
    open = true,
    onSend,
    onAction,
    generateId = defaultId,
    ...config
  } = options;

  let state: ChatState = {
    currentUser,
    header,
    isOpen: open,
    unreadCount: 0,
    users: Object.fromEntries([currentUser, ...users].map((u) => [u.id, u])),
    messages: dedupe(messages),
    draft: "",
    inputDisabled: false,
    typing: null,
    unreadMarkerId: null,
    hasMore,
    loadingMore: false,
    config: { ...DEFAULT_CONFIG, ...stripUndefined(config) },
  };

  const listeners = new Set<Listener>();
  const handlers = new Map<keyof ChatEvents, Set<EventHandler<never>>>();
  const view: ChatViewHandle = {};

  function setState(patch: Partial<ChatState>) {
    state = { ...state, ...patch };
    listeners.forEach((l) => l());
  }

  function emit<K extends keyof ChatEvents>(event: K, payload: ChatEvents[K]) {
    handlers.get(event)?.forEach((h) => (h as EventHandler<K>)(payload));
  }

  function patchMessage(id: string, patch: Partial<ChatMessage>) {
    setState({ messages: state.messages.map((m) => (m.id === id ? { ...m, ...patch } : m)) });
  }

  async function deliver(message: ChatMessage) {
    emit("send", message);
    if (!onSend) {
      patchMessage(message.id, { status: "sent" });
      return;
    }
    try {
      const server = await onSend(message);
      patchMessage(message.id, { ...(server ?? {}), status: "sent" });
    } catch (error) {
      patchMessage(message.id, { status: "failed" });
      emit("error", { message, error });
    }
  }

  // Current meta as an object, without the action fields.
  function baseMeta(id: string) {
    const meta = state.messages.find((m) => m.id === id)?.meta;
    const { actionPending: _p, actionError: _e, ...rest } = (meta && typeof meta === "object" ? meta : {}) as ActionMeta;
    return rest;
  }

  const chat = {
    getState: () => state,
    subscribe(listener: Listener) {
      listeners.add(listener);
      return () => void listeners.delete(listener);
    },
    on<K extends keyof ChatEvents>(event: K, handler: EventHandler<K>) {
      if (!handlers.has(event)) handlers.set(event, new Set());
      handlers.get(event)!.add(handler as EventHandler<never>);
      return () => void handlers.get(event)?.delete(handler as EventHandler<never>);
    },

    // --- sending ---
    /** Sends `text` (defaults to the current draft). Returns the message, or null if blocked. */
    sendMessage(text: string = state.draft): ChatMessage | null {
      const trimmed = text.trim();
      if (!trimmed || state.inputDisabled || trimmed.length > state.config.maxChar) return null;
      const message: ChatMessage = {
        id: generateId(),
        authorId: state.currentUser.id,
        text: trimmed,
        createdAt: new Date(),
        status: "pending",
      };
      setState({ messages: [...state.messages, message], draft: text === state.draft ? "" : state.draft });
      void deliver(message);
      view.scrollToBottom?.("smooth");
      return message;
    },
    retry(id: string) {
      const message = state.messages.find((m) => m.id === id);
      if (!message || message.status !== "failed") return;
      patchMessage(id, { status: "pending" });
      void deliver({ ...message, status: "pending" });
    },

    // --- actions ---
    /** Runs `onAction` for a message: sets `meta.actionPending`, then merges the result or sets `meta.actionError`. */
    async runAction(messageId: string, actionId: string, value?: unknown) {
      const message = state.messages.find((m) => m.id === messageId);
      if (!message || (message.meta as ActionMeta | undefined)?.actionPending) return;
      const action = { id: actionId, value };
      emit("action", { message, action });
      if (!onAction) return;
      patchMessage(messageId, { meta: { ...baseMeta(messageId), actionPending: actionId } });
      try {
        const server = await onAction(message, action);
        const meta = { ...baseMeta(messageId), ...(server?.meta as object | undefined) };
        patchMessage(messageId, { ...(server ?? {}), meta });
      } catch (error) {
        const actionError = error instanceof Error ? error.message : String(error);
        patchMessage(messageId, { meta: { ...baseMeta(messageId), actionError } });
        emit("error", { message, error });
      }
    },

    // --- messages ---
    /** Adds an incoming message (from another participant). */
    addMessage(message: ChatMessage) {
      if (state.messages.some((m) => m.id === message.id)) return;
      const unseen = !state.isOpen && message.authorId !== state.currentUser.id;
      setState({
        messages: [...state.messages, message],
        typing: null,
        unreadCount: unseen ? state.unreadCount + 1 : state.unreadCount,
        // First unseen message gets the "new messages" separator.
        unreadMarkerId: unseen && state.unreadCount === 0 ? message.id : state.unreadMarkerId,
      });
      emit("message", message);
    },
    setMessages(messages: ChatMessage[]) {
      setState({ messages: dedupe(messages) });
    },
    /** Inserts older messages at the top (pagination). */
    prependMessages(older: ChatMessage[], hasMore?: boolean) {
      const known = new Set(state.messages.map((m) => m.id));
      setState({
        messages: [...dedupe(older).filter((m) => !known.has(m.id)), ...state.messages],
        loadingMore: false,
        hasMore: hasMore ?? state.hasMore,
      });
    },
    updateMessage: patchMessage,
    removeMessage(id: string) {
      setState({ messages: state.messages.filter((m) => m.id !== id) });
    },
    clear() {
      setState({ messages: [], unreadMarkerId: null, typing: null });
    },
    addUsers(...newUsers: ChatUser[]) {
      setState({ users: { ...state.users, ...Object.fromEntries(newUsers.map((u) => [u.id, u])) } });
    },

    // --- input ---
    disableInput(reason?: string) {
      setState({ inputDisabled: true, disabledReason: reason });
    },
    enableInput() {
      setState({ inputDisabled: false, disabledReason: undefined });
    },
    setMaxChar(maxChar: number) {
      chat.setConfig({ maxChar: Math.max(1, Math.floor(maxChar)) });
    },
    setPlaceholder(placeholder: string) {
      chat.setConfig({ placeholder });
    },
    setDraft(draft: string) {
      setState({ draft });
      emit("inputChange", draft);
    },
    focusInput() {
      view.focusInput?.();
    },

    // --- header ---
    /** Replaces the header; `null` hides it. */
    setHeader(header: ChatHeaderState | null) {
      setState({ header });
    },
    setTitle(title: string) {
      setState({ header: { ...state.header, title } });
    },
    setSubtitle(subtitle: string | undefined) {
      setState({ header: { title: "", ...state.header, subtitle } });
    },
    /** Header avatar image; `null` falls back to the title initials. */
    setAvatar(avatarUrl: string | null) {
      setState({ header: { title: "", ...state.header, avatarUrl: avatarUrl ?? undefined } });
    },

    // --- widget ---
    open() {
      if (state.isOpen) return;
      setState({ isOpen: true, unreadCount: 0 });
      emit("open", undefined);
    },
    close() {
      if (!state.isOpen) return;
      setState({ isOpen: false, unreadMarkerId: null });
      emit("close", undefined);
    },
    toggle() {
      if (state.isOpen) chat.close();
      else chat.open();
    },
    /** Overrides the unread badge (e.g. count coming from the server). */
    setUnreadCount(unreadCount: number) {
      setState({ unreadCount: Math.max(0, Math.floor(unreadCount)) });
    },

    // --- view ---
    setConfig(patch: Partial<ChatConfig>) {
      setState({ config: { ...state.config, ...stripUndefined(patch) } });
    },
    /** Replaces the color theme; `null` goes back to the host/default tokens. */
    setTheme(theme: ChatTheme | null) {
      chat.setConfig({ theme });
    },
    setColorScheme(colorScheme: ColorScheme) {
      chat.setConfig({ colorScheme });
    },
    setTyping(user: ChatUser | null) {
      setState({ typing: user });
    },
    /** Shows the "new messages" separator above this message. */
    setUnreadMarker(messageId: string | null) {
      setState({ unreadMarkerId: messageId });
    },
    scrollToBottom(behavior: ScrollBehavior = "smooth") {
      view.scrollToBottom?.(behavior);
    },

    // --- history ---
    setHasMore(hasMore: boolean) {
      setState({ hasMore, loadingMore: false });
    },
    /** Asks the host for older messages via the `loadMore` event. */
    loadMore() {
      if (!state.hasMore || state.loadingMore) return;
      setState({ loadingMore: true });
      emit("loadMore", { before: state.messages[0] });
    },

    /** @internal used by components. */
    _view: view,
    /** @internal used by components. */
    _emit: emit,
  };

  return chat;
}

export type ChatSDK = ReturnType<typeof createChat>;

function dedupe(messages: ChatMessage[]) {
  const seen = new Set<string>();
  return messages.filter((m) => (seen.has(m.id) ? false : (seen.add(m.id), true)));
}

function stripUndefined<T extends object>(obj: T): Partial<T> {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as Partial<T>;
}
