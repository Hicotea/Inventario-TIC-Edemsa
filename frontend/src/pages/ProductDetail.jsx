import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, Edit3, Printer, ArrowDownRight, ArrowUpRight, SlidersHorizontal, ExternalLink, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import { api, showError } from "@/lib/api";
import { useAuth } from "@/lib/auth";

function PrintableLabel({ product, codes }) {
  return (
    <div className="print-area">
      <div className="mx-auto max-w-[380px] rounded-lg border border-border p-4 bg-white text-black">
        <div className="text-center">
          <div className="text-xs font-mono text-black">{product.sku}</div>
          <div className="font-display text-base font-semibold">{product.name}</div>
        </div>
        <div className="mt-3 flex justify-center gap-3">
          {codes?.qr_png && <img src={codes.qr_png} alt="QR" style={{ width: 110, height: 110 }} />}
          {codes?.barcode_png && <img src={codes.barcode_png} alt="Barcode" style={{ height: 110 }} />}
        </div>
        <div className="mt-2 text-center text-xs text-black">{product.location_name || "—"}</div>
      </div>
    </div>
  );
}

function MoveIcon({ type, className }) {
  if (type === "entry") return <ArrowDownRight className={className} />;
  if (type === "exit") return <ArrowUpRight className={className} />;
  return <SlidersHorizontal className={className} />;
}

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPerm } = useAuth();
  const [product, setProduct] = useState(null);
  const [codes, setCodes] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ok = true;
    async function load() {
      setLoading(true);
      try {
        const [a, b, c] = await Promise.all([
          api.get(`/products/${id}`),
          api.get(`/products/${id}/codes`),
          api.get(`/products/${id}/history`),
        ]);
        if (!ok) return;
        setProduct(a.data); setCodes(b.data); setHistory(c.data);
      } catch (e) { showError(e); }
      finally { if (ok) setLoading(false); }
    }
    load();
    return () => { ok = false; };
  }, [id]);

  const canEdit = hasPerm("product:write");
  const canMove = hasPerm("movement:write");

  if (loading) {
    return (
      <div>
        <PageHeader title="…" breadcrumb={[{ label: "Products", to: "/products" }, { label: "…" }]} />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  if (!product) return null;

  return (
    <div>
      <PageHeader
        title={product.name}
        description={<span className="font-mono text-xs">{product.sku}</span>}
        breadcrumb={[{ label: "Products", to: "/products" }, { label: product.name }]}
        actions={
          <>
            <Button variant="outline" onClick={() => navigate(-1)}><ArrowLeft size={16} className="mr-2" />Back</Button>
            <Button variant="outline" onClick={() => window.print()} className="no-print"><Printer size={16} className="mr-2" />Print label</Button>
            {canEdit && (
              <Button variant="outline" onClick={() => navigate(`/products/${id}/edit`)} className="no-print">
                <Edit3 size={16} className="mr-2" />Edit
              </Button>
            )}
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 no-print">
        {/* Details */}
        <Card className="p-5 lg:col-span-2">
          <div className="flex items-start justify-between">
            <div>
              <div className="font-display text-lg font-semibold">Details</div>
              <div className="mt-1 text-xs text-muted-foreground">Product information</div>
            </div>
            <StatusBadge status={product.status} />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3">
            <Field label="Category" value={product.category_name} />
            <Field label="Brand" value={product.brand_name} />
            <Field label="Location" value={product.location_name} />
            <Field label="Supplier" value={product.supplier_name} />
            <Field label="Model" value={product.model} />
            <Field label="Part number" value={product.part_number} />
            <Field label="Unit" value={product.unit} />
            <Field label="Current stock" value={<span className="tabular-nums font-semibold">{product.stock}</span>} />
            <Field label="Min / Max" value={<span className="tabular-nums">{product.min_stock} / {product.max_stock}</span>} />
            <Field label="Unit cost" value={<span className="tabular-nums">$ {Number(product.unit_cost || 0).toFixed(2)}</span>} />
            <Field label="Barcode" value={<span className="font-mono text-xs">{product.barcode || "—"}</span>} />
            <Field label="QR" value={<span className="font-mono text-xs break-all">{product.qr_code || "—"}</span>} />
          </div>
          {product.description && (
            <div className="mt-4 rounded-lg bg-muted/40 p-3 text-sm text-muted-foreground">{product.description}</div>
          )}
        </Card>

        {/* Codes */}
        <Card className="p-5">
          <div className="font-display text-lg font-semibold">Identifiers</div>
          <div className="mt-4 grid gap-4">
            {codes?.qr_png && (
              <div className="rounded-lg border border-border p-3">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">QR</div>
                <div className="mt-2 flex items-center gap-3">
                  <img src={codes.qr_png} alt="QR" className="h-24 w-24" />
                  <div className="min-w-0">
                    <div className="font-mono text-xs break-all">{codes.qr_code}</div>
                    <a href={codes.qr_png} download={`${product.sku}-qr.png`} className="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline">
                      Download <ExternalLink size={12} />
                    </a>
                  </div>
                </div>
              </div>
            )}
            {codes?.barcode_png && (
              <div className="rounded-lg border border-border p-3">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Barcode</div>
                <div className="mt-2 flex items-center gap-3">
                  <img src={codes.barcode_png} alt="Barcode" className="h-14" />
                  <div className="min-w-0">
                    <div className="font-mono text-xs break-all">{codes.barcode}</div>
                    <a href={codes.barcode_png} download={`${product.sku}-barcode.png`} className="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline">
                      Download <ExternalLink size={12} />
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>

          {canMove && (
            <div className="mt-4 grid gap-2">
              <Button onClick={() => navigate(`/movements/entry?product=${id}`)} className="w-full justify-start" variant="outline">
                <ArrowDownRight size={16} className="mr-2" /> Register entry
              </Button>
              <Button onClick={() => navigate(`/movements/exit?product=${id}`)} className="w-full justify-start" variant="outline">
                <ArrowUpRight size={16} className="mr-2" /> Register exit
              </Button>
              {hasPerm("adjustment:write") && (
                <Button onClick={() => navigate(`/movements/adjustment?product=${id}`)} className="w-full justify-start" variant="outline">
                  <SlidersHorizontal size={16} className="mr-2" /> Adjust stock
                </Button>
              )}
            </div>
          )}
        </Card>
      </div>

      <Tabs defaultValue="history" className="mt-6 no-print">
        <TabsList>
          <TabsTrigger value="history">Movement history</TabsTrigger>
        </TabsList>
        <TabsContent value="history" className="mt-3">
          {history.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">No movements yet.</div>
          ) : (
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead>When</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Previous</TableHead>
                      <TableHead className="text-right">Resulting</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Reason</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.map((h) => (
                      <TableRow key={h.id}>
                        <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{new Date(h.created_at).toLocaleString()}</TableCell>
                        <TableCell>
                          <span className="inline-flex items-center gap-1.5 text-sm">
                            <MoveIcon type={h.type} className={h.type === "exit" ? "text-rose-600" : h.type === "entry" ? "text-emerald-600" : "text-amber-600"} size={14} />
                            <span className="capitalize">{h.type}</span>
                          </span>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{h.qty}</TableCell>
                        <TableCell className="text-right tabular-nums text-muted-foreground">{h.previous_stock}</TableCell>
                        <TableCell className="text-right tabular-nums font-medium">{h.resulting_stock}</TableCell>
                        <TableCell>{h.user_name || h.user_id}</TableCell>
                        <TableCell className="max-w-[280px] truncate">{h.reason || "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Print-only label */}
      <PrintableLabel product={product} codes={codes} />
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm">{value || <span className="text-muted-foreground">—</span>}</div>
    </div>
  );
}
