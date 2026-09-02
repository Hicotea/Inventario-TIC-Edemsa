import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import PageHeader from "@/components/PageHeader";
import { api, showError } from "@/lib/api";

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
  useEffect(() => { const t = setTimeout(load, 200); return () => clearTimeout(t); /* eslint-disable-next-line */ }, [q, entity]);

  const entities = ["", "auth", "user", "product", "movement", "Category", "Brand", "Location", "Supplier", "stock_count", "import", "report", "role_permissions"];

  return (
    <div>
      <PageHeader title="Audit log" description="An immutable, append-only trail of every important action." breadcrumb={[{ label: "Administration" }, { label: "Audit" }]} />
      <Card className="p-3 md:p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Search actions, users, entities…" className="pl-9 h-10" />
          </div>
          <Select value={entity || "__all__"} onValueChange={(v) => setEntity(v === "__all__" ? "" : v)}>
            <SelectTrigger className="h-10 w-full md:w-[200px]"><SelectValue placeholder="All entities" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All entities</SelectItem>
              {entities.filter(Boolean).map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </Card>
      <Card className="mt-4 overflow-hidden">
        {loading ? <div className="p-6 text-sm text-muted-foreground">Loading…</div> : items.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">No entries match your filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow className="bg-muted/40">
                <TableHead>When</TableHead><TableHead>User</TableHead><TableHead>Action</TableHead><TableHead>Entity</TableHead><TableHead>Entity ID</TableHead><TableHead>Details</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {items.map(a => (
                  <TableRow key={a.id}>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString()}</TableCell>
                    <TableCell><div className="font-medium">{a.user_name || "—"}</div><div className="font-mono text-[11px] text-muted-foreground">{a.user_id}</div></TableCell>
                    <TableCell><Badge variant="secondary" className="font-mono text-[11px]">{a.action}</Badge></TableCell>
                    <TableCell className="capitalize">{a.entity}</TableCell>
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
