import { get } from './helpers/ApiRequestsHelper'

function getMyReviews() {
  return get('reviews/customer')
}

export { getMyReviews }
