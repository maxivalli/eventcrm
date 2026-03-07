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
function BudgetPreview({ client, event, quotes, emissionDate }) {
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

              {q.menu && (
                <div style={{
                  background: col.faint, borderRadius: 8, padding: '16px 20px',
                  border: `1px solid ${col.border}`, marginBottom: 14,
                }}>
                  <div style={{ fontSize: 9, color: col.muted, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 }}>Menú</div>
                  <div style={{ fontSize: 13, color: col.text, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{q.menu}</div>
                </div>
              )}

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
  const [clientId,   setClientId]   = useState('')
  const [eventId,    setEventId]    = useState('')

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

  const clientEvents    = clientId ? events.filter(ev => String(ev.client?.id) === clientId) : []
  const selectedClient  = clients.find(c => String(c.id) === clientId)
  const selectedEvent   = events.find(e => String(e.id) === eventId)
  const eventQuotes     = eventId ? quotes.filter(q => String(q.eventId) === eventId) : []
  const hasData         = selectedClient && selectedEvent && eventQuotes.length > 0

  const handleGeneratePDF = async () => {
    if (!hasData) return
    setGenerating(true)
    try {
      // Cargar librerías si no están
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
        scale:           2,
        useCORS:         true,
        backgroundColor: '#0e0e18',
        logging:         false,
        windowWidth:     element.scrollWidth,
        windowHeight:    element.scrollHeight,
      })

      const pdf      = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pdfW     = pdf.internal.pageSize.getWidth()
      const pdfH     = pdf.internal.pageSize.getHeight()
      const imgW     = canvas.width
      const imgH     = canvas.height
      const ratio    = pdfW / imgW        // px → mm
      const totalMM  = imgH * ratio       // alto total en mm

      const pageCount = Math.ceil(totalMM / pdfH)

      for (let page = 0; page < pageCount; page++) {
        if (page > 0) pdf.addPage()

        // Recortamos el canvas para esta página
        const srcY    = Math.round((page * pdfH) / ratio)
        const srcH    = Math.round(Math.min(pdfH / ratio, imgH - srcY))
        const sliceH  = srcH * ratio   // alto en mm de este slice

        const slice   = document.createElement('canvas')
        slice.width   = imgW
        slice.height  = srcH
        slice.getContext('2d').drawImage(canvas, 0, srcY, imgW, srcH, 0, 0, imgW, srcH)

        pdf.addImage(slice.toDataURL('image/png'), 'PNG', 0, 0, pdfW, sliceH)
      }

      const fileName = `Presupuesto_${selectedClient.name.replace(/\s+/g, '_')}_${selectedEvent.name.replace(/\s+/g, '_')}.pdf`
      pdf.save(fileName)
      toast('PDF generado correctamente', 'success')
    } catch (e) {
      console.error(e)
      toast('Error al generar el PDF')
    } finally {
      setGenerating(false)
    }
  }

  const inputStyle = (disabled) => ({
    width: '100%', background: disabled ? '#0a0a14' : '#12121e',
    border: '1px solid #1e1e30', borderRadius: 8,
    padding: '10px 14px', color: disabled ? '#3a3a5a' : '#e8e8f0',
    fontSize: 13, outline: 'none', boxSizing: 'border-box',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
  })

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#4a4a6a', fontSize: 14 }}>
      Cargando...
    </div>
  )

  return (
    <div>
      {/* Encabezado */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 900, color: '#e8e8f0' }}>
            Generar presupuesto
          </div>
          <div style={{ fontSize: 13, color: '#4a4a6a', marginTop: 4 }}>
            Seleccioná el cliente y evento para armar el PDF
          </div>
        </div>
        <button
          onClick={handleGeneratePDF}
          disabled={!hasData || generating}
          style={{
            background: hasData && !generating ? 'linear-gradient(135deg, #c9a84c, #e8c97a)' : '#1e1e30',
            border: 'none', borderRadius: 8, padding: '10px 24px',
            color: hasData && !generating ? '#09090f' : '#3a3a5a',
            fontSize: 13, fontWeight: 600,
            cursor: hasData && !generating ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s',
          }}
        >
          {generating ? 'Generando...' : '↓ Descargar PDF'}
        </button>
      </div>

      {/* Selectores */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 32 }}>
        <div>
          <label style={{ fontSize: 11, color: '#4a4a6a', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6, display: 'block' }}>Cliente</label>
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
          <label style={{ fontSize: 11, color: !clientId ? '#2a2a40' : '#4a4a6a', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6, display: 'block' }}>Evento</label>
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
          background: '#12121e', border: '1px solid #2a1a0a', borderRadius: 12,
          padding: '20px 24px', marginBottom: 32, color: '#f59e0b', fontSize: 13,
        }}>
          Este evento no tiene cotizaciones cargadas todavía. Agregá cotizaciones desde la sección Cotizaciones.
        </div>
      )}

      {/* Preview */}
      {hasData && (
        <div>
          <div style={{ fontSize: 11, color: '#4a4a6a', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 16 }}>
            Vista previa
          </div>
          <div style={{ border: '1px solid #1e1e30', borderRadius: 16, overflow: 'hidden', boxShadow: '0 8px 48px rgba(0,0,0,0.4)' }}>
            <BudgetPreview
              client={selectedClient}
              event={selectedEvent}
              quotes={eventQuotes}
              emissionDate={new Date().toISOString()}
            />
          </div>
        </div>
      )}

      {/* Estado vacío */}
      {!eventId && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 300, color: '#2a2a40', gap: 12 }}>
          <div style={{ fontSize: 48 }}>◇</div>
          <div style={{ fontSize: 14 }}>Seleccioná un cliente y evento para ver la vista previa</div>
        </div>
      )}
    </div>
  )
}