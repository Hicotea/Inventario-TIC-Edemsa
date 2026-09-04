import { useState, useEffect } from "react";
import { Search, UserCheck, Shield, RefreshCw } from "lucide-react";
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
            Registro detallado de hardware entregado a funcionarios y departamentos de EDEMSA.
          </p>
        </div>
        <Button onClick={fetchExits} variant="outline" size="sm" className="gap-2">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Actualizar
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por cédula, funcionario, serie o equipo..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      <Card className="overflow-hidden border border-border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-xs uppercase text-muted-foreground border-b">
              <tr>
                <th className="p-3">Fecha y Hora</th>
                <th className="p-3">Equipo / Código</th>
                <th className="p-3">Asignado A (Funcionario)</th>
                <th className="p-3">Departamento</th>
                <th className="p-3">Serie / Estado</th>
                <th className="p-3">Despachado Por</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">Cargando entregas...</td>
                </tr>
              ) : movements.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">No hay registros de salidas detalladas.</td>
                </tr>
              ) : (
                movements.map((mv) => (
                  <tr key={mv.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-3 whitespace-nowrap text-xs text-muted-foreground font-mono">
                      {new Date(mv.created_at).toLocaleString("es-CO")}
                    </td>
                    <td className="p-3">
                      <div className="font-semibold text-foreground">{mv.product_name}</div>
                      <div className="text-xs font-mono text-muted-foreground">{mv.product_sku}</div>
                      <span className="inline-block mt-1 px-2 py-0.5 text-[10px] bg-blue-100 text-blue-800 rounded font-medium">
                        Cant: {mv.qty}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="font-medium text-foreground flex items-center gap-1.5">
                        <UserCheck size={14} className="text-primary" />
                        {mv.recipient_name || mv.requester || "Sin especificar"}
                      </div>
                      {mv.recipient_document && (
                        <div className="text-xs text-muted-foreground font-mono ml-5">
                          CC: {mv.recipient_document}
                        </div>
                      )}
                    </td>
                    <td className="p-3">
                      <span className="text-sm font-medium">{mv.department || "N/A"}</span>
                    </td>
                    <td className="p-3">
                      <div className="font-mono text-xs text-foreground">
                        {mv.serial_number ? `S/N: ${mv.serial_number}` : "S/N: No registrado"}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        Estado: <strong className="text-foreground">{mv.condition || "Bueno"}</strong>
                      </span>
                    </td>
                    <td className="p-3 text-xs text-muted-foreground">
                      <div className="font-medium text-foreground">{mv.user_name}</div>
                      {mv.notes && <p className="italic mt-0.5 text-[11px]">"{mv.notes}"</p>}
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