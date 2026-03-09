import { useState, useEffect, useRef } from 'react'
import api from '../api/axios'
import { useToast } from '../components/Toast'

const formatCurrency = (n) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n || 0)

const formatDateLong = (str) =>
  new Date(str).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })

const calcQuoteTotal = (q) => {
  const items   = (q.items || []).reduce((acc, i) => acc + i.quantity * i.unitPrice, 0)
  const catering = q.kind === 'Catering' ? (q.covers || 0) * (q.pricePerCover || 0) : 0
  return catering + items
}

// ── Preview component ────────────────────────────────────────────────────────
function BudgetPreview({ client, event, quotes, menuSections, emissionDate }) {
  const generalQuotes = quotes.filter(q => q.kind === 'General')
  const cateringQuotes = quotes.filter(q => q.kind === 'Catering')
  const grandTotal    = quotes.reduce((acc, q) => acc + calcQuoteTotal(q), 0)

  const col = {
    gold:      '#b8972a',
    goldLight: '#d4ae4a',
    dark:      '#0e0e18',
    card:      '#13131f',
    border:    '#1e1e2e',
    text:      '#e2e2ee',
    muted:     '#6a6a8a',
    faint:     '#1a1a2a',
  }

  const sectionTitle = (label, color = col.gold) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
      <div style={{ height: 1, flex: 1, background: color + '40' }} />
      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color }}>{label}</span>
      <div style={{ height: 1, flex: 1, background: color + '40' }} />
    </div>
  )

  return (
    <div id="budget-preview" style={{
      background: col.dark,
      color: col.text,
      fontFamily: "'Georgia', 'Times New Roman', serif",
      padding: '48px 52px',
      maxWidth: 760,
      margin: '0 auto',
    }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: 40, paddingBottom: 32, borderBottom: `1px solid ${col.border}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontFamily: "'Georgia', serif", fontSize: 26, fontWeight: 700, color: col.goldLight, letterSpacing: 1, marginBottom: 4 }}>
              HAUS
            </div>
            <div style={{ fontSize: 11, color: col.muted, letterSpacing: 2, textTransform: 'uppercase' }}>
              Organización y producción de eventos
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 10, color: col.muted, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 }}>Presupuesto</div>
            <div style={{ fontSize: 11, color: col.goldLight }}>{formatDateLong(emissionDate)}</div>
          </div>
        </div>
      </div>

      {/* ── Cliente + Evento ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 40 }}>
        <div style={{ background: col.faint, borderRadius: 10, padding: '20px 22px', border: `1px solid ${col.border}` }}>
          <div style={{ fontSize: 9, color: col.muted, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>Preparado para</div>
          <div style={{ fontSize: 17, fontWeight: 700, color: col.text, marginBottom: 6 }}>{client.name}</div>
          {client.contact && <div style={{ fontSize: 12, color: col.muted, marginBottom: 3 }}>{client.contact}</div>}
          {client.email   && <div style={{ fontSize: 12, color: col.muted, marginBottom: 3 }}>{client.email}</div>}
          {client.phone   && <div style={{ fontSize: 12, color: col.muted }}>{client.phone}</div>}
        </div>
        <div style={{ background: col.faint, borderRadius: 10, padding: '20px 22px', border: `1px solid ${col.border}` }}>
          <div style={{ fontSize: 9, color: col.muted, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>Evento</div>
          <div style={{ fontSize: 17, fontWeight: 700, color: col.text, marginBottom: 10 }}>{event.name}</div>
          {[
            { label: 'Fecha',     value: formatDateLong(event.date)    },
            { label: 'Venue',     value: event.venue                   },
            { label: 'Invitados', value: `${event.guests} personas`    },
          ].map(r => (
            <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 11, color: col.muted }}>{r.label}</span>
              <span style={{ fontSize: 11, color: col.text }}>{r.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Cotizaciones Generales ── */}
      {generalQuotes.length > 0 && (
        <div style={{ marginBottom: 36 }}>
          {sectionTitle('Servicios incluidos')}
          {generalQuotes.map(q => (
            <div key={q.id} style={{ marginBottom: 24, pageBreakInside: 'avoid' }}>
              <div style={{ borderRadius: 8, overflow: 'hidden', border: `1px solid ${col.border}` }}>
                <div style={{
                  display: 'grid', gridTemplateColumns: '3fr 60px 130px 130px',
                  background: col.faint, padding: '10px 16px',
                  fontSize: 9, color: col.muted, letterSpacing: 2, textTransform: 'uppercase',
                }}>
                  <span>Descripción</span>
                  <span style={{ textAlign: 'center' }}>Cant.</span>
                  <span style={{ textAlign: 'right' }}>Precio unit.</span>
                  <span style={{ textAlign: 'right' }}>Subtotal</span>
                </div>
                {q.items.map((item, i) => (
                  <div key={item.id} style={{
                    display: 'grid', gridTemplateColumns: '3fr 60px 130px 130px',
                    padding: '12px 16px', alignItems: 'center',
                    borderTop: `1px solid ${col.border}`,
                    background: i % 2 === 0 ? 'transparent' : col.faint + '80',
                  }}>
                    <span style={{ fontSize: 13, color: col.text }}>{item.description}</span>
                    <span style={{ fontSize: 12, color: col.muted, textAlign: 'center' }}>{item.quantity}</span>
                    <span style={{ fontSize: 12, color: col.muted, textAlign: 'right' }}>{formatCurrency(item.unitPrice)}</span>
                    <span style={{ fontSize: 13, color: col.text, textAlign: 'right', fontWeight: 600 }}>{formatCurrency(item.quantity * item.unitPrice)}</span>
                  </div>
                ))}
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '12px 16px', borderTop: `1px solid ${col.border}`,
                  background: col.faint,
                }}>
                  <span style={{ fontSize: 10, color: col.muted, letterSpacing: 1, textTransform: 'uppercase' }}>Subtotal servicios</span>
                  <span style={{ fontSize: 16, fontWeight: 700, color: col.goldLight }}>{formatCurrency(calcQuoteTotal(q))}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Cotizaciones Catering ── */}
      {cateringQuotes.length > 0 && (
        <div style={{ marginBottom: 36 }}>
          {sectionTitle('Catering', '#f97316')}
          {cateringQuotes.map(q => (
            <div key={q.id} style={{ marginBottom: 24, pageBreakInside: 'avoid' }}>

              {/* ── Menú desde Catering → Menú (secciones del evento) ── */}
              {menuSections && menuSections.length > 0 && (() => {
                const secColors = {
                  'Entrada fría': '#3b82f6', 'Plato principal': '#8b5cf6',
                  'Guarnición': '#22c55e', 'Bebidas': '#06b6d4',
                  'Postre': '#ec4899', 'Trasnoche': '#f97316', 'Otros': '#6b7280',
                }
                const totalPlatos = menuSections.reduce((acc, s) => acc + s.items.length, 0)
                return (
                  <div style={{ background: col.faint, borderRadius: 8, border: `1px solid ${col.border}`, marginBottom: 14, overflow: 'hidden' }}>
                    <div style={{ padding: '12px 18px', borderBottom: `1px solid ${col.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ fontSize: 9, color: col.muted, letterSpacing: 2, textTransform: 'uppercase' }}>Menú</div>
                      <div style={{ fontSize: 10, color: col.muted }}>{totalPlatos} plato{totalPlatos !== 1 ? 's' : ''}</div>
                    </div>
                    {menuSections.map((section, si) => (
                      <div key={section.id} style={{ borderTop: si > 0 ? `1px solid ${col.border}` : 'none' }}>
                        {/* Cabecera de sección */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px 6px', background: col.dark + '60' }}>
                          <div style={{ width: 6, height: 6, borderRadius: '50%', background: secColors[section.nombre] || col.muted, flexShrink: 0 }} />
                          <span style={{ fontSize: 9, fontWeight: 700, color: secColors[section.nombre] || col.muted, letterSpacing: 2, textTransform: 'uppercase' }}>{section.nombre}</span>
                        </div>
                        {/* Platos de la sección */}
                        {section.items.map((item, di) => (
                          <div key={item.id || di} style={{ padding: '8px 18px 8px 32px', borderTop: `1px solid ${col.border}20`, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 13, color: col.text, fontWeight: 500 }}>
                                {item.dish?.name}
                              </div>
                              {item.dish?.descripcion && (
                                <div style={{ fontSize: 11, color: col.muted, lineHeight: 1.5, marginTop: 2 }}>{item.dish.descripcion}</div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )
              })()}

              <div style={{ borderRadius: 8, overflow: 'hidden', border: `1px solid ${col.border}`, marginBottom: 14 }}>
                <div style={{
                  display: 'grid', gridTemplateColumns: '3fr 60px 130px 130px',
                  background: col.faint, padding: '10px 16px',
                  fontSize: 9, color: col.muted, letterSpacing: 2, textTransform: 'uppercase',
                }}>
                  <span>Descripción</span>
                  <span style={{ textAlign: 'center' }}>Cant.</span>
                  <span style={{ textAlign: 'right' }}>Precio unit.</span>
                  <span style={{ textAlign: 'right' }}>Subtotal</span>
                </div>
                <div style={{
                  display: 'grid', gridTemplateColumns: '3fr 60px 130px 130px',
                  padding: '14px 16px', borderTop: `1px solid ${col.border}`,
                }}>
                  <span style={{ fontSize: 13, color: col.text }}>Servicio de catering por persona</span>
                  <span style={{ fontSize: 12, color: col.muted, textAlign: 'center' }}>{q.covers}</span>
                  <span style={{ fontSize: 12, color: col.muted, textAlign: 'right' }}>{formatCurrency(q.pricePerCover)}</span>
                  <span style={{ fontSize: 13, color: col.text, textAlign: 'right', fontWeight: 600 }}>{formatCurrency((q.covers || 0) * (q.pricePerCover || 0))}</span>
                </div>
              </div>

              {q.items.length > 0 && (
                <div style={{ borderRadius: 8, overflow: 'hidden', border: `1px solid ${col.border}`, marginBottom: 14 }}>
                  <div style={{
                    display: 'grid', gridTemplateColumns: '3fr 60px 130px 130px',
                    background: col.faint, padding: '10px 16px',
                    fontSize: 9, color: col.muted, letterSpacing: 2, textTransform: 'uppercase',
                  }}>
                    <span>Servicios adicionales</span>
                    <span style={{ textAlign: 'center' }}>Cant.</span>
                    <span style={{ textAlign: 'right' }}>Precio unit.</span>
                    <span style={{ textAlign: 'right' }}>Subtotal</span>
                  </div>
                  {q.items.map((item, i) => (
                    <div key={item.id} style={{
                      display: 'grid', gridTemplateColumns: '3fr 60px 130px 130px',
                      padding: '11px 16px', borderTop: `1px solid ${col.border}`,
                      alignItems: 'center',
                      background: i % 2 === 0 ? 'transparent' : col.faint + '80',
                    }}>
                      <span style={{ fontSize: 13, color: col.text }}>{item.description}</span>
                      <span style={{ fontSize: 12, color: col.muted, textAlign: 'center' }}>{item.quantity}</span>
                      <span style={{ fontSize: 12, color: col.muted, textAlign: 'right' }}>{formatCurrency(item.unitPrice)}</span>
                      <span style={{ fontSize: 13, color: col.text, textAlign: 'right', fontWeight: 600 }}>{formatCurrency(item.quantity * item.unitPrice)}</span>
                    </div>
                  ))}
                </div>
              )}

              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '12px 16px', borderRadius: 8,
                background: col.faint, border: `1px solid ${col.border}`,
              }}>
                <span style={{ fontSize: 10, color: col.muted, letterSpacing: 1, textTransform: 'uppercase' }}>Subtotal catering</span>
                <span style={{ fontSize: 16, fontWeight: 700, color: '#f97316' }}>{formatCurrency(calcQuoteTotal(q))}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Total general ── */}
      <div style={{
        pageBreakInside: 'avoid',
        marginBottom: 32,
        borderRadius: 12,
        overflow: 'hidden',
        border: `1px solid ${col.gold}40`,
      }}>
        {/* Desglose por sección */}
        {generalQuotes.length > 0 && cateringQuotes.length > 0 && (
          <div style={{ background: col.faint, padding: '14px 22px', borderBottom: `1px solid ${col.border}` }}>
            {generalQuotes.map(q => (
              <div key={q.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: col.muted }}>Servicios</span>
                <span style={{ fontSize: 12, color: col.text }}>{formatCurrency(calcQuoteTotal(q))}</span>
              </div>
            ))}
            {cateringQuotes.map(q => (
              <div key={q.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: col.muted }}>Catering</span>
                <span style={{ fontSize: 12, color: col.text }}>{formatCurrency(calcQuoteTotal(q))}</span>
              </div>
            ))}
          </div>
        )}
        {/* Total */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '18px 22px',
          background: `linear-gradient(135deg, ${col.gold}18, ${col.gold}08)`,
        }}>
          <div>
            <div style={{ fontSize: 10, color: col.muted, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 }}>
              Total general
            </div>
            <div style={{ fontSize: 11, color: col.muted }}>Incluye todos los servicios</div>
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: col.goldLight }}>
            {formatCurrency(grandTotal)}
          </div>
        </div>
      </div>

      {/* ── Nota final ── */}
      <div style={{
        pageBreakInside: 'avoid',
        background: col.faint, borderRadius: 10, padding: '18px 22px',
        border: `1px solid ${col.border}`, marginBottom: 36,
        fontSize: 12, color: col.muted, lineHeight: 1.7, fontStyle: 'italic',
      }}>
        Este presupuesto tiene validez de 30 días a partir de la fecha de emisión. Los valores indicados son en pesos argentinos e incluyen IVA.
      </div>

      {/* ── Footer ── */}
      <div style={{
        pageBreakInside: 'avoid',
        borderTop: `1px solid ${col.border}`, paddingTop: 20,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div style={{ fontSize: 11, color: col.muted }}>HAUS — Organización y producción de eventos</div>
        <div style={{ fontSize: 11, color: col.muted }}>{formatDateLong(emissionDate)}</div>
      </div>

    </div>
  )
}

// ── Página principal ─────────────────────────────────────────────────────────
export default function Budget() {
  const toast = useToast()
  const [clients,    setClients]    = useState([])
  const [events,     setEvents]     = useState([])
  const [quotes,     setQuotes]     = useState([])
  const [loading,    setLoading]    = useState(true)
  const [generating, setGenerating] = useState(false)
  const [clientId,      setClientId]     = useState('')
  const [eventId,       setEventId]      = useState('')
  const [menuSections,  setMenuSections] = useState([])

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [clRes, evRes, qRes] = await Promise.all([
          api.get('/api/clients'),
          api.get('/api/events'),
          api.get('/api/quotes'),
        ])
        setClients(clRes.data)
        setEvents(evRes.data)
        setQuotes(qRes.data)
      } catch (e) {
        toast('Error al cargar datos')
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [])

  // Fetch menú de catering al cambiar el evento
  useEffect(() => {
    if (!eventId) { setMenuSections([]); return }
    api.get(`/api/menu/event/${eventId}`)
      .then(r => setMenuSections(r.data))
      .catch(() => setMenuSections([]))
  }, [eventId])

  const clientEvents    = clientId ? events.filter(ev => String(ev.client?.id) === clientId) : []
  const selectedClient  = clients.find(c => String(c.id) === clientId)
  const selectedEvent   = events.find(e => String(e.id) === eventId)
  const eventQuotes     = eventId ? quotes.filter(q => String(q.eventId) === eventId) : []
  const hasData         = selectedClient && selectedEvent && eventQuotes.length > 0

  // ── Genera el PDF y lo devuelve (sin descargarlo) ───────────────────────────
  const buildPDF = async () => {
    if (!window.jspdf) {
      await new Promise((resolve, reject) => {
        const s = document.createElement('script')
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
        s.onload = resolve; s.onerror = reject
        document.head.appendChild(s)
      })
    }
    if (!window.html2canvas) {
      await new Promise((resolve, reject) => {
        const s = document.createElement('script')
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'
        s.onload = resolve; s.onerror = reject
        document.head.appendChild(s)
      })
    }
    const { jsPDF } = window.jspdf
    const element   = document.getElementById('budget-preview')
    const canvas = await window.html2canvas(element, {
      scale: 2, useCORS: true, backgroundColor: '#0e0e18',
      logging: false, windowWidth: element.scrollWidth, windowHeight: element.scrollHeight,
    })
    const pdf   = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const pdfW  = pdf.internal.pageSize.getWidth()
    const pdfH  = pdf.internal.pageSize.getHeight()
    const imgW  = canvas.width
    const imgH  = canvas.height
    const ratio = pdfW / imgW
    const pages = Math.ceil((imgH * ratio) / pdfH)
    for (let page = 0; page < pages; page++) {
      if (page > 0) pdf.addPage()
      const srcY   = Math.round((page * pdfH) / ratio)
      const srcH   = Math.round(Math.min(pdfH / ratio, imgH - srcY))
      const slice  = document.createElement('canvas')
      slice.width  = imgW
      slice.height = srcH
      slice.getContext('2d').drawImage(canvas, 0, srcY, imgW, srcH, 0, 0, imgW, srcH)
      pdf.addImage(slice.toDataURL('image/png'), 'PNG', 0, 0, pdfW, srcH * ratio)
    }
    const fileName = `Presupuesto_${selectedClient.name.replace(/\s+/g, '_')}_${selectedEvent.name.replace(/\s+/g, '_')}.pdf`
    return { pdf, fileName }
  }

  const handleGeneratePDF = async () => {
    if (!hasData) return
    setGenerating(true)
    try {
      const { pdf, fileName } = await buildPDF()
      pdf.save(fileName)
      toast('PDF generado correctamente', 'success')
    } catch (e) {
      console.error(e)
      toast('Error al generar el PDF')
    } finally {
      setGenerating(false)
    }
  }

  const handleSendEmail = async () => {
    if (!hasData) return
    setGenerating(true)
    try {
      const { pdf, fileName } = await buildPDF()
      // Descargar el PDF
      pdf.save(fileName)
      // Abrir cliente de correo con los datos del presupuesto
      const total   = eventQuotes.reduce((acc, q) => acc + calcQuoteTotal(q), 0)
      const subject = encodeURIComponent(`Presupuesto HAUS — ${selectedEvent.name}`)
      const body    = encodeURIComponent(
`Estimado/a ${selectedClient.contact || selectedClient.name},

Le enviamos el presupuesto correspondiente al evento "${selectedEvent.name}" con fecha ${formatDateLong(selectedEvent.date)} en ${selectedEvent.venue}.

El total asciende a ${formatCurrency(total)}.

El archivo PDF ya fue descargado en su carpeta de Descargas — por favor adjúntelo a este correo antes de enviarlo.

Quedo a disposición para cualquier consulta.

Saludos,
Equipo HAUS — Organización y producción de eventos`)
      setTimeout(() => {
        window.open(`mailto:${selectedClient.email}?subject=${subject}&body=${body}`, '_blank')
        toast(`PDF descargado · Adjuntá "${fileName}" al correo`, 'success')
      }, 400)
    } catch (e) {
      console.error(e)
      toast('Error al generar el PDF')
    } finally {
      setGenerating(false)
    }
  }

  const handleSendWhatsApp = async () => {
    if (!hasData) return
    setGenerating(true)
    try {
      const { pdf, fileName } = await buildPDF()
      // Descargar el PDF
      pdf.save(fileName)
      // Normalizar número argentino para wa.me
      let phone = (selectedClient.phone || '').replace(/[\s\-().+]/g, '')
      if (phone.startsWith('0')) phone = phone.slice(1)
      if (!phone.startsWith('54')) phone = '54' + phone
      const total = eventQuotes.reduce((acc, q) => acc + calcQuoteTotal(q), 0)
      const msg   = encodeURIComponent(
`Hola ${selectedClient.contact || selectedClient.name} 👋

Te compartimos el presupuesto de HAUS para el evento *${selectedEvent.name}* 📋

📅 Fecha: ${formatDateLong(selectedEvent.date)}
📍 Venue: ${selectedEvent.venue}
👥 Invitados: ${selectedEvent.guests} personas
💰 *Total: ${formatCurrency(total)}*

Adjunto el PDF con el detalle completo. Cualquier consulta, estamos a tu disposición.`)
      setTimeout(() => {
        window.open(`https://wa.me/${phone}?text=${msg}`, '_blank')
        toast(`PDF descargado · Adjuntá "${fileName}" al mensaje de WhatsApp`, 'success')
      }, 400)
    } catch (e) {
      console.error(e)
      toast('Error al generar el PDF')
    } finally {
      setGenerating(false)
    }
  }

  const inputStyle = (disabled) => ({
    width: '100%', background: disabled ? 'var(--bg-base)' : 'var(--bg-sunken)',
    border: '1px solid var(--border)', borderRadius: 8,
    padding: '10px 14px', color: disabled ? 'var(--text-faint)' : 'var(--text-primary)',
    fontSize: 13, outline: 'none', boxSizing: 'border-box',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
  })

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--text-label)', fontSize: 14 }}>
      Cargando...
    </div>
  )

  return (
    <div>
      {/* Encabezado */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 900, color: 'var(--text-primary)' }}>
            Generar presupuesto
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-label)', marginTop: 4 }}>
            Seleccioná el cliente y evento para armar el PDF
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {/* WhatsApp */}
          <button
            onClick={handleSendWhatsApp}
            disabled={!hasData || generating}
            title={hasData ? `Enviar a ${selectedClient?.phone}` : ''}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: hasData && !generating ? 'rgba(37,211,102,0.12)' : 'var(--bg-sunken)',
              border: `1px solid ${hasData && !generating ? 'rgba(37,211,102,0.35)' : 'var(--border)'}`,
              borderRadius: 8, padding: '10px 18px',
              color: hasData && !generating ? '#25d366' : 'var(--text-faint)',
              fontSize: 13, fontWeight: 600,
              cursor: hasData && !generating ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s',
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.554 4.118 1.528 5.849L0 24l6.335-1.505A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.882a9.877 9.877 0 01-5.031-1.378l-.361-.214-3.741.981.999-3.648-.235-.374A9.847 9.847 0 012.118 12C2.118 6.533 6.533 2.118 12 2.118S21.882 6.533 21.882 12 17.467 21.882 12 21.882z"/>
            </svg>
            {generating ? 'Generando...' : 'WhatsApp'}
          </button>
          {/* Email */}
          <button
            onClick={handleSendEmail}
            disabled={!hasData || generating}
            title={hasData ? `Enviar a ${selectedClient?.email}` : ''}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: hasData && !generating ? 'rgba(59,130,246,0.12)' : 'var(--bg-sunken)',
              border: `1px solid ${hasData && !generating ? 'rgba(59,130,246,0.35)' : 'var(--border)'}`,
              borderRadius: 8, padding: '10px 18px',
              color: hasData && !generating ? '#3b82f6' : 'var(--text-faint)',
              fontSize: 13, fontWeight: 600,
              cursor: hasData && !generating ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s',
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
            {generating ? 'Generando...' : 'Correo'}
          </button>
          {/* PDF */}
          <button
            onClick={handleGeneratePDF}
            disabled={!hasData || generating}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: hasData && !generating ? 'linear-gradient(135deg, var(--gold), var(--gold-light))' : 'var(--bg-sunken)',
              border: 'none', borderRadius: 8, padding: '10px 20px',
              color: hasData && !generating ? '#09090f' : 'var(--text-faint)',
              fontSize: 13, fontWeight: 600,
              cursor: hasData && !generating ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            {generating ? 'Generando...' : 'Descargar PDF'}
          </button>
        </div>
      </div>

      {/* Selectores */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 32 }}>
        <div>
          <label style={{ fontSize: 11, color: 'var(--text-label)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6, display: 'block' }}>Cliente</label>
          <select
            style={inputStyle(false)}
            value={clientId}
            onChange={e => { setClientId(e.target.value); setEventId('') }}
          >
            <option value=''>— Seleccionar cliente —</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 11, color: !clientId ? 'var(--text-faint)' : 'var(--text-label)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6, display: 'block' }}>Evento</label>
          <select
            disabled={!clientId}
            style={inputStyle(!clientId)}
            value={eventId}
            onChange={e => setEventId(e.target.value)}
          >
            <option value=''>
              {!clientId ? '— Primero seleccioná un cliente —' : clientEvents.length === 0 ? '— Sin eventos —' : '— Seleccionar evento —'}
            </option>
            {clientEvents.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
          </select>
        </div>
      </div>

      {/* Aviso sin cotizaciones */}
      {eventId && eventQuotes.length === 0 && (
        <div style={{
          background: 'var(--bg-surface)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 12,
          padding: '20px 24px', marginBottom: 32, color: '#f59e0b', fontSize: 13,
        }}>
          Este evento no tiene cotizaciones cargadas todavía. Agregá cotizaciones desde la sección Cotizaciones.
        </div>
      )}

      {/* Preview */}
      {hasData && (
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-label)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 16 }}>
            Vista previa
          </div>
          <div style={{ border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden', boxShadow: '0 8px 48px rgba(0,0,0,0.15)' }}>
            <BudgetPreview
              client={selectedClient}
              event={selectedEvent}
              quotes={eventQuotes}
              menuSections={menuSections}
              emissionDate={new Date().toISOString()}
            />
          </div>
        </div>
      )}

      {/* Estado vacío */}
      {!eventId && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 300, color: 'var(--text-faint)', gap: 12 }}>
          <div style={{ fontSize: 48 }}>◇</div>
          <div style={{ fontSize: 14 }}>Seleccioná un cliente y evento para ver la vista previa</div>
        </div>
      )}
    </div>
  )
}