import { useState, useEffect, useCallback } from 'react'
import { Wifi, WifiOff, RefreshCw, QrCode, PlusCircle, Bell, Heart, Cake, Eye, Edit2, Play, Send, MessageSquare, CheckCircle, XCircle, ChevronRight } from 'lucide-react'
import api from '../api/axios'
import { useToast } from '../components/Toast'

// ── Helpers ───────────────────────────────────────────────────────────────────

const TRIGGER_LABELS = {
  day_before:      '1 día antes del evento',
  day_after:       'Día después del evento',
  birthday_30days: '30 días antes del cumpleaños',
}

const TRIGGER_ICONS = {
  day_before:      Bell,
  day_after:       Heart,
  birthday_30days: Cake,
}

const JOB_IDS = {
  day_before:      'reminder',
  day_after:       'thanks',
  birthday_30days: 'birthday',
}

// ── Estilos compartidos ───────────────────────────────────────────────────────

const card = {
  background: 'var(--bg-surface)',
  border: '1px solid var(--border)',
  borderRadius: 16,
  padding: 24,
}

const sectionTitle = {
  fontFamily: "'Playfair Display', serif",
  fontSize: 18,
  color: 'var(--gold)',
  marginBottom: 16,
}

const pill = (active) => ({
  display: 'inline-flex', alignItems: 'center', gap: 6,
  padding: '4px 12px', borderRadius: 99, fontSize: 11, fontWeight: 600,
  background: active ? 'rgba(34,197,94,0.12)' : 'rgba(100,100,120,0.12)',
  color: active ? '#22c55e' : 'var(--text-faint)',
  border: `1px solid ${active ? 'rgba(34,197,94,0.3)' : 'rgba(100,100,120,0.2)'}`,
})

const btn = (variant = 'default') => {
  const variants = {
    default:  { background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)' },
    primary:  { background: 'linear-gradient(135deg, var(--gold), var(--gold-light))', border: 'none', color: '#09090f' },
    danger:   { background: 'transparent', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444' },
    green:    { background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', color: '#22c55e' },
  }
  return {
    ...variants[variant],
    padding: '8px 16px', borderRadius: 8, fontSize: 13,
    fontWeight: 600, cursor: 'pointer', transition: 'opacity 0.15s',
  }
}

// ── Tab: Conexión ─────────────────────────────────────────────────────────────

function ConnectionTab() {
  const toast = useToast()
  const [status,   setStatus]   = useState(null)
  const [qrData,   setQrData]   = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [creating, setCreating] = useState(false)

  const fetchStatus = useCallback(async () => {
    try {
      const r = await api.get('/api/whatsapp/status')
      setStatus(r.data)
    } catch { setStatus({ ok: false, status: { state: 'disconnected' } }) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchStatus() }, [fetchStatus])

  useEffect(() => {
    if (qrData && status?.status?.state !== 'open') {
      const t = setInterval(fetchStatus, 5000)
      return () => clearInterval(t)
    }
  }, [qrData, status, fetchStatus])

  const handleCreate = async () => {
    setCreating(true)
    try {
      await api.post('/api/whatsapp/instance')
      toast('Instancia creada', 'success')
      const r = await api.get('/api/whatsapp/qr')
      setQrData(r.data)
      fetchStatus()
    } catch (e) {
      toast(e.response?.data?.error || 'Error al crear instancia')
    } finally { setCreating(false) }
  }

  const handleGetQR = async () => {
    try {
      const r = await api.get('/api/whatsapp/qr')
      setQrData(r.data)
    } catch (e) {
      toast(e.response?.data?.error || 'Error al obtener QR')
    }
  }

  const state = status?.status?.state
  const connected = state === 'open'

  if (loading) return (
    <div style={{ color: 'var(--text-label)', fontSize: 13, padding: 8 }}>Verificando conexión...</div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={card}>
        <div style={sectionTitle}>Estado de la conexión</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            background: connected ? 'rgba(34,197,94,0.1)' : 'rgba(100,100,120,0.1)',
            border: `1px solid ${connected ? 'rgba(34,197,94,0.3)' : 'rgba(100,100,120,0.2)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {connected
              ? <Wifi size={22} color="#22c55e" />
              : <WifiOff size={22} color="var(--text-faint)" />}
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
              {connected ? 'WhatsApp conectado' : 'Sin conexión'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
              {connected
                ? 'Los mensajes automáticos están activos'
                : state === 'disconnected' ? 'La instancia está desconectada'
                : state ? `Estado: ${state}`
                : 'No se pudo conectar con Evolution API'}
            </div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <button onClick={fetchStatus} style={{ ...btn(), display: 'flex', alignItems: 'center', gap: 6 }}>
              <RefreshCw size={13} /> Actualizar
            </button>
            {!connected && (
              <>
                <button onClick={handleCreate} disabled={creating} style={{ ...btn(), display: 'flex', alignItems: 'center', gap: 6 }}>
                  <PlusCircle size={13} /> {creating ? 'Creando...' : 'Crear instancia'}
                </button>
                <button onClick={handleGetQR} style={{ ...btn('primary'), display: 'flex', alignItems: 'center', gap: 6 }}>
                  <QrCode size={13} /> Ver QR
                </button>
              </>
            )}
          </div>
        </div>

        {qrData && !connected && (
          <div style={{ marginTop: 20, padding: 20, background: 'var(--bg-sunken)', borderRadius: 12, border: '1px solid var(--border)', textAlign: 'center' }}>
            <div style={{ fontSize: 13, color: 'var(--text-label)', marginBottom: 12 }}>
              Escaneá este código con WhatsApp → Dispositivos vinculados → Vincular un dispositivo
            </div>
            {qrData?.data?.qrcode || qrData?.data?.base64 ? (
              <img src={qrData.data.qrcode || qrData.data.base64} alt="QR WhatsApp" style={{ width: 220, height: 220, borderRadius: 8 }} />
            ) : (
              <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'monospace', wordBreak: 'break-all', maxWidth: 400, margin: '0 auto' }}>
                {JSON.stringify(qrData, null, 2)}
              </div>
            )}
            <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 10 }}>
              Se actualiza automáticamente cada 5 segundos...
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Tab: Plantillas ───────────────────────────────────────────────────────────

function TemplatesTab() {
  const toast = useToast()
  const [templates, setTemplates] = useState(null)
  const [editing,   setEditing]   = useState(null)   // id de la plantilla en edición
  const [form,      setForm]      = useState({})
  const [preview,   setPreview]   = useState(null)
  const [running,   setRunning]   = useState(null)

  const fetchTemplates = async () => {
    const r = await api.get('/api/whatsapp/templates')
    setTemplates(r.data)
  }

  useEffect(() => { fetchTemplates() }, [])

  const startEdit = (tpl) => {
    setEditing(tpl.id)
    setForm({ name: tpl.name, text: tpl.text, active: tpl.active })
    setPreview(null)
  }

  const cancelEdit = () => { setEditing(null); setForm({}) }

  const handleSave = async (id) => {
    try {
      await api.put(`/api/whatsapp/templates/${id}`, form)
      toast('Plantilla guardada', 'success')
      await fetchTemplates()
      setEditing(null)
    } catch (e) {
      toast(e.response?.data?.error || 'Error al guardar')
    }
  }

  const handleToggle = async (tpl) => {
    try {
      await api.put(`/api/whatsapp/templates/${tpl.id}`, { ...tpl, active: !tpl.active })
      await fetchTemplates()
    } catch { toast('Error al actualizar') }
  }

  const handlePreview = async (id) => {
    try {
      const r = await api.get(`/api/whatsapp/templates/preview?templateId=${id}`)
      setPreview({ id, text: r.data.text })
    } catch (e) {
      toast(e.response?.data?.error || 'Error al generar preview')
    }
  }

  const handleRunJob = async (trigger) => {
    const jobId = JOB_IDS[trigger]
    setRunning(trigger)
    try {
      await api.post(`/api/whatsapp/jobs/${jobId}/run`)
      toast(`Job ejecutado — revisá los logs del servidor`, 'success')
    } catch (e) {
      toast(e.response?.data?.error || 'Error al ejecutar job')
    } finally { setRunning(null) }
  }

  if (!templates) return <div style={{ color: 'var(--text-label)', fontSize: 13 }}>Cargando plantillas...</div>

  const VARS_HELP = {
    day_before:      ['{{nombre}}', '{{evento}}', '{{lugar}}', '{{fecha}}'],
    day_after:       ['{{nombre}}', '{{evento}}', '{{lugar}}', '{{fecha}}'],
    birthday_30days: ['{{nombre}}'],
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {Object.values(templates).map(tpl => (
        <div key={tpl.id} style={{ ...card, border: `1px solid ${editing === tpl.id ? 'rgba(201,168,76,0.4)' : 'var(--border)'}` }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: editing === tpl.id ? 16 : 0 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10, flexShrink: 0,
              background: 'var(--bg-sunken)', border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {(() => { const Icon = TRIGGER_ICONS[tpl.trigger]; return <Icon size={18} color="var(--gold)" /> })()}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{tpl.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text-label)', marginTop: 2 }}>{TRIGGER_LABELS[tpl.trigger]}</div>
            </div>
            <span style={pill(tpl.active)}>{tpl.active ? '● Activa' : '○ Inactiva'}</span>
            <div style={{ display: 'flex', gap: 6 }}>
              {editing !== tpl.id && (
                <>
                  <button onClick={() => handlePreview(tpl.id)} style={{ ...btn(), display: 'flex', alignItems: 'center', gap: 5 }}><Eye size={13} /> Preview</button>
                  <button onClick={() => handleToggle(tpl)} style={{ ...btn(tpl.active ? 'danger' : 'green'), display: 'flex', alignItems: 'center', gap: 5 }}>
                    {tpl.active ? <XCircle size={13} /> : <CheckCircle size={13} />}
                    {tpl.active ? 'Desactivar' : 'Activar'}
                  </button>
                  <button onClick={() => startEdit(tpl)} style={{ ...btn('primary'), display: 'flex', alignItems: 'center', gap: 5 }}><Edit2 size={13} /> Editar</button>
                </>
              )}
            </div>
          </div>

          {/* Preview rápido (no editando) */}
          {!editing && preview?.id === tpl.id && (
            <div style={{ marginTop: 12, padding: '12px 16px', background: 'rgba(37,211,102,0.06)', border: '1px solid rgba(37,211,102,0.2)', borderRadius: 10 }}>
              <div style={{ fontSize: 10, color: '#25d366', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Preview con datos de ejemplo</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{preview.text}</div>
            </div>
          )}

          {/* Texto actual (no editando) */}
          {editing !== tpl.id && !preview?.id === tpl.id && (
            <div style={{ marginTop: 12, padding: '10px 14px', background: 'var(--bg-sunken)', borderRadius: 8, fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6, whiteSpace: 'pre-wrap', border: '1px solid var(--border)' }}>
              {tpl.text}
            </div>
          )}

          {/* Editor */}
          {editing === tpl.id && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-label)', textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 5 }}>Nombre de la plantilla</label>
                <input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  style={{ width: '100%', background: 'var(--bg-sunken)', border: '1px solid var(--border)', borderRadius: 8, padding: '9px 13px', color: 'var(--text-primary)', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                  <label style={{ fontSize: 11, color: 'var(--text-label)', textTransform: 'uppercase', letterSpacing: 1 }}>Mensaje</label>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {(VARS_HELP[tpl.trigger] || []).map(v => (
                      <button key={v}
                        onClick={() => setForm(f => ({ ...f, text: f.text + v }))}
                        style={{ fontSize: 10, padding: '2px 8px', borderRadius: 6, border: '1px solid rgba(201,168,76,0.3)', background: 'var(--gold-bg)', color: 'var(--gold)', cursor: 'pointer', fontFamily: 'monospace' }}
                      >{v}</button>
                    ))}
                  </div>
                </div>
                <textarea
                  value={form.text}
                  onChange={e => setForm(f => ({ ...f, text: e.target.value }))}
                  rows={5}
                  style={{ width: '100%', background: 'var(--bg-sunken)', border: '1px solid var(--border)', borderRadius: 8, padding: '9px 13px', color: 'var(--text-primary)', fontSize: 13, outline: 'none', resize: 'vertical', lineHeight: 1.6, fontFamily: 'inherit', boxSizing: 'border-box' }}
                />
                <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 4 }}>
                  Podés usar *negrita* y _cursiva_ en WhatsApp. Hacé clic en las variables de arriba para insertarlas.
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button onClick={cancelEdit} style={btn()}>Cancelar</button>
                <button onClick={() => handleSave(tpl.id)} style={btn('primary')}>Guardar cambios</button>
              </div>
            </div>
          )}

          {/* Trigger manual */}
          {editing !== tpl.id && (
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>Ejecutar manualmente (para probar)</span>
              <button onClick={() => handleRunJob(tpl.trigger)} disabled={running === tpl.trigger}
                style={{ ...btn(), display: 'flex', alignItems: 'center', gap: 6 }}>
                <Play size={12} /> {running === tpl.trigger ? 'Ejecutando...' : 'Ejecutar ahora'}
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ── Tab: Envío manual ─────────────────────────────────────────────────────────

function SendTab() {
  const toast = useToast()
  const [events,     setEvents]     = useState([])
  const [templates,  setTemplates]  = useState(null)
  const [eventId,    setEventId]    = useState('')
  const [templateId, setTemplateId] = useState('')
  const [customText, setCustomText] = useState('')
  const [preview,    setPreview]    = useState('')
  const [sending,    setSending]    = useState(false)
  const [useCustom,  setUseCustom]  = useState(false)

  useEffect(() => {
    api.get('/api/events').then(r => setEvents(r.data))
    api.get('/api/whatsapp/templates').then(r => setTemplates(r.data))
  }, [])

  useEffect(() => {
    if (!templateId || useCustom) { setPreview(''); return }
    api.get(`/api/whatsapp/templates/preview?templateId=${templateId}${eventId ? `&eventId=${eventId}` : ''}`)
      .then(r => setPreview(r.data.text))
      .catch(() => setPreview(''))
  }, [templateId, eventId, useCustom])

  const selectedEvent = events.find(e => String(e.id) === String(eventId))

  const handleSend = async () => {
    if (!eventId) return toast('Seleccioná un evento')
    if (!useCustom && !templateId) return toast('Seleccioná una plantilla')
    if (useCustom && !customText.trim()) return toast('Escribí un mensaje')
    setSending(true)
    try {
      const body = useCustom ? { customText } : { templateId }
      await api.post(`/api/whatsapp/send/event/${eventId}`, body)
      toast('Mensaje enviado ✓', 'success')
      setEventId(''); setTemplateId(''); setCustomText(''); setPreview('')
    } catch (e) {
      toast(e.response?.data?.error || 'Error al enviar')
    } finally { setSending(false) }
  }

  const sel = { background: 'var(--bg-sunken)', border: '1px solid var(--border)', borderRadius: 8, padding: '9px 13px', color: 'var(--text-primary)', fontSize: 13, outline: 'none', width: '100%', boxSizing: 'border-box' }
  const lbl = { fontSize: 11, color: 'var(--text-label)', textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 5 }

  const confirmedEvents = events.filter(e => ['Confirmado', 'confirmado'].includes(e.status))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 600 }}>
      <div style={card}>
        <div style={sectionTitle}>Enviar mensaje a cliente</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Selector de evento */}
          <div>
            <label style={lbl}>Evento</label>
            <select value={eventId} onChange={e => setEventId(e.target.value)} style={sel}>
              <option value=''>— Seleccioná un evento —</option>
              <optgroup label="Confirmados">
                {confirmedEvents.map(e => (
                  <option key={e.id} value={e.id}>{e.name} · {e.client?.name} · {new Date(e.date).toLocaleDateString('es-AR')}</option>
                ))}
              </optgroup>
              <optgroup label="Todos los eventos">
                {events.filter(e => !['Confirmado','confirmado'].includes(e.status)).map(e => (
                  <option key={e.id} value={e.id}>{e.name} · {e.client?.name} · {new Date(e.date).toLocaleDateString('es-AR')} ({e.status})</option>
                ))}
              </optgroup>
            </select>
            {selectedEvent && (
              <div style={{ marginTop: 6, fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <MessageSquare size={11} /> {selectedEvent.client?.phone || <span style={{ color: '#ef4444' }}>Sin teléfono cargado</span>}
              </div>
            )}
          </div>

          {/* Toggle plantilla / personalizado */}
          <div style={{ display: 'flex', gap: 8 }}>
            {['Usar plantilla', 'Mensaje personalizado'].map((label, i) => (
              <button key={i} onClick={() => setUseCustom(i === 1)}
                style={{ ...btn(useCustom === (i === 1) ? 'primary' : 'default'), flex: 1, padding: '8px 0' }}>
                {label}
              </button>
            ))}
          </div>

          {/* Plantilla */}
          {!useCustom && templates && (
            <div>
              <label style={lbl}>Plantilla</label>
              <select value={templateId} onChange={e => setTemplateId(e.target.value)} style={sel}>
                <option value=''>— Seleccioná una plantilla —</option>
                {Object.values(templates).map(t => (
                  <option key={t.id} value={t.id}>{TRIGGER_LABELS[t.trigger]} — {t.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Personalizado */}
          {useCustom && (
            <div>
              <label style={lbl}>Mensaje</label>
              <textarea
                value={customText}
                onChange={e => setCustomText(e.target.value)}
                rows={4}
                placeholder="Escribí el mensaje aquí..."
                style={{ ...sel, resize: 'vertical', lineHeight: 1.6, fontFamily: 'inherit' }}
              />
            </div>
          )}

          {/* Preview */}
          {preview && !useCustom && (
            <div style={{ padding: '12px 16px', background: 'rgba(37,211,102,0.06)', border: '1px solid rgba(37,211,102,0.2)', borderRadius: 10 }}>
              <div style={{ fontSize: 10, color: '#25d366', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Preview</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{preview}</div>
            </div>
          )}

          <button onClick={handleSend} disabled={sending} style={{ ...btn('primary'), padding: '11px 0', width: '100%', opacity: sending ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <Send size={14} /> {sending ? 'Enviando...' : 'Enviar mensaje'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────

const TABS = [
  { id: 'connection', label: 'Conexión',     Icon: Wifi },
  { id: 'templates',  label: 'Plantillas',   Icon: MessageSquare },
  { id: 'send',       label: 'Envío manual', Icon: Send },
]

export default function WhatsApp() {
  const [tab, setTab] = useState('connection')

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 900, color: 'var(--text-primary)' }}>
            WhatsApp
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-label)', marginTop: 4 }}>
            Mensajes automáticos y manuales vía Evolution API
          </div>
        </div>
      </div>

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

      {tab === 'connection' && <ConnectionTab />}
      {tab === 'templates'  && <TemplatesTab />}
      {tab === 'send'       && <SendTab />}
    </div>
  )
}