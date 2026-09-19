import { get } from './helpers/ApiRequestsHelper'

function getAvailableCoupons() {
  return get('coupons/available')
}

export { getAvailableCoupons }
