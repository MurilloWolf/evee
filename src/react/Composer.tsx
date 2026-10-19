import { useEffect, useRef, type KeyboardEvent, type ReactNode } from "react";
import type { ChatSDK } from "../core/createChat";
import { IconButton } from "./Button";
import { cn } from "./cn";
import { SendIcon } from "./icons";
import { defaultLabels, type ChatLabels } from "./labels";
import { useChat } from "./useChat";

export interface ComposerProps {
  chat: ChatSDK;
  labels?: ChatLabels;
  sendIcon?: ReactNode;
  /** Show the "x/max" counter. */
  showCount?: boolean;
  className?: string;
  textareaClassName?: string;
}

export function Composer({
  chat,
  labels = defaultLabels,
  sendIcon = <SendIcon />,
  showCount = true,
  className,
  textareaClassName,
}: ComposerProps) {
  const { draft, inputDisabled, disabledReason, config } = useChat(chat);
  const ref = useRef<HTMLTextAreaElement>(null);
  const length = draft.trim().length;
  const over = draft.length > config.maxChar;
  const near = !over && draft.length >= config.maxChar * 0.9;
  const canSend = !inputDisabled && length > 0 && !over;

  useEffect(() => {
    chat._view.focusInput = () => ref.current?.focus();
    return () => void (chat._view.focusInput = undefined);
  }, [chat]);

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      if (canSend) chat.sendMessage();
    }
  }

  return (
    <form
      className={cn("flex flex-col gap-1 border-t border-evee-border bg-evee-background p-3", className)}
      onSubmit={(e) => {
        e.preventDefault();
        if (canSend) chat.sendMessage();
      }}
    >
      <div className="flex items-end gap-2">
        <textarea
          ref={ref}
          aria-label={labels.input}
          rows={1}
          value={draft}
          // ponytail: native maxLength blocks typing; drafts longer than a lowered maxChar stay visible but unsendable.
          maxLength={config.maxChar}
          disabled={inputDisabled}
          placeholder={inputDisabled && disabledReason ? disabledReason : config.placeholder}
          onChange={(e) => chat.setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          className={cn(
            "max-h-40 min-h-9 flex-1 resize-none rounded-md border border-evee-input bg-transparent px-3 py-2 text-sm outline-none [field-sizing:content]",
            "placeholder:text-evee-muted-foreground focus-visible:ring-2 focus-visible:ring-evee-ring disabled:cursor-not-allowed disabled:opacity-50",
            over && "border-evee-destructive focus-visible:ring-evee-destructive",
            textareaClassName,
          )}
        />
        <IconButton type="submit" icon={sendIcon} aria-label={labels.send} disabled={!canSend} />
      </div>
      {showCount && (
        <span
          aria-live="polite"
          className={cn(
            "self-end text-[11px] tabular-nums",
            over ? "text-evee-destructive" : near ? "text-evee-warning" : "text-evee-muted-foreground",
          )}
        >
          {draft.length}/{config.maxChar}
        </span>
      )}
    </form>
  );
}
