import { Coupon, Order, Restaurant } from '../models/models.js'

const checkOrderCustomer = async (req, res, next) => {
  try {
    const order = await Order.findByPk(req.params.orderId)
    if (order && order.userId === req.user.id) {
      return next()
    }
    return res.status(403).send('Not enough privileges. This order does not belong to you')
  } catch (err) {
    return res.status(500).send(err)
  }
}

const checkRestaurantExists = async (req, res, next) => {
  return next()
}

const checkOrderOwnership = async (req, res, next) => {
  try {
    const order = await Order.findByPk(req.params.orderId, {
      include: {
        model: Restaurant,
        as: 'restaurant'
      }
    })
    if (req.user.id === order.restaurant.userId) {
      return next()
    } else {
      return res.status(403).send('Not enough privileges. This entity does not belong to you')
    }
  } catch (err) {
    return res.status(500).send(err)
  }
}

const checkOrderVisible = (req, res, next) => {
  if (req.user.userType === 'owner') {
    return checkOrderOwnership(req, res, next)
  }
  if (req.user.userType === 'customer') {
    return checkOrderCustomer(req, res, next)
  }
  return res.status(403).send('Not enough privileges')
}

const checkOrderIsPending = async (req, res, next) => {
  try {
    const order = await Order.findByPk(req.params.orderId)
    const isPending = !order.startedAt
    if (isPending) {
      return next()
    } else {
      return res.status(409).send('The order has already been started')
    }
  } catch (err) {
    return res.status(500).send(err.message)
  }
}

const checkOrderCanBeSent = async (req, res, next) => {
  try {
    const order = await Order.findByPk(req.params.orderId)
    const isShippable = order.startedAt && !order.sentAt
    if (isShippable) {
      return next()
    } else {
      return res.status(409).send('The order cannot be sent')
    }
  } catch (err) {
    return res.status(500).send(err.message)
  }
}
const checkOrderCanBeDelivered = async (req, res, next) => {
  try {
    const order = await Order.findByPk(req.params.orderId)
    const isDeliverable = order.startedAt && order.sentAt && !order.deliveredAt
    if (isDeliverable) {
      return next()
    } else {
      return res.status(409).send('The order cannot be delivered')
    }
  } catch (err) {
    return res.status(500).send(err.message)
  }
}

const checkOrderBelongsToCustomer = async (req, res, next) => {
  try {
    const order =  await Order.findByPk(req.params.orderId)
    if (order.userId === req.user.id) {
      return next()
    } else {
       return res.status(403).send('The order doesnt belong to you')
    }
  } catch (err) {
    return res.status(500).send(err.message)
  }
}

const checkOrderCanBeCouponApplied = async (req, res, next) => {
  try {
    const order =  await Order.findByPk(req.params.orderId)

    // EL codigo no es nulo ni esta vacio
    if (req.body.code === null || req.body.code == ''){
      return res.status(422).send('Coupon unprocessable')
    }

    // El cupon existe
    const coupon = await Coupon.findOne({ where:  { code: req.body.code }})
    if (!coupon) {
      return res.status(404).send('Coupon not found')
    }

    // El pedido no está pendiente
    if (order.startedAt) {
      return res.status(409).send('Order is not pending')
    }

    // El pedido ya tiene un copon aplicado
    if (order.couponId) {
      return res.status(409).send('Order already has a coupon')
    }

    // El precio del pedido es menor que el del cupon
    if (order.price < coupon.minPrice) {
      return res.status(409).send('Order price below minimum')
    }

    // Cupón caucado
    const isExpired = new Date() > new Date(coupon.expiresAt)
    if (isExpired) {
      return res.status(409).send('Coupon expired')
    }

    // Sin usos disponibles
    if (coupon.usedCount >= coupon.maxUses) {
      return res.status(409).send('Coupon max used reached')
    }

  } catch (err) {
    return res.status(500).send(err.message)
  }
}

const checkOrderCanRemoveCoupon  = async (req, res, next) => {
  try {
    const order =  await Order.findByPk(req.params.orderId)
    if (order.startedAt) {
      return res.status(409).send('Order is not pending')
    }

    if (!order.couponId) {
      return res.status(409).send('Order already doesnt have a coupon')
    }
  
  } catch (err) {
    return res.status(500).send(err.message)
  }
}

export { checkOrderOwnership, checkOrderCustomer, checkOrderVisible, checkOrderIsPending, checkOrderCanBeSent, checkOrderCanBeDelivered, checkRestaurantExists ,
  checkOrderBelongsToCustomer, checkOrderCanBeCouponApplied, checkOrderCanRemoveCoupon
}
