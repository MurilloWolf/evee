import type { ChatHeaderState } from "../core/types";
import { Avatar } from "./Avatar";
import { IconButton } from "./Button";
import { cn } from "./cn";
import { CloseIcon } from "./icons";

export interface ChatHeaderProps {
  header: ChatHeaderState;
  /** Shows a close button (used by the widget). */
  onClose?: () => void;
  closeLabel?: string;
  AvatarComponent?: typeof Avatar;
  className?: string;
}

export function ChatHeader({ header, onClose, closeLabel = "Fechar", AvatarComponent = Avatar, className }: ChatHeaderProps) {
  return (
    <div className={cn("flex items-center gap-3 border-b border-evee-border px-4 py-3", className)}>
      <AvatarComponent user={{ name: header.title, avatarUrl: header.avatarUrl }} className="size-10 text-sm" />
      <div className="min-w-0 flex-1">
        {header.title && <p className="truncate text-sm font-semibold">{header.title}</p>}
        {header.subtitle && <p className="truncate text-xs text-evee-muted-foreground">{header.subtitle}</p>}
      </div>
      {onClose && <IconButton variant="ghost" size="icon-sm" icon={<CloseIcon />} aria-label={closeLabel} onClick={onClose} />}
    </div>
  );
}
