import type { ComponentType, MouseEvent, ReactNode } from "react";
import { linkify } from "../core/linkify";
import type { ChatMessage, ChatUser } from "../core/types";
import { Avatar } from "./Avatar";
import { CheckIcon, ClockIcon, RetryIcon } from "./icons";
import { cn } from "./cn";
import type { ChatLabels } from "./labels";
import { MessageLink, type LinkComponent, type MessageLinkProps } from "./MessageLink";
import { Timestamp } from "./Timestamp";

export type { LinkComponent };

export interface BubbleClassNames {
  row?: string;
  bubble?: string;
  bubbleOwn?: string;
  bubbleOther?: string;
  author?: string;
  link?: string;
}

export interface MessageBubbleProps {
  message: ChatMessage;
  author: ChatUser | undefined;
  own: boolean;
  /** First message of a sequence from the same author: shows name/avatar. */
  first: boolean;
  showAvatar: boolean;
  showTimestamp: boolean;
  showAuthorName: boolean;
  /** Play the enter animation (new messages only). */
  animate?: boolean;
  locale: string;
  allowedLinkOrigins: string[];
  labels: ChatLabels;
  linkComponent?: LinkComponent;
  LinkComponent?: ComponentType<MessageLinkProps>;
  onLinkClick?: (url: URL, message: ChatMessage, e: MouseEvent<HTMLAnchorElement>) => void;
  onRetry?: (id: string) => void;
  AvatarComponent?: typeof Avatar;
  /** Replaces the text body. */
  children?: ReactNode;
  classNames?: BubbleClassNames;
}

export function MessageBubble({
  message,
  author,
  own,
  first,
  showAvatar,
  showTimestamp,
  showAuthorName,
  animate = false,
  locale,
  allowedLinkOrigins,
  labels,
  linkComponent,
  LinkComponent: LinkC = MessageLink,
  onLinkClick,
  onRetry,
  AvatarComponent = Avatar,
  children,
  classNames = {},
}: MessageBubbleProps) {
  const failed = message.status === "failed";
  const pending = message.status === "pending";

  // Time + delivery status, shown in the bubble's bottom-right corner (WhatsApp style).
  const meta = showTimestamp && (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap text-[11px] leading-none",
        own ? "text-evee-bubble-own-foreground/70" : "text-evee-muted-foreground",
      )}
    >
      <Timestamp date={message.createdAt} locale={locale} className="text-inherit" />
      {own && !failed &&
        (pending ? (
          <ClockIcon className="size-3" aria-label={labels.sending} />
        ) : (
          <CheckIcon className="size-3.5" aria-label={labels.sent} />
        ))}
    </span>
  );

  return (
    <div
      className={cn(
        "flex items-end gap-2",
        own ? "flex-row-reverse" : "flex-row",
        first ? "mt-3" : "mt-0.5",
        animate && (own ? "origin-bottom-right" : "origin-bottom-left"),
        animate && "motion-safe:animate-evee-message-in",
        classNames.row,
      )}
    >
      {showAvatar && !own && <span className="w-8 shrink-0">{first && <AvatarComponent user={author} />}</span>}
      <div className={cn("flex max-w-[75%] flex-col gap-1", own ? "items-end" : "items-start")}>
        {showAuthorName && first && !own && author && (
          <span className={cn("px-1 text-xs font-medium text-evee-muted-foreground", classNames.author)}>{author.name}</span>
        )}
        <div
          className={cn(
            "relative rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap wrap-break-word transition-opacity",
            own
              ? cn("rounded-br-sm bg-evee-bubble-own text-evee-bubble-own-foreground", classNames.bubbleOwn)
              : cn("rounded-bl-sm bg-evee-bubble-other text-evee-bubble-other-foreground", classNames.bubbleOther),
            pending && "opacity-80",
            failed && "ring-1 ring-evee-destructive",
            classNames.bubble,
          )}
        >
          {children ??
            linkify(message.text, allowedLinkOrigins).map((seg, i) =>
              seg.type === "text" ? (
                seg.value
              ) : (
                <LinkC
                  key={i}
                  href={seg.url.href}
                  label={seg.label}
                  url={seg.url}
                  markdown={seg.markdown}
                  own={own}
                  linkComponent={linkComponent}
                  className={classNames.link}
                  onClick={(e) => onLinkClick?.(seg.url, message, e)}
                />
              ),
            )}
          {meta && (
            <>
              {/* Invisible copy reserves room at the end of the last line; it wraps to a new line when needed. */}
              <span aria-hidden className="invisible ml-2 select-none">
                {meta}
              </span>
              <span className="absolute bottom-1.5 right-2.5">{meta}</span>
            </>
          )}
        </div>
        {failed && (
          <div className="flex items-center gap-2 px-1 motion-safe:animate-evee-fade-in">
            <span className="text-[11px] text-evee-destructive">{labels.failed}</span>
            {onRetry && (
              <button
                type="button"
                onClick={() => onRetry(message.id)}
                className="inline-flex cursor-pointer items-center gap-1 text-[11px] font-medium text-evee-destructive hover:underline"
              >
                <RetryIcon className="size-3" aria-hidden />
                {labels.retry}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
