import { useState } from "react";
import DatePicker from "./DatePicker";
import { DIETARY_OPTIONS } from "../utils/eventUtils";

const emptyForm = {
  name: "", clientId: "", date: "", time: "", venue: "",
  type: "Corporativo", status: "Propuesta", guests: "", budget: "",
  ticketPrice: "", dietaryOptions: [],
};

export default function EventForm({ initial, clients, onSave, onClose }) {
  const [form, setForm] = useState(
    initial ? {
      ...initial,
      clientId: String(initial.clientId),
      date: initial.date?.slice(0, 10),
      time: initial.time || "",
      ticketPrice: initial.ticketPrice != null ? String(initial.ticketPrice) : "",
      dietaryOptions: (() => {
        try {
          const d = typeof initial.dietaryOptions === 'string'
            ? JSON.parse(initial.dietaryOptions)
            : (initial.dietaryOptions || []);
          return Array.isArray(d) ? d : [];
        } catch { return []; }
      })(),
    } : emptyForm
  );
  const [errors, setErrors] = useState({});
  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: "" })); };

  const validate = () => {
    const e = {};
    if (!form.name.trim())                          e.name     = "Requerido";
    if (!form.clientId)                             e.clientId = "Seleccionar cliente";
    if (!form.date)                                 e.date     = "Requerido";
    if (!form.venue.trim())                         e.venue    = "Requerido";
    if (!form.guests  || Number(form.guests)  <= 0) e.guests   = "Debe ser mayor a 0";
    if (!form.budget  || Number(form.budget)  <= 0) e.budget   = "Debe ser mayor a 0";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const inp = (err) => ({
    width: "100%", background: "var(--bg-sunken)", border: `1px solid ${err ? "#ef4444" : "var(--border)"}`,
    borderRadius: 8, padding: "10px 14px", color: "var(--text-primary)", fontSize: 13, outline: "none", boxSizing: "border-box",
  });
  const lbl = { fontSize: 11, color: "var(--text-label)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 5, display: "block" };
  const errStyle = { fontSize: 11, color: "#ef4444", marginTop: 4 };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "var(--bg-surface)", border: "1px solid var(--border-strong)", borderRadius: 18, padding: "24px 28px", width: 760, maxWidth: "95vw", maxHeight: "95vh", overflowY: "auto" }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: "var(--gold)", marginBottom: 20 }}>
          {initial ? "Editar evento" : "Nuevo evento"}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>

          <div style={{ gridColumn: "1/-1" }}>
            <label style={lbl}>Nombre *</label>
            <input style={inp(errors.name)} value={form.name} onChange={e => set("name", e.target.value)} />
            {errors.name && <div style={errStyle}>{errors.name}</div>}
          </div>

          <div style={{ gridColumn: "span 2" }}>
            <label style={lbl}>Cliente *</label>
            <select style={inp(errors.clientId)} value={form.clientId} onChange={e => set("clientId", e.target.value)}>
              <option value="">— Seleccionar —</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {errors.clientId && <div style={errStyle}>{errors.clientId}</div>}
          </div>
          <div>
            <label style={lbl}>Estado</label>
            <select style={inp()} value={form.status} onChange={e => set("status", e.target.value)}>
              {["Propuesta", "Confirmado", "Finalizado"].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>

          <div style={{ gridColumn: "1/-1" }}>
            <label style={lbl}>Venue *</label>
            <input style={inp(errors.venue)} value={form.venue} onChange={e => set("venue", e.target.value)} />
            {errors.venue && <div style={errStyle}>{errors.venue}</div>}
          </div>

          <div>
            <label style={lbl}>Fecha *</label>
            <DatePicker value={form.date} onChange={v => set("date", v)} hasError={!!errors.date} />
            {errors.date && <div style={errStyle}>{errors.date}</div>}
          </div>
          <div>
            <label style={lbl}>Hora</label>
            <input type="time" style={inp()} value={form.time} onChange={e => set("time", e.target.value)} />
          </div>
          <div>
            <label style={lbl}>Tipo</label>
            <select style={inp()} value={form.type} onChange={e => set("type", e.target.value)}>
              {["Corporativo", "Cultural", "Social"].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>

          <div>
            <label style={lbl}>Invitados *</label>
            <input type="number" style={inp(errors.guests)} value={form.guests} onChange={e => set("guests", e.target.value)} />
            {errors.guests && <div style={errStyle}>{errors.guests}</div>}
          </div>
          <div>
            <label style={lbl}>Presupuesto (ARS) *</label>
            <input type="number" style={inp(errors.budget)} value={form.budget} onChange={e => set("budget", e.target.value)} />
            {errors.budget && <div style={errStyle}>{errors.budget}</div>}
          </div>
          <div>
            <label style={lbl}>Precio tarjeta (ARS)</label>
            <input type="number" style={inp()} value={form.ticketPrice} onChange={e => set("ticketPrice", e.target.value)} placeholder="Opcional" />
          </div>

          <div style={{ gridColumn: "1/-1" }}>
            <label style={lbl}>Necesidades alimentarias</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 4 }}>
              {DIETARY_OPTIONS.map(opt => {
                const current = (form.dietaryOptions || []).find(d => d.key === opt.key);
                const checked = !!current;
                const toggle = () => {
                  const next = checked
                    ? (form.dietaryOptions || []).filter(d => d.key !== opt.key)
                    : [...(form.dietaryOptions || []), { key: opt.key, label: opt.label, cantidad: "" }];
                  set("dietaryOptions", next);
                };
                const setCantidad = (val) => {
                  set("dietaryOptions", (form.dietaryOptions || []).map(d => d.key === opt.key ? { ...d, cantidad: val } : d));
                };
                return (
                  <div key={opt.key} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: checked ? "rgba(201,168,76,0.06)" : "var(--bg-sunken)", border: `1px solid ${checked ? "rgba(201,168,76,0.25)" : "var(--border)"}`, borderRadius: 8, transition: "all 0.15s" }}>
                    <input type="checkbox" id={`diet-${opt.key}`} checked={checked} onChange={toggle}
                      style={{ width: 15, height: 15, accentColor: "#c9a84c", cursor: "pointer", flexShrink: 0 }} />
                    <label htmlFor={`diet-${opt.key}`} style={{ fontSize: 13, color: "var(--text-secondary)", cursor: "pointer", flex: 1, display: "flex", alignItems: "center", gap: 7 }}>
                      <span>{opt.icon}</span> {opt.label}
                    </label>
                    {checked && (
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <input type="number" min="1" placeholder="Cant."
                          value={current.cantidad}
                          onChange={e => setCantidad(e.target.value)}
                          onClick={e => e.stopPropagation()}
                          style={{ width: 60, padding: "4px 8px", background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 6, color: "var(--text-primary)", fontSize: 12, outline: "none", textAlign: "center" }}
                        />
                        <span style={{ fontSize: 11, color: "var(--text-faint)" }}>pers.</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
          <button onClick={onClose} style={{ flex: 1, padding: 11, border: "1px solid var(--border)", borderRadius: 8, background: "transparent", color: "var(--text-muted)", fontSize: 13, cursor: "pointer" }}>Cancelar</button>
          <button onClick={() => { if (validate()) onSave(form); }} style={{ flex: 1, padding: 11, border: "none", borderRadius: 8, background: "linear-gradient(135deg, #c9a84c, #e8c97a)", color: "#09090f", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>Guardar</button>
        </div>
      </div>
    </div>
  );
}
