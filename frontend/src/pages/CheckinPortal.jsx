import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'

const fmtDate = (str) =>
  new Date(str).toLocaleDateString('es-AR', { weekday: 'long', day: '2-digit', month: 'long' })

export default function CheckinPortal() {
  const { token } = useParams()
  const [data, setData]       = useState(null)   // { event, guests }
  const [guests, setGuests]   = useState([])
  const [search, setSearch]   = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const [toggling, setToggling] = useState(null)  // id del guest en proceso
  const searchRef = useRef(null)

  useEffect(() => {
    axios.get(`${API}/api/checkin/${token}`)
      .then(res => {
        setData(res.data)
        setGuests(res.data.guests)
      })
      .catch(() => setError('Link inválido o expirado.'))
      .finally(() => setLoading(false))
  }, [token])

  const handleToggleIngreso = async (guest) => {
    if (toggling) return
    setToggling(guest.id)
    try {
      const res = await axios.patch(`${API}/api/checkin/${token}/guests/${guest.id}/ingreso`)
      setGuests(prev => prev.map(g => g.id === guest.id ? res.data : g))
    } catch { /* silencioso */ }
    finally { setToggling(null) }
  }

  const filtered = guests.filter(g =>
    g.name.toLowerCase().includes(search.toLowerCase())
  )

  const total     = guests.length
  const pagados   = guests.filter(g => g.pagado).length
  const ingresaron = guests.filter(g => g.ingreso).length
  const pendientes = guests.filter(g => !g.ingreso).length

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0d0d14', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#5a5a7a', fontSize: 14 }}>Cargando...</div>
    </div>
  )

  if (error) return (
    <div style={{ minHeight: '100vh', background: '#0d0d14', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
        <div style={{ color: '#ef4444', fontSize: 15, fontWeight: 600 }}>{error}</div>
      </div>
    </div>
  )

  const { event } = data

  return (
    <div style={{ minHeight: '100vh', background: '#0d0d14', fontFamily: "'DM Sans', sans-serif", display: 'flex', flexDirection: 'column', maxWidth: 520, margin: '0 auto' }}>

      {/* Header del evento */}
      <div style={{ padding: '20px 20px 16px', background: '#13131f', borderBottom: '1px solid #1e1e2e' }}>
        <div style={{ fontSize: 10, color: '#c9a84c', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 6, fontWeight: 700 }}>
          Check-in · Haus
        </div>
        <div style={{ fontSize: 20, fontWeight: 700, color: '#e8e8f0', lineHeight: 1.2, marginBottom: 4 }}>
          {event.name}
        </div>
        <div style={{ fontSize: 13, color: '#5a5a7a' }}>
          {fmtDate(event.date)}{event.time ? ` · ${event.time}` : ''} · {event.venue}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, background: '#1e1e2e', borderBottom: '1px solid #1e1e2e' }}>
        {[
          { label: 'Total',     value: total,      color: '#c9a84c' },
          { label: 'Pagaron',   value: pagados,    color: '#22c55e' },
          { label: 'Ingresaron', value: ingresaron, color: '#3b82f6' },
          { label: 'Pendientes', value: pendientes, color: '#f59e0b' },
        ].map(s => (
          <div key={s.label} style={{ background: '#0d0d14', padding: '14px 8px', textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 9, color: '#3a3a5a', marginTop: 4, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Buscador */}
      <div style={{ padding: '12px 16px', background: '#0d0d14', borderBottom: '1px solid #1e1e2e', flexShrink: 0 }}>
        <input
          ref={searchRef}
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar invitado..."
          autoComplete="off"
          style={{
            width: '100%', boxSizing: 'border-box',
            background: '#13131f', border: '1px solid #2a2a3e',
            borderRadius: 10, padding: '11px 14px',
            color: '#e8e8f0', fontSize: 15, outline: 'none',
          }}
        />
      </div>

      {/* Lista de invitados */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: '#3a3a5a', fontSize: 14 }}>
            {search ? 'Sin resultados' : 'Sin invitados cargados'}
          </div>
        ) : filtered.map(g => {
          const isToggling = toggling === g.id
          return (
            <button
              key={g.id}
              onClick={() => handleToggleIngreso(g)}
              disabled={isToggling}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 14,
                padding: '14px 16px', border: 'none', borderBottom: '1px solid #1a1a28',
                background: g.ingreso ? 'rgba(59,130,246,0.07)' : '#0d0d14',
                cursor: isToggling ? 'wait' : 'pointer', textAlign: 'left',
                transition: 'background 0.15s',
              }}
            >
              {/* Indicador ingreso */}
              <div style={{
                width: 36, height: 36, borderRadius: 99, flexShrink: 0,
                background: g.ingreso ? 'rgba(59,130,246,0.2)' : '#13131f',
                border: `2px solid ${g.ingreso ? '#3b82f6' : '#2a2a3e'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, transition: 'all 0.15s',
              }}>
                {isToggling ? '…' : g.ingreso ? '✓' : ''}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: g.ingreso ? '#a0b4d0' : '#e8e8f0', lineHeight: 1.2 }}>
                  {g.name}
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 10, color: g.tipo === 'Menor' ? '#8b5cf6' : '#3a3a5a', background: g.tipo === 'Menor' ? 'rgba(139,92,246,0.15)' : '#13131f', border: `1px solid ${g.tipo === 'Menor' ? 'rgba(139,92,246,0.3)' : '#2a2a3e'}`, borderRadius: 20, padding: '1px 7px', fontWeight: 700 }}>
                    {g.tipo}
                  </span>
                  {g.pagado ? (
                    <span style={{ fontSize: 10, color: '#22c55e', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 20, padding: '1px 7px', fontWeight: 700 }}>Pagó</span>
                  ) : (
                    <span style={{ fontSize: 10, color: '#f59e0b', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 20, padding: '1px 7px', fontWeight: 700 }}>Sin pagar</span>
                  )}
                </div>
              </div>

              {/* Estado ingreso */}
              <div style={{ fontSize: 11, fontWeight: 700, color: g.ingreso ? '#3b82f6' : '#2a2a3e', flexShrink: 0 }}>
                {g.ingreso ? 'Ingresó' : 'Tap p/ ingresar'}
              </div>
            </button>
          )
        })}
      </div>

      {/* Footer */}
      <div style={{ padding: '10px 16px', background: '#0a0a10', borderTop: '1px solid #1a1a28', textAlign: 'center' }}>
        <span style={{ fontSize: 10, color: '#2a2a3e', letterSpacing: 1, textTransform: 'uppercase' }}>Haus · Producción de Eventos</span>
      </div>
    </div>
  )
}
