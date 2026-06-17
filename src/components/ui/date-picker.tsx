"use client";

import { useEffect, useRef, useState } from "react";
import { Calendar, ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const MONTHS_SHORT = MONTHS.map((m) => m.slice(0, 3));
const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function toISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseISO(value?: string | null): Date | null {
  if (!value) return null;
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function formatDisplay(d: Date): string {
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;
}

/** Format an ISO date string (yyyy-mm-dd) as e.g. "17 Jun 2026". */
export function formatDateDisplay(value?: string | null): string {
  const d = parseISO(value);
  return d ? formatDisplay(d) : "";
}

/**
 * App-styled date picker with a calendar popover, replacing the native
 * `<input type="date">`. Renders a hidden input when `name` is provided so it
 * works inside plain forms read via FormData. Can also be used controlled via
 * `value` + `onChange`.
 */
export function DatePicker({
  name,
  id,
  value: controlledValue,
  defaultValue,
  onChange,
  placeholder = "Select date",
  className,
}: {
  name?: string;
  id?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const isControlled = controlledValue !== undefined;
  const [internal, setInternal] = useState(defaultValue ?? "");
  const value = isControlled ? controlledValue : internal;
  const selected = parseISO(value);

  const [open, setOpen] = useState(false);
  const [view, setView] = useState<Date>(() => parseISO(value) ?? new Date());
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function commit(next: string) {
    if (!isControlled) setInternal(next);
    onChange?.(next);
  }

  const year = view.getFullYear();
  const month = view.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  const isToday = (day: number) =>
    today.getFullYear() === year &&
    today.getMonth() === month &&
    today.getDate() === day;
  const isSelected = (day: number) =>
    !!selected &&
    selected.getFullYear() === year &&
    selected.getMonth() === month &&
    selected.getDate() === day;

  return (
    <div className="relative" ref={ref}>
      {name && <input type="hidden" name={name} value={value} />}
      <button
        type="button"
        id={id}
        onClick={() => {
          setOpen((o) => !o);
          if (selected) setView(selected);
        }}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-xl border border-input bg-transparent px-3 text-sm hover:bg-slate-50",
          className,
        )}
      >
        <span className={selected ? "text-slate-900" : "text-muted-foreground"}>
          {selected ? formatDisplay(selected) : placeholder}
        </span>
        <Calendar className="size-4 shrink-0 text-slate-400" />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-72 max-w-[calc(100vw-2rem)] rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
          {/* Month navigation */}
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setView(new Date(year, month - 1, 1))}
              className="flex size-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
              aria-label="Previous month"
            >
              <ChevronLeft className="size-4" />
            </button>
            <span className="text-sm font-medium text-slate-900">
              {MONTHS[month]} {year}
            </span>
            <button
              type="button"
              onClick={() => setView(new Date(year, month + 1, 1))}
              className="flex size-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
              aria-label="Next month"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>

          {/* Weekday headers */}
          <div className="mb-1 grid grid-cols-7 gap-0.5">
            {WEEKDAYS.map((w) => (
              <div
                key={w}
                className="py-1 text-center text-xs font-medium text-slate-400"
              >
                {w}
              </div>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7 gap-0.5">
            {Array.from({ length: firstWeekday }).map((_, i) => (
              <div key={`blank-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => {
                    commit(toISO(new Date(year, month, day)));
                    setOpen(false);
                  }}
                  className={cn(
                    "h-8 w-full rounded-lg text-sm hover:bg-sky-50",
                    isSelected(day)
                      ? "bg-sky-600 text-white hover:bg-sky-600"
                      : isToday(day)
                        ? "font-semibold text-sky-700"
                        : "text-slate-700",
                  )}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Footer actions */}
          <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2">
            <button
              type="button"
              onClick={() => {
                const now = new Date();
                commit(toISO(now));
                setView(now);
                setOpen(false);
              }}
              className="text-xs font-medium text-sky-700 hover:underline"
            >
              Today
            </button>
            {value && (
              <button
                type="button"
                onClick={() => {
                  commit("");
                  setOpen(false);
                }}
                className="flex items-center gap-1 text-xs text-slate-500 hover:underline"
              >
                <X className="size-3" />
                Clear
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
