module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Coupons', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      code: {
        allowNull: false,
        type: Sequelize.STRING,
        unique: true
      },
      description: {
        type: Sequelize.STRING
      },
      discountPercentage: {
        allowNull: false,
        type: Sequelize.INTEGER
      },
      minPrice: {
        allowNull: false,
        type: Sequelize.DOUBLE,
        defaultValue: 0
      },
      expiresAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      maxUses: {
        allowNull: false,
        type: Sequelize.INTEGER,
        defaultValue: 1
      },
      usedCount: {
        allowNull: false,
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: new Date()
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: new Date()
      }
    })
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Coupons')
  }
}
