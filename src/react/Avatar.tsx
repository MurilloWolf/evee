import { useState } from "react";
import type { ChatUser } from "../core/types";
import { cn } from "./cn";

export interface AvatarProps {
  user: Pick<ChatUser, "name" | "avatarUrl"> | undefined;
  className?: string;
}

export function Avatar({ user, className }: AvatarProps) {
  const [broken, setBroken] = useState(false);
  const name = user?.name ?? "?";
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");

  return (
    <span
      className={cn(
        "inline-flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-evee-muted text-xs font-medium text-evee-muted-foreground",
        className,
      )}
      title={name}
    >
      {user?.avatarUrl && !broken ? (
        <img src={user.avatarUrl} alt={name} className="size-full object-cover" onError={() => setBroken(true)} />
      ) : (
        <span aria-label={name}>{initials || "?"}</span>
      )}
    </span>
  );
}
