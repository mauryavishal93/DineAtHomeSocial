import { clsx } from "clsx";
import { isValidElement, cloneElement } from "react";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

export function Button({
  children,
  variant = "primary",
  asChild,
  size = "md",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  asChild?: boolean;
  size?: ButtonSize;
}) {
  const className = clsx(
    "inline-flex items-center justify-center gap-2 rounded-full font-medium transition",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-900/30 focus-visible:ring-offset-2 focus-visible:ring-offset-sand-50",
    "motion-safe:hover:-translate-y-0.5 motion-safe:active:translate-y-0",
    size === "sm" && "px-3 py-1.5 text-sm",
    size === "md" && "px-4 py-2 text-sm",
    size === "lg" && "px-5 py-2.5 text-sm",
    variant === "primary" &&
      "shine bg-gradient-to-r from-coral-500 via-violet-500 to-sky-500 text-white shadow-soft hover:shadow-card",
    variant === "secondary" &&
      "bg-sand-100 text-ink-900 hover:bg-sand-200 active:bg-sand-300",
    variant === "outline" &&
      "border border-ink-200 bg-white/60 text-ink-900 hover:bg-white active:bg-sand-50",
    variant === "ghost" &&
      "bg-transparent text-ink-800 hover:bg-sand-100 active:bg-sand-200",
    props.disabled && "opacity-60"
  );

  if (asChild) {
    if (isValidElement(children)) {
      const child = children as React.ReactElement<{ className?: string }>;
      return cloneElement(child, {
        className: clsx(className, child.props.className)
      });
    }
  }

  return (
    <button {...props} className={clsx(className, props.className)}>
      {children}
    </button>
  );
}

