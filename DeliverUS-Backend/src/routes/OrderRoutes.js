import OrderController from '../controllers/OrderController.js'
import ReviewController from '../controllers/ReviewController.js'
import * as ReviewValidation from '../controllers/validation/ReviewValidation.js'
import { hasRole, isLoggedIn } from '../middlewares/AuthMiddleware.js'
import { checkEntityExists } from '../middlewares/EntityMiddleware.js'
import * as OrderMiddleware from '../middlewares/OrderMiddleware.js'
import * as ReviewMiddleware from '../middlewares/ReviewMiddleware.js'
import { handleValidation } from '../middlewares/ValidationHandlingMiddleware.js'
import { Order } from '../models/models.js'

const loadFileRoutes = function (app) {
  app.route('/orders/:orderId/confirm')
    .patch(
      isLoggedIn,
      hasRole('owner'),
      checkEntityExists(Order, 'orderId'),
      OrderMiddleware.checkOrderOwnership,
      OrderMiddleware.checkOrderIsPending,
      OrderController.confirm)
  app.route('/orders/:orderId/send')
    .patch(
      isLoggedIn,
      hasRole('owner'),
      checkEntityExists(Order, 'orderId'),
      OrderMiddleware.checkOrderOwnership,
      OrderMiddleware.checkOrderCanBeSent,
      OrderController.send)

  app.route('/orders/:orderId/deliver')
    .patch(
      isLoggedIn,
      hasRole('owner'),
      checkEntityExists(Order, 'orderId'),
      OrderMiddleware.checkOrderOwnership,
      OrderMiddleware.checkOrderCanBeDelivered,
      OrderController.deliver)

  app.route('/orders/customer')
    .get(
      isLoggedIn,
      hasRole('customer'),
      OrderController.indexCustomer)

  app.route('/orders/:orderId')
    .get(
      isLoggedIn,
      checkEntityExists(Order, 'orderId'),
      OrderMiddleware.checkOrderVisible,
      OrderController.show)

  app.route('/orders/:orderId/reviews')
    .post(
      isLoggedIn,
      hasRole('customer'),
      checkEntityExists(Order, 'orderId'),
      OrderMiddleware.checkOrderBelongsToCustomer,
      ReviewValidation.create,
      handleValidation,
      ReviewMiddleware.checkOrderCanBeReviewed,
      ReviewController.create)
}

export default loadFileRoutes
