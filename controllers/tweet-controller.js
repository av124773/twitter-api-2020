const { Tweet, User } = require('../models')

const tweetController = {
  getTweets: (req, res, next) => {
    return Tweet.findAll({
      raw: true
    })
      .then(tweets => {
        res.json(tweets)
      })
      .catch(err => next(err))
  },
  getTweet: (req, res, next) => {
    const tweetId = req.params.tweetId
    return Tweet.findByPk(tweetId)
      .then(tweet => {
        console.log(tweet)
        res.json( tweet )
      })
      .catch(err => next(err))
  }
}

module.exports = tweetController
