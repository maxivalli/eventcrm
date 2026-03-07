const multer                  = require('multer')
const { CloudinaryStorage }   = require('multer-storage-cloudinary')
const cloudinary              = require('./cloudinary')

const storage = new CloudinaryStorage({
  cloudinary,
  params: (req, file) => ({
    folder:        'eventcrm',
    resource_type: 'image',
    format:        undefined,
  }),
})

module.exports = multer({ storage })