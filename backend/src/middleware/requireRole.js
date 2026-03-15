// requireRole(...allowedRoles) — usar después de authMiddleware
// Ejemplo: router.delete('/:id', requireRole('admin'), controller.remove)

module.exports = (...allowedRoles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'No autenticado' })
  if (!allowedRoles.includes(req.user.role))
    return res.status(403).json({ error: 'Sin permiso para realizar esta acción' })
  next()
}
