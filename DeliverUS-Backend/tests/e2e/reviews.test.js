import request from 'supertest'
import { shutdownApp, getApp } from './utils/testApp'
import { getLoggedInCustomer, getLoggedInOwner, getNewLoggedInCustomer } from './utils/auth'
import { getFirstRestaurantOfOwner } from './utils/restaurant'
import { generateFakeUser } from './utils/testData'
import { Order, Review } from '../../src/models/models.js'

// NOTE: POST /orders (order creation) is not implemented yet in this branch, so order
// fixtures are created directly through the Order model instead of the customer-facing
// endpoint. The review workflow endpoints under test (indexCustomer, create, update,
// destroy and the customer order listing) are exercised through the real HTTP API.

const createTestOrder = async (customer, restaurant, overrides = {}) => {
  const order = await Order.create({
    address: 'Fake street 123',
    price: 30,
    shippingCosts: restaurant.shippingCosts,
    restaurantId: restaurant.id,
    userId: customer.id,
    deliveredAt: new Date(),
    ...overrides
  })
  return order.toJSON()
}

const createTestReview = async (order, overrides = {}) => {
  const review = await Review.create({
    rating: 4,
    comment: 'Test review',
    orderId: order.id,
    restaurantId: order.restaurantId,
    userId: order.userId,
    ...overrides
  })
  return review.toJSON()
}

const createReview = (app, user, orderId, body) => {
  return request(app).post(`/orders/${orderId}/reviews`).set('Authorization', `Bearer ${user.token}`).send(body)
}

const updateReview = (app, user, reviewId, body) => {
  return request(app).patch(`/reviews/${reviewId}`).set('Authorization', `Bearer ${user.token}`).send(body)
}

const deleteReview = (app, user, reviewId) => {
  return request(app).delete(`/reviews/${reviewId}`).set('Authorization', `Bearer ${user.token}`).send()
}

describe('Register and login customer', () => {
  let fakeCustomer, app
  beforeAll(async () => {
    fakeCustomer = await generateFakeUser()
    app = await getApp()
  })
  it('Should return 422 when no email is provided', async () => {
    const invalidCustomer = { ...fakeCustomer }
    delete invalidCustomer.email
    const response = await request(app).post('/users/register').send(invalidCustomer)
    expect(response.status).toBe(422)
  })
  it('Should return 200 when registering a new customer', async () => {
    const response = await request(app).post('/users/register').send(fakeCustomer)
    expect(response.status).toBe(200)
    expect(response.body.id).toBeDefined()
  })
  it('Should be able to login as customer after registration', async () => {
    const response = await request(app).post('/users/login').send({ email: fakeCustomer.email, password: fakeCustomer.password })
    expect(response.status).toBe(200)
    expect(response.body.token).toBeDefined()
  })
  it('Should return 401 when trying to login as an owner with customer credentials', async () => {
    const response = await request(app).post('/users/loginOwner').send({ email: fakeCustomer.email, password: fakeCustomer.password })
    expect(response.status).toBe(401)
  })
  afterAll(async () => {
    await shutdownApp()
  })
})

describe('Get my reviews', () => {
  let app, customer, owner, restaurant, otherCustomer, ownReview, otherReview
  beforeAll(async () => {
    app = await getApp()
    customer = await getLoggedInCustomer()
    owner = await getLoggedInOwner()
    restaurant = await getFirstRestaurantOfOwner(owner)
    otherCustomer = await getNewLoggedInCustomer()
    const ownOrder = await createTestOrder(customer, restaurant)
    ownReview = await createTestReview(ownOrder, { rating: 5, comment: 'Great!' })
    const otherOrder = await createTestOrder(otherCustomer, restaurant)
    otherReview = await createTestReview(otherOrder, { rating: 1, comment: 'Bad' })
  })
  it('Should return 401 if not logged in', async () => {
    const response = await request(app).get('/reviews/customer').send()
    expect(response.status).toBe(401)
  })
  it('Should return 403 when logged in as an owner', async () => {
    const response = await request(app).get('/reviews/customer').set('Authorization', `Bearer ${owner.token}`).send()
    expect(response.status).toBe(403)
  })
  it('Should return 200 when logged in as a customer', async () => {
    const response = await request(app).get('/reviews/customer').set('Authorization', `Bearer ${customer.token}`).send()
    expect(response.status).toBe(200)
    expect(Array.isArray(response.body)).toBe(true)
  })
  it('Should only include the requesting customer reviews', async () => {
    const response = await request(app).get('/reviews/customer').set('Authorization', `Bearer ${customer.token}`).send()
    expect(response.body.every(review => review.userId === customer.id)).toBe(true)
    expect(response.body.some(review => review.id === ownReview.id)).toBe(true)
    expect(response.body.some(review => review.id === otherReview.id)).toBe(false)
  })
  it('Should include the restaurant of each review', async () => {
    const response = await request(app).get('/reviews/customer').set('Authorization', `Bearer ${customer.token}`).send()
    const review = response.body.find(review => review.id === ownReview.id)
    expect(review.restaurant).toBeDefined()
    expect(review.restaurant.id).toBe(restaurant.id)
  })
  it('Should list the most recent reviews first', async () => {
    const olderOrder = await createTestOrder(customer, restaurant)
    const older = await createTestReview(olderOrder, { rating: 2, createdAt: new Date('2020-01-01T10:00:00Z') })
    const newerOrder = await createTestOrder(customer, restaurant)
    const newer = await createTestReview(newerOrder, { rating: 3, createdAt: new Date('2020-01-02T10:00:00Z') })
    const response = await request(app).get('/reviews/customer').set('Authorization', `Bearer ${customer.token}`).send()
    const olderIndex = response.body.findIndex(review => review.id === older.id)
    const newerIndex = response.body.findIndex(review => review.id === newer.id)
    expect(olderIndex).toBeGreaterThanOrEqual(0)
    expect(newerIndex).toBeGreaterThanOrEqual(0)
    expect(newerIndex).toBeLessThan(olderIndex)
  })
  afterAll(async () => {
    await shutdownApp()
  })
})

describe('Create review', () => {
  let app, customer, owner, restaurant, otherCustomer, deliveredOrder
  beforeAll(async () => {
    app = await getApp()
    customer = await getLoggedInCustomer()
    owner = await getLoggedInOwner()
    restaurant = await getFirstRestaurantOfOwner(owner)
    otherCustomer = await getNewLoggedInCustomer()
    deliveredOrder = await createTestOrder(customer, restaurant)
  })
  it('Should return 401 if not logged in', async () => {
    const response = await request(app).post(`/orders/${deliveredOrder.id}/reviews`).send({ rating: 5 })
    expect(response.status).toBe(401)
  })
  it('Should return 403 when logged in as an owner', async () => {
    const response = await createReview(app, owner, deliveredOrder.id, { rating: 5 })
    expect(response.status).toBe(403)
  })
  it('Should return 403 when the order belongs to another customer', async () => {
    const response = await createReview(app, otherCustomer, deliveredOrder.id, { rating: 5 })
    expect(response.status).toBe(403)
  })
  it('Should return 404 when trying to review a nonexistent order', async () => {
    const response = await createReview(app, customer, 'invalidOrderId', { rating: 5 })
    expect(response.status).toBe(404)
  })
  it('Should return 422 when the rating is missing', async () => {
    const order = await createTestOrder(customer, restaurant)
    const response = await createReview(app, customer, order.id, {})
    expect(response.status).toBe(422)
    const errorFields = response.body.errors.map(error => error.param)
    expect(errorFields).toContain('rating')
  })
  it('Should return 422 when the rating is out of range', async () => {
    const order = await createTestOrder(customer, restaurant)
    const response = await createReview(app, customer, order.id, { rating: 6 })
    expect(response.status).toBe(422)
  })
  it('Should return 422 when the comment exceeds the maximum length', async () => {
    const order = await createTestOrder(customer, restaurant)
    const tooLongComment = 'a'.repeat(501)
    const response = await createReview(app, customer, order.id, { rating: 5, comment: tooLongComment })
    expect(response.status).toBe(422)
    const errorFields = response.body.errors.map(error => error.param)
    expect(errorFields).toContain('comment')
  })
  it('Should return 409 when the order has not been delivered', async () => {
    const order = await createTestOrder(customer, restaurant, { startedAt: new Date(), sentAt: undefined, deliveredAt: undefined })
    const response = await createReview(app, customer, order.id, { rating: 5 })
    expect(response.status).toBe(409)
  })
  it('Should return 409 when the order already has a review', async () => {
    const order = await createTestOrder(customer, restaurant)
    await createTestReview(order)
    const response = await createReview(app, customer, order.id, { rating: 5 })
    expect(response.status).toBe(409)
  })
  it('Should return 201 and create the review when valid', async () => {
    const order = await createTestOrder(customer, restaurant)
    const response = await createReview(app, customer, order.id, { rating: 5, comment: 'Delicious' })
    expect(response.status).toBe(201)
    expect(response.body.id).toBeDefined()
    expect(response.body.rating).toBe(5)
    expect(response.body.comment).toBe('Delicious')
    expect(response.body.orderId).toBe(order.id)
    expect(response.body.restaurantId).toBe(order.restaurantId)
    expect(response.body.userId).toBe(customer.id)
    const stored = await Review.findByPk(response.body.id)
    expect(stored).not.toBeNull()
  })
  afterAll(async () => {
    await shutdownApp()
  })
})

describe('Get my orders', () => {
  let app, customer, owner, restaurant, otherCustomer, pendingOrder, deliveredOrder, otherCustomerOrder
  beforeAll(async () => {
    app = await getApp()
    customer = await getLoggedInCustomer()
    owner = await getLoggedInOwner()
    restaurant = await getFirstRestaurantOfOwner(owner)
    otherCustomer = await getNewLoggedInCustomer()
    pendingOrder = await createTestOrder(customer, restaurant, { startedAt: undefined, sentAt: undefined, deliveredAt: undefined })
    deliveredOrder = await createTestOrder(customer, restaurant)
    otherCustomerOrder = await createTestOrder(otherCustomer, restaurant)
  })
  it('Should return 401 if not logged in', async () => {
    const response = await request(app).get('/orders/customer').send()
    expect(response.status).toBe(401)
  })
  it('Should return 403 when logged in as an owner', async () => {
    const response = await request(app).get('/orders/customer').set('Authorization', `Bearer ${owner.token}`).send()
    expect(response.status).toBe(403)
  })
  it('Should return 200 when logged in as a customer', async () => {
    const response = await request(app).get('/orders/customer').set('Authorization', `Bearer ${customer.token}`).send()
    expect(response.status).toBe(200)
    expect(Array.isArray(response.body)).toBe(true)
  })
  it('Should only include the requesting customer orders', async () => {
    const response = await request(app).get('/orders/customer').set('Authorization', `Bearer ${customer.token}`).send()
    expect(response.body.every(order => order.userId === customer.id)).toBe(true)
    expect(response.body.some(order => order.id === pendingOrder.id)).toBe(true)
    expect(response.body.some(order => order.id === deliveredOrder.id)).toBe(true)
    expect(response.body.some(order => order.id === otherCustomerOrder.id)).toBe(false)
  })
  it('Should return not-yet-delivered orders before delivered ones', async () => {
    const response = await request(app).get('/orders/customer').set('Authorization', `Bearer ${customer.token}`).send()
    const pendingIndex = response.body.findIndex(order => order.id === pendingOrder.id)
    const deliveredIndex = response.body.findIndex(order => order.id === deliveredOrder.id)
    expect(pendingIndex).toBeGreaterThanOrEqual(0)
    expect(deliveredIndex).toBeGreaterThanOrEqual(0)
    expect(pendingIndex).toBeLessThan(deliveredIndex)
  })
  it('Should include the review of each order (or null)', async () => {
    const reviewedOrder = await createTestOrder(customer, restaurant)
    const review = await createTestReview(reviewedOrder)
    const response = await request(app).get('/orders/customer').set('Authorization', `Bearer ${customer.token}`).send()
    const orderWithReview = response.body.find(order => order.id === reviewedOrder.id)
    expect(orderWithReview.review).toBeDefined()
    expect(orderWithReview.review.id).toBe(review.id)
    const orderWithoutReview = response.body.find(order => order.id === deliveredOrder.id)
    expect(orderWithoutReview.review).toBeNull()
  })
  afterAll(async () => {
    await shutdownApp()
  })
})

describe('Update review', () => {
  let app, customer, owner, restaurant, otherCustomer, review
  beforeAll(async () => {
    app = await getApp()
    customer = await getLoggedInCustomer()
    owner = await getLoggedInOwner()
    restaurant = await getFirstRestaurantOfOwner(owner)
    otherCustomer = await getNewLoggedInCustomer()
    const order = await createTestOrder(customer, restaurant)
    review = await createTestReview(order)
  })
  it('Should return 401 if not logged in', async () => {
    const response = await request(app).patch(`/reviews/${review.id}`).send({ rating: 3 })
    expect(response.status).toBe(401)
  })
  it('Should return 403 when logged in as an owner', async () => {
    const response = await updateReview(app, owner, review.id, { rating: 3 })
    expect(response.status).toBe(403)
  })
  it('Should return 403 when the review belongs to another customer', async () => {
    const response = await updateReview(app, otherCustomer, review.id, { rating: 3 })
    expect(response.status).toBe(403)
  })
  it('Should return 404 when trying to update a nonexistent review', async () => {
    const response = await updateReview(app, customer, 'invalidReviewId', { rating: 3 })
    expect(response.status).toBe(404)
  })
  it('Should return 422 when the rating is out of range', async () => {
    const response = await updateReview(app, customer, review.id, { rating: 0 })
    expect(response.status).toBe(422)
    const errorFields = response.body.errors.map(error => error.param)
    expect(errorFields).toContain('rating')
  })
  it('Should return 422 when the comment exceeds the maximum length', async () => {
    const tooLongComment = 'a'.repeat(501)
    const response = await updateReview(app, customer, review.id, { comment: tooLongComment })
    expect(response.status).toBe(422)
    const errorFields = response.body.errors.map(error => error.param)
    expect(errorFields).toContain('comment')
  })
  it('Should return 200 and update the review when valid', async () => {
    const response = await updateReview(app, customer, review.id, { rating: 2, comment: 'Updated comment' })
    expect(response.status).toBe(200)
    expect(response.body.rating).toBe(2)
    expect(response.body.comment).toBe('Updated comment')
    const stored = await Review.findByPk(review.id)
    expect(stored.rating).toBe(2)
    expect(stored.comment).toBe('Updated comment')
  })
  afterAll(async () => {
    await shutdownApp()
  })
})

describe('Delete review', () => {
  let app, customer, owner, restaurant, otherCustomer
  beforeAll(async () => {
    app = await getApp()
    customer = await getLoggedInCustomer()
    owner = await getLoggedInOwner()
    restaurant = await getFirstRestaurantOfOwner(owner)
    otherCustomer = await getNewLoggedInCustomer()
  })
  it('Should return 401 if not logged in', async () => {
    const order = await createTestOrder(customer, restaurant)
    const review = await createTestReview(order)
    const response = await request(app).delete(`/reviews/${review.id}`).send()
    expect(response.status).toBe(401)
  })
  it('Should return 403 when logged in as an owner', async () => {
    const order = await createTestOrder(customer, restaurant)
    const review = await createTestReview(order)
    const response = await deleteReview(app, owner, review.id)
    expect(response.status).toBe(403)
  })
  it('Should return 403 when the review belongs to another customer', async () => {
    const order = await createTestOrder(customer, restaurant)
    const review = await createTestReview(order)
    const response = await deleteReview(app, otherCustomer, review.id)
    expect(response.status).toBe(403)
  })
  it('Should return 404 when trying to delete a nonexistent review', async () => {
    const response = await deleteReview(app, customer, 'invalidReviewId')
    expect(response.status).toBe(404)
  })
  it('Should return 200 and remove the review', async () => {
    const order = await createTestOrder(customer, restaurant)
    const review = await createTestReview(order)
    const response = await deleteReview(app, customer, review.id)
    expect(response.status).toBe(200)
    const stored = await Review.findByPk(review.id)
    expect(stored).toBeNull()
    const listResponse = await request(app).get('/reviews/customer').set('Authorization', `Bearer ${customer.token}`).send()
    expect(listResponse.body.some(item => item.id === review.id)).toBe(false)
  })
  afterAll(async () => {
    await shutdownApp()
  })
})
