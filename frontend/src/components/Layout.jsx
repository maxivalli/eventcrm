import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import {
  LayoutDashboard, Users, CalendarDays, FileText,
  HandCoins, Wallet, PieChart, Truck, ChevronLeft, ChevronRight,
  LogOut, Sun, Moon, UserCog,
} from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'

const tabs = [
  { path: '/dashboard',         label: 'Dashboard',      Icon: LayoutDashboard },
  { path: '/clients',           label: 'Clientes',        Icon: Users },
  { path: '/events',            label: 'Eventos',         Icon: CalendarDays },
  { path: '/quotes',            label: 'Cotizaciones',    Icon: FileText },
  { path: '/payments',          label: 'Cobros',          Icon: HandCoins },
  { path: '/supplier-payments', label: 'Pagos',           Icon: Wallet },
  { path: '/budget',            label: 'Presupuestos',    Icon: PieChart },
  { path: '/suppliers',         label: 'Proveedores',     Icon: Truck },
  { path: '/users',             label: 'Usuarios',        Icon: UserCog },
]

export default function Layout() {
  const [open, setOpen]   = useState(true)
  const navigate          = useNavigate()
  const { theme, toggleTheme } = useTheme()
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  const isLight = theme === 'light'

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)' }}>

      <aside style={{
        width: open ? 240 : 72,
        transition: 'width 0.3s',
        background: 'var(--bg-surface)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        height: '100vh',
        zIndex: 100,
        overflow: 'hidden',
      }}>

        {/* Logo */}
        <div style={{ padding: '24px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12, flexShrink: 0,
            background: 'linear-gradient(135deg, var(--gold), var(--gold-light))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 900, color: '#09090f', fontSize: 18,
          }}>H</div>
          {open && (
            <div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, fontWeight: 900, color: 'var(--gold-light)' }}>Haus-CRM</div>
              <div style={{ fontSize: 10, color: 'var(--text-label)', letterSpacing: 2, textTransform: 'uppercase' }}>Producción</div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav style={{ padding: '16px 8px', flex: 1, overflowY: 'auto' }}>
          {tabs.map(({ path, label, Icon }) => (
            <NavLink key={path} to={path} style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '11px 12px', borderRadius: 10, marginBottom: 4,
              color: isActive ? 'var(--gold-light)' : 'var(--text-muted)',
              background: isActive ? 'var(--gold-bg)' : 'transparent',
              borderLeft: isActive ? '2px solid var(--gold)' : '2px solid transparent',
              transition: 'all 0.2s',
              textDecoration: 'none',
            })}>
              <Icon size={18} strokeWidth={1.75} style={{ flexShrink: 0 }} />
              {open && <span style={{ fontSize: 13, fontWeight: 500 }}>{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div style={{ padding: 12, borderTop: '1px solid var(--border)' }}>
          {open && (
            <div style={{ fontSize: 12, color: 'var(--text-label)', marginBottom: 8, padding: '0 4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user.name || 'Usuario'}
            </div>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handleLogout}
              title="Cerrar sesión"
              style={{
                flex: open ? 1 : 0,
                padding: '9px 12px', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8,
                background: 'rgba(239,68,68,0.06)', color: '#ef4444',
                fontSize: 12, cursor: 'pointer', display: 'flex',
                alignItems: 'center', justifyContent: 'center', gap: 6,
                whiteSpace: 'nowrap',
              }}
            >
              <LogOut size={14} />
              {open && 'Salir'}
            </button>

            {/* Toggle tema */}
            <button
              onClick={toggleTheme}
              title={isLight ? 'Modo oscuro' : 'Modo claro'}
              style={{
                padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 8,
                background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s',
              }}
            >
              {isLight ? <Moon size={15} /> : <Sun size={15} />}
            </button>

            {/* Toggle sidebar */}
            <button
              onClick={() => setOpen(!open)}
              style={{
                padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 8,
                background: 'transparent', color: 'var(--text-faint)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              {open ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
            </button>
          </div>
        </div>

      </aside>

      <main style={{
        marginLeft: open ? 240 : 72,
        transition: 'margin-left 0.3s',
        flex: 1,
        padding: '32px',
        background: 'var(--bg-base)',
        minHeight: '100vh',
      }}>
        <Outlet />
      </main>

    </div>
  )
}