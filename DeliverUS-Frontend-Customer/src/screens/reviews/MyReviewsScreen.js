import { useContext, useEffect, useState } from 'react'
import { StyleSheet, FlatList, View } from 'react-native'

import { getMyReviews } from '../../api/ReviewEndpoints'
import TextSemiBold from '../../components/TextSemiBold'
import TextRegular from '../../components/TextRegular'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import * as GlobalStyles from '../../styles/GlobalStyles'
import { AuthorizationContext } from '../../context/AuthorizationContext'
import { showMessage } from 'react-native-flash-message'

const formatDate = dateString => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString()
}

export default function MyReviewsScreen() {
  const [reviews, setReviews] = useState([])
  const { loggedInUser } = useContext(AuthorizationContext)

  useEffect(() => {
    if (loggedInUser) {
      fetchReviews()
    } else {
      setReviews([])
    }
  }, [loggedInUser])

  const fetchReviews = async () => {
    try {
      const fetchedReviews = await getMyReviews()
      setReviews(fetchedReviews)
    } catch (error) {
      showMessage({
        message: `There was an error while retrieving your reviews. ${error} `,
        type: 'error',
        style: GlobalStyles.flashStyle,
        titleStyle: GlobalStyles.flashTextStyle
      })
    }
  }

  const renderStars = rating => {
    const stars = []
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <MaterialCommunityIcons
          key={i}
          name={i <= rating ? 'star' : 'star-outline'}
          size={18}
          color={GlobalStyles.brandPrimary}
        />
      )
    }
    return stars
  }

  const renderReview = ({ item }) => {
    return (
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <MaterialCommunityIcons
            name="store"
            size={18}
            color={GlobalStyles.brandPrimary}
          />
          <TextSemiBold textStyle={styles.restaurant}>
            {item.restaurant
              ? item.restaurant.name
              : `Restaurant #${item.restaurantId}`}
          </TextSemiBold>
        </View>
        <View style={styles.starsRow}>{renderStars(item.rating)}</View>
        {item.comment ? (
          <TextRegular numberOfLines={3}>{item.comment}</TextRegular>
        ) : (
          <TextRegular textStyle={styles.noComment}>No comment</TextRegular>
        )}
        <TextRegular textStyle={styles.detail}>
          <MaterialCommunityIcons
            name="receipt"
            size={14}
            color={GlobalStyles.brandBlue}
          />{' '}
          Order #{item.orderId} · {formatDate(item.createdAt)}
        </TextRegular>
      </View>
    )
  }

  const renderEmptyReviewsList = () => {
    return (
      <TextRegular textStyle={styles.emptyList}>
        No reviews were retrieved. Are you logged in?
      </TextRegular>
    )
  }

  return (
    <FlatList
      style={styles.container}
      data={reviews}
      renderItem={renderReview}
      keyExtractor={item => item.id.toString()}
      ListEmptyComponent={renderEmptyReviewsList}
    />
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 8,
    marginHorizontal: 12,
    marginVertical: 6,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: GlobalStyles.brandPrimary
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6
  },
  restaurant: {
    fontSize: 16,
    marginLeft: 6,
    flex: 1
  },
  starsRow: {
    flexDirection: 'row',
    marginBottom: 6
  },
  noComment: {
    color: '#888',
    fontStyle: 'italic'
  },
  detail: {
    fontSize: 13,
    color: '#555',
    marginTop: 6
  },
  emptyList: {
    textAlign: 'center',
    padding: 50
  }
})
