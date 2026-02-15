import { clsx } from "clsx";

export function Input({
  label,
  error,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
}) {
  return (
    <label className="block space-y-1.5">
      <div className="text-sm font-semibold text-ink-800">{label}</div>
      <input
        {...props}
        className={clsx(
          "w-full rounded-xl border-2 px-4 py-2.5 min-h-[44px] text-sm outline-none transition-all duration-200",
          "bg-white/80 backdrop-blur-sm",
          "focus:border-violet-400 focus:ring-2 focus:ring-violet-200/50 focus:bg-white",
          "hover:border-violet-300",
          error ? "border-red-400 focus:border-red-500 focus:ring-red-200/50" : "border-violet-200",
          props.className
        )}
      />
      {error ? <div className="text-xs font-medium text-red-600">{error}</div> : null}
    </label>
  );
}

