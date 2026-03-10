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
  console.log("PORTAL HIT", req.params.token);
  try {
    const event = await prisma.event.findUnique({
      where: { portalToken: req.params.token },
      include: {
        client: { select: { name: true } },
        payments: {
          select: { amount: true, date: true, note: true },
          orderBy: { date: "asc" },
        },
        quotes: {
          where: { status: "Aprobado" },
          include: { items: true },
        },
        menuSections: {
          orderBy: { orden: "asc" },
          include: {
            items: {
              include: { dish: { select: { name: true, descripcion: true } } },
            },
          },
        },
      },
    });

    if (!event) return res.status(404).json({ error: "Portal no encontrado" });

    const schedule = [];

    const totalPaid = event.payments.reduce((a, p) => a + p.amount, 0);
    const totalQuotes = event.quotes.reduce((a, q) => {
      const items = (q.items || []).reduce(
        (s, i) => s + i.quantity * i.unitPrice,
        0,
      );
      const catering =
        q.kind === "Catering" ? (q.covers || 0) * (q.pricePerCover || 0) : 0;
      return a + items + catering;
    }, 0);
    const balance = totalQuotes - totalPaid;

    const services = event.quotes.map((q) => {
      const itemsTotal = (q.items || []).reduce(
        (s, i) => s + i.quantity * i.unitPrice,
        0,
      );
      const cateringTotal =
        q.kind === "Catering" ? (q.covers || 0) * (q.pricePerCover || 0) : 0;
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
        name: event.name,
        date: event.date,
        time: event.time,
        venue: event.venue,
        type: event.type,
        status: event.status,
        guests: event.guests,
        clientName: event.client?.name,
        dietaryOptions: event.dietaryOptions ?? null,
      },
      payments: event.payments,
      menuSections: event.menuSections,
      schedule,
      services,
      finance: { totalQuotes, totalPaid, balance },
    });
  } catch (e) {
    console.error("PORTAL ERROR:", e);
    res.status(500).json({ error: e.message });
  }
});

module.exports = { publicRouter, protectedRouter };