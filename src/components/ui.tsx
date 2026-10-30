"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";

export const inputCls =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-base outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-zinc-700 dark:bg-zinc-900";

export const btn = {
  primary:
    "rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-40",
  outline:
    "rounded-lg border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-100 disabled:opacity-40 dark:border-zinc-700 dark:hover:bg-zinc-800",
  danger:
    "rounded-lg border border-red-300 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950",
  small:
    "rounded-md border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800",
};

// Renders children only in the browser (they read localStorage on first render).
export function ClientOnly({ children }: { children: ReactNode }) {
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  return mounted ? children : null;
}

// useState that survives a page refresh mid-game.
export function usePersistentState<T>(key: string, init: () => T) {
  const [state, setState] = useState<T>(() => {
    try {
      const saved = localStorage.getItem(key);
      if (saved) return JSON.parse(saved) as T;
    } catch {}
    return init();
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {}
  }, [key, state]);
  return [state, setState] as const;
}

export function Card({
  title,
  action,
  children,
}: {
  title: ReactNode;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function NumberField({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  return (
    <label className="block text-sm text-zinc-600 dark:text-zinc-400">
      {label}
      <input
        type="number"
        inputMode="decimal"
        min={0}
        disabled={disabled}
        className={`${inputCls} mt-1 text-zinc-900 disabled:opacity-40 dark:text-zinc-100`}
        value={Number.isFinite(value) ? value : ""}
        onChange={(e) => onChange(e.target.valueAsNumber)}
      />
    </label>
  );
}

export function Counter({
  label,
  hideLabel,
  value,
  min = 0,
  onMinus,
  onPlus,
}: {
  label: string;
  hideLabel?: boolean;
  value: number;
  min?: number;
  onMinus: () => void;
  onPlus: () => void;
}) {
  const b =
    "h-8 w-8 shrink-0 rounded-md border border-zinc-300 text-lg leading-none hover:bg-zinc-100 disabled:opacity-30 dark:border-zinc-700 dark:hover:bg-zinc-800";
  return (
    <div className={`flex items-center gap-1.5 text-sm ${hideLabel ? "justify-center" : ""}`}>
      {!hideLabel && <span className="text-zinc-500">{label}</span>}
      <button className={b} disabled={value <= min} onClick={onMinus} aria-label={`ลด${label}`}>
        −
      </button>
      <span className="w-5 text-center font-mono">{value}</span>
      <button className={b} onClick={onPlus} aria-label={`เพิ่ม${label}`}>
        +
      </button>
    </div>
  );
}

// Two-tap confirm instead of a blocking browser dialog.
export function ConfirmButton({
  children,
  onConfirm,
}: {
  children: ReactNode;
  onConfirm: () => void;
}) {
  const [armed, setArmed] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  return (
    <button
      className={btn.danger}
      onClick={() => {
        if (armed) {
          clearTimeout(timer.current);
          setArmed(false);
          onConfirm();
        } else {
          setArmed(true);
          timer.current = setTimeout(() => setArmed(false), 3000);
        }
      }}
    >
      {armed ? "กดอีกครั้งเพื่อยืนยัน" : children}
    </button>
  );
}

export function SummaryRow({
  label,
  value,
  strong,
  className = "",
}: {
  label: ReactNode;
  value: ReactNode;
  strong?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`flex justify-between gap-4 py-1 ${strong ? "border-t border-zinc-200 pt-2 text-base font-semibold dark:border-zinc-800" : "text-sm"} ${className}`}
    >
      <dt>{label}</dt>
      <dd className="font-mono tabular-nums">{value}</dd>
    </div>
  );
}

export const plColor = (x: number) =>
  x > 0 ? "text-emerald-600" : x < 0 ? "text-red-600" : "text-zinc-500";
