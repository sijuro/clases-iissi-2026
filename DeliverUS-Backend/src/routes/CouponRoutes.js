import CouponController from '../controllers/CouponController.js'
import { hasRole, isLoggedIn } from '../middlewares/AuthMiddleware.js'

const loadFileRoutes = function (app) {
  app.route('/coupons/available')
    .get(
      isLoggedIn,
      hasRole('customer'),
      CouponController.findAvailableCoupons)
}

export default loadFileRoutes
