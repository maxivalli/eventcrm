/**
 * POST /api/invitations/generate
 * Genera una imagen de invitación usando Replicate (flux-schnell).
 *
 * Body: { eventId }
 * Returns: { imageUrl }
 *
 * Requiere variable de entorno: REPLICATE_API_TOKEN
 */

const router  = require('express').Router()
const axios   = require('axios')
const prisma  = require('../prisma')
const { authMiddleware } = require('../middleware/auth')

router.use(authMiddleware)

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildPrompt(event) {
  const date = new Date(event.date).toLocaleDateString('es-AR', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
  const typeMap = {
    Corporativo: 'corporate elegant event',
    Cultural:    'cultural artistic event',
    Social:      'elegant social celebration',
  }
  const eventType = typeMap[event.type] || 'elegant event'

  return (
    `Luxury elegant invitation card for a ${eventType}, ` +
    `event name "${event.name}", ` +
    (event.venue ? `venue "${event.venue}", ` : '') +
    `date ${date}. ` +
    `Dark sophisticated background with gold and rose accents, champagne glasses, confetti, ` +
    `serif typography, high-end design, vertical card format, no people, photorealistic render.`
  )
}

async function pollReplicate(predictionId, token, maxWait = 60000) {
  const start = Date.now()
  while (Date.now() - start < maxWait) {
    await new Promise(r => setTimeout(r, 2000))
    const res = await axios.get(
      `https://api.replicate.com/v1/predictions/${predictionId}`,
      { headers: { Authorization: `Token ${token}` } }
    )
    const { status, output, error } = res.data
    if (status === 'succeeded') return output?.[0] || output
    if (status === 'failed')    throw new Error(error || 'Replicate generation failed')
  }
  throw new Error('Replicate timeout: la imagen tardó demasiado en generarse')
}

// ── Endpoint ──────────────────────────────────────────────────────────────────

router.post('/generate', async (req, res) => {
  const { eventId } = req.body
  const token = process.env.REPLICATE_API_TOKEN

  if (!token) {
    return res.status(500).json({ error: 'REPLICATE_API_TOKEN no configurado en el servidor' })
  }
  if (!eventId) {
    return res.status(400).json({ error: 'eventId requerido' })
  }

  try {
    const event = await prisma.event.findUnique({
      where: { id: Number(eventId) },
      include: { client: true },
    })
    if (!event) return res.status(404).json({ error: 'Evento no encontrado' })

    const prompt = buildPrompt(event)

    // Crear predicción en Replicate con flux-schnell
    const createRes = await axios.post(
      'https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions',
      {
        input: {
          prompt,
          aspect_ratio: '2:3',     // vertical, ideal para invitaciones
          output_format: 'webp',
          output_quality: 90,
          num_outputs: 1,
          go_fast: true,
        },
      },
      {
        headers: {
          Authorization: `Token ${token}`,
          'Content-Type': 'application/json',
          Prefer: 'wait=5',        // espera hasta 5s de forma síncrona
        },
      }
    )

    const prediction = createRes.data

    // Si ya terminó en la respuesta síncrona
    if (prediction.status === 'succeeded') {
      const imageUrl = prediction.output?.[0] || prediction.output
      return res.json({ ok: true, imageUrl, prompt })
    }

    // Si no, polling
    const imageUrl = await pollReplicate(prediction.id, token)
    res.json({ ok: true, imageUrl, prompt })

  } catch (e) {
    console.error('[invitations generate error]', e.response?.data || e.message)
    res.status(500).json({ ok: false, error: e.message })
  }
})

module.exports = router
