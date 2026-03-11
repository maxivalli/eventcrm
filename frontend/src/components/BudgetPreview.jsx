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

const secColors = {
  'Entrada':         '#2563eb', 'Plato principal': '#7c3aed',
  'Guarnición':      '#16a34a', 'Bebidas':         '#0891b2',
  'Postre':          '#db2777', 'Trasnoche':       '#ea580c', 'Otros': '#6b7280',
}

// Paleta clara — pensada para impresión y PDF
const c = {
  bg:          '#ffffff',
  surface:     '#f8f7f4',
  surfaceAlt:  '#f2f0eb',
  border:      '#e2ddd6',
  borderDark:  '#ccc7be',
  text:        '#1a1714',
  textMid:     '#4a4540',
  textMuted:   '#7a746c',
  gold:        '#a07828',
  goldLight:   '#c49a32',
  goldBg:      '#fdf6e3',
  goldBorder:  '#e8d49a',
  orange:      '#b85a18',
  orangeBg:    '#fef3ec',
  orangeBorder:'#f0c8a0',
}

const sectionTitle = (label, color = c.gold) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
    <div style={{ height: 1, flex: 1, background: color + '50' }} />
    <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: 3, textTransform: 'uppercase', color }}>{label}</span>
    <div style={{ height: 1, flex: 1, background: color + '50' }} />
  </div>
)

// Fila de item responsive: en mobile apila descripción arriba y cant/precio/subtotal abajo
function ItemRow({ description, quantity, unitPrice, bg }) {
  return (
    <div style={{ padding: '10px 14px', borderBottom: `1px solid ${c.border}`, background: bg }}>
      <div style={{ fontSize: 12, color: c.text, marginBottom: 5 }}>{description}</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 11, color: c.textMuted }}>{quantity} u. × {formatCurrency(unitPrice)}</span>
        <span style={{ fontSize: 13, color: c.text, fontWeight: 700 }}>{formatCurrency(quantity * unitPrice)}</span>
      </div>
    </div>
  )
}

function BudgetPreview({ client, event, quotes, menuSections, emissionDate }) {
  const generalQuotes     = quotes.filter(q => q.kind === 'General')
  const allCatering       = quotes.filter(q => q.kind === 'Catering')
  const confirmedCatering = allCatering.filter(q => q.clientStatus === 'Aprobado')
  const cateringQuotes    = confirmedCatering.length > 0 ? confirmedCatering : allCatering.filter(q => !q.clientStatus)
  const grandTotal        = [...generalQuotes, ...cateringQuotes].reduce((acc, q) => acc + calcQuoteTotal(q), 0)

  return (
    <div id="budget-preview" style={{
      background: c.bg, color: c.text,
      fontFamily: "'Georgia', 'Times New Roman', serif",
      padding: 'clamp(20px, 5vw, 52px) clamp(16px, 5vw, 52px)',
      maxWidth: 760, margin: '0 auto', boxSizing: 'border-box',
    }}>

      {/* ── Estilos responsive ── */}
      <style>{`
        .bp-header-grid { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
        .bp-client-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 28px; }
        .bp-footer      { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; }
        @media (max-width: 480px) {
          .bp-header-grid { flex-direction: column; gap: 8px; }
          .bp-header-grid > div:last-child { text-align: left !important; }
          .bp-client-grid { grid-template-columns: 1fr; }
          .bp-footer { flex-direction: column; align-items: flex-start; }
        }
      `}</style>

      {/* ── Header ── */}
      <div style={{ marginBottom: 28, paddingBottom: 22, borderBottom: `2px solid ${c.gold}` }}>
        <div className="bp-header-grid">
          <div>
            <div style={{ fontFamily: "'Georgia', serif", fontSize: 26, fontWeight: 700, color: c.gold, letterSpacing: 2, marginBottom: 4 }}>
              HAUS
            </div>
            <div style={{ fontSize: 9, color: c.textMuted, letterSpacing: 2, textTransform: 'uppercase' }}>
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
      <div className="bp-client-grid">
        <div style={{ background: c.surface, borderRadius: 10, padding: '16px 18px', border: `1px solid ${c.border}` }}>
          <div style={{ fontSize: 8, color: c.textMuted, letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: 8, fontFamily: 'Arial, sans-serif' }}>Preparado para</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: c.text, marginBottom: 5 }}>{client.name}</div>
          {client.contact && <div style={{ fontSize: 11, color: c.textMuted, marginBottom: 2 }}>{client.contact}</div>}
          {client.email   && <div style={{ fontSize: 11, color: c.textMuted, marginBottom: 2 }}>{client.email}</div>}
          {client.phone   && <div style={{ fontSize: 11, color: c.textMuted }}>{client.phone}</div>}
        </div>
        <div style={{ background: c.surface, borderRadius: 10, padding: '16px 18px', border: `1px solid ${c.border}` }}>
          <div style={{ fontSize: 8, color: c.textMuted, letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: 8, fontFamily: 'Arial, sans-serif' }}>Evento</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: c.text, marginBottom: 8 }}>{event.name}</div>
          {[
            { label: 'Fecha',     value: formatDateLong(event.date) },
            { label: 'Venue',     value: event.venue                },
            { label: 'Invitados', value: `${event.guests} pers.`    },
          ].map(r => (
            <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, gap: 8 }}>
              <span style={{ fontSize: 11, color: c.textMuted, flexShrink: 0 }}>{r.label}</span>
              <span style={{ fontSize: 11, color: c.textMid, fontWeight: 500, textAlign: 'right' }}>{r.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Cotizaciones Generales ── */}
      {generalQuotes.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          {sectionTitle('Servicios incluidos')}
          {generalQuotes.map(q => (
            <div key={q.id} style={{ marginBottom: 16, pageBreakInside: 'avoid' }}>
              <div style={{ borderRadius: 8, overflow: 'hidden', border: `1px solid ${c.border}` }}>
                {/* Header columnas — solo desktop */}
                <div style={{ display: 'flex', justifyContent: 'space-between', background: c.surfaceAlt, padding: '8px 14px', borderBottom: `1px solid ${c.border}` }}>
                  <span style={{ fontSize: 9, color: c.textMuted, letterSpacing: 1.5, textTransform: 'uppercase', fontFamily: 'Arial, sans-serif' }}>Descripción</span>
                  <span style={{ fontSize: 9, color: c.textMuted, letterSpacing: 1.5, textTransform: 'uppercase', fontFamily: 'Arial, sans-serif' }}>Subtotal</span>
                </div>
                {q.items.map((item, i) => (
                  <ItemRow key={item.id} description={item.description} quantity={item.quantity} unitPrice={item.unitPrice} bg={i % 2 === 0 ? c.bg : c.surface} />
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 14px', background: c.goldBg, borderTop: `1px solid ${c.goldBorder}` }}>
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
        <div style={{ marginBottom: 28 }}>
          {sectionTitle('Catering', c.orange)}
          {cateringQuotes.map(q => (
            <div key={q.id} style={{ marginBottom: 16, pageBreakInside: 'avoid' }}>

              {/* Menú embebido */}
              {menuSections && menuSections.length > 0 && (() => {
                const totalPlatos = menuSections.reduce((acc, s) => acc + s.items.length, 0)
                return (
                  <div style={{ background: c.surface, borderRadius: 8, border: `1px solid ${c.border}`, marginBottom: 10, overflow: 'hidden' }}>
                    <div style={{ padding: '9px 14px', borderBottom: `1px solid ${c.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: c.surfaceAlt }}>
                      <span style={{ fontSize: 9, color: c.textMuted, letterSpacing: 2, textTransform: 'uppercase', fontFamily: 'Arial, sans-serif', fontWeight: 700 }}>Menú incluido</span>
                      <span style={{ fontSize: 10, color: c.textMuted }}>{totalPlatos} plato{totalPlatos !== 1 ? 's' : ''}</span>
                    </div>
                    {sortSections(menuSections).map((section, si) => (
                      <div key={section.id} style={{ borderTop: si > 0 ? `1px solid ${c.border}` : 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 14px 4px', background: c.surface }}>
                          <div style={{ width: 5, height: 5, borderRadius: '50%', background: secColors[section.nombre] || c.textMuted, flexShrink: 0 }} />
                          <span style={{ fontSize: 8, fontWeight: 800, color: secColors[section.nombre] || c.textMuted, letterSpacing: 2, textTransform: 'uppercase', fontFamily: 'Arial, sans-serif' }}>{section.nombre}</span>
                        </div>
                        {section.items.map((item, di) => (
                          <div key={item.id || di} style={{ padding: '6px 14px 6px 26px', borderTop: `1px solid ${c.border}30` }}>
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
              <div style={{ borderRadius: 8, overflow: 'hidden', border: `1px solid ${c.border}`, marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', background: c.surfaceAlt, padding: '8px 14px', borderBottom: `1px solid ${c.border}` }}>
                  <span style={{ fontSize: 9, color: c.textMuted, letterSpacing: 1.5, textTransform: 'uppercase', fontFamily: 'Arial, sans-serif' }}>Descripción</span>
                  <span style={{ fontSize: 9, color: c.textMuted, letterSpacing: 1.5, textTransform: 'uppercase', fontFamily: 'Arial, sans-serif' }}>Subtotal</span>
                </div>
                <ItemRow description="Servicio de catering por persona" quantity={q.covers} unitPrice={q.pricePerCover} bg={c.bg} />
              </div>

              {/* Extras */}
              {q.items.length > 0 && (
                <div style={{ borderRadius: 8, overflow: 'hidden', border: `1px solid ${c.border}`, marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', background: c.surfaceAlt, padding: '8px 14px', borderBottom: `1px solid ${c.border}` }}>
                    <span style={{ fontSize: 9, color: c.textMuted, letterSpacing: 1.5, textTransform: 'uppercase', fontFamily: 'Arial, sans-serif' }}>Servicios adicionales</span>
                    <span style={{ fontSize: 9, color: c.textMuted, letterSpacing: 1.5, textTransform: 'uppercase', fontFamily: 'Arial, sans-serif' }}>Subtotal</span>
                  </div>
                  {q.items.map((item, i) => (
                    <ItemRow key={item.id} description={item.description} quantity={item.quantity} unitPrice={item.unitPrice} bg={i % 2 === 0 ? c.bg : c.surface} />
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 14px', borderRadius: 8, background: c.orangeBg, border: `1px solid ${c.orangeBorder}` }}>
                <span style={{ fontSize: 9, color: c.orange, letterSpacing: 1.5, textTransform: 'uppercase', fontFamily: 'Arial, sans-serif', fontWeight: 700 }}>Subtotal catering</span>
                <span style={{ fontSize: 16, fontWeight: 700, color: c.orange }}>{formatCurrency(calcQuoteTotal(q))}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Total general ── */}
      <div style={{ pageBreakInside: 'avoid', marginBottom: 24, borderRadius: 12, overflow: 'hidden', border: `1px solid ${c.goldBorder}` }}>
        {generalQuotes.length > 0 && cateringQuotes.length > 0 && (
          <div style={{ background: c.surface, padding: '12px 18px', borderBottom: `1px solid ${c.border}` }}>
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 18px', background: c.goldBg, gap: 12 }}>
          <div>
            <div style={{ fontSize: 9, color: c.gold, letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: 4, fontFamily: 'Arial, sans-serif', fontWeight: 800 }}>Total general</div>
            <div style={{ fontSize: 11, color: c.textMuted }}>Incluye todos los servicios</div>
          </div>
          <div style={{ fontSize: 'clamp(20px, 5vw, 30px)', fontWeight: 700, color: c.gold }}>{formatCurrency(grandTotal)}</div>
        </div>
      </div>

      {/* ── Nota legal ── */}
      <div style={{ pageBreakInside: 'avoid', background: c.surface, borderRadius: 10, padding: '14px 18px', border: `1px solid ${c.border}`, marginBottom: 28, fontSize: 11, color: c.textMuted, lineHeight: 1.7, fontStyle: 'italic' }}>
        Este presupuesto tiene validez de 30 días a partir de la fecha de emisión. Los valores indicados son en pesos argentinos e incluyen IVA.
      </div>

      {/* ── Footer ── */}
      <div className="bp-footer" style={{ borderTop: `1px solid ${c.border}`, paddingTop: 16 }}>
        <div style={{ fontSize: 10, color: c.textMuted }}>HAUS — Organización y producción de eventos</div>
        <div style={{ fontSize: 10, color: c.textMuted }}>{formatDateLong(emissionDate)}</div>
      </div>
    </div>
  )
}

export default BudgetPreview