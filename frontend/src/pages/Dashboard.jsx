import { useState, useEffect } from 'react'
import api from '../api/axios'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import {
  UserCheck, CalendarClock, TrendingUp, AlertCircle,
  UserPlus, CalendarPlus, FilePlus, Truck,
  ArrowDownCircle, ArrowUpCircle, Package,
  CheckCircle2
} from 'lucide-react'

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
  return { day: d.getDate(), month: d.toLocaleString('es', { month: 'short' }).toUpperCase() }
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
  if (quote.kind === 'Catering') return (quote.covers || 0) * (quote.pricePerCover || 0) + itemsTotal
  return itemsTotal
}

function Badge({ label, color }) {
  return (
    <span style={{ fontSize: 10, padding: '3px 10px', borderRadius: 20, fontWeight: 600, background: `${color}20`, color, whiteSpace: 'nowrap' }}>
      {label}
    </span>
  )
}

function KpiCard({ label, value, sub, icon, color }) {
  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '20px 22px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 14, right: 16, opacity: 0.1, color }}>{icon}</div>
      <div style={{ fontSize: 11, color: 'var(--text-label)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color, fontFamily: "'Playfair Display', serif", marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>{sub}</div>
    </div>
  )
}

function SectionTitle({ children }) {
  return (
    <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, color: 'var(--gold)', marginBottom: 18 }}>
      {children}
    </div>
  )
}

function Card({ children, style = {} }) {
  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, ...style }}>
      {children}
    </div>
  )
}

function Skeleton({ height = 20, width = '100%', style = {} }) {
  return (
    <div style={{
      height, width, borderRadius: 6,
      background: 'linear-gradient(90deg, var(--bg-sunken) 25%, var(--border) 50%, var(--bg-sunken) 75%)',
      backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite', ...style,
    }} />
  )
}

const CHART_COLORS = ['#22c55e', '#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6', '#c9a84c']
const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

export default function Dashboard() {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [clientsRes, eventsRes, quotesRes, suppliersRes] = await Promise.all([
          api.get('/api/clients'),
          api.get('/api/events'),
          api.get('/api/quotes'),
          api.get('/api/suppliers'),
        ])
        const safeGet = async (url) => {
          try { return (await api.get(url)).data } catch { return null }
        }
        const [spPending, allPayments, allSpPayments] = await Promise.all([
          safeGet('/api/supplier-payments/pending-total'),
          safeGet('/api/payments/all'),
          safeGet('/api/supplier-payments/all'),
        ])
        setData({
          clients:       clientsRes.data,
          events:        eventsRes.data,
          quotes:        quotesRes.data,
          suppliers:     suppliersRes.data,
          pendingTotal:  spPending?.total || 0,
          allPayments:   allPayments || [],
          allSpPayments: allSpPayments || [],
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
    { label: 'Clientes activos',    value: data.clients.filter(c => c.status === 'Activo').length, sub: `${data.clients.length} clientes en total`, icon: <UserCheck size={28} strokeWidth={1.5} />, color: 'var(--gold)' },
    { label: 'Eventos en curso',    value: data.events.filter(e => e.status !== 'Finalizado').length, sub: `${data.events.length} eventos en total`, icon: <CalendarClock size={28} strokeWidth={1.5} />, color: '#3b82f6' },
    { label: 'Ingresos aprobados',  value: formatCurrency(data.quotes.filter(q => q.status === 'Aprobado').reduce((acc, q) => acc + calcTotal(q), 0)), sub: `${data.quotes.filter(q => q.status === 'Aprobado').length} cotizaciones aprobadas`, icon: <TrendingUp size={28} strokeWidth={1.5} />, color: '#22c55e' },
    { label: 'Pagos pendientes',    value: formatCurrency(data.pendingTotal || 0), sub: 'Total a pagar a proveedores', icon: <AlertCircle size={28} strokeWidth={1.5} />, color: '#ef4444' },
  ] : []

  const now = new Date()
  const in30 = new Date(now.getTime() + 30 * 86400000)
  const upcomingEvents = data
    ? [...data.events].filter(e => { const d = new Date(e.date); return d >= now && d <= in30 && e.status !== 'Finalizado' }).sort((a, b) => new Date(a.date) - new Date(b.date))
    : []

  const paymentsByEvent = data
    ? data.allPayments.reduce((acc, p) => { acc[p.eventId] = (acc[p.eventId] || 0) + p.amount; return acc }, {})
    : {}

  const totalByEvent = (eventId) => {
    if (!data) return { total: 0, paid: 0 }
    const quotes = data.quotes.filter(q => q.eventId === eventId && q.status === 'Aprobado')
    const total  = quotes.reduce((acc, q) => acc + calcTotal(q), 0)
    const paid   = paymentsByEvent[eventId] || 0
    return { total, paid, balance: total - paid }
  }

  const pendingQuotes     = data ? data.quotes.filter(q => q.status === 'Pendiente').sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) : []
  const eventsWithoutQuotes = data ? data.events.filter(e => e.status !== 'Finalizado' && !data.quotes.some(q => q.eventId === e.id)) : []
  const suppliersPending  = data
    ? Object.values(data.allSpPayments.filter(p => p.status === 'Pendiente').reduce((acc, p) => {
        const key = p.supplierId
        if (!acc[key]) acc[key] = { name: p.supplier?.name || '—', total: 0, count: 0 }
        acc[key].total += p.amount; acc[key].count += 1
        return acc
      }, {})).sort((a, b) => b.total - a.total)
    : []

  const quoteStatusData = data ? (() => {
    const counts = {}
    data.quotes.forEach(q => { counts[q.status] = (counts[q.status] || 0) + 1 })
    return Object.entries(counts).map(([name, value]) => ({ name, value }))
  })() : []

  const eventsByMonth = data ? (() => {
    const counts = Array(12).fill(0)
    data.events.forEach(e => { counts[new Date(e.date).getMonth()]++ })
    return counts.map((value, i) => ({ mes: MESES[i], value })).filter(d => d.value > 0)
  })() : []

  const recentQuotes = data ? [...data.quotes].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 4) : []
  const fmtARS = (n) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)

  const recentActivity = data ? [
    ...data.clients.map(c      => ({ text: `Cliente agregado: ${c.name}`,          time: c.createdAt, icon: <UserPlus size={15} strokeWidth={1.75} />, type: 'default' })),
    ...data.events.map(e       => ({ text: `Evento creado: ${e.name}`,              time: e.createdAt, icon: <CalendarPlus size={15} strokeWidth={1.75} />, type: 'default' })),
    ...data.quotes.map(q       => ({ text: `Cotización para: ${q.event?.name||'—'}`, time: q.createdAt, icon: <FilePlus size={15} strokeWidth={1.75} />, type: 'default' })),
    ...data.suppliers.map(s    => ({ text: `Proveedor: ${s.name}`,                   time: s.createdAt, icon: <Package size={15} strokeWidth={1.75} />, type: 'default' })),
    ...data.allPayments.map(p  => ({ text: `Cobro: ${p.event?.name||'—'}`,  amount: fmtARS(p.amount), time: p.createdAt, icon: <ArrowDownCircle size={15} strokeWidth={1.75} />, type: 'income' })),
    ...data.allSpPayments.map(p => ({ text: `Pago a ${p.supplier?.name||'—'}`, amount: fmtARS(p.amount), status: p.status, time: p.createdAt, icon: <ArrowUpCircle size={15} strokeWidth={1.75} />, type: 'payment' })),
  ].sort((a, b) => new Date(b.time) - new Date(a.time)) : []

  const tooltipStyle = {
    background: 'var(--chart-tooltip-bg)',
    border: '1px solid var(--chart-tooltip-border)',
    borderRadius: 8,
    color: 'var(--chart-tooltip-color)',
    fontSize: 12,
  }

  const rowBorder = { borderBottom: '1px solid var(--border-row)' }
  const miniCard = { width: 40, height: 40, borderRadius: 10, background: 'var(--bg-sunken)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }

  return (
    <div>
      {/* Encabezado */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 900, color: 'var(--text-primary)' }}>Bienvenido 👋</div>
        <div style={{ fontSize: 13, color: 'var(--text-label)', marginTop: 4 }}>
          {new Date().toLocaleDateString('es-AR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '20px 22px' }}>
                <Skeleton height={11} width={100} style={{ marginBottom: 12 }} />
                <Skeleton height={28} width={80} style={{ marginBottom: 8 }} />
                <Skeleton height={11} width={120} />
              </div>
            ))
          : kpis.map((kpi, i) => <KpiCard key={i} {...kpi} />)
        }
      </div>

      {/* Fila 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', gap: 20, marginBottom: 20 }}>
        <Card>
          <SectionTitle>Eventos próximos — 30 días</SectionTitle>
          {loading ? <Skeleton height={60} /> : upcomingEvents.length === 0 ? (
            <div style={{ fontSize: 13, color: 'var(--text-faint)', textAlign: 'center', padding: '20px 0' }}>No hay eventos en los próximos 30 días</div>
          ) : upcomingEvents.map(ev => {
            const { day, month } = formatDate(ev.date)
            const { total, paid, balance } = totalByEvent(ev.id)
            return (
              <div key={ev.id} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '10px 0', ...rowBorder }}>
                <div style={miniCard}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--gold)', lineHeight: 1 }}>{day}</div>
                  <div style={{ fontSize: 9, color: 'var(--text-label)', letterSpacing: 1 }}>{month}</div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ev.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-label)', marginTop: 1 }}>{ev.client?.name || '—'}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  {total > 0 ? (
                    <>
                      <div style={{ fontSize: 11, color: balance <= 0 ? '#22c55e' : '#f59e0b', fontWeight: 600 }}>
                        {balance <= 0 ? '✓ Saldado' : formatCurrency(balance)}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--text-faint)' }}>de {formatCurrency(total)}</div>
                    </>
                  ) : (
                    <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>Sin cotizar</div>
                  )}
                </div>
              </div>
            )
          })}
        </Card>

        <Card>
          <SectionTitle>Pendientes de aprobación</SectionTitle>
          {loading ? <Skeleton height={60} /> : pendingQuotes.length === 0 ? (
            <div style={{ fontSize: 13, color: 'var(--text-faint)', textAlign: 'center', padding: '20px 0' }}>
              <CheckCircle2 size={24} style={{ color: '#22c55e', marginBottom: 8 }} />
              <div>Todo aprobado</div>
            </div>
          ) : pendingQuotes.map(q => (
            <div key={q.id} style={{ padding: '10px 0', ...rowBorder }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)', flex: 1, marginRight: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {q.event?.name || '—'}
                </div>
                <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 20, fontWeight: 600, background: q.kind === 'Catering' ? 'rgba(59,130,246,0.12)' : 'rgba(139,92,246,0.12)', color: q.kind === 'Catering' ? '#3b82f6' : '#8b5cf6' }}>{q.kind}</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-label)', marginTop: 2 }}>{q.event?.client?.name || '—'}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#f59e0b', marginTop: 2 }}>{formatCurrency(calcTotal(q))}</div>
            </div>
          ))}
        </Card>

        <Card>
          <SectionTitle>Eventos sin cotizar</SectionTitle>
          {loading ? <Skeleton height={60} /> : eventsWithoutQuotes.length === 0 ? (
            <div style={{ fontSize: 13, color: 'var(--text-faint)', textAlign: 'center', padding: '20px 0' }}>
              <CheckCircle2 size={24} style={{ color: '#22c55e', marginBottom: 8 }} />
              <div>Todos cotizados</div>
            </div>
          ) : eventsWithoutQuotes.map(ev => {
            const { day, month } = formatDate(ev.date)
            return (
              <div key={ev.id} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '10px 0', ...rowBorder }}>
                <div style={{ ...miniCard, width: 36, height: 36, borderRadius: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#ef4444', lineHeight: 1 }}>{day}</div>
                  <div style={{ fontSize: 8, color: 'var(--text-label)', letterSpacing: 1 }}>{month}</div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-label)' }}>{ev.client?.name || '—'}</div>
                </div>
                <Badge label={ev.status} color={statusColors[ev.status] || '#5a5a7a'} />
              </div>
            )
          })}
        </Card>
      </div>

      {/* Fila 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, marginBottom: 20 }}>
        <Card>
          <SectionTitle>Deuda con proveedores</SectionTitle>
          {loading ? <Skeleton height={60} /> : suppliersPending.length === 0 ? (
            <div style={{ fontSize: 13, color: 'var(--text-faint)', textAlign: 'center', padding: '20px 0' }}>
              <CheckCircle2 size={24} style={{ color: '#22c55e', marginBottom: 8 }} />
              <div>Sin deudas pendientes</div>
            </div>
          ) : suppliersPending.map((s, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', ...rowBorder }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)' }}>{s.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-label)' }}>{s.count} pago{s.count > 1 ? 's' : ''} pendiente{s.count > 1 ? 's' : ''}</div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#ef4444' }}>{formatCurrency(s.total)}</div>
            </div>
          ))}
        </Card>

        <Card>
          <SectionTitle>Estado de cotizaciones</SectionTitle>
          {loading ? <Skeleton height={180} /> : quoteStatusData.length === 0 ? (
            <div style={{ fontSize: 13, color: 'var(--text-faint)', textAlign: 'center', padding: '20px 0' }}>Sin cotizaciones</div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={quoteStatusData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                  {quoteStatusData.map((entry, i) => (
                    <Cell key={i} fill={statusColors[entry.name] || CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: 'var(--text-label)' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card>
          <SectionTitle>Eventos por mes</SectionTitle>
          {loading ? <Skeleton height={180} /> : eventsByMonth.length === 0 ? (
            <div style={{ fontSize: 13, color: 'var(--text-faint)', textAlign: 'center', padding: '20px 0' }}>Sin eventos</div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={eventsByMonth} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="mes" tick={{ fontSize: 10, fill: 'var(--text-label)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--text-label)' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'var(--gold-glow)' }} />
                <Bar dataKey="value" name="Eventos" fill="var(--gold)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* Fila 3 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <Card>
          <SectionTitle>Cotizaciones recientes</SectionTitle>
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} style={{ padding: '11px 0', ...rowBorder }}>
                <Skeleton height={13} style={{ marginBottom: 6 }} />
                <Skeleton height={11} width="50%" />
              </div>
            ))
          ) : recentQuotes.length === 0 ? (
            <div style={{ fontSize: 13, color: 'var(--text-faint)', textAlign: 'center', padding: '20px 0' }}>No hay cotizaciones</div>
          ) : recentQuotes.map(q => (
            <div key={q.id} style={{ padding: '11px 0', ...rowBorder }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)', flex: 1, marginRight: 8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {q.event?.name || '—'}
                </div>
                <Badge label={q.status} color={statusColors[q.status] || '#5a5a7a'} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                <span style={{ fontSize: 11, color: 'var(--text-label)' }}>{q.event?.client?.name || '—'}</span>
                <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 20, fontWeight: 600, background: q.kind === 'Catering' ? 'rgba(59,130,246,0.12)' : 'rgba(139,92,246,0.12)', color: q.kind === 'Catering' ? '#3b82f6' : '#8b5cf6' }}>{q.kind}</span>
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#22c55e', marginTop: 3 }}>{formatCurrency(calcTotal(q))}</div>
            </div>
          ))}
        </Card>

        <Card style={{ maxHeight: 380, overflowY: 'auto' }}>
          <SectionTitle>Actividad reciente</SectionTitle>
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, padding: '11px 0', ...rowBorder }}>
                <Skeleton height={32} width={32} style={{ borderRadius: 8, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <Skeleton height={12} style={{ marginBottom: 6 }} />
                  <Skeleton height={10} width="40%" />
                </div>
              </div>
            ))
          ) : recentActivity.length === 0 ? (
            <div style={{ fontSize: 13, color: 'var(--text-faint)', textAlign: 'center', padding: '20px 0' }}>Sin actividad reciente</div>
          ) : recentActivity.map((a, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '11px 0', ...rowBorder }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--bg-sunken)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: 'var(--gold)', flexShrink: 0 }}>
                {a.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  {a.text}
                  {a.type === 'income'  && <span style={{ fontWeight: 700, color: '#22c55e', marginLeft: 6 }}>{a.amount}</span>}
                  {a.type === 'payment' && (
                    <>
                      <span style={{ marginLeft: 6, color: a.status === 'Pagado' ? '#22c55e' : '#f59e0b', fontWeight: 500 }}>{a.amount}</span>
                      <span style={{ marginLeft: 6, fontSize: 10, padding: '2px 7px', borderRadius: 20, fontWeight: 600, background: a.status === 'Pagado' ? 'rgba(34,197,94,0.12)' : 'rgba(245,158,11,0.12)', color: a.status === 'Pagado' ? '#22c55e' : '#f59e0b' }}>{a.status}</span>
                    </>
                  )}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-faint)', marginTop: 3 }}>{formatTimeAgo(a.time)}</div>
              </div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  )
}