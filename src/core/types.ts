export interface ChatUser {
  id: string;
  name: string;
  avatarUrl?: string;
}

export type MessageStatus = "pending" | "sent" | "failed";

export interface ChatMessage {
  id: string;
  authorId: string;
  text: string;
  /** Date or ISO string. */
  createdAt: Date | string;
  status?: MessageStatus;
  /** Custom message type, rendered by `renderers[kind]` in <Chat />. */
  kind?: string;
  meta?: unknown;
}

/** Color tokens. Any CSS color. Unset tokens fall back to the host's shadcn vars, then to neutral defaults. */
export interface ChatThemeTokens {
  background?: string;
  foreground?: string;
  card?: string;
  primary?: string;
  primaryForeground?: string;
  secondary?: string;
  secondaryForeground?: string;
  muted?: string;
  mutedForeground?: string;
  accent?: string;
  accentForeground?: string;
  border?: string;
  input?: string;
  ring?: string;
  destructive?: string;
  warning?: string;
  /** Own message bubble. Defaults to primary. */
  bubbleOwn?: string;
  bubbleOwnForeground?: string;
  /** Other participants' bubbles. Defaults to muted. */
  bubbleOther?: string;
  bubbleOtherForeground?: string;
}

/** Same tokens for both schemes, or one set per scheme. */
export type ChatTheme = ChatThemeTokens | { light?: ChatThemeTokens; dark?: ChatThemeTokens };

/**
 * - inherit: follow the host (shadcn vars + `.dark` class). Default.
 * - light / dark: forced.
 * - system: prefers-color-scheme.
 */
export type ColorScheme = "inherit" | "light" | "dark" | "system";

export interface ChatConfig {
  maxChar: number;
  placeholder: string;
  locale: string;
  showAvatars: boolean;
  showTimestamps: boolean;
  /** Author name above other participants' messages. Default false. */
  showAuthorName: boolean;
  theme: ChatTheme | null;
  colorScheme: ColorScheme;
  /** Origins whose links become clickable (internal: emit `linkClick`). */
  allowedLinkOrigins: string[];
  /** Also make http(s) links to other origins clickable, opened in a new tab. Default false. */
  externalLinks: boolean;
}

export interface ChatHeaderState {
  title: string;
  subtitle?: string;
  /** Image for the header avatar. Falls back to the title initials. */
  avatarUrl?: string;
}

export interface ChatState {
  currentUser: ChatUser;
  /** Default header content. `null` hides the default header. */
  header: ChatHeaderState | null;
  /** Widget open/closed. Inline chats stay open. */
  isOpen: boolean;
  /** Messages from others received while closed. */
  unreadCount: number;
  /** Other participants, used to render names and avatars. */
  users: Record<string, ChatUser>;
  messages: ChatMessage[];
  draft: string;
  inputDisabled: boolean;
  disabledReason?: string;
  typing: ChatUser | null;
  unreadMarkerId: string | null;
  hasMore: boolean;
  loadingMore: boolean;
  config: ChatConfig;
}

export interface LinkClickEvent {
  url: URL;
  message: ChatMessage;
  /** Call to stop the default browser navigation (e.g. to use the app router). */
  preventDefault(): void;
}

export interface ChatEvents {
  send: ChatMessage;
  message: ChatMessage;
  loadMore: { before: ChatMessage | undefined };
  linkClick: LinkClickEvent;
  inputChange: string;
  error: { message: ChatMessage; error: unknown };
  open: void;
  close: void;
}

export type SendHandler = (message: ChatMessage) => Promise<Partial<ChatMessage> | void> | Partial<ChatMessage> | void;

export interface CreateChatOptions extends Partial<ChatConfig> {
  currentUser: ChatUser;
  users?: ChatUser[];
  messages?: ChatMessage[];
  hasMore?: boolean;
  header?: ChatHeaderState | null;
  /** Initial open state (use `false` for a widget that starts closed). Default true. */
  open?: boolean;
  /** Called on send. Return/resolve server fields (e.g. real id) to merge; throw/reject to mark as failed. */
  onSend?: SendHandler;
  /** Id generator for outgoing messages. */
  generateId?: () => string;
}
