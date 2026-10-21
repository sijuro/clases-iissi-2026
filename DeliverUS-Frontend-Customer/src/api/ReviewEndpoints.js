import { get, destroy, post, patch } from './helpers/ApiRequestsHelper'

function getMyReviews() {
  return get('reviews/customer')
}

function deleteReview(reviewId) {
  return destroy(`reviews/${reviewId}`)
}

function addReview(orderId, data) {
  return post(`orders/${orderId}/reviews`, data)
}

function editReview(reviewId, data) {
  return patch(`reviews/${reviewId}`, data)
}

export { getMyReviews, deleteReview, addReview, editReview }
