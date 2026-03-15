import { UserCheck, CalendarClock, TrendingUp, AlertCircle, CheckCircle2, MessageSquare, Cake, FilePlus, Package } from 'lucide-react'
import {
  fmt, fmtDate, fmtAgo, calcTotal,
  STATUS_COLORS, ACTION_ICONS, ACTION_COLORS, rowBorder, miniCard,
  getUpcomingBirthdays,
  Badge, SectionTitle, Card, KpiCard, Skeleton, EmptyState,
} from './dashboardUtils'

export default function ResumenTab({ data, activityLogs, portalQueries, loading }) {
  if (!data) return null

  const now  = new Date()
  const in30 = new Date(now.getTime() + 30 * 86400000)

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

        <Card>
          <SectionTitle>Alertas</SectionTitle>
          {loading ? <Skeleton height={120} /> : (
            <>
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
