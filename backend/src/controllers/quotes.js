const prisma = require('../prisma')
const { log } = require('../utils/activity')

const fmt = (n) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)

const INCLUDE_FULL = {
  items: true,
  dishes: { include: { dish: { include: { ingredients: true } } } },
  menus: { include: { menu: { include: { sections: { orderBy: { orden: 'asc' }, include: { items: { include: { dish: true } } } } } } } },
  event: { select: { id: true, name: true, client: { select: { name: true } } } }
}

exports.getAll = async (req, res) => {
  try {
    const quotes = await prisma.quote.findMany({
      orderBy: { createdAt: 'desc' },
      include: INCLUDE_FULL,
    })
    res.json(quotes)
  } catch (e) { res.status(500).json({ error: e.message }) }
}

exports.getOne = async (req, res) => {
  try {
    const quote = await prisma.quote.findUnique({
      where: { id: Number(req.params.id) },
      include: INCLUDE_FULL,
    })
    if (!quote) return res.status(404).json({ error: 'Cotización no encontrada' })
    res.json(quote)
  } catch (e) { res.status(500).json({ error: e.message }) }
}

exports.create = async (req, res) => {
  try {
    const { eventId, kind = 'General', items, menuIds, date, status, covers, pricePerCover } = req.body
    if (!eventId) return res.status(400).json({ error: 'El evento es requerido' })

    if (kind === 'General') {
      if (!items || items.length === 0) return res.status(400).json({ error: 'Debe agregar al menos un ítem' })
      if (items.some(i => !i.description?.trim())) return res.status(400).json({ error: 'Todos los ítems deben tener descripción' })
      if (items.some(i => Number(i.quantity) <= 0)) return res.status(400).json({ error: 'La cantidad de cada ítem debe ser mayor a 0' })
      if (items.some(i => Number(i.unitPrice) < 0)) return res.status(400).json({ error: 'El precio unitario no puede ser negativo' })
    }
    if (kind === 'Catering') {
      if (!covers || Number(covers) <= 0) return res.status(400).json({ error: 'La cantidad de cubiertos es requerida' })
      if (!pricePerCover || Number(pricePerCover) <= 0) return res.status(400).json({ error: 'El precio por cubierto es requerido' })
      if (items && items.some(i => Number(i.unitPrice) < 0)) return res.status(400).json({ error: 'El precio unitario no puede ser negativo' })
    }

    const quote = await prisma.quote.create({
      data: {
        kind, status: status || 'Pendiente',
        date: date ? new Date(`${date.slice(0,10)}T12:00:00`) : new Date(),
        event: { connect: { id: Number(eventId) } },
        covers: kind === 'Catering' ? Number(covers) : null,
        pricePerCover: kind === 'Catering' ? Number(pricePerCover) : null,
        items: {
          create: (items || []).map(({ description, quantity, unitPrice }) => ({
            description: description.trim(), quantity: Number(quantity), unitPrice: Number(unitPrice)
          }))
        },
        menus: kind === 'Catering' && menuIds?.length ? {
          create: menuIds.map(id => ({ menu: { connect: { id: Number(id) } } }))
        } : undefined,
      },
      include: INCLUDE_FULL,
    })

    const total = kind === 'Catering'
      ? Number(covers) * Number(pricePerCover) + (items || []).reduce((a, i) => a + Number(i.quantity) * Number(i.unitPrice), 0)
      : (items || []).reduce((a, i) => a + Number(i.quantity) * Number(i.unitPrice), 0)

    const menuNames = (menuIds || []).length > 0 ? ` · ${menuIds.length} menú(s)` : ''
    log({ action: 'create', entity: 'quote', entityId: quote.id,
          label: `Cotización creada: ${quote.event?.name || '—'}`,
          detail: `${kind} · ${quote.event?.client?.name} · ${fmt(total)}${menuNames}` })

    res.status(201).json(quote)
  } catch (e) {
    console.error('Error al crear cotización:', e)
    if (e.code === 'P2025') return res.status(400).json({ error: 'El evento seleccionado no existe' })
    res.status(500).json({ error: e.message })
  }
}

exports.update = async (req, res) => {
  try {
    const { eventId, kind = 'General', items, menuIds, date, status, covers, pricePerCover } = req.body
    if (!eventId) return res.status(400).json({ error: 'El evento es requerido' })

    if (kind === 'General') {
      if (!items || items.length === 0) return res.status(400).json({ error: 'Debe agregar al menos un ítem' })
      if (items.some(i => !i.description?.trim())) return res.status(400).json({ error: 'Todos los ítems deben tener descripción' })
      if (items.some(i => Number(i.quantity) <= 0)) return res.status(400).json({ error: 'La cantidad de cada ítem debe ser mayor a 0' })
      if (items.some(i => Number(i.unitPrice) < 0)) return res.status(400).json({ error: 'El precio unitario no puede ser negativo' })
    }
    if (kind === 'Catering') {
      if (!covers || Number(covers) <= 0) return res.status(400).json({ error: 'La cantidad de cubiertos es requerida' })
      if (!pricePerCover || Number(pricePerCover) <= 0) return res.status(400).json({ error: 'El precio por cubierto es requerido' })
      if (items && items.some(i => Number(i.unitPrice) < 0)) return res.status(400).json({ error: 'El precio unitario no puede ser negativo' })
    }

    const id = Number(req.params.id)

    // Reemplazar items, dishes y menus
    await prisma.quoteItem.deleteMany({ where: { quoteId: id } })
    await prisma.quoteDish.deleteMany({ where: { quoteId: id } })
    await prisma.quoteMenu.deleteMany({ where: { quoteId: id } })

    const quote = await prisma.quote.update({
      where: { id },
      data: {
        kind, status: status || 'Pendiente',
        date: date ? new Date(`${date.slice(0,10)}T12:00:00`) : new Date(),
        event: { connect: { id: Number(eventId) } },
        covers: kind === 'Catering' ? Number(covers) : null,
        pricePerCover: kind === 'Catering' ? Number(pricePerCover) : null,
        items: {
          create: (items || []).map(({ description, quantity, unitPrice }) => ({
            description: description.trim(), quantity: Number(quantity), unitPrice: Number(unitPrice)
          }))
        },
        menus: kind === 'Catering' && menuIds?.length ? {
          create: menuIds.map(id => ({ menu: { connect: { id: Number(id) } } }))
        } : undefined,
      },
      include: INCLUDE_FULL,
    })

    log({ action: 'update', entity: 'quote', entityId: quote.id,
          label: `Cotización editada: ${quote.event?.name || '—'}`,
          detail: `${kind} · Estado: ${status}` })

    res.json(quote)
  } catch (e) {
    console.error('Error al actualizar cotización:', e)
    if (e.code === 'P2025') return res.status(404).json({ error: 'Cotización no encontrada' })
    res.status(500).json({ error: e.message })
  }
}

exports.patchStatus = async (req, res) => {
  try {
    const { status } = req.body
    if (!status) return res.status(400).json({ error: 'El estado es requerido' })
    const prev = await prisma.quote.findUnique({ where: { id: Number(req.params.id) }, include: { event: { select: { name: true } } } })
    const quote = await prisma.quote.update({ where: { id: Number(req.params.id) }, data: { status } })
    log({ action: 'status', entity: 'quote', entityId: quote.id,
          label: `Estado de cotización: ${prev?.event?.name || '—'}`,
          detail: `${prev?.status} → ${status}` })
    res.json(quote)
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ error: 'Cotización no encontrada' })
    res.status(500).json({ error: e.message })
  }
}

exports.remove = async (req, res) => {
  try {
    const id = Number(req.params.id)
    const quote = await prisma.quote.findUnique({ where: { id }, include: { event: { select: { name: true } } } })
    await prisma.quoteItem.deleteMany({ where: { quoteId: id } })
    await prisma.quoteDish.deleteMany({ where: { quoteId: id } })
    await prisma.quote.delete({ where: { id } })
    log({ action: 'delete', entity: 'quote', entityId: id, label: `Cotización eliminada: ${quote?.event?.name || id}` })
    res.json({ success: true })
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ error: 'Cotización no encontrada' })
    res.status(500).json({ error: e.message })
  }
}