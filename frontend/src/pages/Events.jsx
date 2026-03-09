import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import api from "../api/axios";
import { useToast } from "../components/Toast";
import ConfirmDialog from "../components/ConfirmDialog";
import Checklist from "../components/Checklist";
import EventFiles from "../components/EventFiles";

const statusColors = {
  Confirmado: "#22c55e",
  "En producción": "#3b82f6",
  Propuesta: "#f59e0b",
  Finalizado: "#8b5cf6",
};
const quoteStatusColors = {
  Aprobado: "#22c55e",
  Pendiente: "#f59e0b",
  Rechazado: "#ef4444",
  "Revisión": "#3b82f6",
};
const typeColors = {
  Corporativo: "#3b82f6",
  Cultural: "#8b5cf6",
  Social: "#ec4899",
};
const ESTADOS = ["Todos", "Confirmado", "En producción", "Propuesta", "Finalizado"];

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

// Parsea "YYYY-MM-DD" sin problemas de timezone
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
  const [cursor, setCursor] = useState(initial ?? today); // mes visible

  const year  = cursor.getFullYear();
  const month = cursor.getMonth();

  // Primer día de la semana del mes (lunes=0)
  const firstDay = new Date(year, month, 1);
  const startOffset = (firstDay.getDay() + 6) % 7; // ajuste lunes
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  // Rellenar hasta múltiplo de 7
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
      {/* Trigger */}
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

      {/* Popover del calendario */}
      {open && (
        <>
          {/* Overlay invisible para cerrar al hacer click afuera */}
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 299 }} />
          <div style={{
            position: "absolute", top: "calc(100% + 8px)", left: 0, zIndex: 300,
            background: "var(--bg-surface)", border: "1px solid var(--border-strong)", borderRadius: 14,
            padding: 18, width: 280, boxShadow: "0 16px 48px rgba(0,0,0,0.6)",
          }}>
            {/* Navegación mes */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <button type="button" onClick={prevMonth} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "4px 8px", borderRadius: 6, fontSize: 16, lineHeight: 1 }}>‹</button>
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
                {MESES[month]} {year}
              </span>
              <button type="button" onClick={nextMonth} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "4px 8px", borderRadius: 6, fontSize: 16, lineHeight: 1 }}>›</button>
            </div>

            {/* Cabecera días */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginBottom: 6 }}>
              {DIAS.map(d => (
                <div key={d} style={{ textAlign: "center", fontSize: 10, color: "var(--text-faint)", fontWeight: 700, padding: "4px 0", textTransform: "uppercase", letterSpacing: 0.5 }}>{d}</div>
              ))}
            </div>

            {/* Días */}
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

            {/* Hoy */}
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

const emptyForm = { name: "", clientId: "", date: "", venue: "", type: "Corporativo", status: "Propuesta", guests: "", budget: "" };

function EventForm({ initial, clients, onSave, onClose }) {
  const [form, setForm] = useState(
    initial ? { ...initial, clientId: String(initial.clientId), date: initial.date?.slice(0, 10) } : emptyForm
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
            <label style={lbl}>Tipo</label>
            <select style={inp()} value={form.type} onChange={e => set("type", e.target.value)}>
              {["Corporativo", "Cultural", "Social"].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>Estado</label>
            <select style={inp()} value={form.status} onChange={e => set("status", e.target.value)}>
              {["Propuesta", "Confirmado", "En producción", "Finalizado"].map(s => <option key={s}>{s}</option>)}
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
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
          <button onClick={onClose} style={{ flex: 1, padding: 11, border: "1px solid var(--border)", borderRadius: 8, background: "transparent", color: "var(--text-muted)", fontSize: 13, cursor: "pointer" }}>Cancelar</button>
          <button onClick={() => { if (validate()) onSave(form) }} style={{ flex: 1, padding: 11, border: "none", borderRadius: 8, background: "linear-gradient(135deg, #c9a84c, #e8c97a)", color: "#09090f", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>Guardar</button>
        </div>
      </div>
    </div>
  );
}

function EventDetail({ event, onClose, onEdit }) {
  const [quotes, setQuotes]   = useState([]);
  const [payments, setPayments] = useState([]);
  const [spPayments, setSpPayments] = useState([]);
  const [summary, setSummary] = useState({ totalQuotes: 0, totalPaid: 0, balance: 0 });
  const [spSummary, setSpSummary] = useState({ totalPaid: 0, totalPending: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/api/quotes"),
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
    const catering = q.kind === "Catering" ? (q.covers || 0) * (q.pricePerCover || 0) : 0;
    return catering + items;
  };

  const totalProveedores = spSummary.totalPaid + spSummary.totalPending;
  const utilidad = summary.totalQuotes - totalProveedores;
  const balanceMax = Math.max(summary.totalQuotes, summary.totalPaid, totalProveedores, 1);

  const SL = { fontSize: 11, color: "var(--text-label)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12, fontWeight: 600 };
  const Card = ({ children, style = {} }) => (
    <div style={{ background: "var(--bg-sunken)", borderRadius: 12, border: "1px solid var(--border)", overflow: "hidden", ...style }}>{children}</div>
  );
  const Row = ({ label, value, color = "var(--text-primary)", last = false }) => (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "11px 16px", borderBottom: last ? "none" : "1px solid var(--border-row)" }}>
      <span style={{ fontSize: 12, color: "var(--text-label)" }}>{label}</span>
      <span style={{ fontSize: 13, color, fontWeight: color !== "var(--text-primary)" ? 600 : 400 }}>{value}</span>
    </div>
  );

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "var(--bg-surface)", border: "1px solid var(--border-strong)", borderRadius: 20,
        width: "100%", maxWidth: 1100, maxHeight: "90vh",
        display: "flex", flexDirection: "column", overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{ padding: "22px 32px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
          <div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: "var(--text-primary)" }}>{event.name}</div>
            <div style={{ fontSize: 12, color: "var(--text-label)", marginTop: 3 }}>{event.client?.name}</div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <Badge label={event.type} color={typeColors[event.type] || "var(--text-muted)"} />
            <Badge label={event.status} color={statusColors[event.status] || "var(--text-muted)"} />
            <button onClick={() => onEdit(event)} style={{ marginLeft: 6, padding: "7px 16px", border: "none", borderRadius: 8, background: "linear-gradient(135deg,#c9a84c,#e8c97a)", color: "#09090f", fontWeight: 600, fontSize: 12, cursor: "pointer" }}>Editar</button>
            <button onClick={onClose} style={{ padding: "7px 13px", border: "1px solid var(--border)", borderRadius: 8, background: "transparent", color: "var(--text-muted)", fontSize: 13, cursor: "pointer" }}>✕</button>
          </div>
        </div>

        {/* Body — 2 columnas */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", flex: 1, overflow: "hidden" }}>

          {/* ── Columna izquierda ── */}
          <div style={{ overflowY: "auto", padding: "28px 32px", borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 26 }}>

            {/* Datos */}
            <section>
              <div style={SL}>Datos del evento</div>
              <Card>
                <Row label="Fecha"          value={fmtDate(event.date)} />
                <Row label="Venue"          value={event.venue} />
                <Row label="Invitados"      value={`${event.guests} personas`} />
                <Row label="Pres. estimado" value={fmt(event.budget)} last />
              </Card>
            </section>

            {/* Cotizaciones */}
            <section>
              <div style={SL}>Cotizaciones</div>
              {loading ? <div style={{ fontSize: 13, color: "var(--text-faint)" }}>Cargando...</div> : quotes.length === 0
                ? <div style={{ fontSize: 13, color: "var(--text-faint)" }}>Sin cotizaciones</div>
                : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                    {quotes.map(q => (
                      <div key={q.id} style={{ background: "var(--bg-sunken)", border: "1px solid var(--border)", borderRadius: 10, padding: "11px 15px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <div style={{ fontSize: 13, color: "var(--text-secondary)", fontWeight: 500 }}>{q.kind}</div>
                          <div style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 2 }}>{fmtDate(q.date)}</div>
                        </div>
                        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                          <Badge label={q.status} color={quoteStatusColors[q.status] || "var(--text-muted)"} />
                          <span style={{ fontSize: 14, fontWeight: 700, color: "var(--gold-light)" }}>{fmt(calcQuoteTotal(q))}</span>
                        </div>
                      </div>
                    ))}
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "9px 15px", background: "rgba(201,168,76,0.06)", borderRadius: 8, border: "1px solid rgba(201,168,76,0.15)" }}>
                      <span style={{ fontSize: 12, color: "var(--text-label)" }}>Total aprobadas</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "var(--gold-light)" }}>{fmt(summary.totalQuotes)}</span>
                    </div>
                  </div>
                )
              }
            </section>

            {/* Cobros */}
            <section>
              <div style={SL}>Cobros al cliente</div>
              {loading ? <div style={{ fontSize: 13, color: "var(--text-faint)" }}>Cargando...</div> : (
                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                  {payments.length === 0
                    ? <div style={{ fontSize: 13, color: "var(--text-faint)" }}>Sin cobros registrados</div>
                    : payments.map(p => (
                      <div key={p.id} style={{ background: "var(--bg-sunken)", border: "1px solid var(--border)", borderRadius: 10, padding: "11px 15px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <div style={{ fontSize: 13, color: "var(--text-secondary)", fontWeight: 500 }}>{fmt(p.amount)}</div>
                          {p.note && <div style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 2 }}>{p.note}</div>}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--text-faint)" }}>{fmtDate(p.date)}</div>
                      </div>
                    ))
                  }
                  <Card>
                    <Row label="Total cobrado"         value={fmt(summary.totalPaid)} color="#22c55e" />
                    <Row label="Saldo pendiente"        value={fmt(summary.balance)}  color={summary.balance > 0 ? "#ef4444" : "#22c55e"} last />
                  </Card>
                </div>
              )}
            </section>

            {/* Pagos a proveedores */}
            <section>
              <div style={SL}>Pagos a proveedores</div>
              {loading ? <div style={{ fontSize: 13, color: "var(--text-faint)" }}>Cargando...</div> : (
                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                  {spPayments.length === 0
                    ? <div style={{ fontSize: 13, color: "var(--text-faint)" }}>Sin pagos registrados</div>
                    : spPayments.map(p => (
                      <div key={p.id} style={{ background: "var(--bg-sunken)", border: "1px solid var(--border)", borderRadius: 10, padding: "11px 15px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <div style={{ fontSize: 13, color: "var(--text-secondary)", fontWeight: 500 }}>{p.supplier?.name}</div>
                          {p.note && <div style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 2 }}>{p.note}</div>}
                        </div>
                        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                          <Badge label={p.status} color={p.status === "Pagado" ? "#22c55e" : "#f59e0b"} />
                          <span style={{ fontSize: 13, color: "var(--text-primary)", fontWeight: 600 }}>{fmt(p.amount)}</span>
                        </div>
                      </div>
                    ))
                  }
                  <Card>
                    <Row label="Pagado a proveedores"   value={fmt(spSummary.totalPaid)}    color="#ef4444" />
                    <Row label="Pendiente proveedores"  value={fmt(spSummary.totalPending)} color="#f59e0b" last />
                  </Card>
                </div>
              )}
            </section>
          </div>

          {/* ── Columna derecha ── */}
          <div style={{ overflowY: "auto", padding: "28px 32px", display: "flex", flexDirection: "column", gap: 26 }}>

            {/* Balance visual */}
            {!loading && (
              <section>
                <div style={SL}>Balance del evento</div>
                <div style={{ background: "var(--bg-sunken)", borderRadius: 14, border: "1px solid var(--border)", padding: "20px 22px" }}>

                  {/* Tarjetas de resumen */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 22 }}>
                    {[
                      { label: "Ingresos aprobados", value: summary.totalQuotes,      color: "var(--gold)" },
                      { label: "Cobrado al cliente",  value: summary.totalPaid,        color: "#22c55e" },
                      { label: "Pagado proveedores",  value: spSummary.totalPaid,      color: "#ef4444" },
                      { label: "Pend. proveedores",   value: spSummary.totalPending,   color: "#f59e0b" },
                    ].map(item => (
                      <div key={item.label} style={{ background: `${item.color}08`, border: `1px solid ${item.color}25`, borderRadius: 10, padding: "12px 14px" }}>
                        <div style={{ fontSize: 10, color: "var(--text-label)", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 5 }}>{item.label}</div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: item.color }}>{fmt(item.value)}</div>
                      </div>
                    ))}
                  </div>

                  {/* Barras */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <BalanceBar label="Ingresos aprobados" value={summary.totalQuotes}    max={balanceMax} color="var(--gold)" />
                    <BalanceBar label="Cobrado al cliente"  value={summary.totalPaid}      max={balanceMax} color="#22c55e" />
                    <BalanceBar label="Total proveedores"   value={totalProveedores}        max={balanceMax} color="#ef4444" />
                  </div>

                  {/* Utilidad */}
                  <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--border-row)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: 12, color: "var(--text-label)", textTransform: "uppercase", letterSpacing: 1 }}>Utilidad estimada</div>
                      <div style={{ fontSize: 10, color: "var(--text-faint)", marginTop: 2 }}>Ingresos − total proveedores</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 22, fontWeight: 800, color: utilidad >= 0 ? "#22c55e" : "#ef4444" }}>{fmt(utilidad)}</div>
                      {summary.totalQuotes > 0 && (
                        <div style={{ fontSize: 11, color: "var(--text-label)" }}>
                          {Math.round((utilidad / summary.totalQuotes) * 100)}% del ingreso
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Checklist */}
            <section>
              <Checklist eventId={event.id} />
            </section>

            {/* Archivos */}
            <section style={{ paddingTop: 20, borderTop: "1px solid var(--border)" }}>
              <EventFiles eventId={event.id} />
            </section>
          </div>
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
  const [modal, setModal]     = useState(null);   // "new" | "edit" | "detail"
  const [selected, setSelected]       = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const fetchData = async () => {
    try {
      const [evRes, clRes] = await Promise.all([api.get("/api/events"), api.get("/api/clients")]);
      setEvents(evRes.data);
      setClients(clRes.data);
      // Si llegamos desde Clientes con un evento específico, abrirlo
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
    return ms && mf;
  });

  const handleSave = async (form) => {
    try {
      const p = { ...form, clientId: Number(form.clientId), guests: Number(form.guests), budget: Number(form.budget) };
      if (modal === "new") { await api.post("/api/events", p); toast("Evento creado", "success"); }
      else                 { await api.put(`/api/events/${selected.id}`, p); toast("Evento actualizado", "success"); }
      await fetchData();
      setModal(null); setSelected(null);
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
      </div>

      {/* Tabla */}
      <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 1fr 1.5fr 1fr 1fr 130px", padding: "12px 20px", borderBottom: "1px solid var(--border)", fontSize: 11, color: "var(--text-label)", textTransform: "uppercase", letterSpacing: 1 }}>
          <span>Evento</span><span>Cliente</span><span>Fecha</span><span>Venue</span><span>Pres. estimado</span><span>Estado</span><span/>
        </div>
        {filtered.length === 0
          ? <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--text-faint)", fontSize: 13 }}>No se encontraron eventos</div>
          : filtered.map((ev, i) => (
            <div key={ev.id} onClick={() => openDetail(ev)}
              style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 1fr 1.5fr 1fr 1fr 130px", padding: "14px 20px", alignItems: "center", borderBottom: i < filtered.length - 1 ? "1px solid var(--border-row)" : "none", cursor: "pointer" }}
              onMouseEnter={e => e.currentTarget.style.background = "var(--bg-hover)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <div>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{ev.name}</span>
                  {ev._count?.files > 0 && <span title={`${ev._count.files} adjunto${ev._count.files !== 1 ? "s" : ""}`} style={{ fontSize: 12, color: "var(--text-label)" }}>📎</span>}
                </div>
                <Badge label={ev.type} color={typeColors[ev.type] || "var(--text-muted)"} />
              </div>
              <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>{ev.client?.name}</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{fmtDate(ev.date)}</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{ev.venue}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#22c55e" }}>{fmt(ev.budget)}</div>
              <Badge label={ev.status} color={statusColors[ev.status] || "var(--text-muted)"} />
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