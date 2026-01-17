import { clsx } from "clsx";

export function Select({
  label,
  error,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1">
      <div className="text-sm font-medium text-gray-800">{label}</div>
      <select
        {...props}
        className={clsx(
          "w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none transition",
          "focus:border-gray-400 focus:ring-2 focus:ring-gray-900/15",
          error ? "border-red-300" : "border-gray-200",
          props.className
        )}
      >
        {children}
      </select>
      {error ? <div className="text-xs text-red-600">{error}</div> : null}
    </label>
  );
}

