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
    await queryInterface.bulkInsert('Orders',
      [
        // Casa felix id=1
        // Customer1 id=1
        // pending
        { createdAt: new Date(Date.now() - 900000), startedAt: new Date(Date.now() - 400000), price: 15.0, address: 'Fake street 123', shippingCosts: 0, restaurantId: 1, userId: 1 },

        { createdAt: new Date(Date.now() - 400000), startedAt: new Date(Date.now() - 100000), price: 19.5, address: 'Reina Mercedes s/n', shippingCosts: 0, restaurantId: 1, userId: 1 },

        { createdAt: new Date(Date.now() - 200000), price: 12.50, address: 'Real street 456', shippingCosts: 0, restaurantId: 1, userId: 1 },

        { createdAt: new Date(Date.now() - 300000), startedAt: new Date(), price: 18.0, address: 'Another address', shippingCosts: 0, restaurantId: 1, userId: 1 },

        /// 100 montaditos id=2
        // Customer1 id=1
        { createdAt: new Date(Date.now() - 300000), startedAt: new Date(), price: 6, address: 'My street 123', shippingCosts: 1.5, restaurantId: 2, userId: 1 },
        { createdAt: new Date(Date.now() - 200000), price: 10.5, address: 'Another street 456', shippingCosts: 1.5, restaurantId: 2, userId: 1 }

      ], {})

    await queryInterface.bulkInsert('OrderProducts',
      [
        // Pedido 1
        { orderId: 1, productId: 1, unityPrice: 2.5, quantity: 2 },
        { orderId: 1, productId: 6, unityPrice: 3.5, quantity: 2 },
        { orderId: 1, productId: 9, unityPrice: 3.0, quantity: 1 },

        // Pedido 2
        //
        { orderId: 2, productId: 1, unityPrice: 2.5, quantity: 3 },
        { orderId: 2, productId: 7, unityPrice: 4.5, quantity: 2 },
        { orderId: 2, productId: 10, unityPrice: 3.0, quantity: 1 },
        // Pedido 3
        { orderId: 3, productId: 1, unityPrice: 2.5, quantity: 1 },
        { orderId: 3, productId: 6, unityPrice: 3.5, quantity: 2 },
        { orderId: 3, productId: 10, unityPrice: 3.0, quantity: 1 },

        // Pedido 4 (casa felix)
        { orderId: 4, productId: 1, unityPrice: 2.5, quantity: 1 },
        { orderId: 4, productId: 6, unityPrice: 3.5, quantity: 2 },
        { orderId: 4, productId: 7, unityPrice: 4.5, quantity: 1 },
        { orderId: 4, productId: 8, unityPrice: 4.0, quantity: 1 },

        // Pedido 5 (100 montaditos)
        { orderId: 5, productId: 12, unityPrice: 1.5, quantity: 2 },
        { orderId: 5, productId: 14, unityPrice: 1.5, quantity: 1 },
        // Pedido 6 (100 montaditos)
        { orderId: 6, productId: 15, unityPrice: 1, quantity: 2 },
        { orderId: 6, productId: 16, unityPrice: 1, quantity: 2 },
        { orderId: 6, productId: 17, unityPrice: 1.5, quantity: 1 },
        { orderId: 6, productId: 19, unityPrice: 2, quantity: 1 },
        { orderId: 6, productId: 21, unityPrice: 1.5, quantity: 1 }
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
        await sequelize.query('TRUNCATE TABLE OrderProducts', options)
        await sequelize.query('TRUNCATE TABLE Orders', options)
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 1', options)
      })
    } catch (error) {
      console.error(error)
    }
  }
}
