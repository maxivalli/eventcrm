import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { MessageCircle, Paperclip, ClipboardList, Link2, AlertCircle, FileText } from "lucide-react";
import api from "../api/axios";
import { useToast } from "../components/Toast";
import ConfirmDialog from "../components/ConfirmDialog";
import Checklist from "../components/Checklist";
import EventFiles from "../components/EventFiles";
import Cronograma from "../components/Cronograma";

const statusColors = {
  Confirmado:       "#22c55e",
  Propuesta:        "#f59e0b",
  Finalizado:       "#8b5cf6",
};

const isPastEvent = (ev) => {
  if (ev.status === 'Finalizado') return false
  const eventDate = new Date(ev.date)
  if (ev.time) {
    const [h, m] = ev.time.split(':')
    eventDate.setHours(Number(h), Number(m), 0, 0)
  } else {
    eventDate.setHours(23, 59, 0, 0)
  }
  return eventDate < new Date()
}

// Inyectar keyframe una sola vez
if (!document.getElementById('past-event-style')) {
  const style = document.createElement('style')
  style.id = 'past-event-style'
  style.textContent = `
    @keyframes pulse-past {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }
  `
  document.head.appendChild(style)
}
const SECCION_ORDER = ['Entrada', 'Plato principal', 'Guarnición', 'Bebidas', 'Postre', 'Trasnoche', 'Otros']
const sortSections = (sections) =>
  [...sections].sort((a, b) => {
    const ia = SECCION_ORDER.indexOf(a.nombre)
    const ib = SECCION_ORDER.indexOf(b.nombre)
    if (ia === -1 && ib === -1) return 0
    if (ia === -1) return 1
    if (ib === -1) return -1
    return ia - ib
  })
const quoteStatusColors = {
  Aprobado:  "#22c55e",
  Pendiente: "#f59e0b",
  Rechazado: "#ef4444",
};
const typeColors = {
  Corporativo: "#3b82f6",
  Cultural:    "#8b5cf6",
  Social:      "#ec4899",
};
const ESTADOS = ["Todos", "Propuesta", "Confirmado", "Finalizado"];

const fmt = (n) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n || 0);
const fmtDate = (str) =>
  new Date(str).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" });

function Badge({ label, color }) {
  return (
    <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, fontWeight: 600, background: `${color}20`, color, whiteSpace: "nowrap" }}>
      {label}
    </span>
  );
}

function BalanceBar({ label, value, max, color }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{label}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color }}>{fmt(value)}</span>
      </div>
      <div style={{ background: "var(--border-strong)", borderRadius: 99, height: 7, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 99, transition: "width 0.7s ease" }} />
      </div>
    </div>
  );
}

const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const DIAS  = ["Lu","Ma","Mi","Ju","Vi","Sá","Do"];

function parseLocalDate(str) {
  if (!str) return null;
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d);
}
function toLocalISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function DatePicker({ value, onChange, hasError }) {
  const today      = new Date();
  const initial    = value ? parseLocalDate(value) : null;
  const [open, setOpen]     = useState(false);
  const [cursor, setCursor] = useState(initial ?? today);

  const year  = cursor.getFullYear();
  const month = cursor.getMonth();

  const firstDay = new Date(year, month, 1);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const select = (day) => {
    if (!day) return;
    const picked = new Date(year, month, day);
    onChange(toLocalISO(picked));
    setOpen(false);
  };

  const prevMonth = () => setCursor(new Date(year, month - 1, 1));
  const nextMonth = () => setCursor(new Date(year, month + 1, 1));

  const isSelected = (day) => {
    if (!day || !value) return false;
    const sel = parseLocalDate(value);
    return sel && sel.getFullYear() === year && sel.getMonth() === month && sel.getDate() === day;
  };
  const isToday = (day) => {
    if (!day) return false;
    return today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
  };

  const displayValue = value
    ? parseLocalDate(value).toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" })
    : "Seleccionar fecha...";

  return (
    <div style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          width: "100%", background: "var(--bg-sunken)",
          border: `1px solid ${hasError ? "#ef4444" : open ? "var(--gold)" : "var(--border)"}`,
          borderRadius: 8, padding: "10px 14px", color: value ? "var(--text-primary)" : "var(--text-faint)",
          fontSize: 13, outline: "none", boxSizing: "border-box", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          transition: "border-color 0.2s",
        }}
      >
        <span>{displayValue}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "var(--text-label)", flexShrink: 0 }}>
          <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
      </button>

      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 299 }} />
          <div style={{
            position: "absolute", top: "calc(100% + 8px)", left: 0, zIndex: 300,
            background: "var(--bg-surface)", border: "1px solid var(--border-strong)", borderRadius: 14,
            padding: 18, width: 280, boxShadow: "0 16px 48px rgba(0,0,0,0.6)",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <button type="button" onClick={prevMonth} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "4px 8px", borderRadius: 6, fontSize: 16, lineHeight: 1 }}>‹</button>
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
                {MESES[month]} {year}
              </span>
              <button type="button" onClick={nextMonth} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "4px 8px", borderRadius: 6, fontSize: 16, lineHeight: 1 }}>›</button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginBottom: 6 }}>
              {DIAS.map(d => (
                <div key={d} style={{ textAlign: "center", fontSize: 10, color: "var(--text-faint)", fontWeight: 700, padding: "4px 0", textTransform: "uppercase", letterSpacing: 0.5 }}>{d}</div>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
              {cells.map((day, i) => {
                const sel = isSelected(day);
                const tod = isToday(day);
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => select(day)}
                    disabled={!day}
                    style={{
                      aspectRatio: "1", border: "none", borderRadius: 8, cursor: day ? "pointer" : "default",
                      fontSize: 12, fontWeight: sel ? 700 : 400,
                      background: sel ? "linear-gradient(135deg, #c9a84c, #e8c97a)" : tod ? "rgba(201,168,76,0.12)" : "transparent",
                      color: sel ? "#09090f" : tod ? "var(--gold)" : day ? "var(--text-secondary)" : "transparent",
                      outline: "none", transition: "background 0.15s",
                    }}
                    onMouseEnter={e => { if (day && !sel) e.currentTarget.style.background = "var(--bg-hover)" }}
                    onMouseLeave={e => { if (day && !sel) e.currentTarget.style.background = tod ? "rgba(201,168,76,0.12)" : "transparent" }}
                  >
                    {day || ""}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => { onChange(toLocalISO(today)); setCursor(today); setOpen(false); }}
              style={{ width: "100%", marginTop: 12, padding: "7px", border: "1px solid var(--border)", borderRadius: 8, background: "transparent", color: "var(--text-muted)", fontSize: 11, cursor: "pointer", letterSpacing: 0.5 }}
            >
              Hoy
            </button>
          </div>
        </>
      )}
    </div>
  );
}

const DIETARY_OPTIONS = [
  { key: 'celiac',     label: 'Celíacos',     icon: '🌾' },
  { key: 'vegan',      label: 'Veganos',       icon: '🌱' },
  { key: 'vegetarian', label: 'Vegetarianos',  icon: '🥦' },
  { key: 'diabetic',   label: 'Diabéticos',    icon: '🩺' },
  { key: 'kosher',     label: 'Kosher',        icon: '✡️' },
  { key: 'lactose',    label: 'Sin lactosa',   icon: '🥛' },
]

const emptyForm = { name: "", clientId: "", date: "", time: "", venue: "", type: "Corporativo", status: "Propuesta", guests: "", budget: "", dietaryOptions: [] };

function EventForm({ initial, clients, onSave, onClose }) {
  const [form, setForm] = useState(
    initial ? { ...initial, clientId: String(initial.clientId), date: initial.date?.slice(0, 10), time: initial.time || "", dietaryOptions: (() => { try { const d = typeof initial.dietaryOptions === 'string' ? JSON.parse(initial.dietaryOptions) : (initial.dietaryOptions || []); return Array.isArray(d) ? d : [] } catch { return [] } })() } : emptyForm
  );
  const [errors, setErrors] = useState({});
  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: "" })) };

  const validate = () => {
    const e = {};
    if (!form.name.trim())                     e.name     = "Requerido";
    if (!form.clientId)                        e.clientId = "Seleccionar cliente";
    if (!form.date)                            e.date     = "Requerido";
    if (!form.venue.trim())                    e.venue    = "Requerido";
    if (!form.guests  || Number(form.guests)  <= 0) e.guests = "Debe ser mayor a 0";
    if (!form.budget  || Number(form.budget)  <= 0) e.budget = "Debe ser mayor a 0";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const inp = (err) => ({
    width: "100%", background: "var(--bg-sunken)", border: `1px solid ${err ? "#ef4444" : "var(--border)"}`,
    borderRadius: 8, padding: "10px 14px", color: "var(--text-primary)", fontSize: 13, outline: "none", boxSizing: "border-box",
  });
  const lbl = { fontSize: 11, color: "var(--text-label)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 5, display: "block" };
  const err = { fontSize: 11, color: "#ef4444", marginTop: 4 };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "var(--bg-surface)", border: "1px solid var(--border-strong)", borderRadius: 18, padding: 32, width: 520, maxWidth: "90vw", maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: "var(--gold)", marginBottom: 24 }}>
          {initial ? "Editar evento" : "Nuevo evento"}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div style={{ gridColumn: "1/-1" }}>
            <label style={lbl}>Nombre *</label>
            <input style={inp(errors.name)} value={form.name} onChange={e => set("name", e.target.value)} />
            {errors.name && <div style={err}>{errors.name}</div>}
          </div>
          <div style={{ gridColumn: "1/-1" }}>
            <label style={lbl}>Cliente *</label>
            <select style={inp(errors.clientId)} value={form.clientId} onChange={e => set("clientId", e.target.value)}>
              <option value="">— Seleccionar cliente —</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {errors.clientId && <div style={err}>{errors.clientId}</div>}
          </div>
          <div style={{ gridColumn: "1/-1" }}>
            <label style={lbl}>Venue *</label>
            <input style={inp(errors.venue)} value={form.venue} onChange={e => set("venue", e.target.value)} />
            {errors.venue && <div style={err}>{errors.venue}</div>}
          </div>
          <div>
            <label style={lbl}>Fecha *</label>
            <DatePicker value={form.date} onChange={v => set("date", v)} hasError={!!errors.date} />
            {errors.date && <div style={err}>{errors.date}</div>}
          </div>
          <div>
            <label style={lbl}>Hora del evento</label>
            <input
              type="time"
              style={inp()}
              value={form.time}
              onChange={e => set("time", e.target.value)}
            />
          </div>
          <div>
            <label style={lbl}>Tipo</label>
            <select style={inp()} value={form.type} onChange={e => set("type", e.target.value)}>
              {["Corporativo", "Cultural", "Social"].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>Estado</label>
            <select style={inp()} value={form.status} onChange={e => set("status", e.target.value)}>
              {["Propuesta", "Confirmado", "Finalizado"].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>Invitados *</label>
            <input type="number" style={inp(errors.guests)} value={form.guests} onChange={e => set("guests", e.target.value)} />
            {errors.guests && <div style={err}>{errors.guests}</div>}
          </div>
          <div style={{ gridColumn: "1/-1" }}>
            <label style={lbl}>Presupuesto estimado (ARS) *</label>
            <input type="number" style={inp(errors.budget)} value={form.budget} onChange={e => set("budget", e.target.value)} />
            {errors.budget && <div style={err}>{errors.budget}</div>}
          </div>
          <div style={{ gridColumn: "1/-1" }}>
            <label style={lbl}>Necesidades alimentarias</label>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
              {DIETARY_OPTIONS.map(opt => {
                const current = (form.dietaryOptions || []).find(d => d.key === opt.key)
                const checked = !!current
                const toggle = () => {
                  const next = checked
                    ? (form.dietaryOptions || []).filter(d => d.key !== opt.key)
                    : [...(form.dietaryOptions || []), { key: opt.key, label: opt.label, cantidad: "" }]
                  set("dietaryOptions", next)
                }
                const setCantidad = (val) => {
                  set("dietaryOptions", (form.dietaryOptions || []).map(d => d.key === opt.key ? { ...d, cantidad: val } : d))
                }
                return (
                  <div key={opt.key} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: checked ? "rgba(201,168,76,0.06)" : "var(--bg-sunken)", border: `1px solid ${checked ? "rgba(201,168,76,0.25)" : "var(--border)"}`, borderRadius: 8, transition: "all 0.15s" }}>
                    <input type="checkbox" id={`diet-${opt.key}`} checked={checked} onChange={toggle}
                      style={{ width: 15, height: 15, accentColor: "#c9a84c", cursor: "pointer", flexShrink: 0 }} />
                    <label htmlFor={`diet-${opt.key}`} style={{ fontSize: 13, color: "var(--text-secondary)", cursor: "pointer", flex: 1, display: "flex", alignItems: "center", gap: 7 }}>
                      <span>{opt.icon}</span> {opt.label}
                    </label>
                    {checked && (
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <input
                          type="number" min="1" placeholder="Cant."
                          value={current.cantidad}
                          onChange={e => setCantidad(e.target.value)}
                          onClick={e => e.stopPropagation()}
                          style={{ width: 70, padding: "5px 8px", background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 6, color: "var(--text-primary)", fontSize: 12, outline: "none", textAlign: "center" }}
                        />
                        <span style={{ fontSize: 11, color: "var(--text-faint)" }}>pers.</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
          <button onClick={onClose} style={{ flex: 1, padding: 11, border: "1px solid var(--border)", borderRadius: 8, background: "transparent", color: "var(--text-muted)", fontSize: 13, cursor: "pointer" }}>Cancelar</button>
          <button onClick={() => { if (validate()) onSave(form) }} style={{ flex: 1, padding: 11, border: "none", borderRadius: 8, background: "linear-gradient(135deg, #c9a84c, #e8c97a)", color: "#09090f", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>Guardar</button>
        </div>
      </div>
    </div>
  );
}


function QuoteDetailCard({ quote, calcTotal, SECCION_COLORS, fmt, muted = false }) {
  const total      = calcTotal(quote)
  const menu       = quote.menus?.[0]?.menu || null
  const sections   = menu?.sections || []
  const isConfirmed = quote.clientStatus === 'Aprobado'

  const kindLabel = { Catering: 'Catering', General: 'Servicio' }[quote.kind] || quote.kind
  const kindIcon  = { Catering: '🍽', General: '✦' }[quote.kind] || '◇'

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
          <span style={{ fontSize: 16 }}>{kindIcon}</span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{kindLabel}</div>
            {quote.kind === 'Catering' && quote.covers && (
              <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 1 }}>{quote.covers} personas · {fmt(quote.pricePerCover)} por cubierto</div>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {isConfirmed && (
            <span style={{ fontSize: 11, fontWeight: 700, color: '#22c55e', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', padding: '3px 10px', borderRadius: 99 }}>✓ Confirmado</span>
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
                const c = SECCION_COLORS[sec.nombre] || '#6b7280'
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
                )
              })}
            </div>
          </div>
        )}

        {/* Extras / items */}
        <div style={{ padding: '14px 18px' }}>
          {/* Cubiertos */}
          {quote.kind === 'Catering' && quote.covers && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 }}>Base</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--bg-surface)', borderRadius: 8, border: '1px solid var(--border)' }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Servicio por persona</span>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>{quote.covers} × {fmt(quote.pricePerCover)}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{fmt((quote.covers||0)*(quote.pricePerCover||0))}</div>
                </div>
              </div>
            </div>
          )}

          {/* Items extras */}
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
  )
}

function EventDetail({ event, onClose, onEdit }) {
  const navigate = useNavigate();
  const [tab, setTab]             = useState('info');
  const [quotes, setQuotes]       = useState([]);
  const [payments, setPayments]   = useState([]);
  const [spPayments, setSpPayments] = useState([]);
  const [summary, setSummary]     = useState({ totalQuotes: 0, totalPaid: 0, balance: 0 });
  const [spSummary, setSpSummary] = useState({ totalPaid: 0, totalPending: 0 });
  const [loading, setLoading]     = useState(true);
  const [portalToken, setPortalToken]   = useState(event.portalToken || null);
  const [portalCopied, setPortalCopied] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [briefing, setBriefing]         = useState(null);
  const [briefingLoading, setBriefingLoading] = useState(false);
  const [briefingCopied, setBriefingCopied]   = useState(false);
  const [showBriefing, setShowBriefing] = useState(false);
  const [alerts, setAlerts]             = useState(null);
  const [alertsLoading, setAlertsLoading] = useState(false);
  const [showAlerts, setShowAlerts]     = useState(false);
  const [proposal, setProposal]         = useState(null);
  const [proposalLoading, setProposalLoading] = useState(false);
  const [proposalCopied, setProposalCopied]   = useState(false);
  const [showProposal, setShowProposal] = useState(false);

  const portalUrl = portalToken ? `${window.location.origin}/portal/${portalToken}` : null;

  const handleGeneratePortal = async () => {
    setPortalLoading(true)
    try {
      const res = await api.post(`/api/events/${event.id}/portal-token`)
      setPortalToken(res.data.portalToken)
    } catch { } finally { setPortalLoading(false) }
  }
  const handleCopyPortal = () => {
    navigator.clipboard.writeText(portalUrl)
    setPortalCopied(true); setTimeout(() => setPortalCopied(false), 2000)
  }
  const handleBriefing = async () => {
    setShowBriefing(true); if (briefing) return
    setBriefingLoading(true)
    try {
      const res = await api.post('/api/ai/event-briefing', {
        event: { ...event, clientName: event.client?.name },
        menu: quotes.filter(q => q.kind === 'Catering' && q.clientStatus === 'Aprobado').flatMap(q => (q.menus||[]).map(qm => qm.menu).filter(Boolean)).flatMap(m => m.sections||[]),
        payments, quotes,
      })
      setBriefing(res.data.briefing)
    } catch { setBriefing('No se pudo generar el briefing. Intentá de nuevo.') }
    finally { setBriefingLoading(false) }
  }
  const handleCopyBriefing = () => {
    navigator.clipboard.writeText(briefing)
    setBriefingCopied(true); setTimeout(() => setBriefingCopied(false), 2000)
  }

  const handleAlerts = async () => {
    setShowAlerts(true); if (alerts) return
    setAlertsLoading(true)
    try {
      const res = await api.post('/api/ai/event-alerts', {
        event: { ...event, client: event.client },
        quotes, payments, spPayments,
      })
      setAlerts(res.data.alerts)
    } catch { setAlerts([]) }
    finally { setAlertsLoading(false) }
  }

  const handleProposal = async () => {
    setShowProposal(true); if (proposal) return
    setProposalLoading(true)
    try {
      const res = await api.post('/api/ai/proposal', { event: { ...event, client: event.client }, quotes, payments })
      setProposal(res.data.proposal)
    } catch { setProposal('No se pudo generar la propuesta. Intentá de nuevo.') }
    finally { setProposalLoading(false) }
  }
  const handleCopyProposal = () => {
    navigator.clipboard.writeText(proposal)
    setProposalCopied(true); setTimeout(() => setProposalCopied(false), 2000)
  }

  useEffect(() => {
    Promise.all([
      api.get('/api/quotes'),
      api.get(`/api/payments?eventId=${event.id}`),
      api.get(`/api/supplier-payments/by-event/${event.id}`),
    ]).then(([qRes, pRes, spRes]) => {
      setQuotes(qRes.data.filter(q => q.eventId === event.id));
      setPayments(pRes.data.payments || []);
      setSummary({ totalQuotes: pRes.data.totalQuotes || 0, totalPaid: pRes.data.totalPaid || 0, balance: pRes.data.balance || 0 });
      setSpPayments(spRes.data.payments || []);
      setSpSummary({ totalPaid: spRes.data.totalPaid || 0, totalPending: spRes.data.totalPending || 0 });
    }).catch(console.error).finally(() => setLoading(false));
  }, [event.id]);

  const calcQuoteTotal = q => {
    const items    = (q.items || []).reduce((a, i) => a + i.quantity * i.unitPrice, 0);
    const catering = q.kind === 'Catering' ? (q.covers || 0) * (q.pricePerCover || 0) : 0;
    return catering + items;
  };

  const totalProveedores = spSummary.totalPaid + spSummary.totalPending;
  const utilidad  = summary.totalQuotes - totalProveedores;
  const balanceMax = Math.max(summary.totalQuotes, summary.totalPaid, totalProveedores, 1);

  const SL = { fontSize: 10, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 14, fontWeight: 800 };
  const Card = ({ children, style = {} }) => (
    <div style={{ background: 'var(--bg-sunken)', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden', ...style }}>{children}</div>
  );
  const Row = ({ label, value, color = 'var(--text-primary)', last = false }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 16px', borderBottom: last ? 'none' : '1px solid var(--border-row)' }}>
      <span style={{ fontSize: 12, color: 'var(--text-label)' }}>{label}</span>
      <span style={{ fontSize: 13, color, fontWeight: color !== 'var(--text-primary)' ? 600 : 400 }}>{value}</span>
    </div>
  );

  const SECCION_COLORS = { 'Entrada': '#3b82f6', 'Plato principal': '#8b5cf6', 'Guarnición': '#22c55e', 'Bebidas': '#06b6d4', 'Postre': '#ec4899', 'Trasnoche': '#f97316', 'Otros': '#6b7280' };

  // Cotizaciones agrupadas por tipo
  const confirmedQuotes   = quotes.filter(q => q.clientStatus === 'Aprobado');
  const pendingQuotes     = quotes.filter(q => q.clientStatus == null);
  const cateringConfirmed = quotes.filter(q => q.kind === 'Catering' && q.clientStatus === 'Aprobado');

  const TABS = [
    { id: 'info',      label: 'Info',      icon: '📋' },
    { id: 'servicios', label: 'Servicios', icon: '✦', badge: confirmedQuotes.length },
    { id: 'finanzas',  label: 'Finanzas',  icon: '💳' },
  ];

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'var(--bg-surface)', border: '1px solid var(--border-strong)', borderRadius: 20,
        width: '100%', maxWidth: 1200, height: '92vh',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>

        {/* ── Header ── */}
        <div style={{ padding: '20px 28px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: 'var(--text-primary)', lineHeight: 1.2 }}>{event.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-label)', marginTop: 3 }}>
                {event.client?.name} · {fmtDate(event.date)}{event.time ? ` · ${event.time}` : ''}
              </div>
            </div>
            <Badge label={event.status} color={statusColors[event.status] || 'var(--text-muted)'} />
            <Badge label={event.type}   color={typeColors[event.type]   || 'var(--text-muted)'} />
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {portalUrl ? (
              <>
                <button onClick={() => {
                  const phone = event.client?.phone?.replace(/\D/g, '')
                  if (!phone) return
                  const msg = encodeURIComponent(`Hola ${event.client?.name}, te comparto el seguimiento de tu evento "${event.name}" 🎉\n\n${portalUrl}`)
                  window.open(`https://wa.me/54${phone.slice(-10)}?text=${msg}`, '_blank')
                }}
                disabled={!event.client?.phone}
                title={!event.client?.phone ? 'El cliente no tiene teléfono registrado' : 'Enviar por WhatsApp'}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', border: '1px solid rgba(37,211,102,0.4)', borderRadius: 8, background: 'rgba(37,211,102,0.08)', color: '#25d366', fontSize: 12, cursor: event.client?.phone ? 'pointer' : 'not-allowed', opacity: event.client?.phone ? 1 : 0.4 }}>
                  <MessageCircle size={13} /> WA
                </button>
                <button onClick={handleCopyPortal} style={{ padding: '7px 10px', border: '1px solid rgba(201,168,76,0.3)', borderRadius: 8, background: portalCopied ? 'rgba(34,197,94,0.1)' : 'rgba(201,168,76,0.06)', color: portalCopied ? '#22c55e' : 'var(--gold)', fontSize: 12, cursor: 'pointer' }}>
                  {portalCopied ? '✓ Copiado' : '🔗 Portal'}
                </button>
              </>
            ) : (
              <button onClick={handleGeneratePortal} disabled={portalLoading} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', border: '1px solid var(--border)', borderRadius: 8, background: 'transparent', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer' }}>
                {portalLoading ? 'Generando...' : <><Link2 size={13} /> Portal</>}
              </button>
            )}
            <button onClick={handleAlerts} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', border: '1px solid var(--border)', borderRadius: 8, background: 'transparent', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer' }}>
              <AlertCircle size={13} /> Alertas
            </button>
            <button onClick={handleProposal} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', border: '1px solid var(--border)', borderRadius: 8, background: 'transparent', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer' }}>
              <FileText size={13} /> Propuesta
            </button>
            <button onClick={handleBriefing} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', border: '1px solid var(--border)', borderRadius: 8, background: 'transparent', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer' }}>
              <ClipboardList size={13} /> Briefing
            </button>
            <button onClick={() => onEdit(event)} style={{ padding: '7px 16px', border: 'none', borderRadius: 8, background: 'linear-gradient(135deg,#c9a84c,#e8c97a)', color: '#09090f', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>Editar</button>
            <button onClick={onClose} style={{ padding: '7px 13px', border: '1px solid var(--border)', borderRadius: 8, background: 'transparent', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer' }}>✕</button>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border)', flexShrink: 0, paddingLeft: 28 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: '14px 20px', border: 'none', background: 'transparent', cursor: 'pointer',
              fontSize: 13, fontWeight: tab === t.id ? 700 : 400,
              color: tab === t.id ? 'var(--gold)' : 'var(--text-muted)',
              borderBottom: tab === t.id ? '2px solid var(--gold)' : '2px solid transparent',
              marginBottom: -1, display: 'flex', alignItems: 'center', gap: 7, transition: 'all 0.15s',
            }}>
              <span>{t.icon}</span> {t.label}
              {t.badge > 0 && (
                <span style={{ fontSize: 10, fontWeight: 800, background: '#22c55e', color: '#fff', borderRadius: 99, padding: '1px 6px' }}>{t.badge}</span>
              )}
            </button>
          ))}
        </div>

        {/* ── Briefing modal ── */}
        {showBriefing && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
            onClick={e => e.target === e.currentTarget && setShowBriefing(false)}>
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 16, width: '100%', maxWidth: 560, maxHeight: '80vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}><ClipboardList size={15} /> Briefing del evento</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {briefing && !briefingLoading && (
                    <>
                      <button onClick={handleCopyBriefing} style={{ padding: '6px 12px', border: '1px solid var(--border)', borderRadius: 8, background: briefingCopied ? 'rgba(34,197,94,0.1)' : 'transparent', color: briefingCopied ? '#22c55e' : 'var(--text-muted)', fontSize: 12, cursor: 'pointer' }}>
                        {briefingCopied ? '✓ Copiado' : 'Copiar'}
                      </button>
                      <button onClick={() => { setBriefing(null); handleBriefing() }} style={{ padding: '6px 12px', border: '1px solid var(--border)', borderRadius: 8, background: 'transparent', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer' }}>Regenerar</button>
                    </>
                  )}
                  <button onClick={() => setShowBriefing(false)} style={{ padding: '6px 10px', border: '1px solid var(--border)', borderRadius: 8, background: 'transparent', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer' }}>✕</button>
                </div>
              </div>
              <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
                {briefingLoading
                  ? <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-label)', fontSize: 13 }}>Generando briefing con IA...</div>
                  : <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontFamily: "'DM Sans', sans-serif", fontSize: 13, lineHeight: 1.7, color: 'var(--text-primary)' }}>{briefing}</pre>
                }
              </div>
            </div>
          </div>
        )}

        {/* ── Modal Alertas ── */}
        {showAlerts && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
            onClick={e => e.target === e.currentTarget && setShowAlerts(false)}>
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 16, width: '100%', maxWidth: 520, maxHeight: '80vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}><AlertCircle size={15} /> Alertas de inconsistencias</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {alerts && !alertsLoading && (
                    <button onClick={() => { setAlerts(null); handleAlerts() }} style={{ padding: '6px 12px', border: '1px solid var(--border)', borderRadius: 8, background: 'transparent', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer' }}>Reanalizar</button>
                  )}
                  <button onClick={() => setShowAlerts(false)} style={{ padding: '6px 10px', border: '1px solid var(--border)', borderRadius: 8, background: 'transparent', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer' }}>✕</button>
                </div>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
                {alertsLoading ? (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-label)', fontSize: 13 }}>Analizando el evento con IA...</div>
                ) : !alerts || alerts.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 0' }}>
                    <div style={{ fontSize: 32, marginBottom: 12 }}>✓</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#22c55e', marginBottom: 6 }}>Sin inconsistencias detectadas</div>
                    <div style={{ fontSize: 13, color: 'var(--text-faint)' }}>El evento parece estar en orden.</div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {alerts.map((a, i) => {
                      const nivelColor = a.nivel === 'alto' ? '#ef4444' : a.nivel === 'medio' ? '#f59e0b' : '#3b82f6'
                      return (
                        <div key={i} style={{ background: `${nivelColor}0d`, border: `1px solid ${nivelColor}30`, borderLeft: `3px solid ${nivelColor}`, borderRadius: 10, padding: '12px 16px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                            <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: nivelColor }}>{a.nivel}</span>
                            <span style={{ fontSize: 10, color: 'var(--text-faint)', background: 'var(--bg-sunken)', border: '1px solid var(--border)', borderRadius: 20, padding: '1px 8px' }}>{a.categoria}</span>
                          </div>
                          <div style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5 }}>{a.mensaje}</div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Modal Propuesta ── */}
        {showProposal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
            onClick={e => e.target === e.currentTarget && setShowProposal(false)}>
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 16, width: '100%', maxWidth: 620, maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}><FileText size={15} /> Propuesta comercial</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {proposal && !proposalLoading && (
                    <>
                      <button onClick={handleCopyProposal} style={{ padding: '6px 12px', border: '1px solid var(--border)', borderRadius: 8, background: proposalCopied ? 'rgba(34,197,94,0.1)' : 'transparent', color: proposalCopied ? '#22c55e' : 'var(--text-muted)', fontSize: 12, cursor: 'pointer' }}>
                        {proposalCopied ? '✓ Copiado' : 'Copiar'}
                      </button>
                      <button onClick={() => { setProposal(null); handleProposal() }} style={{ padding: '6px 12px', border: '1px solid var(--border)', borderRadius: 8, background: 'transparent', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer' }}>Regenerar</button>
                    </>
                  )}
                  <button onClick={() => setShowProposal(false)} style={{ padding: '6px 10px', border: '1px solid var(--border)', borderRadius: 8, background: 'transparent', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer' }}>✕</button>
                </div>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
                {proposalLoading
                  ? <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-label)', fontSize: 13 }}>Generando propuesta con IA...</div>
                  : <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontFamily: "'DM Sans', sans-serif", fontSize: 13, lineHeight: 1.8, color: 'var(--text-primary)' }}>{proposal}</pre>
                }
              </div>
            </div>
          </div>
        )}

        {/* ── Tab body ── */}
        <div style={{ flex: 1, overflow: 'hidden' }}>

          {/* ═══════════════ TAB: INFO ═══════════════ */}
          {tab === 'info' && (
            <div style={{ height: '100%', overflowY: 'auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>

              {/* Columna izquierda */}
              <div style={{ padding: '28px 32px', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 28 }}>

                {/* Datos del evento */}
                <section>
                  <div style={SL}>Datos del evento</div>
                  <Card>
                    <Row label="Fecha"          value={fmtDate(event.date)} />
                    <Row label="Hora"           value={event.time || '—'} />
                    <Row label="Venue"          value={event.venue} />
                    <Row label="Invitados"      value={`${event.guests} personas`} />
                    <Row label="Pres. estimado" value={fmt(event.budget)} last={!event.dietaryOptions} />
                    {(() => {
                      const raw = (() => { try { return typeof event.dietaryOptions === 'string' ? JSON.parse(event.dietaryOptions) : (event.dietaryOptions || []) } catch { return [] } })()
                      const opts = Array.isArray(raw) ? raw : []
                      if (!opts.length) return null
                      return (
                        <div style={{ padding: '12px 16px' }}>
                          <div style={{ fontSize: 10, color: 'var(--text-label)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Necesidades alimentarias</div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {opts.map(o => (
                              <div key={o.key} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)', fontSize: 12 }}>
                                <span>{DIETARY_OPTIONS.find(d => d.key === o.key)?.icon}</span>
                                <span style={{ color: 'var(--text-secondary)' }}>{o.label}</span>
                                {o.cantidad && <span style={{ color: 'var(--gold)', fontWeight: 700 }}>× {o.cantidad}</span>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })()}
                  </Card>
                </section>

                {/* Cronograma */}
                <section>
                  <div style={SL}>Cronograma del día</div>
                  <Cronograma event={event} />
                </section>
              </div>

              {/* Columna derecha */}
              <div style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 28 }}>
                <section>
                  <div style={SL}>Checklist</div>
                  <Checklist eventId={event.id} event={event} />
                </section>
              </div>
            </div>
          )}

          {/* ═══════════════ TAB: SERVICIOS ═══════════════ */}
          {tab === 'servicios' && (
            <div style={{ height: '100%', overflowY: 'auto', padding: '28px 36px' }}>
              {loading ? (
                <div style={{ color: 'var(--text-faint)', fontSize: 13 }}>Cargando...</div>
              ) : quotes.length === 0 ? (
                <div style={{ color: 'var(--text-faint)', fontSize: 13 }}>Sin cotizaciones cargadas.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>

                  {/* Servicios confirmados */}
                  {confirmedQuotes.length > 0 && (
                    <section>
                      <div style={{ ...SL, color: '#22c55e' }}>✓ Confirmados por el cliente</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {confirmedQuotes.map(q => (
                          <QuoteDetailCard key={q.id} quote={q} calcTotal={calcQuoteTotal} SECCION_COLORS={SECCION_COLORS} fmt={fmt} />
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Servicios pendientes de decisión */}
                  {pendingQuotes.length > 0 && (
                    <section>
                      <div style={{ ...SL, color: 'var(--text-faint)' }}>Pendientes de confirmación</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {pendingQuotes.map(q => (
                          <QuoteDetailCard key={q.id} quote={q} calcTotal={calcQuoteTotal} SECCION_COLORS={SECCION_COLORS} fmt={fmt} muted />
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Rechazadas (colapsadas) */}
                  {quotes.filter(q => q.clientStatus === 'Rechazado').length > 0 && (
                    <section>
                      <div style={{ ...SL, color: '#ef4444' }}>Rechazadas</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {quotes.filter(q => q.clientStatus === 'Rechazado').map(q => (
                          <div key={q.id} style={{ padding: '11px 16px', background: 'var(--bg-sunken)', border: '1px solid var(--border)', borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: 0.5 }}>
                            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{q.kind}</span>
                            <span style={{ fontSize: 13, color: 'var(--text-faint)' }}>{fmt(calcQuoteTotal(q))}</span>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ═══════════════ TAB: FINANZAS ═══════════════ */}
          {tab === 'finanzas' && (
            <div style={{ height: '100%', overflowY: 'auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>

              {/* Columna izquierda */}
              <div style={{ padding: '28px 32px', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 28 }}>

                <section>
                  <div style={SL}>Cobros al cliente</div>
                  {loading ? <div style={{ fontSize: 13, color: 'var(--text-faint)' }}>Cargando...</div> : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                      {payments.length === 0
                        ? <div style={{ fontSize: 13, color: 'var(--text-faint)' }}>Sin cobros registrados</div>
                        : payments.map(p => (
                          <div key={p.id} style={{ background: 'var(--bg-sunken)', border: '1px solid var(--border)', borderRadius: 10, padding: '11px 15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>{fmt(p.amount)}</div>
                              {p.note && <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 2 }}>{p.note}</div>}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>{fmtDate(p.date)}</div>
                          </div>
                        ))
                      }
                      <Card>
                        <Row label="Total cobrado"   value={fmt(summary.totalPaid)}  color="#22c55e" />
                        <Row label="Saldo pendiente" value={fmt(summary.balance)}    color={summary.balance > 0 ? '#ef4444' : '#22c55e'} last />
                      </Card>
                    </div>
                  )}
                </section>

                <section>
                  <div style={SL}>Pagos a proveedores</div>
                  {loading ? <div style={{ fontSize: 13, color: 'var(--text-faint)' }}>Cargando...</div> : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                      {spPayments.length === 0
                        ? <div style={{ fontSize: 13, color: 'var(--text-faint)' }}>Sin pagos registrados</div>
                        : spPayments.map(p => (
                          <div key={p.id} style={{ background: 'var(--bg-sunken)', border: '1px solid var(--border)', borderRadius: 10, padding: '11px 15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>{p.supplier?.name}</div>
                              {p.note && <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 2 }}>{p.note}</div>}
                            </div>
                            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                              <Badge label={p.status} color={p.status === 'Pagado' ? '#22c55e' : '#f59e0b'} />
                              <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600 }}>{fmt(p.amount)}</span>
                            </div>
                          </div>
                        ))
                      }
                      <Card>
                        <Row label="Pagado a proveedores"  value={fmt(spSummary.totalPaid)}    color="#ef4444" />
                        <Row label="Pendiente proveedores" value={fmt(spSummary.totalPending)} color="#f59e0b" last />
                      </Card>
                    </div>
                  )}
                </section>
              </div>

              {/* Columna derecha — Balance */}
              <div style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 28 }}>
                {!loading && (
                  <section>
                    <div style={SL}>Balance del evento</div>
                    <div style={{ background: 'var(--bg-sunken)', borderRadius: 14, border: '1px solid var(--border)', padding: '22px 24px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
                        {[
                          { label: 'Ingresos aprobados', value: summary.totalQuotes,    color: 'var(--gold)' },
                          { label: 'Cobrado al cliente',  value: summary.totalPaid,      color: '#22c55e' },
                          { label: 'Pagado proveedores',  value: spSummary.totalPaid,    color: '#ef4444' },
                          { label: 'Pend. proveedores',   value: spSummary.totalPending, color: '#f59e0b' },
                        ].map(item => (
                          <div key={item.label} style={{ background: `${item.color}08`, border: `1px solid ${item.color}25`, borderRadius: 10, padding: '14px 16px' }}>
                            <div style={{ fontSize: 10, color: 'var(--text-label)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>{item.label}</div>
                            <div style={{ fontSize: 18, fontWeight: 700, color: item.color }}>{fmt(item.value)}</div>
                          </div>
                        ))}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
                        <BalanceBar label="Ingresos aprobados" value={summary.totalQuotes} max={balanceMax} color="var(--gold)" />
                        <BalanceBar label="Cobrado al cliente"  value={summary.totalPaid}   max={balanceMax} color="#22c55e" />
                        <BalanceBar label="Total proveedores"   value={totalProveedores}     max={balanceMax} color="#ef4444" />
                      </div>
                      <div style={{ paddingTop: 18, borderTop: '1px solid var(--border-row)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: 12, color: 'var(--text-label)', textTransform: 'uppercase', letterSpacing: 1 }}>Utilidad estimada</div>
                          <div style={{ fontSize: 10, color: 'var(--text-faint)', marginTop: 2 }}>Ingresos − total proveedores</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 26, fontWeight: 800, color: utilidad >= 0 ? '#22c55e' : '#ef4444' }}>{fmt(utilidad)}</div>
                          {summary.totalQuotes > 0 && (
                            <div style={{ fontSize: 11, color: 'var(--text-label)' }}>{Math.round((utilidad / summary.totalQuotes) * 100)}% del ingreso</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </section>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Events() {
  const toast = useToast();
  const location = useLocation();
  const [events, setEvents]   = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");
  const [filter, setFilter]   = useState("Todos");
  const [filterTime, setFilterTime] = useState("Todos");
  const [sortBy, setSortBy]   = useState("date");
  const [sortDir, setSortDir] = useState("asc");
  const [modal, setModal]     = useState(null);
  const [selected, setSelected]       = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const fetchData = async () => {
    try {
      const [evRes, clRes] = await Promise.all([api.get("/api/events"), api.get("/api/clients")]);
      setEvents(evRes.data);
      setClients(clRes.data);
      const targetId = location.state?.openEventId;
      if (targetId) {
        const target = evRes.data.find(e => e.id === targetId);
        if (target) { setSelected(target); setModal("detail"); }
      }
    } catch { toast("Error al cargar eventos"); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchData(); }, []);

  const filtered = events.filter(e => {
    const ms = e.name.toLowerCase().includes(search.toLowerCase()) || e.client?.name.toLowerCase().includes(search.toLowerCase());
    const mf = filter === "Todos" || e.status === filter;
    const past = isPastEvent(e)
    const mt = filterTime === "Todos" || (filterTime === "Pasaron" && past) || (filterTime === "Próximos" && !past)
    return ms && mf && mt;
  }).sort((a, b) => {
    let va, vb
    if (sortBy === "date")   { va = new Date(a.date); vb = new Date(b.date) }
    if (sortBy === "venue")  { va = a.venue?.toLowerCase(); vb = b.venue?.toLowerCase() }
    if (sortBy === "status") { const o = ["Propuesta","Confirmado","Finalizado"]; va = o.indexOf(a.status); vb = o.indexOf(b.status) }
    if (va < vb) return sortDir === "asc" ? -1 : 1
    if (va > vb) return sortDir === "asc" ? 1 : -1
    return 0
  })

  const toggleSort = (col) => {
    if (sortBy === col) setSortDir(d => d === "asc" ? "desc" : "asc")
    else { setSortBy(col); setSortDir("asc") }
  }
  const SortIcon = ({ col }) => {
    if (sortBy !== col) return <span style={{ opacity: 0.3, marginLeft: 4 }}>↕</span>
    return <span style={{ marginLeft: 4, color: "var(--gold)" }}>{sortDir === "asc" ? "↑" : "↓"}</span>
  }

  const handleSave = async (form) => {
    try {
      const p = { ...form, clientId: Number(form.clientId), guests: Number(form.guests), budget: Number(form.budget) };
      if (modal === "new") {
        await api.post("/api/events", p);
        toast("Evento creado", "success");
        await fetchData();
        setModal(null); setSelected(null);
      } else {
        await api.put(`/api/events/${selected.id}`, p);
        toast("Evento actualizado", "success");
        const evRes = await api.get("/api/events");
        setEvents(evRes.data);
        const updated = evRes.data.find(e => e.id === selected.id);
        setSelected(updated || null);
        setModal(updated ? "detail" : null);
      }
    } catch (e) { toast(e.response?.data?.error || "Error al guardar"); }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/api/events/${confirmDelete.id}`);
      toast("Evento eliminado", "success");
      await fetchData();
    } catch (e) { toast(e.response?.data?.error || "Error al eliminar"); }
    finally { setConfirmDelete(null); }
  };

  const handleStatusChange = async (ev, newStatus) => {
    try {
      await api.put(`/api/events/${ev.id}`, { ...ev, clientId: ev.clientId, status: newStatus });
      setEvents(prev => prev.map(e => e.id === ev.id ? { ...e, status: newStatus } : e));
    } catch { toast("Error al cambiar el estado"); }
  };

  const openDetail = ev => { setSelected(ev); setModal("detail"); };
  const openEdit   = ev => { setSelected(ev); setModal("edit");   };

  const fbtn = (active) => ({
    padding: "6px 14px", borderRadius: 20, border: "1px solid", fontSize: 12, cursor: "pointer", transition: "all 0.2s",
    borderColor: active ? "var(--gold)" : "var(--border)",
    background:  active ? "rgba(201,168,76,0.12)" : "transparent",
    color:       active ? "var(--gold)" : "var(--text-muted)",
  });

  if (loading) return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", color: "var(--text-label)" }}>Cargando eventos...</div>;

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 900, color: "var(--text-primary)" }}>Eventos</div>
          <div style={{ fontSize: 13, color: "var(--text-label)", marginTop: 4 }}>{filtered.length} eventos encontrados</div>
        </div>
        <button onClick={() => setModal("new")} style={{ background: "linear-gradient(135deg,#c9a84c,#e8c97a)", border: "none", borderRadius: 8, padding: "10px 20px", color: "#09090f", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          + Nuevo evento
        </button>
      </div>

      {/* Filtros */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por evento o cliente..."
          style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 8, padding: "9px 14px", color: "var(--text-primary)", fontSize: 13, outline: "none", width: 280 }} />
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {ESTADOS.map(e => <button key={e} onClick={() => setFilter(e)} style={fbtn(filter === e)}>{e}</button>)}
        </div>
        <div style={{ width: 1, height: 20, background: "var(--border)", flexShrink: 0 }} />
        <div style={{ display: "flex", gap: 6 }}>
          {["Todos", "Próximos", "Pasaron"].map(t => (
            <button key={t} onClick={() => setFilterTime(t)} style={{
              ...fbtn(filterTime === t),
              ...(t === "Pasaron" && filterTime === t ? { background: "rgba(239,68,68,0.12)", color: "#ef4444", borderColor: "rgba(239,68,68,0.3)" } : {}),
            }}>{t === "Pasaron" ? "● Ya pasaron" : t}</button>
          ))}
        </div>
      </div>

      {/* Tabla */}
      <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 1fr 1.5fr 1fr 130px 160px", gap: "0 16px", padding: "12px 20px", borderBottom: "1px solid var(--border)", fontSize: 11, color: "var(--text-label)", textTransform: "uppercase", letterSpacing: 1 }}>
          <span>Evento</span>
          <span>Cliente</span>
          <span onClick={() => toggleSort("date")} style={{ cursor: "pointer", userSelect: "none" }}>Fecha<SortIcon col="date" /></span>
          <span onClick={() => toggleSort("venue")} style={{ cursor: "pointer", userSelect: "none" }}>Venue<SortIcon col="venue" /></span>
          <span>Pres. estimado</span>
          <span onClick={() => toggleSort("status")} style={{ cursor: "pointer", userSelect: "none" }}>Estado<SortIcon col="status" /></span>
          <span/>
        </div>
        {filtered.length === 0
          ? <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--text-faint)", fontSize: 13 }}>No se encontraron eventos</div>
          : filtered.map((ev, i) => (
            <div key={ev.id} onClick={() => openDetail(ev)}
              style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 1fr 1.5fr 1fr 130px 160px", gap: "0 16px", padding: "14px 20px", alignItems: "center", borderBottom: i < filtered.length - 1 ? "1px solid var(--border-row)" : "none", cursor: "pointer" }}
              onMouseEnter={e => e.currentTarget.style.background = "var(--bg-hover)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <div>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{ev.name}</span>
                  {ev._count?.files > 0 && <Paperclip size={12} title={`${ev._count.files} adjunto${ev._count.files !== 1 ? "s" : ""}`} style={{ color: "var(--text-label)" }} />}
                  {isPastEvent(ev) && (
                    <span style={{
                      fontSize: 10, padding: "2px 8px", borderRadius: 20, fontWeight: 700,
                      background: "rgba(239,68,68,0.15)", color: "#ef4444",
                      border: "1px solid rgba(239,68,68,0.3)",
                      animation: "pulse-past 1.5s ease-in-out infinite",
                      whiteSpace: "nowrap",
                    }}>
                      ● Ya pasó
                    </span>
                  )}
                </div>
                <Badge label={ev.type} color={typeColors[ev.type] || "var(--text-muted)"} />
              </div>
              <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>{ev.client?.name}</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{fmtDate(ev.date)}</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{ev.venue}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#22c55e" }}>{fmt(ev.budget)}</div>
              <select
                value={ev.status}
                onClick={e => e.stopPropagation()}
                onChange={e => handleStatusChange(ev, e.target.value)}
                style={{
                  background: `${statusColors[ev.status]}18`,
                  color: statusColors[ev.status] || "var(--text-muted)",
                  border: `1px solid ${statusColors[ev.status]}40`,
                  borderRadius: 20, padding: "4px 10px",
                  fontSize: 11, fontWeight: 600, cursor: "pointer",
                  outline: "none", appearance: "none", textAlign: "center",
                }}
              >
                {["Propuesta","Confirmado","Finalizado"].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={e => { e.stopPropagation(); openEdit(ev) }} style={{ padding: "5px 10px", border: "1px solid var(--border)", borderRadius: 6, background: "transparent", color: "var(--text-muted)", fontSize: 12, cursor: "pointer" }}>Editar</button>
                <button onClick={e => { e.stopPropagation(); setConfirmDelete(ev) }} style={{ padding: "5px 10px", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 6, background: "transparent", color: "#ef4444", fontSize: 12, cursor: "pointer" }}>Eliminar</button>
              </div>
            </div>
          ))
        }
      </div>

      {modal === "new"    && <EventForm clients={clients} onSave={handleSave} onClose={() => setModal(null)} />}
      {modal === "edit"   && selected && <EventForm initial={selected} clients={clients} onSave={handleSave} onClose={() => { setModal(null); setSelected(null); }} />}
      {modal === "detail" && selected && <EventDetail event={selected} onClose={() => { setModal(null); setSelected(null); }} onEdit={ev => { setModal("edit"); setSelected(ev); }} />}

      {confirmDelete && (
        <ConfirmDialog
          title="¿Eliminar evento?"
          message={`Esto eliminará "${confirmDelete.name}" y todas sus cotizaciones. Esta acción no se puede deshacer.`}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}