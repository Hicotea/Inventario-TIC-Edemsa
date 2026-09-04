import { useState, useEffect } from "react";
import { Search, UserCheck, RefreshCw, Laptop, Tag, FileText, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { api } from "@/lib/api";

export default function Salidas() {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  const fetchExits = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/movements?type=exit${query ? `&q=${query}` : ""}`);
      setMovements(res.data || []);
    } catch (err) {
      console.error("Error al cargar salidas:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExits();
  }, [query]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Salidas y Asignaciones de Equipos</h1>
          <p className="text-sm text-muted-foreground">
            Registro detallado de hardware, componentes y activos entregados a funcionarios de EDEMSA.
          </p>
        </div>
        <Button onClick={fetchExits} variant="outline" size="sm" className="gap-2">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Actualizar
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por funcionario, cédula, placa, serie, equipo o área..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      <Card className="overflow-hidden border border-border shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/60 text-xs uppercase text-muted-foreground border-b border-border">
              <tr>
                <th className="p-3">Fecha y Hora</th>
                <th className="p-3">Equipo / Producto</th>
                <th className="p-3">Funcionario / Área</th>
                <th className="p-3">Datos del Hardware</th>
                <th className="p-3">Ubicación y Ref.</th>
                <th className="p-3">Despacho y Notas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    Cargando historial de salidas…
                  </td>
                </tr>
              ) : movements.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    No hay registros de salidas detalladas.
                  </td>
                </tr>
              ) : (
                movements.map((mv) => (
                  <tr key={mv.id} className="hover:bg-muted/30 transition-colors">
                    {/* Fecha y Hora */}
                    <td className="p-3 whitespace-nowrap text-xs text-muted-foreground font-mono">
                      {new Date(mv.created_at).toLocaleString("es-CO")}
                    </td>

                    {/* Producto */}
                    <td className="p-3">
                      <div className="font-semibold text-foreground">{mv.product_name}</div>
                      <div className="text-xs font-mono text-muted-foreground">{mv.product_sku}</div>
                      <span className="inline-block mt-1 px-2 py-0.5 text-[10px] bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 rounded font-medium">
                        Cant: {mv.qty}
                      </span>
                    </td>

                    {/* Funcionario, Cédula y Departamento */}
                    <td className="p-3">
                      <div className="font-medium text-foreground flex items-center gap-1.5">
                        <UserCheck size={14} className="text-primary shrink-0" />
                        {mv.recipient_name || mv.requester || "Sin especificar"}
                      </div>
                      {mv.recipient_document && (
                        <div className="text-xs text-muted-foreground font-mono ml-5">
                          CC: {mv.recipient_document}
                        </div>
                      )}
                      {mv.department && (
                        <div className="text-xs text-primary font-medium ml-5">
                          {mv.department}
                        </div>
                      )}
                    </td>

                    {/* Hardware: S/N, Placa, Hostname, Estado */}
                    <td className="p-3 space-y-0.5">
                      {mv.serial_number ? (
                        <div className="font-mono text-xs text-foreground font-medium">
                          S/N: {mv.serial_number}
                        </div>
                      ) : (
                        <div className="font-mono text-xs text-muted-foreground">S/N: No registrado</div>
                      )}

                      {mv.placa && (
                        <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 font-mono flex items-center gap-1">
                          <Tag size={12} /> Placa: {mv.placa}
                        </div>
                      )}

                      {mv.device_name && (
                        <div className="text-xs text-muted-foreground font-mono flex items-center gap-1">
                          <Laptop size={12} /> {mv.device_name}
                        </div>
                      )}

                      <div className="text-xs text-muted-foreground">
                        Estado: <strong className="text-foreground">{mv.condition || "Bueno"}</strong>
                      </div>
                    </td>

                    {/* Ubicación, Destino y Referencia */}
                    <td className="p-3 space-y-1">
                      {mv.destination ? (
                        <div className="text-xs text-foreground flex items-center gap-1 font-medium">
                          <MapPin size={12} className="text-muted-foreground" /> {mv.destination}
                        </div>
                      ) : (
                        <div className="text-xs text-muted-foreground">Destino: N/A</div>
                      )}

                      {mv.reference && (
                        <div className="text-xs text-muted-foreground flex items-center gap-1 font-mono">
                          <FileText size={12} /> Ref: {mv.reference}
                        </div>
                      )}

                      {mv.reason && (
                        <div className="text-[11px] text-muted-foreground italic">
                          Motivo: {mv.reason}
                        </div>
                      )}
                    </td>

                    {/* Despachador y Observaciones */}
                    <td className="p-3 text-xs text-muted-foreground">
                      <div className="font-medium text-foreground">{mv.user_name}</div>
                      {mv.notes && (
                        <p className="italic mt-1 text-[11px] bg-muted/50 p-1.5 rounded border border-border/50 text-foreground/80">
                          "{mv.notes}"
                        </p>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}