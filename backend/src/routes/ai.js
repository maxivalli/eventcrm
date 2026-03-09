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

Respondé ÚNICAMENTE con un JSON válido, sin texto adicional, sin markdown, con este formato exacto:
[
  { "nombre": "nombre del ingrediente", "cantidad": número, "unidad": "g|kg|ml|l|unidad|porción|rebanada|cucharada", "categoria": "Carnes|Fiambres|Lácteos|Verduras|Frutas|Almacén|Bebidas|Panificados|Otros" }
]

Reglas:
- Solo devolvé el array JSON, nada más
- cantidad debe ser un número (no string)
- Usá unidades del listado exactamente como están escritas
- Usá categorías del listado exactamente como están escritas
- Cantidades realistas para eventos (ej: fiambre 80g/pers, papa 150g/pers)`

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

module.exports = router