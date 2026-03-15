import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarClock, User, MapPin, Clock, Users, ThermometerSun, ChevronLeft, ChevronRight } from 'lucide-react'
import { WEATHER_CODES, Skeleton } from './dashboardUtils'

const MESES_FULL  = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const DIAS_SEMANA = ['Lu','Ma','Mi','Ju','Vi','Sá','Do']

const EV_COLORS = {
  Confirmado: { bg: '#22c55e', text: '#fff', dot: '#16a34a' },
  Propuesta:  { bg: '#f59e0b', text: '#fff', dot: '#d97706' },
  Finalizado: { bg: '#8b5cf6', text: '#fff', dot: '#7c3aed' },
}

function MiniMonth({ year, month, events, onEventClick }) {
  const firstDay  = new Date(year, month, 1)
  const lastDay   = new Date(year, month + 1, 0)
  const startDow  = (firstDay.getDay() + 6) % 7
  const totalDays = lastDay.getDate()

  const byDay = {}
  events.forEach(ev => {
    const d = new Date(ev.date)
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate()
      if (!byDay[day]) byDay[day] = []
      byDay[day].push(ev)
    }
  })

  const cells = []
  for (let i = 0; i < startDow; i++) cells.push(null)
  for (let d = 1; d <= totalDays; d++) cells.push(d)

  const today   = new Date()
  const isToday = (d) => today.getFullYear() === year && today.getMonth() === month && today.getDate() === d

  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textAlign: 'center', letterSpacing: 0.5 }}>
        {MESES_FULL[month]}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1 }}>
        {DIAS_SEMANA.map(d => (
          <div key={d} style={{ fontSize: 9, color: 'var(--text-faint)', textAlign: 'center', fontWeight: 600, letterSpacing: 0.5 }}>{d}</div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
        {cells.map((day, i) => {
          if (!day) return <div key={`e${i}`} />
          const evs      = byDay[day] || []
          const hasEvent = evs.length > 0
          const priority = ['Confirmado','Propuesta','Finalizado']
          const topEv    = evs.sort((a, b) => priority.indexOf(a.status) - priority.indexOf(b.status))[0]
          const colors   = topEv ? EV_COLORS[topEv.status] || EV_COLORS.Propuesta : null
          return (
            <div
              key={day}
              onClick={() => hasEvent && onEventClick(evs, year, month, day)}
              title={hasEvent ? evs.map(e => e.name).join(', ') : undefined}
              style={{
                aspectRatio: '1', borderRadius: 5,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, fontWeight: hasEvent ? 700 : 400,
                cursor: hasEvent ? 'pointer' : 'default',
                background: hasEvent ? colors.bg + '22' : isToday(day) ? 'var(--gold-bg)' : 'transparent',
                color: hasEvent ? colors.bg : isToday(day) ? 'var(--gold)' : 'var(--text-muted)',
                border: isToday(day) ? '1px solid var(--gold-border)' : hasEvent ? `1px solid ${colors.bg}44` : '1px solid transparent',
                position: 'relative', transition: 'all 0.15s',
              }}
            >
              {day}
              {evs.length > 1 && (
                <div style={{ position: 'absolute', top: 1, right: 2, fontSize: 7, fontWeight: 800, color: colors.bg, lineHeight: 1 }}>
                  {evs.length}
                </div>
              )}
            </div>
          )
        })}
      </div>
      {Object.keys(byDay).length > 0 && (
        <div style={{ borderTop: '1px solid var(--border-row)', paddingTop: 6, display: 'flex', flexDirection: 'column', gap: 3 }}>
          {Object.entries(byDay).slice(0, 3).map(([day, evs]) =>
            evs.map(ev => {
              const c = EV_COLORS[ev.status] || EV_COLORS.Propuesta
              return (
                <div key={ev.id} style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer' }} onClick={() => onEventClick([ev], year, month, Number(day))}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: c.dot, flexShrink: 0 }} />
                  <div style={{ fontSize: 10, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                    {day}/{String(month+1).padStart(2,'0')} · {ev.name}
                  </div>
                </div>
              )
            })
          )}
          {Object.keys(byDay).length > 3 && (
            <div style={{ fontSize: 10, color: 'var(--text-faint)' }}>+ {Object.values(byDay).flat().length - Object.entries(byDay).slice(0,3).reduce((a,[,v])=>a+v.length,0)} más…</div>
          )}
        </div>
      )}
    </div>
  )
}

function EventPopover({ evs, year, month, day, onClose, navigate }) {
  const [weather, setWeather]             = useState(null)
  const [weatherLoading, setWeatherLoading] = useState(false)
  const [weatherError, setWeatherError]   = useState(false)

  useEffect(() => {
    if (!year || month == null || day == null) return
    const date = new Date(year, month, day).toISOString().slice(0, 10)
    setWeatherLoading(true)
    setWeatherError(false)
    const fetchWeather = async () => {
      try {
        const LAT = -30.2283
        const LON = -61.4474
        const res  = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto&start_date=${date}&end_date=${date}`)
        const data = await res.json()
        const code = data.daily?.weathercode?.[0]
        const max  = data.daily?.temperature_2m_max?.[0]
        const min  = data.daily?.temperature_2m_min?.[0]
        if (typeof code === 'undefined') throw new Error('no forecast')
        setWeather({ code, max, min })
      } catch {
        setWeather(null)
        setWeatherError(true)
      } finally {
        setWeatherLoading(false)
      }
    }
    fetchWeather()
  }, [year, month, day])

  const weatherInfo = weather ? (WEATHER_CODES[weather.code] || { label: 'Clima', icon: <ThermometerSun size={14} />, color: 'var(--text-muted)' }) : null

  if (!evs || evs.length === 0) return null
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)' }} onClick={onClose}>
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-strong)', borderRadius: 16, padding: 24, minWidth: 320, maxWidth: 440, boxShadow: '0 24px 64px rgba(0,0,0,0.4)' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
              {evs.length === 1 ? 'Evento' : `${evs.length} eventos`}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 11, color: 'var(--text-faint)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><CalendarClock size={14} /> {day}/{String(month + 1).padStart(2, '0')}/{year}</div>
              {weatherInfo && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, borderRadius: 12, background: `${weatherInfo.color}20`, color: weatherInfo.color }}>
                    {weatherInfo.icon}
                  </span>
                  {weatherLoading ? 'Cargando clima…' : weather ? `${Math.round(weather.max)}° / ${Math.round(weather.min)}°` : 'Clima no disponible'}
                </div>
              )}
            </div>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 14 }}>✕</button>
        </div>
        {evs.map(ev => {
          const c = EV_COLORS[ev.status] || EV_COLORS.Propuesta
          return (
            <div key={ev.id}
              onClick={() => { onClose(); navigate('/events', { state: { openEventId: ev.id } }) }}
              onMouseEnter={e => e.currentTarget.style.background = c.bg + '28'}
              onMouseLeave={e => e.currentTarget.style.background = c.bg + '14'}
              style={{ padding: '12px 14px', borderRadius: 10, marginBottom: 8, background: c.bg + '14', border: `1px solid ${c.bg}30`, cursor: 'pointer', transition: 'background 0.15s' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{ev.name}</div>
                <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, fontWeight: 700, background: c.bg + '22', color: c.bg }}>{ev.status}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: 'var(--text-muted)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><User size={14} />{ev.client?.name || '—'}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><MapPin size={14} />{ev.venue || '—'}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Clock size={14} />{ev.time || '—'}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Users size={14} />{ev.guests} invitados</div>
              </div>
            </div>
          )
        })}
        {evs.length > 1 && (
          <button onClick={() => { onClose(); navigate('/events') }} style={{ width: '100%', padding: '10px', marginTop: 8, background: 'linear-gradient(135deg, var(--gold), var(--gold-light))', border: 'none', borderRadius: 9, color: '#09090f', fontSize: 13, cursor: 'pointer', fontWeight: 700 }}>
            Ver todos los eventos
          </button>
        )}
      </div>
    </div>
  )
}

export default function CalendarioTab({ data, loading }) {
  const navigate = useNavigate()
  const [year, setYear]     = useState(new Date().getFullYear())
  const [popover, setPopover] = useState(null)

  const events      = data?.events || []
  const yearEvents  = events.filter(e => new Date(e.date).getFullYear() === year)
  const confirmed   = yearEvents.filter(e => e.status === 'Confirmado').length
  const proposals   = yearEvents.filter(e => e.status === 'Propuesta').length
  const finished    = yearEvents.filter(e => e.status === 'Finalizado').length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Header año + navegación */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '16px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button onClick={() => setYear(y => y - 1)} style={{ width: 34, height: 34, borderRadius: 8, background: 'var(--bg-sunken)', border: '1px solid var(--border)', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ChevronLeft size={16} />
          </button>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', minWidth: 60, textAlign: 'center' }}>{year}</div>
          <button onClick={() => setYear(y => y + 1)} style={{ width: 34, height: 34, borderRadius: 8, background: 'var(--bg-sunken)', border: '1px solid var(--border)', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ChevronRight size={16} />
          </button>
          <button onClick={() => setYear(new Date().getFullYear())} style={{ padding: '5px 12px', borderRadius: 8, fontSize: 11, fontWeight: 600, background: 'var(--gold-bg)', border: '1px solid var(--gold-border)', color: 'var(--gold)', cursor: 'pointer' }}>
            Hoy
          </button>
        </div>

        <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
          {!loading && (
            <>
              {[
                { value: confirmed, label: 'Confirmados', color: '#22c55e' },
                { value: proposals, label: 'Propuestas',  color: '#f59e0b' },
                { value: finished,  label: 'Finalizados', color: '#8b5cf6' },
                { value: yearEvents.length, label: 'Total', color: 'var(--text-primary)' },
              ].map(s => (
                <div key={s.label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-faint)', letterSpacing: 0.5 }}>{s.label}</div>
                </div>
              ))}
              <div style={{ display: 'flex', gap: 12, marginLeft: 8, paddingLeft: 20, borderLeft: '1px solid var(--border)' }}>
                {[['Confirmado','#22c55e'],['Propuesta','#f59e0b'],['Finalizado','#8b5cf6']].map(([label, color]) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{label}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Grilla de 12 meses */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, height: 200 }}>
              <div style={{ padding: 14 }}><Skeleton height={12} width={60} style={{ margin: '0 auto' }} /></div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {Array.from({ length: 12 }).map((_, m) => (
            <MiniMonth
              key={m}
              year={year}
              month={m}
              events={events}
              onEventClick={(evs, y, mo, d) => setPopover({ evs, year: y, month: mo, day: d })}
            />
          ))}
        </div>
      )}

      {popover && (
        <EventPopover
          evs={popover.evs} year={popover.year} month={popover.month} day={popover.day}
          onClose={() => setPopover(null)}
          navigate={navigate}
        />
      )}
    </div>
  )
}
