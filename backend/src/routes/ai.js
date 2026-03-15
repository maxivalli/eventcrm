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

  const startTime = time || '20:00'
  const [startHour] = startTime.split(':').map(Number)

  // Determinar si es evento nocturno (empieza >= 18hs) o diurno (empieza < 18hs)
  const isNocturno = startHour >= 18
  const prepHoras = isNocturno ? 4 : 3  // horas antes del inicio para la preparación

  // Calcular hora de inicio de preparación
  const prepStart = ((startHour - prepHoras) + 24) % 24
  const prepStartStr = String(prepStart).padStart(2, '0') + ':00'

  // Hora máxima de cierre según tipo de evento
  const cierreMax = isNocturno ? '05:00 del día siguiente' : '20:00 (máximo 8hs después del inicio)'

  const prompt = `Sos un coordinador de eventos profesional en Argentina con más de 10 años de experiencia organizando eventos sociales y corporativos.

Generá un cronograma detallado para el siguiente evento:
- Nombre: ${name || 'Sin nombre'}
- Tipo: ${type}
- Invitados: ${guests || 'No especificado'}
- Venue: ${venue || 'No especificado'}
- Fecha: ${date || 'No especificada'}
- Hora de inicio (apertura al público): ${startTime}

REGLAS DE HORARIOS — MUY IMPORTANTE:
1. La preparación del venue empieza a las ${prepStartStr} (${prepHoras} horas antes del inicio).
2. Los invitados llegan a las ${startTime}. Todos los ítems de Preparación van ANTES de esta hora.
3. ${isNocturno
    ? `Este es un evento NOCTURNO. Los horarios después de medianoche se escriben como 00:XX, 01:XX, 02:XX, 03:XX, 04:XX, 05:XX — NUNCA como 24:XX o 25:XX. El evento termina como máximo a las 05:00.`
    : `Este es un evento DIURNO. El evento termina como máximo a las 20:00 (no puede extenderse más de 8 horas desde el inicio).`
  }
4. Los ítems deben estar ordenados cronológicamente. Para ordenar correctamente cruzando medianoche, considerá que 00:XX, 01:XX, 02:XX, 03:XX, 04:XX, 05:XX son POSTERIORES a 23:XX.
5. NO inventes horarios fuera del rango ${prepStartStr} → ${cierreMax}.
6. La hora de inicio ${startTime} es inamovible — es cuando abren las puertas al público.

Incluí entre 12 y 18 ítems cubriendo: llegada del equipo, montaje, recepción de invitados, momentos gastronómicos, entretenimiento, momentos especiales según el tipo de evento, y cierre.
Adaptá el contenido al tipo de evento: ${type}.

Respondé ÚNICAMENTE con un JSON válido, sin texto adicional, sin markdown, con este formato exacto:
[
  {
    "hora": "HH:MM",
    "titulo": "Nombre corto del momento",
    "descripcion": "Descripción breve de lo que ocurre",
    "categoria": "Preparación|Recepción|Gastronomía|Entretenimiento|Protocolo|Cierre"
  }
]

Reglas finales:
- Solo devolvé el array JSON, nada más
- hora en formato HH:MM (24hs), valores válidos: 00–23 para horas, 00–59 para minutos
- Items ordenados cronológicamente (recordá que 00:XX es DESPUÉS de 23:XX)
- Categorías exactamente como están escritas
- Descripciones concretas y útiles para el equipo de coordinación`

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

// ── Alerta de inconsistencias ───────────────────────────────────────────────
router.post('/event-alerts', async (req, res) => {
  const { event, quotes, payments, spPayments, guests } = req.body
  if (!event) return res.status(400).json({ error: 'Datos del evento requeridos' })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'API key de Anthropic no configurada' })

  const fmtARS = (n) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n || 0)
  const fmtDate = (str) => str ? new Date(str).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' }) : 'Sin fecha'

  const today = new Date()
  const eventDate = event.date ? new Date(event.date) : null
  const daysUntil = eventDate ? Math.ceil((eventDate - today) / 86400000) : null

  const totalCotizado = (quotes || []).reduce((a, q) => {
    const items = (q.items || []).reduce((s, i) => s + i.quantity * i.unitPrice, 0)
    const catering = q.kind === 'Catering' ? (q.covers || 0) * (q.pricePerCover || 0) : 0
    return a + items + catering
  }, 0)
  const totalAprobado = (quotes || []).filter(q => q.status === 'Aprobado').reduce((a, q) => {
    const items = (q.items || []).reduce((s, i) => s + i.quantity * i.unitPrice, 0)
    const catering = q.kind === 'Catering' ? (q.covers || 0) * (q.pricePerCover || 0) : 0
    return a + items + catering
  }, 0)
  const totalCobrado = (payments || []).reduce((a, p) => a + Number(p.amount), 0)
  const saldoPendiente = totalAprobado - totalCobrado
  const totalProveedores = (spPayments || []).reduce((a, p) => a + Number(p.amount), 0)
  const cotizacionesPendientes = (quotes || []).filter(q => q.status === 'Pendiente').length
  const tieneCatering = (quotes || []).some(q => q.kind === 'Catering')
  const tieneCateringAprobado = (quotes || []).some(q => q.kind === 'Catering' && q.status === 'Aprobado')
  const margen = totalAprobado - totalProveedores

  const totalInvitados = (guests || []).length
  const invitadosMayores = (guests || []).filter(g => g.tipo === 'Mayor').length
  const invitadosMenores = (guests || []).filter(g => g.tipo === 'Menor').length
  const invitadosPagaron = (guests || []).filter(g => g.pagado).length
  const invitadosSinPagar = totalInvitados - invitadosPagaron

  const prompt = `Sos un coordinador de eventos senior de Haus, empresa de organización de eventos en Argentina. Analizá los datos de este evento y detectá inconsistencias, riesgos o alertas importantes.

DATOS DEL EVENTO:
- Nombre: ${event.name}
- Cliente: ${event.client?.name || 'N/A'}
- Estado: ${event.status}
- Fecha: ${fmtDate(event.date)}
- Días hasta el evento: ${daysUntil !== null ? daysUntil : 'desconocido'}
- Invitados: ${event.guests || 'No especificado'}
- Venue: ${event.venue || 'No especificado'}
- Tipo: ${event.type || 'No especificado'}

COTIZACIONES:
- Total cotizaciones: ${(quotes || []).length}
- Cotizaciones pendientes de aprobación: ${cotizacionesPendientes}
- Total cotizado: ${fmtARS(totalCotizado)}
- Total aprobado: ${fmtARS(totalAprobado)}
- Tiene catering: ${tieneCatering ? 'Sí' : 'No'}
- Catering aprobado: ${tieneCateringAprobado ? 'Sí' : 'No'}

FINANZAS:
- Total cobrado al cliente: ${fmtARS(totalCobrado)}
- Saldo pendiente del cliente: ${fmtARS(saldoPendiente)}
- Total comprometido con proveedores: ${fmtARS(totalProveedores)}
- Margen bruto estimado: ${fmtARS(margen)}

LISTA DE INVITADOS:
${totalInvitados === 0
  ? '- No hay invitados cargados en el sistema'
  : `- Total invitados cargados: ${totalInvitados} (${invitadosMayores} mayores, ${invitadosMenores} menores)
- Pagaron tarjeta: ${invitadosPagaron}
- Sin pagar tarjeta: ${invitadosSinPagar}`}
${event.guests ? `- Capacidad estimada del evento: ${event.guests} personas` : ''}

Detectá alertas reales y relevantes. No inventes problemas que no existen. Si el evento está en buen estado, devolvé pocas alertas o ninguna.

Ejemplos de alertas válidas:
- Evento confirmado pero sin catering aprobado (si tiene invitados)
- Saldo del cliente muy alto faltando pocos días
- Margen negativo (proveedores > ingresos aprobados)
- Evento en pocos días sin cotizaciones aprobadas
- Cotizaciones pendientes de aprobación que bloquean la producción
- Sin venue especificado para evento próximo
- Muchos invitados sin catering contratado
- Muchos invitados sin pagar tarjeta faltando pocos días para el evento
- La cantidad de invitados cargados supera la capacidad estimada del evento
- Evento próximo sin invitados cargados en el sistema

Respondé ÚNICAMENTE con JSON válido, sin texto adicional, sin markdown:
[
  { "nivel": "alto|medio|bajo", "categoria": "Finanzas|Producción|Cliente|Logística", "mensaje": "Descripción clara y concisa de la alerta (máximo 2 oraciones)" }
]

Si no hay alertas relevantes, devolvé un array vacío: []`

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 1000, messages: [{ role: 'user', content: prompt }] }),
    })
    const data = await response.json()
    if (!response.ok) return res.status(502).json({ error: data.error?.message || 'Error al consultar la IA' })
    const text = data.content?.map(b => b.text || '').join('') || ''
    const clean = text.replace(/```json|```/g, '').trim()
    const alerts = JSON.parse(clean)
    if (!Array.isArray(alerts)) throw new Error('Respuesta inválida')
    res.json({ alerts })
  } catch (e) {
    res.status(502).json({ error: 'No se pudo analizar el evento' })
  }
})

// ── Propuesta comercial narrativa ───────────────────────────────────────────
router.post('/proposal', async (req, res) => {
  const { event, quotes, payments } = req.body
  if (!event) return res.status(400).json({ error: 'Datos del evento requeridos' })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'API key de Anthropic no configurada' })

  const fmtARS = (n) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n || 0)
  const fmtDate = (str) => str ? new Date(str).toLocaleDateString('es-AR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }) : 'A confirmar'

  const serviciosText = (quotes || []).map(q => {
    const items = (q.items || []).reduce((a, i) => a + i.quantity * i.unitPrice, 0)
    const catering = q.kind === 'Catering' ? (q.covers || 0) * (q.pricePerCover || 0) : 0
    const total = items + catering
    const detalle = q.kind === 'Catering'
      ? `${q.covers} cubiertos a ${fmtARS(q.pricePerCover)} c/u${items > 0 ? ` + extras (${fmtARS(items)})` : ''}`
      : (q.items || []).map(i => `${i.description} (x${i.quantity})`).join(', ')
    return `- ${q.kind}: ${fmtARS(total)}${detalle ? ` — ${detalle}` : ''}`
  }).join('\n')

  const totalAprobado = (quotes || []).filter(q => q.status === 'Aprobado').reduce((a, q) => {
    return a + (q.items || []).reduce((s, i) => s + i.quantity * i.unitPrice, 0) + (q.kind === 'Catering' ? (q.covers || 0) * (q.pricePerCover || 0) : 0)
  }, 0)
  const totalCobrado = (payments || []).reduce((a, p) => a + Number(p.amount), 0)
  const saldoPendiente = totalAprobado - totalCobrado

  const prompt = `Sos un asesor comercial de Haus, empresa de organización y producción de eventos sociales en Buenos Aires, Argentina. Redactá una propuesta comercial narrativa y profesional para el siguiente evento.

DATOS DEL EVENTO:
- Evento: ${event.name}
- Cliente: ${event.client?.name || 'Cliente'}
- Tipo de evento: ${event.type || 'Social'}
- Fecha: ${fmtDate(event.date)}
- Hora: ${event.time || 'A confirmar'}
- Lugar: ${event.venue || 'A confirmar'}
- Invitados: ${event.guests || 'A confirmar'}

SERVICIOS Y PRECIOS:
${serviciosText || 'Sin servicios cotizados aún'}

RESUMEN FINANCIERO:
- Total de la propuesta: ${fmtARS(totalAprobado)}
- Señal abonada: ${fmtARS(totalCobrado)}
- Saldo pendiente: ${fmtARS(saldoPendiente)}

Redactá una propuesta en español, tono cálido y profesional, en formato de carta. Incluí:
1. Encabezado con fecha actual y datos del cliente
2. Párrafo de introducción presentando a Haus y la propuesta
3. Descripción de los servicios incluidos (narrativa, no solo lista de precios)
4. Condiciones de pago y próximos pasos
5. Cierre cordial con firma de Haus

Usá un lenguaje elegante, apropiado para eventos sociales de alta gama. NO uses emojis. El texto debe ser apto para enviar por email o imprimir.`

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 2000, messages: [{ role: 'user', content: prompt }] }),
    })
    const data = await response.json()
    if (!response.ok) return res.status(502).json({ error: data.error?.message || 'Error al consultar la IA' })
    const proposal = data.content?.map(b => b.text || '').join('') || ''
    res.json({ proposal })
  } catch (e) {
    res.status(502).json({ error: 'No se pudo generar la propuesta' })
  }
})