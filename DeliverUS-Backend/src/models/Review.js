import { Model } from 'sequelize'
const loadModel = (sequelize, DataTypes) => {
  class Review extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate (models) {
      Review.belongsTo(models.Order, { foreignKey: 'orderId', as: 'order' })
      Review.belongsTo(models.Restaurant, { foreignKey: 'restaurantId', as: 'restaurant' })
      Review.belongsTo(models.User, { foreignKey: 'userId', as: 'user' })
    }
  }
  Review.init({
    rating: {
      allowNull: false,
      type: DataTypes.INTEGER,
      validate: {
        min: 1,
        max: 5
      }
    },
    comment: {
      type: DataTypes.STRING(500)
    },
    orderId: {
      allowNull: false,
      unique: true,
      type: DataTypes.INTEGER
    },
    restaurantId: {
      allowNull: false,
      type: DataTypes.INTEGER
    },
    userId: {
      allowNull: false,
      type: DataTypes.INTEGER
    }
  }, {
    sequelize,
    modelName: 'Review'
  })
  return Review
}
export default loadModel
