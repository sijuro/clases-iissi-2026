import { get, post, put, destroy, patch } from './helpers/ApiRequestsHelper'

function getAvailableOrders() {
  return get('orders/available')
}

function getOrderDetail(id) {
  return get(`orders/${id}`)
}

function acceptOrder(id) {
  return patch(`orders/${id}/accept`)
}

export { getAvailableOrders, getOrderDetail, acceptOrder }
