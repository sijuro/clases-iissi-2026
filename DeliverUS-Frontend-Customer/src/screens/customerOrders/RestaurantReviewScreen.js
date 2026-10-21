import React, { useCallback, useContext, useState } from 'react'
import { FlatList, Image, StyleSheet, View } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { showMessage } from 'react-native-flash-message'
import { API_BASE_URL } from '@env'
import { getReviewsRestaurant } from '../../api/ReviewEndpoints'
import TextRegular from '../../components/TextRegular'
import TextSemiBold from '../../components/TextSemiBold'
import * as GlobalStyles from '../../styles/GlobalStyles'
import { AuthorizationContext } from '../../context/AuthorizationContext'
import defaultRestaurantLogo from '../../../assets/restaurantLogo.jpeg'
import defaultAvatar from '../../../assets/maleAvatar.png'

const formatDate = dateString => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString()
}

export default function RestaurantReviewScreen({ route }) {
  const restaurant = route.params.restaurant
  const [reviews, setReviews] = useState([])
  const { loggedInUser } = useContext(AuthorizationContext)

  const fetchRestaurantReviews = useCallback(async () => {
    try {
      const fetchedReviews = await getReviewsRestaurant(restaurant.id)
      setReviews(fetchedReviews)
    } catch (error) {
      showMessage({
        message: `There was an error while retrieving reviews from restaurant. ${error}`,
        type: 'error',
        style: GlobalStyles.flashStyle,
        titleStyle: GlobalStyles.flashTextStyle
      })
    }
  }, [restaurant.id])

  useFocusEffect(
    useCallback(() => {
      if (loggedInUser) {
        fetchRestaurantReviews()
      } else {
        setReviews([])
      }
    }, [loggedInUser, fetchRestaurantReviews])
  )

  const averageRating = reviews.length
    ? reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length
    : 0

  const renderHeader = () => {
    return (
      <View style={styles.header}>
        <Image
          style={styles.logo}
          source={
            restaurant.logo
              ? {
                  uri: API_BASE_URL + '/' + restaurant.logo,
                  cache: 'force-cache'
                }
              : defaultRestaurantLogo
          }
        />
        <TextSemiBold textStyle={styles.restaurantName}>
          {restaurant.name}
        </TextSemiBold>
        <View>
          <TextRegular>Average rating: {averageRating}</TextRegular>
          <TextRegular>Number of reviews: {reviews.length}</TextRegular>
        </View>
      </View>
    )
  }

  const renderReview = ({ item }) => {
    return (
      <View>
        <TextSemiBold>{item.user?.firstName ?? 'Customer'}</TextSemiBold>
        <View>{item.rating}</View>
        <TextRegular>{item.comment || 'No comment'}</TextRegular>
      </View>
    )
  }

  return (
    <FlatList
      style={styles.container}
      data={reviews}
      renderItem={renderReview}
      keyExtractor={item => item.id.toString()}
      ListHeaderComponent={renderHeader}
    />
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  header: {
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc'
  },
  logo: {
    width: 90,
    height: 90,
    borderRadius: 12
  },
  restaurantName: {
    fontSize: 20,
    marginTop: 10
  },
  averageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6
  },
  averageText: {
    marginLeft: 6,
    color: '#555'
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
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18
  },
  reviewerInfo: {
    flex: 1,
    marginLeft: 8
  },
  date: {
    fontSize: 12,
    color: '#777'
  },
  starsRow: {
    flexDirection: 'row'
  },
  noComment: {
    color: '#888',
    fontStyle: 'italic'
  },
  emptyList: {
    textAlign: 'center',
    padding: 50
  }
})
