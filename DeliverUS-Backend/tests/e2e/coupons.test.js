import request from 'supertest'
import { shutdownApp, getApp } from './utils/testApp'
import { getLoggedInCustomer, getLoggedInOwner, getNewLoggedInCustomer } from './utils/auth'
import { getFirstRestaurantOfOwner } from './utils/restaurant'
import { generateFakeUser } from './utils/testData'
import { Order, Coupon } from '../../src/models/models.js'

// NOTE: POST /orders (order creation) is not implemented yet in this branch, so order
// fixtures are created directly through the Order model instead of the customer-facing
// endpoint. The coupon workflow endpoints under test (available/applyCoupon/removeCoupon/
// customerComments/indexCustomer) are exercised through the real HTTP API.

const createTestOrder = async (customer, restaurant, overrides = {}) => {
  const order = await Order.create({
    address: 'Fake street 123',
    price: 30,
    shippingCosts: restaurant.shippingCosts,
    restaurantId: restaurant.id,
    userId: customer.id,
    ...overrides
  })
  return order.toJSON()
}

const createTestCoupon = async (overrides = {}) => {
  const coupon = await Coupon.create({
    code: `TEST${Math.floor(Math.random() * 1000000)}`,
    description: 'Test coupon',
    discountPercentage: 10,
    minPrice: 0,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    maxUses: 100,
    usedCount: 0,
    ...overrides
  })
  return coupon.toJSON()
}

const applyCoupon = (app, user, orderId, body) => {
  return request(app).patch(`/orders/${orderId}/applyCoupon`).set('Authorization', `Bearer ${user.token}`).send(body)
}

const removeCoupon = (app, user, orderId) => {
  return request(app).patch(`/orders/${orderId}/removeCoupon`).set('Authorization', `Bearer ${user.token}`).send()
}

const updateCustomerComments = (app, user, orderId, customerComments) => {
  return request(app).patch(`/orders/${orderId}/customerComments`).set('Authorization', `Bearer ${user.token}`).send({ customerComments })
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

describe('Get available coupons', () => {
  let app, customer, owner, validCoupon, expiredCoupon, exhaustedCoupon
  beforeAll(async () => {
    app = await getApp()
    customer = await getLoggedInCustomer()
    owner = await getLoggedInOwner()
    validCoupon = await createTestCoupon()
    expiredCoupon = await createTestCoupon({ expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000) })
    exhaustedCoupon = await createTestCoupon({ maxUses: 1, usedCount: 1 })
  })
  it('Should return 401 if not logged in', async () => {
    const response = await request(app).get('/coupons/available').send()
    expect(response.status).toBe(401)
  })
  it('Should return 403 when logged in as an owner', async () => {
    const response = await request(app).get('/coupons/available').set('Authorization', `Bearer ${owner.token}`).send()
    expect(response.status).toBe(403)
  })
  it('Should return 200 when logged in as a customer', async () => {
    const response = await request(app).get('/coupons/available').set('Authorization', `Bearer ${customer.token}`).send()
    expect(response.status).toBe(200)
    expect(Array.isArray(response.body)).toBe(true)
  })
  it('Should include valid coupons', async () => {
    const response = await request(app).get('/coupons/available').set('Authorization', `Bearer ${customer.token}`).send()
    expect(response.body.some(coupon => coupon.id === validCoupon.id)).toBe(true)
  })
  it('Should not include expired coupons', async () => {
    const response = await request(app).get('/coupons/available').set('Authorization', `Bearer ${customer.token}`).send()
    expect(response.body.some(coupon => coupon.id === expiredCoupon.id)).toBe(false)
  })
  it('Should not include fully used coupons', async () => {
    const response = await request(app).get('/coupons/available').set('Authorization', `Bearer ${customer.token}`).send()
    expect(response.body.some(coupon => coupon.id === exhaustedCoupon.id)).toBe(false)
  })
  afterAll(async () => {
    await shutdownApp()
  })
})

describe('Apply coupon', () => {
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
    const coupon = await createTestCoupon()
    const response = await request(app).patch(`/orders/${order.id}/applyCoupon`).send({ code: coupon.code })
    expect(response.status).toBe(401)
  })
  it('Should return 403 when logged in as an owner', async () => {
    const order = await createTestOrder(customer, restaurant)
    const coupon = await createTestCoupon()
    const response = await applyCoupon(app, owner, order.id, { code: coupon.code })
    expect(response.status).toBe(403)
  })
  it('Should return 403 when the order belongs to another customer', async () => {
    const order = await createTestOrder(customer, restaurant)
    const coupon = await createTestCoupon()
    const response = await applyCoupon(app, otherCustomer, order.id, { code: coupon.code })
    expect(response.status).toBe(403)
  })
  it('Should return 404 when trying to apply a coupon to a nonexistent order', async () => {
    const coupon = await createTestCoupon()
    const response = await applyCoupon(app, customer, 'invalidOrderId', { code: coupon.code })
    expect(response.status).toBe(404)
  })
  it('Should return 422 when the coupon code is missing', async () => {
    const order = await createTestOrder(customer, restaurant)
    const response = await applyCoupon(app, customer, order.id, {})
    expect(response.status).toBe(422)
    const errorFields = response.body.errors.map(error => error.param)
    expect(errorFields).toContain('code')
  })
  it('Should return 404 when the coupon does not exist', async () => {
    const order = await createTestOrder(customer, restaurant)
    const response = await applyCoupon(app, customer, order.id, { code: 'THISCOUPONDOESNOTEXIST' })
    expect(response.status).toBe(404)
  })
  it('Should return 409 when the order is not pending', async () => {
    const order = await createTestOrder(customer, restaurant, { startedAt: new Date() })
    const coupon = await createTestCoupon()
    const response = await applyCoupon(app, customer, order.id, { code: coupon.code })
    expect(response.status).toBe(409)
  })
  it('Should return 409 when the order already has a coupon', async () => {
    const coupon = await createTestCoupon()
    const order = await createTestOrder(customer, restaurant, { couponId: coupon.id, couponDiscount: 3, price: 27 })
    const response = await applyCoupon(app, customer, order.id, { code: coupon.code })
    expect(response.status).toBe(409)
  })
  it('Should return 409 when the order price is below the coupon minimum', async () => {
    const order = await createTestOrder(customer, restaurant, { price: 5 })
    const coupon = await createTestCoupon({ minPrice: 20 })
    const response = await applyCoupon(app, customer, order.id, { code: coupon.code })
    expect(response.status).toBe(409)
  })
  it('Should return 409 when the coupon is expired', async () => {
    const order = await createTestOrder(customer, restaurant)
    const coupon = await createTestCoupon({ expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000) })
    const response = await applyCoupon(app, customer, order.id, { code: coupon.code })
    expect(response.status).toBe(409)
  })
  it('Should return 409 when the coupon has no uses left', async () => {
    const order = await createTestOrder(customer, restaurant)
    const coupon = await createTestCoupon({ maxUses: 1, usedCount: 1 })
    const response = await applyCoupon(app, customer, order.id, { code: coupon.code })
    expect(response.status).toBe(409)
  })
  it('Should return 200 and apply the discount to the order', async () => {
    const order = await createTestOrder(customer, restaurant, { price: 30 })
    const coupon = await createTestCoupon({ discountPercentage: 10, minPrice: 10, maxUses: 100, usedCount: 0 })
    const response = await applyCoupon(app, customer, order.id, { code: coupon.code })
    expect(response.status).toBe(200)
    expect(response.body.couponId).toBe(coupon.id)
    expect(response.body.couponDiscount).toBeCloseTo(3, 2)
    expect(response.body.price).toBeCloseTo(27, 2)
    const updatedCoupon = await Coupon.findByPk(coupon.id)
    expect(updatedCoupon.usedCount).toBe(1)
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
    pendingOrder = await createTestOrder(customer, restaurant)
    deliveredOrder = await createTestOrder(customer, restaurant, { startedAt: new Date(), sentAt: new Date(), deliveredAt: new Date() })
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
  afterAll(async () => {
    await shutdownApp()
  })
})

describe('Remove coupon', () => {
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
    const response = await request(app).patch(`/orders/${order.id}/removeCoupon`).send()
    expect(response.status).toBe(401)
  })
  it('Should return 403 when logged in as an owner', async () => {
    const order = await createTestOrder(customer, restaurant)
    const response = await removeCoupon(app, owner, order.id)
    expect(response.status).toBe(403)
  })
  it('Should return 403 when the order belongs to another customer', async () => {
    const order = await createTestOrder(customer, restaurant)
    const response = await removeCoupon(app, otherCustomer, order.id)
    expect(response.status).toBe(403)
  })
  it('Should return 404 when trying to remove a coupon from a nonexistent order', async () => {
    const response = await removeCoupon(app, customer, 'invalidOrderId')
    expect(response.status).toBe(404)
  })
  it('Should return 409 when the order has no coupon', async () => {
    const order = await createTestOrder(customer, restaurant)
    const response = await removeCoupon(app, customer, order.id)
    expect(response.status).toBe(409)
  })
  it('Should return 409 when the order is not pending', async () => {
    const coupon = await createTestCoupon()
    const order = await createTestOrder(customer, restaurant, { startedAt: new Date(), couponId: coupon.id, couponDiscount: 3, price: 27 })
    const response = await removeCoupon(app, customer, order.id)
    expect(response.status).toBe(409)
  })
  it('Should return 200, restore the price and free the coupon', async () => {
    const coupon = await createTestCoupon({ usedCount: 1, maxUses: 100 })
    const order = await createTestOrder(customer, restaurant, { couponId: coupon.id, couponDiscount: 3, price: 27 })
    const response = await removeCoupon(app, customer, order.id)
    expect(response.status).toBe(200)
    expect(response.body.couponId).toBeNull()
    expect(response.body.couponDiscount).toBeNull()
    expect(response.body.price).toBeCloseTo(30, 2)
    const updatedCoupon = await Coupon.findByPk(coupon.id)
    expect(updatedCoupon.usedCount).toBe(0)
  })
  afterAll(async () => {
    await shutdownApp()
  })
})

describe('Update customer comments', () => {
  let app, customer, owner, restaurant, otherCustomer, order
  beforeAll(async () => {
    app = await getApp()
    customer = await getLoggedInCustomer()
    owner = await getLoggedInOwner()
    restaurant = await getFirstRestaurantOfOwner(owner)
    otherCustomer = await getNewLoggedInCustomer()
    order = await createTestOrder(customer, restaurant)
  })
  it('Should return 401 if not logged in', async () => {
    const response = await request(app).patch(`/orders/${order.id}/customerComments`).send({ customerComments: 'Leave at the door' })
    expect(response.status).toBe(401)
  })
  it('Should return 403 when logged in as an owner', async () => {
    const response = await updateCustomerComments(app, owner, order.id, 'Leave at the door')
    expect(response.status).toBe(403)
  })
  it('Should return 403 when the order belongs to another customer', async () => {
    const response = await updateCustomerComments(app, otherCustomer, order.id, 'Leave at the door')
    expect(response.status).toBe(403)
  })
  it('Should return 404 when trying to comment a nonexistent order', async () => {
    const response = await updateCustomerComments(app, customer, 'invalidOrderId', 'Leave at the door')
    expect(response.status).toBe(404)
  })
  it('Should return 422 when customerComments exceeds the maximum length', async () => {
    const tooLongComment = 'a'.repeat(501)
    const response = await updateCustomerComments(app, customer, order.id, tooLongComment)
    expect(response.status).toBe(422)
    const errorFields = response.body.errors.map(error => error.param)
    expect(errorFields).toContain('customerComments')
  })
  it('Should return 200 and update the customer comments when valid', async () => {
    const response = await updateCustomerComments(app, customer, order.id, 'Leave at the door, please ring the bell')
    expect(response.status).toBe(200)
    expect(response.body.customerComments).toBe('Leave at the door, please ring the bell')
  })
  it('Should return 200 and allow clearing the customer comments', async () => {
    const response = await updateCustomerComments(app, customer, order.id, '')
    expect(response.status).toBe(200)
  })
  afterAll(async () => {
    await shutdownApp()
  })
})
