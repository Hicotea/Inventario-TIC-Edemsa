import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Package, Boxes, AlertTriangle, PackageX, ArrowUpRight,
  ArrowDownRight, Activity, Building2
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import { api } from "@/lib/api";
import { TID } from "@/lib/testIds";
import { formatNumber, tAlertKind } from "@/lib/format";

const CHART_COLORS = ["hsl(186 78% 28%)", "hsl(205 78% 40%)", "hsl(160 55% 34%)", "hsl(35 85% 55%)", "hsl(0 72% 51%)", "hsl(268 45% 45%)", "hsl(190 60% 45%)", "hsl(215 50% 40%)"];

function KpiCard({ icon: Icon, label, value, tone = "default", trend, testId }) {
  const toneClasses = {
    default: "bg-primary/5 text-primary",
    warn: "bg-amber-100 text-amber-800",
    danger: "bg-rose-100 text-rose-800",
    good: "bg-emerald-100 text-emerald-800",
  }[tone];
  return (
    <Card className="p-4 md:p-5" data-testid={testId}>
      <div className="flex items-center gap-3">
        <div className={`grid h-10 w-10 place-items-center rounded-lg ${toneClasses}`}>
          <Icon size={18} />
        </div>
        <div className="min-w-0">
          <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
          <div className="font-display text-2xl md:text-3xl font-semibold tabular-nums">{value}</div>
        </div>
        {trend && <div className="ml-auto text-xs text-muted-foreground">{trend}</div>}
      </div>
    </Card>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [timeseries, setTimeseries] = useState([]);
  const [distribution, setDistribution] = useState([]);
  const [topMoved, setTopMoved] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const [a, b, c, d, e] = await Promise.all([
          api.get("/dashboard/stats"),
          api.get("/dashboard/movements-timeseries", { params: { days: 14 } }),
          api.get("/dashboard/category-distribution"),
          api.get("/dashboard/top-moved", { params: { days: 30, limit: 6 } }),
          api.get("/dashboard/alerts"),
        ]);
        if (cancelled) return;
        setStats(a.data);
        setTimeseries(b.data);
        setDistribution(c.data);
        setTopMoved(d.data);
        setAlerts(e.data);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const fmt = (n) => (loading ? "—" : formatNumber(n ?? 0, { maximumFractionDigits: 0 }));

  return (
    <div>
      <PageHeader
        title="Panel principal"
        description="Vista en tiempo real de stock, movimientos y alertas."
        breadcrumb={[{ label: "Inicio" }, { label: "Panel principal" }]}
      />

      <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
        <KpiCard testId={TID.kpi("total-skus")} icon={Package} label="SKUs totales" value={fmt(stats?.total_skus)} />
        <KpiCard testId={TID.kpi("total-units")} icon={Boxes} label="Unidades en stock" value={fmt(stats?.total_units)} />
        <KpiCard testId={TID.kpi("low-stock")} icon={AlertTriangle} label="Stock bajo" value={fmt(stats?.low_stock)} tone="warn" />
        <KpiCard testId={TID.kpi("out-of-stock")} icon={PackageX} label="Agotados" value={fmt(stats?.out_of_stock)} tone="danger" />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
        <KpiCard testId={TID.kpi("entries-today")} icon={ArrowDownRight} label="Entradas hoy" value={fmt(stats?.entries_today)} tone="good" />
        <KpiCard testId={TID.kpi("exits-today")} icon={ArrowUpRight} label="Salidas hoy" value={fmt(stats?.exits_today)} />
        <KpiCard testId={TID.kpi("movements-today")} icon={Activity} label="Movimientos hoy" value={fmt(stats?.movements_today)} />
        <KpiCard testId={TID.kpi("categories")} icon={Building2} label="Categorías" value={fmt(stats?.total_categories)} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="p-4 lg:col-span-2" data-testid={TID.chartMovements}>
          <div className="mb-2 flex items-center justify-between">
            <div>
              <div className="font-display text-sm font-semibold">Movimientos últimos 14 días</div>
              <div className="text-xs text-muted-foreground">Unidades ingresadas frente a salidas por día</div>
            </div>
          </div>
          <div className="h-[260px]">
            {loading ? <Skeleton className="h-full w-full" /> : (
              <ResponsiveContainer>
                <AreaChart data={timeseries} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gEntries" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(186 78% 28%)" stopOpacity={0.35}/>
                      <stop offset="100%" stopColor="hsl(186 78% 28%)" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="gExits" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(35 85% 55%)" stopOpacity={0.35}/>
                      <stop offset="100%" stopColor="hsl(35 85% 55%)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="hsl(214 20% 90%)" strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={(d) => d?.slice(5)} tick={{ fill: "hsl(215 16% 40%)", fontSize: 12 }} />
                  <YAxis tick={{ fill: "hsl(215 16% 40%)", fontSize: 12 }} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(214 20% 90%)" }} />
                  <Area type="monotone" name="Entradas" dataKey="entries" stroke="hsl(186 78% 28%)" fill="url(#gEntries)" strokeWidth={2} />
                  <Area type="monotone" name="Salidas" dataKey="exits" stroke="hsl(35 85% 55%)" fill="url(#gExits)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card className="p-4" data-testid={TID.chartCategory}>
          <div className="mb-2">
            <div className="font-display text-sm font-semibold">Productos por categoría</div>
            <div className="text-xs text-muted-foreground">Distribución del catálogo</div>
          </div>
          <div className="h-[260px]">
            {loading ? <Skeleton className="h-full w-full" /> : (
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={distribution} dataKey="products" nameKey="category" innerRadius={45} outerRadius={80} paddingAngle={2}>
                    {distribution.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(214 20% 90%)" }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="p-4 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <div className="font-display text-sm font-semibold">Productos con más movimiento (30 días)</div>
              <div className="text-xs text-muted-foreground">Ordenados por unidades movidas</div>
            </div>
            <Link to="/movements" className="text-xs text-primary hover:underline">Ver todos →</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="py-2">Producto</th>
                  <th className="py-2">SKU</th>
                  <th className="py-2 text-right">Total movido</th>
                  <th className="py-2 text-right">Movimientos</th>
                </tr>
              </thead>
              <tbody>
                {loading ? Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}><td colSpan={4}><Skeleton className="my-2 h-6 w-full"/></td></tr>
                )) : topMoved.map((p) => (
                  <tr key={p.product_id} className="border-t border-border hover:bg-muted/50">
                    <td className="py-2">
                      <Link to={`/products/${p.product_id}`} className="hover:underline">{p.name}</Link>
                    </td>
                    <td className="py-2 font-mono text-xs text-muted-foreground">{p.sku}</td>
                    <td className="py-2 text-right tabular-nums">{formatNumber(p.total_moved, { maximumFractionDigits: 0 })}</td>
                    <td className="py-2 text-right tabular-nums text-muted-foreground">{formatNumber(p.movement_count, { maximumFractionDigits: 0 })}</td>
                  </tr>
                ))}
                {!loading && topMoved.length === 0 && (
                  <tr><td colSpan={4} className="py-4 text-center text-sm text-muted-foreground">Sin movimientos en los últimos 30 días.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-4" data-testid={TID.alertsPanel}>
          <div className="mb-3 flex items-center justify-between">
            <div>
              <div className="font-display text-sm font-semibold">Alertas</div>
              <div className="text-xs text-muted-foreground">Requieren atención</div>
            </div>
            <Link to="/alerts" className="text-xs text-primary hover:underline">Ver todas →</Link>
          </div>
          <div className="grid gap-2">
            {loading && Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            {!loading && alerts.slice(0, 6).map((a) => (
              <Link key={a.id} to={a.product_id ? `/products/${a.product_id}` : "/alerts"} className="flex items-center gap-3 rounded-lg border border-border p-2.5 hover:bg-muted/50">
                <StatusBadge status={a.severity === "error" ? "out" : a.severity === "warn" ? "low" : "info"} label={tAlertKind(a.kind)} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm">{a.message}</div>
                  <div className="truncate text-[11px] font-mono text-muted-foreground">{a.product_sku}</div>
                </div>
              </Link>
            ))}
            {!loading && alerts.length === 0 && (
              <div className="rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground">Todo en orden — sin alertas.</div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
