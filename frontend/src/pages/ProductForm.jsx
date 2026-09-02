import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import PageHeader from "@/components/PageHeader";
import { api, showError, showSuccess } from "@/lib/api";

export default function ProductForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    sku: "", name: "", description: "",
    category_id: "", brand_id: "", location_id: "", supplier_id: "",
    model: "", part_number: "", unit: "unidad",
    min_stock: 0, max_stock: 1000, unit_cost: 0,
    initial_stock: 0, barcode: "", is_active: true, notes: "",
  });
  const [master, setMaster] = useState({ cats: [], brands: [], locs: [], sups: [] });
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const [a, b, c, d] = await Promise.all([
        api.get("/categories"), api.get("/brands"), api.get("/locations"), api.get("/suppliers"),
      ]);
      setMaster({ cats: a.data, brands: b.data, locs: c.data, sups: d.data });
      if (isEdit) {
        try {
          const { data } = await api.get(`/products/${id}`);
          setForm({
            sku: data.sku || "", name: data.name || "", description: data.description || "",
            category_id: data.category_id || "", brand_id: data.brand_id || "", location_id: data.location_id || "", supplier_id: data.supplier_id || "",
            model: data.model || "", part_number: data.part_number || "", unit: data.unit || "unidad",
            min_stock: data.min_stock ?? 0, max_stock: data.max_stock ?? 1000, unit_cost: data.unit_cost ?? 0,
            initial_stock: data.stock ?? 0, barcode: data.barcode || "", is_active: data.is_active !== false, notes: data.notes || "",
          });
        } catch (e) { showError(e); }
        finally { setLoading(false); }
      }
    })();
  }, [id, isEdit]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form };
      ["category_id", "brand_id", "location_id", "supplier_id"].forEach(k => { if (!payload[k]) payload[k] = null; });
      payload.min_stock = Number(payload.min_stock) || 0;
      payload.max_stock = Number(payload.max_stock) || 0;
      payload.unit_cost = Number(payload.unit_cost) || 0;
      payload.initial_stock = Number(payload.initial_stock) || 0;

      if (isEdit) {
        delete payload.initial_stock;
        delete payload.sku;
        await api.patch(`/products/${id}`, payload);
        showSuccess("Producto actualizado.");
        navigate(`/products/${id}`);
      } else {
        const { data } = await api.post("/products", payload);
        showSuccess("Producto creado.");
        navigate(`/products/${data.id}`);
      }
    } catch (e) {
      showError(e);
    } finally { setSaving(false); }
  };

  return (
    <div>
      <PageHeader
        title={isEdit ? "Editar producto" : "Nuevo producto"}
        breadcrumb={[{ label: "Productos", to: "/products" }, { label: isEdit ? "Editar" : "Nuevo" }]}
        actions={<Button variant="outline" onClick={() => navigate(-1)}><ArrowLeft size={16} className="mr-2" />Cancelar</Button>}
      />

      {loading ? (
        <Card className="p-6">Cargando…</Card>
      ) : (
      <form onSubmit={onSubmit}>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="p-5 lg:col-span-2">
            <div className="font-display text-sm font-semibold">Información básica</div>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor="sku">SKU {isEdit && <span className="text-xs text-muted-foreground">(no editable)</span>}</Label>
                <Input id="sku" data-testid="product-form-sku-input" value={form.sku} onChange={e => set("sku", e.target.value.toUpperCase().replace(/\s+/g, "-"))} required disabled={isEdit} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="name">Nombre</Label>
                <Input id="name" data-testid="product-form-name-input" value={form.name} onChange={e => set("name", e.target.value)} required />
              </div>
              <div className="grid gap-1.5 md:col-span-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea id="description" rows={2} value={form.description} onChange={e => set("description", e.target.value)} />
              </div>
              <div className="grid gap-1.5">
                <Label>Categoría</Label>
                <Select value={form.category_id || "__none__"} onValueChange={v => set("category_id", v === "__none__" ? "" : v)}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar categoría" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">— Sin asignar</SelectItem>
                    {master.cats.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label>Marca</Label>
                <Select value={form.brand_id || "__none__"} onValueChange={v => set("brand_id", v === "__none__" ? "" : v)}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar marca" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">— Sin asignar</SelectItem>
                    {master.brands.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label>Ubicación</Label>
                <Select value={form.location_id || "__none__"} onValueChange={v => set("location_id", v === "__none__" ? "" : v)}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar ubicación" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">— Sin asignar</SelectItem>
                    {master.locs.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label>Proveedor</Label>
                <Select value={form.supplier_id || "__none__"} onValueChange={v => set("supplier_id", v === "__none__" ? "" : v)}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar proveedor" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">— Sin asignar</SelectItem>
                    {master.sups.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="model">Modelo</Label>
                <Input id="model" value={form.model} onChange={e => set("model", e.target.value)} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="part_number">Número de parte</Label>
                <Input id="part_number" value={form.part_number} onChange={e => set("part_number", e.target.value)} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="barcode">Código de barras</Label>
                <Input id="barcode" value={form.barcode} onChange={e => set("barcode", e.target.value)} placeholder="Se toma el SKU si se deja vacío" />
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <div className="font-display text-sm font-semibold">Stock y costeo</div>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label htmlFor="unit">Unidad</Label>
                <Input id="unit" value={form.unit} onChange={e => set("unit", e.target.value)} placeholder="unidad, m, paquete…" />
              </div>
              {!isEdit && (
                <div className="grid gap-1.5">
                  <Label htmlFor="initial_stock">Stock inicial</Label>
                  <Input id="initial_stock" type="number" min="0" value={form.initial_stock} onChange={e => set("initial_stock", e.target.value)} />
                </div>
              )}
              <div className="grid gap-1.5">
                <Label htmlFor="min_stock">Stock mínimo</Label>
                <Input id="min_stock" type="number" min="0" value={form.min_stock} onChange={e => set("min_stock", e.target.value)} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="max_stock">Stock máximo</Label>
                <Input id="max_stock" type="number" min="0" value={form.max_stock} onChange={e => set("max_stock", e.target.value)} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="unit_cost">Costo unitario</Label>
                <Input id="unit_cost" type="number" step="0.01" min="0" value={form.unit_cost} onChange={e => set("unit_cost", e.target.value)} />
              </div>
            </div>

            {isEdit && (
              <div className="mt-4 flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <div className="text-sm font-medium">Activo</div>
                  <div className="text-xs text-muted-foreground">Los productos inactivos no se muestran en los listados.</div>
                </div>
                <Switch checked={form.is_active} onCheckedChange={(v) => set("is_active", !!v)} />
              </div>
            )}

            <Button type="submit" disabled={saving} data-testid="product-form-save-button" className="mt-4 w-full">
              {saving ? <><Loader2 className="mr-2 animate-spin" size={16}/> Guardando…</> : <><Save size={16} className="mr-2" /> {isEdit ? "Guardar cambios" : "Crear producto"}</>}
            </Button>
          </Card>
        </div>
      </form>
      )}
    </div>
  );
}
