import { useEffect, useState } from "react";
import { Save, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import PageHeader from "@/components/PageHeader";
import { api, showError, showSuccess } from "@/lib/api";

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
      showSuccess("Permissions saved.");
      load();
    } catch (e) { showError(e); } finally { setSaving(false); }
  };

  if (!data) return (
    <div>
      <PageHeader title="Permissions" breadcrumb={[{ label: "Administration" }, { label: "Permissions" }]} />
      <Card className="p-6">Loading…</Card>
    </div>
  );

  return (
    <div>
      <PageHeader title="Permissions" description="Configure what each role can do. Admin always has full access."
        breadcrumb={[{ label: "Administration" }, { label: "Permissions" }]}
        actions={<Button onClick={save} disabled={saving || Object.keys(dirty).length === 0}>{saving ? <><Loader2 className="mr-2 animate-spin" size={16}/>Saving…</> : <><Save size={16} className="mr-2" />Save changes</>}</Button>} />
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/40 text-left">
                <th className="px-4 py-3 sticky left-0 bg-muted/40 z-10">Permission</th>
                <th className="px-4 py-3 text-center">Admin</th>
                <th className="px-4 py-3 text-center">Manager</th>
                <th className="px-4 py-3 text-center">Viewer</th>
              </tr>
            </thead>
            <tbody>
              {data.all_permissions.map(p => (
                <tr key={p} className="border-t border-border">
                  <td className="px-4 py-2 sticky left-0 bg-background">
                    <div className="font-mono text-xs">{p}</div>
                  </td>
                  <td className="px-4 py-2 text-center"><Checkbox checked disabled /></td>
                  <td className="px-4 py-2 text-center"><Checkbox checked={isChecked("manager", p)} onCheckedChange={() => toggle("manager", p)} /></td>
                  <td className="px-4 py-2 text-center"><Checkbox checked={isChecked("viewer", p)} onCheckedChange={() => toggle("viewer", p)} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
