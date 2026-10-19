import { cn } from "./cn";

export interface TimestampProps {
  date: Date | string;
  locale: string;
  className?: string;
}

export function Timestamp({ date, locale, className }: TimestampProps) {
  const d = new Date(date);
  return (
    <time
      dateTime={d.toISOString()}
      title={d.toLocaleString(locale)}
      className={cn("text-[11px] text-evee-muted-foreground tabular-nums", className)}
    >
      {d.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })}
    </time>
  );
}
