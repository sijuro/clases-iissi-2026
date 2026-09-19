module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add seed commands here.
     *
     * Example:
     * await queryInterface.bulkInsert('People', [{
     *   name: 'John Doe',
     *   isBetaMember: false
     * }], {})
     */
    await queryInterface.bulkInsert('Coupons',
      [
        { code: 'WELCOME10', description: '10% off your first order', discountPercentage: 10, minPrice: 10, expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), maxUses: 100, usedCount: 0, createdAt: new Date(), updatedAt: new Date() },
        { code: 'SUMMER20', description: '20% off orders over 20€', discountPercentage: 20, minPrice: 20, expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), maxUses: 50, usedCount: 5, createdAt: new Date(), updatedAt: new Date() },
        { code: 'EXPIRED5', description: 'Expired 5% off coupon', discountPercentage: 5, minPrice: 0, expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), maxUses: 100, usedCount: 0, createdAt: new Date(), updatedAt: new Date() },
        { code: 'LASTONE', description: '15% off, only one use left (already used)', discountPercentage: 15, minPrice: 5, expiresAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), maxUses: 1, usedCount: 1, createdAt: new Date(), updatedAt: new Date() }
      ], {})
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {})
     */
    const { sequelize } = queryInterface
    try {
      await sequelize.transaction(async (transaction) => {
        const options = { transaction }
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 0', options)
        await sequelize.query('TRUNCATE TABLE Coupons', options)
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 1', options)
      })
    } catch (error) {
      console.error(error)
    }
  }
}
