import type { ChatUser } from "../core/types";
import { Avatar } from "./Avatar";
import { cn } from "./cn";

export interface TypingIndicatorProps {
  user: ChatUser;
  label: (name: string) => string;
  showAvatar?: boolean;
  AvatarComponent?: typeof Avatar;
  className?: string;
}

/** Bubble with three bouncing dots. The label is for screen readers. */
export function TypingIndicator({ user, label, showAvatar = true, AvatarComponent = Avatar, className }: TypingIndicatorProps) {
  return (
    <div
      className={cn("mt-3 flex items-end gap-2 motion-safe:animate-evee-message-in origin-bottom-left", className)}
      role="status"
      aria-live="polite"
    >
      {showAvatar && (
        <span className="w-8 shrink-0">
          <AvatarComponent user={user} />
        </span>
      )}
      <div className="flex h-9 items-center gap-1 rounded-2xl rounded-bl-sm bg-evee-bubble-other px-3.5">
        {[0, 160, 320].map((delay) => (
          <span
            key={delay}
            aria-hidden
            className="size-1.5 rounded-full bg-evee-bubble-other-foreground/70 motion-safe:animate-evee-typing"
            style={{ animationDelay: `${delay}ms` }}
          />
        ))}
      </div>
      <span className="sr-only">{label(user.name)}</span>
    </div>
  );
}
