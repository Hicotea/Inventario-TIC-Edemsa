import { NavLink } from "react-router-dom";
import {
  LayoutDashboard, Package, ArrowRightLeft, ScanLine, Bell, ClipboardList,
  FileBarChart, Upload, Tags, Building2, MapPin, Users, ShieldCheck, Settings2, Boxes
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { TID } from "@/lib/testIds";
import { tRole } from "@/lib/format";

const PRIMARY = [
  { to: "/dashboard", key: "dashboard", label: "Panel principal", icon: LayoutDashboard, perm: null },
  { to: "/products", key: "products", label: "Productos", icon: Package, perm: "product:read" },
  { to: "/movements", key: "movements", label: "Movimientos", icon: ArrowRightLeft, perm: "movement:read" },
  { to: "/scanner", key: "scanner", label: "Escáner", icon: ScanLine, perm: "product:read" },
  { to: "/alerts", key: "alerts", label: "Alertas", icon: Bell, perm: "product:read" },
  { to: "/counts", key: "counts", label: "Inventario físico", icon: ClipboardList, perm: "count:read" },
  { to: "/reports", key: "reports", label: "Reportes", icon: FileBarChart, perm: "report:read" },
  { to: "/import", key: "import", label: "Importar", icon: Upload, perm: "import:write" },
];

const MASTER = [
  { to: "/categories", key: "categories", label: "Categorías", icon: Tags, perm: "master:read" },
  { to: "/brands", key: "brands", label: "Marcas", icon: Boxes, perm: "master:read" },
  { to: "/locations", key: "locations", label: "Ubicaciones", icon: MapPin, perm: "master:read" },
  { to: "/suppliers", key: "suppliers", label: "Proveedores", icon: Building2, perm: "master:read" },
];

const ADMIN = [
  { to: "/users", key: "users", label: "Usuarios", icon: Users, roleOnly: "admin" },
  { to: "/audit", key: "audit", label: "Auditoría", icon: ShieldCheck, roleOnly: "admin" },
  { to: "/settings", key: "settings", label: "Permisos", icon: Settings2, roleOnly: "admin" },
];

function Item({ to, label, icon: Icon, testId, onNavigate }) {
  return (
    <NavLink
      to={to}
      onClick={onNavigate}
      data-testid={testId}
      className={({ isActive }) =>
        cn(
          "flex h-10 items-center gap-3 rounded-lg px-3 text-sm transition-colors",
          "hover:bg-accent hover:text-accent-foreground",
          isActive ? "bg-accent text-accent-foreground font-medium" : "text-foreground/80"
        )
      }
    >
      <Icon size={18} strokeWidth={1.75} />
      <span className="truncate">{label}</span>
    </NavLink>
  );
}

function Group({ label, children }) {
  return (
    <div className="px-3 pt-4">
      <div className="px-2 pb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="flex flex-col gap-1">{children}</div>
    </div>
  );
}

export default function Sidebar({ onNavigate }) {
  const { hasPerm, user } = useAuth();
  const canShow = (item) => {
    if (item.roleOnly) return user?.role === item.roleOnly;
    if (!item.perm) return true;
    return hasPerm(item.perm);
  };

  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex h-14 items-center gap-2.5 border-b border-border px-4">
        <img 
          src="/logo.png" 
          alt="EDEMSA Logo" 
          className="h-8 w-8 object-contain rounded-md"
        />
        <div className="flex flex-col min-w-0">
          <span className="font-display text-sm font-semibold leading-none truncate">EDEMSA TIC</span>
          <span className="text-[11px] text-muted-foreground leading-tight">Inventario</span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto scroll-thin pb-4">
        <Group label="General">
          {PRIMARY.filter(canShow).map((i) => (
            <Item key={i.key} to={i.to} label={i.label} icon={i.icon} testId={TID.sidebarNav(i.key)} onNavigate={onNavigate} />
          ))}
        </Group>
        <Group label="Datos maestros">
          {MASTER.filter(canShow).map((i) => (
            <Item key={i.key} to={i.to} label={i.label} icon={i.icon} testId={TID.sidebarNav(i.key)} onNavigate={onNavigate} />
          ))}
        </Group>
        {user?.role === "admin" && (
          <Group label="Administración">
            {ADMIN.map((i) => (
              <Item key={i.key} to={i.to} label={i.label} icon={i.icon} testId={TID.sidebarNav(i.key)} onNavigate={onNavigate} />
            ))}
          </Group>
        )}
      </nav>

      <div className="border-t border-border p-3">
        <div className="flex items-center gap-2 rounded-lg bg-secondary px-2.5 py-2">
          <div className="grid h-8 w-8 place-items-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
            {(user?.full_name || user?.email || "?").slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium">{user?.full_name || user?.email}</div>
            <div className="truncate text-[11px] uppercase tracking-wide text-muted-foreground">{tRole(user?.role)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}