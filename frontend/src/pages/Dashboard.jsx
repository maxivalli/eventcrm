import { useState, useEffect } from 'react'
import api from '../api/axios'
import {
  UserCheck, CalendarClock, TrendingUp, AlertCircle,
  UserPlus, CalendarPlus, FilePlus, Truck,
  ArrowDownCircle, ArrowUpCircle, Package
} from 'lucide-react'

// --- Helpers ---
const statusColors = {
  'Confirmado':    '#22c55e',
  'En producción': '#3b82f6',
  'Propuesta':     '#f59e0b',
  'Finalizado':    '#8b5cf6',
  'Aprobado':      '#22c55e',
  'En revisión':   '#3b82f6',
  'Pendiente':     '#f59e0b',
  'Rechazado':     '#ef4444',
}

const formatCurrency = (n) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)

const formatDate = (str) => {
  const d = new Date(str)
  return {
    day:   d.getDate(),
    month: d.toLocaleString('es', { month: 'short' }).toUpperCase(),
  }
}

const formatTimeAgo = (str) => {
  const diff = Date.now() - new Date(str).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins  < 60)  return `Hace ${mins} min`
  if (hours < 24)  return `Hace ${hours} hora${hours > 1 ? 's' : ''}`
  if (days  < 7)   return `Hace ${days} día${days > 1 ? 's' : ''}`
  return new Date(str).toLocaleDateString('es-AR')
}

const calcTotal = (quote) => {
  const itemsTotal = (quote.items || []).reduce((acc, item) => acc + item.quantity * item.unitPrice, 0)
  if (quote.kind === 'Catering') {
    return (quote.covers || 0) * (quote.pricePerCover || 0) + itemsTotal
  }
  return itemsTotal
}

function Badge({ label, color }) {
  return (
    <span style={{
      fontSize: 10, padding: '3px 10px', borderRadius: 20, fontWeight: 600,
      background: `${color}20`, color, whiteSpace: 'nowrap',
    }}>{label}</span>
  )
}

function KpiCard({ label, value, sub, icon, color }) {
  return (
    <div style={{
      background: '#12121e', border: '1px solid #1e1e30',
      borderRadius: 16, padding: '20px 22px', position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', top: 14, right: 16, opacity: 0.08, color }}>{icon}</div>
      <div style={{ fontSize: 11, color: '#4a4a6a', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color, fontFamily: "'Playfair Display', serif", marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 11, color: '#3a3a5a' }}>{sub}</div>
    </div>
  )
}

function Skeleton({ height = 20, width = '100%', style = {} }) {
  return (
    <div style={{
      height, width, borderRadius: 6,
      background: 'linear-gradient(90deg, #1a1a28 25%, #1e1e30 50%, #1a1a28 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.5s infinite',
      ...style,
    }} />
  )
}

export default function Dashboard() {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [clientsRes, eventsRes, quotesRes, suppliersRes, spPendingRes, allPaymentsRes, allSpRes] = await Promise.all([
          api.get('/api/clients'),
          api.get('/api/events'),
          api.get('/api/quotes'),
          api.get('/api/suppliers'),
          api.get('/api/supplier-payments/pending-total'),
          api.get('/api/payments/all'),
          api.get('/api/supplier-payments/all'),
        ])
        setData({
          clients:          clientsRes.data,
          events:           eventsRes.data,
          quotes:           quotesRes.data,
          suppliers:        suppliersRes.data,
          pendingTotal:     spPendingRes.data.total,
          allPayments:      allPaymentsRes.data,
          allSpPayments:    allSpRes.data,
        })
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [])

  const kpis = data ? [
    {
      label: 'Clientes activos',
      value: data.clients.filter(c => c.status === 'Activo').length,
      sub:   `${data.clients.length} clientes en total`,
      icon:  <UserCheck size={28} strokeWidth={1.5} />,
      color: '#c9a84c',
    },
    {
      label: 'Eventos en curso',
      value: data.events.filter(e => e.status !== 'Finalizado').length,
      sub:   `${data.events.length} eventos en total`,
      icon:  <CalendarClock size={28} strokeWidth={1.5} />,
      color: '#3b82f6',
    },
    {
      label: 'Ingresos aprobados',
      value: formatCurrency(
        data.quotes
          .filter(q => q.status === 'Aprobado')
          .reduce((acc, q) => acc + calcTotal(q), 0)
      ),
      sub:   `${data.quotes.filter(q => q.status === 'Aprobado').length} cotizaciones aprobadas`,
      icon:  <TrendingUp size={28} strokeWidth={1.5} />,
      color: '#22c55e',
    },
    {
      label: 'Pagos pendientes',
      value: formatCurrency(data.pendingTotal || 0),
      sub:   'Total a pagar a proveedores',
      icon:  <AlertCircle size={28} strokeWidth={1.5} />,
      color: '#ef4444',
    },
  ] : []

  const upcomingEvents = data
    ? [...data.events]
        .filter(e => e.status !== 'Finalizado')
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(0, 4)
    : []

  const recentQuotes = data
    ? [...data.quotes]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 4)
    : []

  const fmtARS = (n) => new Intl.NumberFormat('es-AR',{style:'currency',currency:'ARS',maximumFractionDigits:0}).format(n)

  const recentActivity = data
    ? [
        ...data.clients.map(c      => ({ text: `Cliente agregado: ${c.name}`,                                     time: c.createdAt, icon: <UserPlus size={15} strokeWidth={1.75} />, type: 'default' })),
        ...data.events.map(e       => ({ text: `Evento creado: ${e.name}`,                                        time: e.createdAt, icon: <CalendarPlus size={15} strokeWidth={1.75} />, type: 'default' })),
        ...data.quotes.map(q       => ({ text: `Cotización para: ${q.event?.name || '—'}`,                        time: q.createdAt, icon: <FilePlus size={15} strokeWidth={1.75} />, type: 'default' })),
        ...data.suppliers.map(s    => ({ text: `Proveedor agregado: ${s.name}`,                                   time: s.createdAt, icon: <Package size={15} strokeWidth={1.75} />, type: 'default' })),
        ...(data.allPayments  || []).map(p  => ({ text: `Cobro registrado: ${p.event?.name || '—'}`, amount: fmtARS(p.amount), time: p.createdAt, icon: <ArrowDownCircle size={15} strokeWidth={1.75} />, type: 'income' })),
        ...(data.allSpPayments|| []).map(p  => ({ text: `Pago a ${p.supplier?.name || '—'}`, amount: fmtARS(p.amount), status: p.status, time: p.createdAt, icon: <ArrowUpCircle size={15} strokeWidth={1.75} />, type: 'payment' })),
      ]
        .sort((a, b) => new Date(b.time) - new Date(a.time))
    : []

  return (
    <div>
      <style>{`
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      <div style={{ marginBottom: 28 }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 900, color: '#e8e8f0' }}>
          Bienvenido 👋
        </div>
        <div style={{ fontSize: 13, color: '#4a4a6a', marginTop: 4 }}>
          {new Date().toLocaleDateString('es-AR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{ background: '#12121e', border: '1px solid #1e1e30', borderRadius: 16, padding: '20px 22px' }}>
                <Skeleton height={11} width={100} style={{ marginBottom: 12 }} />
                <Skeleton height={28} width={80} style={{ marginBottom: 8 }} />
                <Skeleton height={11} width={120} />
              </div>
            ))
          : kpis.map((kpi, i) => <KpiCard key={i} {...kpi} />)
        }
      </div>

      {/* Fila inferior */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>

        {/* Próximos eventos */}
        <div style={{ background: '#12121e', border: '1px solid #1e1e30', borderRadius: 16, padding: 24 }}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, color: '#c9a84c', marginBottom: 18 }}>
            Próximos eventos
          </div>
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, padding: '11px 0', borderBottom: '1px solid #1a1a28' }}>
                <Skeleton height={44} width={44} style={{ borderRadius: 10, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <Skeleton height={13} style={{ marginBottom: 6 }} />
                  <Skeleton height={11} width='60%' />
                </div>
              </div>
            ))
          ) : upcomingEvents.length === 0 ? (
            <div style={{ fontSize: 13, color: '#3a3a5a', textAlign: 'center', padding: '20px 0' }}>
              No hay eventos próximos
            </div>
          ) : upcomingEvents.map(ev => {
            const { day, month } = formatDate(ev.date)
            return (
              <div key={ev.id} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '11px 0', borderBottom: '1px solid #1a1a28' }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 10, background: '#0d0d18',
                  border: '1px solid #1e1e30', display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#c9a84c', lineHeight: 1 }}>{day}</div>
                  <div style={{ fontSize: 9, color: '#4a4a6a', letterSpacing: 1 }}>{month}</div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: '#e8e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ev.name}</div>
                  <div style={{ fontSize: 11, color: '#4a4a6a', marginTop: 2 }}>{ev.guests} invitados</div>
                </div>
                <Badge label={ev.status} color={statusColors[ev.status] || '#5a5a7a'} />
              </div>
            )
          })}
        </div>

        {/* Cotizaciones recientes */}
        <div style={{ background: '#12121e', border: '1px solid #1e1e30', borderRadius: 16, padding: 24 }}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, color: '#c9a84c', marginBottom: 18 }}>
            Cotizaciones recientes
          </div>
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} style={{ padding: '11px 0', borderBottom: '1px solid #1a1a28' }}>
                <Skeleton height={13} style={{ marginBottom: 6 }} />
                <Skeleton height={11} width='50%' />
              </div>
            ))
          ) : recentQuotes.length === 0 ? (
            <div style={{ fontSize: 13, color: '#3a3a5a', textAlign: 'center', padding: '20px 0' }}>
              No hay cotizaciones
            </div>
          ) : recentQuotes.map(q => (
            <div key={q.id} style={{ padding: '11px 0', borderBottom: '1px solid #1a1a28' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: '#e8e8f0', flex: 1, marginRight: 8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {q.event?.name || '—'}
                </div>
                <Badge label={q.status} color={statusColors[q.status] || '#5a5a7a'} />
              </div>
              <div style={{ fontSize: 11, color: '#4a4a6a' }}>{q.event?.client?.name || '—'}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#22c55e', marginTop: 3 }}>
                {formatCurrency(calcTotal(q))}
              </div>
            </div>
          ))}
        </div>

        {/* Actividad reciente */}
        <div style={{ background: '#12121e', border: '1px solid #1e1e30', borderRadius: 16, padding: 24, maxHeight: 520, overflowY: 'auto' }}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, color: '#c9a84c', marginBottom: 18 }}>
            Actividad reciente
          </div>
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, padding: '11px 0', borderBottom: '1px solid #1a1a28' }}>
                <Skeleton height={32} width={32} style={{ borderRadius: 8, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <Skeleton height={12} style={{ marginBottom: 6 }} />
                  <Skeleton height={10} width='40%' />
                </div>
              </div>
            ))
          ) : recentActivity.length === 0 ? (
            <div style={{ fontSize: 13, color: '#3a3a5a', textAlign: 'center', padding: '20px 0' }}>
              Sin actividad reciente
            </div>
          ) : recentActivity.map((a, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '11px 0', borderBottom: '1px solid #1a1a28' }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8, background: '#0d0d18',
                border: '1px solid #1e1e30', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 14, color: '#c9a84c', flexShrink: 0,
              }}>{a.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: '#c8c8d8', lineHeight: 1.4 }}>
                  {a.text}
                  {a.type === 'income' && (
                    <span style={{ fontWeight: 700, color: '#22c55e', marginLeft: 6 }}>{a.amount}</span>
                  )}
                  {a.type === 'payment' && (
                    <>
                      <span style={{ marginLeft: 6, color: a.status === 'Pagado' ? '#22c55e' : '#f59e0b', fontWeight: 500 }}>{a.amount}</span>
                      <span style={{
                        marginLeft: 6, fontSize: 10, padding: '2px 7px', borderRadius: 20, fontWeight: 600,
                        background: a.status === 'Pagado' ? 'rgba(34,197,94,0.12)' : 'rgba(245,158,11,0.12)',
                        color: a.status === 'Pagado' ? '#22c55e' : '#f59e0b',
                      }}>{a.status}</span>
                    </>
                  )}
                </div>
                <div style={{ fontSize: 10, color: '#3a3a5a', marginTop: 3 }}>{formatTimeAgo(a.time)}</div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}