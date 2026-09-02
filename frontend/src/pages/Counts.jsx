import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, ClipboardList, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import { api, showError, showSuccess } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatDate, tCountStatus } from "@/lib/format";

export default function Counts() {
  const [items, setItems] = useState([]);
  const [locs, setLocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [locationId, setLocationId] = useState("");
  const [saving, setSaving] = useState(false);
  const nav = useNavigate();
  const { hasPerm } = useAuth();
  const canWrite = hasPerm("count:write");

  const load = async () => {
    setLoading(true);
    try { const { data } = await api.get("/counts"); setItems(data); }
    catch (e) { showError(e); } finally { setLoading(false); }
  };
  useEffect(() => { load(); api.get("/locations").then(r => setLocs(r.data)); }, []);

  const create = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const { data } = await api.post("/counts", { name, location_id: locationId || null });
      showSuccess("Sesión creada.");
      setOpen(false); setName(""); setLocationId("");
      nav(`/counts/${data.id}`);
    } catch (e) { showError(e); } finally { setSaving(false); }
  };

  return (
    <div>
      <PageHeader title="Inventario físico" description="Concilie el stock del sistema con lo que está físicamente en la estantería."
        breadcrumb={[{ label: "Inicio", to: "/" }, { label: "Inventario físico" }]}
        actions={canWrite && <Button onClick={() => setOpen(true)}><Plus size={16} className="mr-2" />Nueva sesión</Button>} />

      {loading ? <Card className="p-4">Cargando…</Card> : items.length === 0 ? (
        <EmptyState icon={ClipboardList} title="Aún no hay sesiones de conteo" description="Cree una para iniciar la conciliación de stock." action={canWrite && <Button onClick={() => setOpen(true)}>Nueva sesión</Button>} />
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {items.map(s => (
            <Card key={s.id} className="p-4 hover:shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <Link to={`/counts/${s.id}`} className="font-display font-semibold hover:underline">{s.name}</Link>
                  <div className="mt-1 text-xs text-muted-foreground">{s.location_name || "Todas las ubicaciones"}</div>
                </div>
                <Badge className={s.status === "open" ? "bg-emerald-100 text-emerald-800 border-emerald-200" : "bg-slate-100 text-slate-700 border-slate-200"}>{tCountStatus(s.status)}</Badge>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                <span>{s.items?.length || 0} ítem{(s.items?.length || 0) === 1 ? "" : "s"} contado{(s.items?.length || 0) === 1 ? "" : "s"}</span>
                <span>{formatDate(s.created_at)}</span>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nueva sesión de conteo</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-1.5"><Label>Nombre</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="Conteo físico Q4 2026" autoFocus /></div>
            <div className="grid gap-1.5">
              <Label>Ubicación</Label>
              <Select value={locationId || "__all__"} onValueChange={v => setLocationId(v === "__all__" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="Todas las ubicaciones" /></SelectTrigger>
                <SelectContent><SelectItem value="__all__">Todas las ubicaciones</SelectItem>{locs.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={create} disabled={saving || !name.trim()}>{saving ? <><Loader2 className="mr-2 animate-spin" size={16}/>Creando…</> : "Crear sesión"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
