import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'

const fmt = (n) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n || 0)

const fmtDate = (str) =>
  new Date(str).toLocaleDateString('es-AR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })

const statusInfo = {
  Propuesta:  { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: 'rgba(245,158,11,0.3)', label: 'En propuesta' },
  Confirmado: { bg: 'rgba(34,197,94,0.12)',  color: '#22c55e', border: 'rgba(34,197,94,0.3)',  label: 'Confirmado' },
  Finalizado: { bg: 'rgba(139,92,246,0.12)', color: '#8b5cf6', border: 'rgba(139,92,246,0.3)', label: 'Finalizado' },
}

const categoriaColors = {
  Preparación:    '#3b82f6',
  Recepción:      '#22c55e',
  Gastronomía:    '#f59e0b',
  Entretenimiento:'#ec4899',
  Protocolo:      '#8b5cf6',
  Cierre:         '#6b7280',
}

const serviceIcons = {
  General:     '⚡',
  Catering:    '🍽️',
  Audiovisual: '🎵',
  Decoración:  '✨',
  Otros:       '📋',
}

const SECCION_ORDER = ['Entrada', 'Plato principal', 'Guarnición', 'Bebidas', 'Postre', 'Trasnoche', 'Otros']

function Countdown({ date, time, status }) {
  const [diff, setDiff] = useState(null)

  useEffect(() => {
    const calc = () => {
      const target = new Date(date)
      if (time) {
        const [h, m] = time.split(':')
        target.setHours(Number(h), Number(m), 0, 0)
      } else {
        target.setHours(20, 0, 0, 0)
      }
      const ms = target - new Date()
      if (ms <= 0) return setDiff({ past: true })
      setDiff({
        days:    Math.floor(ms / 86400000),
        hours:   Math.floor((ms % 86400000) / 3600000),
        minutes: Math.floor((ms % 3600000) / 60000),
        seconds: Math.floor((ms % 60000) / 1000),
        past: false,
      })
    }
    calc()
    const t = setInterval(calc, 1000)
    return () => clearInterval(t)
  }, [date, time])

  if (status === 'Finalizado' || !diff) return null

  if (diff.past) return (
    <div style={{ textAlign: 'center', padding: '28px 0', borderBottom: '1px solid #1A1A28' }}>
      <div style={{ fontSize: 12, color: '#606078', letterSpacing: 2, textTransform: 'uppercase' }}>El evento ya tuvo lugar</div>
    </div>
  )

  return (
    <div style={{ borderBottom: '1px solid #1A1A28', padding: '32px 24px' }}>
      <div style={{ fontSize: 10, color: '#606078', textTransform: 'uppercase', letterSpacing: 2, textAlign: 'center', marginBottom: 20 }}>
        Tiempo para el evento
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, maxWidth: 380, margin: '0 auto' }}>
        {[
          { v: diff.days,    l: diff.days === 1 ? 'día' : 'días' },
          { v: diff.hours,   l: diff.hours === 1 ? 'hora' : 'horas' },
          { v: diff.minutes, l: 'min' },
          { v: diff.seconds, l: 'seg' },
        ].map(({ v, l }) => (
          <div key={l} style={{ textAlign: 'center', background: '#12121A', border: '1px solid #1A1A28', borderRadius: 12, padding: '16px 8px' }}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 30, fontWeight: 900, color: '#C9A84C', lineHeight: 1 }}>
              {String(v).padStart(2, '0')}
            </div>
            <div style={{ fontSize: 10, color: '#606078', marginTop: 6, textTransform: 'uppercase', letterSpacing: 1 }}>{l}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Section({ title, icon, children }) {
  return (
    <div style={{ padding: '32px 24px', borderBottom: '1px solid #1A1A28' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        {icon && <span style={{ fontSize: 15 }}>{icon}</span>}
        <span style={{ fontSize: 11, color: '#606078', textTransform: 'uppercase', letterSpacing: 2, fontWeight: 700 }}>{title}</span>
      </div>
      {children}
    </div>
  )
}

export default function ClientPortal() {
  const { token } = useParams()
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  useEffect(() => {
    axios.get(`${API}/api/portal/${token}`)
      .then(res => setData(res.data))
      .catch(() => setError('Este portal no existe o el link no es válido.'))
      .finally(() => setLoading(false))
  }, [token])

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#09090F', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontSize: 11, color: '#606078', letterSpacing: 3, textTransform: 'uppercase' }}>Cargando...</div>
    </div>
  )

  if (error) return (
    <div style={{ minHeight: '100vh', background: '#09090F', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontSize: 32, color: '#2A2A3A' }}>✕</div>
      <div style={{ fontSize: 14, color: '#606078' }}>{error}</div>
    </div>
  )

  const { event, payments, menuSections, schedule, services, finance } = data
  const sc = statusInfo[event.status] || statusInfo.Propuesta

  const sortedSections = [...menuSections].sort((a, b) => {
    const ia = SECCION_ORDER.indexOf(a.nombre), ib = SECCION_ORDER.indexOf(b.nombre)
    if (ia === -1 && ib === -1) return 0
    if (ia === -1) return 1; if (ib === -1) return -1
    return ia - ib
  })

  return (
    <div style={{ minHeight: '100vh', background: '#09090F', fontFamily: "'DM Sans', sans-serif", color: '#E8E8F0' }}>

      {/* Header */}
      <div style={{ borderBottom: '1px solid #1A1A28', padding: '18px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: '#C9A84C', letterSpacing: 1 }}>Haus</div>
        <div style={{ fontSize: 10, color: '#606078', letterSpacing: 2, textTransform: 'uppercase' }}>Portal del cliente</div>
      </div>

      <div style={{ maxWidth: 640, margin: '0 auto' }}>

        {/* Hero */}
        <div style={{ padding: '48px 24px 32px', borderBottom: '1px solid #1A1A28' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 14px', borderRadius: 20, marginBottom: 20, background: sc.bg, border: `1px solid ${sc.border}` }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: sc.color }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: sc.color, letterSpacing: 1, textTransform: 'uppercase' }}>{sc.label}</span>
          </div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 34, fontWeight: 900, lineHeight: 1.15, marginBottom: 12 }}>
            {event.name}
          </div>
          <div style={{ fontSize: 14, color: '#A0A0B8' }}>
            Hola <strong style={{ color: '#E8E8F0' }}>{event.clientName}</strong>, este es el seguimiento en tiempo real de tu evento.
          </div>
        </div>

        {/* Cuenta regresiva */}
        <Countdown date={event.date} time={event.time} status={event.status} />

        {/* Datos del evento */}
        <Section title="Detalles del evento" icon="📍">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              { label: 'Fecha', value: fmtDate(event.date) },
              { label: 'Hora', value: event.time || 'A confirmar' },
              { label: 'Venue', value: event.venue },
              { label: 'Tipo', value: event.type },
              { label: 'Invitados', value: `${event.guests} personas`, full: true },
            ].map(({ label, value, full }, i) => (
              <div key={i} style={{ background: '#12121A', border: '1px solid #1A1A28', borderRadius: 10, padding: '14px 16px', gridColumn: full ? '1/-1' : undefined }}>
                <div style={{ fontSize: 10, color: '#606078', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 5 }}>{label}</div>
                <div style={{ fontSize: 14, color: '#E8E8F0', fontWeight: 500 }}>{value}</div>
              </div>
            ))}
          </div>
        </Section>

        {/* Servicios contratados */}
        {services && services.length > 0 && (
          <Section title="Servicios contratados" icon="✅">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {services.map((s, i) => {
                const isCatering = s.kind === 'Catering'
                const cateringBase = isCatering && s.covers && s.pricePerCover ? s.covers * s.pricePerCover : 0
                return (
                  <div key={i} style={{ background: '#12121A', border: '1px solid #1A1A28', borderRadius: 10, overflow: 'hidden' }}>
                    {/* Header del servicio */}
                    <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1A1A28' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 18 }}>{serviceIcons[s.kind] || '📋'}</span>
                        <span style={{ fontSize: 14, fontWeight: 600, color: '#E8E8F0' }}>{s.kind}</span>
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#C9A84C' }}>{fmt(s.total)}</span>
                    </div>

                    {/* Línea base catering: precio por cubierto */}
                    {isCatering && s.covers && s.pricePerCover && (
                      <div style={{ padding: '10px 16px', borderBottom: s.items.length > 0 ? '1px solid #1A1A28' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <span style={{ fontSize: 13, color: '#A0A0B8' }}>Servicio de catering</span>
                          <span style={{ fontSize: 11, color: '#606078', marginLeft: 8 }}>{s.covers} cubiertos × {fmt(s.pricePerCover)}</span>
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#E8E8F0' }}>{fmt(cateringBase)}</span>
                      </div>
                    )}

                    {/* Ítems (extras para catering, servicios para general) */}
                    {s.items.map((item, j) => (
                      <div key={j} style={{ padding: '10px 16px', borderBottom: j < s.items.length - 1 ? '1px solid #1A1A28' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <span style={{ fontSize: 13, color: '#A0A0B8' }}>{item.description}</span>
                          {item.quantity > 1 && <span style={{ fontSize: 11, color: '#606078', marginLeft: 8 }}>x{item.quantity}</span>}
                        </div>
                        <span style={{ fontSize: 13, color: '#E8E8F0' }}>{fmt(item.unitPrice * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          </Section>
        )}

        {/* Menú */}
        {sortedSections.length > 0 && (
          <Section title="Menú del evento" icon="🍽️">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {sortedSections.map(sec => (
                <div key={sec.id} style={{ background: '#12121A', border: '1px solid #1A1A28', borderRadius: 10, overflow: 'hidden' }}>
                  <div style={{ padding: '10px 16px', borderBottom: sec.items.length > 0 ? '1px solid #1A1A28' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#C9A84C', textTransform: 'uppercase', letterSpacing: 1 }}>{sec.nombre}</span>
                    <span style={{ fontSize: 11, color: '#606078' }}>{sec.items.length} plato{sec.items.length !== 1 ? 's' : ''}</span>
                  </div>
                  {sec.items.map((item, i) => (
                    <div key={item.id} style={{ padding: '11px 16px', borderBottom: i < sec.items.length - 1 ? '1px solid #1A1A28' : 'none' }}>
                      <div style={{ fontSize: 14, color: '#E8E8F0', fontWeight: 500 }}>{item.dish.name}</div>
                      {item.dish.descripcion && (
                        <div style={{ fontSize: 12, color: '#606078', marginTop: 3, fontStyle: 'italic' }}>{item.dish.descripcion}</div>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Cronograma */}
        {schedule && schedule.length > 0 && (
          <Section title="Cronograma del evento" icon="🕐">
            <div style={{ position: 'relative', paddingLeft: 8 }}>
              <div style={{ position: 'absolute', left: 46, top: 6, bottom: 6, width: 1, background: '#1A1A28' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                {schedule.map((item, i) => {
                  const color = categoriaColors[item.categoria] || '#606078'
                  return (
                    <div key={item.id} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                      <div style={{ width: 44, flexShrink: 0, textAlign: 'right', paddingTop: 2 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#606078', fontVariantNumeric: 'tabular-nums' }}>{item.hora}</span>
                      </div>
                      <div style={{ flexShrink: 0, width: 10, height: 10, borderRadius: '50%', background: color, border: '2px solid #09090F', marginTop: 4, position: 'relative', zIndex: 1 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#E8E8F0', marginBottom: 2 }}>{item.titulo}</div>
                        {item.descripcion && (
                          <div style={{ fontSize: 12, color: '#606078', lineHeight: 1.5, marginBottom: 4 }}>{item.descripcion}</div>
                        )}
                        <div style={{ display: 'inline-block', fontSize: 10, padding: '2px 8px', borderRadius: 20, background: `${color}18`, color, fontWeight: 600, letterSpacing: 0.5 }}>
                          {item.categoria}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </Section>
        )}

        {/* Estado de cuenta */}
        <Section title="Estado de cuenta" icon="💳">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 8, background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.15)', marginBottom: 10 }}>
            <span style={{ fontSize: 14 }}>🔒</span>
            <span style={{ fontSize: 11, color: '#A0906A' }}>Esta información es confidencial y está destinada exclusivamente a vos.</span>
          </div>
          <div style={{ background: '#12121A', border: '1px solid #1A1A28', borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ padding: '16px 16px 12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 12, color: '#606078' }}>Progreso de pago</span>
                <span style={{ fontSize: 12, color: '#22c55e', fontWeight: 600 }}>
                  {fmt(finance.totalPaid)} de {fmt(finance.totalQuotes)}
                </span>
              </div>
              <div style={{ background: '#1A1A28', borderRadius: 99, height: 6, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 99,
                  background: 'linear-gradient(90deg, #22c55e, #16a34a)',
                  width: `${finance.totalQuotes > 0 ? Math.min((finance.totalPaid / finance.totalQuotes) * 100, 100) : 0}%`,
                  transition: 'width 1.2s ease',
                }} />
              </div>
            </div>
            <div style={{ borderTop: '1px solid #1A1A28' }}>
              {payments.length === 0
                ? <div style={{ padding: '14px 16px', fontSize: 13, color: '#606078' }}>Sin pagos registrados aún.</div>
                : payments.map((p, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: i < payments.length - 1 ? '1px solid #1A1A28' : 'none' }}>
                    <div>
                      <div style={{ fontSize: 13, color: '#E8E8F0' }}>{p.note || 'Pago recibido'}</div>
                      <div style={{ fontSize: 11, color: '#606078', marginTop: 2 }}>
                        {new Date(p.date).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </div>
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#22c55e' }}>{fmt(p.amount)}</span>
                  </div>
                ))
              }
            </div>
            <div style={{ borderTop: '1px solid #1A1A28', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: '#A0A0B8', fontWeight: 600 }}>Saldo pendiente</span>
              <span style={{ fontSize: 20, fontWeight: 800, color: finance.balance > 0 ? '#ef4444' : '#22c55e' }}>
                {fmt(finance.balance)}
              </span>
            </div>
          </div>
        </Section>

        {/* Contacto */}
        <Section title="Contacto" icon="📞">
          <div style={{ background: '#12121A', border: '1px solid #1A1A28', borderRadius: 10, overflow: 'hidden' }}>
            {[
              { label: 'WhatsApp', value: '+54 9 11 0000-0000', href: 'https://wa.me/5491100000000' },
              { label: 'Email',    value: 'hola@haus.com.ar',   href: 'mailto:hola@haus.com.ar' },
              { label: 'Instagram',value: '@haus.eventos',      href: 'https://instagram.com/haus.eventos' },
            ].map(({ label, value, href }, i, arr) => (
              <a key={label} href={href} target="_blank" rel="noreferrer"
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderBottom: i < arr.length - 1 ? '1px solid #1A1A28' : 'none', textDecoration: 'none' }}>
                <span style={{ fontSize: 12, color: '#606078' }}>{label}</span>
                <span style={{ fontSize: 13, color: '#C9A84C', fontWeight: 500 }}>{value}</span>
              </a>
            ))}
          </div>
        </Section>

        {/* Footer */}
        <div style={{ padding: '40px 24px', textAlign: 'center' }}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, color: '#C9A84C', marginBottom: 6 }}>Haus</div>
          <div style={{ fontSize: 12, color: '#606078' }}>Organización y producción de eventos</div>
        </div>

      </div>
    </div>
  )
}