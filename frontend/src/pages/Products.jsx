import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Plus, Search, Download, X, Filter, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import EmptyState from "@/components/EmptyState";
import LoadingTable from "@/components/LoadingTable";
import { api, showError, showSuccess, API } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { TID } from "@/lib/testIds";
import { formatNumber, tStatus } from "@/lib/format";

function useMaster() {
  const [cats, setCats] = useState([]);
  const [brands, setBrands] = useState([]);
  const [locs, setLocs] = useState([]);
  const [sups, setSups] = useState([]);
  useEffect(() => {
    Promise.all([
      api.get("/categories"), api.get("/brands"), api.get("/locations"), api.get("/suppliers"),
    ]).then(([a, b, c, d]) => {
      setCats(a.data); setBrands(b.data); setLocs(c.data); setSups(d.data);
    }).catch(() => {});
  }, []);
  return { cats, brands, locs, sups };
}

export default function Products() {
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState(params.get("q") || "");
  const [category, setCategory] = useState(params.get("category") || "");
  const [brand, setBrand] = useState(params.get("brand") || "");
  const [location, setLocation] = useState(params.get("location") || "");
  const [status, setStatus] = useState(params.get("status") || "");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { hasPerm } = useAuth();
  const master = useMaster();
  const navigate = useNavigate();

  const canCreate = hasPerm("product:write");

  const activeChips = useMemo(() => {
    const chips = [];
    if (category) chips.push({ key: "category", label: `Categoría: ${master.cats.find(c => c.id === category)?.name || "—"}`, clear: () => setCategory("") });
    if (brand) chips.push({ key: "brand", label: `Marca: ${master.brands.find(b => b.id === brand)?.name || "—"}`, clear: () => setBrand("") });
    if (location) chips.push({ key: "location", label: `Ubicación: ${master.locs.find(l => l.id === location)?.name || "—"}`, clear: () => setLocation("") });
    if (status) chips.push({ key: "status", label: `Estado: ${tStatus(status)}`, clear: () => setStatus("") });
    return chips;
  }, [category, brand, location, status, master]);

  useEffect(() => {
    const t = setTimeout(() => reload(), 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line
  }, [q, category, brand, location, status]);

  useEffect(() => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (category) p.set("category", category);
    if (brand) p.set("brand", brand);
    if (location) p.set("location", location);
    if (status) p.set("status", status);
    setParams(p, { replace: true });
    // eslint-disable-next-line
  }, [q, category, brand, location, status]);

  const reload = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/products", {
        params: {
          q: q || undefined,
          category_id: category || undefined,
          brand_id: brand || undefined,
          location_id: location || undefined,
          status: status || undefined,
          limit: 500,
        },
      });
      setItems(data);
    } catch (e) {
      showError(e);
    } finally {
      setLoading(false);
    }
  };

  const exportFile = async (format) => {
    try {
      const token = localStorage.getItem("it-inv-token");
      const url = new URL(`${API}/reports/inventory/export`);
      url.searchParams.set("format", format);
      if (category) url.searchParams.set("category_id", category);
      if (location) url.searchParams.set("location_id", location);
      if (status) url.searchParams.set("status", status);
      const res = await fetch(url.toString(), { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Falló la exportación");
      const blob = await res.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `inventario.${format}`;
      link.click();
      showSuccess(`Se exportaron ${items.length} productos.`);
    } catch (e) { showError(e, "Falló la exportación."); }
  };

  const clearAll = () => { setQ(""); setCategory(""); setBrand(""); setLocation(""); setStatus(""); };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (window.confirm("¿Estás seguro de que deseas eliminar este producto?")) {
      try {
        await api.delete(`/products/${id}`);
        showSuccess("Producto eliminado correctamente.");
        reload();
      } catch (err) {
        showError(err, "No se pudo eliminar el producto.");
      }
    }
  };

  return (
    <div>
      <PageHeader
        title="Productos"
        description="Administre SKUs, niveles de stock y ubicaciones."
        breadcrumb={[{ label: "Inicio", to: "/" }, { label: "Productos" }]}
        actions={
          <>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" data-testid={TID.productsExport}><Download size={16} className="mr-2"/>Exportar</Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-44 p-1">
                <button className="w-full rounded-md px-3 py-2 text-left text-sm hover:bg-accent" onClick={() => exportFile("xlsx")}>Excel (.xlsx)</button>
                <button className="w-full rounded-md px-3 py-2 text-left text-sm hover:bg-accent" onClick={() => exportFile("csv")}>CSV</button>
                <button className="w-full rounded-md px-3 py-2 text-left text-sm hover:bg-accent" onClick={() => exportFile("pdf")}>PDF</button>
              </PopoverContent>
            </Popover>
            {canCreate && (
              <Button onClick={() => navigate("/products/new")} data-testid={TID.productsCreate}>
                <Plus size={16} className="mr-2" /> Nuevo producto
              </Button>
            )}
          </>
        }
      />

      <Card className="p-3 md:p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              data-testid={TID.productsSearch}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por nombre, SKU, código de barras o QR…"
              className="pl-9 h-10"
              aria-label="Buscar productos"
            />
          </div>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            <Select value={category || "__all__"} onValueChange={(v) => setCategory(v === "__all__" ? "" : v)}>
              <SelectTrigger className="h-10" data-testid="products-filter-category"><SelectValue placeholder="Categoría" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todas las categorías</SelectItem>
                {master.cats.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={brand || "__all__"} onValueChange={(v) => setBrand(v === "__all__" ? "" : v)}>
              <SelectTrigger className="h-10" data-testid="products-filter-brand"><SelectValue placeholder="Marca" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todas las marcas</SelectItem>
                {master.brands.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={location || "__all__"} onValueChange={(v) => setLocation(v === "__all__" ? "" : v)}>
              <SelectTrigger className="h-10" data-testid="products-filter-location"><SelectValue placeholder="Ubicación" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todas las ubicaciones</SelectItem>
                {master.locs.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={status || "__all__"} onValueChange={(v) => setStatus(v === "__all__" ? "" : v)}>
              <SelectTrigger className="h-10" data-testid="products-filter-status"><SelectValue placeholder="Estado" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todos los estados</SelectItem>
                <SelectItem value="available">Disponible</SelectItem>
                <SelectItem value="low">Stock bajo</SelectItem>
                <SelectItem value="out">Agotado</SelectItem>
                <SelectItem value="inactive">Inactivo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {activeChips.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Filter size={14} className="text-muted-foreground" />
            {activeChips.map(c => (
              <Badge key={c.key} variant="secondary" className="gap-1 pr-1">
                {c.label}
                <button onClick={c.clear} aria-label="Quitar filtro" className="ml-1 rounded-full p-0.5 hover:bg-background"><X size={12} /></button>
              </Badge>
            ))}
            <button onClick={clearAll} className="text-xs text-primary hover:underline">Limpiar filtros</button>
          </div>
        )}
      </Card>

      <div className="mt-4">
        {loading ? <LoadingTable rows={8} cols={7} /> : items.length === 0 ? (
          <EmptyState
            title="Ningún producto coincide con los filtros"
            description="Pruebe limpiando los filtros o cree un nuevo producto."
            action={canCreate ? <Button onClick={() => navigate("/products/new")}><Plus size={16} className="mr-2" />Nuevo producto</Button> : null}
          />
        ) : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <Table data-testid={TID.productsTable}>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead>Producto</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Ubicación</TableHead>
                    <TableHead className="text-right">Stock</TableHead>
                    <TableHead className="text-right">Mínimo</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((p) => (
                    <TableRow key={p.id} data-testid={TID.productRow(p.id)} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/products/${p.id}`)}>
                      <TableCell>
                        <div className="font-medium">{p.name}</div>
                        <div className="text-xs text-muted-foreground truncate max-w-[280px]">{p.brand_name || "—"}{p.model ? ` · ${p.model}` : ""}</div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{p.sku}</TableCell>
                      <TableCell>{p.category_name || <span className="text-muted-foreground">—</span>}</TableCell>
                      <TableCell>{p.location_name || <span className="text-muted-foreground">—</span>}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatNumber(p.stock, { maximumFractionDigits: 0 })}</TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">{formatNumber(p.min_stock, { maximumFractionDigits: 0 })}</TableCell>
                      <TableCell><StatusBadge status={p.status} /></TableCell>
                      <TableCell className="text-right">
                        {canCreate && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:bg-destructive/10 hover:text-destructive h-8 w-8 p-0"
                            onClick={(e) => handleDelete(e, p.id)}
                            title="Eliminar producto"
                          >
                            <Trash2 size={16} />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex items-center justify-between border-t border-border px-4 py-2 text-xs text-muted-foreground">
              <span>Mostrando {items.length} producto{items.length === 1 ? "" : "s"}</span>
              {canCreate && <Link to="/products/new" className="text-primary hover:underline">Agregar un nuevo producto →</Link>}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}