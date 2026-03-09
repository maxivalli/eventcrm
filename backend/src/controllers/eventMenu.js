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

    // Acumular ingredientes por nombre + unidad
    const map = {}
    for (const section of sections) {
      for (const item of section.items) {
        for (const ing of item.dish.ingredients) {
          const key = `${ing.nombre.toLowerCase()}__${ing.unidad}__${ing.categoria}`
          if (!map[key]) {
            map[key] = {
              nombre:    ing.nombre,
              unidad:    ing.unidad,
              categoria: ing.categoria,
              cantidadPorPersona: ing.cantidad,
              cantidadTotal: ing.cantidad * event.guests,
            }
          } else {
            map[key].cantidadPorPersona += ing.cantidad
            map[key].cantidadTotal      += ing.cantidad * event.guests
          }
        }
      }
    }

    // Agrupar por categoría
    const grouped = {}
    for (const item of Object.values(map)) {
      if (!grouped[item.categoria]) grouped[item.categoria] = []
      grouped[item.categoria].push(item)
    }

    // Ordenar ingredientes por nombre dentro de cada categoría
    for (const cat of Object.keys(grouped)) {
      grouped[cat].sort((a, b) => a.nombre.localeCompare(b.nombre))
    }

    // Convertir unidades grandes
    for (const items of Object.values(grouped)) {
      for (const item of items) {
        if (item.unidad === 'g' && item.cantidadTotal >= 1000) {
          item.cantidadTotal      = Math.round((item.cantidadTotal / 1000) * 100) / 100
          item.cantidadPorPersona = Math.round((item.cantidadPorPersona / 1000) * 100) / 100
          item.unidad = 'kg'
        } else if (item.unidad === 'ml' && item.cantidadTotal >= 1000) {
          item.cantidadTotal      = Math.round((item.cantidadTotal / 1000) * 100) / 100
          item.cantidadPorPersona = Math.round((item.cantidadPorPersona / 1000) * 100) / 100
          item.unidad = 'l'
        }
      }
    }

    res.json({ event: event.name, guests: event.guests, lista: grouped })
  } catch (e) {
    console.error('Error shoppingList:', e)
    res.status(500).json({ error: e.message })
  }
}