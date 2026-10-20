import { useRef, type KeyboardEvent } from "react";
import { cn } from "./cn";
import { StarIcon } from "./icons";
import { defaultLabels } from "./labels";

export interface StarRatingProps {
  /** 0 = no rating yet. */
  value: number;
  onChange: (value: number) => void;
  max?: number;
  disabled?: boolean;
  /** Accessible name of the group. */
  label?: string;
  starLabel?: (n: number) => string;
  className?: string;
}

/** Radio group of stars: arrows/Home/End move and select, like native radios. */
export function StarRating({
  value,
  onChange,
  max = 5,
  disabled,
  label = defaultLabels.rating,
  starLabel = defaultLabels.star,
  className,
}: StarRatingProps) {
  const ref = useRef<HTMLDivElement>(null);

  function select(n: number) {
    onChange(n);
    ref.current?.querySelectorAll<HTMLButtonElement>("[role=radio]")[n - 1]?.focus();
  }

  function onKeyDown(e: KeyboardEvent) {
    const next = { ArrowRight: value + 1, ArrowUp: value + 1, ArrowLeft: value - 1, ArrowDown: value - 1, Home: 1, End: max }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    select(Math.min(max, Math.max(1, next)));
  }

  return (
    <div ref={ref} role="radiogroup" aria-label={label} className={cn("flex gap-1", className)} onKeyDown={onKeyDown}>
      {Array.from({ length: max }, (_, i) => {
        const n = i + 1;
        return (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={starLabel(n)}
            tabIndex={value === n || (!value && n === 1) ? 0 : -1}
            disabled={disabled}
            onClick={() => onChange(n)}
            className="cursor-pointer rounded-sm text-evee-warning outline-none transition-transform hover:scale-110 focus-visible:ring-2 focus-visible:ring-evee-ring disabled:pointer-events-none disabled:opacity-50"
          >
            <StarIcon className="size-7" fill={n <= value ? "currentColor" : "none"} aria-hidden />
          </button>
        );
      })}
    </div>
  );
}
