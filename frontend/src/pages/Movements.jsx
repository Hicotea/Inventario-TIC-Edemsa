import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowDownRight, ArrowUpRight, SlidersHorizontal, Loader2, Check, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import { api, showError, showSuccess } from "@/lib/api";
import { TID } from "@/lib/testIds";
import { formatNumber } from "@/lib/format";

const CFG = {
  entry: {
    title: "Registrar entrada de inventario",
    subtitle: "Agregue unidades al stock de un producto.",
    endpoint: "/movements/entry",
    icon: ArrowDownRight,
    color: "text-emerald-600",
    reasons: ["Compra", "Devolución", "Traslado entrante", "Corrección", "Stock inicial", "Otro"],
  },
  exit: {
    title: "Registrar salida de inventario",
    subtitle: "Retire unidades para uso, traslado o asignación a personal.",
    endpoint: "/movements/exit",
    icon: ArrowUpRight,
    color: "text-rose-600",
    reasons: ["Solicitud de empleado", "Consumo", "Traslado saliente", "Reemplazo", "Devolución al proveedor", "Otro"],
  },
  adjustment: {
    title: "Ajustar stock",
    subtitle: "Corrija el stock del sistema para que coincida con la realidad.",
    endpoint: "/movements/adjustment",
    icon: SlidersHorizontal,
    color: "text-amber-600",
    reasons: ["Discrepancia de inventario físico", "Dañado", "Perdido", "Encontrado", "Corrección administrativa"],
  },
};

export default function MovementForm({ type }) {
  const cfg = CFG[type] || CFG.exit;
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

  // Campos para salidas/asignaciones detalladas
  const [recipientName, setRecipientName] = useState("");
  const [recipientDocument, setRecipientDocument] = useState("");
  const [department, setDepartment] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [placa, setPlaca] = useState("");
  const [deviceName, setDeviceName] = useState("");
  const [condition, setCondition] = useState("Bueno");

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get("/products", { params: { limit: 500 } })
      .then((r) => setProducts(r.data || []))
      .catch((err) => showError(err));

    if (type === "entry") {
      api.get("/suppliers")
        .then((r) => setSuppliers(r.data || []))
        .catch((err) => showError(err));
    }
  }, [type]);

  useEffect(() => {
    if (!productId) {
      setProduct(null);
      return;
    }
    api.get(`/products/${productId}`)
      .then((r) => {
        setProduct(r.data);
        if (type === "adjustment") setNewStock(String(r.data.stock));
      })
      .catch(() => setProduct(null));
  }, [productId, type]);

  const canSubmit =
    product &&
    (type === "adjustment"
      ? newStock !== "" && Number(newStock) >= 0 && Number(newStock) !== product.stock
      : Number(qty) > 0);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!product) return;
    setLoading(true);
    try {
      let body;
      if (type === "adjustment") {
        if (!reason || reason.trim().length < 3) {
          throw Object.assign(new Error("El ajuste requiere motivo."), {
            friendlyMessage: "El ajuste requiere un motivo de al menos 3 caracteres.",
          });
        }
        body = { product_id: product.id, new_stock: Number(newStock), reason, notes: notes || undefined };
      } else if (type === "entry") {
        body = {
          product_id: product.id,
          qty: Number(qty),
          reason: reason || undefined,
          notes: notes || undefined,
          reference: reference || undefined,
          supplier_id: supplierId || undefined,
          unit_cost: unitCost ? Number(unitCost) : undefined,
        };
      } else {
        body = {
          product_id: product.id,
          qty: Number(qty),
          reason: reason || undefined,
          notes: notes || undefined,
          reference: reference || undefined,
          destination: destination || undefined,
          requester: recipientName || requester || undefined,
          recipient_name: recipientName || requester || undefined,
          recipient_document: recipientDocument || undefined,
          department: department || undefined,
          serial_number: serialNumber || undefined,
          placa: placa || undefined,
          device_name: deviceName || undefined,
          condition: condition || "Bueno",
        };
      }
      const { data } = await api.post(cfg.endpoint, body);
      showSuccess(`Movimiento registrado. Nuevo stock: ${formatNumber(data.resulting_stock, { maximumFractionDigits: 0 })}.`);
      navigate(type === "exit" ? "/salidas" : "/movements");
    } catch (err) {
      showError(err);
    } finally {
      setLoading(false);
    }
  };

  const Icon = cfg.icon;

  return (
    <div>
      <PageHeader
        title={cfg.title}
        description={cfg.subtitle}
        breadcrumb={[{ label: "Movimientos", to: "/movements" }, { label: cfg.title }]}
        actions={
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft size={16} className="mr-2" />
            Volver
          </Button>
        }
      />

      <form onSubmit={onSubmit} className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <div className={`inline-flex items-center gap-2 ${cfg.color}`}>
            <Icon size={18} />
            <span className="font-display text-sm font-semibold">Detalle del movimiento</span>
          </div>

          <div className="mt-4 grid gap-4">
            {/* Selección de Producto */}
            <div className="grid gap-1.5">
              <Label htmlFor="productId">Producto *</Label>
              <select
                id="productId"
                required
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
              >
                <option value="">-- Seleccione un producto --</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.sku}) — Stock: {p.stock}
                  </option>
                ))}
              </select>
            </div>

            {product && (
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <div className="flex items-center gap-3 text-sm">
                  <div className="flex-1">Stock actual</div>
                  <div className="tabular-nums text-lg font-semibold">
                    {formatNumber(product.stock, { maximumFractionDigits: 0 })}
                  </div>
                  <StatusBadge status={product.status} />
                </div>
              </div>
            )}

            {type === "adjustment" ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-1.5">
                  <Label>Nueva cantidad de stock</Label>
                  <Input
                    type="number"
                    min="0"
                    value={newStock}
                    onChange={(e) => setNewStock(e.target.value)}
                    data-testid={TID.movementQty}
                    required
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label>Diferencia</Label>
                  <div className="h-10 rounded-md border border-input bg-muted/50 px-3 text-sm inline-flex items-center tabular-nums">
                    {product && newStock !== ""
                      ? formatNumber(Number(newStock) - product.stock, {
                          maximumFractionDigits: 0,
                          signDisplay: "exceptZero",
                        })
                      : "—"}
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-1.5">
                  <Label>Cantidad</Label>
                  <Input
                    type="number"
                    min="1"
                    value={qty}
                    onChange={(e) => setQty(e.target.value)}
                    data-testid={TID.movementQty}
                    required
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label>Referencia / N° documento / Acta</Label>
                  <Input
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    placeholder="Ej. ACTA-001, OC-1024…"
                  />
                </div>
              </div>
            )}

            <div className="grid gap-1.5">
              <Label>Motivo {type === "adjustment" && <span className="text-rose-600">*</span>}</Label>
              <select
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              >
                <option value="">— Sin motivo</option>
                {cfg.reasons.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            {type === "entry" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-1.5">
                  <Label>Proveedor</Label>
                  <select
                    className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                    value={supplierId}
                    onChange={(e) => setSupplierId(e.target.value)}
                  >
                    <option value="">— Sin proveedor</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-1.5">
                  <Label>Costo unitario</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={unitCost}
                    onChange={(e) => setUnitCost(e.target.value)}
                  />
                </div>
              </div>
            )}

            {type === "exit" && (
              <div className="space-y-4 border-t border-border pt-4 mt-2">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Datos de Asignación y Hardware
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="grid gap-1.5">
                    <Label>Funcionario que recibe</Label>
                    <Input
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      placeholder="Ej. Camilo Torres"
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label>Cédula / Documento</Label>
                    <Input
                      value={recipientDocument}
                      onChange={(e) => setRecipientDocument(e.target.value)}
                      placeholder="Ej. 1067000111"
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label>Departamento / Área</Label>
                    <Input
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="Ej. Gestión Humana / Operaciones"
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label>Número de Serie (S/N)</Label>
                    <Input
                      value={serialNumber}
                      onChange={(e) => setSerialNumber(e.target.value)}
                      placeholder="Ej. MXL123456"
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label>Placa de Inventario</Label>
                    <Input
                      value={placa}
                      onChange={(e) => setPlaca(e.target.value)}
                      placeholder="Ej. EDEMSA-ACT-0492"
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label>Nombre del Equipo (Hostname)</Label>
                    <Input
                      value={deviceName}
                      onChange={(e) => setDeviceName(e.target.value)}
                      placeholder="Ej. LAP-GH-01"
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label>Estado del equipo</Label>
                    <select
                      className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                      value={condition}
                      onChange={(e) => setCondition(e.target.value)}
                    >
                      <option value="Nuevo">Nuevo</option>
                      <option value="Bueno">Bueno</option>
                      <option value="Regular">Regular</option>
                      <option value="Mantenimiento">Mantenimiento</option>
                    </select>
                  </div>
                  <div className="grid gap-1.5">
                    <Label>Destino / Ubicación física</Label>
                    <Input
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      placeholder="Ej. Piso 3, Oficina Principal"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="grid gap-1.5">
              <Label>Notas / Accesorios incluidos</Label>
              <textarea
                rows={2}
                className="w-full p-2.5 rounded-md border border-input bg-background text-sm font-sans"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ej. Se entrega con cargador original, mouse y estuche..."
              />
            </div>
          </div>
        </Card>

        <Card className="p-5 h-fit lg:sticky lg:top-20">
          <div className="font-display text-sm font-semibold">¿Listo para enviar?</div>
          <div className="mt-1 text-xs text-muted-foreground">Todos los movimientos son trazables.</div>
          <div className="mt-4 grid gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Producto</span>
              <span className="font-medium truncate max-w-[200px]">{product?.name || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Stock actual</span>
              <span className="tabular-nums">
                {product ? formatNumber(product.stock, { maximumFractionDigits: 0 }) : "—"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Cambio</span>
              <span className="tabular-nums font-medium">
                {product
                  ? formatNumber(
                      type === "adjustment"
                        ? newStock === ""
                          ? 0
                          : Number(newStock) - product.stock
                        : type === "exit"
                        ? -Number(qty || 0)
                        : Number(qty || 0),
                      { maximumFractionDigits: 0, signDisplay: "exceptZero" }
                    )
                  : "—"}
              </span>
            </div>
            <div className="flex justify-between border-t border-border pt-2 mt-2">
              <span className="text-muted-foreground">Resultante</span>
              <span className="tabular-nums font-semibold">
                {product
                  ? formatNumber(
                      type === "adjustment"
                        ? newStock === ""
                          ? product.stock
                          : Number(newStock)
                        : type === "exit"
                        ? product.stock - Number(qty || 0)
                        : product.stock + Number(qty || 0),
                      { maximumFractionDigits: 0 }
                    )
                  : "—"}
              </span>
            </div>
          </div>
          <Button type="submit" disabled={!canSubmit || loading} data-testid={TID.movementSubmit} className="mt-5 w-full h-11">
            {loading ? (
              <>
                <Loader2 className="mr-2 animate-spin" size={16} /> Enviando…
              </>
            ) : (
              <>
                <Check size={16} className="mr-2" /> Confirmar
              </>
            )}
          </Button>
        </Card>
      </form>
    </div>
  );
}