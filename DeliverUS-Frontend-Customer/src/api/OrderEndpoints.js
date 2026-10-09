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

function updateCustomerComments (id, customerComments) {
  return patch(`orders/${id}/customerComments`, { customerComments })
}

export { getOrderDetail, getOrders, removeCoupon, applyCoupon, updateCustomerComments }
