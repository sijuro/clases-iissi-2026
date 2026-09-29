import { Order, Product, Restaurant, User, Coupon, sequelizeSession } from '../models/models.js'
import moment from 'moment'
import { Op } from 'sequelize'
const generateFilterWhereClauses = function (req) {
  const filterWhereClauses = []
  if (req.query.status) {
    switch (req.query.status) {
      case 'pending':
        filterWhereClauses.push({
          startedAt: null
        })
        break
      case 'in process':
        filterWhereClauses.push({
          [Op.and]: [
            {
              startedAt: {
                [Op.ne]: null
              }
            },
            { sentAt: null },
            { deliveredAt: null }
          ]
        })
        break
      case 'sent':
        filterWhereClauses.push({
          [Op.and]: [
            {
              sentAt: {
                [Op.ne]: null
              }
            },
            { deliveredAt: null }
          ]
        })
        break
      case 'delivered':
        filterWhereClauses.push({
          sentAt: {
            [Op.ne]: null
          }
        })
        break
    }
  }
  if (req.query.from) {
    const date = moment(req.query.from, 'YYYY-MM-DD', true)
    filterWhereClauses.push({
      createdAt: {
        [Op.gte]: date
      }
    })
  }
  if (req.query.to) {
    const date = moment(req.query.to, 'YYYY-MM-DD', true)
    filterWhereClauses.push({
      createdAt: {
        [Op.lte]: date.add(1, 'days') // FIXME: se pasa al siguiente día a las 00:00
      }
    })
  }
  return filterWhereClauses
}

// Returns :restaurantId orders
const indexRestaurant = async function (req, res) {
  const whereClauses = generateFilterWhereClauses(req)
  whereClauses.push({
    restaurantId: req.params.restaurantId
  })
  try {
    const orders = await Order.findAll({
      where: whereClauses,
      include: {
        model: Product,
        as: 'products'
      }
    })
    res.json(orders)
  } catch (err) {
    res.status(500).send(err)
  }
}

const indexCustomer = async function (req, res) {
  try {
    const orders = await Order.findAll({
      where: {
        userId: req.user.id
      },
      include: [
        {
          model: Restaurant,
          as: 'restaurant'
        },
        {
          model: Coupon,
          as: 'coupon'
        }
      ],
      order: [
        ['deliveredAt', 'ASC']
      ]
    })
    res.json(orders)
  } catch (err) {
    res.status(500).send(err)
  }
}

const create = async (req, res) => {
  // Use sequelizeSession to start a transaction
  res.status(500).send('This function is to be implemented')
}

const update = async function (req, res) {
  // Use sequelizeSession to start a transaction
  res.status(500).send('This function is to be implemented')
}

const destroy = async function (req, res) {
  res.status(500).send('This function is to be implemented')
}

const applyCoupon = async function (req, res) {
  const transaction = await sequelizeSession.transaction()
  try {
    const order = await Order.findByPk(req.params.orderId, { transaction })
    const coupon = await Coupon.findOne({ where: { code: req.body.code }, transaction })
    if (!coupon) {
      await transaction.rollback()
      return res.status(404).send('Coupon not found')
    }
    const discount = order.price * coupon.discountPercentage / 100
    order.couponId = coupon.id
    order.couponDiscount = discount
    order.price = order.price - discount
    await order.save({ transaction })
    coupon.usedCount += 1
    await coupon.save({ transaction })
    await transaction.commit()
    return res.json(order)
  } catch (err) {
    await transaction.rollback()
    return res.status(500).send(err)
  }
}

const removeCoupon = async function (req, res) {
  const transaction = await sequelizeSession.transaction()
  try {
    const order = await Order.findByPk(req.params.orderId, { transaction })
    const coupon = await Coupon.findByPk(order.couponId, { transaction })
    order.price = order.price + order.couponDiscount
    order.couponId = null
    order.couponDiscount = null
    await order.save({ transaction })
    if (coupon) {
      coupon.usedCount = Math.max(0, coupon.usedCount - 1)
      await coupon.save({ transaction })
    }
    await transaction.commit()
    return res.json(order)
  } catch (err) {
    await transaction.rollback()
    return res.status(500).send(err)
  }
}

const updateCustomerComments = async function (req, res) {
  try {
    const order = await Order.findByPk(req.params.orderId)
    order.customerComments = req.body.customerComments ?? null
    const updatedOrder = await order.save()
    res.json(updatedOrder)
  } catch (err) {
    res.status(500).send(err)
  }
}

const confirm = async function (req, res) {
  try {
    const order = await Order.findByPk(req.params.orderId)
    order.startedAt = new Date()
    const updatedOrder = await order.save()
    res.json(updatedOrder)
  } catch (err) {
    res.status(500).send(err)
  }
}

const send = async function (req, res) {
  try {
    const order = await Order.findByPk(req.params.orderId)
    order.sentAt = new Date()
    const updatedOrder = await order.save()
    res.json(updatedOrder)
  } catch (err) {
    res.status(500).send(err)
  }
}

const deliver = async function (req, res) {
  try {
    const order = await Order.findByPk(req.params.orderId)
    order.deliveredAt = new Date()
    const updatedOrder = await order.save()
    const restaurant = await Restaurant.findByPk(order.restaurantId)
    const averageServiceTime = await restaurant.getAverageServiceTime()
    await Restaurant.update({ averageServiceMinutes: averageServiceTime }, { where: { id: order.restaurantId } })
    res.json(updatedOrder)
  } catch (err) {
    res.status(500).send(err)
  }
}

const show = async function (req, res) {
  try {
    const order = await Order.findByPk(req.params.orderId, {
      include: [{
        model: Restaurant,
        as: 'restaurant',
        attributes: ['name', 'description', 'address', 'postalCode', 'url', 'shippingCosts', 'averageServiceMinutes', 'email', 'phone', 'logo', 'heroImage', 'status', 'restaurantCategoryId']
      },
      {
        model: User,
        as: 'user',
        attributes: ['firstName', 'email', 'avatar', 'userType']
      },
      {
        model: Product,
        as: 'products'
      }]
    })
    res.json(order)
  } catch (err) {
    res.status(500).send(err)
  }
}

const analytics = async function (req, res) {
  const yesterdayZeroHours = moment().subtract(1, 'days').set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
  const todayZeroHours = moment().set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
  try {
    const numYesterdayOrders = await Order.count({
      where:
      {
        createdAt: {
          [Op.lt]: todayZeroHours,
          [Op.gte]: yesterdayZeroHours
        },
        restaurantId: req.params.restaurantId
      }
    })
    const numPendingOrders = await Order.count({
      where:
      {
        startedAt: null,
        restaurantId: req.params.restaurantId
      }
    })
    const numDeliveredTodayOrders = await Order.count({
      where:
      {
        deliveredAt: { [Op.gte]: todayZeroHours },
        restaurantId: req.params.restaurantId
      }
    })

    const invoicedToday = await Order.sum(
      'price',
      {
        where:
        {
          createdAt: { [Op.gte]: todayZeroHours }, // FIXME: Created or confirmed?
          restaurantId: req.params.restaurantId
        }
      })
    res.json({
      restaurantId: req.params.restaurantId,
      numYesterdayOrders,
      numPendingOrders,
      numDeliveredTodayOrders,
      invoicedToday
    })
  } catch (err) {
    res.status(500).send(err)
  }
}

const OrderController = {
  indexRestaurant,
  indexCustomer,
  create,
  update,
  destroy,
  applyCoupon,
  removeCoupon,
  updateCustomerComments,
  confirm,
  send,
  deliver,
  show,
  analytics
}
export default OrderController
