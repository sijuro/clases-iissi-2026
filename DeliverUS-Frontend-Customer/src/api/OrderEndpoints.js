import { get } from './helpers/ApiRequestsHelper'

function getOrderDetail(id) {
  return get(`orders/${id}`)
}

export { getOrderDetail }
