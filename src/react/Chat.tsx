import type { ComponentType, ReactNode } from "react";
import type { ChatSDK } from "../core/createChat";
import { ChatHeader, type ChatHeaderProps } from "./ChatHeader";
import { cn } from "./cn";
import { Composer, type ComposerProps } from "./Composer";
import { defaultLabels, type ChatLabels } from "./labels";
import type { BubbleClassNames, LinkComponent } from "./MessageBubble";
import { MessageList, type MessageListComponents, type MessageRendererProps } from "./MessageList";
import { themeRootProps } from "./theme";
import { useChat } from "./useChat";

export interface ChatClassNames extends BubbleClassNames {
  root?: string;
  header?: string;
  list?: string;
  composer?: string;
  textarea?: string;
}

export interface ChatProps {
  chat: ChatSDK;
  /** Custom header content. Overrides the SDK header (setTitle/setSubtitle/setAvatar). */
  header?: ReactNode;
  /** Shows a close button in the default header. */
  onClose?: () => void;
  labels?: Partial<ChatLabels>;
  components?: MessageListComponents & {
    Composer?: ComponentType<ComposerProps>;
    Header?: ComponentType<ChatHeaderProps>;
  };
  renderers?: Record<string, ComponentType<MessageRendererProps>>;
  linkComponent?: LinkComponent;
  classNames?: ChatClassNames;
  className?: string;
}

/** Default layout: header + message list + composer. Every piece is also exported on its own. */
export function Chat({ chat, header, onClose, labels, components = {}, renderers, linkComponent, classNames = {}, className }: ChatProps) {
  const { header: sdkHeader, config } = useChat(chat);
  const themeProps = themeRootProps(config);
  const l = { ...defaultLabels, ...labels };
  const { Composer: ComposerC = Composer, Header: HeaderC = ChatHeader, ...listComponents } = components;
  const { root, header: headerCn, list, composer, textarea, ...bubbleClassNames } = classNames;

  return (
    <div
      {...themeProps}
      className={cn(
        themeProps.className,
        "flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-evee-border bg-evee-background text-evee-foreground",
        root,
        className,
      )}
    >
      {header ? (
        <div className={cn("border-b border-evee-border px-4 py-3", headerCn)}>{header}</div>
      ) : (
        sdkHeader && (
          <HeaderC
            header={sdkHeader}
            onClose={onClose}
            closeLabel={l.close}
            AvatarComponent={listComponents.Avatar}
            className={headerCn}
          />
        )
      )}
      <MessageList
        chat={chat}
        labels={l}
        components={listComponents}
        renderers={renderers}
        linkComponent={linkComponent}
        className={list}
        bubbleClassNames={bubbleClassNames}
      />
      <ComposerC chat={chat} labels={l} className={composer} textareaClassName={textarea} />
    </div>
  );
}
