const express = require('express')
const router = express.Router()
const passport = require('../../config/passport')

const userController = require('../../controllers/user-controller')

const { isUser, authenticatedUser } = require('../../middleware/auth')

router.get('/:id', userController.getUserData)
router.put('/:id', userController.editUserData)
router.get('/:userId/tweets', userController.getUserTweets)
router.get('/:userId/replied_tweets', userController.getUserReplies)
router.get('/:userId/likes', userController.getUserLikes)
router.get('/:userId/followings', userController.getUserFollowings)
router.get('/:userId/followers', userController.getUserFollowers)

module.exports = router
