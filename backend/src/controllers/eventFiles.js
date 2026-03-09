const prisma = require("../prisma");
const cloudinary = require("../cloudinary");
const { log } = require('../utils/activity')

exports.getByEvent = async (req, res) => {
  try {
    const files = await prisma.eventFile.findMany({ where: { eventId: Number(req.params.eventId) }, orderBy: { createdAt: "desc" } });
    res.json(files);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.upload = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No se recibió ningún archivo" });
    const eventId = Number(req.body.eventId)
    const event = await prisma.event.findUnique({ where: { id: eventId }, select: { name: true } })
    const file = await prisma.eventFile.create({
      data: { name: req.file.originalname, url: req.file.path, publicId: req.file.filename, resourceType: "image", eventId }
    });
    log({ action: 'file', entity: 'file', entityId: file.id,
          label: `Archivo subido: ${req.file.originalname}`,
          detail: `Evento: ${event?.name || '—'}` })
    res.status(201).json(file);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.remove = async (req, res) => {
  try {
    const file = await prisma.eventFile.findUnique({ where: { id: Number(req.params.id) }, include: { event: { select: { name: true } } } })
    if (!file) return res.status(404).json({ error: 'Archivo no encontrado' })
    await cloudinary.uploader.destroy(file.publicId, { resource_type: 'image' })
    await prisma.eventFile.delete({ where: { id: Number(req.params.id) } })
    log({ action: 'delete', entity: 'file', entityId: Number(req.params.id),
          label: `Archivo eliminado: ${file.name}`,
          detail: `Evento: ${file.event?.name || '—'}` })
    res.json({ success: true })
  } catch (e) { res.status(500).json({ error: e.message }) }
}

exports.proxy = async (req, res) => {
  try {
    const file = await prisma.eventFile.findUnique({ where: { id: Number(req.params.id) } })
    if (!file) return res.status(404).json({ error: 'Archivo no encontrado' })
    const signedUrl = cloudinary.url(file.publicId, { resource_type: 'image', type: 'upload', sign_url: true, expires_at: Math.floor(Date.now() / 1000) + 60 * 5 })
    res.json({ url: signedUrl })
  } catch (e) { res.status(500).json({ error: e.message }) }
}