import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'
import { Search, Check, X, Users, CalendarDays, MapPin, Clock, CreditCard } from 'lucide-react'

const API = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/$/, '')

const fmtDate = (str) =>
  new Date(str).toLocaleDateString('es-AR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })

const col = {
  bg:          '#09090F',
  surface:     '#12121A',
  border:      '#1A1A28',
  border2:     '#22223A',
  gold:        '#C9A84C',
  goldLight:   '#E8C97A',
  text:        '#E8E8F0',
  muted:       '#A0A0B8',
  faint:       '#606078',
  green:       '#22c55e',
  greenBg:     'rgba(34,197,94,0.1)',
  greenBorder: 'rgba(34,197,94,0.25)',
  red:         '#ef4444',
  redBg:       'rgba(239,68,68,0.1)',
  redBorder:   'rgba(239,68,68,0.25)',
  purple:      '#8b5cf6',
  purpleBg:    'rgba(139,92,246,0.12)',
}

export default function CheckinPortal() {
  const { token } = useParams()
  const [event, setEvent]   = useState(null)
  const [guests, setGuests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState(null)
  const [search, setSearch] = useState('')
  const [toggling, setToggling] = useState(null)   // guestId being toggled ingreso
  const [togglingPago, setTogglingPago] = useState(null) // guestId being toggled pagado
  const [filter, setFilter] = useState('todos') // todos | pendiente | ingresó

  useEffect(() => {
    axios.get(`${API}/api/checkin/${token}`)
      .then(res => { setEvent(res.data.event); setGuests(res.data.guests) })
      .catch(() => setError('Este link no es válido o ya no está disponible.'))
      .finally(() => setLoading(false))
  }, [token])

  const togglePago = async (guest) => {
    setTogglingPago(guest.id)
    try {
      const res = await axios.patch(`${API}/api/checkin/${token}/guests/${guest.id}/pagado`)
      setGuests(prev => prev.map(g => g.id === guest.id ? { ...g, ...res.data } : g))
    } catch {
      // silently fail
    } finally {
      setTogglingPago(null)
    }
  }

  const toggleIngreso = async (guest) => {
    setToggling(guest.id)
    try {
      const res = await axios.patch(`${API}/api/checkin/${token}/guests/${guest.id}/ingreso`)
      setGuests(prev => prev.map(g => g.id === guest.id ? { ...g, ingreso: res.data.ingreso } : g))
    } catch {
      // silently fail
    } finally {
      setToggling(null)
    }
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: col.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontSize: 14, color: col.faint }}>Cargando...</div>
    </div>
  )

  if (error) return (
    <div style={{ minHeight: '100vh', background: col.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 16 }}>🔒</div>
        <div style={{ fontSize: 16, color: col.text, fontWeight: 600, marginBottom: 8 }}>Link inválido</div>
        <div style={{ fontSize: 13, color: col.faint }}>{error}</div>
      </div>
    </div>
  )

  const ingresaron  = guests.filter(g => g.ingreso)
  const total       = guests.length
  const pct         = total > 0 ? Math.round((ingresaron.length / total) * 100) : 0

  const filtered = guests.filter(g => {
    const matchSearch = !search || g.name.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'todos' || (filter === 'ingresó' ? g.ingreso : !g.ingreso)
    return matchSearch && matchFilter
  })

  return (
    <div style={{ minHeight: '100vh', background: col.bg, fontFamily: "'DM Sans', sans-serif", color: col.text }}>

      {/* Header */}
      <div style={{ background: col.surface, borderBottom: `1px solid ${col.border}`, padding: '20px 24px' }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: `linear-gradient(135deg, ${col.gold}, ${col.goldLight})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, fontWeight: 900, color: col.bg, flexShrink: 0,
            }}>H</div>
            <div>
              <div style={{ fontSize: 11, color: col.faint, textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 600 }}>Portal portero</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: col.text, lineHeight: 1.2 }}>{event.name}</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 12, color: col.muted }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <CalendarDays size={13} color={col.gold} />
              {fmtDate(event.date)}
            </div>
            {event.time && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <Clock size={13} color={col.gold} />
                {event.time}
              </div>
            )}
            {event.venue && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <MapPin size={13} color={col.gold} />
                {event.venue}
              </div>
            )}
            {event.ticketPrice && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <CreditCard size={13} color={col.gold} />
                <span style={{ color: col.text, fontWeight: 600 }}>
                  {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(event.ticketPrice)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '24px 24px 80px' }}>

        {/* Contador de ingreso */}
        <div style={{
          background: col.surface, border: `1px solid ${col.border2}`,
          borderRadius: 16, padding: '20px 24px', marginBottom: 20,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Users size={16} color={col.gold} />
              <span style={{ fontSize: 13, fontWeight: 600, color: col.text }}>Ingresaron</span>
            </div>
            <div style={{ fontSize: 22, fontWeight: 900, color: col.green }}>
              {ingresaron.length}<span style={{ fontSize: 14, color: col.faint, fontWeight: 500 }}>/{total}</span>
            </div>
          </div>
          <div style={{ height: 8, background: col.border2, borderRadius: 99, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 99,
              background: `linear-gradient(90deg, ${col.green}, #16a34a)`,
              width: `${pct}%`, transition: 'width 0.6s ease',
            }} />
          </div>
          <div style={{ fontSize: 11, color: col.faint, marginTop: 6, textAlign: 'right' }}>{pct}% del total</div>
        </div>

        {/* Búsqueda y filtros */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: col.faint }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar invitado..."
              style={{
                width: '100%', background: col.surface, border: `1px solid ${col.border2}`,
                borderRadius: 10, padding: '10px 12px 10px 36px',
                color: col.text, fontSize: 14, outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {[
              { key: 'todos',    label: `Todos (${total})` },
              { key: 'pendiente', label: `Pendiente (${total - ingresaron.length})` },
              { key: 'ingresó',  label: `Ingresó (${ingresaron.length})` },
            ].map(f => (
              <button key={f.key} onClick={() => setFilter(f.key)} style={{
                padding: '9px 14px', borderRadius: 10, fontSize: 12, fontWeight: filter === f.key ? 700 : 500,
                cursor: 'pointer', transition: 'all 0.15s',
                border: `1px solid ${filter === f.key ? col.gold + '60' : col.border2}`,
                background: filter === f.key ? `rgba(201,168,76,0.1)` : 'transparent',
                color: filter === f.key ? col.gold : col.faint,
              }}>{f.label}</button>
            ))}
          </div>
        </div>

        {/* Lista de invitados */}
        {total === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: col.faint, fontSize: 14 }}>
            No hay invitados cargados para este evento
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: col.faint, fontSize: 13 }}>
            Sin resultados
          </div>
        ) : (
          <div style={{ background: col.surface, border: `1px solid ${col.border2}`, borderRadius: 14, overflow: 'hidden' }}>
            {filtered.map((guest, i) => (
              <div key={guest.id} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '14px 18px',
                borderBottom: i < filtered.length - 1 ? `1px solid ${col.border}` : 'none',
                borderLeft: `3px solid ${guest.ingreso ? col.green : col.border}`,
                background: guest.ingreso ? 'rgba(34,197,94,0.04)' : 'transparent',
                transition: 'background 0.2s',
              }}>
                {/* Estado de ingreso */}
                <div style={{
                  width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: guest.ingreso ? col.greenBg : col.redBg,
                  border: `1px solid ${guest.ingreso ? col.greenBorder : col.redBorder}`,
                }}>
                  {guest.ingreso
                    ? <Check size={15} color={col.green} />
                    : <X size={15} color={col.red} />
                  }
                </div>

                {/* Nombre y badges */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: col.text, marginBottom: 4 }}>{guest.name}</div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <span style={{
                      fontSize: 10, padding: '2px 7px', borderRadius: 20, fontWeight: 700,
                      background: guest.tipo === 'Menor' ? col.purpleBg : 'rgba(201,168,76,0.1)',
                      color: guest.tipo === 'Menor' ? col.purple : col.gold,
                    }}>{guest.tipo}</span>
                    {guest.pagado ? (
                      <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 20, fontWeight: 700, background: col.greenBg, color: col.green, border: `1px solid ${col.greenBorder}` }}>Pagó</span>
                    ) : (
                      <button
                        onClick={() => togglePago(guest)}
                        disabled={togglingPago === guest.id}
                        style={{
                          fontSize: 10, padding: '2px 7px', borderRadius: 20, fontWeight: 700,
                          cursor: togglingPago === guest.id ? 'wait' : 'pointer',
                          border: `1px solid ${guest.pagadoEnPuerta ? col.greenBorder : col.redBorder}`,
                          background: guest.pagadoEnPuerta ? col.greenBg : col.redBg,
                          color: guest.pagadoEnPuerta ? col.green : col.red,
                        }}
                      >{togglingPago === guest.id ? '...' : guest.pagadoEnPuerta ? 'Pagó en puerta' : 'Sin pagar'}</button>
                    )}
                  </div>
                </div>

                {/* Botón toggle */}
                <button
                  onClick={() => toggleIngreso(guest)}
                  disabled={toggling === guest.id}
                  style={{
                    padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                    cursor: toggling === guest.id ? 'wait' : 'pointer',
                    border: `1px solid ${guest.ingreso ? col.redBorder : col.greenBorder}`,
                    background: guest.ingreso ? col.redBg : col.greenBg,
                    color: guest.ingreso ? col.red : col.green,
                    transition: 'all 0.15s', whiteSpace: 'nowrap', flexShrink: 0,
                  }}
                >
                  {toggling === guest.id ? '...' : guest.ingreso ? 'Desmarcar' : 'Ingresó'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
