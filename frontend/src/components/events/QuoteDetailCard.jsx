import { UtensilsCrossed, Sparkles, Check } from "lucide-react";
import { fmt } from "../../utils/eventUtils";

export default function QuoteDetailCard({ quote, calcTotal, SECCION_COLORS, muted = false }) {
  const total      = calcTotal(quote);
  const menu       = quote.menus?.[0]?.menu || null;
  const sections   = menu?.sections || [];
  const isConfirmed = quote.clientStatus === 'Aprobado';

  const kindLabel = { Catering: 'Catering', General: 'Servicio' }[quote.kind] || quote.kind;
  const kindIcon  = { Catering: <UtensilsCrossed size={16} />, General: <Sparkles size={16} /> }[quote.kind] || <Sparkles size={16} />;

  return (
    <div style={{
      border: `1px solid ${isConfirmed ? 'rgba(34,197,94,0.3)' : 'var(--border)'}`,
      borderRadius: 14, overflow: 'hidden',
      background: isConfirmed ? 'rgba(34,197,94,0.03)' : 'var(--bg-sunken)',
      opacity: muted ? 0.7 : 1,
    }}>
      {/* Header */}
      <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-surface)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ display: 'flex', alignItems: 'center' }}>{kindIcon}</span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{kindLabel}</div>
            {quote.kind === 'Catering' && quote.covers && (
              <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 1 }}>{quote.covers} personas · {fmt(quote.pricePerCover)} por cubierto</div>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {isConfirmed && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, color: '#22c55e', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', padding: '3px 10px', borderRadius: 99 }}><Check size={11} /> Confirmado</span>
          )}
          <span style={{ fontSize: 17, fontWeight: 800, color: 'var(--gold)' }}>{fmt(total)}</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: sections.length > 0 ? '1fr 1fr' : '1fr', gap: 0 }}>

        {/* Menú */}
        {sections.length > 0 && (
          <div style={{ borderRight: '1px solid var(--border)', padding: '14px 18px' }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12 }}>
              {menu.name}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {sections.map(sec => {
                const c = SECCION_COLORS[sec.nombre] || '#6b7280';
                return (
                  <div key={sec.id}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                      <div style={{ width: 7, height: 7, borderRadius: '50%', background: c }} />
                      <span style={{ fontSize: 10, fontWeight: 800, color: c, textTransform: 'uppercase', letterSpacing: 1 }}>{sec.nombre}</span>
                    </div>
                    {(sec.items || []).map(item => (
                      <div key={item.id} style={{ paddingLeft: 13, marginBottom: 4 }}>
                        <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>{item.dish?.name}</div>
                        {item.dish?.descripcion && (
                          <div style={{ fontSize: 11, color: 'var(--text-faint)', fontStyle: 'italic' }}>{item.dish.descripcion}</div>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Extras / items */}
        <div style={{ padding: '14px 18px' }}>
          {quote.kind === 'Catering' && quote.covers && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 }}>Base</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--bg-surface)', borderRadius: 8, border: '1px solid var(--border)' }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Servicio por persona</span>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>{quote.covers} × {fmt(quote.pricePerCover)}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{fmt((quote.covers || 0) * (quote.pricePerCover || 0))}</div>
                </div>
              </div>
            </div>
          )}

          {(quote.items || []).length > 0 && (
            <div>
              <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 }}>
                {quote.kind === 'Catering' ? 'Extras' : 'Items'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {(quote.items || []).map((item, i) => (
                  <div key={item.id ?? `item-${i}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'var(--bg-surface)', borderRadius: 8, border: '1px solid var(--border)' }}>
                    <div>
                      <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{item.description}</div>
                      {item.quantity > 1 && <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>Cantidad: {item.quantity}</div>}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{fmt(item.quantity * item.unitPrice)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(quote.items || []).length === 0 && quote.kind !== 'Catering' && (
            <div style={{ fontSize: 12, color: 'var(--text-faint)', fontStyle: 'italic' }}>Sin items detallados</div>
          )}
        </div>
      </div>
    </div>
  );
}
