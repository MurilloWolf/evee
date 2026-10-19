import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "./cn";

export const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-evee-ring focus-visible:ring-offset-2 focus-visible:ring-offset-evee-background disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
  {
    variants: {
      variant: {
        default: "bg-evee-primary text-evee-primary-foreground hover:bg-evee-primary/90",
        secondary: "bg-evee-secondary text-evee-secondary-foreground hover:bg-evee-secondary/80",
        outline: "border border-evee-border bg-evee-background hover:bg-evee-accent hover:text-evee-accent-foreground",
        ghost: "hover:bg-evee-accent hover:text-evee-accent-foreground",
        link: "text-evee-primary underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-9 px-4",
        icon: "size-9",
        "icon-sm": "size-7",
      },
    },
    defaultVariants: { variant: "default", size: "md" },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, size, type = "button", ...props }: ButtonProps) {
  return <button type={type} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}

export interface IconButtonProps extends Omit<ButtonProps, "children"> {
  icon: ReactNode;
  /** Visible text next to the icon. Without it, the button is icon-only. */
  label?: ReactNode;
  /** Accessible name; required when there is no visible label. */
  "aria-label"?: string;
}

/** Button + icon. Icon-only when `label` is omitted. */
export function IconButton({ icon, label, size, ...props }: IconButtonProps) {
  return (
    <Button size={size ?? (label ? "md" : "icon")} {...props}>
      <span aria-hidden className="[&_svg]:size-4 inline-flex">
        {icon}
      </span>
      {label}
    </Button>
  );
}
