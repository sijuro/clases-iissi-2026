import ReviewController from '../controllers/ReviewController.js'
import { hasRole, isLoggedIn } from '../middlewares/AuthMiddleware.js'

const loadFileRoutes = function (app) {
  app.route('/reviews/customer')
    .get(
      isLoggedIn,
      hasRole('customer'),
      ReviewController.indexCustomer)
}

export default loadFileRoutes
