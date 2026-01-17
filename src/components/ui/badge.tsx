import { clsx } from "clsx";

type BadgeTone = "sand" | "ink" | "success" | "warning";

export function Badge({
  children,
  tone = "sand"
}: {
  children: React.ReactNode;
  tone?: BadgeTone;
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
        tone === "sand" && "border-sand-200 bg-sand-50/70 text-ink-800",
        tone === "ink" && "border-ink-200 bg-white/70 text-ink-900",
        tone === "success" && "border-emerald-200 bg-emerald-50/70 text-emerald-900",
        tone === "warning" && "border-amber-200 bg-amber-50/70 text-amber-900"
      )}
    >
      {children}
    </span>
  );
}

