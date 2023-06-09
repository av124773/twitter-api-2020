const express = require('express')
const router = express.Router()
const passport = require('passport')

const admin = require('./modules/admin')
const users = require('./modules/users')
const tweets = require('./modules/tweets')
const followships = require('./modules/followships')

const { authenticated, isUser, isAdmin, authenticatedUser, authenticatedAdmin } = require('../middleware/auth')

router.use('/api/admin', authenticated, authenticatedAdmin, admin)
router.use('/api/users', authenticated, authenticatedUser, users)
router.use('/api/tweets', tweets)
router.use('/api/followships', followships)

router.use('/', (req, res) => res.send('this is home page.')) // for testing

module.exports = router
