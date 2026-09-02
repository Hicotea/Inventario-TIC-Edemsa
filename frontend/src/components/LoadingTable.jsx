import { Skeleton } from "@/components/ui/skeleton";

export default function LoadingTable({ rows = 8, cols = 5 }) {
  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="grid grid-cols-1 gap-2 p-4">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="grid gap-3" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))` }}>
            {Array.from({ length: cols }).map((__, j) => (
              <Skeleton key={j} className="h-6 w-full" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
