import { cn } from "@/lib/utils";
import { tStatus } from "@/lib/format";

const STYLES = {
  available: "bg-emerald-50 text-emerald-800 border-emerald-200",
  low: "bg-amber-50 text-amber-900 border-amber-200",
  out: "bg-rose-50 text-rose-800 border-rose-200",
  discontinued: "bg-slate-100 text-slate-700 border-slate-200",
  inactive: "bg-slate-100 text-slate-500 border-slate-200",
  info: "bg-cyan-50 text-cyan-900 border-cyan-200",
  warn: "bg-amber-50 text-amber-900 border-amber-200",
  error: "bg-rose-50 text-rose-800 border-rose-200",
};

const DOTS = {
  available: "bg-emerald-500",
  low: "bg-amber-500",
  out: "bg-rose-500",
  discontinued: "bg-slate-500",
  inactive: "bg-slate-400",
  info: "bg-cyan-500",
  warn: "bg-amber-500",
  error: "bg-rose-500",
};

export default function StatusBadge({ status = "available", className, label }) {
  const s = STYLES[status] || STYLES.available;
  const dot = DOTS[status] || DOTS.available;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        s,
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", dot)} />
      {label ?? tStatus(status)}
    </span>
  );
}
