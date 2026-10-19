import type { ComponentType, MouseEvent, ReactNode } from "react";
import { cn } from "./cn";
import { LinkIcon } from "./icons";

/** Underlying anchor (e.g. next/link). Defaults to <a>. */
export type LinkComponent = ComponentType<{
  href: string;
  className?: string;
  children: ReactNode;
  onClick?: (e: MouseEvent<HTMLAnchorElement>) => void;
}>;

export interface MessageLinkProps {
  href: string;
  /** Markdown label, or the URL when bare. */
  label: string;
  url: URL;
  markdown: boolean;
  /** Inside the current user's bubble (adjusts contrast). */
  own: boolean;
  onClick?: (e: MouseEvent<HTMLAnchorElement>) => void;
  linkComponent?: LinkComponent;
  className?: string;
}

/** Link chip inside a message. `[Abrir agenda](/schedules/1)` shows only "Abrir agenda". */
export function MessageLink({ href, label, url, markdown, own, onClick, linkComponent, className }: MessageLinkProps) {
  const Anchor = linkComponent ?? ("a" as unknown as LinkComponent);
  return (
    <Anchor
      href={href}
      onClick={onClick}
      className={cn(
        "mx-0.5 inline-flex max-w-full items-center gap-1 rounded-md px-1.5 py-0.5 align-baseline font-medium no-underline transition-colors",
        own
          ? "bg-evee-bubble-own-foreground/15 text-evee-bubble-own-foreground hover:bg-evee-bubble-own-foreground/25"
          : "bg-evee-primary/10 text-evee-primary hover:bg-evee-primary/20",
        className,
      )}
    >
      <LinkIcon className="size-3.5 shrink-0" aria-hidden />
      {/* Bare URLs show just the path, truncated; the full URL is in the tooltip. */}
      <span className="truncate" title={markdown ? url.href : undefined}>
        {markdown ? label : shorten(url)}
      </span>
    </Anchor>
  );
}

function shorten(url: URL) {
  const path = url.pathname + url.search;
  return path.length > 32 ? `${path.slice(0, 31)}…` : path;
}
