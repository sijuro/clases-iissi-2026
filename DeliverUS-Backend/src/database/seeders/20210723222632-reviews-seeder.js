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
    await queryInterface.bulkInsert('Reviews',
      [
        // Pedido 1 (Casa felix, restaurantId=1), entregado y valorado por customer1
        { rating: 5, comment: 'Comida excelente y entrega muy rápida', orderId: 1, restaurantId: 1, userId: 1, createdAt: new Date(), updatedAt: new Date() },
        // Pedido 5 (100 montaditos, restaurantId=2), entregado y valorado por customer1
        { rating: 3, comment: 'Estaba bien, aunque tardó bastante', orderId: 5, restaurantId: 2, userId: 1, createdAt: new Date(), updatedAt: new Date() }
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
        await sequelize.query('TRUNCATE TABLE Reviews', options)
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 1', options)
      })
    } catch (error) {
      console.error(error)
    }
  }
}
