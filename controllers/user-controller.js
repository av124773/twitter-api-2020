const jwt = require('jsonwebtoken')

const userController = {
  signIn: (req, res, next) => {
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
      if (req.body.password !== req.body.passwordCheck) throw new Error('Passwords do not match')

      const user = await User.findOne({
        where: {
          [Op.or]: [ //抓出email重複或account重複
            { email: email },
            { account: account }
          ]
        }
      })
      if (user?.email === email) throw new Error('Email has already been registered')
      if (user?.account === account) throw new Error('This account has already been registered')
      //create new user
      await User.create({
        email,
        password: bcrypt.hashSync(password),
        name,
        account,
        role: 'user',
        createAt: new Date(),
        updatedAt: new Date()
      })
      res.json({
        status: 'success', message: 'Account created successfully'
      })
    } catch (err) {
      next(err)
    }
  },
  getUserData: (req, res, next) => {
    return User.findByPk(req.params.id)
      .then(user => {
        if (!user) throw new Error('This user does not exist');
        res.json(user.toJSON());
      })
      .catch(err => {
        next(err);
      });
  },
  editUserData: async (req, res, next) => {
    // try {
    //   // check user權限(不能改別人的)
    //   const currentUserId = helpers.getUser(req).id
    //   if (currentUserId.toString() !== req.params.id) {
    //     throw new Error('cannot edit other users profile')
    //   }
    //   const { name, introduction, avatar } = req.body
    //   const { banner } = req.files // 圖片用multer存在req.files屬性中

    //   // AC測試規定: 自我介紹字數上限 160 字、暱稱上限 50 字
    //   if (name && name.length > 50) throw new Error('name length should < 50')
    //   if (introduction && introduction.length > 160) { throw new Error(' introduction length should < 160') }

    //   const user = await User.findByPk(req.params.id)
    //   if (!user) throw new Error('user does not exist')

    //   const avatarUrl = avatar ? await imgurFileHandler(avatar[0]) : null
    //   const bannerUrl = banner ? await imgurFileHandler(cover[0]) : null 

    //   await user.update({
    //     name: name || user.name,
    //     introduction: introduction || user.introduction,
    //     avatar: avatarUrl || user.avatar,
    //     cover: bannerUrl || user.cover
    //   })

    //   res.status(200).json({
    //     status: 'success',
    //     message: 'user profile edited successfully'
    //   })
    // } catch (err) {
    //   next(err)
    // }
  },
  getUserTweets: async (req, res, next) => {
  },
  getUserReplies: async (req, res, next) => {
  },
  getUserLikes: async (req, res, next) => {
  },
  getUserFollowings: async (req, res, next) => {
  },
  getUserFollowers: async (req, res, next) => {
  }
}

module.exports = userController
