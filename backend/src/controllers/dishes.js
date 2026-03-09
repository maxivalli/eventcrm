const prisma = require('../prisma')

exports.getAll = async (req, res) => {
  try {
    const dishes = await prisma.dish.findMany({
      include: { ingredients: true },
      orderBy: { seccion: 'asc' },
    })
    res.json(dishes)
  } catch (e) {
    console.error('Error getAll dishes:', e)
    res.status(500).json({ error: e.message })
  }
}

exports.getOne = async (req, res) => {
  try {
    const dish = await prisma.dish.findUnique({
      where: { id: Number(req.params.id) },
      include: { ingredients: true },
    })
    if (!dish) return res.status(404).json({ error: 'Plato no encontrado' })
    res.json(dish)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}

exports.create = async (req, res) => {
  try {
    const { name, seccion, descripcion, ingredients } = req.body
    if (!name?.trim())   return res.status(400).json({ error: 'El nombre es requerido' })
    if (!seccion?.trim()) return res.status(400).json({ error: 'La sección es requerida' })

    const dish = await prisma.dish.create({
      data: {
        name: name.trim(),
        seccion: seccion.trim(),
        descripcion: descripcion?.trim() || null,
        ingredients: {
          create: (ingredients || []).map(i => ({
            nombre:   i.nombre.trim(),
            cantidad: Number(i.cantidad),
            unidad:   i.unidad || 'g',
            categoria: i.categoria || 'Otros',
          }))
        }
      },
      include: { ingredients: true },
    })
    res.status(201).json(dish)
  } catch (e) {
    console.error('Error create dish:', e)
    res.status(500).json({ error: e.message })
  }
}

exports.update = async (req, res) => {
  try {
    const { name, seccion, descripcion, ingredients } = req.body
    if (!name?.trim())    return res.status(400).json({ error: 'El nombre es requerido' })
    if (!seccion?.trim()) return res.status(400).json({ error: 'La sección es requerida' })

    // Reemplazar ingredientes
    await prisma.dishIngredient.deleteMany({ where: { dishId: Number(req.params.id) } })

    const dish = await prisma.dish.update({
      where: { id: Number(req.params.id) },
      data: {
        name: name.trim(),
        seccion: seccion.trim(),
        descripcion: descripcion?.trim() || null,
        ingredients: {
          create: (ingredients || []).map(i => ({
            nombre:   i.nombre.trim(),
            cantidad: Number(i.cantidad),
            unidad:   i.unidad || 'g',
            categoria: i.categoria || 'Otros',
          }))
        }
      },
      include: { ingredients: true },
    })
    res.json(dish)
  } catch (e) {
    console.error('Error update dish:', e)
    if (e.code === 'P2025') return res.status(404).json({ error: 'Plato no encontrado' })
    res.status(500).json({ error: e.message })
  }
}

exports.remove = async (req, res) => {
  try {
    await prisma.dish.delete({ where: { id: Number(req.params.id) } })
    res.json({ success: true })
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ error: 'Plato no encontrado' })
    res.status(500).json({ error: e.message })
  }
}
