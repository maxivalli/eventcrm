import { useState, useEffect } from 'react'
import { FileDown, Mail, Globe } from 'lucide-react'
import api from '../api/axios'
import { useToast } from '../components/Toast'

import BudgetPreview from '../components/BudgetPreview'

const formatCurrency = (n) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n || 0)

const formatDateLong = (str) =>
  new Date(str).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })

const calcQuoteTotal = (q) => {
  const items    = (q.items || []).reduce((acc, i) => acc + i.quantity * i.unitPrice, 0)
  const catering = q.kind === 'Catering' ? (q.covers || 0) * (q.pricePerCover || 0) : 0
  return catering + items
}

// ── Página principal ─────────────────────────────────────────────────────────
const selStyle = (disabled) => ({
  width: '100%', background: disabled ? 'var(--bg-base)' : 'var(--bg-sunken)',
  border: '1px solid var(--border)', borderRadius: 8,
  padding: '9px 12px', color: disabled ? 'var(--text-faint)' : 'var(--text-primary)',
  fontSize: 13, outline: 'none', boxSizing: 'border-box',
  cursor: disabled ? 'not-allowed' : 'pointer',
  opacity: disabled ? 0.5 : 1,
})
const lbl = {
  fontSize: 10, color: 'var(--text-faint)', textTransform: 'uppercase',
  letterSpacing: 1.2, marginBottom: 5, display: 'block', fontWeight: 700,
}

export default function Budget() {
  const toast = useToast()
  const [clients,          setClients]          = useState([])
  const [events,           setEvents]           = useState([])
  const [quotes,           setQuotes]           = useState([])
  const [loading,          setLoading]          = useState(true)
  const [generating,       setGenerating]       = useState(false)
  const [publishing,       setPublishing]       = useState(false)
  const [clientId,         setClientId]         = useState('')
  const [eventId,          setEventId]          = useState('')
  const [budgetPublished,  setBudgetPublished]  = useState(false)

  useEffect(() => {
    Promise.all([api.get('/api/clients'), api.get('/api/events'), api.get('/api/quotes')])
      .then(([clRes, evRes, qRes]) => { setClients(clRes.data); setEvents(evRes.data); setQuotes(qRes.data) })
      .catch(() => toast('Error al cargar datos'))
      .finally(() => setLoading(false))
  }, [])

  const clientEvents   = clientId ? events.filter(ev => String(ev.client?.id) === clientId) : []
  const selectedClient = clients.find(c => String(c.id) === clientId)
  const selectedEvent  = events.find(e => String(e.id) === eventId)
  const eventQuotes    = eventId ? quotes.filter(q => String(q.eventId) === eventId) : []
  const hasData        = selectedClient && selectedEvent && eventQuotes.length > 0

  // Sync budgetPublished cuando cambia el evento seleccionado
  useEffect(() => {
    if (selectedEvent) setBudgetPublished(selectedEvent.budgetPublished ?? false)
    else setBudgetPublished(false)
  }, [eventId])

  const handlePublishToggle = async () => {
    if (!selectedEvent || publishing) return
    setPublishing(true)
    try {
      const next = !budgetPublished
      await api.patch(`/api/events/${selectedEvent.id}/publish-budget`, { published: next })
      setBudgetPublished(next)
      setEvents(prev => prev.map(ev => ev.id === selectedEvent.id ? { ...ev, budgetPublished: next } : ev))
      toast(next ? 'Presupuesto publicado en el portal' : 'Presupuesto quitado del portal', 'success')
    } catch (e) {
      toast('Error al actualizar el portal')
    } finally {
      setPublishing(false)
    }
  }

  const allCatering       = eventQuotes.filter(q => q.kind === 'Catering')
  const confirmedCatering = allCatering.filter(q => q.clientStatus === 'Aprobado')
  const cateringForPdf    = confirmedCatering.length > 0 ? confirmedCatering : allCatering.filter(q => !q.clientStatus)
  const grandTotal        = [...eventQuotes.filter(q => q.kind === 'General'), ...cateringForPdf].reduce((acc, q) => acc + calcQuoteTotal(q), 0)
  const menuSections      = eventQuotes.filter(q => q.kind === 'Catering' && q.clientStatus === 'Aprobado')
    .flatMap(q => (q.menus || []).map(qm => qm.menu).filter(Boolean))
    .flatMap(m => m.sections || [])

  const buildPDF = async () => {
    if (!window.jspdf) {
      await new Promise((resolve, reject) => {
        const s = document.createElement('script')
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
        s.onload = resolve; s.onerror = reject; document.head.appendChild(s)
      })
    }
    if (!window.html2canvas) {
      await new Promise((resolve, reject) => {
        const s = document.createElement('script')
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'
        s.onload = resolve; s.onerror = reject; document.head.appendChild(s)
      })
    }
    const { jsPDF } = window.jspdf
    const element   = document.getElementById('budget-preview')
    const canvas    = await window.html2canvas(element, {
      scale: 2, useCORS: true, backgroundColor: '#ffffff',
      logging: false, windowWidth: element.scrollWidth, windowHeight: element.scrollHeight,
    })
    const pdf  = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const pdfW = pdf.internal.pageSize.getWidth()
    const pdfH = pdf.internal.pageSize.getHeight()
    const ratio = pdfW / canvas.width
    const pages = Math.ceil((canvas.height * ratio) / pdfH)
    for (let page = 0; page < pages; page++) {
      if (page > 0) pdf.addPage()
      const srcY  = Math.round((page * pdfH) / ratio)
      const srcH  = Math.round(Math.min(pdfH / ratio, canvas.height - srcY))
      const slice = document.createElement('canvas')
      slice.width = canvas.width; slice.height = srcH
      slice.getContext('2d').drawImage(canvas, 0, srcY, canvas.width, srcH, 0, 0, canvas.width, srcH)
      pdf.addImage(slice.toDataURL('image/png'), 'PNG', 0, 0, pdfW, srcH * ratio)
    }
    return { pdf, fileName: `Presupuesto_${selectedClient.name.replace(/\s+/g, '_')}_${selectedEvent.name.replace(/\s+/g, '_')}.pdf` }
  }

  const handleGeneratePDF = async () => {
    if (!hasData) return; setGenerating(true)
    try { const { pdf, fileName } = await buildPDF(); pdf.save(fileName); toast('PDF generado', 'success') }
    catch (e) { console.error(e); toast('Error al generar el PDF') }
    finally { setGenerating(false) }
  }

  const handleSendEmail = async () => {
    if (!hasData) return; setGenerating(true)
    try {
      const { pdf, fileName } = await buildPDF(); pdf.save(fileName)
      const subject = encodeURIComponent(`Presupuesto HAUS — ${selectedEvent.name}`)
      const body = encodeURIComponent(`Estimado/a ${selectedClient.contact || selectedClient.name},\n\nLe enviamos el presupuesto correspondiente al evento "${selectedEvent.name}" con fecha ${formatDateLong(selectedEvent.date)} en ${selectedEvent.venue}.\n\nEl total asciende a ${formatCurrency(grandTotal)}.\n\nEl archivo PDF ya fue descargado en su carpeta de Descargas — por favor adjúntelo a este correo antes de enviarlo.\n\nQuedo a disposición para cualquier consulta.\n\nSaludos,\nEquipo HAUS`)
      setTimeout(() => { window.open(`mailto:${selectedClient.email}?subject=${subject}&body=${body}`, '_blank'); toast(`PDF descargado · Adjuntá "${fileName}" al correo`, 'success') }, 400)
    } catch (e) { console.error(e); toast('Error al generar el PDF') }
    finally { setGenerating(false) }
  }

  const handleSendWhatsApp = async () => {
    if (!hasData) return; setGenerating(true)
    try {
      const { pdf, fileName } = await buildPDF(); pdf.save(fileName)
      let phone = (selectedClient.phone || '').replace(/[\s\-().+]/g, '')
      if (phone.startsWith('0')) phone = phone.slice(1)
      if (!phone.startsWith('54')) phone = '54' + phone
      const msg = encodeURIComponent(`Hola ${selectedClient.contact || selectedClient.name} 👋\n\nTe compartimos el presupuesto de HAUS para el evento *${selectedEvent.name}* 📋\n\n📅 Fecha: ${formatDateLong(selectedEvent.date)}\n📍 Venue: ${selectedEvent.venue}\n👥 Invitados: ${selectedEvent.guests} personas\n💰 *Total: ${formatCurrency(grandTotal)}*\n\nAdjunto el PDF con el detalle completo. Cualquier consulta, estamos a tu disposición.`)
      setTimeout(() => { window.open(`https://wa.me/${phone}?text=${msg}`, '_blank'); toast(`PDF descargado · Adjuntá "${fileName}" al mensaje`, 'success') }, 400)
    } catch (e) { console.error(e); toast('Error al generar el PDF') }
    finally { setGenerating(false) }
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--text-faint)', fontSize: 13 }}>Cargando...</div>
  )

  return (
    <div>
      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 900, color: 'var(--text-primary)' }}>
            Presupuestos
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-label)', marginTop: 3 }}>
            Generá el PDF del presupuesto para enviar al cliente
          </div>
        </div>

        {/* Botones de acción */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {/* Publicar en portal */}
          <button onClick={handlePublishToggle} disabled={!hasData || publishing}
            style={{ display: 'flex', alignItems: 'center', gap: 7,
              background: budgetPublished ? 'rgba(139,92,246,0.12)' : 'var(--bg-sunken)',
              border: `1px solid ${budgetPublished ? 'rgba(139,92,246,0.4)' : 'var(--border)'}`,
              borderRadius: 8, padding: '9px 16px',
              color: budgetPublished ? '#8b5cf6' : (hasData ? 'var(--text-muted)' : 'var(--text-faint)'),
              fontSize: 13, fontWeight: 600, cursor: hasData && !publishing ? 'pointer' : 'not-allowed', transition: 'all 0.15s' }}>
            <Globe size={14} />
            {publishing ? '...' : budgetPublished ? 'Visible en portal' : 'Publicar en portal'}
          </button>
          <div style={{ width: 1, height: 28, background: 'var(--border)' }} />
          <button onClick={handleSendWhatsApp} disabled={!hasData || generating}
            style={{ display: 'flex', alignItems: 'center', gap: 7,
              background: hasData && !generating ? 'rgba(37,211,102,0.1)' : 'var(--bg-sunken)',
              border: `1px solid ${hasData && !generating ? 'rgba(37,211,102,0.3)' : 'var(--border)'}`,
              borderRadius: 8, padding: '9px 16px',
              color: hasData && !generating ? '#25d366' : 'var(--text-faint)',
              fontSize: 13, fontWeight: 600, cursor: hasData && !generating ? 'pointer' : 'not-allowed', transition: 'all 0.15s' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.554 4.118 1.528 5.849L0 24l6.335-1.505A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.882a9.877 9.877 0 01-5.031-1.378l-.361-.214-3.741.981.999-3.648-.235-.374A9.847 9.847 0 012.118 12C2.118 6.533 6.533 2.118 12 2.118S21.882 6.533 21.882 12 17.467 21.882 12 21.882z"/>
            </svg>
            {generating ? 'Generando...' : 'WhatsApp'}
          </button>

          <button onClick={handleSendEmail} disabled={!hasData || generating}
            style={{ display: 'flex', alignItems: 'center', gap: 7,
              background: hasData && !generating ? 'rgba(59,130,246,0.1)' : 'var(--bg-sunken)',
              border: `1px solid ${hasData && !generating ? 'rgba(59,130,246,0.3)' : 'var(--border)'}`,
              borderRadius: 8, padding: '9px 16px',
              color: hasData && !generating ? '#3b82f6' : 'var(--text-faint)',
              fontSize: 13, fontWeight: 600, cursor: hasData && !generating ? 'pointer' : 'not-allowed', transition: 'all 0.15s' }}>
            <Mail size={14} />
            {generating ? 'Generando...' : 'Correo'}
          </button>

          <button onClick={handleGeneratePDF} disabled={!hasData || generating}
            style={{ display: 'flex', alignItems: 'center', gap: 7,
              background: hasData && !generating ? 'linear-gradient(135deg,#c9a84c,#e8c97a)' : 'var(--bg-sunken)',
              border: 'none', borderRadius: 8, padding: '9px 18px',
              color: hasData && !generating ? '#09090f' : 'var(--text-faint)',
              fontSize: 13, fontWeight: 700, cursor: hasData && !generating ? 'pointer' : 'not-allowed', transition: 'all 0.15s' }}>
            <FileDown size={14} />
            {generating ? 'Generando...' : 'Descargar PDF'}
          </button>
        </div>
      </div>

      {/* ── Selector panel ── */}
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '20px 24px', marginBottom: 20 }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 14 }}>
          Seleccionar evento
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={lbl}>Cliente</label>
            <select style={selStyle(false)} value={clientId} onChange={e => { setClientId(e.target.value); setEventId('') }}>
              <option value="">— Seleccionar cliente —</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ ...lbl, opacity: !clientId ? 0.4 : 1 }}>Evento</label>
            <select style={selStyle(!clientId)} disabled={!clientId} value={eventId} onChange={e => setEventId(e.target.value)}>
              <option value="">{!clientId ? '— Primero seleccioná un cliente —' : clientEvents.length === 0 ? '— Sin eventos —' : '— Seleccionar evento —'}</option>
              {clientEvents.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
            </select>
          </div>
        </div>

        {/* Resumen cuando hay datos */}
        {hasData && (
          <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--border)', display: 'flex', gap: 28, flexWrap: 'wrap', alignItems: 'center' }}>
            <div>
              <div style={{ ...lbl, marginBottom: 2 }}>Cliente</div>
              <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600 }}>{selectedClient.name}</div>
            </div>
            <div>
              <div style={{ ...lbl, marginBottom: 2 }}>Evento</div>
              <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600 }}>{selectedEvent.name}</div>
            </div>
            <div>
              <div style={{ ...lbl, marginBottom: 2 }}>Cotizaciones</div>
              <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600 }}>{eventQuotes.length}</div>
            </div>
            <div style={{ marginLeft: 'auto' }}>
              <div style={{ ...lbl, marginBottom: 2 }}>Total presupuesto</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--gold)', fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(grandTotal)}</div>
            </div>
          </div>
        )}
      </div>

      {/* Sin cotizaciones */}
      {eventId && eventQuotes.length === 0 && (
        <div style={{ background: 'var(--bg-surface)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 12, padding: '16px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 16 }}>⚠️</span>
          <span style={{ fontSize: 13, color: '#f59e0b' }}>Este evento no tiene cotizaciones cargadas. Agregá cotizaciones desde la sección Cotizaciones.</span>
        </div>
      )}

      {/* ── Preview ── */}
      {hasData && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--gold)' }} />
            <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: 1.5 }}>Vista previa del PDF</span>
          </div>
          <div style={{ border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden', boxShadow: '0 8px 40px rgba(0,0,0,0.12)' }}>
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
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 20px', color: 'var(--text-faint)' }}>
          <div style={{ fontSize: 40, marginBottom: 14 }}>◇</div>
          <div style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 6 }}>Seleccioná un cliente y un evento</div>
          <div style={{ fontSize: 12 }}>para ver la vista previa y generar el PDF</div>
        </div>
      )}
    </div>
  )
}