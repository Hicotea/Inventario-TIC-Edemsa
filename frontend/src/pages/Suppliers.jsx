import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Loader2, Mail, Phone } from "lucide-react";
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

const empty = { name: "", tax_id: "", contact_name: "", phone: "", email: "", address: "", notes: "", is_active: true };

export default function Suppliers() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openEdit, setOpenEdit] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const { hasPerm } = useAuth();
  const canWrite = hasPerm("master:write");

  const load = async () => {
    setLoading(true);
    try { const { data } = await api.get("/suppliers"); setItems(data); }
    catch (e) { showError(e); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm(empty); setOpenEdit(true); };
  const openUpdate = (it) => { setEditing(it); setForm({ ...empty, ...it }); setOpenEdit(true); };

  const save = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const payload = { ...form };
      if (editing) { await api.patch(`/suppliers/${editing.id}`, payload); showSuccess("Supplier updated."); }
      else { await api.post("/suppliers", payload); showSuccess("Supplier created."); }
      setOpenEdit(false); load();
    } catch (e) { showError(e); } finally { setSaving(false); }
  };

  const doDelete = async () => {
    if (!toDelete) return;
    try { await api.delete(`/suppliers/${toDelete.id}`); showSuccess("Supplier deleted."); load(); }
    catch (e) { showError(e); }
    finally { setToDelete(null); }
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div>
      <PageHeader title="Suppliers" description="External vendors and their contact info." breadcrumb={[{ label: "Master data" }, { label: "Suppliers" }]}
        actions={canWrite && <Button onClick={openCreate}><Plus size={16} className="mr-2" />New supplier</Button>} />
      {loading ? <Card className="p-4">Loading…</Card> : items.length === 0 ? (
        <EmptyState title="No suppliers yet" action={canWrite && <Button onClick={openCreate}><Plus size={16} className="mr-2" />New supplier</Button>} />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader><TableRow className="bg-muted/40">
              <TableHead>Name</TableHead><TableHead>Contact</TableHead><TableHead>Phone</TableHead><TableHead>Email</TableHead><TableHead className="text-right">Actions</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {items.map(s => (
                <TableRow key={s.id}>
                  <TableCell><div className="font-medium">{s.name}</div><div className="text-xs text-muted-foreground">{s.address || "—"}</div></TableCell>
                  <TableCell>{s.contact_name || "—"}</TableCell>
                  <TableCell>{s.phone ? <span className="inline-flex items-center gap-1 text-sm"><Phone size={12} />{s.phone}</span> : "—"}</TableCell>
                  <TableCell>{s.email ? <span className="inline-flex items-center gap-1 text-sm"><Mail size={12} />{s.email}</span> : "—"}</TableCell>
                  <TableCell className="text-right">{canWrite && (
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" onClick={() => openUpdate(s)}><Pencil size={14} /></Button>
                      <Button size="icon" variant="ghost" onClick={() => setToDelete(s)}><Trash2 size={14} className="text-rose-600" /></Button>
                    </div>
                  )}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <Dialog open={openEdit} onOpenChange={setOpenEdit}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Edit supplier" : "New supplier"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="grid gap-1.5 md:col-span-2"><Label>Name</Label><Input value={form.name} onChange={e => set("name", e.target.value)} required /></div>
            <div className="grid gap-1.5"><Label>Tax ID</Label><Input value={form.tax_id} onChange={e => set("tax_id", e.target.value)} /></div>
            <div className="grid gap-1.5"><Label>Contact</Label><Input value={form.contact_name} onChange={e => set("contact_name", e.target.value)} /></div>
            <div className="grid gap-1.5"><Label>Phone</Label><Input value={form.phone} onChange={e => set("phone", e.target.value)} /></div>
            <div className="grid gap-1.5"><Label>Email</Label><Input type="email" value={form.email} onChange={e => set("email", e.target.value)} /></div>
            <div className="grid gap-1.5 md:col-span-2"><Label>Address</Label><Input value={form.address} onChange={e => set("address", e.target.value)} /></div>
            <div className="grid gap-1.5 md:col-span-2"><Label>Notes</Label><Textarea rows={2} value={form.notes} onChange={e => set("notes", e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenEdit(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving || !form.name.trim()}>{saving ? <><Loader2 className="mr-2 animate-spin" size={16}/>Saving…</> : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!toDelete} onOpenChange={(v) => !v && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete supplier?</AlertDialogTitle>
            <AlertDialogDescription>This will remove <span className="font-medium">{toDelete?.name}</span>.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={doDelete} className="bg-rose-600 text-white hover:bg-rose-700">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
