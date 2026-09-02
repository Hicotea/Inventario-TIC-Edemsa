import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Loader2, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Command, CommandInput, CommandList, CommandItem, CommandEmpty, CommandGroup } from "@/components/ui/command";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import { api, showError, showSuccess } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export default function CountSession() {
  const { id } = useParams();
  const nav = useNavigate();
  const { hasPerm } = useAuth();
  const canWrite = hasPerm("count:write");

  const [session, setSession] = useState(null);
  const [products, setProducts] = useState([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [productQuery, setProductQuery] = useState("");
  const [product, setProduct] = useState(null);
  const [counted, setCounted] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const [closing, setClosing] = useState(false);

  const load = async () => {
    try { const { data } = await api.get(`/counts/${id}`); setSession(data); }
    catch (e) { showError(e); }
  };
  useEffect(() => { load(); api.get("/products", { params: { limit: 500 } }).then(r => setProducts(r.data)); }, [id]);

  const items = session?.items || [];
  const filteredProducts = useMemo(() => {
    const q = productQuery.trim().toLowerCase();
    if (!q) return products.slice(0, 50);
    return products.filter(p => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)).slice(0, 50);
  }, [productQuery, products]);

  const scanOrPick = async (pid) => {
    try { const { data } = await api.get(`/products/${pid}`); setProduct(data); setCounted(String(data.stock)); }
    catch (e) { showError(e); }
  };

  const record = async () => {
    if (!product || counted === "") return;
    setSaving(true);
    try {
      const { data } = await api.post(`/counts/${id}/items`, { product_id: product.id, counted_qty: Number(counted) });
      setSession(data);
      setProduct(null); setCounted("");
      showSuccess("Item recorded.");
    } catch (e) { showError(e); } finally { setSaving(false); }
  };

  const closeSession = async (applyAdjustments) => {
    setClosing(true);
    try {
      const { data } = await api.post(`/counts/${id}/close`, null, { params: { apply_adjustments: applyAdjustments } });
      setSession(data);
      showSuccess(applyAdjustments ? "Session closed and adjustments applied." : "Session closed.");
      setConfirmClose(false);
    } catch (e) { showError(e); } finally { setClosing(false); }
  };

  return (
    <div>
      <PageHeader
        title={session?.name || "Counting session"}
        description={session?.location_name || "All locations"}
        breadcrumb={[{ label: "Physical counts", to: "/counts" }, { label: session?.name || "…" }]}
        actions={
          <>
            <Button variant="outline" onClick={() => nav("/counts")}><ArrowLeft size={16} className="mr-2" />Back</Button>
            {session?.status === "open" && canWrite && <Button onClick={() => setConfirmClose(true)}><CheckCircle2 size={16} className="mr-2" />Close &amp; adjust</Button>}
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="p-4 lg:col-span-1">
          <div className="font-display text-sm font-semibold">Record an item</div>
          {session?.status !== "open" ? (
            <div className="mt-3 rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">This session is closed.</div>
          ) : (
            <div className="mt-3 grid gap-3">
              <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="h-11 justify-between">
                    {product ? <span className="flex items-center gap-2"><span>{product.name}</span><span className="font-mono text-xs text-muted-foreground">{product.sku}</span></span> : <span className="text-muted-foreground">Select a product…</span>}
                    <Search size={14} />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="p-0 w-[min(96vw,420px)]">
                  <Command>
                    <CommandInput placeholder="Search products…" value={productQuery} onValueChange={setProductQuery} />
                    <CommandList className="max-h-[300px]">
                      <CommandEmpty>No products.</CommandEmpty>
                      <CommandGroup>
                        {filteredProducts.map(p => (
                          <CommandItem key={p.id} value={`${p.name} ${p.sku}`} onSelect={() => { scanOrPick(p.id); setPickerOpen(false); }}>
                            <div className="flex items-center justify-between gap-3 w-full">
                              <div className="min-w-0"><div className="truncate">{p.name}</div><div className="font-mono text-[11px] text-muted-foreground">{p.sku}</div></div>
                              <div className="flex items-center gap-2"><StatusBadge status={p.status} /><span className="tabular-nums text-sm">{p.stock}</span></div>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {product && (
                <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm">
                  System stock: <span className="font-semibold tabular-nums">{product.stock}</span>
                </div>
              )}
              <div className="grid gap-1.5">
                <Label>Physical count</Label>
                <Input type="number" min="0" value={counted} onChange={e => setCounted(e.target.value)} />
              </div>
              <Button onClick={record} disabled={!product || counted === "" || saving}>
                {saving ? <><Loader2 className="mr-2 animate-spin" size={16}/>Recording…</> : "Record item"}
              </Button>
            </div>
          )}
        </Card>

        <Card className="p-4 lg:col-span-2">
          <div className="font-display text-sm font-semibold">Counted items ({items.length})</div>
          <div className="mt-3 overflow-x-auto">
            <Table>
              <TableHeader><TableRow className="bg-muted/40">
                <TableHead>Product</TableHead><TableHead className="text-right">System</TableHead><TableHead className="text-right">Counted</TableHead><TableHead className="text-right">Diff</TableHead><TableHead>When</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="py-6 text-center text-sm text-muted-foreground">No items counted yet.</TableCell></TableRow>
                ) : items.slice().reverse().map((it, i) => (
                  <TableRow key={i}>
                    <TableCell><div className="font-medium">{it.product_name}</div><div className="font-mono text-[11px] text-muted-foreground">{it.product_sku}</div></TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">{it.system_qty}</TableCell>
                    <TableCell className="text-right tabular-nums font-medium">{it.counted_qty}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      <Badge className={it.diff === 0 ? "bg-emerald-50 text-emerald-800 border-emerald-200" : it.diff > 0 ? "bg-cyan-50 text-cyan-800 border-cyan-200" : "bg-rose-50 text-rose-800 border-rose-200"}>{it.diff > 0 ? `+${it.diff}` : it.diff}</Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{new Date(it.counted_at).toLocaleTimeString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

      <AlertDialog open={confirmClose} onOpenChange={setConfirmClose}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Close session and apply adjustments?</AlertDialogTitle>
            <AlertDialogDescription>
              This will lock the session and generate adjustment movements for every discrepancy so stock matches physical counts.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={closing}>Cancel</AlertDialogCancel>
            <Button variant="outline" onClick={() => closeSession(false)} disabled={closing}>Close without adjusting</Button>
            <AlertDialogAction onClick={() => closeSession(true)} disabled={closing} className="bg-primary">
              {closing ? <><Loader2 className="mr-2 animate-spin" size={16}/>Working…</> : "Close &amp; adjust"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
