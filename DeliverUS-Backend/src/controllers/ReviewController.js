import { Review, Restaurant } from '../models/models.js'

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
  res.status(500).send('This function is to be implemented')
}

const update = async function (req, res) {
  res.status(500).send('This function is to be implemented')
}

const destroy = async function (req, res) {
  res.status(500).send('This function is to be implemented')
}

const ReviewController = {
  indexCustomer,
  create,
  update,
  destroy
}

export default ReviewController
