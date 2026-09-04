import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowDownRight, ArrowUpRight, SlidersHorizontal, Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import PageHeader from "@/components/PageHeader";
import { api, showError } from "@/lib/api";
import { useAuth } from "@/lib/auth";

function TypeBadge({ type }) {
  const cfg = {
    entry: { label: "Entrada", cls: "text-emerald-700 bg-emerald-50 border-emerald-200", icon: ArrowDownRight },
    exit: { label: "Salida", cls: "text-rose-700 bg-rose-50 border-rose-200", icon: ArrowUpRight },
    adjustment: { label: "Ajuste", cls: "text-amber-700 bg-amber-50 border-amber-200", icon: SlidersHorizontal },
  }[type] || { label: type, cls: "text-gray-700 bg-gray-50 border-gray-200", icon: SlidersHorizontal };

  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 border px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.cls}`}>
      <Icon size={12} />
      {cfg.label}
    </span>
  );
}

export default function Movements() {
  const [type, setType] = useState("all");
  const [q, setQ] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const auth = useAuth();
  const navigate = useNavigate();

  const canMove = auth?.hasPerm ? auth.hasPerm("movement:write") : true;

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/movements", {
        params: {
          type: type === "all" ? undefined : type,
          q: q || undefined,
          date_from: dateFrom || undefined,
          date_to: dateTo || undefined,
          limit: 500,
        },
      });
      setItems(data || []);
    } catch (e) {
      showError(e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(load, 250);
    return () => clearTimeout(timer);
  }, [type, q, dateFrom, dateTo]);

  const safeDate = (iso) => {
    if (!iso) return "—";
    try {
      return new Date(iso).toLocaleString("es-CO");
    } catch {
      return iso;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Historial de Movimientos"
        description="Consulta general de todas las entradas, salidas y ajustes de stock."
        breadcrumb={[{ label: "Inicio", to: "/" }, { label: "Movimientos" }]}
        actions={
          canMove && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => navigate("/movements/entry")}>
                <Plus size={14} className="mr-1 text-emerald-600" /> Entrada
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate("/movements/exit")}>
                <Plus size={14} className="mr-1 text-rose-600" /> Salida
              </Button>
            </div>
          )
        }
      />

      <Card className="p-4 space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Selector de tipo */}
          <div className="inline-flex p-1 bg-muted rounded-lg text-xs font-medium">
            {[
              { id: "all", label: "Todos" },
              { id: "entry", label: "Entradas" },
              { id: "exit", label: "Salidas" },
              { id: "adjustment", label: "Ajustes" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setType(tab.id)}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  type === tab.id ? "bg-background text-foreground shadow-sm font-semibold" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Buscador */}
          <div className="relative flex-1 max-w-md">
            <Search size={15} className="absolute left-3 top-2.5 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por producto, SKU, cédula, serie o motivo..."
              className="pl-9 h-9 text-sm"
            />
          </div>

          {/* Filtro de Fechas */}
          <div className="flex gap-2">
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-9 text-xs w-36" />
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-9 text-xs w-36" />
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden border border-border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/60 text-xs uppercase text-muted-foreground border-b border-border">
              <tr>
                <th className="p-3">Fecha y hora</th>
                <th className="p-3">Tipo</th>
                <th className="p-3">Producto</th>
                <th className="p-3 text-right">Cant.</th>
                <th className="p-3 text-right">Stock Ant.</th>
                <th className="p-3 text-right">Stock Res.</th>
                <th className="p-3">Detalle / Asignación</th>
                <th className="p-3">Usuario</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-muted-foreground">Cargando movimientos...</td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-muted-foreground">No se encontraron movimientos registrados.</td>
                </tr>
              ) : (
                items.map((h) => (
                  <tr key={h.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-3 whitespace-nowrap text-xs text-muted-foreground font-mono">
                      {safeDate(h.created_at)}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <TypeBadge type={h.type} />
                    </td>
                    <td className="p-3">
                      <Link to={`/products/${h.product_id}`} className="font-semibold text-foreground hover:underline">
                        {h.product_name}
                      </Link>
                      <div className="font-mono text-xs text-muted-foreground">{h.product_sku}</div>
                    </td>
                    <td className="p-3 text-right font-medium tabular-nums">{h.qty}</td>
                    <td className="p-3 text-right text-muted-foreground tabular-nums">{h.previous_stock ?? "—"}</td>
                    <td className="p-3 text-right font-semibold tabular-nums text-foreground">{h.resulting_stock ?? "—"}</td>
                    <td className="p-3 text-xs">
                      {h.type === "exit" && (h.recipient_name || h.serial_number || h.placa || h.device_name) ? (
                        <div className="space-y-0.5 bg-muted/40 p-2 rounded border border-border/50">
                          {h.recipient_name && <div><strong>A:</strong> {h.recipient_name} {h.recipient_document ? `(${h.recipient_document})` : ''}</div>}
                          {h.department && <div><strong>Área:</strong> {h.department}</div>}
                          {h.serial_number && <div><strong>S/N:</strong> <span className="font-mono">{h.serial_number}</span></div>}
                          {h.placa && <div><strong>Placa:</strong> <span className="font-mono text-blue-600">{h.placa}</span></div>}
                          {h.device_name && <div><strong>Equipo:</strong> <span className="font-mono">{h.device_name}</span></div>}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">{h.reason || "—"}</span>
                      )}
                    </td>
                    <td className="p-3 text-xs text-muted-foreground">
                      {h.user_name || h.user_id}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}