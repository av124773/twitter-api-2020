const jwt = require('jsonwebtoken')
const helpers = require('../_helpers') 

const userController = {
  signIn: (req, res, next) => {
    try {
      const userData = req.user
      delete userData.password
      const token = jwt.sign(userData, process.env.JWT_SECRET, { expiresIn: '30d' })
      res.status(200).json({
        status: 'success',
        data: {
          token,
          user: userData
        }
      })
    } catch (err) {
      next(err)
    }
  }
}

module.exports = userController
