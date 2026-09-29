import OrderController from '../controllers/OrderController.js'
import * as OrderValidation from '../controllers/validation/OrderValidation.js'
import { hasRole, isLoggedIn } from '../middlewares/AuthMiddleware.js'
import { checkEntityExists } from '../middlewares/EntityMiddleware.js'
import { handleValidation } from '../middlewares/ValidationHandlingMiddleware.js'
import * as OrderMiddleware from '../middlewares/OrderMiddleware.js'
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

  // NOTE: /orders/customer must be registered before /orders/:orderId
  app.route('/orders/customer')
    .get(
      isLoggedIn,
      hasRole('customer'),
      OrderController.indexCustomer)

  app.route('/orders/:orderId/applyCoupon')
    .patch(
      isLoggedIn,
      hasRole('customer'),
      checkEntityExists(Order, 'orderId'),
      OrderMiddleware.checkOrderBelongsToCustomer,
      OrderValidation.applyCoupon,
      handleValidation,
      OrderMiddleware.checkOrderCanBeCouponApplied,
      OrderController.applyCoupon)

  app.route('/orders/:orderId/removeCoupon')
    .patch(
      isLoggedIn,
      hasRole('customer'),
      checkEntityExists(Order, 'orderId'),
      OrderMiddleware.checkOrderBelongsToCustomer,
      OrderMiddleware.checkOrderCanRemoveCoupon,
      OrderController.removeCoupon)

  app.route('/orders/:orderId/customerComments')
    .patch(
      isLoggedIn,
      hasRole('customer'),
      checkEntityExists(Order, 'orderId'),
      OrderMiddleware.checkOrderBelongsToCustomer,
      OrderValidation.updateCustomerComments,
      handleValidation,
      OrderController.updateCustomerComments)

  app.route('/orders/:orderId')
    .get(
      isLoggedIn,
      checkEntityExists(Order, 'orderId'),
      OrderMiddleware.checkOrderVisible,
      OrderController.show)
}

export default loadFileRoutes
