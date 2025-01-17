const sequelize = require('sequelize')
const jwt = require('jsonwebtoken')
const { imgurFileHandler } = require('../helpers/file-helpers')
const imgur = require('imgur')
imgur.setAPIUrl('https://api.imgur.com/3/') //
const bcrypt = require('bcryptjs')
const { User, Tweet, Reply, Like, Followship } = require('../models')
const helpers = require('../_helpers')
const { Op } = require('sequelize')

const userController = {
  signIn: async (req, res, next) => {
    try {
      const userData = req.user
      delete userData.password
      const token = jwt.sign(userData, process.env.JWT_SECRET, { expiresIn: '30d' })
      res.json({
        status: 'success',
        data: {
          token,
          user: userData
        }
      })
    } catch (err) {
      next(err)
    }
  },
  signUp: async (req, res, next) => {
    try {
      const { account, name, email, password, checkPassword } = req.body
      if (!account || !name || !email || !password || !checkPassword) throw new Error('Information not complete')
      if (password !== checkPassword) throw new Error('Passwords do not match')

      const user = await User.findOne({
        where: {
          [Op.or]: [ // 抓出email重複或account重複
            { email: email },
            { account: account }
          ]
        }
      })
      if (user?.email === email) throw new Error('Email has already been registered')
      if (user?.account === account) throw new Error('This account has already been registered')
      // create new user
      await User.create({
        email,
        password: bcrypt.hashSync(password),
        name,
        account,
        role: 'user',
        createAt: new Date(),
        updatedAt: new Date()
      })
      res.status(200).json({
        status: 'success',
        message: 'Account created successfully'
      })
    } catch (err) {
      next(err)
    }
  },
  getUserData: async (req, res, next) => {
    try {
      const user = await User.findByPk(req.params.id)
      if (!user) throw new Error('This user does not exist')

      const userData = {
        ...user.toJSON()
      }
      res.status(200).json(userData)
    } catch (err) {
      next(err)
    }
  },
  getUserDataByAccount: async (req, res, next) => {
    try {
      const user = await User.findOne({
        where: { account: req.params.account },
        attributes: [
          'id',
          'email',
          'name',
          'avatar',
          'introduction',
          'account',
          'banner',
          [
            sequelize.literal(
              '(SELECT COUNT(*) FROM Tweets WHERE Tweets.UserId = User.id)'
            ),
            'tweetCount'
          ],
          [
            sequelize.literal(
              '(SELECT COUNT(*) FROM Followships WHERE Followships.followerId = User.id)'
            ),
            'FollowingsCount'
          ],
          [
            sequelize.literal(
              '(SELECT COUNT(*) FROM Followships WHERE Followships.followingId = User.id)'
            ),
            'FollowersCount'
          ],
          [
            sequelize.literal(
              `(SELECT COUNT(*) FROM Followships WHERE Followships.followerId = ${helpers.getUser(req).id} AND Followships.followingId = User.id ) > 0`
            ),
            'isFollowed'
          ]
        ]
      })
      if (!user) throw new Error('This user does not exist')

      const isCurrentUserFollowed = user.getDataValue('isFollowed') === 1
      const userData = {
        ...user.toJSON(),
        isCurrentUserFollowed
      }
      res.status(200).json(userData)
    } catch (err) {
      next(err)
    }
  },
  editUserData: async (req, res, next) => {
    try {
      // check user權限(不能改別人的)
      const currentUserId = helpers.getUser(req).id
      if (currentUserId.toString() !== req.params.id) {
        throw new Error('Cannot edit other users profile')
      }
      const { account, name, email, password, introduction } = req.body
      // const { banner } = req.files || {} // 圖片存在req.files屬性中&確保非空值
      const files = req.files || ''

      // AC測試規定: 自我介紹字數上限 160 字、暱稱上限 50 字
      if (name && name.length > 50) throw new Error('name length should <= 50')
      if (introduction && introduction.length > 160) { throw new Error(' introduction length should <= 160') }

      const user = await User.findByPk(req.params.id)
      if (!user) {
        throw new Error('user does not exist')
      }

      if (account) {
        const checkAccount = await User.findOne({ where: { account: account } })
        if (checkAccount && account !== user.account) {
          throw new Error('Account already exist!')
        }
      }
      if (email) {
        const checkEmail = await User.findOne({ where: { email: email } })
        if (checkEmail && email !== user.email) {
          throw new Error('Email already exist!')
        }
      }

      let avatarUrl = ''
      let bannerUrl = ''

      if (files.avatar && files.avatar[0].fieldname === 'avatar') {
        avatarUrl = await imgurFileHandler(files.avatar[0])
      }
      if (files.banner && files.banner[0].fieldname === 'banner') {
        bannerUrl = await imgurFileHandler(files.banner[0])
      }

      await user.update({
        name: name || user.name,
        account: account || user.account,
        email: email || user.email,
        avatar: avatarUrl || user.avatar,
        password: password ? await bcrypt.hash(password, 10) : user.password,
        introduction: introduction || user.introduction,
        banner: bannerUrl || user.banner
      })
      res.status(200).json({
        status: 'success',
        message: 'user info edited successfully'
      })
    } catch (err) {
      next(err)
    }
  },
  getUserTweets: async (req, res, next) => {
    try {
      const ThisUserId = req.params.userId
      const tweets = await Tweet.findAll({
        where: { userId: ThisUserId },
        include: [
          { model: User, attributes: { exclude: ['password'] } },
          { model: Reply },
          { model: Like },
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
              `(SELECT COUNT(*) FROM Likes WHERE Likes.TweetId = Tweet.id AND Likes.UserId = ${helpers.getUser(req).id} AND Likes.deletedAt IS NULL) > 0`
            ),
            'isLiked'
          ],
          [
            sequelize.literal(
              '(SELECT COUNT(*) FROM Replies WHERE Replies.TweetId = Tweet.id)'
            ),
            'replyCount'
          ],
          [
            sequelize.literal(
              '(SELECT COUNT(*) FROM Likes WHERE Likes.TweetId = Tweet.id AND Likes.deletedAt IS NULL)'
            ),
            'likeCount'
          ]
        ],
        order: [['createdAt', 'DESC']]
      })
      const tweetsData = tweets.map(tweet => ({
        ...tweet.toJSON(),
        isLiked: Boolean(tweet.dataValues.isLiked)
      }))
      res.json(tweetsData)
    } catch (err) {
      next(err)
    }
  },
  getUserReplies: async (req, res, next) => {
    try {
      const userId = req.params.userId
      const replies = await Reply.findAll({
        where: { UserId: userId },
        include: [
          { model: User, attributes: { exclude: ['password'] } },
          {
            model: Tweet,
            include: [{ model: User, attributes: ['account'] }]
          }
        ],
        order: [['createdAt', 'DESC']],
        nest: true
      })

      const userRepliesData = replies.map(reply => reply.toJSON())
      res.status(200).json(userRepliesData)
    } catch (err) {
      next(err)
    }
  },
  getUserLikes: async (req, res, next) => {
    try {
      const userId = req.params.userId
      const ThisUserId = helpers.getUser(req).id
      const likes = await Like.findAll({
        where: { UserId: userId },
        order: [['createdAt', 'DESC']],
        include: [
          {
            model: Tweet,
            include: [
              {
                model: User, // 這裡指該則tweet發文的user
                attributes: ['id', 'account', 'name', 'avatar', 'banner']
              }],
            attributes: {
              include: [
                [
                  sequelize.literal(
                    '(SELECT COUNT(*) FROM Replies WHERE TweetId = Tweet.id)'
                  ),
                  'repliesCount'
                ],
                [
                  sequelize.literal(
                    '(SELECT COUNT(*) FROM Likes WHERE TweetId = Tweet.id)'
                  ),
                  'likesCount'
                ]
              ]
            }
          }]
      })
      // 從like model中篩出目前登入的使用者有按like的tweet
      const thisUserLikeTweets = await Like.findAll({
        attributes: ['TweetId'],
        where: [
          { UserId: ThisUserId }
        ],
        raw: true
      })
      // 遍歷每一則目前使用者按過like的tweet
      const thisUserLikeTweetsId = thisUserLikeTweets.map(tweet => tweet.TweetId)
      // 回傳前新增屬性：判斷目前使用者是否此like物件按過like
      const likesData = likes.map(like => ({
        ...like.toJSON(),
        isCurrentUserLiked: thisUserLikeTweetsId.some(id => id === like.Tweet.id)
      }))
      res.status(200).json(likesData)
    } catch (err) {
      next(err)
    }
  },
  getUserFollowings: async (req, res, next) => {
    try {
      const userId = req.params.userId
      const user = await User.findByPk(userId, {
        attributes: { exclude: ['password'] }
      })
      if (!user) throw new Error('User does not exist')

      const followings = await Followship.findAll({
        where: { followerId: userId },
        include: [
          {
            model: User,
            as: 'Following',
            attributes: { exclude: ['password'] }
          }
        ],
        order: [['createdAt', 'DESC']],
        attributes: [
          'followerId',
          'followingId',
          'createdAt',
          'updatedAt',
          [
            sequelize.literal(
              `(SELECT COUNT(*) FROM Followships WHERE Followships.followerId = ${helpers.getUser(req).id} AND Followships.followingId = Following.id ) > 0`
            ),
            'isFollowed'
          ]
        ]
      })

      const userFollowingsData = followings.map(following => {
        const isCurrentUserFollowed = following.getDataValue('isFollowed') === 1
        return {
          ...following.toJSON(),
          isCurrentUserFollowed
        }
      })
      res.status(200).json(userFollowingsData)
    } catch (err) {
      next(err)
    }
  },
  getUserFollowers: async (req, res, next) => {
    try {
      const userId = req.params.userId
      const user = await User.findByPk(userId, {
        attributes: { exclude: ['password'] }
      })
      if (!user) throw new Error('User does not exist')

      const followers = await Followship.findAll({
        where: { followingId: userId },
        include: [
          {
            model: User,
            as: 'Follower',
            attributes: { exclude: ['password'] }
          }
        ],
        order: [['createdAt', 'DESC']],
        attributes: [
          'followerId',
          'followingId',
          'createdAt',
          'updatedAt',
          [
            sequelize.literal(
              `(SELECT COUNT(*) FROM Followships WHERE Followships.followerId = ${helpers.getUser(req).id} AND Followships.followingId = Follower.id ) > 0`
            ),
            'isFollowed'
          ]
        ]
      })

      const userFollowersData = followers.map(follower => {
        const isCurrentUserFollowed = follower.getDataValue('isFollowed') === 1
        return {
          ...follower.toJSON(),
          isCurrentUserFollowed
        }
      })
      res.status(200).json(userFollowersData)
    } catch (err) {
      next(err)
    }
  }
}

module.exports = userController
