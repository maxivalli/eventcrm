import { useState, useEffect } from 'react'
import api from '../api/axios'

const CAT_COLORS = {
  'Preparación':     { color: '#94a3b8', bg: 'rgba(148,163,184,0.12)', border: 'rgba(148,163,184,0.25)' },
  'Recepción':       { color: '#34d399', bg: 'rgba(52,211,153,0.12)',  border: 'rgba(52,211,153,0.25)'  },
  'Gastronomía':     { color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', border: 'rgba(167,139,250,0.25)' },
  'Entretenimiento': { color: '#f472b6', bg: 'rgba(244,114,182,0.12)', border: 'rgba(244,114,182,0.25)' },
  'Protocolo':       { color: '#c9a84c', bg: 'rgba(201,168,76,0.12)',  border: 'rgba(201,168,76,0.25)'  },
  'Cierre':          { color: '#fb923c', bg: 'rgba(251,146,60,0.12)',  border: 'rgba(251,146,60,0.25)'  },
}
const CATEGORIAS = Object.keys(CAT_COLORS)
const DEFAULT    = { color: '#c8c8d8', bg: 'rgba(200,200,216,0.08)', border: 'rgba(200,200,216,0.15)' }

const CAT_PDF_RGB = {
  'Preparación':     [100, 116, 139],
  'Recepción':       [16,  185, 129],
  'Gastronomía':     [124, 58,  237],
  'Entretenimiento': [219, 39,  119],
  'Protocolo':       [161, 108, 20 ],
  'Cierre':          [234, 88,  12 ],
}

const SparkIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2L9.5 9.5 2 12l7.5 2.5L12 22l2.5-7.5L22 12l-7.5-2.5L12 2z"/>
  </svg>
)
const ClockIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
)
const EditIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
)
const TrashIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
    <path d="M10 11v6"/><path d="M14 11v6"/>
  </svg>
)
const PdfIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
  </svg>
)
const PlusIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
)

const sortByTime = (arr) => [...arr].sort((a, b) => {
  const toMins = (h) => { const [hh, mm] = (h || '00:00').split(':').map(Number); return hh * 60 + mm }
  return toMins(a.hora) - toMins(b.hora)
})

export default function Cronograma({ event }) {
  const eventId = event?.id

  const [schedule, setSchedule]     = useState([])
  const [loadingInit, setLoadingInit] = useState(true)
  const [loading, setLoading]       = useState(false)
  const [saving, setSaving]         = useState(false)
  const [error, setError]           = useState('')
  const [expanded, setExpanded]     = useState(null)
  const [editingIdx, setEditingIdx] = useState(null)
  const [editForm, setEditForm]     = useState({})
  const [pdfLoading, setPdfLoading] = useState(false)
  const [addingNew, setAddingNew]   = useState(false)
  const [newItem, setNewItem]       = useState({ hora: '', titulo: '', descripcion: '', categoria: 'Protocolo' })

  const showError = (msg) => { setError(msg); setTimeout(() => setError(''), 4000) }
  const cat = (categoria) => CAT_COLORS[categoria] || DEFAULT

  // ── Cargar desde DB al montar ──────────────────────────────
  useEffect(() => {
    if (!eventId) return
    api.get(`/api/schedule/event/${eventId}`)
      .then(res => setSchedule(res.data || []))
      .catch(() => {}) // silencioso si no hay items
      .finally(() => setLoadingInit(false))
  }, [eventId])

  // ── Guardar en DB (bulk replace) ───────────────────────────
  const persist = async (items) => {
    setSaving(true)
    try {
      const res = await api.post(`/api/schedule/event/${eventId}`, { items })
      setSchedule(res.data)
    } catch {
      showError('No se pudo guardar el cronograma')
    } finally {
      setSaving(false)
    }
  }

  const getDuration = (idx, list = schedule) => {
    if (idx >= list.length - 1) return null
    const toMins = (h) => { const [hh, mm] = (h || '00:00').split(':').map(Number); return hh * 60 + mm }
    const diff = toMins(list[idx + 1].hora) - toMins(list[idx].hora)
    if (diff <= 0) return null
    const h = Math.floor(diff / 60), m = diff % 60
    return diff < 60 ? `${diff} min` : m > 0 ? `${h}h ${m}min` : `${h}h`
  }

  // ── Generar con IA ─────────────────────────────────────────
  const handleGenerate = async () => {
    setLoading(true); setError(''); setEditingIdx(null)
    try {
      const res = await api.post('/api/ai/generate-schedule', {
        type: event?.type, guests: event?.guests, venue: event?.venue,
        date: event?.date, time: event?.time, name: event?.name,
      })
      const sorted = sortByTime(res.data.schedule || [])
      await persist(sorted)
      setExpanded(null)
    } catch { showError('No se pudo generar el cronograma') }
    finally { setLoading(false) }
  }

  // ── Edición inline ─────────────────────────────────────────
  const startEdit = (idx, e) => {
    e.stopPropagation()
    setEditingIdx(idx)
    setEditForm({ ...schedule[idx] })
    setExpanded(null)
  }

  const saveEdit = async (idx) => {
    const updated = [...schedule]
    updated[idx] = { ...schedule[idx], ...editForm }
    const sorted = sortByTime(updated)
    setEditingIdx(null)
    await persist(sorted)
  }

  const deleteItem = async (idx, e) => {
    e.stopPropagation()
    const updated = schedule.filter((_, i) => i !== idx)
    if (editingIdx === idx) setEditingIdx(null)
    await persist(updated)
  }

  // ── Agregar ítem ───────────────────────────────────────────
  const handleAddItem = async () => {
    if (!newItem.hora || !newItem.titulo) return
    const sorted = sortByTime([...schedule, { ...newItem }])
    setNewItem({ hora: '', titulo: '', descripcion: '', categoria: 'Protocolo' })
    setAddingNew(false)
    await persist(sorted)
  }

  // ── Exportar PDF claro ─────────────────────────────────────
  const handleExportPDF = async () => {
    setPdfLoading(true)
    try {
      if (!window.jspdf) {
        await new Promise((resolve, reject) => {
          const s = document.createElement('script')
          s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
          s.onload = resolve; s.onerror = reject
          document.head.appendChild(s)
        })
      }

      const { jsPDF } = window.jspdf
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

      const pageW = 210, margin = 16, colW = pageW - margin * 2
      const timeW = 18, dotX = margin + timeW + 3
      const textX = dotX + 7, textW = colW - timeW - 12
      let y = margin

      // Header
      doc.setFillColor(201, 168, 76)
      doc.rect(0, 0, pageW, 3, 'F')
      doc.setFillColor(248, 248, 252)
      doc.rect(0, 3, pageW, 36, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(18)
      doc.setTextColor(30, 30, 50)
      doc.text('Cronograma del evento', margin, 18)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(11)
      doc.setTextColor(80, 80, 110)
      doc.text(event?.name || '', margin, 27)
      const infoParts = []
      if (event?.type)   infoParts.push(event.type)
      if (event?.guests) infoParts.push(`${event.guests} invitados`)
      if (event?.venue)  infoParts.push(event.venue)
      if (event?.time)   infoParts.push(`Inicio: ${event.time}`)
      doc.setFontSize(8)
      doc.setTextColor(140, 140, 165)
      if (infoParts.length) doc.text(infoParts.join('  ·  '), margin, 34)
      doc.setDrawColor(220, 220, 235)
      doc.setLineWidth(0.4)
      doc.line(0, 39, pageW, 39)
      y = 47

      schedule.forEach((item, idx) => {
        const rgb      = CAT_PDF_RGB[item.categoria] || [100, 100, 130]
        const rgbLight = rgb.map(v => Math.min(255, Math.round(v * 0.15 + 240)))

        doc.setFont('helvetica', 'bold')
        doc.setFontSize(10)
        const titleLines = doc.splitTextToSize(item.titulo || '', textW)
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8.5)
        const descLines = item.descripcion ? doc.splitTextToSize(item.descripcion, textW) : []

        const badgeH = 6, titleH = titleLines.length * 5.5
        const descH  = descLines.length > 0 ? descLines.length * 4.8 + 3 : 0
        const padT   = 8, padB = 7
        const blockH = padT + badgeH + 2 + titleH + descH + padB

        if (y + blockH > 282) {
          doc.addPage(); y = margin
          doc.setFillColor(201, 168, 76)
          doc.rect(0, 0, pageW, 1.5, 'F')
        }

        doc.setFillColor(...rgbLight)
        doc.setDrawColor(...rgb.map(v => Math.min(255, v + 60)))
        doc.setLineWidth(0.3)
        doc.roundedRect(margin, y, colW, blockH, 2.5, 2.5, 'FD')
        doc.setFillColor(...rgb)
        doc.rect(margin, y, 3, blockH, 'F')

        doc.setFont('helvetica', 'bold')
        doc.setFontSize(9.5)
        doc.setTextColor(...rgb)
        doc.text(item.hora || '', margin + 5, y + padT + 4)

        if (idx < schedule.length - 1) {
          doc.setDrawColor(210, 210, 230)
          doc.setLineWidth(0.5)
          doc.line(dotX + 1, y + blockH, dotX + 1, y + blockH + 5)
        }
        doc.setFillColor(...rgb)
        doc.circle(dotX + 1, y + padT + 3, 2, 'F')

        doc.setFont('helvetica', 'bold')
        doc.setFontSize(6.5)
        const badgeText = item.categoria || ''
        const badgePadX = 3.5
        const badgeTotalW = doc.getTextWidth(badgeText) + badgePadX * 2
        doc.setFillColor(...rgb.map(v => Math.min(255, v + 80)))
        doc.roundedRect(textX, y + padT - 1, badgeTotalW, badgeH, 1.2, 1.2, 'F')
        doc.setTextColor(...rgb)
        doc.text(badgeText, textX + badgePadX, y + padT + 3.5)

        doc.setFont('helvetica', 'bold')
        doc.setFontSize(10)
        doc.setTextColor(25, 25, 45)
        doc.text(titleLines, textX, y + padT + badgeH + 3.5)

        if (descLines.length > 0) {
          doc.setFont('helvetica', 'normal')
          doc.setFontSize(8.5)
          doc.setTextColor(90, 90, 115)
          doc.text(descLines, textX, y + padT + badgeH + 3.5 + titleH + 1)
        }

        const duration = getDuration(idx)
        if (duration) {
          doc.setFont('helvetica', 'normal')
          doc.setFontSize(7)
          doc.setTextColor(160, 160, 185)
          doc.text(duration, dotX + 5, y + blockH + 3)
        }

        y += blockH + (duration ? 8 : 5)
      })

      const totalPages = doc.internal.getNumberOfPages()
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i)
        doc.setDrawColor(220, 220, 235)
        doc.setLineWidth(0.3)
        doc.line(margin, 292, pageW - margin, 292)
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(7)
        doc.setTextColor(170, 170, 195)
        doc.text(`${event?.name || 'Evento'} — Cronograma`, margin, 296)
        doc.text(`Página ${i} de ${totalPages}`, pageW - margin, 296, { align: 'right' })
      }

      doc.save(`Cronograma - ${event?.name || 'Evento'}.pdf`)
    } catch (e) {
      showError('No se pudo generar el PDF')
      console.error(e)
    } finally {
      setPdfLoading(false)
    }
  }

  const inputStyle = {
    width: '100%', background: 'var(--bg-sunken)', border: '1px solid var(--border-strong)',
    borderRadius: 6, padding: '6px 9px', color: 'var(--text-primary)', fontSize: 12,
    outline: 'none', boxSizing: 'border-box',
  }

  const generated = schedule.length > 0

  if (loadingInit) return (
    <div style={{ fontSize: 13, color: 'var(--text-label)', padding: '12px 0' }}>Cargando cronograma...</div>
  )

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, color: 'var(--gold)' }}>
            Cronograma del evento
          </div>
          {saving && <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>Guardando...</span>}
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {generated && (
            <>
              <button onClick={() => setAddingNew(v => !v)} style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '5px 9px', border: '1px solid var(--border-strong)',
                borderRadius: 7, background: 'transparent', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer',
              }}><PlusIcon /> Agregar</button>
              <button onClick={handleExportPDF} disabled={pdfLoading} style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '5px 9px', border: '1px solid var(--border-strong)',
                borderRadius: 7, background: 'transparent', color: 'var(--text-muted)', fontSize: 12,
                cursor: pdfLoading ? 'not-allowed' : 'pointer',
              }}>
                {pdfLoading ? '...' : <><PdfIcon /> PDF</>}
              </button>
            </>
          )}
          <button onClick={handleGenerate} disabled={loading || saving} style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '5px 10px', border: '1px solid var(--gold-border)',
            borderRadius: 7, background: loading ? 'var(--gold-bg)' : 'transparent',
            color: 'var(--gold)', fontSize: 12, fontWeight: 600,
            cursor: loading || saving ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
          }}>
            {loading
              ? <><span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>✦</span> Generando...</>
              : <><SparkIcon /> {generated ? 'Regenerar' : 'Generar con IA'}</>
            }
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{ fontSize: 12, color: '#ef4444', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '8px 12px', marginBottom: 12 }}>
          {error}
        </div>
      )}

      {/* Agregar nuevo ítem */}
      {addingNew && (
        <div style={{ background: 'var(--bg-sunken)', border: '1px solid var(--gold-border)', borderRadius: 10, padding: 14, marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: 'var(--gold)', fontWeight: 700, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Nuevo momento</div>
          <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 1fr', gap: 8, marginBottom: 8 }}>
            <div>
              <div style={{ fontSize: 10, color: 'var(--text-label)', marginBottom: 4 }}>Hora *</div>
              <input type="time" style={inputStyle} value={newItem.hora} onChange={e => setNewItem(p => ({ ...p, hora: e.target.value }))} />
            </div>
            <div>
              <div style={{ fontSize: 10, color: 'var(--text-label)', marginBottom: 4 }}>Título *</div>
              <input style={inputStyle} value={newItem.titulo} onChange={e => setNewItem(p => ({ ...p, titulo: e.target.value }))} placeholder="Nombre del momento..." />
            </div>
            <div>
              <div style={{ fontSize: 10, color: 'var(--text-label)', marginBottom: 4 }}>Categoría</div>
              <select style={{ ...inputStyle, cursor: 'pointer' }} value={newItem.categoria} onChange={e => setNewItem(p => ({ ...p, categoria: e.target.value }))}>
                {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 10, color: 'var(--text-label)', marginBottom: 4 }}>Descripción</div>
            <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: 54, lineHeight: 1.5 }}
              value={newItem.descripcion} onChange={e => setNewItem(p => ({ ...p, descripcion: e.target.value }))}
              placeholder="Descripción del momento..." />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleAddItem} disabled={!newItem.hora || !newItem.titulo} style={{
              padding: '7px 16px', border: 'none', borderRadius: 7,
              background: !newItem.hora || !newItem.titulo ? 'var(--border)' : 'linear-gradient(135deg, var(--gold), var(--gold-light))',
              color: !newItem.hora || !newItem.titulo ? 'var(--text-faint)' : '#09090f',
              fontWeight: 600, fontSize: 12, cursor: !newItem.hora || !newItem.titulo ? 'not-allowed' : 'pointer',
            }}>Agregar</button>
            <button onClick={() => setAddingNew(false)} style={{ padding: '7px 12px', border: '1px solid var(--border)', borderRadius: 7, background: 'transparent', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer' }}>Cancelar</button>
          </div>
        </div>
      )}

      {/* Estado vacío */}
      {!generated && !loading && (
        <div style={{ fontSize: 13, color: 'var(--text-faint)', textAlign: 'center', padding: '28px 0' }}>
          <div style={{ fontSize: 24, marginBottom: 8 }}>🕐</div>
          <div>No hay cronograma todavía</div>
          <div style={{ fontSize: 11, marginTop: 4 }}>Generá un cronograma personalizado con IA basado en el tipo de evento y horario</div>
        </div>
      )}

      {/* Leyenda */}
      {generated && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
          {[...new Set(schedule.map(s => s.categoria))].map(cat_name => {
            const c = cat(cat_name)
            return (
              <span key={cat_name} style={{
                fontSize: 10, padding: '3px 9px', borderRadius: 20, fontWeight: 600,
                background: c.bg, color: c.color, border: `1px solid ${c.border}`, letterSpacing: '0.04em',
              }}>{cat_name}</span>
            )
          })}
        </div>
      )}

      {/* Timeline */}
      {schedule.length > 0 && (
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', left: 52, top: 12, bottom: 12, width: 1, background: 'var(--border-strong)' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {schedule.map((item, idx) => {
              const c        = cat(item.categoria)
              const isOpen   = expanded === idx
              const isEdit   = editingIdx === idx
              const duration = getDuration(idx)

              return (
                <div key={item.id || idx}>
                  {isEdit ? (
                    <div style={{ display: 'flex', gap: 0, alignItems: 'flex-start', padding: '6px 0' }}>
                      <div style={{ width: 44, flexShrink: 0 }} />
                      <div style={{ width: 16, flexShrink: 0, display: 'flex', justifyContent: 'center', paddingTop: 12, position: 'relative', zIndex: 1 }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: c.color, boxShadow: `0 0 0 3px var(--bg-surface), 0 0 0 4px ${c.color}60` }} />
                      </div>
                      <div style={{ flex: 1, marginLeft: 10, background: 'var(--bg-sunken)', border: `1px solid ${c.border}`, borderRadius: 10, padding: 12 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 1fr', gap: 8, marginBottom: 8 }}>
                          <div>
                            <div style={{ fontSize: 10, color: 'var(--text-label)', marginBottom: 4 }}>Hora</div>
                            <input type="time" style={inputStyle} value={editForm.hora} onChange={e => setEditForm(p => ({ ...p, hora: e.target.value }))} />
                          </div>
                          <div>
                            <div style={{ fontSize: 10, color: 'var(--text-label)', marginBottom: 4 }}>Título</div>
                            <input style={inputStyle} value={editForm.titulo} onChange={e => setEditForm(p => ({ ...p, titulo: e.target.value }))} />
                          </div>
                          <div>
                            <div style={{ fontSize: 10, color: 'var(--text-label)', marginBottom: 4 }}>Categoría</div>
                            <select style={{ ...inputStyle, cursor: 'pointer' }} value={editForm.categoria} onChange={e => setEditForm(p => ({ ...p, categoria: e.target.value }))}>
                              {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
                            </select>
                          </div>
                        </div>
                        <div style={{ marginBottom: 10 }}>
                          <div style={{ fontSize: 10, color: 'var(--text-label)', marginBottom: 4 }}>Descripción</div>
                          <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: 54, lineHeight: 1.5 }}
                            value={editForm.descripcion || ''} onChange={e => setEditForm(p => ({ ...p, descripcion: e.target.value }))} />
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={() => saveEdit(idx)} style={{ padding: '6px 14px', border: 'none', borderRadius: 7, background: 'linear-gradient(135deg, var(--gold), var(--gold-light))', color: '#09090f', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>Guardar</button>
                          <button onClick={() => setEditingIdx(null)} style={{ padding: '6px 11px', border: '1px solid var(--border)', borderRadius: 7, background: 'transparent', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer' }}>Cancelar</button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div onClick={() => setExpanded(isOpen ? null : idx)} style={{ display: 'flex', gap: 0, alignItems: 'flex-start', cursor: 'pointer', padding: '6px 0', transition: 'all 0.15s' }}>
                      <div style={{ width: 44, flexShrink: 0, textAlign: 'right', paddingRight: 8, paddingTop: 2 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{item.hora}</span>
                      </div>
                      <div style={{ width: 16, flexShrink: 0, display: 'flex', justifyContent: 'center', paddingTop: 4, position: 'relative', zIndex: 1 }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: c.color, boxShadow: `0 0 0 3px var(--bg-surface), 0 0 0 4px ${c.color}60`, transition: 'all 0.2s', transform: isOpen ? 'scale(1.3)' : 'scale(1)' }} />
                      </div>
                      <div style={{ flex: 1, marginLeft: 10, background: isOpen ? c.bg : 'transparent', border: `1px solid ${isOpen ? c.border : 'transparent'}`, borderRadius: 10, padding: isOpen ? '10px 14px' : '2px 10px', transition: 'all 0.2s' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: isOpen ? c.color : 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.titulo}</span>
                            <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 10, fontWeight: 600, background: c.bg, color: c.color, border: `1px solid ${c.border}`, flexShrink: 0 }}>{item.categoria}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                            <button onClick={e => startEdit(idx, e)} title="Editar" style={{ width: 22, height: 22, border: '1px solid var(--border)', borderRadius: 5, background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><EditIcon /></button>
                            <button onClick={e => deleteItem(idx, e)} title="Eliminar" style={{ width: 22, height: 22, border: '1px solid rgba(239,68,68,0.2)', borderRadius: 5, background: 'transparent', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><TrashIcon /></button>
                            <span style={{ fontSize: 10, color: 'var(--text-faint)', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▾</span>
                          </div>
                        </div>
                        {isOpen && (
                          <div style={{ marginTop: 6, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{item.descripcion}</div>
                        )}
                      </div>
                    </div>
                  )}

                  {duration && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingLeft: 60, paddingBottom: 2 }}>
                      <div style={{ height: 1, width: 12, background: 'var(--border)' }} />
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-faint)' }}>
                        <ClockIcon /><span style={{ fontSize: 10 }}>{duration}</span>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
      `}</style>
    </div>
  )
}