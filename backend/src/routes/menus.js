const router = require('express').Router()
const prisma  = require('../prisma')

const INCLUDE_FULL = {
  sections: {
    orderBy: { orden: 'asc' },
    include: {
      items: {
        include: { dish: { include: { ingredients: true } } },
        orderBy: { createdAt: 'asc' },
      }
    }
  }
}

// GET /api/menus — todos los menús
router.get('/', async (req, res) => {
  try {
    const menus = await prisma.menu.findMany({
      orderBy: { createdAt: 'desc' },
      include: INCLUDE_FULL,
    })
    res.json(menus)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// GET /api/menus/:id
router.get('/:id', async (req, res) => {
  try {
    const menu = await prisma.menu.findUnique({
      where: { id: Number(req.params.id) },
      include: INCLUDE_FULL,
    })
    if (!menu) return res.status(404).json({ error: 'Menú no encontrado' })
    res.json(menu)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// POST /api/menus — crear menú
router.post('/', async (req, res) => {
  try {
    const { name, description } = req.body
    if (!name?.trim()) return res.status(400).json({ error: 'El nombre es requerido' })
    const menu = await prisma.menu.create({
      data: { name: name.trim(), description: description?.trim() || null },
      include: INCLUDE_FULL,
    })
    res.status(201).json(menu)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// PUT /api/menus/:id — editar nombre/descripción
router.put('/:id', async (req, res) => {
  try {
    const { name, description } = req.body
    if (!name?.trim()) return res.status(400).json({ error: 'El nombre es requerido' })
    const menu = await prisma.menu.update({
      where: { id: Number(req.params.id) },
      data: { name: name.trim(), description: description?.trim() || null },
      include: INCLUDE_FULL,
    })
    res.json(menu)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// DELETE /api/menus/:id
router.delete('/:id', async (req, res) => {
  try {
    await prisma.menu.delete({ where: { id: Number(req.params.id) } })
    res.json({ success: true })
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ error: 'Menú no encontrado' })
    res.status(500).json({ error: e.message })
  }
})

// POST /api/menus/:id/sections — agregar sección
router.post('/:id/sections', async (req, res) => {
  try {
    const { nombre } = req.body
    if (!nombre?.trim()) return res.status(400).json({ error: 'El nombre de la sección es requerido' })
    const count = await prisma.menuSection.count({ where: { menuId: Number(req.params.id) } })
    const section = await prisma.menuSection.create({
      data: { menuId: Number(req.params.id), nombre: nombre.trim(), orden: count },
      include: { items: { include: { dish: { include: { ingredients: true } } } } }
    })
    res.status(201).json(section)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// DELETE /api/menus/sections/:sectionId
router.delete('/sections/:sectionId', async (req, res) => {
  try {
    await prisma.menuSection.delete({ where: { id: Number(req.params.sectionId) } })
    res.json({ success: true })
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ error: 'Sección no encontrada' })
    res.status(500).json({ error: e.message })
  }
})

// POST /api/menus/sections/:sectionId/items — agregar plato a sección
router.post('/sections/:sectionId/items', async (req, res) => {
  try {
    const { dishId, nota } = req.body
    if (!dishId) return res.status(400).json({ error: 'El plato es requerido' })
    const item = await prisma.menuSectionItem.create({
      data: { sectionId: Number(req.params.sectionId), dishId: Number(dishId), nota: nota?.trim() || null },
      include: { dish: { include: { ingredients: true } } }
    })
    res.status(201).json(item)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// DELETE /api/menus/items/:itemId
router.delete('/items/:itemId', async (req, res) => {
  try {
    await prisma.menuSectionItem.delete({ where: { id: Number(req.params.itemId) } })
    res.json({ success: true })
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ error: 'Item no encontrado' })
    res.status(500).json({ error: e.message })
  }
})

module.exports = router
