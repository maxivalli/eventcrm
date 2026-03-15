import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import { get as httpGet } from 'http'
import { get as httpsGet } from 'https'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DIST      = path.join(__dirname, 'dist')
const API       = (process.env.API_URL || process.env.VITE_API_URL || 'http://localhost:3001').replace(/\/$/, '')

const BOT_UA = /whatsapp|facebookexternalhit|twitterbot|telegrambot|linkedinbot|slackbot|discordbot|applebot|googlebot/i

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    const fn = url.startsWith('https') ? httpsGet : httpGet
    fn(url, res => {
      let raw = ''
      res.on('data', c => raw += c)
      res.on('end', () => { try { resolve(JSON.parse(raw)) } catch { reject(new Error('parse')) } })
    }).on('error', reject)
  })
}

function escape(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
}

function ogPage({ title, description, url, imageUrl }) {
  const t = escape(title)
  const d = escape(description)
  const u = escape(url)
  const img = escape(imageUrl)
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>${t}</title>
  <meta name="description" content="${d}" />
  <meta property="og:type"        content="website" />
  <meta property="og:title"       content="${t}" />
  <meta property="og:description" content="${d}" />
  <meta property="og:url"         content="${u}" />
  <meta property="og:image"       content="${img}" />
  <meta property="og:image:width"  content="400" />
  <meta property="og:image:height" content="400" />
  <meta name="twitter:card"        content="summary" />
  <meta name="twitter:title"       content="${t}" />
  <meta name="twitter:description" content="${d}" />
  <meta name="twitter:image"       content="${img}" />
  <meta http-equiv="refresh" content="0;url=${u}" />
</head>
<body><a href="${u}">${t}</a></body>
</html>`
}

const app = express()

const logoUrl = (req) => `${req.protocol}://${req.get('host')}/haus-logo.png`

// ── Portal del cliente (/portal/:token) ──────────────────────────────────────
app.get('/portal/:token', async (req, res, next) => {
  if (!BOT_UA.test(req.headers['user-agent'] || '')) return next()
  try {
    const data  = await fetchJSON(`${API}/api/portal/${req.params.token}`)
    const event = data.event
    if (!event) return next()
    const fmtDate = (str) => new Date(str).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })
    const title       = event.name
    const description = [
      event.client?.name ? `Evento de ${event.client.name}` : null,
      event.date ? fmtDate(event.date) : null,
      event.venue || null,
    ].filter(Boolean).join(' · ')
    res.send(ogPage({ title, description, url: `${req.protocol}://${req.get('host')}${req.originalUrl}`, imageUrl: logoUrl(req) }))
  } catch { next() }
})

// ── Portal de invitados (/evento/:token) ─────────────────────────────────────
app.get('/evento/:token', async (req, res, next) => {
  if (!BOT_UA.test(req.headers['user-agent'] || '')) return next()
  try {
    const data  = await fetchJSON(`${API}/api/guest-portal/${req.params.token}`)
    const event = data.event
    if (!event) return next()
    const fmtDate = (str) => new Date(str).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })
    const title       = event.name
    const description = [
      event.date ? fmtDate(event.date) : null,
      event.venue || null,
      'Confirmá tu asistencia',
    ].filter(Boolean).join(' · ')
    res.send(ogPage({ title, description, url: `${req.protocol}://${req.get('host')}${req.originalUrl}`, imageUrl: logoUrl(req) }))
  } catch { next() }
})

// ── SPA fallback ─────────────────────────────────────────────────────────────
app.use(express.static(DIST))
app.use((_req, res) => res.sendFile(path.join(DIST, 'index.html')))

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log(`Frontend en http://localhost:${PORT}`))
