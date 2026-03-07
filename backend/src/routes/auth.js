const router         = require('express').Router()
const controller     = require('../controllers/auth')
const authMiddleware = require('../middleware/auth')

router.post('/login', controller.login)
router.get('/me',     authMiddleware, controller.me)

module.exports = router
