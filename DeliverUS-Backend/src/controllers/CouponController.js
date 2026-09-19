import { Coupon } from '../models/models.js'
import { Op } from 'sequelize'

const findAvailableCoupons = async function (req, res) {
  try {
    const coupons = await Coupon.findAll({
      where: {
        expiresAt: { [Op.gt]: new Date() }
      },
      order: [
        ['expiresAt', 'ASC']
      ]
    })
    const availableCoupons = coupons.filter(coupon => coupon.usedCount < coupon.maxUses)
    return res.json(availableCoupons)
  } catch (err) {
    return res.status(500).send(err)
  }
}

const CouponController = {
  findAvailableCoupons
}

export default CouponController
