const router = require('express').Router()
const prisma = require('../prisma')

// ── Chatbot del portal del cliente (ruta pública, sin authMiddleware) ───────
router.post('/portal-chat', async (req, res) => {
  const { question, context } = req.body
  if (!question) return res.status(400).json({ error: 'Pregunta requerida' })
  if (!context) return res.status(400).json({ error: 'Contexto requerido' })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'API key de Anthropic no configurada' })

  const fmtARS = (n) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n || 0)
  const fmtDate = (str) => new Date(str).toLocaleDateString('es-AR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })

  const { event, menu, payments, finance, dietaryOptions } = context

  // Fetchear guests directamente de la DB para garantizar datos frescos
  let guestsArr = []
  if (event?.id) {
    try {
      guestsArr = await prisma.eventGuest.findMany({
        where: { eventId: Number(event.id) },
        orderBy: { name: 'asc' },
      })
    } catch (e) {
      console.error('Error fetching guests for chat:', e.message)
    }
  }

  const menuText = (menu || []).map(s =>
    `${s.nombre}: ${(s.items || []).map(i => i.dish?.name || i.name).join(', ')}`
  ).join('\n')

  const dietaryArr = Array.isArray(dietaryOptions) ? dietaryOptions : []
  const dietaryText = dietaryArr.length > 0
    ? dietaryArr.map(d => `- ${d.label}${d.cantidad ? `: ${d.cantidad} personas` : ''}`).join('\n')
    : 'Sin necesidades alimentarias especiales registradas'

  const mayores        = guestsArr.filter(g => g.tipo === 'Mayor')
  const menores        = guestsArr.filter(g => g.tipo === 'Menor')
  const pagaron        = guestsArr.filter(g => g.pagado)
  const pagaronEnPuerta = guestsArr.filter(g => g.pagadoEnPuerta && !g.pagado)
  const sinPagar       = guestsArr.filter(g => !g.pagado && !g.pagadoEnPuerta)
  const confirmados    = guestsArr.filter(g => g.confirmed)
  const ingresaron     = guestsArr.filter(g => g.ingreso)
  const guestsText = guestsArr.length === 0
    ? 'No hay invitados cargados en el sistema todavía.'
    : `Total cargados: ${guestsArr.length} (${mayores.length} mayores, ${menores.length} menores)
Confirmaron asistencia (RSVP): ${confirmados.length}
Pagaron tarjeta (registrado en CRM): ${pagaron.length}
Pagaron en puerta: ${pagaronEnPuerta.length}
Sin pagar: ${sinPagar.length}
Ya ingresaron al evento: ${ingresaron.length} — Aún no ingresaron: ${guestsArr.length - ingresaron.length}
Lista: ${guestsArr.map(g => `${g.name} (${g.tipo}${g.confirmed ? ', confirmó' : ''}${g.pagado ? ', pagó tarjeta' : g.pagadoEnPuerta ? ', pagó en puerta' : ', sin pagar'}${g.ingreso ? ', ingresó' : ''})`).join(', ')}`

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
${event?.ticketPrice ? `- Precio de la tarjeta: ${fmtARS(event.ticketPrice)}` : '- Precio de la tarjeta: No definido'}

MENÚ:
${menuText || 'Sin menú cargado aún'}

NECESIDADES ALIMENTARIAS ESPECIALES:
${dietaryText}

LISTA DE INVITADOS:
${guestsText}

ESTADO DE CUENTA:
- Total: ${fmtARS(finance?.totalQuotes)}
- Pagado: ${fmtARS(finance?.totalPaid)}
- Saldo pendiente: ${fmtARS(finance?.balance)}
- Pagos registrados: ${(payments || []).length}

REGLAS IMPORTANTES:
- Solo respondé preguntas relacionadas al evento. Si la pregunta no tiene nada que ver con el evento, respondé amablemente que no podés ayudar con eso.
- Respondé ÚNICAMENTE con información que esté LITERALMENTE en los datos de arriba. Sin suposiciones, sin interpretaciones, sin completar con lógica propia.
- PROHIBIDO decirle al cliente que "consulte con Haus", que "se comunique con el equipo", que "te recomiendo preguntar", o cualquier variante de eso. Si vas a decirle eso, entonces TENÉS que usar [CONSULTA_PENDIENTE].
- Si la respuesta completa está en los datos: respondé con confianza.
- Si la respuesta NO está completa en los datos, o si el cliente necesita hablar con alguien del equipo para obtener la respuesta: usá OBLIGATORIAMENTE [CONSULTA_PENDIENTE] al inicio de tu respuesta (primera línea, sin nada antes), seguido de un mensaje cálido diciéndole que registraste su consulta y que el equipo de Haus se contacta a la brevedad.
- Ejemplos de cuándo usar [CONSULTA_PENDIENTE]: marcas de bebidas, nombre de proveedores, detalles de decoración, horario exacto de ingreso, estacionamiento, cambios al menú, solicitudes especiales, preguntas sobre pagos o presupuesto que no estén en los datos, cualquier cosa operativa. Preguntas sobre invitados específicos o el estado de su lista SÍ podés responderlas si están en los datos.
- RESPUESTAS CORTAS Y DIRECTAS: respondé solo lo que te preguntaron, sin agregar información extra que no fue solicitada. Si pregunta por invitados, respondé solo sobre invitados. Si pregunta por pagos de tarjeta, respondé solo eso — no agregues info del estado de cuenta general.
- Máximo 2 oraciones por respuesta. Sin relleno, sin contexto no solicitado.
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
    if (answer.includes("[CONSULTA_PENDIENTE]")) {
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

// ── Chatbot del portal de invitados (ruta pública, sin authMiddleware) ────────
router.post('/guest-portal-chat', async (req, res) => {
  const { token, question } = req.body
  if (!token)    return res.status(400).json({ error: 'Token requerido' })
  if (!question) return res.status(400).json({ error: 'Pregunta requerida' })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'API key de Anthropic no configurada' })

  const fmtARS  = (n) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n || 0)
  const fmtDate = (str) => new Date(str).toLocaleDateString('es-AR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })

  // Fetch solo lo necesario — sin datos financieros ni lista de invitados
  let event = null
  let menuSections = []
  try {
    const SECCION_ORDER = ['Entrada', 'Plato principal', 'Guarnición', 'Bebidas', 'Postre', 'Trasnoche', 'Otros']
    const ev = await prisma.event.findUnique({
      where: { guestPortalToken: token },
      include: {
        client: { select: { name: true } },
        quotes: {
          where: { kind: 'Catering', clientStatus: 'Aprobado' },
          include: {
            menus: {
              include: {
                menu: {
                  include: {
                    sections: {
                      orderBy: { orden: 'asc' },
                      include: { items: { include: { dish: { select: { name: true, descripcion: true } } } } }
                    }
                  }
                }
              }
            }
          }
        }
      }
    })
    if (!ev) return res.status(404).json({ error: 'Portal no encontrado' })

    event = ev
    const seen = new Set()
    menuSections = ev.quotes
      .flatMap(q => q.menus || [])
      .flatMap(qm => qm.menu?.sections || [])
      .filter(s => { if (seen.has(s.nombre)) return false; seen.add(s.nombre); return true })
      .sort((a, b) => {
        const ia = SECCION_ORDER.indexOf(a.nombre), ib = SECCION_ORDER.indexOf(b.nombre)
        if (ia === -1 && ib === -1) return 0
        if (ia === -1) return 1
        if (ib === -1) return -1
        return ia - ib
      })
  } catch (e) {
    return res.status(500).json({ error: 'Error al cargar datos del evento' })
  }

  const menuText = menuSections.map(s =>
    `${s.nombre}: ${(s.items || []).map(i => i.dish?.name || '').filter(Boolean).join(', ')}`
  ).join('\n')

  const systemPrompt = `Sos el asistente virtual de Haus, empresa de organización de eventos en Argentina. Estás en el portal de invitados del evento.

Tu rol es responder preguntas de los invitados sobre el evento de forma amable, clara y profesional. Tuteá a los invitados.

INFORMACIÓN DEL EVENTO:
- Nombre: ${event.name}
- Fecha: ${fmtDate(event.date)}
- Hora: ${event.time || 'A confirmar'}
- Lugar: ${event.venue}
- Tipo: ${event.type}
${event.ticketPrice ? `- Precio de entrada: ${fmtARS(event.ticketPrice)}` : ''}

MENÚ:
${menuText || 'Sin menú confirmado aún'}

REGLAS IMPORTANTES:
- Solo respondé preguntas relacionadas al evento (fecha, hora, lugar, menú, precio de entrada).
- PROHIBIDO revelar información financiera del evento, datos del organizador, o información de otros invitados.
- PROHIBIDO responder sobre quiénes más fueron invitados, cuánta gente hay, o el estado de pagos de nadie.
- Si la respuesta está en los datos: respondé con confianza.
- Si la respuesta NO está en los datos, o si el invitado necesita hablar con el equipo: usá OBLIGATORIAMENTE [CONSULTA_PENDIENTE] al inicio de tu respuesta, seguido de un mensaje cálido diciéndoles que registraste su consulta y que Haus se contacta a la brevedad.
- Ejemplos de [CONSULTA_PENDIENTE]: estacionamiento, dresscode, regalos, cambios de menú, solicitudes especiales, cualquier detalle no listado arriba.
- RESPUESTAS CORTAS Y DIRECTAS. Máximo 2 oraciones. Sin relleno.
- No uses markdown, solo texto plano con emojis si es necesario.`

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
        max_tokens: 400,
        system: systemPrompt,
        messages: [{ role: 'user', content: question }],
      }),
    })

    const data = await response.json()
    if (!response.ok) return res.status(502).json({ error: data.error?.message || 'Error al consultar la IA' })

    let answer = data.content?.map(b => b.text || '').join('') || ''

    if (answer.includes('[CONSULTA_PENDIENTE]')) {
      answer = answer.replace('[CONSULTA_PENDIENTE]', '').trim()
      try {
        await prisma.portalQuery.create({ data: { eventId: event.id, question } })
      } catch (e) {
        console.error('Error guardando consulta pendiente (guest):', e.message)
      }
    }

    res.json({ answer })
  } catch (e) {
    res.status(502).json({ error: 'No se pudo procesar la pregunta' })
  }
})

module.exports = router