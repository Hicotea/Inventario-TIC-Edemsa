import { useState } from "react";
import { Upload, Download, CheckCircle2, Loader2, FileSpreadsheet } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import PageHeader from "@/components/PageHeader";
import { api, API, showError, showSuccess } from "@/lib/api";

export default function ImportProducts() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);
  const [committed, setCommitted] = useState(null);

  const downloadTemplate = async () => {
    try {
      const token = localStorage.getItem("it-inv-token");
      const res = await fetch(`${API}/import/template`, { headers: { Authorization: `Bearer ${token}` } });
      const blob = await res.blob();
      const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "plantilla_productos.xlsx"; a.click();
      showSuccess("Plantilla descargada.");
    } catch (e) { showError(e); }
  };

  const doPreview = async () => {
    if (!file) return;
    setBusy(true); setPreview(null); setCommitted(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const { data } = await api.post("/import/preview", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setPreview(data);
    } catch (e) { showError(e); }
    finally { setBusy(false); }
  };

  const doCommit = async () => {
    if (!preview?.valid_rows?.length) return;
    setBusy(true);
    try {
      const { data } = await api.post("/import/commit", { rows: preview.valid_rows });
      setCommitted(data);
      showSuccess(`Se importaron ${data.created} productos. Omitidos: ${data.skipped}.`);
    } catch (e) { showError(e); }
    finally { setBusy(false); }
  };

  return (
    <div>
      <PageHeader title="Importación masiva" description="Importe productos desde Excel/CSV. Los errores se muestran antes de la confirmación final."
        breadcrumb={[{ label: "Inicio", to: "/" }, { label: "Importar" }]}
        actions={<Button variant="outline" onClick={downloadTemplate}><Download size={16} className="mr-2" />Descargar plantilla</Button>} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-1">
          <div className="font-display text-sm font-semibold">Paso 1 — Cargar archivo</div>
          <div className="mt-3 grid gap-3">
            <div className="rounded-xl border-2 border-dashed border-border p-6 text-center">
              <FileSpreadsheet className="mx-auto text-muted-foreground" />
              <div className="mt-2 text-sm">Seleccione un archivo .xlsx o .csv</div>
              <Input type="file" accept=".xlsx,.csv" onChange={e => setFile(e.target.files?.[0] || null)} className="mt-3" data-testid="import-upload-input" />
            </div>
            <Button onClick={doPreview} disabled={!file || busy} data-testid="import-preview-button">
              {busy ? <><Loader2 className="mr-2 animate-spin" size={16}/>Analizando…</> : <><Upload size={16} className="mr-2" />Previsualizar importación</>}
            </Button>
            <div className="rounded-lg bg-muted/40 p-3 text-[11px] text-muted-foreground leading-relaxed">
              <div className="font-medium text-foreground">Columnas requeridas</div>
              <div className="mt-1 font-mono">sku, name, initial_stock</div>
              <div className="mt-2">Los nombres de columna en la plantilla se conservan en inglés por compatibilidad técnica con la API.</div>
            </div>
          </div>
        </Card>

        <Card className="p-5 lg:col-span-2">
          <div className="font-display text-sm font-semibold">Paso 2 — Revisar</div>
          {!preview ? (
            <div className="mt-3 rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">Cargue un archivo para ver la previsualización.</div>
          ) : (
            <div className="mt-3">
              <div className="grid grid-cols-3 gap-3">
                <Card className="p-3"><div className="text-xs text-muted-foreground">Filas totales</div><div className="font-display text-2xl tabular-nums">{preview.total}</div></Card>
                <Card className="p-3 bg-emerald-50 border-emerald-200"><div className="text-xs text-emerald-800">Válidas</div><div className="font-display text-2xl tabular-nums text-emerald-900">{preview.valid}</div></Card>
                <Card className="p-3 bg-rose-50 border-rose-200"><div className="text-xs text-rose-800">Con errores</div><div className="font-display text-2xl tabular-nums text-rose-900">{preview.invalid}</div></Card>
              </div>

              {preview.invalid_rows.length > 0 && (
                <div className="mt-4">
                  <div className="mb-2 text-sm font-medium">Filas con errores</div>
                  <div className="overflow-x-auto rounded-lg border border-border">
                    <Table>
                      <TableHeader><TableRow className="bg-muted/40"><TableHead>Fila</TableHead><TableHead>SKU</TableHead><TableHead>Nombre</TableHead><TableHead>Errores</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {preview.invalid_rows.map((r) => (
                          <TableRow key={r.row}>
                            <TableCell>{r.row}</TableCell>
                            <TableCell className="font-mono text-xs">{r.data.sku}</TableCell>
                            <TableCell>{r.data.name}</TableCell>
                            <TableCell><div className="flex flex-wrap gap-1">{r.errors.map((e, i) => <Badge key={i} className="bg-rose-50 text-rose-800 border-rose-200">{e}</Badge>)}</div></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              <div className="mt-4 flex justify-end gap-2">
                <Button onClick={doCommit} disabled={busy || preview.valid === 0} data-testid="import-commit-button">
                  {busy ? <><Loader2 className="mr-2 animate-spin" size={16}/>Importando…</> : <><CheckCircle2 size={16} className="mr-2" />Importar {preview.valid} fila{preview.valid === 1 ? "" : "s"} válida{preview.valid === 1 ? "" : "s"}</>}
                </Button>
              </div>
            </div>
          )}

          {committed && (
            <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
              <div className="flex items-center gap-2 font-medium"><CheckCircle2 size={16}/> Importación finalizada</div>
              <div className="mt-1">Creados: {committed.created} · Omitidos: {committed.skipped} · Errores: {committed.errors?.length || 0}</div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
