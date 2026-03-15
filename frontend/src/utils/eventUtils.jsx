import { Sun, Cloud, CloudRain, CloudSnow, CloudLightning, Wheat, Leaf, Salad, Stethoscope, Star, Milk } from "lucide-react";

export const statusColors = {
  Confirmado: "#22c55e",
  Propuesta:  "#f59e0b",
  Finalizado: "#8b5cf6",
};

export const typeColors = {
  Corporativo: "#3b82f6",
  Cultural:    "#8b5cf6",
  Social:      "#ec4899",
};

export const quoteStatusColors = {
  Aprobado:  "#22c55e",
  Pendiente: "#f59e0b",
  Rechazado: "#ef4444",
};

export const ESTADOS = ["Todos", "Propuesta", "Confirmado", "Finalizado"];

export const SECCION_ORDER = ['Entrada', 'Plato principal', 'Guarnición', 'Bebidas', 'Postre', 'Trasnoche', 'Otros'];

export const sortSections = (sections) =>
  [...sections].sort((a, b) => {
    const ia = SECCION_ORDER.indexOf(a.nombre);
    const ib = SECCION_ORDER.indexOf(b.nombre);
    if (ia === -1 && ib === -1) return 0;
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });

export const SECCION_COLORS = {
  'Entrada': '#3b82f6', 'Plato principal': '#8b5cf6', 'Guarnición': '#22c55e',
  'Bebidas': '#06b6d4', 'Postre': '#ec4899', 'Trasnoche': '#f97316', 'Otros': '#6b7280',
};

export const WEATHER_CODES = {
  0:  { label: 'Despejado',            icon: <Sun size={14} />,            color: '#f59e0b' },
  1:  { label: 'Principalmente claro', icon: <Sun size={14} />,            color: '#f59e0b' },
  2:  { label: 'Parcialmente nublado', icon: <Cloud size={14} />,          color: '#64748b' },
  3:  { label: 'Nublado',              icon: <Cloud size={14} />,          color: '#64748b' },
  45: { label: 'Niebla',               icon: <Cloud size={14} />,          color: '#64748b' },
  48: { label: 'Niebla helada',        icon: <Cloud size={14} />,          color: '#64748b' },
  51: { label: 'Llovizna ligera',      icon: <CloudRain size={14} />,      color: '#3b82f6' },
  53: { label: 'Llovizna',             icon: <CloudRain size={14} />,      color: '#3b82f6' },
  55: { label: 'Llovizna intensa',     icon: <CloudRain size={14} />,      color: '#3b82f6' },
  61: { label: 'Lluvia ligera',        icon: <CloudRain size={14} />,      color: '#3b82f6' },
  63: { label: 'Lluvia',               icon: <CloudRain size={14} />,      color: '#3b82f6' },
  65: { label: 'Lluvia intensa',       icon: <CloudRain size={14} />,      color: '#3b82f6' },
  66: { label: 'Aguanieve ligera',     icon: <CloudSnow size={14} />,      color: '#60a5fa' },
  67: { label: 'Aguanieve intensa',    icon: <CloudSnow size={14} />,      color: '#60a5fa' },
  71: { label: 'Nieve ligera',         icon: <CloudSnow size={14} />,      color: '#60a5fa' },
  73: { label: 'Nieve',                icon: <CloudSnow size={14} />,      color: '#60a5fa' },
  75: { label: 'Nieve intensa',        icon: <CloudSnow size={14} />,      color: '#60a5fa' },
  80: { label: 'Lluvias dispersas',    icon: <CloudRain size={14} />,      color: '#3b82f6' },
  81: { label: 'Lluvias',              icon: <CloudRain size={14} />,      color: '#3b82f6' },
  82: { label: 'Lluvias fuertes',      icon: <CloudRain size={14} />,      color: '#3b82f6' },
  95: { label: 'Tormenta eléctrica',   icon: <CloudLightning size={14} />, color: '#f97316' },
  96: { label: 'Tormenta con granizo', icon: <CloudLightning size={14} />, color: '#f97316' },
  99: { label: 'Tormenta grave',       icon: <CloudLightning size={14} />, color: '#f97316' },
};

export const BAD_WEATHER_CODES = new Set([51, 53, 55, 61, 63, 65, 66, 67, 71, 73, 75, 80, 81, 82, 95, 96, 99]);
export const isBadWeather = (code) => BAD_WEATHER_CODES.has(code);

export const fmt = (n) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n || 0);

export const fmtDate = (str) =>
  new Date(str).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" });

export const isPastEvent = (ev) => {
  if (ev.status === 'Finalizado') return false;
  const eventDate = new Date(ev.date);
  if (ev.time) {
    const [h, m] = ev.time.split(':');
    eventDate.setHours(Number(h), Number(m), 0, 0);
  } else {
    eventDate.setHours(23, 59, 0, 0);
  }
  return eventDate < new Date();
};

export const DIETARY_OPTIONS = [
  { key: 'celiac',     label: 'Celíacos',    icon: <Wheat size={14} /> },
  { key: 'vegan',      label: 'Veganos',      icon: <Leaf size={14} /> },
  { key: 'vegetarian', label: 'Vegetarianos', icon: <Salad size={14} /> },
  { key: 'diabetic',   label: 'Diabéticos',   icon: <Stethoscope size={14} /> },
  { key: 'kosher',     label: 'Kosher',       icon: <Star size={14} /> },
  { key: 'lactose',    label: 'Sin lactosa',  icon: <Milk size={14} /> },
];

export function Badge({ label, color }) {
  return (
    <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, fontWeight: 600, background: `${color}20`, color, whiteSpace: "nowrap" }}>
      {label}
    </span>
  );
}

export function BalanceBar({ label, value, max, color }) {
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
