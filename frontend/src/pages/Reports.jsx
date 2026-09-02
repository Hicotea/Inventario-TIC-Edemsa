import { useEffect, useState } from "react";
import { Download, FileSpreadsheet, FileText, FileType2 } from "lucide-react";
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
  if (!res.ok) throw new Error("Export failed");
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
      await download(url.toString(), `inventory.${fmt}`);
      showSuccess("Inventory report downloaded.");
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
      await download(url.toString(), `movements.${fmt}`);
      showSuccess("Movement report downloaded.");
    } catch (e) { showError(e); } finally { setBusy(false); }
  };

  return (
    <div>
      <PageHeader title="Reports" description="Export operational data with the filters you need."
        breadcrumb={[{ label: "Home", to: "/" }, { label: "Reports" }]} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <div className="font-display text-sm font-semibold">Inventory report</div>
          <div className="mt-1 text-xs text-muted-foreground">Snapshot of current stock, filtered by category / location / status.</div>
          <div className="mt-4 grid gap-3">
            <div className="grid grid-cols-3 gap-2">
              <div className="grid gap-1.5">
                <Label>Category</Label>
                <Select value={inv.category_id || "__all__"} onValueChange={(v) => setInv(x => ({ ...x, category_id: v === "__all__" ? "" : v }))}>
                  <SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
                  <SelectContent><SelectItem value="__all__">All categories</SelectItem>{cats.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label>Location</Label>
                <Select value={inv.location_id || "__all__"} onValueChange={(v) => setInv(x => ({ ...x, location_id: v === "__all__" ? "" : v }))}>
                  <SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
                  <SelectContent><SelectItem value="__all__">All locations</SelectItem>{locs.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label>Status</Label>
                <Select value={inv.status || "__all__"} onValueChange={(v) => setInv(x => ({ ...x, status: v === "__all__" ? "" : v }))}>
                  <SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">All</SelectItem>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="out">Out</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
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
          <div className="font-display text-sm font-semibold">Movement report</div>
          <div className="mt-1 text-xs text-muted-foreground">Entries, exits and adjustments for a chosen period.</div>
          <div className="mt-4 grid gap-3">
            <div className="grid grid-cols-3 gap-2">
              <div className="grid gap-1.5">
                <Label>Type</Label>
                <Select value={mov.type || "__all__"} onValueChange={(v) => setMov(x => ({ ...x, type: v === "__all__" ? "" : v }))}>
                  <SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
                  <SelectContent><SelectItem value="__all__">All</SelectItem><SelectItem value="entry">Entries</SelectItem><SelectItem value="exit">Exits</SelectItem><SelectItem value="adjustment">Adjustments</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5"><Label>From</Label><Input type="date" value={mov.date_from} onChange={e => setMov(x => ({ ...x, date_from: e.target.value }))} /></div>
              <div className="grid gap-1.5"><Label>To</Label><Input type="date" value={mov.date_to} onChange={e => setMov(x => ({ ...x, date_to: e.target.value }))} /></div>
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
