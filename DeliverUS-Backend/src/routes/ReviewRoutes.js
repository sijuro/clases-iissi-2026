import ReviewController from '../controllers/ReviewController.js'
import { hasRole, isLoggedIn } from '../middlewares/AuthMiddleware.js'
import { checkEntityExists } from '../middlewares/EntityMiddleware.js'
import { Review } from '../models/models.js'

const loadFileRoutes = function (app) {
  app.route('/reviews/customer')
    .get(
      isLoggedIn,
      hasRole('customer'),
      ReviewController.indexCustomer)
  
  app.route('/revires/:reviewId')
    .patch(
      isLoggedIn,
      hasRole('customer'),
      checkEntityExists(Review, 'reviewId'),
      ReviewMiddleware.checkReviewOwnership,
      ReviewValidation.update,
      handleValidation,
      ReviewController.update)
    .delete(
      isLoggedIn,
      hasRole('customer'),
      checkEntityExists(Review, 'reviewId'),
      ReviewMiddleware.checkReviewOwnership,
      ReviewController.destroy
    )
}


export default loadFileRoutes
