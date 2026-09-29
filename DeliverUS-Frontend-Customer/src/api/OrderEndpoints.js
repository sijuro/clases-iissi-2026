import { get, patch } from './helpers/ApiRequestsHelper'

function getOrderDetail(id) {
  return get(`orders/${id}`)
}

function getOrders() {
  return get('orders/customer')
}

function removeCoupon (id) {
  return patch(`orders/${id}/removeCoupon`)
}

function applyCoupon (id, code) {
  return patch(`orders/${id}/applyCoupon`, { code })
}

function updateCustomerComments (id, comment) {
  return patch(`orders/${id}/customerComments`, { comment })
}

export { getOrderDetail, getOrders, removeCoupon, applyCoupon, updateCustomerComments }
