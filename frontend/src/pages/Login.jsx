import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Package, Loader2, ShieldCheck } from "lucide-react";
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

  const fillDemo = (role) => {
    if (role === "admin") { setEmail("admin@company.com"); setPassword("Admin123!"); }
    if (role === "manager") { setEmail("manager@company.com"); setPassword("Manager123!"); }
    if (role === "viewer") { setEmail("viewer@company.com"); setPassword("Viewer123!"); }
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
          <div className="relative flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground">
              <Package size={18} />
            </div>
            <div>
              <div className="font-display text-lg font-semibold leading-none">Stockroom OS</div>
              <div className="text-xs text-muted-foreground leading-tight">Enterprise IT Inventory</div>
            </div>
          </div>
          <div className="relative max-w-md">
            <h1 className="font-display text-3xl xl:text-4xl font-semibold leading-tight">
              Trace every part. From receiving to the last cable.
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Real-time stock levels, atomic movements, QR/barcode scanning, and a full audit trail — built for busy IT teams.
            </p>
            <div className="mt-6 grid gap-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground"><ShieldCheck size={16} className="text-primary" /> Role-based access control</div>
              <div className="flex items-center gap-2 text-muted-foreground"><ShieldCheck size={16} className="text-primary" /> No-oversell atomic exits</div>
              <div className="flex items-center gap-2 text-muted-foreground"><ShieldCheck size={16} className="text-primary" /> Immutable audit log</div>
            </div>
          </div>
          <div className="relative text-[11px] text-muted-foreground">© {new Date().getFullYear()} Stockroom OS — for internal IT use.</div>
        </div>

        {/* Form panel */}
        <div className="flex items-center justify-center p-6">
          <Card className="w-full max-w-md p-6 md:p-8 shadow-sm border-border">
            <div className="flex items-center gap-2 lg:hidden mb-4">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground"><Package size={16} /></div>
              <div className="font-display font-semibold">Stockroom OS</div>
            </div>
            <h2 className="font-display text-2xl font-semibold">Sign in</h2>
            <p className="mt-1 text-sm text-muted-foreground">Access your inventory workspace.</p>
            <form onSubmit={onSubmit} className="mt-6 grid gap-4">
              <div className="grid gap-1.5">
                <Label htmlFor="email">Work email</Label>
                <Input
                  id="email"
                  type="email"
                  autoFocus
                  autoComplete="email"
                  required
                  data-testid={TID.loginEmail}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="password">Password</Label>
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
                {loading ? <><Loader2 className="mr-2 animate-spin" size={16}/> Signing in…</> : "Sign in"}
              </Button>
            </form>
            <div className="mt-6 rounded-lg border border-dashed border-border p-3 text-xs">
              <div className="font-medium text-foreground">Demo accounts</div>
              <div className="mt-1 grid gap-1 text-muted-foreground">
                <button type="button" onClick={() => fillDemo("admin")} className="text-left hover:text-foreground">
                  <span className="font-mono">admin@company.com</span> · Admin123!
                </button>
                <button type="button" onClick={() => fillDemo("manager")} className="text-left hover:text-foreground">
                  <span className="font-mono">manager@company.com</span> · Manager123!
                </button>
                <button type="button" onClick={() => fillDemo("viewer")} className="text-left hover:text-foreground">
                  <span className="font-mono">viewer@company.com</span> · Viewer123!
                </button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
