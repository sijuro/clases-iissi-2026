import { get, post, put, destroy, patch } from './helpers/ApiRequestsHelper'

function getAvailableOrders() {
  return get('orders/available')
}

function getMyOrders() {
  return get('orders/rider')
}

function getOrderDetail(id) {
  return get(`orders/${id}`)
}

function acceptOrder(id) {
  return patch(`orders/${id}/accept`)
}

function updateRiderComments(id, riderComments) {
  return patch(`orders/${id}/riderComments`, { riderComments })
}

function confirmPickup(id) {
  return patch(`orders/${id}/pickup`)
}

function deliverOrder(id) {
  return patch(`orders/${id}/riderDeliver`)
}

export {
  getAvailableOrders,
  getMyOrders,
  getOrderDetail,
  acceptOrder,
  updateRiderComments,
  confirmPickup,
  deliverOrder
}
