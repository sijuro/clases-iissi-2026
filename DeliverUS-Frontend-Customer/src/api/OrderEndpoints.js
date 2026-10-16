import { get } from './helpers/ApiRequestsHelper'

function getOrderDetail(id) {
  return get(`orders/${id}`)
}

function getMyOrders() {
  return get('/orders/customer')
}

export { getOrderDetail, getMyOrders }
