import { useState, useEffect } from 'react'
import { MessageSquare, CheckCheck, Clock, ExternalLink } from 'lucide-react'
import api from '../api/axios'
import { useToast } from '../components/Toast'

const fmtDate = (str) =>
  new Date(str).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })
const fmtTime = (str) =>
  new Date(str).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })

function buildWhatsAppUrl(phone, eventName, question) {
  const clean = phone.replace(/\D/g, '')
  const number = clean.startsWith('0') ? `54${clean.slice(1)}` : clean.startsWith('54') ? clean : `54${clean}`
  const msg = encodeURIComponent(
    `Hola! Te escribimos desde Haus en relación al evento *${eventName}*.\n\nNos llegó tu consulta: "${question}"\n\n`
  )
  return `https://wa.me/${number}?text=${msg}`
}

export default function PortalQueries() {
  const toast = useToast()
  const [queries, setQueries]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [filter, setFilter]     = useState('pending')
  const [resolving, setResolving] = useState(null)

  const fetch = async () => {
    try {
      const res = await api.get('/api/portal-queries')
      setQueries(res.data)
    } catch { toast('Error al cargar consultas') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetch() }, [])

  const resolve = async (id) => {
    setResolving(id)
    try {
      await api.patch(`/api/portal-queries/${id}/resolve`)
      setQueries(prev => prev.map(q => q.id === id ? { ...q, status: 'resolved' } : q))
      toast('Consulta marcada como resuelta', 'success')
    } catch { toast('Error al actualizar') }
    finally { setResolving(null) }
  }

  const filtered = queries.filter(q => filter === 'all' || q.status === filter)
  const pendingCount = queries.filter(q => q.status === 'pending').length

  const btnFilter = (val) => ({
    padding: '6px 16px', borderRadius: 20, fontSize: 12, fontWeight: 600,
    cursor: 'pointer', border: '1px solid',
    background: filter === val ? 'var(--gold)' : 'transparent',
    color: filter === val ? '#09090f' : 'var(--text-muted)',
    borderColor: filter === val ? 'var(--gold)' : 'var(--border)',
    transition: 'all 0.15s',
  })

  return (
    <div style={{ padding: '32px 40px', maxWidth: 820, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 900, color: 'var(--text-primary)' }}>
            Consultas del portal
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-label)', marginTop: 4 }}>
            Preguntas que el chatbot no pudo responder
          </div>
        </div>
        {pendingCount > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 10 }}>
            <Clock size={14} style={{ color: '#f59e0b' }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: '#f59e0b' }}>{pendingCount} pendiente{pendingCount !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <button style={btnFilter('pending')} onClick={() => setFilter('pending')}>Pendientes</button>
        <button style={btnFilter('resolved')} onClick={() => setFilter('resolved')}>Resueltas</button>
        <button style={btnFilter('all')} onClick={() => setFilter('all')}>Todas</button>
      </div>

      {/* Lista */}
      {loading ? (
        <div style={{ fontSize: 13, color: 'var(--text-faint)', padding: '40px 0', textAlign: 'center' }}>Cargando...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <MessageSquare size={32} style={{ color: 'var(--text-faint)', marginBottom: 12 }} />
          <div style={{ fontSize: 14, color: 'var(--text-faint)' }}>
            {filter === 'pending' ? 'No hay consultas pendientes 🎉' : 'No hay consultas en esta categoría'}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(q => (
            <div key={q.id} style={{
              background: 'var(--bg-surface)', border: `1px solid ${q.status === 'pending' ? 'rgba(245,158,11,0.25)' : 'var(--border)'}`,
              borderRadius: 12, padding: '16px 20px',
              opacity: q.status === 'resolved' ? 0.6 : 1,
              transition: 'opacity 0.2s',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>

                {/* Contenido */}
                <div style={{ flex: 1 }}>
                  {/* Badge estado */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      padding: '3px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700, letterSpacing: 0.8,
                      background: q.status === 'pending' ? 'rgba(245,158,11,0.1)' : 'rgba(34,197,94,0.1)',
                      color: q.status === 'pending' ? '#f59e0b' : '#22c55e',
                      border: `1px solid ${q.status === 'pending' ? 'rgba(245,158,11,0.3)' : 'rgba(34,197,94,0.3)'}`,
                    }}>
                      {q.status === 'pending' ? <Clock size={9} /> : <CheckCheck size={9} />}
                      {q.status === 'pending' ? 'PENDIENTE' : 'RESUELTA'}
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>
                      {fmtDate(q.createdAt)} · {fmtTime(q.createdAt)}
                    </span>
                  </div>

                  {/* Pregunta */}
                  <div style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 500, marginBottom: 10, lineHeight: 1.5 }}>
                    "{q.question}"
                  </div>

                  {/* Info evento/cliente */}
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    <div>
                      <span style={{ fontSize: 10, color: 'var(--text-label)', textTransform: 'uppercase', letterSpacing: 1 }}>Evento</span>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600, marginTop: 2 }}>{q.event.name}</div>
                    </div>
                    <div>
                      <span style={{ fontSize: 10, color: 'var(--text-label)', textTransform: 'uppercase', letterSpacing: 1 }}>Cliente</span>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600, marginTop: 2 }}>{q.event.client.name}</div>
                    </div>
                    <div>
                      <span style={{ fontSize: 10, color: 'var(--text-label)', textTransform: 'uppercase', letterSpacing: 1 }}>Teléfono</span>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600, marginTop: 2 }}>{q.event.client.phone || '—'}</div>
                    </div>
                  </div>
                </div>

                {/* Acciones */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
                  {q.event.client.phone && q.status === 'pending' && (
                    <a
                      href={buildWhatsAppUrl(q.event.client.phone, q.event.name, q.question)}
                      target="_blank" rel="noreferrer"
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                        background: 'linear-gradient(135deg,#22c55e,#16a34a)',
                        color: 'white', textDecoration: 'none', whiteSpace: 'nowrap',
                      }}
                    >
                      <ExternalLink size={12} /> Responder por WhatsApp
                    </a>
                  )}
                  {q.status === 'pending' && (
                    <button
                      onClick={() => resolve(q.id)}
                      disabled={resolving === q.id}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                        border: '1px solid var(--border)', background: 'transparent',
                        color: 'var(--text-muted)', cursor: 'pointer', whiteSpace: 'nowrap',
                      }}
                    >
                      <CheckCheck size={12} /> Marcar resuelta
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
