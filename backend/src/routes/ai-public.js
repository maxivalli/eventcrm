const router = require('express').Router()

// ── Chatbot del portal del cliente (ruta pública, sin authMiddleware) ───────
router.post('/portal-chat', async (req, res) => {
  const { question, context } = req.body
  if (!question) return res.status(400).json({ error: 'Pregunta requerida' })
  if (!context) return res.status(400).json({ error: 'Contexto requerido' })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'API key de Anthropic no configurada' })

  const fmtARS = (n) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n || 0)
  const fmtDate = (str) => new Date(str).toLocaleDateString('es-AR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })

  const { event, menu, payments, finance, services, dietaryOptions } = context

  const menuText = (menu || []).map(s =>
    `${s.nombre}: ${(s.items || []).map(i => i.dish?.name || i.name).join(', ')}`
  ).join('\n')

  const dietaryText = (dietaryOptions || []).length > 0
    ? (dietaryOptions).map(d => `- ${d.label}${d.cantidad ? `: ${d.cantidad} personas` : ''}`).join('\n')
    : 'Sin necesidades alimentarias especiales registradas'

  const systemPrompt = `Sos el asistente virtual de Haus, empresa de organización de eventos en Argentina. Estás en el portal de seguimiento del evento del cliente.

Tu rol es responder preguntas del cliente sobre su evento de forma amable, clara y profesional. Usá un tono cálido y cercano, tuteando al cliente.

INFORMACIÓN DEL EVENTO:
- Nombre: ${event?.name}
- Fecha: ${event?.date ? fmtDate(event.date) : 'N/A'}
- Hora: ${event?.time || 'A confirmar'}
- Venue: ${event?.venue}
- Tipo: ${event?.type}
- Invitados: ${event?.guests}
- Estado: ${event?.status}

MENÚ:
${menuText || 'Sin menú cargado aún'}

NECESIDADES ALIMENTARIAS ESPECIALES:
${dietaryText}

ESTADO DE CUENTA:
- Total: ${fmtARS(finance?.totalQuotes)}
- Pagado: ${fmtARS(finance?.totalPaid)}
- Saldo pendiente: ${fmtARS(finance?.balance)}
- Pagos registrados: ${(payments || []).length}

REGLAS IMPORTANTES:
- Solo respondé preguntas relacionadas al evento. Si la pregunta no está relacionada, respondé amablemente que no podés ayudar con eso.
- Cuando la información está en los datos de arriba, respondé con TOTAL CONFIANZA y en forma afirmativa. No digas que "vas a consultar" si ya tenés el dato.
- Si genuinamente no podés responder con los datos disponibles, respondé con exactamente este formato al INICIO de tu respuesta (en la primera línea, sin nada antes): [CONSULTA_PENDIENTE] y luego tu mensaje al cliente explicando que lo vas a derivar al equipo.
- No inventes información que no tenés
- Si preguntan por formas de pago o quieren abonar, indicales que se comuniquen con Haus directamente
- Respuestas cortas y concretas, máximo 3 párrafos
- No uses markdown, solo texto plano con emojis si es necesario`

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 500,
        system: systemPrompt,
        messages: [{ role: 'user', content: question }],
      }),
    })

    const data = await response.json()
    if (!response.ok) return res.status(502).json({ error: data.error?.message || 'Error al consultar la IA' })

    let answer = data.content?.map(b => b.text || '').join('') || ''

    // Si el bot marcó que necesita consulta, guardarla en la DB y limpiar el tag
    if (answer.startsWith('[CONSULTA_PENDIENTE]')) {
      answer = answer.replace('[CONSULTA_PENDIENTE]', '').trim()
      if (context?.event?.id) {
        try {
          await fetch(`${process.env.INTERNAL_API_URL || 'http://localhost:3001'}/api/portal-queries`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ eventId: context.event.id, question }),
          })
        } catch (e) {
          console.error('Error guardando consulta pendiente:', e.message)
        }
      }
    }

    res.json({ answer })
  } catch (e) {
    res.status(502).json({ error: 'No se pudo procesar la pregunta' })
  }
})

module.exports = router