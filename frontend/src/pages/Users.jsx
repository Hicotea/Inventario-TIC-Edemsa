import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import { api, showError, showSuccess } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatDate, tRole } from "@/lib/format";

const empty = { email: "", full_name: "", role: "viewer", password: "", is_active: true };

export default function Users() {
  const { user: me } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openEdit, setOpenEdit] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  const load = async () => {
    setLoading(true);
    try { const { data } = await api.get("/users"); setItems(data); }
    catch (e) { showError(e); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm(empty); setOpenEdit(true); };
  const openUpdate = (it) => { setEditing(it); setForm({ ...empty, ...it, password: "" }); setOpenEdit(true); };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      if (editing) {
        const payload = { role: form.role, full_name: form.full_name, is_active: form.is_active };
        if (form.password) payload.password = form.password;
        await api.patch(`/users/${editing.id}`, payload);
        showSuccess("Usuario actualizado.");
      } else {
        await api.post("/users", { email: form.email.trim().toLowerCase(), full_name: form.full_name, role: form.role, password: form.password, is_active: form.is_active });
        showSuccess("Usuario creado.");
      }
      setOpenEdit(false); load();
    } catch (e) { showError(e); } finally { setSaving(false); }
  };

  const doDelete = async () => {
    if (!toDelete) return;
    try { await api.delete(`/users/${toDelete.id}`); showSuccess("Usuario eliminado."); load(); }
    catch (e) { showError(e); } finally { setToDelete(null); }
  };

  return (
    <div>
      <PageHeader title="Usuarios" description="Gestione quién puede acceder al sistema y su rol."
        breadcrumb={[{ label: "Administración" }, { label: "Usuarios" }]}
        actions={<Button onClick={openCreate}><Plus size={16} className="mr-2" />Nuevo usuario</Button>} />

      {loading ? <Card className="p-4">Cargando…</Card> : items.length === 0 ? (
        <EmptyState title="Aún no hay usuarios" action={<Button onClick={openCreate}>Nuevo usuario</Button>} />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader><TableRow className="bg-muted/40">
              <TableHead>Usuario</TableHead><TableHead>Rol</TableHead><TableHead>Estado</TableHead><TableHead>Creación</TableHead><TableHead className="text-right">Acciones</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {items.map(u => (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="font-medium">{u.full_name}</div>
                    <div className="text-xs text-muted-foreground font-mono">{u.email}</div>
                  </TableCell>
                  <TableCell><Badge variant="secondary">{tRole(u.role)}</Badge></TableCell>
                  <TableCell>{u.is_active ? <Badge className="bg-emerald-100 text-emerald-800 border border-emerald-200">Activo</Badge> : <Badge variant="outline">Inactivo</Badge>}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{formatDate(u.created_at)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" onClick={() => openUpdate(u)} aria-label="Editar"><Pencil size={14} /></Button>
                      {u.id !== me?.id && <Button size="icon" variant="ghost" onClick={() => setToDelete(u)} aria-label="Eliminar"><Trash2 size={14} className="text-rose-600" /></Button>}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <Dialog open={openEdit} onOpenChange={setOpenEdit}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Editar usuario" : "Nuevo usuario"}</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            {!editing && (
              <div className="grid gap-1.5"><Label>Correo electrónico</Label><Input type="email" value={form.email} onChange={e => set("email", e.target.value)} required autoFocus /></div>
            )}
            <div className="grid gap-1.5"><Label>Nombre completo</Label><Input value={form.full_name} onChange={e => set("full_name", e.target.value)} required /></div>
            <div className="grid gap-1.5">
              <Label>Rol</Label>
              <Select value={form.role} onValueChange={(v) => set("role", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador (acceso total)</SelectItem>
                  <SelectItem value="manager">Gestor (movimientos y lectura de maestros)</SelectItem>
                  <SelectItem value="viewer">Consulta (solo lectura)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>{editing ? "Restablecer contraseña (opcional)" : "Contraseña"}</Label>
              <Input type="password" value={form.password} onChange={e => set("password", e.target.value)} placeholder={editing ? "Dejar vacío para conservarla" : "Mínimo 6 caracteres"} />
            </div>
            {editing && (
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div><div className="text-sm font-medium">Activo</div><div className="text-xs text-muted-foreground">Los usuarios inactivos no pueden iniciar sesión.</div></div>
                <Switch checked={form.is_active} onCheckedChange={(v) => set("is_active", !!v)} />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenEdit(false)}>Cancelar</Button>
            <Button onClick={save} disabled={saving}>{saving ? <><Loader2 className="mr-2 animate-spin" size={16}/>Guardando…</> : "Guardar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!toDelete} onOpenChange={(v) => !v && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar usuario?</AlertDialogTitle>
            <AlertDialogDescription>Se eliminará permanentemente a <span className="font-medium">{toDelete?.email}</span>.</AlertDialogDescription>
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
