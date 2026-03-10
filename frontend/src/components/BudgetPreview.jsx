// Componente compartido: BudgetPreview
// Usado en Budget.jsx (CRM) y ClientPortal.jsx (portal del cliente)

const formatCurrency = (n) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n || 0)

const formatDateLong = (str) =>
  new Date(str).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })

const calcQuoteTotal = (q) => {
  const items    = (q.items || []).reduce((acc, i) => acc + i.quantity * i.unitPrice, 0)
  const catering = q.kind === 'Catering' ? (q.covers || 0) * (q.pricePerCover || 0) : 0
  return catering + items
}

const SECCION_ORDER = ['Entrada', 'Plato principal', 'Guarnición', 'Bebidas', 'Postre', 'Trasnoche', 'Otros']
const sortSections  = (sections) =>
  [...sections].sort((a, b) => {
    const ia = SECCION_ORDER.indexOf(a.nombre), ib = SECCION_ORDER.indexOf(b.nombre)
    if (ia === -1 && ib === -1) return 0; if (ia === -1) return 1; if (ib === -1) return -1
    return ia - ib
  })

// ── PDF Preview — paleta CLARA ───────────────────────────────────────────────
function BudgetPreview({ client, event, quotes, menuSections, emissionDate }) {
  const generalQuotes     = quotes.filter(q => q.kind === 'General')
  const allCatering       = quotes.filter(q => q.kind === 'Catering')
  const confirmedCatering = allCatering.filter(q => q.clientStatus === 'Aprobado')
  const cateringQuotes    = confirmedCatering.length > 0 ? confirmedCatering : allCatering.filter(q => !q.clientStatus)
  const grandTotal        = [...generalQuotes, ...cateringQuotes].reduce((acc, q) => acc + calcQuoteTotal(q), 0)

  // Paleta clara — pensada para impresión y PDF
  const c = {
    bg:         '#ffffff',
    surface:    '#f8f7f4',
    surfaceAlt: '#f2f0eb',
    border:     '#e2ddd6',
    borderDark: '#ccc7be',
    text:       '#1a1714',
    textMid:    '#4a4540',
    textMuted:  '#7a746c',
    gold:       '#a07828',
    goldLight:  '#c49a32',
    goldBg:     '#fdf6e3',
    goldBorder: '#e8d49a',
    orange:     '#b85a18',
    orangeBg:   '#fef3ec',
    orangeBorder:'#f0c8a0',
  }

  const sectionTitle = (label, color = c.gold) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
      <div style={{ height: 1, flex: 1, background: color + '50' }} />
      <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: 3, textTransform: 'uppercase', color }}>{label}</span>
      <div style={{ height: 1, flex: 1, background: color + '50' }} />
    </div>
  )

  const tableHeaderStyle = {
    display: 'grid', gridTemplateColumns: '3fr 60px 130px 130px',
    background: c.surfaceAlt, padding: '9px 16px', borderBottom: `1px solid ${c.border}`,
    fontSize: 9, color: c.textMuted, letterSpacing: 1.8, textTransform: 'uppercase',
  }

  const secColors = {
    'Entrada':         '#2563eb', 'Plato principal': '#7c3aed',
    'Guarnición':      '#16a34a', 'Bebidas':         '#0891b2',
    'Postre':          '#db2777', 'Trasnoche':       '#ea580c', 'Otros': '#6b7280',
  }

  return (
    <div id="budget-preview" style={{
      background: c.bg, color: c.text,
      fontFamily: "'Georgia', 'Times New Roman', serif",
      padding: '48px 52px', maxWidth: 760, margin: '0 auto',
    }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: 36, paddingBottom: 28, borderBottom: `2px solid ${c.gold}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontFamily: "'Georgia', serif", fontSize: 28, fontWeight: 700, color: c.gold, letterSpacing: 2, marginBottom: 4 }}>
              HAUS
            </div>
            <div style={{ fontSize: 10, color: c.textMuted, letterSpacing: 2.5, textTransform: 'uppercase' }}>
              Organización y producción de eventos
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 9, color: c.textMuted, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 5 }}>Presupuesto</div>
            <div style={{ fontSize: 12, color: c.textMid, fontWeight: 600 }}>{formatDateLong(emissionDate)}</div>
          </div>
        </div>
      </div>

      {/* ── Cliente + Evento ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 36 }}>
        <div style={{ background: c.surface, borderRadius: 10, padding: '18px 20px', border: `1px solid ${c.border}` }}>
          <div style={{ fontSize: 8, color: c.textMuted, letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: 10, fontFamily: 'Arial, sans-serif' }}>Preparado para</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: c.text, marginBottom: 6 }}>{client.name}</div>
          {client.contact && <div style={{ fontSize: 12, color: c.textMuted, marginBottom: 2 }}>{client.contact}</div>}
          {client.email   && <div style={{ fontSize: 12, color: c.textMuted, marginBottom: 2 }}>{client.email}</div>}
          {client.phone   && <div style={{ fontSize: 12, color: c.textMuted }}>{client.phone}</div>}
        </div>
        <div style={{ background: c.surface, borderRadius: 10, padding: '18px 20px', border: `1px solid ${c.border}` }}>
          <div style={{ fontSize: 8, color: c.textMuted, letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: 10, fontFamily: 'Arial, sans-serif' }}>Evento</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: c.text, marginBottom: 10 }}>{event.name}</div>
          {[
            { label: 'Fecha',     value: formatDateLong(event.date) },
            { label: 'Venue',     value: event.venue                },
            { label: 'Invitados', value: `${event.guests} personas` },
          ].map(r => (
            <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 11, color: c.textMuted }}>{r.label}</span>
              <span style={{ fontSize: 11, color: c.textMid, fontWeight: 500 }}>{r.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Cotizaciones Generales ── */}
      {generalQuotes.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          {sectionTitle('Servicios incluidos')}
          {generalQuotes.map(q => (
            <div key={q.id} style={{ marginBottom: 20, pageBreakInside: 'avoid' }}>
              <div style={{ borderRadius: 8, overflow: 'hidden', border: `1px solid ${c.border}` }}>
                <div style={tableHeaderStyle}>
                  <span>Descripción</span>
                  <span style={{ textAlign: 'center' }}>Cant.</span>
                  <span style={{ textAlign: 'right' }}>Precio unit.</span>
                  <span style={{ textAlign: 'right' }}>Subtotal</span>
                </div>
                {q.items.map((item, i) => (
                  <div key={item.id} style={{
                    display: 'grid', gridTemplateColumns: '3fr 60px 130px 130px',
                    padding: '11px 16px', alignItems: 'center',
                    borderBottom: `1px solid ${c.border}`,
                    background: i % 2 === 0 ? c.bg : c.surface,
                  }}>
                    <span style={{ fontSize: 13, color: c.text }}>{item.description}</span>
                    <span style={{ fontSize: 12, color: c.textMuted, textAlign: 'center' }}>{item.quantity}</span>
                    <span style={{ fontSize: 12, color: c.textMuted, textAlign: 'right' }}>{formatCurrency(item.unitPrice)}</span>
                    <span style={{ fontSize: 13, color: c.text, textAlign: 'right', fontWeight: 600 }}>{formatCurrency(item.quantity * item.unitPrice)}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 16px', background: c.goldBg, borderTop: `1px solid ${c.goldBorder}` }}>
                  <span style={{ fontSize: 9, color: c.gold, letterSpacing: 1.5, textTransform: 'uppercase', fontFamily: 'Arial, sans-serif', fontWeight: 700 }}>Subtotal servicios</span>
                  <span style={{ fontSize: 16, fontWeight: 700, color: c.gold }}>{formatCurrency(calcQuoteTotal(q))}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Cotizaciones Catering ── */}
      {cateringQuotes.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          {sectionTitle('Catering', c.orange)}
          {cateringQuotes.map(q => (
            <div key={q.id} style={{ marginBottom: 20, pageBreakInside: 'avoid' }}>

              {/* Menú */}
              {menuSections && menuSections.length > 0 && (() => {
                const totalPlatos = menuSections.reduce((acc, s) => acc + s.items.length, 0)
                return (
                  <div style={{ background: c.surface, borderRadius: 8, border: `1px solid ${c.border}`, marginBottom: 12, overflow: 'hidden' }}>
                    <div style={{ padding: '10px 16px', borderBottom: `1px solid ${c.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: c.surfaceAlt }}>
                      <span style={{ fontSize: 9, color: c.textMuted, letterSpacing: 2, textTransform: 'uppercase', fontFamily: 'Arial, sans-serif', fontWeight: 700 }}>Menú incluido</span>
                      <span style={{ fontSize: 10, color: c.textMuted }}>{totalPlatos} plato{totalPlatos !== 1 ? 's' : ''}</span>
                    </div>
                    {sortSections(menuSections).map((section, si) => (
                      <div key={section.id} style={{ borderTop: si > 0 ? `1px solid ${c.border}` : 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px 5px', background: c.surface }}>
                          <div style={{ width: 5, height: 5, borderRadius: '50%', background: secColors[section.nombre] || c.textMuted, flexShrink: 0 }} />
                          <span style={{ fontSize: 8, fontWeight: 800, color: secColors[section.nombre] || c.textMuted, letterSpacing: 2, textTransform: 'uppercase', fontFamily: 'Arial, sans-serif' }}>{section.nombre}</span>
                        </div>
                        {section.items.map((item, di) => (
                          <div key={item.id || di} style={{ padding: '7px 16px 7px 28px', borderTop: `1px solid ${c.border}30` }}>
                            <div style={{ fontSize: 12, color: c.text, fontWeight: 500 }}>{item.dish?.name}</div>
                            {item.dish?.descripcion && (
                              <div style={{ fontSize: 10, color: c.textMuted, lineHeight: 1.4, marginTop: 1 }}>{item.dish.descripcion}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )
              })()}

              {/* Cubiertos */}
              <div style={{ borderRadius: 8, overflow: 'hidden', border: `1px solid ${c.border}`, marginBottom: 10 }}>
                <div style={tableHeaderStyle}>
                  <span>Descripción</span>
                  <span style={{ textAlign: 'center' }}>Cant.</span>
                  <span style={{ textAlign: 'right' }}>Precio unit.</span>
                  <span style={{ textAlign: 'right' }}>Subtotal</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '3fr 60px 130px 130px', padding: '12px 16px', background: c.bg }}>
                  <span style={{ fontSize: 13, color: c.text }}>Servicio de catering por persona</span>
                  <span style={{ fontSize: 12, color: c.textMuted, textAlign: 'center' }}>{q.covers}</span>
                  <span style={{ fontSize: 12, color: c.textMuted, textAlign: 'right' }}>{formatCurrency(q.pricePerCover)}</span>
                  <span style={{ fontSize: 13, color: c.text, textAlign: 'right', fontWeight: 600 }}>{formatCurrency((q.covers || 0) * (q.pricePerCover || 0))}</span>
                </div>
              </div>

              {/* Extras */}
              {q.items.length > 0 && (
                <div style={{ borderRadius: 8, overflow: 'hidden', border: `1px solid ${c.border}`, marginBottom: 10 }}>
                  <div style={tableHeaderStyle}>
                    <span>Servicios adicionales</span>
                    <span style={{ textAlign: 'center' }}>Cant.</span>
                    <span style={{ textAlign: 'right' }}>Precio unit.</span>
                    <span style={{ textAlign: 'right' }}>Subtotal</span>
                  </div>
                  {q.items.map((item, i) => (
                    <div key={item.id} style={{
                      display: 'grid', gridTemplateColumns: '3fr 60px 130px 130px',
                      padding: '10px 16px', borderTop: `1px solid ${c.border}`,
                      alignItems: 'center', background: i % 2 === 0 ? c.bg : c.surface,
                    }}>
                      <span style={{ fontSize: 13, color: c.text }}>{item.description}</span>
                      <span style={{ fontSize: 12, color: c.textMuted, textAlign: 'center' }}>{item.quantity}</span>
                      <span style={{ fontSize: 12, color: c.textMuted, textAlign: 'right' }}>{formatCurrency(item.unitPrice)}</span>
                      <span style={{ fontSize: 13, color: c.text, textAlign: 'right', fontWeight: 600 }}>{formatCurrency(item.quantity * item.unitPrice)}</span>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 16px', borderRadius: 8, background: c.orangeBg, border: `1px solid ${c.orangeBorder}` }}>
                <span style={{ fontSize: 9, color: c.orange, letterSpacing: 1.5, textTransform: 'uppercase', fontFamily: 'Arial, sans-serif', fontWeight: 700 }}>Subtotal catering</span>
                <span style={{ fontSize: 16, fontWeight: 700, color: c.orange }}>{formatCurrency(calcQuoteTotal(q))}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Total general ── */}
      <div style={{ pageBreakInside: 'avoid', marginBottom: 28, borderRadius: 12, overflow: 'hidden', border: `1px solid ${c.goldBorder}` }}>
        {generalQuotes.length > 0 && cateringQuotes.length > 0 && (
          <div style={{ background: c.surface, padding: '14px 22px', borderBottom: `1px solid ${c.border}` }}>
            {generalQuotes.map(q => (
              <div key={q.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ fontSize: 12, color: c.textMuted }}>Servicios</span>
                <span style={{ fontSize: 12, color: c.textMid, fontWeight: 500 }}>{formatCurrency(calcQuoteTotal(q))}</span>
              </div>
            ))}
            {cateringQuotes.map(q => (
              <div key={q.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ fontSize: 12, color: c.textMuted }}>Catering</span>
                <span style={{ fontSize: 12, color: c.textMid, fontWeight: 500 }}>{formatCurrency(calcQuoteTotal(q))}</span>
              </div>
            ))}
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 22px', background: c.goldBg }}>
          <div>
            <div style={{ fontSize: 9, color: c.gold, letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: 4, fontFamily: 'Arial, sans-serif', fontWeight: 800 }}>Total general</div>
            <div style={{ fontSize: 11, color: c.textMuted }}>Incluye todos los servicios</div>
          </div>
          <div style={{ fontSize: 30, fontWeight: 700, color: c.gold }}>{formatCurrency(grandTotal)}</div>
        </div>
      </div>

      {/* ── Nota legal ── */}
      <div style={{ pageBreakInside: 'avoid', background: c.surface, borderRadius: 10, padding: '16px 20px', border: `1px solid ${c.border}`, marginBottom: 32, fontSize: 11, color: c.textMuted, lineHeight: 1.7, fontStyle: 'italic' }}>
        Este presupuesto tiene validez de 30 días a partir de la fecha de emisión. Los valores indicados son en pesos argentinos e incluyen IVA.
      </div>

      {/* ── Footer ── */}
      <div style={{ pageBreakInside: 'avoid', borderTop: `1px solid ${c.border}`, paddingTop: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 10, color: c.textMuted }}>HAUS — Organización y producción de eventos</div>
        <div style={{ fontSize: 10, color: c.textMuted }}>{formatDateLong(emissionDate)}</div>
      </div>
    </div>
  )
}

export default BudgetPreview
