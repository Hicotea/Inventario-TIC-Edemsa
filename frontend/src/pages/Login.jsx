import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/lib/auth";
import { TID } from "@/lib/testIds";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const res = await login(email.trim().toLowerCase(), password);
    setLoading(false);
    if (res.ok) navigate("/dashboard", { replace: true });
  };

  return (
    <div className="min-h-screen w-full bg-background text-foreground">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
        {/* Brand panel */}
        <div className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-card p-10 border-r border-border">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(1200px_circle_at_-10%_-10%,hsl(186_55%_92%)_0%,transparent_55%)]"
          />
          <div className="relative flex items-center gap-3">
            <img 
              src="/logo.png" 
              alt="Logo EDEMSA" 
              className="h-10 w-auto object-contain"
            />
            <div>
              <div className="font-display text-lg font-semibold leading-none">EDEMSA TIC INVENTARIO</div>
              <div className="text-xs text-muted-foreground leading-tight">Sistema de gestión de inventario TIC</div>
            </div>
          </div>
          <div className="relative max-w-md">
            <h1 className="font-display text-3xl xl:text-4xl font-semibold leading-tight">
              Trazabilidad completa. Desde la recepción hasta el último cable.
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Niveles de stock en tiempo real, movimientos atómicos, lectura de QR/códigos de barras y bitácora de auditoría — diseñado para equipos de TIC.
            </p>
            <div className="mt-6 grid gap-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground"><ShieldCheck size={16} className="text-primary" /> Control de acceso por rol</div>
              <div className="flex items-center gap-2 text-muted-foreground"><ShieldCheck size={16} className="text-primary" /> Salidas atómicas sin sobreventa</div>
              <div className="flex items-center gap-2 text-muted-foreground"><ShieldCheck size={16} className="text-primary" /> Bitácora de auditoría inmutable</div>
            </div>
          </div>
          <div className="relative text-[11px] text-muted-foreground">© {new Date().getFullYear()} EDEMSA TIC INVENTARIO — uso interno.</div>
        </div>

        {/* Form panel */}
        <div className="flex items-center justify-center p-6">
          <Card className="w-full max-w-md p-6 md:p-8 shadow-sm border-border">
            <div className="flex items-center gap-3 lg:hidden mb-4">
              <img 
                src="/logo.png" 
                alt="Logo EDEMSA" 
                className="h-8 w-auto object-contain"
              />
              <div className="font-display font-semibold">EDEMSA TIC INVENTARIO</div>
            </div>
            <h2 className="font-display text-2xl font-semibold">Iniciar sesión</h2>
            <p className="mt-1 text-sm text-muted-foreground">Ingrese a su espacio de trabajo de inventario.</p>
            <form onSubmit={onSubmit} className="mt-6 grid gap-4">
              <div className="grid gap-1.5">
                <Label htmlFor="email">Correo corporativo</Label>
                <Input
                  id="email"
                  type="email"
                  autoFocus
                  autoComplete="email"
                  required
                  data-testid={TID.loginEmail}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@edemsa.com"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  data-testid={TID.loginPassword}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
              <Button type="submit" disabled={loading} data-testid={TID.loginSubmit} className="h-10">
                {loading ? <><Loader2 className="mr-2 animate-spin" size={16}/> Ingresando…</> : "Ingresar"}
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}