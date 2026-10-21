import ReviewController from '../controllers/ReviewController.js'
import { hasRole, isLoggedIn } from '../middlewares/AuthMiddleware.js'
import { checkEntityExists } from '../middlewares/EntityMiddleware.js'
import { Review } from '../models/models.js'
import * as ReviewMiddleware from '../middlewares/ReviewMiddleware.js'
import * as ReviewValidation from '../controllers/validation/ReviewValidation.js'
import { handleValidation } from '../middlewares/ValidationHandlingMiddleware.js'

const loadFileRoutes = function (app) {
  app.route('/reviews/customer')
    .get(
      isLoggedIn,
      hasRole('customer'),
      ReviewController.indexCustomer)
  
  app.route('/reviews/:reviewId')
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
