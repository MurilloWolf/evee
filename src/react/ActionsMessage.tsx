import type { ActionMeta } from "../core/types";
import { Button, type ButtonProps } from "./Button";
import { defaultLabels } from "./labels";
import type { MessageRendererProps } from "./MessageList";

export interface MessageActionItem {
  id: string;
  label: string;
  variant?: ButtonProps["variant"];
}

export interface ActionsMessageMeta extends ActionMeta {
  actions?: MessageActionItem[];
  /** Disables the buttons for good (e.g. set by the host after a choice). */
  done?: boolean;
}

export const cardClass =
  "w-72 max-w-full rounded-xl border border-evee-border bg-evee-card p-3 text-sm text-evee-foreground shadow-sm";

/** `kind: "actions"`: text + buttons; each button calls `chat.runAction(message.id, action.id)`. */
export function ActionsMessage({ message, chat, labels = defaultLabels }: MessageRendererProps) {
  const meta = (message.meta ?? {}) as ActionsMessageMeta;
  const disabled = Boolean(meta.actionPending || meta.done);

  return (
    <div className={cardClass}>
      {message.text && <p className="mb-2 whitespace-pre-wrap wrap-break-word">{message.text}</p>}
      <div className="flex flex-wrap gap-2">
        {meta.actions?.map((action) => (
          <Button
            key={action.id}
            size="sm"
            variant={action.variant ?? "outline"}
            disabled={disabled}
            aria-busy={meta.actionPending === action.id}
            onClick={() => void chat.runAction(message.id, action.id)}
          >
            {action.label}
          </Button>
        ))}
      </div>
      {meta.actionError !== undefined && (
        <p role="alert" className="mt-2 text-[11px] text-evee-destructive motion-safe:animate-evee-fade-in">
          {meta.actionError || labels.actionFailed}
        </p>
      )}
    </div>
  );
}
