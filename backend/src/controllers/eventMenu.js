const prisma = require('../prisma')

// Obtener menú completo de un evento (secciones + platos + ingredientes)
exports.getByEvent = async (req, res) => {
  try {
    const sections = await prisma.eventMenuSection.findMany({
      where: { eventId: Number(req.params.eventId) },
      orderBy: { orden: 'asc' },
      include: {
        items: {
          include: { dish: { include: { ingredients: true } } },
          orderBy: { createdAt: 'asc' },
        }
      }
    })
    res.json(sections)
  } catch (e) {
    console.error('Error getByEvent menu:', e)
    res.status(500).json({ error: e.message })
  }
}

// Crear sección
exports.createSection = async (req, res) => {
  try {
    const { eventId, nombre } = req.body
    if (!eventId) return res.status(400).json({ error: 'El evento es requerido' })
    if (!nombre?.trim()) return res.status(400).json({ error: 'El nombre de la sección es requerido' })

    const count = await prisma.eventMenuSection.count({ where: { eventId: Number(eventId) } })
    const section = await prisma.eventMenuSection.create({
      data: {
        eventId: Number(eventId),
        nombre: nombre.trim(),
        orden: count,
      },
      include: { items: { include: { dish: { include: { ingredients: true } } } } }
    })
    res.status(201).json(section)
  } catch (e) {
    console.error('Error createSection:', e)
    res.status(500).json({ error: e.message })
  }
}

// Eliminar sección (cascade elimina sus items)
exports.removeSection = async (req, res) => {
  try {
    await prisma.eventMenuSection.delete({ where: { id: Number(req.params.id) } })
    res.json({ success: true })
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ error: 'Sección no encontrada' })
    res.status(500).json({ error: e.message })
  }
}

// Agregar plato a sección
exports.addItem = async (req, res) => {
  try {
    const { sectionId, dishId, nota } = req.body
    if (!sectionId) return res.status(400).json({ error: 'La sección es requerida' })
    if (!dishId)    return res.status(400).json({ error: 'El plato es requerido' })

    const item = await prisma.eventMenuItem.create({
      data: {
        sectionId: Number(sectionId),
        dishId:    Number(dishId),
        nota:      nota?.trim() || null,
      },
      include: { dish: { include: { ingredients: true } } }
    })
    res.status(201).json(item)
  } catch (e) {
    console.error('Error addItem:', e)
    res.status(500).json({ error: e.message })
  }
}

// Eliminar plato de sección
exports.removeItem = async (req, res) => {
  try {
    await prisma.eventMenuItem.delete({ where: { id: Number(req.params.id) } })
    res.json({ success: true })
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ error: 'Item no encontrado' })
    res.status(500).json({ error: e.message })
  }
}

// ─── Conversión a unidad base ─────────────────────────────────────────────────
// Convierte cualquier cantidad a su unidad base (g para sólidos, ml para líquidos)
// Retorna { cantidad, unidad } en la unidad base, o null si no es convertible.
const CUCHARADA_G  = 10  // aproximación genérica: 1 cucharada ≈ 10g
const CUCHARADA_ML = 15  // 1 cucharada ≈ 15ml (para líquidos los usuarios suelen usar ml)

function toBase(cantidad, unidad) {
  switch (unidad) {
    case 'g':        return { cantidad, unidad: 'g' }
    case 'kg':       return { cantidad: cantidad * 1000, unidad: 'g' }
    case 'ml':       return { cantidad, unidad: 'ml' }
    case 'l':        return { cantidad: cantidad * 1000, unidad: 'ml' }
    case 'cucharada': return { cantidad: cantidad * CUCHARADA_G, unidad: 'g' }
    // unidad, porción, rebanada — no son convertibles entre sí, se mantienen
    default:         return { cantidad, unidad }
  }
}

// Elige la unidad de display más legible para la cantidad acumulada
function toDisplay(cantidad, unidad) {
  if (unidad === 'g' && cantidad >= 1000)
    return { cantidad: Math.round((cantidad / 1000) * 100) / 100, unidad: 'kg' }
  if (unidad === 'ml' && cantidad >= 1000)
    return { cantidad: Math.round((cantidad / 1000) * 100) / 100, unidad: 'l' }
  return { cantidad: Math.round(cantidad * 100) / 100, unidad }
}

// Generar lista de compras agrupada por categoría de ingrediente
exports.shoppingList = async (req, res) => {
  try {
    const event = await prisma.event.findUnique({
      where: { id: Number(req.params.eventId) },
      select: { guests: true, name: true }
    })
    if (!event) return res.status(404).json({ error: 'Evento no encontrado' })

    const sections = await prisma.eventMenuSection.findMany({
      where: { eventId: Number(req.params.eventId) },
      include: {
        items: { include: { dish: { include: { ingredients: true } } } }
      }
    })

    // Acumular ingredientes por (nombre normalizado + categoría + unidad BASE)
    // Así sal en gramos y sal en cucharadas se suman bajo la misma clave 'g'
    const map = {}

    for (const section of sections) {
      for (const item of section.items) {
        for (const ing of item.dish.ingredients) {
          const base = toBase(ing.cantidad, ing.unidad)
          const key  = `${ing.nombre.trim().toLowerCase()}__${ing.categoria}__${base.unidad}`

          if (!map[key]) {
            map[key] = {
              nombre:             ing.nombre,
              unidad:             base.unidad,
              categoria:          ing.categoria,
              cantidadPorPersona: base.cantidad,
              cantidadTotal:      base.cantidad * event.guests,
            }
          } else {
            map[key].cantidadPorPersona += base.cantidad
            map[key].cantidadTotal      += base.cantidad * event.guests
          }
        }
      }
    }

    // Convertir a unidad de display legible y agrupar por categoría
    const grouped = {}
    for (const entry of Object.values(map)) {
      const display    = toDisplay(entry.cantidadTotal, entry.unidad)
      const displayPP  = toDisplay(entry.cantidadPorPersona, entry.unidad)

      const item = {
        nombre:             entry.nombre,
        unidad:             display.unidad,
        categoria:          entry.categoria,
        cantidadTotal:      display.cantidad,
        cantidadPorPersona: displayPP.cantidad,
      }

      if (!grouped[entry.categoria]) grouped[entry.categoria] = []
      grouped[entry.categoria].push(item)
    }

    // Ordenar ingredientes por nombre dentro de cada categoría
    for (const cat of Object.keys(grouped)) {
      grouped[cat].sort((a, b) => a.nombre.localeCompare(b.nombre))
    }

    res.json({ event: event.name, guests: event.guests, lista: grouped })
  } catch (e) {
    console.error('Error shoppingList:', e)
    res.status(500).json({ error: e.message })
  }
}