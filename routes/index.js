const express = require('express')
const router = express.Router()
const passport = require('../config/passport')

const admin = require('./modules/admin')
const users = require('./modules/users')
const tweets = require('./modules/tweets')
const followships = require('./modules/followships')
const auth = require('./modules/auth')

const { apiErrorHandler } = require('../middleware/error-handler')

const adminController = require('../controllers/admin-controller')
const userController = require('../controllers/user-controller')

const { authenticated, isUser, isAdmin, authenticatedUser, authenticatedAdmin, signInAuth } = require('../middleware/auth')

router.post('/api/admin/signin', signInAuth, isAdmin, adminController.signIn)

router.post('/api/users/signin', signInAuth, isUser, userController.signIn)

router.post('/api/users', userController.signUp)

router.use('/api/admin', authenticated, authenticatedAdmin, admin)
router.use('/api/users', authenticated, authenticatedUser, users)
router.use('/api/tweets', authenticated, authenticatedUser, tweets)
router.use('/api/followships', authenticated, authenticatedUser, followships)
router.use('/api/auth', auth)

router.use('/', apiErrorHandler)
router.use('/', (req, res) => res.send('this is home page.')) // for testing

module.exports = router
