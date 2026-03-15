import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import api from "../api/axios";
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  FileText,
  HandCoins,
  Wallet,
  PieChart,
  Truck,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Sun,
  Moon,
  UserCog,
  UtensilsCrossed,
  ChefHat,
  BookUser,
  MessageSquareMore,
} from "lucide-react";

function WhatsAppIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.554 4.118 1.528 5.849L0 24l6.335-1.505A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.882a9.877 9.877 0 01-5.031-1.378l-.361-.214-3.741.981.999-3.648-.235-.374A9.847 9.847 0 012.118 12C2.118 6.533 6.533 2.118 12 2.118S21.882 6.533 21.882 12 17.467 21.882 12 21.882z"/>
    </svg>
  )
}
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";

// roles: undefined = todos | 'staff' = admin+staff | 'admin' = solo admin
const NAV_GROUPS = [
  {
    label: null,
    items: [
      { path: "/dashboard",    label: "Dashboard",      Icon: LayoutDashboard },
      { path: "/contacts",     label: "Contactos",      Icon: BookUser },
      { path: "/clients",      label: "Clientes",       Icon: Users },
      { path: "/events",       label: "Eventos",        Icon: CalendarDays },
      { path: "/quotes",       label: "Cotizaciones",   Icon: FileText },
      { path: "/budget",       label: "Presupuestos",   Icon: PieChart,        minRole: 'staff' },
    ],
  },
  {
    label: "Catering",
    items: [
      { path: "/catering",  label: "Menús",     Icon: UtensilsCrossed },
      { path: "/recetario", label: "Recetario", Icon: ChefHat },
    ],
  },
  {
    label: "Finanzas",
    minRole: 'staff',
    items: [
      { path: "/payments",          label: "Cobros", Icon: HandCoins, minRole: 'staff' },
      { path: "/supplier-payments", label: "Pagos",  Icon: Wallet,    minRole: 'staff' },
    ],
  },
  {
    label: "Portal",
    items: [
      { path: "/portal-queries", label: "Consultas", Icon: MessageSquareMore },
    ],
  },
  {
    label: "Configuración",
    items: [
      { path: "/whatsapp",  label: "WhatsApp",    Icon: WhatsAppIcon },
      { path: "/suppliers", label: "Proveedores", Icon: Truck },
      { path: "/users",     label: "Usuarios",    Icon: UserCog, minRole: 'admin' },
    ],
  },
];

export default function Layout() {
  const [open, setOpen] = useState(true);
  const [pendingQueries, setPendingQueries] = useState(0);
  const [clientDecisions, setClientDecisions] = useState(0);
  const [portalGuestLists, setPortalGuestLists] = useState(0);
  const [lastSeenDecisions, setLastSeenDecisions] = useState(() =>
    localStorage.getItem('lastSeenDecisions') || new Date(0).toISOString()
  );
  const [lastSeenGuestLists, setLastSeenGuestLists] = useState(() =>
    localStorage.getItem('lastSeenGuestLists') || new Date(0).toISOString()
  );

  // Escuchar cambios de localStorage desde otras pestañas
  useEffect(() => {
    const onStorage = () => {
      const val = localStorage.getItem('lastSeenDecisions') || new Date(0).toISOString()
      setLastSeenDecisions(val)
      const val2 = localStorage.getItem('lastSeenGuestLists') || new Date(0).toISOString()
      setLastSeenGuestLists(val2)
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, []);

  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { role, isAdmin, isReadonly } = useAuth();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const canSeeItem = (item) => {
    if (!item.minRole) return true
    if (item.minRole === 'admin') return isAdmin
    if (item.minRole === 'staff') return !isReadonly
    return true
  }

  const ROLE_LABEL = { admin: 'Admin', staff: 'Staff', readonly: 'Solo lectura' }
  const ROLE_COLOR = { admin: '#c9a84c', staff: '#3b82f6', readonly: '#6b7280' }

  // Polling unificado: portal-queries + client-decisions + portal-guests en un solo intervalo (30s)
  useEffect(() => {
    const load = () => {
      api.get("/api/portal-queries")
        .then(res => setPendingQueries(res.data.filter(q => q.status === "pending").length))
        .catch(() => {})
      api.get(`/api/activity/client-decisions?since=${lastSeenDecisions}`)
        .then(res => setClientDecisions(res.data.length))
        .catch(() => {})
      api.get(`/api/activity/portal-guests?since=${lastSeenGuestLists}`)
        .then(res => setPortalGuestLists(res.data.length))
        .catch(() => {})
    }
    load()
    const interval = setInterval(load, 30000)
    return () => clearInterval(interval)
  }, [lastSeenDecisions, lastSeenGuestLists]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const isLight = theme === "light";

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "var(--bg-base)",
      }}
    >
      <aside
        style={{
          width: open ? 240 : 72,
          transition: "width 0.3s",
          background: "var(--bg-surface)",
          borderRight: "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          position: "fixed",
          height: "100vh",
          zIndex: 100,
          overflow: "hidden",
        }}
      >
        {/* Logo */}
        <div
          style={{
            padding: "12px 8px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <img
            src="/haus-logo.svg"
            alt="Haus"
            style={{
              width: open ? 80 : 44,
              height: open ? 80 : 44,
              objectFit: "contain",
              transition: "width 0.3s, height 0.3s",
              flexShrink: 0,
            }}
          />
        </div>

        {/* Nav */}
        <nav style={{ padding: "12px 8px", flex: 1, overflowY: "auto" }}>
          {NAV_GROUPS.map((group, gi) => {
            const visibleItems = group.items.filter(canSeeItem)
            if (visibleItems.length === 0) return null
            return (
            <div key={gi} style={{ marginBottom: 4 }}>
              {group.label && open && (
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: 1.5,
                    textTransform: "uppercase",
                    color: "var(--text-faint)",
                    padding: "10px 12px 4px",
                  }}
                >
                  {group.label}
                </div>
              )}
              {group.label && !open && gi > 0 && (
                <div
                  style={{
                    margin: "8px 12px",
                    borderTop: "1px solid var(--border)",
                  }}
                />
              )}
              {visibleItems.map(({ path, label, Icon }) => (
                <NavLink
                  key={path}
                  to={path}
                  className="sidebar-nav-item"
                  style={({ isActive }) => ({
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "10px 12px",
                    borderRadius: 10,
                    marginBottom: 2,
                    color: isActive ? "var(--gold-light)" : "var(--text-muted)",
                    background: isActive ? "var(--gold-bg)" : "transparent",
                    borderLeft: isActive
                      ? "2px solid var(--gold)"
                      : "2px solid transparent",
                    transition: "all 0.2s",
                    textDecoration: "none",
                  })}
                >
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    <Icon size={18} strokeWidth={1.75} />
                    {path === "/portal-queries" && pendingQueries > 0 && (
                      <div style={{
                        position: "absolute", top: -5, right: -6,
                        background: "#f59e0b", color: "#09090f",
                        borderRadius: 20, fontSize: 9, fontWeight: 800,
                        minWidth: 14, height: 14, display: "flex",
                        alignItems: "center", justifyContent: "center",
                        padding: "0 3px", lineHeight: 1,
                      }}>
                        {pendingQueries}
                      </div>
                    )}
                    {path === "/quotes" && clientDecisions > 0 && (
                      <div style={{
                        position: "absolute", top: -5, right: -6,
                        background: "#22c55e", color: "#09090f",
                        borderRadius: 20, fontSize: 9, fontWeight: 800,
                        minWidth: 14, height: 14, display: "flex",
                        alignItems: "center", justifyContent: "center",
                        padding: "0 3px", lineHeight: 1,
                      }}>
                        {clientDecisions}
                      </div>
                    )}
                    {path === "/events" && portalGuestLists > 0 && (
                      <div style={{
                        position: "absolute", top: -5, right: -6,
                        background: "#8b5cf6", color: "#fff",
                        borderRadius: 20, fontSize: 9, fontWeight: 800,
                        minWidth: 14, height: 14, display: "flex",
                        alignItems: "center", justifyContent: "center",
                        padding: "0 3px", lineHeight: 1,
                      }}>
                        {portalGuestLists}
                      </div>
                    )}
                  </div>
                  {open && (
                    <span style={{ fontSize: 13, fontWeight: 500, flex: 1 }}>
                      {label}
                    </span>
                  )}
                  {open && path === "/portal-queries" && pendingQueries > 0 && (
                    <div style={{
                      background: "rgba(245,158,11,0.15)", color: "#f59e0b",
                      borderRadius: 20, fontSize: 10, fontWeight: 700,
                      padding: "1px 7px",
                    }}>
                      {pendingQueries}
                    </div>
                  )}
                  {open && path === "/quotes" && clientDecisions > 0 && (
                    <div style={{
                      background: "rgba(34,197,94,0.15)", color: "#22c55e",
                      borderRadius: 20, fontSize: 10, fontWeight: 700,
                      padding: "1px 7px",
                    }}>
                      {clientDecisions} nuevo{clientDecisions !== 1 ? "s" : ""}
                    </div>
                  )}
                  {open && path === "/events" && portalGuestLists > 0 && (
                    <div style={{
                      background: "rgba(139,92,246,0.15)", color: "#8b5cf6",
                      borderRadius: 20, fontSize: 10, fontWeight: 700,
                      padding: "1px 7px",
                    }}>
                      {portalGuestLists} lista{portalGuestLists !== 1 ? "s" : ""}
                    </div>
                  )}
                </NavLink>
              ))}
            </div>
            )
          })}
        </nav>

        {/* Footer */}
        <div style={{ padding: 12, borderTop: "1px solid var(--border)" }}>
          {open && (
            <div style={{ marginBottom: 8, padding: "0 4px" }}>
              <div style={{ fontSize: 12, color: "var(--text-label)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginBottom: 4 }}>
                {user.name || "Usuario"}
              </div>
              <div style={{
                display: "inline-block", fontSize: 10, fontWeight: 700,
                padding: "2px 8px", borderRadius: 99,
                color: ROLE_COLOR[role] || '#6b7280',
                background: `${ROLE_COLOR[role] || '#6b7280'}18`,
                border: `1px solid ${ROLE_COLOR[role] || '#6b7280'}40`,
                letterSpacing: 0.5,
              }}>
                {ROLE_LABEL[role] || role}
              </div>
            </div>
          )}
          <div
            style={{
              display: "flex",
              flexDirection: open ? "row" : "column",
              gap: 6,
              alignItems: "stretch",
            }}
          >
            <button
              onClick={handleLogout}
              title="Cerrar sesión"
              className="sidebar-btn sidebar-btn-logout"
              style={{
                flex: 1,
                padding: "9px 0",
                border: "1px solid rgba(239,68,68,0.25)",
                borderRadius: 8,
                background: "rgba(239,68,68,0.06)",
                color: "#ef4444",
                fontSize: 12,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                whiteSpace: "nowrap",
              }}
            >
              <LogOut size={14} />
              {open && "Salir"}
            </button>

            {/* Toggle tema */}
            <button
              onClick={toggleTheme}
              title={isLight ? "Modo oscuro" : "Modo claro"}
              className="sidebar-btn"
              style={{
                flex: 1,
                padding: "9px 0",
                border: "1px solid var(--border)",
                borderRadius: 8,
                background: "transparent",
                color: "var(--text-muted)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s",
              }}
            >
              {isLight ? <Moon size={15} /> : <Sun size={15} />}
            </button>

            {/* Toggle sidebar */}
            <button
              onClick={() => setOpen(!open)}
              className="sidebar-btn"
              style={{
                flex: 1,
                padding: "9px 0",
                border: "1px solid var(--border)",
                borderRadius: 8,
                background: "transparent",
                color: "var(--text-faint)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {open ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
            </button>
          </div>
        </div>
      </aside>

      <main
        style={{
          marginLeft: open ? 240 : 72,
          transition: "margin-left 0.3s",
          flex: 1,
          padding: "32px",
          background: "var(--bg-base)",
          minHeight: "100vh",
        }}
      >
        <Outlet />
      </main>
    </div>
  );
}