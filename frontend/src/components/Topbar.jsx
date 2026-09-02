import { useNavigate } from "react-router-dom";
import { Menu, Search, LogOut, ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth";
import { TID } from "@/lib/testIds";
import { tRole } from "@/lib/format";

export default function Topbar({ onOpenMenu }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleSearchKey = (e) => {
    if (e.key === "Enter") {
      const val = e.currentTarget.value.trim();
      if (val) {
        navigate(`/products?q=${encodeURIComponent(val)}`);
      }
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-card/95 backdrop-blur px-3 md:px-4">
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={onOpenMenu} aria-label="Abrir menú">
        <Menu size={20} />
      </Button>

      <div className="relative hidden md:flex flex-1 max-w-[520px] items-center">
        <Search size={16} className="absolute left-3 text-muted-foreground pointer-events-none" />
        <Input
          data-testid={TID.topbarSearch}
          onKeyDown={handleSearchKey}
          placeholder="Buscar productos, SKU, código de barras…"
          className="pl-9 h-9 bg-secondary border-transparent focus-visible:bg-background focus-visible:border-input"
          aria-label="Buscar en el inventario"
        />
        <span className="kbd absolute right-2 hidden md:inline-flex">Enter</span>
      </div>

      <div className="flex-1 md:hidden font-display font-semibold truncate">EDEMSA TIC</div>

      <div className="ml-auto flex items-center gap-2">
        <Button variant="outline" size="sm" className="hidden sm:flex" onClick={() => navigate("/scanner")}>
          <ScanLine size={16} className="mr-2" /> Escanear
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2" data-testid={TID.topbarUserMenu} aria-label="Menú de usuario">
              <div className="grid h-7 w-7 place-items-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
                {(user?.full_name || user?.email || "?").slice(0, 1).toUpperCase()}
              </div>
              <span className="hidden md:inline text-sm">{user?.full_name?.split(" ")[0] || user?.email}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="font-medium">{user?.full_name || user?.email}</div>
              <div className="text-xs text-muted-foreground uppercase tracking-wide">{tRole(user?.role)}</div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} data-testid={TID.topbarLogout}>
              <LogOut size={16} className="mr-2" /> Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
