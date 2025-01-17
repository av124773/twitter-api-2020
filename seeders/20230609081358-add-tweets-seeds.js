'use strict'

const faker = require('faker')

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const users = await queryInterface.sequelize.query(
      // 先過濾掉role=admin, 只留下純users
      "SELECT id FROM Users WHERE role <> 'admin'",
      {
        type: queryInterface.sequelize.QueryTypes.SELECT
      }
    )
    const tweets = []
    const maxLength = 140
    for (let i = 0; i < users.length; i++) {
      const user = users[i]
      for (let j = 0; j < 10; j++) {
        let randomText = faker.lorem.text(140)
        if (randomText.length > maxLength) {
          randomText = randomText.substring(0, maxLength)
        }
        tweets.push({
          UserId: user.id,
          description: randomText, // ac: 推文限制在140字以內
          createdAt: new Date(),
          updatedAt: new Date()
        })
      }
    }
    await queryInterface.bulkInsert('Tweets', tweets)
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Tweets', {})
  }
}
