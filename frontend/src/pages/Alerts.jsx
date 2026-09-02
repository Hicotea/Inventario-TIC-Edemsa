import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, PackageX, PackageSearch, Timer } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import StatusBadge from "@/components/StatusBadge";
import EmptyState from "@/components/EmptyState";
import PageHeader from "@/components/PageHeader";
import { api } from "@/lib/api";
import { tAlertKind } from "@/lib/format";

const KIND_ICONS = {
  low_stock: AlertTriangle,
  out_of_stock: PackageX,
  missing_code: PackageSearch,
  no_movement: Timer,
};

function AlertRow({ a }) {
  const Icon = KIND_ICONS[a.kind] || AlertTriangle;
  const sev = a.severity === "error" ? "out" : a.severity === "warn" ? "low" : "info";
  return (
    <Link to={a.product_id ? `/products/${a.product_id}` : "#"} className="flex items-center gap-3 rounded-lg border border-border p-3 hover:bg-muted/40">
      <div className="grid h-9 w-9 place-items-center rounded-lg bg-muted"><Icon size={16} /></div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">{a.product_name}</span>
          <StatusBadge status={sev} label={tAlertKind(a.kind)} />
        </div>
        <div className="text-xs text-muted-foreground truncate">{a.message}</div>
      </div>
      <div className="font-mono text-[11px] text-muted-foreground">{a.product_sku}</div>
    </Link>
  );
}

export default function Alerts() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/dashboard/alerts").then(r => setItems(r.data)).finally(() => setLoading(false));
  }, []);

  const groups = {
    all: items,
    low_stock: items.filter(i => i.kind === "low_stock"),
    out_of_stock: items.filter(i => i.kind === "out_of_stock"),
    missing_code: items.filter(i => i.kind === "missing_code"),
    no_movement: items.filter(i => i.kind === "no_movement"),
  };

  return (
    <div>
      <PageHeader
        title="Alertas"
        description="Elementos que requieren atención: stock bajo/agotado, sin código o sin movimientos."
        breadcrumb={[{ label: "Inicio", to: "/" }, { label: "Alertas" }]}
      />
      <Card className="p-4">
        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">Todas ({items.length})</TabsTrigger>
            <TabsTrigger value="out_of_stock">Agotadas ({groups.out_of_stock.length})</TabsTrigger>
            <TabsTrigger value="low_stock">Stock bajo ({groups.low_stock.length})</TabsTrigger>
            <TabsTrigger value="missing_code">Sin código ({groups.missing_code.length})</TabsTrigger>
            <TabsTrigger value="no_movement">Sin movimiento ({groups.no_movement.length})</TabsTrigger>
          </TabsList>
          {Object.entries(groups).map(([k, list]) => (
            <TabsContent key={k} value={k} className="mt-3 grid gap-2">
              {loading ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />) :
                list.length === 0 ? <EmptyState title="Sin alertas en esta categoría" description="Todo está en orden por ahora." /> :
                list.map(a => <AlertRow key={a.id} a={a} />)}
            </TabsContent>
          ))}
        </Tabs>
      </Card>
    </div>
  );
}
