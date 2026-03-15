import { useState } from 'react'
import { Wallet, TrendingDown, TrendingUp, AlertCircle } from 'lucide-react'
import { PieChart, Pie, Cell, Sector, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import {
  fmt, calcTotal, getCashFlow,
  STATUS_COLORS, CHART_COLORS, MESES,
  tooltipStyle, tooltipItemStyle, tooltipLabelStyle, rowBorder,
  SectionTitle, Card, KpiCard, Skeleton, EmptyState,
  PendingBalanceCard, QuoteCard,
} from './dashboardUtils'

export default function FinanzasTab({ data, loading }) {
  if (!data) return null

  const totalCobrado = data.allPayments.reduce((a, p) => a + Number(p.amount), 0)
  const totalGastado = data.allSpPayments.filter(p => p.status === 'Pagado').reduce((a, p) => a + Number(p.amount), 0)
  const margenNeto   = totalCobrado - totalGastado

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

  const cashFlow    = getCashFlow(data.allPayments, data.allSpPayments)
  const recentQuotes = [...data.quotes].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5)
  const pipeline    = data.quotes.filter(q => q.status === 'Pendiente').reduce((a, q) => a + calcTotal(q), 0)

  const kpis = [
    { label: 'Total cobrado',            value: fmt(totalCobrado), sub: `${data.allPayments.length} cobro${data.allPayments.length !== 1 ? 's' : ''} registrado${data.allPayments.length !== 1 ? 's' : ''}`, icon: <Wallet size={28} strokeWidth={1.5} />, color: '#22c55e' },
    { label: 'Total pagado proveedores', value: fmt(totalGastado), sub: 'Pagos a proveedores confirmados',          icon: <TrendingDown size={28} strokeWidth={1.5} />, color: '#ef4444' },
    { label: 'Margen neto',              value: fmt(margenNeto),   sub: 'Cobrado menos gastado en proveedores',     icon: <TrendingUp  size={28} strokeWidth={1.5} />, color: margenNeto >= 0 ? '#22c55e' : '#ef4444' },
    { label: 'En propuesta',             value: fmt(pipeline),     sub: `${data.quotes.filter(q => q.status === 'Pendiente').length} cotizaciones pendientes`, icon: <AlertCircle size={28} strokeWidth={1.5} />, color: '#f59e0b' },
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

      {/* Fila 2: Saldos pendientes | Estado cotizaciones | Eventos por mes */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', gap: 20 }}>

        <Card>
          <SectionTitle>Saldos pendientes por evento</SectionTitle>
          {loading ? <Skeleton height={120} /> : pendingBalances.length === 0 ? (
            <EmptyState icon={<></>} text="Todos los eventos están saldados" />
          ) : pendingBalances.map(ev => <PendingBalanceCard key={ev.id} ev={ev} />)}
        </Card>

        <Card>
          <SectionTitle>Estado de cotizaciones</SectionTitle>
          {loading ? <Skeleton height={180} /> : quoteStatusData.length === 0 ? (
            <div style={{ fontSize: 13, color: 'var(--text-faint)', textAlign: 'center', padding: '20px 0' }}>Sin cotizaciones</div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={quoteStatusData}
                  cx="50%" cy="50%"
                  innerRadius={45} outerRadius={70}
                  paddingAngle={3} dataKey="value"
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
