import { NavLink, Outlet } from 'react-router-dom'
import { useState } from 'react'

const tabs = [
  { path: '/dashboard',  label: 'Dashboard',     icon: '◈' },
  { path: '/clients',    label: 'Clientes',       icon: '◉' },
  { path: '/events',     label: 'Eventos',        icon: '◆' },
  { path: '/quotes',     label: 'Cotizaciones',   icon: '◇' },
  { path: '/budget',     label: 'Presupuestos',   icon: '◻' },
  { path: '/suppliers',  label: 'Proveedores',    icon: '◎' },
]

export default function Layout() {
  const [open, setOpen] = useState(true)

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>

      {/* Sidebar */}
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

        {/* Logo */}
        <div style={{ padding: '24px 16px', borderBottom: '1px solid #1e1e30', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12, flexShrink: 0,
            background: 'linear-gradient(135deg, #c9a84c, #e8c97a)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 900, color: '#09090f', fontSize: 18,
          }}>E</div>
          {open && (
            <div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, fontWeight: 900, color: '#e8c97a' }}>EventCRM</div>
              <div style={{ fontSize: 10, color: '#4a4a6a', letterSpacing: 2, textTransform: 'uppercase' }}>Producción</div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav style={{ padding: '16px 8px', flex: 1 }}>
          {tabs.map(tab => (
            <NavLink key={tab.path} to={tab.path} style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '11px 12px', borderRadius: 10, marginBottom: 4,
              color: isActive ? '#e8c97a' : '#5a5a7a',
              background: isActive ? 'rgba(201,168,76,0.12)' : 'transparent',
              borderLeft: isActive ? '2px solid #c9a84c' : '2px solid transparent',
              transition: 'all 0.2s',
            })}>
              <span style={{ fontSize: 18, width: 24, textAlign: 'center', flexShrink: 0 }}>{tab.icon}</span>
              {open && <span style={{ fontSize: 13, fontWeight: 500 }}>{tab.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Toggle */}
        <div style={{ padding: 12 }}>
          <button onClick={() => setOpen(!open)} style={{
            width: '100%', padding: 10,
            border: '1px solid #1e1e30', borderRadius: 8,
            background: 'transparent', color: '#3a3a5a', cursor: 'pointer',
          }}>
            {open ? '◀' : '▶'}
          </button>
        </div>

      </aside>

      {/* Contenido principal */}
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