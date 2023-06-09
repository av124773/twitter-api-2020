const express = require('express')
const passport = require('../../config/passport')
const router = express.Router()

const adminController = require('../../controllers/admin-controller')
const { isAdmin, authenticatedAdmin } = require('../../middleware/auth')

router.post('/login', passport.authenticate('local', { session: false }), isAdmin, adminController.signIn)

module.exports = router
