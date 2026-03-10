import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'
import BudgetPreview from '../components/BudgetPreview'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'

const fmt = (n) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n || 0)

const fmtDate = (str) =>
  new Date(str).toLocaleDateString('es-AR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })

const fmtShortDate = (str) =>
  new Date(str).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })

const SECCION_ORDER = ['Entrada', 'Plato principal', 'Guarnición', 'Bebidas', 'Postre', 'Trasnoche', 'Otros']

const col = {
  bg:          '#09090F',
  surface:     '#12121A',
  border:      '#1A1A28',
  border2:     '#22223A',
  gold:        '#C9A84C',
  goldLight:   '#E8C97A',
  goldBg:      'rgba(201,168,76,0.08)',
  goldBorder:  'rgba(201,168,76,0.2)',
  text:        '#E8E8F0',
  muted:       '#A0A0B8',
  faint:       '#606078',
  green:       '#22c55e',
  greenBg:     'rgba(34,197,94,0.1)',
  greenBorder: 'rgba(34,197,94,0.25)',
  red:         '#ef4444',
  redBg:       'rgba(239,68,68,0.1)',
  redBorder:   'rgba(239,68,68,0.25)',
}


function Countdown({ date, time, status }) {
  const [diff, setDiff] = useState(null)
  useEffect(() => {
    const calc = () => {
      const target = new Date(date)
      if (time) { const [h, m] = time.split(':'); target.setHours(+h, +m, 0, 0) }
      else target.setHours(20, 0, 0, 0)
      const ms = target - new Date()
      if (ms <= 0) return setDiff({ past: true })
      setDiff({ days: Math.floor(ms/86400000), hours: Math.floor((ms%86400000)/3600000), minutes: Math.floor((ms%3600000)/60000), seconds: Math.floor((ms%60000)/1000), past: false })
    }
    calc(); const t = setInterval(calc, 1000); return () => clearInterval(t)
  }, [date, time])
  if (status === 'Finalizado' || !diff) return null
  if (diff.past) return (
    <div style={{ textAlign: 'center', padding: '16px 0', color: col.faint, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase' }}>
      El evento ya tuvo lugar
    </div>
  )
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, maxWidth: 340, margin: '20px 0 0' }}>
      {[
        { v: diff.days, l: diff.days === 1 ? 'día' : 'días' },
        { v: diff.hours, l: 'hs' },
        { v: diff.minutes, l: 'min' },
        { v: diff.seconds, l: 'seg' },
      ].map(({ v, l }) => (
        <div key={l} style={{ textAlign: 'center', background: col.surface, border: `1px solid ${col.border}`, borderRadius: 10, padding: '12px 8px' }}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 900, color: col.gold, lineHeight: 1 }}>
            {String(v).padStart(2, '0')}
          </div>
          <div style={{ fontSize: 9, color: col.faint, marginTop: 4, textTransform: 'uppercase', letterSpacing: 1 }}>{l}</div>
        </div>
      ))}
    </div>
  )
}

function Block({ label, icon, children, accent }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        {icon && <span style={{ fontSize: 15 }}>{icon}</span>}
        <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 2.5, textTransform: 'uppercase', color: accent || col.faint }}>{label}</span>
        <div style={{ flex: 1, height: 1, background: col.border, marginLeft: 4 }} />
      </div>
      {children}
    </div>
  )
}


const SECCION_COLORS_PORTAL = {
  'Entrada': '#3b82f6', 'Plato principal': '#8b5cf6',
  'Guarnición': '#22c55e', 'Bebidas': '#06b6d4',
  'Postre': '#ec4899', 'Trasnoche': '#f97316', 'Otros': '#6b7280',
}

function QuoteCard({ quote, onDecide, deciding, groupHasApproved, isApprovedOne }) {
  const cs = quote.clientStatus
  const cateringBase = quote.kind === 'Catering' ? (quote.covers || 0) * (quote.pricePerCover || 0) : 0
  const extrasTotal  = (quote.items || []).reduce((a, i) => a + i.quantity * i.unitPrice, 0)
  const total        = cateringBase + extrasTotal
  const isApproved   = cs === 'Aprobado'
  const isRejected   = cs === 'Rechazado'
  const dimmed       = groupHasApproved && !isApprovedOne

  // Menú embebido (viene de quote.menus[0].menu)
  const menu = quote.menus?.[0]?.menu || null
  const menuSections = menu?.sections || []

  return (
    <div style={{
      background: isApproved ? 'rgba(34,197,94,0.04)' : isRejected ? 'rgba(239,68,68,0.03)' : col.surface,
      border: `1px solid ${isApproved ? col.greenBorder : isRejected ? col.redBorder : col.border}`,
      borderRadius: 12, overflow: 'hidden',
      opacity: dimmed ? 0.4 : 1,
      transition: 'all 0.3s',
    }}>
      {/* ── Header ── */}
      <div style={{ padding: '14px 18px', borderBottom: `1px solid ${col.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: col.text }}>
            {quote.kind === 'Catering' ? 'Catering' : 'Servicio'}
          </span>
          {quote.kind === 'Catering' && quote.covers && (
            <span style={{ fontSize: 11, color: col.faint, background: col.border, padding: '2px 8px', borderRadius: 20 }}>
              {quote.covers} personas
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {cs && (
            <span style={{
              fontSize: 10, fontWeight: 800, letterSpacing: 0.8, padding: '3px 10px', borderRadius: 20,
              background: isApproved ? col.greenBg : col.redBg,
              color: isApproved ? col.green : col.red,
              border: `1px solid ${isApproved ? col.greenBorder : col.redBorder}`,
            }}>
              {isApproved ? '✓ Confirmado' : '✕ Rechazado'}
            </span>
          )}
          <span style={{ fontSize: 16, fontWeight: 800, color: col.gold }}>{fmt(total)}</span>
        </div>
      </div>

      {/* ── Subtotal cubiertos ── */}
      {quote.kind === 'Catering' && quote.covers && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 18px', borderBottom: `1px solid ${col.border}`, background: col.sunken }}>
          <span style={{ fontSize: 12, color: col.faint }}>Servicio por persona</span>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: 11, color: col.faint, marginRight: 10 }}>{quote.covers} × {fmt(quote.pricePerCover)}</span>
            <span style={{ fontSize: 13, color: col.text, fontWeight: 700 }}>{fmt(cateringBase)}</span>
          </div>
        </div>
      )}

      {/* ── Menú: secciones y platos ── */}
      {menuSections.length > 0 && (
        <div style={{ borderBottom: `1px solid ${col.border}` }}>
          <div style={{ padding: '10px 18px 6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: col.gold, textTransform: 'uppercase', letterSpacing: 1.5 }}>
              {menu.name}
            </span>
            <span style={{ fontSize: 10, color: col.faint }}>
              {menuSections.reduce((a, s) => a + (s.items || []).length, 0)} platos
            </span>
          </div>
          {menuSections.map((section, si) => {
            const c = SECCION_COLORS_PORTAL[section.nombre] || '#6b7280'
            return (
              <div key={section.id} style={{ borderTop: `1px solid ${col.border}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 18px 4px', background: `${c}08` }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: c, flexShrink: 0 }} />
                  <span style={{ fontSize: 10, fontWeight: 800, color: c, textTransform: 'uppercase', letterSpacing: 1 }}>{section.nombre}</span>
                </div>
                {(section.items || []).map((item, i) => (
                  <div key={item.id} style={{ padding: '7px 18px 7px 30px', borderTop: i > 0 ? `1px solid ${col.border}` : 'none' }}>
                    <div style={{ fontSize: 13, color: col.text, fontWeight: 500 }}>{item.dish?.name}</div>
                    {item.dish?.descripcion && (
                      <div style={{ fontSize: 11, color: col.faint, marginTop: 2, fontStyle: 'italic' }}>{item.dish.descripcion}</div>
                    )}
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      )}

      {/* ── Extras ── */}
      {(quote.items || []).length > 0 && (
        <div style={{ borderBottom: `1px solid ${col.border}` }}>
          <div style={{ padding: '10px 18px 6px' }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: col.faint, textTransform: 'uppercase', letterSpacing: 1.5 }}>Extras</span>
          </div>
          {(quote.items || []).map((item, i, arr) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 18px', borderTop: `1px solid ${col.border}` }}>
              <div>
                <span style={{ fontSize: 13, color: col.muted }}>{item.description}</span>
                {item.quantity > 1 && <span style={{ fontSize: 11, color: col.faint, marginLeft: 8 }}>x{item.quantity}</span>}
              </div>
              <span style={{ fontSize: 13, color: col.text, fontWeight: 600 }}>{fmt(item.quantity * item.unitPrice)}</span>
            </div>
          ))}
        </div>
      )}

      {!dimmed && (
        <div style={{ padding: '12px 18px', borderTop: `1px solid ${col.border}`, display: 'flex', gap: 8 }}>
          {!cs && (
            <>
              <button onClick={() => onDecide(quote.id, 'Aprobado')} disabled={deciding} style={{
                flex: 1, padding: '10px 0', borderRadius: 8, border: `1px solid ${col.greenBorder}`,
                background: col.greenBg, color: col.green, fontSize: 13, fontWeight: 700,
                cursor: deciding ? 'wait' : 'pointer', transition: 'all 0.15s',
              }}>
                {deciding ? 'Guardando...' : '✓ Confirmar'}
              </button>
              <button onClick={() => onDecide(quote.id, 'Rechazado')} disabled={deciding} style={{
                padding: '10px 18px', borderRadius: 8, border: `1px solid ${col.border}`,
                background: 'transparent', color: col.faint, fontSize: 13,
                cursor: deciding ? 'wait' : 'pointer',
              }}>
                Rechazar
              </button>
            </>
          )}
          {cs && (
            <button onClick={() => onDecide(quote.id, null)} disabled={deciding} style={{
              padding: '9px 16px', borderRadius: 8, border: `1px solid ${col.border}`,
              background: 'transparent', color: col.faint, fontSize: 12,
              cursor: deciding ? 'wait' : 'pointer',
            }}>
              Cambiar decisión
            </button>
          )}
        </div>
      )}
    </div>
  )
}


export default function ClientPortal() {
  const { token } = useParams()
  const [data, setData]           = useState(null)
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)
  const [deciding, setDeciding]   = useState(null)
  const [activeTab, setActiveTab] = useState('resumen')
  const [chatOpen, setChatOpen]   = useState(false)
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [chatMessages, setChatMessages] = useState([
    { role: 'assistant', text: '¡Hola! Soy el asistente de Haus. Podés preguntarme sobre tu evento, el menú o el estado de cuenta 😊' }
  ])

  useEffect(() => {
    axios.get(`${API}/api/portal/${token}`)
      .then(res => setData(res.data))
      .catch(() => setError('Este portal no existe o el link no es válido.'))
      .finally(() => setLoading(false))
  }, [token])

  const handleDecide = async (quoteId, clientStatus) => {
    setDeciding(quoteId)
    try {
      const res = await axios.patch(`${API}/api/portal/${token}/quotes/${quoteId}/decision`, { clientStatus })
      setData(prev => ({
        ...prev,
        quotes: prev.quotes.map(q => q.id === quoteId
          ? { ...q, clientStatus: res.data.clientStatus, status: res.data.status }
          : q
        ),
      }))
    } catch (e) {
      console.error('Error al registrar decisión:', e)
    } finally {
      setDeciding(null)
    }
  }

  const sendChat = async () => {
    const q = chatInput.trim()
    if (!q || chatLoading) return
    setChatInput('')
    setChatMessages(prev => [...prev, { role: 'user', text: q }])
    setChatLoading(true)
    try {
      const res = await axios.post(`${API}/api/ai/portal-chat`, {
        question: q,
        context: {
          event: data?.event, menu: data?.menuSections, payments: data?.payments,
          finance: data?.finance, services: data?.services,
          dietaryOptions: (() => { try { return typeof data?.event?.dietaryOptions === 'string' ? JSON.parse(data.event.dietaryOptions) : (data?.event?.dietaryOptions || []) } catch { return [] } })()
        },
      })
      setChatMessages(prev => [...prev, { role: 'assistant', text: res.data.answer }])
    } catch {
      setChatMessages(prev => [...prev, { role: 'assistant', text: 'No pude responder eso ahora. Por favor contactá a Haus directamente.' }])
    } finally {
      setChatLoading(false)
    }
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: col.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontSize: 11, color: col.faint, letterSpacing: 3, textTransform: 'uppercase' }}>Cargando...</div>
    </div>
  )
  if (error) return (
    <div style={{ minHeight: '100vh', background: col.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontSize: 32, color: col.border }}>✕</div>
      <div style={{ fontSize: 14, color: col.faint }}>{error}</div>
    </div>
  )

  const { event, payments, menuSections, schedule, finance, quotes } = data

  const statusInfo = {
    Propuesta:  { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: 'rgba(245,158,11,0.3)', label: 'En propuesta' },
    Confirmado: { bg: col.greenBg,             color: col.green,  border: col.greenBorder,        label: 'Confirmado'   },
    Finalizado: { bg: 'rgba(139,92,246,0.12)', color: '#8b5cf6', border: 'rgba(139,92,246,0.3)', label: 'Finalizado'   },
  }
  const sc = statusInfo[event.status] || statusInfo.Propuesta

  // Por grupo (kind): si ya hay una aprobada, mostrar solo esa. Si todo pendiente, mostrar todas.
  const quoteGroups = (quotes || []).reduce((acc, q) => {
    if (!acc[q.kind]) acc[q.kind] = []
    acc[q.kind].push(q)
    return acc
  }, {})

  // Catering: si hay una aprobada mostrar solo esa. General: mostrar todas salvo rechazadas.
  const filteredQuoteGroups = Object.fromEntries(
    Object.entries(quoteGroups).map(([kind, qs]) => {
      if (kind === 'Catering') {
        const approved = qs.find(q => q.clientStatus === 'Aprobado')
        if (approved) return [kind, [approved]]
        return [kind, qs.filter(q => q.clientStatus !== 'Rechazado')]
      }
      // General y cualquier otro tipo: mostrar todas salvo rechazadas
      return [kind, qs.filter(q => q.clientStatus !== 'Rechazado')]
    }).filter(([, qs]) => qs.length > 0)
  )

  const totalPaid     = (payments || []).reduce((a, p) => a + p.amount, 0)
  const approvedTotal = (quotes || []).filter(q => q.clientStatus === 'Aprobado').reduce((a, q) => {
    const items = (q.items||[]).reduce((s, i) => s + i.quantity*i.unitPrice, 0)
    const cat   = q.kind === 'Catering' ? (q.covers||0)*(q.pricePerCover||0) : 0
    return a + items + cat
  }, 0)
  const balance = approvedTotal - totalPaid

  const hasQuotes   = quotes && quotes.length > 0
  const hasSchedule = schedule && schedule.length > 0
  const hasPayments = payments && payments.length > 0
  const hasApproved = (quotes || []).some(q => q.clientStatus === 'Aprobado')


  return (
    <div style={{ minHeight: '100vh', background: col.bg, fontFamily: "'DM Sans', sans-serif", color: col.text }}>
      <style>{`
        @media (max-width: 600px) {
          .portal-wrap { padding: 0 16px 100px !important; }
          .portal-hero-name { font-size: 26px !important; }
          .portal-chat-btn { bottom: 16px !important; right: 16px !important; }
          .portal-chat-win { width: calc(100vw - 32px) !important; right: 16px !important; bottom: 80px !important; }
        }
      `}</style>

      {/* Header */}
      <div style={{ borderBottom: `1px solid ${col.border}`, padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: col.bg, zIndex: 20 }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: col.gold, letterSpacing: 1 }}>Haus</div>
        <div style={{ fontSize: 10, color: col.faint, letterSpacing: 2, textTransform: 'uppercase' }}>Portal del cliente</div>
      </div>

      {/* Tabs — solo si hay presupuesto publicado */}
      {event.budgetPublished && (
        <div style={{ borderBottom: `1px solid ${col.border}`, background: col.bg, position: 'sticky', top: 57, zIndex: 19 }}>
          <div style={{ maxWidth: 680, margin: '0 auto', padding: '0 24px', display: 'flex', gap: 4 }}>
            {[
              { id: 'resumen',      label: 'Mi evento',    icon: '◇' },
              { id: 'presupuesto',  label: 'Presupuesto',  icon: '📄' },
            ].map(tab => {
              const active = activeTab === tab.id
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '14px 16px', background: 'none', border: 'none',
                    borderBottom: active ? `2px solid ${col.gold}` : '2px solid transparent',
                    color: active ? col.gold : col.faint,
                    fontSize: 13, fontWeight: active ? 700 : 500,
                    cursor: 'pointer', transition: 'all 0.15s', marginBottom: -1 }}>
                  <span style={{ fontSize: 14 }}>{tab.icon}</span>
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {(!event.budgetPublished || activeTab === 'resumen') && <div className="portal-wrap" style={{ maxWidth: 680, margin: '0 auto', padding: '0 24px 100px' }}>

        {/* Hero */}
        <div style={{ padding: '36px 0 36px', borderBottom: `1px solid ${col.border}`, marginBottom: 36 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '4px 12px', borderRadius: 20, marginBottom: 16, background: sc.bg, border: `1px solid ${sc.border}` }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: sc.color }} />
            <span style={{ fontSize: 10, fontWeight: 800, color: sc.color, letterSpacing: 1.5, textTransform: 'uppercase' }}>{sc.label}</span>
          </div>
          <div className="portal-hero-name" style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 900, lineHeight: 1.15, marginBottom: 10 }}>
            {event.name}
          </div>
          <div style={{ fontSize: 14, color: col.muted }}>
            Hola <strong style={{ color: col.text }}>{event.clientName}</strong>, acá podés seguir todo el avance de tu evento.
          </div>
          <Countdown date={event.date} time={event.time} status={event.status} />
        </div>

        {/* Info del evento */}
        <Block label="Tu evento" icon="📋">
          <div style={{ background: col.surface, border: `1px solid ${col.border}`, borderRadius: 12, overflow: 'hidden' }}>
            {[
              { label: 'Fecha',     value: fmtDate(event.date) },
              { label: 'Hora',      value: event.time || 'A confirmar' },
              { label: 'Venue',     value: event.venue },
              { label: 'Tipo',      value: event.type },
              { label: 'Invitados', value: `${event.guests} personas` },
            ].map(({ label, value }, i, arr) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '13px 18px', borderBottom: i < arr.length - 1 ? `1px solid ${col.border}` : 'none' }}>
                <span style={{ fontSize: 12, color: col.faint }}>{label}</span>
                <span style={{ fontSize: 13, color: col.text, fontWeight: 500, textAlign: 'right', maxWidth: '65%' }}>{value}</span>
              </div>
            ))}
          </div>
        </Block>

        {/* Cotizaciones agrupadas por tipo */}
        {hasQuotes && Object.entries(filteredQuoteGroups).map(([kind, kindQuotes]) => {
          const kindLabels = { General: 'Servicios', Catering: 'Catering' }
          const kindIcons  = { General: '✦', Catering: '🍽' }

          // Solo catering tiene lógica de "elegí una opción"
          const isCatering      = kind === 'Catering'
          const approvedInGroup = isCatering ? kindQuotes.find(q => q.clientStatus === 'Aprobado') : null
          const pendingInGroup  = isCatering && kindQuotes.every(q => !q.clientStatus)

          const blockLabel = isCatering && kindQuotes.length > 1
            ? `Opciones de Catering`
            : kindLabels[kind] || kind

          return (
            <Block key={kind} label={blockLabel} icon={kindIcons[kind] || '◇'} accent={approvedInGroup ? col.green : col.faint}>
              {isCatering && kindQuotes.length > 1 && pendingInGroup && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: col.goldBg, border: `1px solid ${col.goldBorder}`, borderRadius: 10, padding: '12px 14px', marginBottom: 14 }}>
                  <span style={{ fontSize: 15, flexShrink: 0 }}>💡</span>
                  <p style={{ fontSize: 12, color: col.muted, margin: 0, lineHeight: 1.6 }}>
                    Te enviamos <strong style={{ color: col.text }}>{kindQuotes.length} opciones</strong>. Confirmá la que mejor se adapte a tu evento — una vez que elijas, te preparamos el presupuesto final.
                  </p>
                </div>
              )}
              {isCatering && approvedInGroup && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: col.greenBg, border: `1px solid ${col.greenBorder}`, borderRadius: 10, padding: '10px 14px', marginBottom: 14 }}>
                  <span>✓</span>
                  <span style={{ fontSize: 12, color: col.green, fontWeight: 600 }}>Opción confirmada — ya estamos coordinando los detalles.</span>
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {kindQuotes.map(q => (
                  <QuoteCard key={q.id} quote={q} onDecide={handleDecide} deciding={deciding === q.id}
                    groupHasApproved={isCatering ? !!approvedInGroup : false}
                    isApprovedOne={isCatering ? approvedInGroup?.id === q.id : false}
                  />
                ))}
              </div>
            </Block>
          )
        })}



                {/* Cronograma */}
        {hasSchedule && (
          <Block label="Cronograma" icon="🕐">
            <div style={{ position: 'relative', paddingLeft: 8 }}>
              <div style={{ position: 'absolute', left: 46, top: 6, bottom: 6, width: 1, background: col.border }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                {schedule.map(item => {
                  const catColors = { Preparación: '#3b82f6', Recepción: col.green, Gastronomía: '#f59e0b', Entretenimiento: '#ec4899', Protocolo: '#8b5cf6', Cierre: col.faint }
                  const c = catColors[item.categoria] || col.faint
                  return (
                    <div key={item.id} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                      <div style={{ width: 44, flexShrink: 0, textAlign: 'right', paddingTop: 2 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: col.faint, fontVariantNumeric: 'tabular-nums' }}>{item.hora}</span>
                      </div>
                      <div style={{ flexShrink: 0, width: 10, height: 10, borderRadius: '50%', background: c, border: `2px solid ${col.bg}`, marginTop: 4, position: 'relative', zIndex: 1 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: col.text, marginBottom: 2 }}>{item.titulo}</div>
                        {item.descripcion && <div style={{ fontSize: 12, color: col.faint, lineHeight: 1.5, marginBottom: 4 }}>{item.descripcion}</div>}
                        <div style={{ display: 'inline-block', fontSize: 10, padding: '2px 8px', borderRadius: 20, background: `${c}18`, color: c, fontWeight: 600 }}>{item.categoria}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </Block>
        )}

        {/* Estado de cuenta — solo si hay algo aprobado o pagos */}
        {(hasApproved || hasPayments) && (
          <Block label="Estado de cuenta" icon="💳">
            <div style={{ background: col.surface, border: `1px solid ${col.border}`, borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: col.goldBg, borderBottom: `1px solid ${col.goldBorder}` }}>
                <span style={{ fontSize: 13 }}>🔒</span>
                <span style={{ fontSize: 11, color: '#A0906A' }}>Esta información es confidencial y está destinada exclusivamente a vos.</span>
              </div>
              {approvedTotal > 0 && (
                <div style={{ padding: '16px 18px', borderBottom: `1px solid ${col.border}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 12, color: col.faint }}>Progreso de pago</span>
                    <span style={{ fontSize: 12, color: col.green, fontWeight: 600 }}>{fmt(totalPaid)} de {fmt(approvedTotal)}</span>
                  </div>
                  <div style={{ background: col.border, borderRadius: 99, height: 6, overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 99, background: `linear-gradient(90deg, ${col.green}, #16a34a)`, width: `${Math.min((totalPaid/approvedTotal)*100, 100)}%`, transition: 'width 1.2s ease' }} />
                  </div>
                </div>
              )}
              {hasPayments
                ? payments.map((p, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 18px', borderBottom: i < payments.length - 1 ? `1px solid ${col.border}` : 'none' }}>
                    <div>
                      <div style={{ fontSize: 13, color: col.text }}>{p.note || 'Pago recibido'}</div>
                      <div style={{ fontSize: 11, color: col.faint, marginTop: 2 }}>{fmtShortDate(p.date)}</div>
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 700, color: col.green }}>{fmt(p.amount)}</span>
                  </div>
                ))
                : <div style={{ padding: '14px 18px', fontSize: 13, color: col.faint }}>Sin pagos registrados aún.</div>
              }
              {approvedTotal > 0 && (
                <div style={{ borderTop: `1px solid ${col.border}`, padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, color: col.muted, fontWeight: 600 }}>Saldo pendiente</span>
                  <span style={{ fontSize: 20, fontWeight: 800, color: balance > 0 ? col.red : col.green }}>{fmt(balance)}</span>
                </div>
              )}
            </div>
          </Block>
        )}

        {/* Contacto */}
        <Block label="Contacto" icon="📞">
          <div style={{ background: col.surface, border: `1px solid ${col.border}`, borderRadius: 12, overflow: 'hidden' }}>
            {[
              { label: 'WhatsApp', value: '+54 9 11 0000-0000', href: 'https://wa.me/5491100000000' },
              { label: 'Email',    value: 'hola@haus.com.ar',   href: 'mailto:hola@haus.com.ar' },
              { label: 'Instagram',value: '@haus.eventos',      href: 'https://instagram.com/haus.eventos' },
            ].map(({ label, value, href }, i, arr) => (
              <a key={label} href={href} target="_blank" rel="noreferrer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', borderBottom: i < arr.length - 1 ? `1px solid ${col.border}` : 'none', textDecoration: 'none' }}>
                <span style={{ fontSize: 12, color: col.faint }}>{label}</span>
                <span style={{ fontSize: 13, color: col.gold, fontWeight: 500 }}>{value}</span>
              </a>
            ))}
          </div>
        </Block>

        {/* Footer */}
        <div style={{ padding: '32px 0 20px', textAlign: 'center' }}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, color: col.gold, marginBottom: 6 }}>Haus</div>
          <div style={{ fontSize: 12, color: col.faint }}>Organización y producción de eventos</div>
        </div>

      </div>}

      {/* Tab Presupuesto */}
      {event.budgetPublished && activeTab === 'presupuesto' && (
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '32px 24px 100px' }}>
          <div style={{ fontSize: 12, color: col.faint, marginBottom: 20, lineHeight: 1.6 }}>
            Este es el presupuesto detallado de tu evento. Para guardarlo, usá la opción <strong style={{ color: col.muted }}>Imprimir → Guardar como PDF</strong> de tu navegador.
          </div>
          <div style={{ borderRadius: 14, overflow: 'hidden', border: `1px solid ${col.border}`, boxShadow: '0 8px 40px rgba(0,0,0,0.2)' }}>
            <BudgetPreview
              client={{ name: event.clientName, contact: event.clientName }}
              event={event}
              quotes={quotes || []}
              menuSections={menuSections || []}
              emissionDate={new Date().toISOString()}
            />
          </div>
        </div>
      )}

      {/* Chat flotante */}
      <div className="portal-chat-btn" style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 100, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12 }}>
        {chatOpen && (
          <div className="portal-chat-win" style={{ position: 'fixed', bottom: 90, right: 24, width: 360, background: col.surface, border: `1px solid ${col.border2}`, borderRadius: 16, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.6)', display: 'flex', flexDirection: 'column', maxHeight: '70vh' }}>
            <div style={{ padding: '13px 16px', background: col.bg, borderBottom: `1px solid ${col.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: col.text }}>Asistente Haus</div>
                <div style={{ fontSize: 10, color: col.faint, marginTop: 2 }}>Respondemos tus dudas</div>
              </div>
              <button onClick={() => setChatOpen(false)} style={{ background: 'none', border: 'none', color: col.faint, cursor: 'pointer', fontSize: 16, lineHeight: 1 }}>✕</button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '14px 12px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {chatMessages.map((m, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  <div style={{ padding: '9px 13px', borderRadius: m.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px', background: m.role === 'user' ? `linear-gradient(135deg, ${col.gold}, ${col.goldLight})` : col.bg, color: m.role === 'user' ? '#09090F' : col.text, fontSize: 13, maxWidth: '85%', lineHeight: 1.5, border: m.role === 'user' ? 'none' : `1px solid ${col.border}` }}>
                    {m.text}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <div style={{ padding: '9px 13px', borderRadius: '12px 12px 12px 2px', background: col.bg, border: `1px solid ${col.border}`, color: col.faint, fontSize: 13 }}>...</div>
                </div>
              )}
            </div>
            <div style={{ padding: '10px 12px', borderTop: `1px solid ${col.border}`, display: 'flex', gap: 8 }}>
              <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendChat()} placeholder="Escribí tu pregunta..." style={{ flex: 1, background: col.bg, border: `1px solid ${col.border}`, borderRadius: 8, padding: '9px 12px', color: col.text, fontSize: 13, outline: 'none' }} />
              <button onClick={sendChat} disabled={chatLoading || !chatInput.trim()} style={{ background: `linear-gradient(135deg, ${col.gold}, ${col.goldLight})`, border: 'none', borderRadius: 8, padding: '9px 14px', color: '#09090F', fontWeight: 700, cursor: chatLoading ? 'wait' : 'pointer', fontSize: 13 }}>→</button>
            </div>
          </div>
        )}
        <button onClick={() => setChatOpen(o => !o)} style={{ width: 52, height: 52, borderRadius: '50%', background: chatOpen ? col.surface : `linear-gradient(135deg, ${col.gold}, ${col.goldLight})`, border: chatOpen ? `1px solid ${col.border}` : 'none', cursor: 'pointer', boxShadow: '0 4px 20px rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, transition: 'all 0.2s' }}>
          {chatOpen ? <span style={{ fontSize: 16, color: col.faint }}>✕</span> : '🤖'}
        </button>
      </div>

    </div>
  )
}