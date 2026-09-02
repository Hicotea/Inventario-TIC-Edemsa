import { cn } from "@/lib/utils";
import { PackageOpen } from "lucide-react";

export default function EmptyState({ icon: Icon = PackageOpen, title, description, action, className }) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-card p-10 text-center", className)}>
      <div className="grid h-12 w-12 place-items-center rounded-full bg-accent text-accent-foreground">
        <Icon size={22} strokeWidth={1.75} />
      </div>
      <div>
        <div className="font-display text-base font-semibold">{title}</div>
        {description && <div className="mt-1 text-sm text-muted-foreground">{description}</div>}
      </div>
      {action && <div className="pt-2">{action}</div>}
    </div>
  );
}
