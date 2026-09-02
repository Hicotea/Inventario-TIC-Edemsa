import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export default function PageHeader({ title, description, breadcrumb = [], actions, className }) {
  return (
    <div className={cn("flex flex-col gap-3 pb-4 md:pb-6", className)}>
      {breadcrumb.length > 0 && (
        <nav className="flex items-center gap-1 text-xs text-muted-foreground">
          {breadcrumb.map((b, i) => (
            <span key={i} className="inline-flex items-center gap-1">
              {b.to ? (
                <Link to={b.to} className="hover:text-foreground">{b.label}</Link>
              ) : (
                <span className="text-foreground">{b.label}</span>
              )}
              {i < breadcrumb.length - 1 && <ChevronRight size={12} />}
            </span>
          ))}
        </nav>
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-display text-2xl md:text-3xl font-semibold tracking-tight text-foreground">{title}</h1>
          {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
