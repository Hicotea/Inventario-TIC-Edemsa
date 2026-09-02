import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import PageHeader from "@/components/PageHeader";
import { api, showError } from "@/lib/api";
import { formatDateTime } from "@/lib/format";

// Backend entity codes (kept technical for filtering) mapped to Spanish labels.
const ENTITY_LABELS = {
  auth: "Autenticación",
  user: "Usuario",
  product: "Producto",
  movement: "Movimiento",
  Category: "Categoría",
  Brand: "Marca",
  Location: "Ubicación",
  Supplier: "Proveedor",
  stock_count: "Inventario físico",
  import: "Importación",
  report: "Reporte",
  role_permissions: "Permisos de rol",
};

export default function Audit() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [entity, setEntity] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try { const { data } = await api.get("/audit", { params: { q: q || undefined, entity: entity || undefined, limit: 500 } }); setItems(data); }
    catch (e) { showError(e); } finally { setLoading(false); }
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { const t = setTimeout(load, 200); return () => clearTimeout(t); }, [q, entity]);

  const entities = Object.keys(ENTITY_LABELS);

  return (
    <div>
      <PageHeader title="Auditoría" description="Bitácora inmutable y solo de lectura de cada acción relevante." breadcrumb={[{ label: "Administración" }, { label: "Auditoría" }]} />
      <Card className="p-3 md:p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar acciones, usuarios o entidades…" className="pl-9 h-10" aria-label="Buscar en la auditoría" />
          </div>
          <Select value={entity || "__all__"} onValueChange={(v) => setEntity(v === "__all__" ? "" : v)}>
            <SelectTrigger className="h-10 w-full md:w-[220px]"><SelectValue placeholder="Todas las entidades" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Todas las entidades</SelectItem>
              {entities.map(e => <SelectItem key={e} value={e}>{ENTITY_LABELS[e]}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </Card>
      <Card className="mt-4 overflow-hidden">
        {loading ? <div className="p-6 text-sm text-muted-foreground">Cargando…</div> : items.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">Ningún registro coincide con los filtros.</div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow className="bg-muted/40">
                <TableHead>Fecha y hora</TableHead><TableHead>Usuario</TableHead><TableHead>Acción</TableHead><TableHead>Entidad</TableHead><TableHead>ID de entidad</TableHead><TableHead>Detalles</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {items.map(a => (
                  <TableRow key={a.id}>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{formatDateTime(a.created_at)}</TableCell>
                    <TableCell><div className="font-medium">{a.user_name || "—"}</div><div className="font-mono text-[11px] text-muted-foreground">{a.user_id}</div></TableCell>
                    <TableCell><Badge variant="secondary" className="font-mono text-[11px]">{a.action}</Badge></TableCell>
                    <TableCell>{ENTITY_LABELS[a.entity] || a.entity}</TableCell>
                    <TableCell className="font-mono text-[11px] text-muted-foreground truncate max-w-[220px]">{a.entity_id || "—"}</TableCell>
                    <TableCell className="max-w-[380px] truncate font-mono text-[11px] text-muted-foreground">{a.details ? JSON.stringify(a.details) : "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
}
