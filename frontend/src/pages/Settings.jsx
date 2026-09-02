import { useEffect, useState } from "react";
import { Save, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import PageHeader from "@/components/PageHeader";
import { api, showError, showSuccess } from "@/lib/api";

// Human labels for the technical permission codes returned by the backend.
const PERM_LABELS = {
  "product:read": "Ver productos",
  "product:write": "Crear/editar productos",
  "product:delete": "Eliminar productos",
  "movement:read": "Ver movimientos",
  "movement:write": "Registrar entradas y salidas",
  "adjustment:write": "Registrar ajustes",
  "master:read": "Ver datos maestros",
  "master:write": "Editar datos maestros",
  "user:read": "Ver usuarios",
  "user:write": "Gestionar usuarios",
  "audit:read": "Ver auditoría",
  "report:read": "Ver / exportar reportes",
  "import:write": "Importación masiva",
  "count:read": "Ver conteos físicos",
  "count:write": "Registrar conteos físicos",
  "settings:write": "Editar configuración",
};

export default function Settings() {
  const [data, setData] = useState(null);
  const [dirty, setDirty] = useState({});
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try { const { data } = await api.get("/settings/permissions"); setData(data); setDirty({}); }
    catch (e) { showError(e); }
  };
  useEffect(() => { load(); }, []);

  const toggle = (role, perm) => {
    if (role === "admin") return;
    setDirty(prev => {
      const currentSet = new Set(prev[role] || data.roles[role]);
      if (currentSet.has(perm)) currentSet.delete(perm); else currentSet.add(perm);
      return { ...prev, [role]: Array.from(currentSet).sort() };
    });
  };

  const isChecked = (role, perm) => {
    const list = dirty[role] || data.roles[role] || [];
    return list.includes(perm);
  };

  const save = async () => {
    setSaving(true);
    try {
      for (const [role, perms] of Object.entries(dirty)) {
        await api.put(`/settings/permissions/${role}`, { permissions: perms });
      }
      showSuccess("Permisos guardados.");
      load();
    } catch (e) { showError(e); } finally { setSaving(false); }
  };

  if (!data) return (
    <div>
      <PageHeader title="Permisos" breadcrumb={[{ label: "Administración" }, { label: "Permisos" }]} />
      <Card className="p-6">Cargando…</Card>
    </div>
  );

  return (
    <div>
      <PageHeader title="Permisos" description="Configure qué puede hacer cada rol. El administrador siempre tiene acceso total."
        breadcrumb={[{ label: "Administración" }, { label: "Permisos" }]}
        actions={<Button onClick={save} disabled={saving || Object.keys(dirty).length === 0}>{saving ? <><Loader2 className="mr-2 animate-spin" size={16}/>Guardando…</> : <><Save size={16} className="mr-2" />Guardar cambios</>}</Button>} />
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/40 text-left">
                <th className="px-4 py-3 sticky left-0 bg-muted/40 z-10">Permiso</th>
                <th className="px-4 py-3 text-center">Administrador</th>
                <th className="px-4 py-3 text-center">Gestor</th>
                <th className="px-4 py-3 text-center">Consulta</th>
              </tr>
            </thead>
            <tbody>
              {data.all_permissions.map(p => (
                <tr key={p} className="border-t border-border">
                  <td className="px-4 py-2 sticky left-0 bg-background">
                    <div className="font-medium">{PERM_LABELS[p] || p}</div>
                    <div className="font-mono text-[11px] text-muted-foreground">{p}</div>
                  </td>
                  <td className="px-4 py-2 text-center"><Checkbox checked disabled aria-label="Administrador siempre habilitado" /></td>
                  <td className="px-4 py-2 text-center"><Checkbox checked={isChecked("manager", p)} onCheckedChange={() => toggle("manager", p)} aria-label={`Alternar ${PERM_LABELS[p] || p} para el rol Gestor`} /></td>
                  <td className="px-4 py-2 text-center"><Checkbox checked={isChecked("viewer", p)} onCheckedChange={() => toggle("viewer", p)} aria-label={`Alternar ${PERM_LABELS[p] || p} para el rol Consulta`} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
