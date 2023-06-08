const express = require('express')
const router = express.Router()

const admin = require('./modules/admin')
const users = require('./modules/users')
const tweets = require('./modules/tweets')
const followships = require('./modules/followships')

// router.get('/', (req, res) => {
//   res.send('this is the first sentence for this World!')
// })

router.use('/admin', admin)
router.use('/users', users)
router.use('/tweets', tweets)
router.use('/followships', followships)

router.use('/admin', admin)

module.exports = router