const prisma    = require('../prisma')
const evolution = require('./evolution')
const templates = require('./templates')

// Corre todos los días a las 9:00 AM
const CRON_HOUR   = 9
const CRON_MINUTE = 0

let cronTimer = null

function start() {
  scheduleNext()
  console.log('[WhatsApp Cron] Iniciado — corre todos los días a las 09:00')
}

function stop() {
  if (cronTimer) { clearTimeout(cronTimer); cronTimer = null }
}

function scheduleNext() {
  const now  = new Date()
  const next = new Date()
  next.setHours(CRON_HOUR, CRON_MINUTE, 0, 0)
  if (next <= now) next.setDate(next.getDate() + 1)

  const ms = next - now
  console.log(`[WhatsApp Cron] Próxima ejecución: ${next.toLocaleString('es-AR')} (en ${Math.round(ms / 60000)} min)`)

  cronTimer = setTimeout(async () => {
    await runJobs()
    scheduleNext()
  }, ms)
}

async function runJobs() {
  console.log('[WhatsApp Cron] Ejecutando jobs...')
  const all = templates.getAll()

  await Promise.allSettled([
    all.reminder?.active  ? jobDayBefore()   : null,
    all.thanks?.active    ? jobDayAfter()    : null,
    all.birthday?.active  ? jobBirthday()    : null,
  ].filter(Boolean))

  console.log('[WhatsApp Cron] Jobs completados.')
}

// ── Job: recordatorio día anterior ───────────────────────────────────────────

async function jobDayBefore() {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const start = new Date(tomorrow); start.setHours(0, 0, 0, 0)
  const end   = new Date(tomorrow); end.setHours(23, 59, 59, 999)

  const events = await prisma.event.findMany({
    where: {
      date:   { gte: start, lte: end },
      status: { in: ['Confirmado', 'confirmado'] },
    },
    include: { client: true },
  })

  for (const ev of events) {
    if (!ev.client?.phone) continue
    try {
      const text = templates.render('reminder', {
        nombre: ev.client.name,
        evento: ev.name,
        lugar:  ev.venue,
        fecha:  formatDate(ev.date),
      })
      await evolution.sendText(ev.client.phone, text)
      console.log(`[Cron reminder] ✓ ${ev.client.name} — ${ev.name}`)
    } catch (e) {
      console.error(`[Cron reminder] ✗ ${ev.client.name}:`, e.message)
    }
  }
}

// ── Job: agradecimiento post evento ──────────────────────────────────────────

async function jobDayAfter() {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const start = new Date(yesterday); start.setHours(0, 0, 0, 0)
  const end   = new Date(yesterday); end.setHours(23, 59, 59, 999)

  const events = await prisma.event.findMany({
    where: {
      date:   { gte: start, lte: end },
      status: { in: ['Confirmado', 'confirmado', 'Realizado', 'realizado'] },
    },
    include: { client: true },
  })

  for (const ev of events) {
    if (!ev.client?.phone) continue
    try {
      const text = templates.render('thanks', {
        nombre: ev.client.name,
        evento: ev.name,
        lugar:  ev.venue,
        fecha:  formatDate(ev.date),
      })
      await evolution.sendText(ev.client.phone, text)
      console.log(`[Cron thanks] ✓ ${ev.client.name} — ${ev.name}`)
    } catch (e) {
      console.error(`[Cron thanks] ✗ ${ev.client.name}:`, e.message)
    }
  }
}

// ── Job: propuesta cumpleaños (30 días antes) ─────────────────────────────────

async function jobBirthday() {
  const target = new Date()
  target.setDate(target.getDate() + 30)
  const targetMonth = target.getMonth() + 1
  const targetDay   = target.getDate()

  // Buscar clientes cuyo cumpleaños (mes/día) coincide, sin importar el año
  const clients = await prisma.client.findMany({
    where: { birthdate: { not: null }, status: 'Activo' },
  })

  const matching = clients.filter(c => {
    if (!c.birthdate) return false
    const bd = new Date(c.birthdate)
    return bd.getMonth() + 1 === targetMonth && bd.getDate() === targetDay
  })

  for (const client of matching) {
    if (!client.phone) continue
    try {
      const text = templates.render('birthday', {
        nombre: client.name,
      })
      await evolution.sendText(client.phone, text)
      console.log(`[Cron birthday] ✓ ${client.name}`)
    } catch (e) {
      console.error(`[Cron birthday] ✗ ${client.name}:`, e.message)
    }
  }
}

// ── Ejecución manual (para testear desde la UI) ───────────────────────────────

async function runJobManual(jobId) {
  switch (jobId) {
    case 'reminder': return jobDayBefore()
    case 'thanks':   return jobDayAfter()
    case 'birthday': return jobBirthday()
    default: throw new Error(`Job desconocido: ${jobId}`)
  }
}

// ── Utils ─────────────────────────────────────────────────────────────────────

function formatDate(date) {
  return new Date(date).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })
}

module.exports = { start, stop, runJobs, runJobManual }
