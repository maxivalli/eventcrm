const prisma = require("../prisma");
const cloudinary = require("../cloudinary");

exports.getByEvent = async (req, res) => {
  try {
    const files = await prisma.eventFile.findMany({
      where: { eventId: Number(req.params.eventId) },
      orderBy: { createdAt: "desc" },
    });
    res.json(files);
  } catch (e) {
    console.error("Error getByEvent files:", e);
    res.status(500).json({ error: e.message });
  }
};

exports.upload = async (req, res) => {
  try {
    if (!req.file)
      return res.status(400).json({ error: "No se recibió ningún archivo" });

    const file = await prisma.eventFile.create({
      data: {
        name: req.file.originalname,
        url: req.file.path,
        publicId: req.file.filename,
        resourceType: "image",
        eventId: Number(req.body.eventId),
      },
    });
    res.status(201).json(file);
  } catch (e) {
    console.error("Error upload file:", e);
    res.status(500).json({ error: e.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const file = await prisma.eventFile.findUnique({ where: { id: Number(req.params.id) } })
    if (!file) return res.status(404).json({ error: 'Archivo no encontrado' })

    await cloudinary.uploader.destroy(file.publicId, { resource_type: 'image' })
    await prisma.eventFile.delete({ where: { id: Number(req.params.id) } })

    res.json({ success: true })
  } catch (e) {
    console.error('Error delete file:', e)
    res.status(500).json({ error: e.message })
  }
}

exports.proxy = async (req, res) => {
  try {
    const file = await prisma.eventFile.findUnique({ where: { id: Number(req.params.id) } })
    if (!file) return res.status(404).json({ error: 'Archivo no encontrado' })

    const signedUrl = cloudinary.url(file.publicId, {
      resource_type: 'image',
      type:          'upload',
      sign_url:      true,
      expires_at:    Math.floor(Date.now() / 1000) + 60 * 5, // 5 minutos
    })

    res.json({ url: signedUrl })
  } catch (e) {
    console.error('Error proxy file:', e)
    res.status(500).json({ error: e.message })
  }
}
