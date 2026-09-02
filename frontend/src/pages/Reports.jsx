import { useEffect, useState } from "react";
import { FileSpreadsheet, FileText, FileType2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import PageHeader from "@/components/PageHeader";
import { api, API, showError, showSuccess } from "@/lib/api";

async function download(url, filename) {
  const token = localStorage.getItem("it-inv-token");
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error("Falló la exportación");
  const blob = await res.blob();
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
}

export default function Reports() {
  const [cats, setCats] = useState([]);
  const [locs, setLocs] = useState([]);
  const [inv, setInv] = useState({ category_id: "", location_id: "", status: "" });
  const [mov, setMov] = useState({ type: "", date_from: "", date_to: "" });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    Promise.all([api.get("/categories"), api.get("/locations")]).then(([a, b]) => { setCats(a.data); setLocs(b.data); });
  }, []);

  const runInventory = async (fmt) => {
    setBusy(true);
    try {
      const url = new URL(`${API}/reports/inventory/export`);
      url.searchParams.set("format", fmt);
      if (inv.category_id) url.searchParams.set("category_id", inv.category_id);
      if (inv.location_id) url.searchParams.set("location_id", inv.location_id);
      if (inv.status) url.searchParams.set("status", inv.status);
      await download(url.toString(), `inventario.${fmt}`);
      showSuccess("Reporte de inventario descargado.");
    } catch (e) { showError(e); } finally { setBusy(false); }
  };

  const runMovements = async (fmt) => {
    setBusy(true);
    try {
      const url = new URL(`${API}/reports/movements/export`);
      url.searchParams.set("format", fmt);
      if (mov.type) url.searchParams.set("type", mov.type);
      if (mov.date_from) url.searchParams.set("date_from", mov.date_from);
      if (mov.date_to) url.searchParams.set("date_to", mov.date_to);
      await download(url.toString(), `movimientos.${fmt}`);
      showSuccess("Reporte de movimientos descargado.");
    } catch (e) { showError(e); } finally { setBusy(false); }
  };

  return (
    <div>
      <PageHeader title="Reportes" description="Exporte información operativa con los filtros que necesite."
        breadcrumb={[{ label: "Inicio", to: "/" }, { label: "Reportes" }]} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <div className="font-display text-sm font-semibold">Reporte de inventario</div>
          <div className="mt-1 text-xs text-muted-foreground">Fotografía del stock actual, filtrada por categoría, ubicación o estado.</div>
          <div className="mt-4 grid gap-3">
            <div className="grid grid-cols-3 gap-2">
              <div className="grid gap-1.5">
                <Label>Categoría</Label>
                <Select value={inv.category_id || "__all__"} onValueChange={(v) => setInv(x => ({ ...x, category_id: v === "__all__" ? "" : v }))}>
                  <SelectTrigger><SelectValue placeholder="Todas" /></SelectTrigger>
                  <SelectContent><SelectItem value="__all__">Todas las categorías</SelectItem>{cats.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label>Ubicación</Label>
                <Select value={inv.location_id || "__all__"} onValueChange={(v) => setInv(x => ({ ...x, location_id: v === "__all__" ? "" : v }))}>
                  <SelectTrigger><SelectValue placeholder="Todas" /></SelectTrigger>
                  <SelectContent><SelectItem value="__all__">Todas las ubicaciones</SelectItem>{locs.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label>Estado</Label>
                <Select value={inv.status || "__all__"} onValueChange={(v) => setInv(x => ({ ...x, status: v === "__all__" ? "" : v }))}>
                  <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Todos</SelectItem>
                    <SelectItem value="available">Disponible</SelectItem>
                    <SelectItem value="low">Stock bajo</SelectItem>
                    <SelectItem value="out">Agotado</SelectItem>
                    <SelectItem value="inactive">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => runInventory("xlsx")} disabled={busy}><FileSpreadsheet size={16} className="mr-2" />Excel</Button>
              <Button onClick={() => runInventory("csv")} disabled={busy} variant="outline"><FileText size={16} className="mr-2" />CSV</Button>
              <Button onClick={() => runInventory("pdf")} disabled={busy} variant="outline"><FileType2 size={16} className="mr-2" />PDF</Button>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="font-display text-sm font-semibold">Reporte de movimientos</div>
          <div className="mt-1 text-xs text-muted-foreground">Entradas, salidas y ajustes del periodo seleccionado.</div>
          <div className="mt-4 grid gap-3">
            <div className="grid grid-cols-3 gap-2">
              <div className="grid gap-1.5">
                <Label>Tipo</Label>
                <Select value={mov.type || "__all__"} onValueChange={(v) => setMov(x => ({ ...x, type: v === "__all__" ? "" : v }))}>
                  <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                  <SelectContent><SelectItem value="__all__">Todos</SelectItem><SelectItem value="entry">Entradas</SelectItem><SelectItem value="exit">Salidas</SelectItem><SelectItem value="adjustment">Ajustes</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5"><Label>Desde</Label><Input type="date" value={mov.date_from} onChange={e => setMov(x => ({ ...x, date_from: e.target.value }))} /></div>
              <div className="grid gap-1.5"><Label>Hasta</Label><Input type="date" value={mov.date_to} onChange={e => setMov(x => ({ ...x, date_to: e.target.value }))} /></div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => runMovements("xlsx")} disabled={busy}><FileSpreadsheet size={16} className="mr-2" />Excel</Button>
              <Button onClick={() => runMovements("csv")} disabled={busy} variant="outline"><FileText size={16} className="mr-2" />CSV</Button>
              <Button onClick={() => runMovements("pdf")} disabled={busy} variant="outline"><FileType2 size={16} className="mr-2" />PDF</Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
