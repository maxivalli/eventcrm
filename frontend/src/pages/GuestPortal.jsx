import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'

const API = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/$/, '')

const SECCION_COLORS = {
  'Entrada':        '#3b82f6',
  'Plato principal':'#8b5cf6',
  'Guarnición':     '#22c55e',
  'Bebidas':        '#06b6d4',
  'Postre':         '#ec4899',
  'Trasnoche':      '#f97316',
  'Otros':          '#6b7280',
}

const col = {
  bg:         '#FAF9F6',
  surface:    '#FFFFFF',
  border:     '#E4DDD0',
  gold:       '#A6792D',
  goldLight:  '#C49A45',
  text:       '#1C1A14',
  muted:      '#6B6252',
  faint:      '#9E9080',
}

function Countdown({ date, time }) {
  const [diff, setDiff] = useState(null)

  useEffect(() => {
    const target = new Date(date)
    if (time) {
      const [h, m] = time.split(':')
      target.setHours(Number(h), Number(m), 0, 0)
    } else {
      target.setHours(20, 0, 0, 0)
    }

    const tick = () => {
      const ms = target - new Date()
      if (ms <= 0) { setDiff(null); return }
      setDiff({
        days:  Math.floor(ms / 86400000),
        hours: Math.floor((ms % 86400000) / 3600000),
        mins:  Math.floor((ms % 3600000) / 60000),
        secs:  Math.floor((ms % 60000) / 1000),
      })
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [date, time])

  if (!diff) return null

  return (
    <div style={{ display: 'flex', gap: 12, justifyContent: 'center', margin: '36px 0' }}>
      {[
        { value: diff.days,  label: 'días' },
        { value: diff.hours, label: 'horas' },
        { value: diff.mins,  label: 'min' },
        { value: diff.secs,  label: 'seg' },
      ].map(({ value, label }) => (
        <div key={label} style={{ textAlign: 'center', minWidth: 56 }}>
          <div style={{
            fontSize: 'clamp(28px, 7vw, 40px)', fontWeight: 800,
            color: col.gold, fontVariantNumeric: 'tabular-nums', lineHeight: 1,
          }}>
            {String(value).padStart(2, '0')}
          </div>
          <div style={{ fontSize: 10, color: col.faint, textTransform: 'uppercase', letterSpacing: 2, marginTop: 6 }}>
            {label}
          </div>
        </div>
      ))}
    </div>
  )
}


export default function GuestPortal() {
  const { token } = useParams()
  const [data, setData]           = useState(null)
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(false)
  const [showForm, setShowForm]     = useState(false)
  const [done, setDone]             = useState(false)
  const [people, setPeople]         = useState([{ name: '', tipo: 'Mayor' }])
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError]   = useState('')

  const [chatOpen, setChatOpen]           = useState(false)
  const [chatMessages, setChatMessages]   = useState([])
  const [chatInput, setChatInput]         = useState('')
  const [chatLoading, setChatLoading]     = useState(false)
  const [pendingQueryId, setPendingQueryId] = useState(null)
  const [phoneInput, setPhoneInput]       = useState('')
  const [phoneSent, setPhoneSent]         = useState(false)

  const setPerson = (i, field, val) =>
    setPeople(prev => prev.map((p, j) => j === i ? { ...p, [field]: val } : p))
  const addPerson = () => setPeople(prev => [...prev, { name: '', tipo: 'Mayor' }])
  const removePerson = (i) => setPeople(prev => prev.filter((_, j) => j !== i))

  useEffect(() => {
    axios.get(`${API}/api/guest-portal/${token}`)
      .then(r => setData(r.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [token])

  const handleRsvp = async (e) => {
    e.preventDefault()
    if (people.some(p => !p.name.trim())) { setFormError('Completá todos los nombres'); return }
    setSubmitting(true); setFormError('')
    try {
      await axios.post(`${API}/api/guest-portal/${token}/rsvp`, { guests: people })
      setDone(true)
    } catch {
      setFormError('Ocurrió un error. Intentá de nuevo.')
    } finally { setSubmitting(false) }
  }

  const sendChat = async () => {
    const q = chatInput.trim()
    if (!q || chatLoading) return
    setChatInput('')
    setPendingQueryId(null)
    setPhoneSent(false)
    setChatMessages(prev => [...prev, { role: 'user', text: q }])
    setChatLoading(true)
    try {
      const res = await axios.post(`${API}/api/ai/guest-portal-chat`, { token, question: q })
      setChatMessages(prev => [...prev, { role: 'assistant', text: res.data.answer }])
      if (res.data.queryId) setPendingQueryId(res.data.queryId)
    } catch {
      setChatMessages(prev => [...prev, { role: 'assistant', text: 'No pude responder eso ahora. Por favor contactá a Haus directamente.' }])
    } finally {
      setChatLoading(false)
    }
  }

  const submitPhone = async () => {
    if (!phoneInput.trim() || !pendingQueryId) return
    try {
      await axios.patch(`${API}/api/portal-queries/${pendingQueryId}/guest-phone`, { guestPhone: phoneInput.trim() })
    } catch { /* silently fail */ }
    setPhoneSent(true)
    setPendingQueryId(null)
    setPhoneInput('')
  }

  const fmtDate = (str) =>
    new Date(str).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  if (loading) return (
    <div style={{ minHeight: '100vh', background: col.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: col.faint, fontSize: 14 }}>Cargando...</div>
    </div>
  )

  if (error || !data) return (
    <div style={{ minHeight: '100vh', background: col.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
      <div style={{ color: col.gold, fontSize: 24, opacity: 0.5 }}>✦</div>
      <div style={{ color: col.muted, fontSize: 15 }}>Invitación no encontrada</div>
    </div>
  )

  const { event, menuSections } = data

  return (
    <div style={{ minHeight: '100vh', background: col.bg, color: col.text, fontFamily: "'DM Sans', system-ui, sans-serif" }}>

      {/* Halo decorativo */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', top: -300, left: '50%', transform: 'translateX(-50%)',
          width: 700, height: 700, borderRadius: '50%',
          background: `radial-gradient(circle, ${col.gold}0f 0%, transparent 65%)`,
        }} />
      </div>

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 520, margin: '0 auto', padding: '52px 20px 80px' }}>

        {/* Ornamento */}
        <div style={{ textAlign: 'center', marginBottom: 36, color: col.gold, fontSize: 18, letterSpacing: 10, opacity: 0.4 }}>
          ✦ ✦ ✦
        </div>

        {/* ── Tarjeta de invitación ── */}
        <div style={{
          background: col.surface,
          border: `1px solid ${col.gold}30`,
          borderRadius: 24, padding: 'clamp(32px, 6vw, 52px) clamp(24px, 6vw, 44px)',
          boxShadow: `0 0 80px ${col.gold}0d, inset 0 1px 0 ${col.gold}20`,
          textAlign: 'center', marginBottom: 20,
        }}>

          {/* Tipo */}
          <div style={{ fontSize: 10, color: col.gold, textTransform: 'uppercase', letterSpacing: 5, marginBottom: 22, opacity: 0.75 }}>
            {event.type}
          </div>

          {/* Nombre del evento */}
          <h1 style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: 'clamp(26px, 7vw, 40px)', fontWeight: 700,
            color: col.text, lineHeight: 1.2, margin: '0 0 8px',
          }}>
            {event.name}
          </h1>

          {/* Cliente */}
          {event.clientName && (
            <div style={{ fontSize: 13, color: col.muted, marginBottom: 32 }}>
              de <span style={{ color: col.gold, fontWeight: 600 }}>{event.clientName}</span>
            </div>
          )}

          {/* Separador */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center', marginBottom: 32 }}>
            <div style={{ height: 1, width: 56, background: `linear-gradient(to right, transparent, ${col.gold}80)` }} />
            <div style={{ color: col.gold, fontSize: 12 }}>✦</div>
            <div style={{ height: 1, width: 56, background: `linear-gradient(to left, transparent, ${col.gold}80)` }} />
          </div>

          {/* Datos */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
            <div>
              <div style={{ fontSize: 9, color: col.faint, textTransform: 'uppercase', letterSpacing: 3, marginBottom: 6 }}>Fecha</div>
              <div style={{ fontSize: 15, color: col.text, fontWeight: 500, textTransform: 'capitalize' }}>
                {fmtDate(event.date)}
              </div>
            </div>

            {event.time && (
              <div>
                <div style={{ fontSize: 9, color: col.faint, textTransform: 'uppercase', letterSpacing: 3, marginBottom: 6 }}>Hora</div>
                <div style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 'clamp(22px, 6vw, 30px)', fontWeight: 700, color: col.gold,
                }}>
                  {event.time} hs.
                </div>
              </div>
            )}

            <div>
              <div style={{ fontSize: 9, color: col.faint, textTransform: 'uppercase', letterSpacing: 3, marginBottom: 6 }}>Lugar</div>
              <div style={{ fontSize: 15, color: col.text, fontWeight: 500 }}>{event.venue}</div>
            </div>

            {event.ticketPrice && (
              <div>
                <div style={{ fontSize: 9, color: col.faint, textTransform: 'uppercase', letterSpacing: 3, marginBottom: 6 }}>Precio de entrada</div>
                <div style={{ fontSize: 18, color: col.gold, fontWeight: 700 }}>
                  {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(event.ticketPrice)}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Cuenta regresiva */}
        <Countdown date={event.date} time={event.time} />

        {/* ── RSVP ── */}
        <div style={{
          background: col.surface,
          border: `1px solid ${col.gold}25`,
          borderRadius: 20, padding: '32px 28px', marginBottom: 20, textAlign: 'center',
        }}>
          {done ? (
            <div>
              <div style={{ fontSize: 40, marginBottom: 16 }}>🎉</div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: col.text, marginBottom: 10 }}>
                ¡Confirmado!
              </div>
              <div style={{ fontSize: 14, color: col.faint, lineHeight: 1.7 }}>
                {people.length > 1
                  ? `${people.length} asistencias registradas.`
                  : 'Tu asistencia fue registrada.'
                }<br />¡Nos vemos pronto!
              </div>
            </div>
          ) : showForm ? (
            <form onSubmit={handleRsvp}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: col.text, marginBottom: 20 }}>
                Confirmá tu asistencia
              </div>

              {/* Lista de personas */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
                {people.map((p, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input
                      value={p.name}
                      onChange={e => { setPerson(i, 'name', e.target.value); setFormError('') }}
                      placeholder={i === 0 ? 'Tu nombre completo' : 'Nombre del acompañante'}
                      autoFocus={i === 0}
                      style={{
                        flex: 1, background: 'rgba(0,0,0,0.04)',
                        border: `1px solid ${formError && !p.name.trim() ? '#ef4444' : col.gold + '35'}`,
                        borderRadius: 10, padding: '10px 14px',
                        color: col.text, fontSize: 14, outline: 'none',
                      }}
                    />
                    <select
                      value={p.tipo}
                      onChange={e => setPerson(i, 'tipo', e.target.value)}
                      style={{
                        background: 'rgba(0,0,0,0.04)', border: `1px solid ${col.gold}35`,
                        borderRadius: 10, padding: '10px 10px', color: p.tipo === 'Menor' ? '#8b5cf6' : col.muted,
                        fontSize: 13, cursor: 'pointer', outline: 'none', flexShrink: 0,
                      }}
                    >
                      <option value="Mayor">Mayor</option>
                      <option value="Menor">Menor</option>
                    </select>
                    {people.length > 1 && (
                      <button type="button" onClick={() => removePerson(i)}
                        style={{ background: 'none', border: 'none', color: col.faint, cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: '0 2px', flexShrink: 0 }}>
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Agregar acompañante */}
              <button type="button" onClick={addPerson}
                style={{ width: '100%', padding: '9px', border: `1px dashed ${col.gold}35`, borderRadius: 10, background: 'transparent', color: col.gold, fontSize: 13, cursor: 'pointer', marginBottom: 18, opacity: 0.8 }}>
                + Agregar acompañante
              </button>

              {formError && <div style={{ fontSize: 12, color: '#ef4444', marginBottom: 12 }}>{formError}</div>}

              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" onClick={() => { setShowForm(false); setPeople([{ name: '', tipo: 'Mayor' }]) }}
                  style={{ flex: 1, padding: 12, border: `1px solid ${col.border}`, borderRadius: 10, background: 'transparent', color: col.faint, fontSize: 14, cursor: 'pointer' }}>
                  Cancelar
                </button>
                <button type="submit" disabled={submitting}
                  style={{ flex: 2, padding: 12, border: 'none', borderRadius: 10, background: `linear-gradient(135deg, ${col.gold}, ${col.goldLight})`, color: '#09090f', fontWeight: 700, fontSize: 14, cursor: 'pointer', opacity: submitting ? 0.7 : 1 }}>
                  {submitting ? 'Confirmando...' : `Confirmar ${people.length > 1 ? `(${people.length} personas)` : ''}`}
                </button>
              </div>
            </form>
          ) : (
            <>
              <div style={{ fontSize: 14, color: col.faint, lineHeight: 1.7, marginBottom: 24 }}>
                ¿Vas a estar presente?<br />Confirmá tu asistencia.
              </div>
              <button
                onClick={() => setShowForm(true)}
                style={{
                  padding: '14px 40px', border: 'none', borderRadius: 12,
                  background: `linear-gradient(135deg, ${col.gold}, ${col.goldLight})`,
                  color: '#09090f', fontWeight: 700, fontSize: 15, cursor: 'pointer',
                  boxShadow: `0 4px 24px ${col.gold}35`,
                }}
              >
                Confirmar asistencia
              </button>
            </>
          )}
        </div>

        {/* ── Menú ── */}
        {menuSections.length > 0 && (
          <div style={{
            background: col.surface,
            border: `1px solid ${col.border}`,
            borderRadius: 20, padding: '32px 28px', marginBottom: 20,
          }}>
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <div style={{ fontSize: 10, color: col.gold, textTransform: 'uppercase', letterSpacing: 5, marginBottom: 10, opacity: 0.8 }}>
                Menú
              </div>
              <div style={{ height: 1, background: `linear-gradient(to right, transparent, ${col.gold}30, transparent)` }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {menuSections.map((sec, i) => {
                const color = SECCION_COLORS[sec.nombre] || '#6b7280'
                return (
                  <div key={i}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }} />
                      <div style={{ fontSize: 9, fontWeight: 800, color, textTransform: 'uppercase', letterSpacing: 2.5 }}>
                        {sec.nombre}
                      </div>
                      <div style={{ flex: 1, height: 1, background: `${color}20` }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingLeft: 14 }}>
                      {(sec.items || []).map((item, j) => (
                        <div key={j}>
                          <div style={{ fontSize: 15, color: col.text, fontWeight: 500 }}>{item.dish?.name}</div>
                          {item.dish?.descripcion && (
                            <div style={{ fontSize: 12, color: col.faint, fontStyle: 'italic', marginTop: 3, lineHeight: 1.6 }}>
                              {item.dish.descripcion}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Contacto ── */}
        <div style={{
          textAlign: 'center', padding: '28px 24px',
          background: col.surface,
          border: `1px solid ${col.border}`,
          borderRadius: 20, marginBottom: 32,
        }}>
          <div style={{ fontSize: 10, color: col.gold, textTransform: 'uppercase', letterSpacing: 4, marginBottom: 14, opacity: 0.7 }}>
            Contacto
          </div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: col.text, marginBottom: 8 }}>
            Haus Producción de Eventos
          </div>
          <div style={{ fontSize: 13, color: col.faint, lineHeight: 1.8 }}>
            Para consultas sobre el evento<br />
            escribinos por WhatsApp
          </div>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', color: col.faint, fontSize: 10, letterSpacing: 3, opacity: 0.5 }}>
          HAUS ✦ PRODUCCIÓN DE EVENTOS
        </div>
      </div>

      {/* Chat flotante */}
      <style>{`
        @keyframes floatBot {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-5px); }
        }
        @keyframes eyeBlink {
          0%, 90%, 100% { transform: scaleY(1); }
          95%            { transform: scaleY(0.1); }
        }
        @keyframes wiggle {
          0%, 100% { transform: rotate(0deg); }
          20%       { transform: rotate(-8deg); }
          40%       { transform: rotate(8deg); }
          60%       { transform: rotate(-5deg); }
          80%       { transform: rotate(5deg); }
        }
        @keyframes fadeInTooltip {
          from { opacity: 0; transform: translateX(12px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @media (max-width: 600px) {
          .guest-chat-win { width: calc(100vw - 32px) !important; right: 16px !important; bottom: 80px !important; }
        }
      `}</style>
      <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 100, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12 }}>
        {chatOpen && (
          <div className="guest-chat-win" style={{ position: 'fixed', bottom: 90, right: 24, width: 360, background: col.surface, border: `1px solid ${col.border}`, borderRadius: 16, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.6)', display: 'flex', flexDirection: 'column', maxHeight: '70vh' }}>
            <div style={{ padding: '13px 16px', background: col.bg, borderBottom: `1px solid ${col.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: col.text }}>Asistente Haus</div>
                <div style={{ fontSize: 10, color: col.faint, marginTop: 2 }}>Respondemos tus dudas sobre el evento</div>
              </div>
              <button onClick={() => setChatOpen(false)} style={{ background: 'none', border: 'none', color: col.faint, cursor: 'pointer', fontSize: 16, lineHeight: 1 }}>✕</button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '14px 12px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {chatMessages.length === 0 && (
                <div style={{ padding: '9px 13px', borderRadius: '12px 12px 12px 2px', background: col.bg, border: `1px solid ${col.border}`, color: col.muted, fontSize: 13, lineHeight: 1.5 }}>
                  Hola 👋 ¿Tenés alguna pregunta sobre el evento?
                </div>
              )}
              {chatMessages.map((m, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  <div style={{ padding: '9px 13px', borderRadius: m.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px', background: m.role === 'user' ? `linear-gradient(135deg, ${col.gold}, ${col.goldLight})` : col.bg, color: m.role === 'user' ? '#09090F' : col.text, fontSize: 13, maxWidth: '85%', lineHeight: 1.5, border: m.role === 'user' ? 'none' : `1px solid ${col.border}` }}>
                    {m.text}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <div style={{ padding: '9px 13px', borderRadius: '12px 12px 12px 2px', background: col.bg, border: `1px solid ${col.border}`, color: col.faint, fontSize: 13 }}>...</div>
                </div>
              )}
              {pendingQueryId && !phoneSent && !chatLoading && (
                <div style={{ background: col.bg, border: `1px solid ${col.gold}40`, borderRadius: 12, padding: '12px 14px', marginTop: 4 }}>
                  <div style={{ fontSize: 12, color: col.muted, marginBottom: 10, lineHeight: 1.5 }}>
                    ¿Querés que te contactemos? Dejanos tu número de WhatsApp <span style={{ color: col.faint }}>(opcional)</span>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <input
                      value={phoneInput}
                      onChange={e => setPhoneInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && submitPhone()}
                      placeholder="Ej: 1155667788"
                      style={{ flex: 1, background: col.surface, border: `1px solid ${col.border}`, borderRadius: 8, padding: '8px 10px', color: col.text, fontSize: 12, outline: 'none' }}
                    />
                    <button onClick={submitPhone} disabled={!phoneInput.trim()}
                      style={{ background: `linear-gradient(135deg, ${col.gold}, ${col.goldLight})`, border: 'none', borderRadius: 8, padding: '8px 12px', color: '#09090F', fontWeight: 700, fontSize: 12, cursor: phoneInput.trim() ? 'pointer' : 'default', opacity: phoneInput.trim() ? 1 : 0.5 }}>
                      Enviar
                    </button>
                    <button onClick={() => { setPendingQueryId(null); setPhoneSent(true) }}
                      style={{ background: 'transparent', border: `1px solid ${col.border}`, borderRadius: 8, padding: '8px 10px', color: col.faint, fontSize: 12, cursor: 'pointer' }}>
                      Omitir
                    </button>
                  </div>
                </div>
              )}
              {phoneSent && (
                <div style={{ fontSize: 12, color: col.gold, textAlign: 'center', padding: '4px 0', opacity: 0.8 }}>
                  ✓ ¡Gracias! Te contactamos pronto.
                </div>
              )}
            </div>
            <div style={{ padding: '10px 12px', borderTop: `1px solid ${col.border}`, display: 'flex', gap: 8 }}>
              <input
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendChat()}
                placeholder="Escribí tu pregunta..."
                style={{ flex: 1, background: col.bg, border: `1px solid ${col.border}`, borderRadius: 8, padding: '9px 12px', color: col.text, fontSize: 13, outline: 'none' }}
              />
              <button onClick={sendChat} disabled={chatLoading || !chatInput.trim()} style={{ background: `linear-gradient(135deg, ${col.gold}, ${col.goldLight})`, border: 'none', borderRadius: 8, padding: '9px 14px', color: '#09090F', fontWeight: 700, cursor: chatLoading ? 'wait' : 'pointer', fontSize: 13 }}>→</button>
            </div>
          </div>
        )}
        {!chatOpen && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, animation: 'fadeInTooltip 0.5s cubic-bezier(0.34,1.56,0.64,1)', position: 'absolute', right: 68, bottom: '50%', transform: 'translateY(50%)', pointerEvents: 'none' }}>
            <div style={{ background: '#ffffff', border: '1px solid #e8e0d0', borderRadius: 12, padding: '9px 16px', fontSize: 12.5, color: '#4a3f2f', fontWeight: 600, boxShadow: '0 4px 20px rgba(0,0,0,0.12)', whiteSpace: 'nowrap', position: 'relative', lineHeight: 1.4 }}>
              ¿Tenés dudas? ¡Hablemos! 👋
              <div style={{ position: 'absolute', right: -7, top: '50%', transform: 'translateY(-50%)', width: 0, height: 0, borderTop: '7px solid transparent', borderBottom: '7px solid transparent', borderLeft: '7px solid #ffffff', filter: 'drop-shadow(1px 0 0 #e8e0d0)' }} />
            </div>
          </div>
        )}
        <button
          onClick={() => setChatOpen(o => !o)}
          style={{ width: 58, height: 58, borderRadius: '50%', background: chatOpen ? col.surface : `linear-gradient(135deg, ${col.gold}, ${col.goldLight})`, border: chatOpen ? `1px solid ${col.border}` : 'none', cursor: 'pointer', boxShadow: chatOpen ? 'none' : '0 4px 24px rgba(184,151,90,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.25s', flexShrink: 0, animation: chatOpen ? 'none' : 'floatBot 3s ease-in-out infinite', position: 'relative' }}
        >
          {chatOpen
            ? <span style={{ fontSize: 16, color: col.faint, fontWeight: 300 }}>✕</span>
            : (
              <svg width="34" height="34" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ animation: 'wiggle 4s ease-in-out infinite 2s' }}>
                <ellipse cx="16" cy="13" rx="9" ry="9" fill="#09090F" />
                <ellipse cx="13" cy="9.5" rx="2.5" ry="1.5" fill="rgba(255,255,255,0.12)" transform="rotate(-20 13 9.5)" />
                <ellipse cx="12.5" cy="12.5" rx="2" ry="2.2" fill="white" style={{ animation: 'eyeBlink 4s ease-in-out infinite' }} />
                <ellipse cx="19.5" cy="12.5" rx="2" ry="2.2" fill="white" style={{ animation: 'eyeBlink 4s ease-in-out infinite 0.05s' }} />
                <circle cx="13" cy="13" r="1.1" fill="#09090F" />
                <circle cx="20" cy="13" r="1.1" fill="#09090F" />
                <circle cx="13.6" cy="12.3" r="0.4" fill="white" />
                <circle cx="20.6" cy="12.3" r="0.4" fill="white" />
                <path d="M12.5 16.5 Q16 19.5 19.5 16.5" stroke="#09090F" strokeWidth="1.4" strokeLinecap="round" fill="none" />
                <rect x="14" y="21.5" width="4" height="2.5" rx="1" fill="#09090F" />
                <ellipse cx="16" cy="26.5" rx="6" ry="4" fill="#09090F" />
                <path d="M14.5 24 L16 25.5 L17.5 24 L17 22.5 L15 22.5 Z" fill={col.gold} />
              </svg>
            )
          }
        </button>
      </div>
    </div>
  )
}
