import OrderController from '../controllers/OrderController.js'
import { hasRole, isLoggedIn } from '../middlewares/AuthMiddleware.js'
import { checkEntityExists } from '../middlewares/EntityMiddleware.js'
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

  app.route('/orders/:orderId')
    .get(
      isLoggedIn,
      checkEntityExists(Order, 'orderId'),
      OrderMiddleware.checkOrderVisible,
      OrderController.show)

  app.route('/orders/:orderId/applyCoupon')
    .get(
      isLoggedIn,
      hasRole('customer'),
      checkEntityExists(Order, 'orderId'),
      OrderMiddleware.checkOrderBelongsToCustomer,
      OrderValidation.applyCoupon, // TODO
      handleValidation,
      OrderMiddleware.checkOrderCanBeCouponApplied, // TODO
      OrderController.applyCoupon, // TODO
    )

  app.route('/orders/:orderId/removeCoupon')
    .get(
      isLoggedIn,
      hasRole('customer'),
      checkEntityExists(Order, 'orderId'),
      OrderMiddleware.checkOrderBelongsToCustomer,
      OrderMiddleware.checkOrderCanRemoveCoupon, // TODO
      OrderController.removeCoupon, // TODO
    )

  app.route('/orders/customer')
    .get(
      isLoggedIn,
      hasRole('customer'),
      OrderController.OrderList // TODO
    )

  app.route('/orders/:orderId/customerComments')
    .get(
      isLoggedIn,
      hasRole('customer'),
      checkEntityExists(Order, 'orderId'),
      OrderMiddleware.checkOrderBelongsToCustomer,
      OrderValidation.updateCustomerComment,
      handleValidation,
    )
}

export default loadFileRoutes
