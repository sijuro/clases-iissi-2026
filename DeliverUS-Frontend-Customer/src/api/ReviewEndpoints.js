import { get, destroy, post, patch } from './helpers/ApiRequestsHelper'

function getMyReviews() {
  return get('reviews/customer')
}

function deleteReview(id) {
  return destroy(`reviews/${id}`)
}

function addReview(id) {
  return post(`orders/${id}/reviews`)
}

function editReview(id) {
  return patch(`reviews/${id}`)
}

export { getMyReviews, deleteReview, addReview, editReview }
