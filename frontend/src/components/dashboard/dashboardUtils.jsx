import { useState } from 'react'
import { ThermometerSun, Cloud, CloudRain, CloudSnow, CloudLightning, FilePlus, CheckCircle2, AlertCircle, TrendingUp, ArrowDownCircle, Package } from 'lucide-react'

// ── Formatters ────────────────────────────────────────────────────────────────

export const fmt = (n) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)

export const fmtDate = (str) => {
  const d = new Date(str)
  return { day: d.getDate(), month: d.toLocaleString('es', { month: 'short' }).toUpperCase() }
}

export const fmtAgo = (str) => {
  const diff  = Date.now() - new Date(str).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins  < 60) return `Hace ${mins} min`
  if (hours < 24) return `Hace ${hours} hora${hours > 1 ? 's' : ''}`
  if (days  < 7)  return `Hace ${days} día${days > 1 ? 's' : ''}`
  return new Date(str).toLocaleDateString('es-AR')
}

export const calcTotal = (q) => {
  const items = (q.items || []).reduce((a, i) => a + i.quantity * i.unitPrice, 0)
  return q.kind === 'Catering' ? (q.covers || 0) * (q.pricePerCover || 0) + items : items
}

// ── Constantes ────────────────────────────────────────────────────────────────

export const WEATHER_CODES = {
  0:  { label: 'Despejado',            icon: <ThermometerSun size={14} />, color: '#f59e0b' },
  1:  { label: 'Principalmente claro', icon: <ThermometerSun size={14} />, color: '#f59e0b' },
  2:  { label: 'Parcialmente nublado', icon: <Cloud size={14} />,          color: '#64748b' },
  3:  { label: 'Nublado',              icon: <Cloud size={14} />,          color: '#64748b' },
  45: { label: 'Niebla',               icon: <Cloud size={14} />,          color: '#64748b' },
  48: { label: 'Niebla helada',        icon: <Cloud size={14} />,          color: '#64748b' },
  51: { label: 'Llovizna ligera',      icon: <CloudRain size={14} />,      color: '#3b82f6' },
  53: { label: 'Llovizna',             icon: <CloudRain size={14} />,      color: '#3b82f6' },
  55: { label: 'Llovizna intensa',     icon: <CloudRain size={14} />,      color: '#3b82f6' },
  61: { label: 'Lluvia ligera',        icon: <CloudRain size={14} />,      color: '#3b82f6' },
  63: { label: 'Lluvia',               icon: <CloudRain size={14} />,      color: '#3b82f6' },
  65: { label: 'Lluvia intensa',       icon: <CloudRain size={14} />,      color: '#3b82f6' },
  66: { label: 'Aguanieve ligera',     icon: <CloudSnow size={14} />,      color: '#60a5fa' },
  67: { label: 'Aguanieve intensa',    icon: <CloudSnow size={14} />,      color: '#60a5fa' },
  71: { label: 'Nieve ligera',         icon: <CloudSnow size={14} />,      color: '#60a5fa' },
  73: { label: 'Nieve',                icon: <CloudSnow size={14} />,      color: '#60a5fa' },
  75: { label: 'Nieve intensa',        icon: <CloudSnow size={14} />,      color: '#60a5fa' },
  80: { label: 'Lluvias dispersas',    icon: <CloudRain size={14} />,      color: '#3b82f6' },
  81: { label: 'Lluvias',              icon: <CloudRain size={14} />,      color: '#3b82f6' },
  82: { label: 'Lluvias fuertes',      icon: <CloudRain size={14} />,      color: '#3b82f6' },
  95: { label: 'Tormenta eléctrica',   icon: <CloudLightning size={14} />, color: '#f97316' },
  96: { label: 'Tormenta con granizo', icon: <CloudLightning size={14} />, color: '#f97316' },
  99: { label: 'Tormenta grave',       icon: <CloudLightning size={14} />, color: '#f97316' },
}

export const STATUS_COLORS = {
  Confirmado: '#22c55e', Propuesta: '#f59e0b', Finalizado: '#8b5cf6',
  Aprobado:   '#22c55e', Pendiente: '#f59e0b', Rechazado:  '#ef4444',
}

export const CHART_COLORS = ['#22c55e', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#c9a84c']

export const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

export const ACTION_ICONS = {
  create:    <FilePlus    size={13} strokeWidth={1.75} />,
  update:    <CheckCircle2 size={13} strokeWidth={1.75} />,
  delete:    <AlertCircle size={13} strokeWidth={1.75} />,
  status:    <TrendingUp  size={13} strokeWidth={1.75} />,
  payment:   <ArrowDownCircle size={13} strokeWidth={1.75} />,
  file:      <Package     size={13} strokeWidth={1.75} />,
  checklist: <CheckCircle2 size={13} strokeWidth={1.75} />,
}

export const ACTION_COLORS = {
  create: 'var(--gold)', update: '#3b82f6', delete: '#ef4444',
  status: '#8b5cf6', payment: '#22c55e', file: '#06b6d4', checklist: '#f97316',
}

export const tooltipStyle     = { background: 'var(--chart-tooltip-bg)', border: '1px solid var(--chart-tooltip-border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 12 }
export const tooltipItemStyle  = { color: 'var(--text-primary)', fontSize: 12 }
export const tooltipLabelStyle = { color: 'var(--text-primary)', fontSize: 12 }

export const rowBorder = { borderBottom: '1px solid var(--border-row)' }
export const miniCard  = { width: 40, height: 40, borderRadius: 10, background: 'var(--bg-sunken)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }

// ── Business helpers ──────────────────────────────────────────────────────────

export function getUpcomingBirthdays(clients) {
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

export function getCashFlow(allPayments, allSpPayments) {
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

// ── Shared components ─────────────────────────────────────────────────────────

export function Badge({ label, color }) {
  return (
    <span style={{ fontSize: 10, padding: '3px 10px', borderRadius: 20, fontWeight: 600, background: `${color}20`, color, whiteSpace: 'nowrap' }}>
      {label}
    </span>
  )
}

export function SectionTitle({ children }) {
  return (
    <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, color: 'var(--gold)', marginBottom: 16 }}>
      {children}
    </div>
  )
}

export function Card({ children, style = {} }) {
  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, ...style }}>
      {children}
    </div>
  )
}

export function KpiCard({ label, value, sub, icon, color }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      style={{
        background: hovered ? 'var(--bg-hover)' : 'var(--bg-surface)',
        border: '1px solid var(--border)', borderRadius: 16, padding: '20px 22px',
        position: 'relative', overflow: 'hidden', cursor: 'pointer', transition: 'background 0.2s',
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

export function Skeleton({ height = 20, width = '100%', style = {} }) {
  return (
    <div style={{
      height, width, borderRadius: 6,
      background: 'linear-gradient(90deg, var(--bg-sunken) 25%, var(--border) 50%, var(--bg-sunken) 75%)',
      backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite', ...style,
    }} />
  )
}

export function EmptyState({ icon, text }) {
  return (
    <div style={{ fontSize: 13, color: 'var(--text-faint)', textAlign: 'center', padding: '24px 0' }}>
      <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'center', color: '#22c55e' }}>{icon}</div>
      {text}
    </div>
  )
}

export function PendingBalanceCard({ ev }) {
  const [hovered, setHovered] = useState(false)
  const pct = ev.total > 0 ? Math.min((ev.paid / ev.total) * 100, 100) : 0
  return (
    <div
      style={{ padding: '10px 0', ...rowBorder, background: hovered ? 'var(--bg-hover)' : 'transparent', cursor: 'pointer', transition: 'background 0.2s' }}
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

export function QuoteCard({ q }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      style={{ padding: '14px 16px', background: hovered ? 'var(--bg-hover)' : 'var(--bg-sunken)', borderRadius: 12, border: '1px solid var(--border)', cursor: 'pointer', transition: 'background 0.2s' }}
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
