import { Model } from 'sequelize'
const loadModel = (sequelize, DataTypes) => {
  class Coupon extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate (models) {
      // define association here
    }
  }
  Coupon.init({
    code: {
      allowNull: false,
      type: DataTypes.STRING,
      unique: true
    },
    description: {
      type: DataTypes.STRING
    },
    discountPercentage: {
      allowNull: false,
      type: DataTypes.INTEGER,
      validate: {
        min: 1,
        max: 100
      }
    },
    minPrice: {
      allowNull: false,
      type: DataTypes.DOUBLE,
      defaultValue: 0
    },
    expiresAt: {
      allowNull: false,
      type: DataTypes.DATE
    },
    maxUses: {
      allowNull: false,
      type: DataTypes.INTEGER,
      defaultValue: 1
    },
    usedCount: {
      allowNull: false,
      type: DataTypes.INTEGER,
      defaultValue: 0
    }
  }, {
    sequelize,
    modelName: 'Coupon'
  })
  return Coupon
}
export default loadModel
