import { useState } from "react";

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

export default function DatePicker({ value, onChange, hasError }) {
  const today      = new Date();
  const initial    = value ? parseLocalDate(value) : null;
  const [open, setOpen]     = useState(false);
  const [cursor, setCursor] = useState(initial ?? today);

  const year  = cursor.getFullYear();
  const month = cursor.getMonth();

  const firstDay    = new Date(year, month, 1);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const select = (day) => {
    if (!day) return;
    onChange(toLocalISO(new Date(year, month, day)));
    setOpen(false);
  };

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
              <button type="button" onClick={() => setCursor(new Date(year, month - 1, 1))} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "4px 8px", borderRadius: 6, fontSize: 16, lineHeight: 1 }}>‹</button>
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
                {MESES[month]} {year}
              </span>
              <button type="button" onClick={() => setCursor(new Date(year, month + 1, 1))} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "4px 8px", borderRadius: 6, fontSize: 16, lineHeight: 1 }}>›</button>
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
