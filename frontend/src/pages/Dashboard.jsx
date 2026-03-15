import { useState, useEffect } from 'react'
import api from '../api/axios'
import {
  PieChart, Pie, Cell, Sector,
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import {
  UserCheck, CalendarClock, MapPin, Clock, User, Users, ThermometerSun, Cloud, CloudRain, CloudSnow, CloudLightning, TrendingUp, AlertCircle,
  FilePlus, ArrowDownCircle, Package, CheckCircle2,
  MessageSquare, Cake, Wallet, TrendingDown, LayoutDashboard, BarChart2, CalendarDays, ChevronLeft, ChevronRight,
} from 'lucide-react'

// ── Formatters ────────────────────────────────────────────────────────────────

const fmt = (n) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)

const fmtDate = (str) => {
  const d = new Date(str)
  return { day: d.getDate(), month: d.toLocaleString('es', { month: 'short' }).toUpperCase() }
}

const WEATHER_CODES = {
  0:  { label: 'Despejado',           icon: <ThermometerSun size={14} />, color: '#f59e0b' },
  1:  { label: 'Principalmente claro', icon: <ThermometerSun size={14} />, color: '#f59e0b' },
  2:  { label: 'Parcialmente nublado', icon: <Cloud size={14} />, color: '#64748b' },
  3:  { label: 'Nublado',             icon: <Cloud size={14} />, color: '#64748b' },
  45: { label: 'Niebla',              icon: <Cloud size={14} />, color: '#64748b' },
  48: { label: 'Niebla helada',       icon: <Cloud size={14} />, color: '#64748b' },
  51: { label: 'Llovizna ligera',     icon: <CloudRain size={14} />, color: '#3b82f6' },
  53: { label: 'Llovizna',            icon: <CloudRain size={14} />, color: '#3b82f6' },
  55: { label: 'Llovizna intensa',    icon: <CloudRain size={14} />, color: '#3b82f6' },
  61: { label: 'Lluvia ligera',       icon: <CloudRain size={14} />, color: '#3b82f6' },
  63: { label: 'Lluvia',              icon: <CloudRain size={14} />, color: '#3b82f6' },
  65: { label: 'Lluvia intensa',      icon: <CloudRain size={14} />, color: '#3b82f6' },
  66: { label: 'Aguanieve ligera',    icon: <CloudSnow size={14} />, color: '#60a5fa' },
  67: { label: 'Aguanieve intensa',   icon: <CloudSnow size={14} />, color: '#60a5fa' },
  71: { label: 'Nieve ligera',        icon: <CloudSnow size={14} />, color: '#60a5fa' },
  73: { label: 'Nieve',               icon: <CloudSnow size={14} />, color: '#60a5fa' },
  75: { label: 'Nieve intensa',       icon: <CloudSnow size={14} />, color: '#60a5fa' },
  80: { label: 'Lluvias dispersas',   icon: <CloudRain size={14} />, color: '#3b82f6' },
  81: { label: 'Lluvias',             icon: <CloudRain size={14} />, color: '#3b82f6' },
  82: { label: 'Lluvias fuertes',     icon: <CloudRain size={14} />, color: '#3b82f6' },
  95: { label: 'Tormenta eléctrica',  icon: <CloudLightning size={14} />, color: '#f97316' },
  96: { label: 'Tormenta con granizo',icon: <CloudLightning size={14} />, color: '#f97316' },
  99: { label: 'Tormenta grave',      icon: <CloudLightning size={14} />, color: '#f97316' },
}

const fmtAgo = (str) => {
  const diff = Date.now() - new Date(str).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins  < 60) return `Hace ${mins} min`
  if (hours < 24) return `Hace ${hours} hora${hours > 1 ? 's' : ''}`
  if (days  < 7)  return `Hace ${days} día${days > 1 ? 's' : ''}`
  return new Date(str).toLocaleDateString('es-AR')
}

const calcTotal = (q) => {
  const items = (q.items || []).reduce((a, i) => a + i.quantity * i.unitPrice, 0)
  return q.kind === 'Catering' ? (q.covers || 0) * (q.pricePerCover || 0) + items : items
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_COLORS = {
  Confirmado: '#22c55e', Propuesta: '#f59e0b', Finalizado: '#8b5cf6',
  Aprobado: '#22c55e', Pendiente: '#f59e0b', Rechazado: '#ef4444',
}
const CHART_COLORS = ['#22c55e', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#c9a84c']
const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

const ACTION_ICONS = {
  create: <FilePlus size={13} strokeWidth={1.75} />,
  update: <CheckCircle2 size={13} strokeWidth={1.75} />,
  delete: <AlertCircle size={13} strokeWidth={1.75} />,
  status: <TrendingUp size={13} strokeWidth={1.75} />,
  payment: <ArrowDownCircle size={13} strokeWidth={1.75} />,
  file: <Package size={13} strokeWidth={1.75} />,
  checklist: <CheckCircle2 size={13} strokeWidth={1.75} />,
}
const ACTION_COLORS = {
  create: 'var(--gold)', update: '#3b82f6', delete: '#ef4444',
  status: '#8b5cf6', payment: '#22c55e', file: '#06b6d4', checklist: '#f97316',
}

const tooltipStyle = {
  background: 'var(--chart-tooltip-bg)', border: '1px solid var(--chart-tooltip-border)',
  borderRadius: 8, color: 'var(--text-primary)', fontSize: 12,
}
const tooltipItemStyle = { color: 'var(--text-primary)', fontSize: 12 }
const tooltipLabelStyle = { color: 'var(--text-primary)', fontSize: 12 }

// ── Componentes compartidos ───────────────────────────────────────────────────

function Badge({ label, color }) {
  return (
    <span style={{ fontSize: 10, padding: '3px 10px', borderRadius: 20, fontWeight: 600, background: `${color}20`, color, whiteSpace: 'nowrap' }}>
      {label}
    </span>
  )
}

function PendingBalanceCard({ ev }) {
  const [hovered, setHovered] = useState(false)
  const pct = ev.total > 0 ? Math.min((ev.paid / ev.total) * 100, 100) : 0
  return (
    <div
      style={{
        padding: '10px 0',
        ...rowBorder,
        background: hovered ? 'var(--bg-hover)' : 'transparent',
        cursor: 'pointer',
        transition: 'background 0.2s'
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, marginRight: 8 }}>{ev.name}</div>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#f59e0b', flexShrink: 0 }}>{fmt(ev.balance)}</div>
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-label)', marginBottom: 6 }}>{ev.client?.name || '—'}</div>
      <div style={{ height: 4, background: 'var(--bg-sunken)', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ height: '100%', borderRadius: 99, background: 'linear-gradient(135deg, var(--gold), var(--gold-light))', width: `${pct}%`, transition: 'width 0.3s' }} />
      </div>
      <div style={{ fontSize: 10, color: 'var(--text-faint)', marginTop: 3 }}>{fmt(ev.paid)} cobrado de {fmt(ev.total)}</div>
    </div>
  )
}

function QuoteCard({ q }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      style={{
        padding: '14px 16px',
        background: hovered ? 'var(--bg-hover)' : 'var(--bg-sunken)',
        borderRadius: 12,
        border: '1px solid var(--border)',
        cursor: 'pointer',
        transition: 'background 0.2s'
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
        <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 20, fontWeight: 600, background: q.kind === 'Catering' ? 'rgba(59,130,246,0.12)' : 'rgba(139,92,246,0.12)', color: q.kind === 'Catering' ? '#3b82f6' : '#8b5cf6' }}>{q.kind}</span>
        <Badge label={q.status} color={STATUS_COLORS[q.status] || '#5a5a7a'} />
      </div>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q.event?.name || '—'}</div>
      <div style={{ fontSize: 11, color: 'var(--text-label)', marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q.event?.client?.name || '—'}</div>
      <div style={{ fontSize: 14, fontWeight: 700, color: '#22c55e' }}>{fmt(calcTotal(q))}</div>
    </div>
  )
}

function SectionTitle({ children }) {
  return (
    <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, color: 'var(--gold)', marginBottom: 16 }}>
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

function KpiCard({ label, value, sub, icon, color }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      style={{
        background: hovered ? 'var(--bg-hover)' : 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        padding: '20px 22px',
        position: 'relative',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'background 0.2s'
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{ position: 'absolute', top: 14, right: 16, opacity: 0.1, color }}>{icon}</div>
      <div style={{ fontSize: 11, color: 'var(--text-label)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 700, color, fontFamily: "'Playfair Display', serif", marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>{sub}</div>
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

function EmptyState({ icon, text }) {
  return (
    <div style={{ fontSize: 13, color: 'var(--text-faint)', textAlign: 'center', padding: '24px 0' }}>
      <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'center', color: '#22c55e' }}>{icon}</div>
      {text}
    </div>
  )
}

const rowBorder = { borderBottom: '1px solid var(--border-row)' }
const miniCard  = { width: 40, height: 40, borderRadius: 10, background: 'var(--bg-sunken)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }

// ── Helpers de negocio ────────────────────────────────────────────────────────

function getUpcomingBirthdays(clients) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return clients
    .filter(c => c.birthdate)
    .map(c => {
      const b = new Date(c.birthdate)
      let next = new Date(today.getFullYear(), b.getMonth(), b.getDate())
      if (next < today) next = new Date(today.getFullYear() + 1, b.getMonth(), b.getDate())
      const daysUntil = Math.round((next - today) / 86400000)
      return { ...c, daysUntil }
    })
    .filter(c => c.daysUntil <= 30)
    .sort((a, b) => a.daysUntil - b.daysUntil)
}

function getCashFlow(allPayments, allSpPayments) {
  const year = new Date().getFullYear()
  return MESES.map((mes, i) => {
    const income = allPayments
      .filter(p => { const d = new Date(p.date); return d.getFullYear() === year && d.getMonth() === i })
      .reduce((a, p) => a + Number(p.amount), 0)
    const expense = allSpPayments
      .filter(p => { const d = new Date(p.createdAt); return p.status === 'Pagado' && d.getFullYear() === year && d.getMonth() === i })
      .reduce((a, p) => a + Number(p.amount), 0)
    return { mes, Ingresos: income, Egresos: expense }
  }).filter(d => d.Ingresos > 0 || d.Egresos > 0)
}

// ── Tab Resumen ───────────────────────────────────────────────────────────────

function ResumenTab({ data, activityLogs, portalQueries, loading }) {
  if (!data) return null

  const now    = new Date()
  const in30   = new Date(now.getTime() + 30 * 86400000)

  const upcomingEvents = [...data.events]
    .filter(e => { const d = new Date(e.date); return d >= now && d <= in30 && e.status !== 'Finalizado' })
    .sort((a, b) => new Date(a.date) - new Date(b.date))

  const paymentsByEvent = data.allPayments.reduce((acc, p) => { acc[p.eventId] = (acc[p.eventId] || 0) + Number(p.amount); return acc }, {})

  const totalByEvent = (eventId) => {
    const quotes = data.quotes.filter(q => q.eventId === eventId && q.status === 'Aprobado')
    const total  = quotes.reduce((a, q) => a + calcTotal(q), 0)
    const paid   = paymentsByEvent[eventId] || 0
    return { total, paid, balance: total - paid }
  }

  const pendingQuotes       = [...data.quotes].filter(q => q.status === 'Pendiente').sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  const eventsWithoutQuotes = data.events.filter(e => e.status !== 'Finalizado' && !data.quotes.some(q => q.eventId === e.id))
  const suppliersPending    = Object.values(
    data.allSpPayments.filter(p => p.status === 'Pendiente').reduce((acc, p) => {
      const k = p.supplierId
      if (!acc[k]) acc[k] = { name: p.supplier?.name || '—', total: 0, count: 0 }
      acc[k].total += Number(p.amount); acc[k].count++
      return acc
    }, {})
  ).sort((a, b) => b.total - a.total)

  const birthdays      = getUpcomingBirthdays(data.clients)
  const pendingQueries = portalQueries.filter(q => q.status === 'pending')

  const kpis = [
    { label: 'Clientes activos',   value: data.clients.filter(c => c.status === 'Activo').length,            sub: `${data.clients.length} clientes en total`,             icon: <UserCheck size={28} strokeWidth={1.5} />,  color: 'var(--gold)' },
    { label: 'Eventos en curso',   value: data.events.filter(e => e.status !== 'Finalizado').length,          sub: `${data.events.length} eventos en total`,               icon: <CalendarClock size={28} strokeWidth={1.5} />, color: '#3b82f6' },
    { label: 'Ingresos aprobados', value: fmt(data.quotes.filter(q => q.status === 'Aprobado').reduce((a, q) => a + calcTotal(q), 0)), sub: `${data.quotes.filter(q => q.status === 'Aprobado').length} cotizaciones aprobadas`, icon: <TrendingUp size={28} strokeWidth={1.5} />, color: '#22c55e' },
    { label: 'Deuda proveedores',  value: fmt(data.pendingTotal || 0),                                        sub: 'Pagos pendientes a proveedores',                       icon: <AlertCircle size={28} strokeWidth={1.5} />, color: '#ef4444' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '20px 22px' }}>
                <Skeleton height={11} width={100} style={{ marginBottom: 12 }} />
                <Skeleton height={26} width={80} style={{ marginBottom: 8 }} />
                <Skeleton height={11} width={120} />
              </div>
            ))
          : kpis.map((kpi, i) => <KpiCard key={i} {...kpi} />)
        }
      </div>

      {/* Fila 1: Próximos eventos | Pendientes | Alertas */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: 20 }}>

        {/* Próximos eventos */}
        <Card>
          <SectionTitle>Próximos 30 días</SectionTitle>
          {loading ? <Skeleton height={60} /> : upcomingEvents.length === 0 ? (
            <EmptyState icon={<CheckCircle2 size={22} />} text="Sin eventos en los próximos 30 días" />
          ) : upcomingEvents.map(ev => {
            const { day, month } = fmtDate(ev.date)
            const { total, balance } = totalByEvent(ev.id)
            return (
              <div key={ev.id} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '10px 0', ...rowBorder }}>
                <div style={miniCard}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--gold)', lineHeight: 1 }}>{day}</div>
                  <div style={{ fontSize: 9, color: 'var(--text-label)', letterSpacing: 1 }}>{month}</div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ev.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-label)', marginTop: 1 }}>{ev.client?.name || '—'}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  {total > 0 ? (
                    <>
                      <div style={{ fontSize: 11, fontWeight: 600, color: balance <= 0 ? '#22c55e' : '#f59e0b' }}>
                        {balance <= 0 ? '✓ Saldado' : fmt(balance)}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--text-faint)' }}>de {fmt(total)}</div>
                    </>
                  ) : (
                    <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>Sin cotizar</div>
                  )}
                </div>
              </div>
            )
          })}
        </Card>

        {/* Cotizaciones pendientes de aprobación */}
        <Card>
          <SectionTitle>Pendientes de aprobación</SectionTitle>
          {loading ? <Skeleton height={60} /> : pendingQuotes.length === 0 ? (
            <EmptyState icon={<CheckCircle2 size={22} />} text="Todo aprobado" />
          ) : pendingQuotes.slice(0, 6).map(q => (
            <div key={q.id} style={{ padding: '10px 0', ...rowBorder }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)', flex: 1, marginRight: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {q.event?.name || '—'}
                </div>
                <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 20, fontWeight: 600, background: 'rgba(245,158,11,0.12)', color: '#f59e0b', flexShrink: 0 }}>{q.kind}</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-label)', marginTop: 2 }}>{q.event?.client?.name || '—'}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#f59e0b', marginTop: 2 }}>{fmt(calcTotal(q))}</div>
            </div>
          ))}
        </Card>

        {/* Alertas: cumpleaños + consultas del portal */}
        <Card>
          <SectionTitle>Alertas</SectionTitle>
          {loading ? <Skeleton height={120} /> : (
            <>
              {/* Consultas del portal */}
              {pendingQueries.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-label)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <MessageSquare size={12} /> Consultas del portal ({pendingQueries.length})
                  </div>
                  {pendingQueries.slice(0, 3).map(q => (
                    <div key={q.id} style={{ padding: '8px 0', ...rowBorder }}>
                      <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {q.event?.client?.name || '—'} · {q.event?.name || '—'}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {q.question}
                      </div>
                    </div>
                  ))}
                  {pendingQueries.length > 3 && (
                    <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 6 }}>+ {pendingQueries.length - 3} más</div>
                  )}
                </div>
              )}

              {/* Cumpleaños */}
              {birthdays.length > 0 ? (
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-label)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Cake size={12} /> Cumpleaños próximos
                  </div>
                  {birthdays.slice(0, 4).map(c => (
                    <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', ...rowBorder }}>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)' }}>{c.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-label)', marginTop: 1 }}>{c.contact}</div>
                      </div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: c.daysUntil === 0 ? '#22c55e' : c.daysUntil <= 7 ? '#f59e0b' : 'var(--text-faint)', flexShrink: 0, marginLeft: 8 }}>
                        {c.daysUntil === 0 ? '¡Hoy!' : `en ${c.daysUntil}d`}
                      </div>
                    </div>
                  ))}
                </div>
              ) : pendingQueries.length === 0 ? (
                <EmptyState icon={<CheckCircle2 size={22} />} text="Sin alertas pendientes" />
              ) : null}
            </>
          )}
        </Card>
      </div>

      {/* Fila 2: Sin cotizar | Deuda proveedores | Actividad */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', gap: 20 }}>

        {/* Eventos sin cotizar */}
        <Card>
          <SectionTitle>Eventos sin cotizar</SectionTitle>
          {loading ? <Skeleton height={60} /> : eventsWithoutQuotes.length === 0 ? (
            <EmptyState icon={<CheckCircle2 size={22} />} text="Todos cotizados" />
          ) : eventsWithoutQuotes.slice(0, 6).map(ev => {
            const { day, month } = fmtDate(ev.date)
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
                <Badge label={ev.status} color={STATUS_COLORS[ev.status] || '#5a5a7a'} />
              </div>
            )
          })}
        </Card>

        {/* Deuda con proveedores */}
        <Card>
          <SectionTitle>Deuda con proveedores</SectionTitle>
          {loading ? <Skeleton height={60} /> : suppliersPending.length === 0 ? (
            <EmptyState icon={<CheckCircle2 size={22} />} text="Sin deudas pendientes" />
          ) : suppliersPending.slice(0, 6).map((s, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', ...rowBorder }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)' }}>{s.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-label)' }}>{s.count} pago{s.count > 1 ? 's' : ''} pendiente{s.count > 1 ? 's' : ''}</div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#ef4444' }}>{fmt(s.total)}</div>
            </div>
          ))}
        </Card>

        {/* Actividad reciente */}
        <Card style={{ maxHeight: 360, overflowY: 'auto' }}>
          <SectionTitle>Actividad reciente</SectionTitle>
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, padding: '10px 0', ...rowBorder }}>
                <Skeleton height={30} width={30} style={{ borderRadius: 8, flexShrink: 0 }} />
                <div style={{ flex: 1 }}><Skeleton height={12} style={{ marginBottom: 5 }} /><Skeleton height={10} width="40%" /></div>
              </div>
            ))
          ) : activityLogs.length === 0 ? (
            <EmptyState icon={<Package size={22} />} text="Sin actividad reciente" />
          ) : activityLogs.map(a => (
            <div key={a.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '10px 0', ...rowBorder }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: `${ACTION_COLORS[a.action] || 'var(--gold)'}18`, border: `1px solid ${ACTION_COLORS[a.action] || 'var(--gold)'}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: ACTION_COLORS[a.action] || 'var(--gold)', flexShrink: 0 }}>
                {ACTION_ICONS[a.action] || <FilePlus size={13} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.label}</div>
                {a.detail && <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.detail}</div>}
                <div style={{ fontSize: 10, color: 'var(--text-faint)', marginTop: 2 }}>{fmtAgo(a.createdAt)}</div>
              </div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  )
}

// ── Tab Finanzas ──────────────────────────────────────────────────────────────

function FinanzasTab({ data, loading }) {
  if (!data) return null

  const totalCobrado   = data.allPayments.reduce((a, p) => a + Number(p.amount), 0)
  const totalGastado   = data.allSpPayments.filter(p => p.status === 'Pagado').reduce((a, p) => a + Number(p.amount), 0)
  const margenNeto     = totalCobrado - totalGastado

  const paymentsByEvent = data.allPayments.reduce((acc, p) => { acc[p.eventId] = (acc[p.eventId] || 0) + Number(p.amount); return acc }, {})

  const pendingBalances = data.events
    .map(ev => {
      const evQuotes = data.quotes.filter(q => q.eventId === ev.id && q.status === 'Aprobado')
      const total    = evQuotes.reduce((a, q) => a + calcTotal(q), 0)
      const paid     = paymentsByEvent[ev.id] || 0
      return { ...ev, total, paid, balance: total - paid }
    })
    .filter(ev => ev.balance > 100 && ev.status !== 'Finalizado')
    .sort((a, b) => b.balance - a.balance)

  const quoteStatusData = (() => {
    const counts = {}
    data.quotes.forEach(q => { counts[q.status] = (counts[q.status] || 0) + 1 })
    return Object.entries(counts).map(([name, value]) => ({ name, value }))
  })()

  const eventsByMonth = (() => {
    const counts = Array(12).fill(0)
    data.events.forEach(e => { counts[new Date(e.date).getMonth()]++ })
    return counts.map((value, i) => ({ mes: MESES[i], value })).filter(d => d.value > 0)
  })()

  const cashFlow = getCashFlow(data.allPayments, data.allSpPayments)

  const recentQuotes = [...data.quotes].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5)

  const pipeline = data.quotes
    .filter(q => q.status === 'Pendiente')
    .reduce((a, q) => a + calcTotal(q), 0)

  const kpis = [
    { label: 'Total cobrado',         value: fmt(totalCobrado), sub: `${data.allPayments.length} cobro${data.allPayments.length !== 1 ? 's' : ''} registrado${data.allPayments.length !== 1 ? 's' : ''}`, icon: <Wallet size={28} strokeWidth={1.5} />, color: '#22c55e' },
    { label: 'Total pagado proveedores', value: fmt(totalGastado), sub: 'Pagos a proveedores confirmados',  icon: <TrendingDown size={28} strokeWidth={1.5} />, color: '#ef4444' },
    { label: 'Margen neto',           value: fmt(margenNeto),   sub: 'Cobrado menos gastado en proveedores', icon: <TrendingUp size={28} strokeWidth={1.5} />, color: margenNeto >= 0 ? '#22c55e' : '#ef4444' },
    { label: 'En propuesta',          value: fmt(pipeline),     sub: `${data.quotes.filter(q => q.status === 'Pendiente').length} cotizaciones pendientes`, icon: <AlertCircle size={28} strokeWidth={1.5} />, color: '#f59e0b' },
  ]

  const [activeIndex, setActiveIndex] = useState(-1)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '20px 22px' }}>
                <Skeleton height={11} width={100} style={{ marginBottom: 12 }} />
                <Skeleton height={26} width={80} style={{ marginBottom: 8 }} />
                <Skeleton height={11} width={120} />
              </div>
            ))
          : kpis.map((kpi, i) => <KpiCard key={i} {...kpi} />)
        }
      </div>

      {/* Flujo de caja */}
      <Card>
        <SectionTitle>Flujo de caja {new Date().getFullYear()}</SectionTitle>
        {loading ? <Skeleton height={220} /> : cashFlow.length === 0 ? (
          <div style={{ fontSize: 13, color: 'var(--text-faint)', textAlign: 'center', padding: '40px 0' }}>Sin movimientos registrados este año</div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={cashFlow} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
              <XAxis dataKey="mes" tick={{ fontSize: 11, fill: 'var(--text-label)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--text-label)' }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip contentStyle={tooltipStyle} itemStyle={tooltipItemStyle} labelStyle={tooltipLabelStyle} formatter={(v) => fmt(v)} cursor={{ fill: 'rgba(201,168,76,0.4)' }} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: 'var(--text-primary)' }} />
              <Bar dataKey="Ingresos" fill="#22c55e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Egresos"  fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* Fila 2: Saldos pendientes | Estado cotizaciones + Eventos por mes */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', gap: 20 }}>

        {/* Saldos pendientes por evento */}
        <Card>
          <SectionTitle>Saldos pendientes por evento</SectionTitle>
          {loading ? <Skeleton height={120} /> : pendingBalances.length === 0 ? (
            <EmptyState icon={<CheckCircle2 size={22} />} text="Todos los eventos están saldados" />
          ) : pendingBalances.map(ev => <PendingBalanceCard key={ev.id} ev={ev} />)}
        </Card>

        {/* Estado de cotizaciones */}
        <Card>
          <SectionTitle>Estado de cotizaciones</SectionTitle>
          {loading ? <Skeleton height={180} /> : quoteStatusData.length === 0 ? (
            <div style={{ fontSize: 13, color: 'var(--text-faint)', textAlign: 'center', padding: '20px 0' }}>Sin cotizaciones</div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie 
                  data={quoteStatusData} 
                  cx="50%" 
                  cy="50%" 
                  innerRadius={45} 
                  outerRadius={70} 
                  paddingAngle={3} 
                  dataKey="value"
                  activeIndex={activeIndex}
                  activeShape={(props) => (
                    <Sector {...props} outerRadius={75} fill={props.fill} stroke="var(--gold)" strokeWidth={2} />
                  )}
                  onMouseEnter={(data, index) => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(-1)}
                  label={({ percent }) => percent > 0.1 ? `${(percent * 100).toFixed(0)}%` : ''}
                  labelStyle={{ fontSize: 11, fill: 'var(--text-primary)' }}
                >
                  {quoteStatusData.map((entry, i) => (
                    <Cell key={i} fill={STATUS_COLORS[entry.name] || CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} itemStyle={tooltipItemStyle} labelStyle={tooltipLabelStyle} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: 'var(--text-primary)' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Eventos por mes */}
        <Card>
          <SectionTitle>Eventos por mes</SectionTitle>
          {loading ? <Skeleton height={180} /> : eventsByMonth.length === 0 ? (
            <div style={{ fontSize: 13, color: 'var(--text-faint)', textAlign: 'center', padding: '20px 0' }}>Sin eventos</div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={eventsByMonth} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="mes" tick={{ fontSize: 10, fill: 'var(--text-label)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--text-label)' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} itemStyle={tooltipItemStyle} labelStyle={tooltipLabelStyle} cursor={{ fill: 'rgba(201,168,76,0.4)' }} />
                <Bar dataKey="value" name="Eventos" fill="var(--gold)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* Cotizaciones recientes */}
      <Card>
        <SectionTitle>Cotizaciones recientes</SectionTitle>
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} style={{ padding: '11px 0', ...rowBorder }}><Skeleton height={13} style={{ marginBottom: 6 }} /><Skeleton height={11} width="50%" /></div>
          ))
        ) : recentQuotes.length === 0 ? (
          <div style={{ fontSize: 13, color: 'var(--text-faint)', textAlign: 'center', padding: '20px 0' }}>No hay cotizaciones</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
            {recentQuotes.map(q => <QuoteCard key={q.id} q={q} />)}
          </div>
        )}
      </Card>
    </div>
  )
}


// ── Tab Calendario ────────────────────────────────────────────────────────────

const MESES_FULL = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const DIAS_SEMANA = ['Lu','Ma','Mi','Ju','Vi','Sá','Do']

const EV_COLORS = {
  Confirmado: { bg: '#22c55e', text: '#fff', dot: '#16a34a' },
  Propuesta:  { bg: '#f59e0b', text: '#fff', dot: '#d97706' },
  Finalizado: { bg: '#8b5cf6', text: '#fff', dot: '#7c3aed' },
}

function MiniMonth({ year, month, events, onEventClick }) {
  const firstDay = new Date(year, month, 1)
  const lastDay  = new Date(year, month + 1, 0)
  const startDow = (firstDay.getDay() + 6) % 7 // 0=Lun
  const totalDays = lastDay.getDate()

  // Map day -> events
  const byDay = {}
  events.forEach(ev => {
    const d = new Date(ev.date)
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate()
      if (!byDay[day]) byDay[day] = []
      byDay[day].push(ev)
    }
  })

  const cells = []
  for (let i = 0; i < startDow; i++) cells.push(null)
  for (let d = 1; d <= totalDays; d++) cells.push(d)

  const today = new Date()
  const isToday = (d) => today.getFullYear() === year && today.getMonth() === month && today.getDate() === d

  return (
    <div style={{
      background: 'var(--bg-surface)', border: '1px solid var(--border)',
      borderRadius: 12, padding: '14px 12px', display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      {/* Nombre del mes */}
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textAlign: 'center', letterSpacing: 0.5 }}>
        {MESES_FULL[month]}
      </div>

      {/* Cabecera días semana */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1 }}>
        {DIAS_SEMANA.map(d => (
          <div key={d} style={{ fontSize: 9, color: 'var(--text-faint)', textAlign: 'center', fontWeight: 600, letterSpacing: 0.5 }}>
            {d}
          </div>
        ))}
      </div>

      {/* Grilla de días */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
        {cells.map((day, i) => {
          if (!day) return <div key={`e${i}`} />
          const evs = byDay[day] || []
          const hasEvent = evs.length > 0
          // Color del primer evento del día (si hay varios, prioridad: Confirmado > Propuesta > Finalizado)
          const priority = ['Confirmado','Propuesta','Finalizado']
          const topEv = evs.sort((a, b) => priority.indexOf(a.status) - priority.indexOf(b.status))[0]
          const colors = topEv ? EV_COLORS[topEv.status] || EV_COLORS.Propuesta : null

          return (
            <div
              key={day}
              onClick={() => hasEvent && onEventClick(evs, year, month, day)}
              title={hasEvent ? evs.map(e => e.name).join(', ') : undefined}
              style={{
                aspectRatio: '1',
                borderRadius: 5,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, fontWeight: hasEvent ? 700 : 400,
                cursor: hasEvent ? 'pointer' : 'default',
                background: hasEvent ? colors.bg + '22' : isToday(day) ? 'var(--gold-bg)' : 'transparent',
                color: hasEvent ? colors.bg : isToday(day) ? 'var(--gold)' : 'var(--text-muted)',
                border: isToday(day) ? '1px solid var(--gold-border)' : hasEvent ? `1px solid ${colors.bg}44` : '1px solid transparent',
                position: 'relative',
                transition: 'all 0.15s',
              }}
            >
              {day}
              {evs.length > 1 && (
                <div style={{
                  position: 'absolute', top: 1, right: 2,
                  fontSize: 7, fontWeight: 800,
                  color: colors.bg,
                  lineHeight: 1,
                }}>
                  {evs.length}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Leyenda de eventos del mes */}
      {Object.keys(byDay).length > 0 && (
        <div style={{ borderTop: '1px solid var(--border-row)', paddingTop: 6, display: 'flex', flexDirection: 'column', gap: 3 }}>
          {Object.entries(byDay).slice(0, 3).map(([day, evs]) => (
            evs.map(ev => {
              const c = EV_COLORS[ev.status] || EV_COLORS.Propuesta
              return (
                <div key={ev.id} style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer' }} onClick={() => onEventClick([ev], year, month, Number(day))}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: c.dot, flexShrink: 0 }} />
                  <div style={{ fontSize: 10, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                    {day}/{String(month+1).padStart(2,'0')} · {ev.name}
                  </div>
                </div>
              )
            })
          ))}
          {Object.keys(byDay).length > 3 && (
            <div style={{ fontSize: 10, color: 'var(--text-faint)' }}>+ {Object.values(byDay).flat().length - Object.entries(byDay).slice(0,3).reduce((a,[,v])=>a+v.length,0)} más…</div>
          )}
        </div>
      )}
    </div>
  )
}

function EventPopover({ evs, year, month, day, onClose }) {
  const [weather, setWeather] = useState(null)
  const [weatherLoading, setWeatherLoading] = useState(false)
  const [weatherError, setWeatherError] = useState(false)

  useEffect(() => {
    if (!year || month == null || day == null) return
    const date = new Date(year, month, day).toISOString().slice(0, 10)

    setWeatherLoading(true)
    setWeatherError(false)

    const fetchWeather = async () => {
      try {
        const LAT = -30.2283 // San Cristóbal, Santa Fe
        const LON = -61.4474
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto&start_date=${date}&end_date=${date}`
        )
        const data = await res.json()
        const code = data.daily?.weathercode?.[0]
        const max = data.daily?.temperature_2m_max?.[0]
        const min = data.daily?.temperature_2m_min?.[0]
        if (typeof code === 'undefined') throw new Error('no forecast')
        setWeather({ code, max, min })
      } catch (e) {
        setWeather(null)
        setWeatherError(true)
      } finally {
        setWeatherLoading(false)
      }
    }

    fetchWeather()
  }, [year, month, day])

  const weatherInfo = weather ? (WEATHER_CODES[weather.code] || { label: 'Clima', icon: <ThermometerSun size={14} />, color: 'var(--text-muted)' }) : null

  if (!evs || evs.length === 0) return null
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.5)',
    }} onClick={onClose}>
      <div style={{
        background: 'var(--bg-surface)', border: '1px solid var(--border-strong)',
        borderRadius: 16, padding: 24, minWidth: 320, maxWidth: 440,
        boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
              {evs.length === 1 ? 'Evento' : `${evs.length} eventos`}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 11, color: 'var(--text-faint)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><CalendarClock size={14} /> {day}/{String(month + 1).padStart(2, '0')}/{year}</div>
              {weatherInfo && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, borderRadius: 12, background: `${weatherInfo.color}20`, color: weatherInfo.color }}>
                    {weatherInfo.icon}
                  </span>
                  {weatherLoading ? 'Cargando clima…' : weather ? `${Math.round(weather.max)}° / ${Math.round(weather.min)}°` : 'Clima no disponible'}
                </div>
              )}
            </div>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 14 }}>
            ✕
          </button>
        </div>
        {evs.map(ev => {
          const c = EV_COLORS[ev.status] || EV_COLORS.Propuesta
          const d = new Date(ev.date)
          return (
            <div key={ev.id} style={{
              padding: '12px 14px', borderRadius: 10, marginBottom: 8,
              background: c.bg + '14', border: `1px solid ${c.bg}30`,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{ev.name}</div>
                <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, fontWeight: 700, background: c.bg + '22', color: c.bg }}>
                  {ev.status}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: 'var(--text-muted)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><User size={14} />{ev.client?.name || '—'}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><MapPin size={14} />{ev.venue || '—'}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Clock size={14} />{ev.time || '—'}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Users size={14} />{ev.guests} invitados</div>
              </div>
            </div>
          )
        })}
        <button onClick={onClose} style={{
          width: '100%', padding: '10px', marginTop: 8,
          background: 'transparent', border: '1px solid var(--border)',
          borderRadius: 9, color: 'var(--text-muted)', fontSize: 13,
          cursor: 'pointer', fontWeight: 600,
        }}>
          Cerrar
        </button>
      </div>
    </div>
  )
}

function CalendarioTab({ data, loading }) {
  const [year, setYear] = useState(new Date().getFullYear())
  const [popover, setPopover] = useState(null) // { evs, year, month, day }

  if (!data) return null

  const events = data.events || []

  // Stats del año
  const yearEvents = events.filter(e => new Date(e.date).getFullYear() === year)
  const confirmed  = yearEvents.filter(e => e.status === 'Confirmado').length
  const proposals  = yearEvents.filter(e => e.status === 'Propuesta').length
  const finished   = yearEvents.filter(e => e.status === 'Finalizado').length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Header año + navegación */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'var(--bg-surface)', border: '1px solid var(--border)',
        borderRadius: 16, padding: '16px 24px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button onClick={() => setYear(y => y - 1)} style={{
            width: 34, height: 34, borderRadius: 8,
            background: 'var(--bg-sunken)', border: '1px solid var(--border)',
            color: 'var(--text-muted)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <ChevronLeft size={16} />
          </button>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', minWidth: 60, textAlign: 'center' }}>
            {year}
          </div>
          <button onClick={() => setYear(y => y + 1)} style={{
            width: 34, height: 34, borderRadius: 8,
            background: 'var(--bg-sunken)', border: '1px solid var(--border)',
            color: 'var(--text-muted)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <ChevronRight size={16} />
          </button>
          <button onClick={() => setYear(new Date().getFullYear())} style={{
            padding: '5px 12px', borderRadius: 8, fontSize: 11, fontWeight: 600,
            background: 'var(--gold-bg)', border: '1px solid var(--gold-border)',
            color: 'var(--gold)', cursor: 'pointer',
          }}>
            Hoy
          </button>
        </div>

        {/* Stats del año */}
        <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
          {loading ? null : (
            <>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#22c55e' }}>{confirmed}</div>
                <div style={{ fontSize: 10, color: 'var(--text-faint)', letterSpacing: 0.5 }}>Confirmados</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#f59e0b' }}>{proposals}</div>
                <div style={{ fontSize: 10, color: 'var(--text-faint)', letterSpacing: 0.5 }}>Propuestas</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#8b5cf6' }}>{finished}</div>
                <div style={{ fontSize: 10, color: 'var(--text-faint)', letterSpacing: 0.5 }}>Finalizados</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{yearEvents.length}</div>
                <div style={{ fontSize: 10, color: 'var(--text-faint)', letterSpacing: 0.5 }}>Total</div>
              </div>

              {/* Leyenda */}
              <div style={{ display: 'flex', gap: 12, marginLeft: 8, paddingLeft: 20, borderLeft: '1px solid var(--border)' }}>
                {[['Confirmado','#22c55e'],['Propuesta','#f59e0b'],['Finalizado','#8b5cf6']].map(([label, color]) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{label}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Grilla de 12 meses */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, height: 200 }}>
              <div style={{ padding: 14 }}><Skeleton height={12} width={60} style={{ margin: '0 auto' }} /></div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {Array.from({ length: 12 }).map((_, m) => (
            <MiniMonth
              key={m}
              year={year}
              month={m}
              events={events}
              onEventClick={(evs, y, mo, d) => setPopover({ evs, year: y, month: mo, day: d })}
            />
          ))}
        </div>
      )}

      {/* Popover de evento */}
      {popover && <EventPopover evs={popover.evs} year={popover.year} month={popover.month} day={popover.day} onClose={() => setPopover(null)} />}
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────

const TABS = [
  { id: 'resumen',   label: 'Resumen',    Icon: LayoutDashboard },
  { id: 'finanzas',  label: 'Finanzas',   Icon: BarChart2 },
  { id: 'calendario',label: 'Calendario', Icon: CalendarDays },
]

export default function Dashboard() {
  const [tab,           setTab]          = useState('resumen')
  const [data,          setData]         = useState(null)
  const [activityLogs,  setActivity]     = useState([])
  const [portalQueries, setPortalQueries] = useState([])
  const [loading,       setLoading]      = useState(true)

  useEffect(() => {
    const safeGet = async (url) => {
      try { return (await api.get(url)).data } catch { return null }
    }

    const fetchAll = async () => {
      try {
        const [clientsRes, eventsRes, quotesRes, suppliersRes] = await Promise.all([
          api.get('/api/clients'),
          api.get('/api/events'),
          api.get('/api/quotes'),
          api.get('/api/suppliers'),
        ])
        const [spPending, allPayments, allSpPayments, activityRes, queriesRes] = await Promise.all([
          safeGet('/api/supplier-payments/pending-total'),
          safeGet('/api/payments/all'),
          safeGet('/api/supplier-payments/all'),
          safeGet('/api/activity?limit=60'),
          safeGet('/api/portal-queries'),
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
        setActivity(activityRes || [])
        setPortalQueries(queriesRes || [])
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [])

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 900, color: 'var(--text-primary)' }}>Dashboard</div>
          <div style={{ fontSize: 13, color: 'var(--text-label)', marginTop: 4 }}>
            {new Date().toLocaleDateString('es-AR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 4, width: 'fit-content' }}>
        {TABS.map(({ id, label, Icon }) => (
          <button key={id} onClick={() => setTab(id)} style={{
            padding: '8px 18px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'all 0.15s',
            background: tab === id ? 'linear-gradient(135deg, var(--gold), var(--gold-light))' : 'transparent',
            color: tab === id ? '#09090f' : 'var(--text-muted)',
            display: 'flex', alignItems: 'center', gap: 7,
          }}>
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {tab === 'resumen'  && <ResumenTab  data={data} activityLogs={activityLogs} portalQueries={portalQueries} loading={loading} />}
      {tab === 'finanzas'   && <FinanzasTab   data={data} loading={loading} />}
      {tab === 'calendario' && <CalendarioTab data={data} loading={loading} />}
    </div>
  )
}