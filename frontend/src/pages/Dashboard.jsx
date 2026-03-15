import { useState, useEffect } from 'react'
import { LayoutDashboard, BarChart2, CalendarDays } from 'lucide-react'
import api from '../api/axios'
import ResumenTab   from '../components/dashboard/ResumenTab'
import FinanzasTab  from '../components/dashboard/FinanzasTab'
import CalendarioTab from '../components/dashboard/CalendarioTab'

const TABS = [
  { id: 'resumen',    label: 'Resumen',    Icon: LayoutDashboard },
  { id: 'finanzas',   label: 'Finanzas',   Icon: BarChart2 },
  { id: 'calendario', label: 'Calendario', Icon: CalendarDays },
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
          safeGet('/api/activity?limit=20'),
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

      {tab === 'resumen'    && <ResumenTab    data={data} activityLogs={activityLogs} portalQueries={portalQueries} loading={loading} />}
      {tab === 'finanzas'   && <FinanzasTab   data={data} loading={loading} />}
      {tab === 'calendario' && <CalendarioTab data={data} loading={loading} />}
    </div>
  )
}
