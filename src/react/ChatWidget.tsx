import { useEffect, useState, type ReactNode } from "react";
import { Chat, type ChatProps } from "./Chat";
import { cn } from "./cn";
import { ChatIcon, CloseIcon } from "./icons";
import { defaultLabels } from "./labels";
import { themeRootProps } from "./theme";
import { useChat } from "./useChat";

export interface ChatWidgetProps extends Omit<ChatProps, "onClose"> {
  position?: "bottom-right" | "bottom-left";
  /** Shows a bubble with the last unread message above the closed launcher. Default true. */
  showPreview?: boolean;
  launcherIcon?: ReactNode;
  launcherClassName?: string;
  panelClassName?: string;
}

/** Must match --animate-evee-panel-out in styles.css. */
const CLOSE_MS = 160;

/**
 * Floating chat: a launcher button with an unread badge that opens the chat panel.
 * Open/close via the button or `chat.open()` / `chat.close()` / `chat.toggle()`.
 * Create the chat with `open: false` to start closed.
 */
export function ChatWidget({
  chat,
  position = "bottom-right",
  showPreview = true,
  launcherIcon = <ChatIcon />,
  launcherClassName,
  panelClassName,
  className,
  ...chatProps
}: ChatWidgetProps) {
  const { isOpen, unreadCount, messages, users, currentUser, config } = useChat(chat);
  const l = { ...defaultLabels, ...chatProps.labels };
  const [dismissedId, setDismissedId] = useState<string | null>(null);
  // Keeps the panel mounted while the close animation plays.
  const [rendered, setRendered] = useState(isOpen);
  const left = position === "bottom-left";
  const themeProps = themeRootProps(config);

  const lastUnread = unreadCount > 0 ? messages.findLast((m) => m.authorId !== currentUser.id) : undefined;
  const preview = showPreview && !isOpen && lastUnread && lastUnread.id !== dismissedId ? lastUnread : undefined;

  useEffect(() => {
    if (isOpen) {
      setRendered(true);
      return;
    }
    const t = setTimeout(() => setRendered(false), CLOSE_MS);
    return () => clearTimeout(t);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    chat.focusInput();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && chat.close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, chat]);

  return (
    <div {...themeProps} className={cn(themeProps.className, "fixed bottom-6 z-50", left ? "left-6" : "right-6", className)}>
      {(isOpen || rendered) && (
        <div
          role="dialog"
          aria-label={l.messages}
          className={cn(
            "fixed inset-0 sm:inset-auto sm:bottom-24 sm:h-[min(600px,calc(100dvh-8rem))] sm:w-95",
            left ? "sm:left-6 origin-bottom-left" : "sm:right-6 origin-bottom-right",
            isOpen ? "motion-safe:animate-evee-panel-in" : "pointer-events-none motion-safe:animate-evee-panel-out",
            panelClassName,
          )}
        >
          <Chat chat={chat} onClose={chat.close} className="rounded-none shadow-2xl sm:rounded-xl" {...chatProps} />
        </div>
      )}

      {preview && (
        <div
          key={preview.id}
          className={cn(
            "absolute bottom-16 w-64 rounded-xl border border-evee-border bg-evee-card p-3 text-sm text-evee-foreground shadow-lg motion-safe:animate-evee-slide-up",
            left ? "left-0" : "right-0",
          )}
        >
          <button
            type="button"
            aria-label={l.dismiss}
            onClick={() => setDismissedId(preview.id)}
            className="absolute right-2 top-2 cursor-pointer text-evee-muted-foreground hover:text-evee-foreground"
          >
            <CloseIcon className="size-3.5" aria-hidden />
          </button>
          <button type="button" onClick={chat.open} className="block w-full cursor-pointer pr-4 text-left">
            <span className="block text-xs font-medium text-evee-muted-foreground">{users[preview.authorId]?.name}</span>
            <span className="line-clamp-2">{preview.text}</span>
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={chat.toggle}
        aria-expanded={isOpen}
        aria-label={unreadCount > 0 ? `${isOpen ? l.close : l.open} (${l.unreadBadge(unreadCount)})` : isOpen ? l.close : l.open}
        className={cn(
          "relative flex size-14 cursor-pointer items-center justify-center rounded-full bg-evee-primary text-evee-primary-foreground shadow-lg transition-transform hover:scale-105 active:scale-95",
          "outline-none focus-visible:ring-2 focus-visible:ring-evee-ring focus-visible:ring-offset-2 focus-visible:ring-offset-evee-background",
          isOpen && "max-sm:hidden",
          launcherClassName,
        )}
      >
        {/* Pulse ring on each new unread message (keyed so it replays). */}
        {unreadCount > 0 && !isOpen && (
          <span
            key={`ring-${unreadCount}`}
            aria-hidden
            className="absolute inset-0 rounded-full bg-evee-primary motion-safe:animate-evee-ring motion-reduce:hidden"
          />
        )}
        <span
          key={isOpen ? "open" : `closed-${unreadCount}`}
          aria-hidden
          className={cn(
            "relative [&_svg]:size-6",
            isOpen ? "motion-safe:animate-evee-spin-in" : unreadCount > 0 ? "motion-safe:animate-evee-wiggle" : "motion-safe:animate-evee-spin-in",
          )}
        >
          {isOpen ? <CloseIcon /> : launcherIcon}
        </span>
        {unreadCount > 0 && !isOpen && (
          <span
            key={`badge-${unreadCount}`}
            aria-hidden
            className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-evee-destructive px-1 text-[11px] font-semibold text-white ring-2 ring-evee-background motion-safe:animate-evee-pop"
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>
    </div>
  );
}
