import { Order, Review } from '../models/models.js'

const checkOrderCanBeReviewed = async (req, res, next) => {
  try {
    const order = await Order.findByPk(req.params.orderId)
    if (!order.deliveredAt) {
        return res.status(409).send('This order is not delivered yet')
    }
    const review = await Review.findOne({ where: {orderId: order.id} })
    if (review) {
        return res.status(409).send('This order has a review')
    }
    return next()
  } catch (err) {
    return res.status(500).send(err)
  }
}

const checkReviewOwnership = async (req, res, next) => {
  try {
    const review = await Review.findByPk(req.params.reviewId)
    if (review && review.userId == req.user.id) {
      return next()
    }
    return res.status(403).send('This review does not belong to you')
  } catch (err) {
    return res.status(500).send(err)
  }
}

export {checkOrderCanBeReviewed, checkReviewOwnership}