import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import { api, showError, showSuccess } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export default function MasterList({ collection, title, description, singular, singularArticle = "un" }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openEdit, setOpenEdit] = useState(false);
  const [editing, setEditing] = useState(null);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const { hasPerm } = useAuth();
  const canWrite = hasPerm("master:write");

  const load = async () => {
    setLoading(true);
    try { const { data } = await api.get(`/${collection}`); setItems(data); }
    catch (e) { showError(e); } finally { setLoading(false); }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [collection]);

  const openCreate = () => { setEditing(null); setName(""); setDesc(""); setOpenEdit(true); };
  const openUpdate = (it) => { setEditing(it); setName(it.name); setDesc(it.description || ""); setOpenEdit(true); };

  const save = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      if (editing) {
        await api.patch(`/${collection}/${editing.id}`, { name, description: desc || null, is_active: true });
        showSuccess(`${singular} actualizad${singularArticle === "una" ? "a" : "o"}.`);
      } else {
        await api.post(`/${collection}`, { name, description: desc || null, is_active: true });
        showSuccess(`${singular} cread${singularArticle === "una" ? "a" : "o"}.`);
      }
      setOpenEdit(false); load();
    } catch (e) { showError(e); }
    finally { setSaving(false); }
  };

  const doDelete = async () => {
    if (!toDelete) return;
    try { await api.delete(`/${collection}/${toDelete.id}`); showSuccess(`${singular} eliminad${singularArticle === "una" ? "a" : "o"}.`); load(); }
    catch (e) { showError(e); }
    finally { setToDelete(null); }
  };

  const newLabel = `Nuev${singularArticle === "una" ? "a" : "o"} ${singular.toLowerCase()}`;

  return (
    <div>
      <PageHeader
        title={title}
        description={description}
        breadcrumb={[{ label: "Datos maestros" }, { label: title }]}
        actions={canWrite && <Button onClick={openCreate}><Plus size={16} className="mr-2" />{newLabel}</Button>}
      />
      {loading ? (
        <Card className="p-4">Cargando…</Card>
      ) : items.length === 0 ? (
        <EmptyState title={`Aún no hay ${title.toLowerCase()}`} action={canWrite && <Button onClick={openCreate}><Plus size={16} className="mr-2" />{newLabel}</Button>} />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead>Nombre</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead className="w-[120px] text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map(it => (
                <TableRow key={it.id}>
                  <TableCell className="font-medium">{it.name}</TableCell>
                  <TableCell className="text-muted-foreground">{it.description || "—"}</TableCell>
                  <TableCell className="text-right">
                    {canWrite && (
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" onClick={() => openUpdate(it)} aria-label="Editar"><Pencil size={14} /></Button>
                        <Button size="icon" variant="ghost" onClick={() => setToDelete(it)} aria-label="Eliminar"><Trash2 size={14} className="text-rose-600" /></Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <Dialog open={openEdit} onOpenChange={setOpenEdit}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? `Editar ${singular.toLowerCase()}` : newLabel}</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label>Nombre</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="p. ej. Periféricos" autoFocus />
            </div>
            <div className="grid gap-1.5">
              <Label>Descripción</Label>
              <Textarea rows={2} value={desc} onChange={e => setDesc(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenEdit(false)}>Cancelar</Button>
            <Button onClick={save} disabled={saving || !name.trim()}>{saving ? <><Loader2 className="mr-2 animate-spin" size={16}/>Guardando…</> : "Guardar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!toDelete} onOpenChange={(v) => !v && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar {singular.toLowerCase()}?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará permanentemente <span className="font-medium">{toDelete?.name}</span>. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={doDelete} className="bg-rose-600 text-white hover:bg-rose-700">Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
