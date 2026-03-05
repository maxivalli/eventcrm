import { NavLink, Outlet } from 'react-router-dom'
import { useState } from 'react'
import {
  LayoutDashboard, Users, CalendarDays, FileText,
  HandCoins, Wallet, PieChart, Truck, ChevronLeft, ChevronRight
} from 'lucide-react'

const tabs = [
  { path: '/dashboard',         label: 'Dashboard',      Icon: LayoutDashboard },
  { path: '/clients',           label: 'Clientes',        Icon: Users },
  { path: '/events',            label: 'Eventos',         Icon: CalendarDays },
  { path: '/quotes',            label: 'Cotizaciones',    Icon: FileText },
  { path: '/payments',          label: 'Cobros',          Icon: HandCoins },
  { path: '/supplier-payments', label: 'Pagos',           Icon: Wallet },
  { path: '/budget',            label: 'Presupuestos',    Icon: PieChart },
  { path: '/suppliers',         label: 'Proveedores',     Icon: Truck },
]

export default function Layout() {
  const [open, setOpen] = useState(true)

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>

      <aside style={{
        width: open ? 240 : 72,
        transition: 'width 0.3s',
        background: '#12121e',
        borderRight: '1px solid #1e1e30',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        height: '100vh',
        zIndex: 100,
        overflow: 'hidden',
      }}>

        <div style={{ padding: '24px 16px', borderBottom: '1px solid #1e1e30', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12, flexShrink: 0,
            background: 'linear-gradient(135deg, #c9a84c, #e8c97a)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 900, color: '#09090f', fontSize: 18,
          }}>H</div>
          {open && (
            <div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, fontWeight: 900, color: '#e8c97a' }}>Haus-CRM</div>
              <div style={{ fontSize: 10, color: '#4a4a6a', letterSpacing: 2, textTransform: 'uppercase' }}>Producción</div>
            </div>
          )}
        </div>

        <nav style={{ padding: '16px 8px', flex: 1 }}>
          {tabs.map(({ path, label, Icon }) => (
            <NavLink key={path} to={path} style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '11px 12px', borderRadius: 10, marginBottom: 4,
              color: isActive ? '#e8c97a' : '#5a5a7a',
              background: isActive ? 'rgba(201,168,76,0.12)' : 'transparent',
              borderLeft: isActive ? '2px solid #c9a84c' : '2px solid transparent',
              transition: 'all 0.2s',
              textDecoration: 'none',
            })}>
              <Icon size={18} strokeWidth={1.75} style={{ flexShrink: 0 }} />
              {open && <span style={{ fontSize: 13, fontWeight: 500 }}>{label}</span>}
            </NavLink>
          ))}
        </nav>

        <div style={{ padding: 12 }}>
          <button onClick={() => setOpen(!open)} style={{
            width: '100%', padding: 10,
            border: '1px solid #1e1e30', borderRadius: 8,
            background: 'transparent', color: '#3a3a5a', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {open ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </button>
        </div>

      </aside>

      <main style={{
        marginLeft: open ? 240 : 72,
        transition: 'margin-left 0.3s',
        flex: 1,
        padding: '32px',
      }}>
        <Outlet />
      </main>

    </div>
  )
}