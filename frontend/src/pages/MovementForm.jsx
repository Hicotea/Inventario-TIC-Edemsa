import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowDownRight, ArrowUpRight, SlidersHorizontal, Loader2, Search, Check, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Command, CommandInput, CommandList, CommandItem, CommandEmpty, CommandGroup } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import { api, showError, showSuccess } from "@/lib/api";
import { TID } from "@/lib/testIds";

const CFG = {
  entry: {
    title: "Register inventory entry",
    subtitle: "Add units to a product's stock.",
    endpoint: "/movements/entry",
    icon: ArrowDownRight,
    color: "text-emerald-600",
    reasons: ["purchase", "return", "transfer in", "correction", "initial stock", "other"],
  },
  exit: {
    title: "Register inventory exit",
    subtitle: "Remove units for use, transfer or disposal.",
    endpoint: "/movements/exit",
    icon: ArrowUpRight,
    color: "text-rose-600",
    reasons: ["employee request", "consumption", "transfer out", "replacement", "return to supplier", "other"],
  },
  adjustment: {
    title: "Adjust stock",
    subtitle: "Correct system stock to match reality. Requires a reason.",
    endpoint: "/movements/adjustment",
    icon: SlidersHorizontal,
    color: "text-amber-600",
    reasons: ["physical count discrepancy", "damaged", "lost", "found", "administrative correction"],
  },
};

export default function MovementForm({ type }) {
  const cfg = CFG[type];
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [productId, setProductId] = useState(params.get("product") || "");
  const [product, setProduct] = useState(null);
  const [qty, setQty] = useState("1");
  const [newStock, setNewStock] = useState("");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [reference, setReference] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [unitCost, setUnitCost] = useState("");
  const [destination, setDestination] = useState("");
  const [requester, setRequester] = useState("");
  const [loading, setLoading] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [productQuery, setProductQuery] = useState("");

  useEffect(() => {
    api.get("/products", { params: { limit: 500 } }).then(r => setProducts(r.data));
    if (type === "entry") api.get("/suppliers").then(r => setSuppliers(r.data));
  }, [type]);

  useEffect(() => {
    if (!productId) { setProduct(null); return; }
    api.get(`/products/${productId}`).then(r => {
      setProduct(r.data);
      if (type === "adjustment") setNewStock(String(r.data.stock));
    }).catch(() => setProduct(null));
  }, [productId, type]);

  const filteredProducts = useMemo(() => {
    const q = productQuery.trim().toLowerCase();
    if (!q) return products.slice(0, 50);
    return products.filter(p => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)).slice(0, 50);
  }, [productQuery, products]);

  const canSubmit = product && (type === "adjustment" ? newStock !== "" && Number(newStock) >= 0 && Number(newStock) !== product.stock : Number(qty) > 0);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!product) return;
    setLoading(true);
    try {
      let body;
      if (type === "adjustment") {
        if (!reason || reason.trim().length < 3) throw Object.assign(new Error("A clear reason is required for adjustments."), { friendlyMessage: "A clear reason (min 3 characters) is required for adjustments." });
        body = { product_id: product.id, new_stock: Number(newStock), reason, notes: notes || undefined };
      } else if (type === "entry") {
        body = { product_id: product.id, qty: Number(qty), reason: reason || undefined, notes: notes || undefined, reference: reference || undefined, supplier_id: supplierId || undefined, unit_cost: unitCost ? Number(unitCost) : undefined };
      } else {
        body = { product_id: product.id, qty: Number(qty), reason: reason || undefined, notes: notes || undefined, reference: reference || undefined, destination: destination || undefined, requester: requester || undefined };
      }
      const { data } = await api.post(cfg.endpoint, body);
      showSuccess(`Movement recorded. Stock is now ${data.resulting_stock}.`);
      navigate("/movements");
    } catch (err) {
      showError(err);
    } finally { setLoading(false); }
  };

  const Icon = cfg.icon;

  return (
    <div>
      <PageHeader
        title={cfg.title}
        description={cfg.subtitle}
        breadcrumb={[{ label: "Movements", to: "/movements" }, { label: cfg.title }]}
        actions={<Button variant="outline" onClick={() => navigate(-1)}><ArrowLeft size={16} className="mr-2" />Back</Button>}
      />

      <form onSubmit={onSubmit} className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <div className={`inline-flex items-center gap-2 ${cfg.color}`}>
            <Icon size={18} />
            <span className="font-display text-sm font-semibold">Movement details</span>
          </div>
          <div className="mt-4 grid gap-4">
            {/* Product picker */}
            <div className="grid gap-1.5">
              <Label>Product</Label>
              <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" className="h-11 justify-between" data-testid={TID.movementProduct}>
                    {product ? (
                      <span className="flex items-center gap-2">
                        <span className="font-medium">{product.name}</span>
                        <span className="font-mono text-xs text-muted-foreground">{product.sku}</span>
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Select a product…</span>
                    )}
                    <Search size={14} className="opacity-60" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="p-0 w-[min(96vw,520px)]">
                  <Command>
                    <CommandInput placeholder="Search by name or SKU…" value={productQuery} onValueChange={setProductQuery} />
                    <CommandList className="max-h-[300px]">
                      <CommandEmpty>No products.</CommandEmpty>
                      <CommandGroup>
                        {filteredProducts.map(p => (
                          <CommandItem key={p.id} value={`${p.name} ${p.sku}`} onSelect={() => { setProductId(p.id); setPickerOpen(false); }}>
                            <div className="flex items-center justify-between gap-3 w-full">
                              <div className="min-w-0">
                                <div className="truncate">{p.name}</div>
                                <div className="font-mono text-[11px] text-muted-foreground">{p.sku}</div>
                              </div>
                              <div className="flex items-center gap-2"><StatusBadge status={p.status} /><span className="tabular-nums text-sm">{p.stock}</span></div>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {product && (
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <div className="flex items-center gap-3 text-sm">
                  <div className="flex-1">Current stock</div>
                  <div className="tabular-nums text-lg font-semibold">{product.stock}</div>
                  <StatusBadge status={product.status} />
                </div>
              </div>
            )}

            {type === "adjustment" ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-1.5">
                  <Label>New stock quantity</Label>
                  <Input type="number" min="0" value={newStock} onChange={e => setNewStock(e.target.value)} data-testid={TID.movementQty} required />
                </div>
                <div className="grid gap-1.5">
                  <Label>Difference</Label>
                  <div className="h-10 rounded-md border border-input bg-muted/50 px-3 text-sm inline-flex items-center tabular-nums">
                    {product && newStock !== "" ? Number(newStock) - product.stock : "—"}
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-1.5">
                  <Label>Quantity</Label>
                  <Input type="number" min="1" value={qty} onChange={e => setQty(e.target.value)} data-testid={TID.movementQty} required />
                </div>
                <div className="grid gap-1.5">
                  <Label>Reference / doc #</Label>
                  <Input value={reference} onChange={e => setReference(e.target.value)} placeholder="PO-1024, TX-4459…" />
                </div>
              </div>
            )}

            <div className="grid gap-1.5">
              <Label>Reason {type === "adjustment" && <span className="text-rose-600">*</span>}</Label>
              <Select value={reason || "__none__"} onValueChange={(v) => setReason(v === "__none__" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="Choose a reason" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">—</SelectItem>
                  {cfg.reasons.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {type === "entry" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-1.5">
                  <Label>Supplier</Label>
                  <Select value={supplierId || "__none__"} onValueChange={(v) => setSupplierId(v === "__none__" ? "" : v)}>
                    <SelectTrigger><SelectValue placeholder="Select supplier" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">—</SelectItem>
                      {suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1.5">
                  <Label>Unit cost</Label>
                  <Input type="number" step="0.01" min="0" value={unitCost} onChange={e => setUnitCost(e.target.value)} />
                </div>
              </div>
            )}

            {type === "exit" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-1.5">
                  <Label>Destination / department</Label>
                  <Input value={destination} onChange={e => setDestination(e.target.value)} placeholder="Engineering, Floor 3…" />
                </div>
                <div className="grid gap-1.5">
                  <Label>Requested by</Label>
                  <Input value={requester} onChange={e => setRequester(e.target.value)} placeholder="Full name / email" />
                </div>
              </div>
            )}

            <div className="grid gap-1.5">
              <Label>Notes</Label>
              <Textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional context…" />
            </div>
          </div>
        </Card>

        <Card className="p-5 h-fit lg:sticky lg:top-20">
          <div className="font-display text-sm font-semibold">Ready to submit?</div>
          <div className="mt-1 text-xs text-muted-foreground">All movements are traceable and audited.</div>
          <div className="mt-4 grid gap-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Product</span><span className="font-medium truncate max-w-[200px]">{product?.name || "—"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Current stock</span><span className="tabular-nums">{product?.stock ?? "—"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Change</span><span className="tabular-nums font-medium">
              {product && (type === "adjustment" ? (newStock === "" ? "—" : (Number(newStock) - product.stock)) : (type === "exit" ? -Number(qty || 0) : Number(qty || 0)))}
            </span></div>
            <div className="flex justify-between border-t border-border pt-2 mt-2"><span className="text-muted-foreground">Resulting</span><span className="tabular-nums font-semibold">
              {product && (type === "adjustment" ? (newStock === "" ? "—" : Number(newStock)) : (type === "exit" ? product.stock - Number(qty || 0) : product.stock + Number(qty || 0)))}
            </span></div>
          </div>
          <Button type="submit" disabled={!canSubmit || loading} data-testid={TID.movementSubmit} className="mt-5 w-full h-11">
            {loading ? <><Loader2 className="mr-2 animate-spin" size={16}/> Submitting…</> : <><Check size={16} className="mr-2" /> Submit</>}
          </Button>
        </Card>
      </form>
    </div>
  );
}
