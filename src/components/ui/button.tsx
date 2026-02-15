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
    "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all duration-300",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
    "motion-safe:hover:-translate-y-1 motion-safe:active:translate-y-0 motion-safe:hover:scale-105",
    size === "sm" && "px-3 py-2 min-h-[44px] text-sm",
    size === "md" && "px-4 py-2.5 min-h-[44px] text-sm",
    size === "lg" && "px-6 py-3 min-h-[48px] text-base",
    variant === "primary" &&
      "shine bg-gradient-to-r from-orange-500 via-pink-500 via-violet-500 to-sky-500 bg-[length:200%] animate-gradient text-white shadow-colorful hover:shadow-glow font-semibold",
    variant === "secondary" &&
      "bg-gradient-to-r from-yellow-400 to-orange-400 text-white shadow-lg hover:shadow-xl hover:from-yellow-300 hover:to-orange-300",
    variant === "outline" &&
      "border-2 border-violet-300 bg-white/80 text-violet-700 hover:bg-gradient-to-r hover:from-violet-50 hover:to-pink-50 hover:border-violet-400 hover:text-violet-800",
    variant === "ghost" &&
      "bg-transparent text-ink-800 hover:bg-gradient-to-r hover:from-pink-50 hover:to-violet-50 active:bg-sand-100",
    props.disabled && "opacity-60 cursor-not-allowed"
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

