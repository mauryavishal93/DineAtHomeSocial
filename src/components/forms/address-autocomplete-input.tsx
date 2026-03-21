"use client";

import { clsx } from "clsx";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { apiFetch } from "@/lib/http";
import type { AddressSuggestion } from "@/lib/address-autocomplete-types";

export type AddressAutocompleteInputProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  name?: string;
  id?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  className?: string;
  /** Fills lat/lng and optional structured fields when user picks a suggestion */
  onPickSuggestion?: (s: AddressSuggestion) => void;
  /** Min characters before search (default 3) */
  minQueryLength?: number;
  debounceMs?: number;
  /** Match host edit / simple forms (sand borders) vs profile/register (violet) */
  appearance?: "violet" | "sand";
};

export function AddressAutocompleteInput({
  label,
  value,
  onChange,
  onBlur,
  name,
  id: idProp,
  placeholder = "Start typing street, area, city…",
  required,
  disabled,
  error,
  className,
  onPickSuggestion,
  minQueryLength = 3,
  debounceMs = 420,
  appearance = "violet"
}: AddressAutocompleteInputProps) {
  const reactId = useId();
  const inputId = idProp ?? `addr-ac-${reactId}`;
  const listId = `${inputId}-list`;
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [highlight, setHighlight] = useState(-1);
  const wrapRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchSuggestions = useCallback(
    async (q: string) => {
      if (q.trim().length < minQueryLength) {
        setSuggestions([]);
        setOpen(false);
        return;
      }
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;
      setLoading(true);
      try {
        const res = await apiFetch<{ suggestions: AddressSuggestion[] }>(
          `/api/geocode/autocomplete?q=${encodeURIComponent(q.trim())}&limit=8`,
          { signal: ac.signal }
        );
        if (ac.signal.aborted) return;
        if (res.ok && res.data?.suggestions) {
          setSuggestions(res.data.suggestions);
          setOpen(res.data.suggestions.length > 0);
          setHighlight(-1);
        } else {
          setSuggestions([]);
          setOpen(false);
        }
      } catch {
        if (!ac.signal.aborted) {
          setSuggestions([]);
          setOpen(false);
        }
      } finally {
        setLoading(false);
      }
    },
    [minQueryLength]
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = value.trim();
    if (q.length < minQueryLength) {
      setSuggestions([]);
      setOpen(false);
      setLoading(false);
      return;
    }
    debounceRef.current = setTimeout(() => {
      void fetchSuggestions(value);
    }, debounceMs);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value, debounceMs, minQueryLength, fetchSuggestions]);

  useEffect(() => {
    function onDocDown(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setHighlight(-1);
      }
    }
    document.addEventListener("mousedown", onDocDown);
    return () => document.removeEventListener("mousedown", onDocDown);
  }, []);

  function pick(s: AddressSuggestion) {
    onChange(s.displayName);
    onPickSuggestion?.(s);
    setOpen(false);
    setSuggestions([]);
    setHighlight(-1);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => (h + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => (h <= 0 ? suggestions.length - 1 : h - 1));
    } else if (e.key === "Enter" && highlight >= 0) {
      e.preventDefault();
      pick(suggestions[highlight]!);
    } else if (e.key === "Escape") {
      setOpen(false);
      setHighlight(-1);
    }
  }

  const isSand = appearance === "sand";

  return (
    <div ref={wrapRef} className={clsx("relative", className)}>
      <label className={clsx("block", isSand ? "space-y-1" : "space-y-1.5")} htmlFor={inputId}>
        <div
          className={clsx(
            isSand ? "text-sm font-medium text-ink-700" : "text-sm font-semibold text-ink-800"
          )}
        >
          {label}
        </div>
        <div className="relative">
          <input
            id={inputId}
            name={name}
            type="text"
            autoComplete="street-address"
            value={value}
            required={required}
            disabled={disabled}
            placeholder={placeholder}
            role="combobox"
            aria-expanded={open}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={highlight >= 0 ? `${listId}-opt-${highlight}` : undefined}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onBlur}
            onFocus={() => {
              if (suggestions.length > 0) setOpen(true);
            }}
            onKeyDown={onKeyDown}
            className={clsx(
              "w-full text-sm outline-none transition-colors",
              isSand
                ? clsx(
                    "rounded-lg border px-3 py-2 min-h-[40px]",
                    "focus:border-violet-400 focus:ring-1 focus:ring-violet-200",
                    error ? "border-red-300" : "border-sand-200",
                    disabled && "opacity-60 cursor-not-allowed"
                  )
                : clsx(
                    "rounded-xl border-2 px-4 py-2.5 min-h-[44px]",
                    "bg-white/80 backdrop-blur-sm",
                    "focus:border-violet-400 focus:ring-2 focus:ring-violet-200/50 focus:bg-white",
                    "hover:border-violet-300",
                    error ? "border-red-400 focus:border-red-500 focus:ring-red-200/50" : "border-violet-200",
                    disabled && "opacity-60 cursor-not-allowed"
                  )
            )}
          />
          {loading ? (
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-ink-500">
              Searching…
            </span>
          ) : null}
        </div>
        {error ? <div className="text-xs font-medium text-red-600">{error}</div> : null}
        <p className="text-xs text-ink-600">
          Type to search; choose a suggestion to set the full address and map pin (OpenStreetMap).
        </p>
      </label>

      {open && suggestions.length > 0 ? (
        <ul
          id={listId}
          role="listbox"
          className={clsx(
            "absolute z-50 mt-1 max-h-64 w-full overflow-auto rounded-xl border bg-white py-1 shadow-lg",
            isSand ? "border-sand-200" : "border-2 border-violet-200"
          )}
        >
          {suggestions.map((s, i) => (
            <li key={s.id} role="presentation">
              <button
                type="button"
                id={`${listId}-opt-${i}`}
                role="option"
                aria-selected={i === highlight}
                className={clsx(
                  "w-full px-3 py-2.5 text-left text-sm leading-snug transition-colors",
                  i === highlight ? "bg-violet-100 text-ink-900" : "text-ink-800 hover:bg-sand-100"
                )}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(s)}
              >
                <span className="line-clamp-2">{s.displayName}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
