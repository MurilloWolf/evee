import { Fragment, useEffect, useLayoutEffect, useRef, useState, type ComponentType, type MouseEvent } from "react";
import type { ChatSDK } from "../core/createChat";
import type { ChatMessage } from "../core/types";
import { Avatar } from "./Avatar";
import { Button } from "./Button";
import { cn } from "./cn";
import { ArrowDownIcon } from "./icons";
import { defaultLabels, type ChatLabels } from "./labels";
import { MessageBubble, type BubbleClassNames, type LinkComponent } from "./MessageBubble";
import type { MessageLink } from "./MessageLink";
import { Separator, dayLabel } from "./Separator";
import { TypingIndicator } from "./TypingIndicator";
import { useChat } from "./useChat";

export interface MessageRendererProps {
  message: ChatMessage;
  own: boolean;
  chat: ChatSDK;
}

export interface MessageListComponents {
  Bubble?: typeof MessageBubble;
  Avatar?: typeof Avatar;
  Separator?: typeof Separator;
  TypingIndicator?: typeof TypingIndicator;
  Link?: typeof MessageLink;
}

export interface MessageListProps {
  chat: ChatSDK;
  labels?: ChatLabels;
  components?: MessageListComponents;
  /** Custom renderers keyed by `message.kind`. */
  renderers?: Record<string, ComponentType<MessageRendererProps>>;
  linkComponent?: LinkComponent;
  className?: string;
  bubbleClassNames?: BubbleClassNames;
}

const NEAR_BOTTOM_PX = 80;

export function MessageList({
  chat,
  labels = defaultLabels,
  components = {},
  renderers = {},
  linkComponent,
  className,
  bubbleClassNames,
}: MessageListProps) {
  const { messages, users, currentUser, config, typing, unreadMarkerId, hasMore, loadingMore } = useChat(chat);
  const {
    Bubble = MessageBubble,
    Avatar: AvatarC = Avatar,
    Separator: SeparatorC = Separator,
    TypingIndicator: TypingC = TypingIndicator,
    Link: LinkC,
  } = components;

  const ref = useRef<HTMLDivElement>(null);
  const nearBottom = useRef(true);
  const prev = useRef({ first: messages[0]?.id, last: messages.at(-1)?.id, height: 0 });
  const [showJump, setShowJump] = useState(false);
  const mounted = useRef(false);
  // Ids that get the enter animation: messages appended after mount (not initial or prepended history).
  const animated = useRef(new Set<string>()).current;
  if (mounted.current) {
    const prevLastIdx = prev.current.last ? messages.findIndex((m) => m.id === prev.current.last) : -1;
    if (!prev.current.last || prevLastIdx !== -1) {
      for (let i = prevLastIdx + 1; i < messages.length; i++) animated.add(messages[i]!.id);
    }
  }
  useEffect(() => void (mounted.current = true), []);

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    const el = ref.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior });
    setShowJump(false);
  };

  useEffect(() => {
    chat._view.scrollToBottom = scrollToBottom;
    scrollToBottom("instant");
    return () => void (chat._view.scrollToBottom = undefined);
  }, [chat]);

  // Keep position when older messages are prepended; follow new ones only if already at the bottom.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const first = messages[0]?.id;
    const last = messages.at(-1)?.id;
    const p = prev.current;
    if (first !== p.first && last === p.last && p.height) {
      el.scrollTop += el.scrollHeight - p.height;
    } else if (last !== p.last) {
      const mine = messages.at(-1)?.authorId === currentUser.id;
      if (nearBottom.current || mine) scrollToBottom(p.last ? "smooth" : "instant");
      else setShowJump(true);
    }
    prev.current = { first, last, height: el.scrollHeight };
  }, [messages, currentUser.id]);

  useLayoutEffect(() => {
    if (typing && nearBottom.current) scrollToBottom();
  }, [typing]);

  function onScroll() {
    const el = ref.current!;
    nearBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM_PX;
    if (nearBottom.current) setShowJump(false);
    prev.current.height = el.scrollHeight;
  }

  function onLinkClick(url: URL, message: ChatMessage, e: MouseEvent<HTMLAnchorElement>) {
    let prevented = false;
    chat._emit("linkClick", { url, message, preventDefault: () => void (prevented = true) });
    if (prevented) e.preventDefault();
  }

  return (
    <div className={cn("relative min-h-0 flex-1", className)}>
      <div
        ref={ref}
        onScroll={onScroll}
        role="log"
        aria-live="polite"
        aria-label={labels.messages}
        className="h-full overflow-y-auto overscroll-contain px-3 py-2"
      >
        {hasMore && (
          <div className="flex justify-center py-2">
            <Button variant="ghost" size="sm" disabled={loadingMore} onClick={chat.loadMore}>
              {loadingMore ? labels.loadingMore : labels.loadMore}
            </Button>
          </div>
        )}

        {messages.map((message, i) => {
          const before = messages[i - 1];
          const date = new Date(message.createdAt);
          const newDay = !before || new Date(before.createdAt).toDateString() !== date.toDateString();
          const unread = message.id === unreadMarkerId;
          const own = message.authorId === currentUser.id;
          const first = newDay || unread || before?.authorId !== message.authorId;
          const Renderer = message.kind ? renderers[message.kind] : undefined;

          return (
            <Fragment key={message.id}>
              {newDay && <SeparatorC>{dayLabel(date, config.locale)}</SeparatorC>}
              {unread && <SeparatorC variant="unread">{labels.unread}</SeparatorC>}
              {Renderer ? (
                <div
                  className={cn(
                    "mt-2 flex",
                    own ? "justify-end" : "justify-start",
                    animated.has(message.id) && "motion-safe:animate-evee-message-in",
                  )}
                >
                  <Renderer message={message} own={own} chat={chat} />
                </div>
              ) : (
                <Bubble
                  message={message}
                  author={users[message.authorId]}
                  own={own}
                  first={first}
                  showAvatar={config.showAvatars}
                  showTimestamp={config.showTimestamps}
                  showAuthorName={config.showAuthorName}
                  animate={animated.has(message.id)}
                  LinkComponent={LinkC}
                  locale={config.locale}
                  allowedLinkOrigins={config.allowedLinkOrigins}
                  labels={labels}
                  linkComponent={linkComponent}
                  onLinkClick={onLinkClick}
                  onRetry={chat.retry}
                  AvatarComponent={AvatarC}
                  classNames={bubbleClassNames}
                />
              )}
            </Fragment>
          );
        })}

        {typing && <TypingC user={typing} label={labels.typing} showAvatar={config.showAvatars} AvatarComponent={AvatarC} />}
      </div>

      {showJump && (
        <Button
          size="sm"
          variant="secondary"
          className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full shadow-md motion-safe:animate-evee-slide-up"
          onClick={() => scrollToBottom()}
        >
          <ArrowDownIcon className="size-3.5" aria-hidden />
          {labels.newMessage}
        </Button>
      )}
    </div>
  );
}
