import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowDownRight, ArrowUpRight, SlidersHorizontal, Download, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import LoadingTable from "@/components/LoadingTable";
import { api, showError, showSuccess, API } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { TID } from "@/lib/testIds";
import { formatDateTime, formatNumber, tMovementType, tReason } from "@/lib/format";

function TypeCell({ type }) {
  const cfg = {
    entry: { icon: ArrowDownRight, cls: "text-emerald-600", bg: "bg-emerald-50" },
    exit: { icon: ArrowUpRight, cls: "text-rose-600", bg: "bg-rose-50" },
    adjustment: { icon: SlidersHorizontal, cls: "text-amber-700", bg: "bg-amber-50" },
  }[type] || { icon: SlidersHorizontal, cls: "", bg: "" };
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full ${cfg.bg} px-2.5 py-0.5 text-xs font-medium ${cfg.cls}`}>
      <Icon size={12} />
      <span>{tMovementType(type)}</span>
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
  const { hasPerm } = useAuth();
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/movements", { params: {
        type: type === "all" ? undefined : type,
        q: q || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        limit: 500,
      }});
      setItems(data);
    } catch (e) { showError(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { const t = setTimeout(load, 200); return () => clearTimeout(t); /* eslint-disable-next-line */ }, [type, q, dateFrom, dateTo]);

  const exportFile = async (fmt) => {
    try {
      const token = localStorage.getItem("it-inv-token");
      const url = new URL(`${API}/reports/movements/export`);
      url.searchParams.set("format", fmt);
      if (type !== "all") url.searchParams.set("type", type);
      if (dateFrom) url.searchParams.set("date_from", dateFrom);
      if (dateTo) url.searchParams.set("date_to", dateTo);
      const res = await fetch(url.toString(), { headers: { Authorization: `Bearer ${token}` } });
      const blob = await res.blob();
      const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = `movimientos.${fmt}`; link.click();
      showSuccess("Exportación lista.");
    } catch (e) { showError(e); }
  };

  const canMove = hasPerm("movement:write");

  return (
    <div>
      <PageHeader
        title="Movimientos de inventario"
        description="Cada cambio de stock queda registrado y es trazable."
        breadcrumb={[{ label: "Inicio", to: "/" }, { label: "Movimientos" }]}
        actions={
          <>
            <Popover>
              <PopoverTrigger asChild><Button variant="outline" data-testid={TID.movementsExport}><Download size={16} className="mr-2"/>Exportar</Button></PopoverTrigger>
              <PopoverContent align="end" className="w-44 p-1">
                <button className="w-full rounded-md px-3 py-2 text-left text-sm hover:bg-accent" onClick={() => exportFile("xlsx")}>Excel (.xlsx)</button>
                <button className="w-full rounded-md px-3 py-2 text-left text-sm hover:bg-accent" onClick={() => exportFile("csv")}>CSV</button>
                <button className="w-full rounded-md px-3 py-2 text-left text-sm hover:bg-accent" onClick={() => exportFile("pdf")}>PDF</button>
              </PopoverContent>
            </Popover>
            {canMove && (
              <>
                <Button variant="outline" onClick={() => navigate("/movements/entry")}><ArrowDownRight size={16} className="mr-2" />Entrada</Button>
                <Button variant="outline" onClick={() => navigate("/movements/exit")}><ArrowUpRight size={16} className="mr-2" />Salida</Button>
                {hasPerm("adjustment:write") && (
                  <Button variant="outline" onClick={() => navigate("/movements/adjustment")}><SlidersHorizontal size={16} className="mr-2" />Ajuste</Button>
                )}
              </>
            )}
          </>
        }
      />

      <Card className="p-3 md:p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <Tabs value={type} onValueChange={setType} data-testid={TID.movementsTabs}>
            <TabsList>
              <TabsTrigger value="all">Todos</TabsTrigger>
              <TabsTrigger value="entry">Entradas</TabsTrigger>
              <TabsTrigger value="exit">Salidas</TabsTrigger>
              <TabsTrigger value="adjustment">Ajustes</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar por producto, SKU o motivo…" className="pl-9 h-10" aria-label="Buscar movimientos" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} placeholder="Desde" aria-label="Fecha desde" />
            <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} placeholder="Hasta" aria-label="Fecha hasta" />
          </div>
        </div>
      </Card>

      <div className="mt-4">
        {loading ? <LoadingTable rows={10} cols={7} /> : items.length === 0 ? (
          <EmptyState title="No se encontraron movimientos" description="Ajuste los filtros o registre un nuevo movimiento." />
        ) : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead>Fecha y hora</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Producto</TableHead>
                    <TableHead className="text-right">Cantidad</TableHead>
                    <TableHead className="text-right">Anterior</TableHead>
                    <TableHead className="text-right">Resultante</TableHead>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Motivo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map(h => (
                    <TableRow key={h.id}>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{formatDateTime(h.created_at)}</TableCell>
                      <TableCell><TypeCell type={h.type} /></TableCell>
                      <TableCell>
                        <Link to={`/products/${h.product_id}`} className="hover:underline">{h.product_name}</Link>
                        <div className="font-mono text-[11px] text-muted-foreground">{h.product_sku}</div>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{formatNumber(h.qty, { maximumFractionDigits: 0 })}</TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">{formatNumber(h.previous_stock, { maximumFractionDigits: 0 })}</TableCell>
                      <TableCell className="text-right tabular-nums font-medium">{formatNumber(h.resulting_stock, { maximumFractionDigits: 0 })}</TableCell>
                      <TableCell>{h.user_name || h.user_id}</TableCell>
                      <TableCell className="max-w-[280px] truncate">{tReason(h.reason) || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
