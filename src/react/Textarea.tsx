import type { TextareaHTMLAttributes } from "react";
import { cn } from "./cn";

export const textareaClass =
  "rounded-md border border-evee-input bg-transparent px-3 py-2 text-sm outline-none placeholder:text-evee-muted-foreground focus-visible:ring-2 focus-visible:ring-evee-ring disabled:cursor-not-allowed disabled:opacity-50";

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export function Textarea({ className, ...props }: TextareaProps) {
  return <textarea className={cn(textareaClass, "w-full resize-none", className)} {...props} />;
}
