import { clsx } from "clsx";
import React from "react";

type BadgeTone = "sand" | "ink" | "success" | "warning" | "violet" | "pink" | "orange" | "sky" | "mint";

export function Badge({
  children,
  tone = "sand",
  className,
  onClick,
  ...props
}: {
  children: React.ReactNode;
  tone?: BadgeTone;
  className?: string;
  onClick?: React.MouseEventHandler<HTMLSpanElement>;
} & React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      onClick={onClick}
      className={clsx(
        "inline-flex items-center rounded-full border-2 px-3 py-1 text-xs font-semibold transition-all duration-200",
        "motion-safe:hover:scale-105 motion-safe:hover:shadow-md",
        tone === "sand" && "border-orange-200 bg-gradient-to-r from-orange-50 to-yellow-50 text-orange-800",
        tone === "ink" && "border-violet-200 bg-gradient-to-r from-violet-50 to-pink-50 text-violet-800",
        tone === "success" && "border-emerald-300 bg-gradient-to-r from-emerald-100 to-mint-100 text-emerald-800 shadow-sm",
        tone === "warning" && "border-amber-300 bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 shadow-sm",
        tone === "violet" && "border-violet-300 bg-gradient-to-r from-violet-100 to-purple-100 text-violet-800 shadow-sm",
        tone === "pink" && "border-pink-300 bg-gradient-to-r from-pink-100 to-rose-100 text-pink-800 shadow-sm",
        tone === "orange" && "border-orange-300 bg-gradient-to-r from-orange-100 to-amber-100 text-orange-800 shadow-sm",
        tone === "sky" && "border-sky-300 bg-gradient-to-r from-sky-100 to-blue-100 text-sky-800 shadow-sm",
        tone === "mint" && "border-emerald-300 bg-gradient-to-r from-emerald-100 to-mint-100 text-emerald-800 shadow-sm",
        onClick && "cursor-pointer",
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

