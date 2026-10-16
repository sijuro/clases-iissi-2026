import { Review, Restaurant, Order } from '../models/models.js'

const indexCustomer = async function (req, res) {
  try {
    const reviews = await Review.findAll({
      where: {
        userId: req.user.id
      },
      include: [{
        model: Restaurant,
        as: 'restaurant',
        attributes: ['id', 'name', 'logo']
      }],
      order: [
        ['createdAt', 'DESC']
      ]
    })
    return res.json(reviews)
  } catch (err) {
    return res.status(500).send(err)
  }
}

const create = async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.orderId)
    const review = await Review.create({
      rating: req.body.rating,
      comment: req.body.comment,
      orderId: order.id,
      restaurantId: order.restaurantId,
      userId: req.user.id
    })
    return res.status(200).json(review)
  } catch (err) {
    res.status(500).send(err)
  }
}

const update = async function (req, res) {
  try {
    const review = await Review.findByPk(req.params.reviewId)
    if (req.body.rating !== undefined) {
      review.rating = req.body.rating
    }
    if (req.body.comment !== undefined) {
      review.comment = req.body.comment
    }
    const reviewUpdated = await review.save()
    return res.json(reviewUpdated)
  } catch (err) {
    res.status(500).send(err)
  }
}

const destroy = async function (req, res) {
  try {
    const result = await Review.destroy({ where: { id: req.params.reviewId } })
    let message = ''
    if (result === 1) {
      message = 'Sucessfuly deleted review id.' + req.params.reviewId
    } else {
      message = 'Could not delete review.'
    }
    res.json(message)
  } catch (err) {
    res.status(500).send(err)
  }
}

const ReviewController = {
  indexCustomer,
  create,
  update,
  destroy
}

export default ReviewController
