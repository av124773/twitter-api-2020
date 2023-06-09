const express = require('express')
const router = express.Router()
const passport = require('passport')

const userController = require('../../controllers/user-controller')
const { isUser, authenticatedUser } = require('../../middleware/auth')

router.post('/login', passport.authenticate('local', { session: false }), isUser, userController.signIn)

module.exports = router
