import type { ReactNode } from "react";
import { cn } from "./cn";

export interface SeparatorProps {
  children?: ReactNode;
  /** "day" for date dividers, "unread" for the new-messages marker. */
  variant?: "day" | "unread";
  className?: string;
}

export function Separator({ children, variant = "day", className }: SeparatorProps) {
  const unread = variant === "unread";
  return (
    <div
      role="separator"
      className={cn(
        "my-2 flex items-center gap-3 text-xs font-medium",
        unread ? "text-evee-primary" : "text-evee-muted-foreground",
        className,
      )}
    >
      <span className={cn("h-px flex-1", unread ? "bg-evee-primary/40" : "bg-evee-border")} />
      {children}
      <span className={cn("h-px flex-1", unread ? "bg-evee-primary/40" : "bg-evee-border")} />
    </div>
  );
}

/** "Hoje" / "Ontem" / localized date. */
export function dayLabel(date: Date, locale: string, now = new Date()) {
  const startOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diff = Math.round((startOf(date) - startOf(now)) / 86_400_000);
  if (diff === 0 || diff === -1) {
    const label = new Intl.RelativeTimeFormat(locale, { numeric: "auto" }).format(diff, "day");
    return label.charAt(0).toUpperCase() + label.slice(1);
  }
  return date.toLocaleDateString(locale, {
    day: "numeric",
    month: "long",
    year: date.getFullYear() === now.getFullYear() ? undefined : "numeric",
  });
}
