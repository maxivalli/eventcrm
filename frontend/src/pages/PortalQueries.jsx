import { useState, useEffect } from 'react'
import { MessageSquare, CheckCheck, Clock, ExternalLink, Check } from 'lucide-react'
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

const FILTERS = [
  { key: 'pending',  label: 'Pendientes', color: '#f59e0b', border: 'rgba(245,158,11,0.35)', bg: 'rgba(245,158,11,0.1)' },
  { key: 'resolved', label: 'Resueltas',  color: '#22c55e', border: 'rgba(34,197,94,0.35)',  bg: 'rgba(34,197,94,0.1)'  },
  { key: 'all',      label: 'Todas',      color: 'var(--gold)', border: 'rgba(201,168,76,0.35)', bg: 'rgba(201,168,76,0.08)' },
]

export default function PortalQueries() {
  const toast = useToast()
  const [queries, setQueries]     = useState([])
  const [loading, setLoading]     = useState(true)
  const [filter, setFilter]       = useState('pending')
  const [resolving, setResolving] = useState(null)

  const load = async () => {
    try {
      const res = await api.get('/api/portal-queries')
      setQueries(res.data)
    } catch { toast('Error al cargar consultas') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const resolve = async (id) => {
    setResolving(id)
    try {
      await api.patch(`/api/portal-queries/${id}/resolve`)
      setQueries(prev => prev.map(q => q.id === id ? { ...q, status: 'resolved' } : q))
      toast('Consulta marcada como resuelta', 'success')
    } catch { toast('Error al actualizar') }
    finally { setResolving(null) }
  }

  const filtered     = queries.filter(q => filter === 'all' || q.status === filter)
  const pendingCount = queries.filter(q => q.status === 'pending').length
  const totalCount   = queries.length

  return (
    <div>
      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 900, color: 'var(--text-primary)' }}>
            Consultas del portal
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-label)', marginTop: 3 }}>
            Preguntas que el chatbot no pudo responder
          </div>
        </div>
        {/* Stat chips */}
        <div style={{ display: 'flex', gap: 8 }}>
          {pendingCount > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 14px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 10 }}>
              <Clock size={13} color="#f59e0b" />
              <span style={{ fontSize: 12, fontWeight: 700, color: '#f59e0b' }}>{pendingCount} pendiente{pendingCount !== 1 ? 's' : ''}</span>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 14px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 10 }}>
            <MessageSquare size={13} color="var(--text-faint)" />
            <span style={{ fontSize: 12, color: 'var(--text-faint)', fontWeight: 600 }}>{totalCount} total</span>
          </div>
        </div>
      </div>

      {/* ── Filtros ── */}
      <div style={{ display: 'flex', gap: 7, marginBottom: 20 }}>
        {FILTERS.map(f => {
          const active = filter === f.key
          return (
            <button key={f.key} onClick={() => setFilter(f.key)} style={{
              padding: '6px 16px', borderRadius: 99, fontSize: 12, fontWeight: active ? 700 : 500,
              cursor: 'pointer', border: `1px solid ${active ? f.border : 'var(--border)'}`,
              background: active ? f.bg : 'transparent',
              color: active ? f.color : 'var(--text-faint)',
              transition: 'all 0.15s',
            }}>
              {f.label}
              {f.key !== 'all' && (
                <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 800 }}>
                  {f.key === 'pending' ? pendingCount : totalCount - pendingCount}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* ── Lista ── */}
      {loading ? (
        <div style={{ fontSize: 13, color: 'var(--text-faint)', padding: '48px 0', textAlign: 'center' }}>Cargando...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 0' }}>
          <MessageSquare size={36} strokeWidth={1} style={{ color: 'var(--text-faint)', marginBottom: 14 }} />
          <div style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 6 }}>
            {filter === 'pending' ? '¡Sin consultas pendientes! 🎉' : 'Sin consultas en esta categoría'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-faint)' }}>
            {filter === 'pending' ? 'Estás al día con todas las preguntas de los clientes.' : ''}
          </div>
        </div>
      ) : (
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
          {filtered.map((q, i) => {
            const isPending = q.status === 'pending'
            return (
              <div key={q.id}
                style={{
                  display: 'flex', gap: 16, padding: '16px 22px',
                  borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none',
                  borderLeft: `3px solid ${isPending ? 'rgba(245,158,11,0.6)' : 'rgba(34,197,94,0.4)'}`,
                  opacity: isPending ? 1 : 0.65,
                  transition: 'opacity 0.2s, background 0.1s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-sunken)'; e.currentTarget.style.opacity = '1' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.opacity = isPending ? '1' : '0.65' }}
              >
                {/* Ícono de estado */}
                <div style={{
                  width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: isPending ? 'rgba(245,158,11,0.1)' : 'rgba(34,197,94,0.1)',
                  border: `1px solid ${isPending ? 'rgba(245,158,11,0.25)' : 'rgba(34,197,94,0.25)'}`,
                }}>
                  {isPending ? <Clock size={16} color="#f59e0b" /> : <CheckCheck size={16} color="#22c55e" />}
                </div>

                {/* Contenido principal */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* Pregunta */}
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.5, marginBottom: 10, fontStyle: 'italic' }}>
                    "{q.question}"
                  </div>

                  {/* Meta: evento + cliente */}
                  <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 9, fontWeight: 800, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 2 }}>Evento</div>
                      <div style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 600 }}>{q.event.name}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 9, fontWeight: 800, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 2 }}>Cliente</div>
                      <div style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 600 }}>{q.event.client.name}</div>
                    </div>
                    {q.event.client.phone && (
                      <div>
                        <div style={{ fontSize: 9, fontWeight: 800, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 2 }}>Teléfono</div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>{q.event.client.phone}</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Fecha centrada */}
                <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minWidth: 64, gap: 2 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textAlign: 'center' }}>
                    {fmtDate(q.createdAt).replace(' de ', ' ').replace(' de ', ' ')}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-faint)', textAlign: 'center' }}>
                    {fmtTime(q.createdAt)}
                  </div>
                </div>

                {/* Acciones */}
                {isPending && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 7, flexShrink: 0, alignItems: 'stretch', justifyContent: 'center', width: 110 }}>
                    {q.event.client.phone && (
                      <a
                        href={buildWhatsAppUrl(q.event.client.phone, q.event.name, q.question)}
                        target="_blank" rel="noreferrer"
                        style={{
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                          padding: '7px 0', borderRadius: 8, fontSize: 12, fontWeight: 700,
                          background: 'linear-gradient(135deg,#22c55e,#16a34a)',
                          color: 'white', textDecoration: 'none', whiteSpace: 'nowrap',
                        }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                          <path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.554 4.118 1.528 5.849L0 24l6.335-1.505A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.882a9.877 9.877 0 01-5.031-1.378l-.361-.214-3.741.981.999-3.648-.235-.374A9.847 9.847 0 012.118 12C2.118 6.533 6.533 2.118 12 2.118S21.882 6.533 21.882 12 17.467 21.882 12 21.882z"/>
                        </svg>
                        WhatsApp
                      </a>
                    )}
                    <button
                      onClick={() => resolve(q.id)}
                      disabled={resolving === q.id}
                      style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        padding: '7px 0', borderRadius: 8, fontSize: 12, fontWeight: 600,
                        border: '1px solid var(--border)', background: 'transparent',
                        color: 'var(--text-muted)', cursor: resolving === q.id ? 'wait' : 'pointer',
                        whiteSpace: 'nowrap', transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(34,197,94,0.4)'; e.currentTarget.style.color = '#22c55e' }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)' }}
                    >
                      <Check size={12} />
                      {resolving === q.id ? 'Guardando...' : 'Resolver'}
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}