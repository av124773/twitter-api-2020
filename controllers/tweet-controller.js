const sequelize = require('sequelize')
const { Tweet, User, Reply, Like } = require('../models')
const helpers = require('../_helpers')

const tweetController = {
  getTweets: async (req, res, next) => {
    try {
      const ThisUserId = helpers.getUser(req).id
      const tweets = await Tweet.findAll({
        include: [
          { model: User, attributes: { exclude: ['password'] } },
          {
            model: Like,
            attributes: []
          }
        ],
        attributes: [
          'id',
          'UserId',
          'description',
          'createdAt',
          'updatedAt',
          [
            sequelize.literal(
              '(SELECT COUNT(*) FROM Likes WHERE Likes.TweetId = Tweet.id AND Likes.deletedAt IS NULL)'
            ),
            'likeCount'
          ],
          [
            sequelize.literal(
              '(SELECT COUNT(*) FROM Replies WHERE Replies.TweetId = Tweet.id)'
            ),
            'replyCount'
          ],
          [
            sequelize.literal(
              `(SELECT COUNT(*) FROM Likes WHERE Likes.TweetId = Tweet.id AND Likes.UserId = ${ThisUserId} AND Likes.deletedAt IS NULL) > 0`
            ),
            'isLiked'
          ]
        ],
        order: [['createdAt', 'DESC']]
      })
      const tweetsData = tweets.map(tweet => {
        return {
          ...tweet.toJSON(),
          isLiked: Boolean(tweet.dataValues.isLiked)
        }
      })
      res.json(tweetsData)
    } catch (err) {
      next(err)
    }
  },
  getTweet: async (req, res, next) => {
    try {
      const ThisUserId = helpers.getUser(req).id
      const tweetId = req.params.tweetId
      const tweet = await Tweet.findByPk(tweetId, {
        include: [
          { model: User, attributes: { exclude: ['password'] } },
          {
            model: Like,
            attributes: []
          }
        ],
        attributes: [
          'id',
          'UserId',
          'description',
          'createdAt',
          'updatedAt',
          [
            sequelize.literal(
              '(SELECT COUNT(*) FROM Likes WHERE Likes.TweetId = Tweet.id AND Likes.deletedAt IS NULL)'
            ),
            'likeCount'
          ],
          [
            sequelize.literal(
              '(SELECT COUNT(*) FROM Replies WHERE Replies.TweetId = Tweet.id)'
            ),
            'replyCount'
          ],
          [
            sequelize.literal(
              `(SELECT COUNT(*) FROM Likes WHERE Likes.TweetId = Tweet.id AND Likes.UserId = ${ThisUserId} AND Likes.deletedAt IS NULL) > 0`
            ),
            'isLiked'
          ]
        ]
      })
      const tweetData = tweet.toJSON()
      tweetData.isLiked = Boolean(tweetData.isLiked)
      res.json(tweetData)
    } catch (err) {
      next(err)
    }
  },
  getReplies: async (req, res, next) => {
    try {
      const tweetId = req.params.tweetId
      const replies = await Reply.findAll({
        where: { tweetId },
        include: [
          { model: User, attributes: { exclude: ['password'] } },
          { model: Tweet, include: [{ model: User, attributes: { exclude: ['password'] } }] }
        ],
        order: [['createdAt', 'DESC']]
      })
      res.json(replies)
    } catch (err) {
      next(err)
    }
  },
  postTweet: async (req, res, next) => {
    try {
      const { description } = req.body
      const getUser = helpers.getUser(req)
      const userId = getUser.id
      if (!description) throw new Error('Description text is required!')
      const user = await User.findByPk(userId)
      if (!user) throw new Error("User didn't exist!")
      const tweet = await Tweet.create({
        description,
        userId
      })
      res.json({
        status: 'success',
        data: tweet
      })
    } catch (err) {
      next(err)
    }
  },
  deleteTweet: async (req, res, next) => {
    try {
      const tweetId = req.params.tweetId
      const tweet = await Tweet.findByPk(tweetId)
      if (!tweet) throw new Error("Tweet didn't exist!")
      await tweet.destroy()
      res.json({
        status: 'success',
        message: 'Tweet deleted successfully'
      })
    } catch (err) {
      next(err)
    }
  },
  postReplies: async (req, res, next) => {
    try {
      const { comment } = req.body
      const tweetId = req.params.tweetId
      const getUser = helpers.getUser(req)
      const userId = getUser.id
      const tweet = await Tweet.findByPk(tweetId)
      if (!tweet) throw new Error("Tweet didn't exist!")
      const reply = await Reply.create({
        comment,
        userId,
        tweetId
      })
      res.json({
        status: 'success',
        data: reply
      })
    } catch (err) {
      next(err)
    }
  },
  postLike: async (req, res, next) => {
    try {
      const tweetId = req.params.tweetId
      const getUser = helpers.getUser(req)
      const userId = getUser.id
      const [tweet, like] = await Promise.all([
        Tweet.findByPk(tweetId),
        Like.findOne({
          where: {
            userId,
            tweetId
          }
        })
      ])
      if (!tweet) throw new Error("Tweet didn't exist!")
      if (like) throw new Error('You have liked this tweet!')
      const createdLike = await Like.create({
        userId,
        tweetId
      })
      res.json({
        status: 'success',
        data: createdLike
      })
    } catch (err) {
      next(err)
    }
  },
  postUnlike: async (req, res, next) => {
    try {
      const tweetId = req.params.tweetId
      const getUser = helpers.getUser(req)
      const userId = getUser.id
      const [tweet, like] = await Promise.all([
        Tweet.findByPk(tweetId),
        Like.findOne({
          where: {
            userId,
            tweetId
          }
        })
      ])
      if (!tweet) throw new Error("Tweet didn't exist!")
      if (!like) throw new Error("You haven't liked this tweet!")
      const unlike = await Like.destroy({
        where: {
          userId,
          tweetId
        }
      })
      res.json({
        status: 'success',
        data: unlike
      })
    } catch (err) {
      next(err)
    }
  }
}

module.exports = tweetController
