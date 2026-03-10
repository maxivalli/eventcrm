const router = require('express').Router()

router.post('/suggest-ingredients', async (req, res) => {
  const { name, seccion, descripcion } = req.body

  if (!name) return res.status(400).json({ error: 'El nombre del plato es requerido' })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'API key de Anthropic no configurada' })

  const prompt = `Sos un chef profesional especializado en catering para eventos sociales y corporativos en Argentina.

El plato es: "${name}"
Sección del menú: ${seccion || 'No especificada'}
${descripcion ? `Descripción: ${descripcion}` : ''}

Generá una lista de ingredientes con cantidades POR PERSONA para este plato de catering.
Usá cantidades realistas para servicio de eventos (no cocina hogareña).

IMPORTANTE — criterio de compra vs. elaboración:
- Este es un servicio de catering profesional. Siempre que exista una versión industrializada o semi-elaborada de calidad, usala en lugar de listar ingredientes para elaboración casera.
- Ejemplos: para empanadas → "tapas de empanada (industrializadas)"; para pastas → "pasta fresca (comprada)"; para pan → "pan de campo (comprado)"; para masa de tarta → "masa de tarta (comprada)".
- Solo listá ingredientes de elaboración propia para rellenos, salsas, aderezos y preparaciones que el catering sí hace desde cero.

Respondé ÚNICAMENTE con un JSON válido, sin texto adicional, sin markdown, con este formato exacto:
[
  { "nombre": "nombre del ingrediente", "cantidad": número, "unidad": "g|kg|ml|l|unidad|porción|rebanada|cucharada", "categoria": "Carnes|Fiambres|Lácteos|Verduras|Frutas|Almacén|Bebidas|Panificados|Otros" }
]

Reglas:
- Solo devolvé el array JSON, nada más
- cantidad debe ser un número (no string)
- Usá unidades del listado exactamente como están escritas
- Usá categorías del listado exactamente como están escritas
- Cantidades realistas para eventos (ej: fiambre 80g/pers, papa 150g/pers, tapas de empanada 3 unidad/pers)`

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
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      return res.status(502).json({ error: data.error?.message || 'Error al consultar la IA' })
    }

    const text = data.content?.map(b => b.text || '').join('') || ''
    const clean = text.replace(/```json|```/g, '').trim()
    const ingredients = JSON.parse(clean)

    if (!Array.isArray(ingredients)) throw new Error('Respuesta inválida')

    res.json({ ingredients })
  } catch (e) {
    res.status(502).json({ error: 'No se pudo generar la sugerencia' })
  }
})

router.post('/suggest-dish-info', async (req, res) => {
  const { name, ingredients, seccion } = req.body

  if (!name) return res.status(400).json({ error: 'El nombre del plato es requerido' })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'API key de Anthropic no configurada' })

  const listaIngredientes = ingredients?.length
    ? ingredients.map(i => `${i.nombre} (${i.cantidad}${i.unidad}/pers)`).join(', ')
    : 'No especificados'

  const prompt = `Sos un chef profesional especializado en catering para eventos sociales y corporativos en Argentina.

Plato: "${name}"
Sección del menú: ${seccion || 'No especificada'}
Ingredientes principales: ${listaIngredientes}

Escribí una descripción breve para el menú impreso del evento. Debe tener 1 o 2 oraciones en estilo carta de restaurant, destacando lo más apetitoso del plato. Sin mencionar cantidades ni gramajes.

Respondé ÚNICAMENTE con un JSON válido, sin texto adicional, sin markdown:
{ "descripcion": "Descripción breve para el menú." }`

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
        max_tokens: 300,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    const data = await response.json()
    if (!response.ok) return res.status(502).json({ error: data.error?.message || 'Error al consultar la IA' })

    const text = data.content?.map(b => b.text || '').join('') || ''
    const clean = text.replace(/```json|```/g, '').trim()
    const result = JSON.parse(clean)

    if (!result.descripcion) throw new Error('Respuesta inválida')
    res.json(result)
  } catch (e) {
    console.error('Error suggest-dish-info:', e.message)
    res.status(502).json({ error: 'No se pudo generar la descripción' })
  }
})

router.post('/generate-checklist', async (req, res) => {
  const { type, guests, venue, date, name } = req.body

  if (!type) return res.status(400).json({ error: 'El tipo de evento es requerido' })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'API key de Anthropic no configurada' })

  const prompt = `Sos un coordinador de eventos profesional en Argentina con más de 10 años de experiencia.

Vas a generar un checklist de producción para el siguiente evento:
- Tipo: ${type}
- Nombre: ${name || 'Sin nombre'}
- Invitados: ${guests || 'No especificado'}
- Venue: ${venue || 'No especificado'}
- Fecha: ${date || 'No especificada'}

Generá una lista de tareas de producción detallada y realista, organizada en grupos lógicos.
Las tareas deben cubrir: coordinación general, catering, logística, decoración, proveedores, comunicación con el cliente, y cierre del evento.
Adaptá el checklist al tipo de evento (casamiento, corporativo, cumpleaños, etc.).
Incluí entre 15 y 25 tareas según la complejidad del evento.

Respondé ÚNICAMENTE con un JSON válido, sin texto adicional, sin markdown, con este formato exacto:
[
  { "title": "Descripción concisa de la tarea", "group": "Coordinación|Catering|Logística|Decoración|Proveedores|Cliente|Cierre" }
]

Reglas:
- Solo devolvé el array JSON, nada más
- Usá grupos del listado exactamente como están escritos
- Las tareas deben ser concretas y accionables
- Redactá en infinitivo (ej: "Confirmar menú con el cliente", "Reservar equipo de sonido")`

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
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      return res.status(502).json({ error: data.error?.message || 'Error al consultar la IA' })
    }

    const text = data.content?.map(b => b.text || '').join('') || ''
    const clean = text.replace(/```json|```/g, '').trim()
    const tasks = JSON.parse(clean)

    if (!Array.isArray(tasks)) throw new Error('Respuesta inválida')

    res.json({ tasks })
  } catch (e) {
    res.status(502).json({ error: 'No se pudo generar el checklist' })
  }
})


router.post('/generate-schedule', async (req, res) => {
  const { type, guests, venue, date, time, name } = req.body

  if (!type) return res.status(400).json({ error: 'El tipo de evento es requerido' })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'API key de Anthropic no configurada' })

  const prompt = `Sos un coordinador de eventos profesional en Argentina con más de 10 años de experiencia organizando eventos sociales y corporativos.

Generá un cronograma detallado para el siguiente evento:
- Nombre: ${name || 'Sin nombre'}
- Tipo: ${type}
- Invitados: ${guests || 'No especificado'}
- Venue: ${venue || 'No especificado'}
- Fecha: ${date || 'No especificada'}
- Hora de inicio: ${time || '20:00'}

El cronograma debe cubrir desde la preparación del venue (horas antes) hasta el cierre del evento.
Incluí momentos clave: llegada del equipo, montaje, llegada de invitados, recepción, cada momento gastronómico, entretenimiento, momentos especiales y cierre.
Adaptá el cronograma al tipo de evento (casamiento, corporativo, cumpleaños, etc.).
Usá la hora de inicio indicada como referencia para calcular todos los horarios.
Incluí entre 10 y 18 ítems según la complejidad.

Respondé ÚNICAMENTE con un JSON válido, sin texto adicional, sin markdown, con este formato exacto:
[
  {
    "hora": "HH:MM",
    "titulo": "Nombre corto del momento",
    "descripcion": "Descripción breve de lo que ocurre",
    "categoria": "Preparación|Recepción|Gastronomía|Entretenimiento|Protocolo|Cierre"
  }
]

Reglas:
- Solo devolvé el array JSON, nada más
- hora debe estar en formato HH:MM (24hs)
- Los ítems deben estar ordenados cronológicamente
- Usá categorías del listado exactamente como están escritas
- Las descripciones deben ser concretas y útiles para el coordinador`

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
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      return res.status(502).json({ error: data.error?.message || 'Error al consultar la IA' })
    }

    const text = data.content?.map(b => b.text || '').join('') || ''
    const clean = text.replace(/```json|```/g, '').trim()
    const schedule = JSON.parse(clean)

    if (!Array.isArray(schedule)) throw new Error('Respuesta inválida')

    res.json({ schedule })
  } catch (e) {
    res.status(502).json({ error: 'No se pudo generar el cronograma' })
  }
})

module.exports = router

// ── Briefing del evento para el equipo ─────────────────────────────────────
router.post('/event-briefing', async (req, res) => {
  const { event, menu, payments, quotes } = req.body
  if (!event) return res.status(400).json({ error: 'Datos del evento requeridos' })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'API key de Anthropic no configurada' })

  const fmtARS = (n) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n || 0)
  const fmtDate = (str) => new Date(str).toLocaleDateString('es-AR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })

  const totalPaid = (payments || []).reduce((a, p) => a + p.amount, 0)
  const totalQuotes = (quotes || []).reduce((a, q) => {
    const items = (q.items || []).reduce((s, i) => s + i.quantity * i.unitPrice, 0)
    const catering = q.kind === 'Catering' ? (q.covers || 0) * (q.pricePerCover || 0) : 0
    return a + items + catering
  }, 0)
  const balance = totalQuotes - totalPaid

  const menuText = (menu || []).map(s =>
    `${s.nombre}: ${(s.items || []).map(i => i.dish?.name || i.name).join(', ')}`
  ).join('\n')

  const serviciosText = (quotes || []).map(q =>
    `- ${q.kind}: ${fmtARS(q.kind === 'Catering' ? (q.covers||0)*(q.pricePerCover||0) + (q.items||[]).reduce((a,i)=>a+i.quantity*i.unitPrice,0) : (q.items||[]).reduce((a,i)=>a+i.quantity*i.unitPrice,0))}`
  ).join('\n')

  const prompt = `Sos un coordinador de eventos de Haus, empresa de organización de eventos en Argentina. Generá un briefing profesional y conciso para compartir con el equipo de trabajo antes del evento.

DATOS DEL EVENTO:
- Nombre: ${event.name}
- Cliente: ${event.clientName || event.client?.name || 'N/A'}
- Fecha: ${fmtDate(event.date)}
- Hora: ${event.time || 'A confirmar'}
- Venue: ${event.venue}
- Tipo: ${event.type}
- Invitados: ${event.guests}
- Estado: ${event.status}

SERVICIOS CONTRATADOS:
${serviciosText || 'Sin cotizaciones aprobadas'}

MENÚ:
${menuText || 'Sin menú cargado'}

ESTADO FINANCIERO:
- Total cotizado: ${fmtARS(totalQuotes)}
- Cobrado: ${fmtARS(totalPaid)}
- Saldo pendiente: ${fmtARS(balance)}

Generá un briefing en español, claro y profesional, con secciones bien definidas. Incluí:
1. Un encabezado con los datos clave del evento
2. Resumen del menú y servicios
3. Estado financiero
4. Puntos de atención o recordatorios importantes para el equipo

Usá un tono profesional pero directo. Formato con emojis para facilitar la lectura rápida. El texto debe poder copiarse y enviarse por WhatsApp al equipo.`

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
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    const data = await response.json()
    if (!response.ok) return res.status(502).json({ error: data.error?.message || 'Error al consultar la IA' })

    const briefing = data.content?.map(b => b.text || '').join('') || ''
    res.json({ briefing })
  } catch (e) {
    res.status(502).json({ error: 'No se pudo generar el briefing' })
  }
})