import { useState } from "react";
import type { ActionMeta } from "../core/types";
import { cardClass } from "./ActionsMessage";
import { Button } from "./Button";
import { cn } from "./cn";
import { CheckIcon } from "./icons";
import { defaultLabels } from "./labels";
import type { MessageRendererProps } from "./MessageList";
import { StarRating } from "./StarRating";
import { Textarea } from "./Textarea";

export interface SurveyMessageMeta extends ActionMeta {
  /** Set by the host once the answer is saved: renders the thanks state (also after reload). */
  answered?: boolean;
  rating?: number;
  reason?: string;
}

export interface SurveyAnswer {
  rating: number;
  /** Only sent (and required) when rating <= REASON_MAX_RATING. */
  reason?: string;
}

/** Ratings at or below this require a reason. */
export const REASON_MAX_RATING = 2;
export const SURVEY_SUBMIT_ACTION = "survey.submit";

/** `kind: "survey"`: 1–5 stars, reason required for low ratings; submits via `chat.runAction(id, "survey.submit", answer)`. */
export function SurveyMessage({ message, chat, labels = defaultLabels }: MessageRendererProps) {
  const meta = (message.meta ?? {}) as SurveyMessageMeta;
  const [rating, setRating] = useState(0);
  const [reason, setReason] = useState("");
  const pending = Boolean(meta.actionPending);
  const needsReason = rating > 0 && rating <= REASON_MAX_RATING;
  const canSubmit = rating > 0 && (!needsReason || reason.trim().length > 0) && !pending;

  if (meta.answered) {
    return (
      <div className={cn(cardClass, "flex items-center gap-2")} role="status">
        <span className="inline-flex size-7 items-center justify-center rounded-full bg-evee-primary text-evee-primary-foreground motion-safe:animate-evee-pop">
          <CheckIcon className="size-4" aria-hidden />
        </span>
        <span className="font-medium motion-safe:animate-evee-pop">{labels.surveyThanks}</span>
      </div>
    );
  }

  return (
    <form
      className={cn(cardClass, "flex flex-col gap-3")}
      onSubmit={(e) => {
        e.preventDefault();
        if (!canSubmit) return;
        const answer: SurveyAnswer = { rating, reason: needsReason ? reason.trim() : undefined };
        void chat.runAction(message.id, SURVEY_SUBMIT_ACTION, answer);
      }}
    >
      <p className="font-medium">{message.text || labels.surveyTitle}</p>
      <StarRating value={rating} onChange={setRating} disabled={pending} label={labels.rating} starLabel={labels.star} />
      {needsReason && (
        <Textarea
          required
          rows={3}
          maxLength={1000}
          aria-label={labels.surveyReason}
          placeholder={labels.surveyReason}
          value={reason}
          disabled={pending}
          onChange={(e) => setReason(e.target.value)}
          className="motion-safe:animate-evee-fade-in"
        />
      )}
      {meta.actionError !== undefined && (
        <p role="alert" className="text-[11px] text-evee-destructive">
          {meta.actionError || labels.actionFailed}
        </p>
      )}
      <Button type="submit" size="sm" disabled={!canSubmit}>
        {pending ? labels.surveySubmitting : labels.surveySubmit}
      </Button>
    </form>
  );
}
