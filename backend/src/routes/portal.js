const { Router } = require("express");
const { randomUUID } = require("crypto");
const prisma = require("../prisma");

// Router protegido — genera el token
const protectedRouter = Router();
protectedRouter.post("/events/:id/portal-token", async (req, res) => {
  try {
    const event = await prisma.event.update({
      where: { id: Number(req.params.id) },
      data: { portalToken: randomUUID() },
      select: { portalToken: true },
    });
    res.json({ portalToken: event.portalToken });
  } catch (e) {
    if (e.code === "P2025")
      return res.status(404).json({ error: "Evento no encontrado" });
    res.status(500).json({ error: e.message });
  }
});

// Router público — devuelve datos del portal sin auth
const publicRouter = Router();
publicRouter.get("/portal/:token", async (req, res) => {
  try {
    const event = await prisma.event.findUnique({
      where: { portalToken: req.params.token },
      include: {
        client: { select: { name: true } },
        payments: {
          select: { amount: true, date: true, note: true },
          orderBy: { date: "asc" },
        },
        scheduleItems: {
          orderBy: [{ orden: 'asc' }, { hora: 'asc' }],
        },
        quotes: {
          include: {
            items: true,
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
          },
          orderBy: { date: 'asc' },
        },
      },
    });

    if (!event) return res.status(404).json({ error: "Portal no encontrado" });

    const schedule = event.scheduleItems || [];

    const totalPaid = event.payments.reduce((a, p) => a + p.amount, 0);
    const totalQuotes = event.quotes.reduce((a, q) => {
      const items = (q.items || []).reduce((s, i) => s + i.quantity * i.unitPrice, 0);
      const catering = q.kind === "Catering" ? (q.covers || 0) * (q.pricePerCover || 0) : 0;
      return a + items + catering;
    }, 0);
    const balance = totalQuotes - totalPaid;

    // Extraer secciones del menú de las quotes de catering aprobadas para mostrar en portal
    const menuSections = event.quotes
      .filter(q => q.kind === 'Catering' && q.clientStatus === 'Aprobado')
      .flatMap(q => q.menus || [])
      .flatMap(qm => qm.menu?.sections || [])

    const services = event.quotes.map((q) => {
      const itemsTotal = (q.items || []).reduce((s, i) => s + i.quantity * i.unitPrice, 0);
      const cateringTotal = q.kind === "Catering" ? (q.covers || 0) * (q.pricePerCover || 0) : 0;
      return {
        kind: q.kind,
        total: itemsTotal + cateringTotal,
        covers: q.covers || null,
        pricePerCover: q.pricePerCover || null,
        items: q.items || [],
      };
    });

    res.json({
      event: {
        id: event.id,
        name: event.name,
        date: event.date,
        time: event.time,
        venue: event.venue,
        type: event.type,
        status: event.status,
        guests: event.guests,
        clientName: event.client?.name,
        dietaryOptions: event.dietaryOptions ?? null,
        budgetPublished: event.budgetPublished ?? false,
      },
      payments: event.payments,
      menuSections,
      quotes: event.quotes,
      schedule,
      services,
      finance: { totalQuotes, totalPaid, balance },
    });
  } catch (e) {
    console.error("PORTAL ERROR:", e);
    res.status(500).json({ error: e.message });
  }
});

// PATCH /api/portal/:token/quotes/:quoteId/decision — cliente aprueba o rechaza
publicRouter.patch("/portal/:token/quotes/:quoteId/decision", async (req, res) => {
  try {
    const { clientStatus } = req.body
    if (!['Aprobado', 'Rechazado', null].includes(clientStatus))
      return res.status(400).json({ error: 'Estado inválido' })

    // Verificar que la quote pertenece al evento del token
    const event = await prisma.event.findUnique({
      where: { portalToken: req.params.token },
      select: { id: true, name: true, client: { select: { name: true } } }
    })
    if (!event) return res.status(404).json({ error: 'Portal no encontrado' })

    const quote = await prisma.quote.findUnique({
      where: { id: Number(req.params.quoteId) },
      select: { id: true, eventId: true, kind: true }
    })
    if (!quote || quote.eventId !== event.id)
      return res.status(404).json({ error: 'Cotización no encontrada' })

    const updated = await prisma.quote.update({
      where: { id: Number(req.params.quoteId) },
      data: {
        clientStatus: clientStatus || null,
        clientDecidedAt: clientStatus ? new Date() : null,
        // Si el cliente aprueba, también actualizamos el status interno
        ...(clientStatus === 'Aprobado' ? { status: 'Aprobado' } : {}),
        ...(clientStatus === 'Rechazado' ? { status: 'Rechazado' } : {}),
        ...(clientStatus === null ? { status: 'Pendiente' } : {}),
      }
    })

    // Log de actividad para notificar en el CRM
    const { log } = require('../utils/activity')
    const accion = clientStatus === 'Aprobado' ? 'aprobó' : clientStatus === 'Rechazado' ? 'rechazó' : 'revirtió'
    await log({
      action: 'client_decision',
      entity: 'quote',
      entityId: quote.id,
      label: `Cliente ${accion} una cotización`,
      detail: `${event.client?.name} · Evento: ${event.name} · Tipo: ${quote.kind}`,
      meta: JSON.stringify({ clientStatus, eventId: event.id })
    })

    res.json(updated)
  } catch (e) {
    console.error("PORTAL DECISION ERROR:", e)
    res.status(500).json({ error: e.message })
  }
})


// PATCH /api/events/:id/publish-budget
protectedRouter.patch("/events/:id/publish-budget", async (req, res) => {
  try {
    const { published } = req.body
    const event = await prisma.event.update({
      where: { id: Number(req.params.id) },
      data: { budgetPublished: Boolean(published) },
      select: { id: true, budgetPublished: true },
    })
    res.json(event)
  } catch (e) {
    if (e.code === "P2025") return res.status(404).json({ error: "Evento no encontrado" })
    res.status(500).json({ error: e.message })
  }
})

module.exports = { publicRouter, protectedRouter };

// handled above — module already exported