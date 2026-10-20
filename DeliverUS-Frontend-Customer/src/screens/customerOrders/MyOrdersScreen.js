import React, { useContext, useEffect, useState } from 'react'
import { View, FlatList, StyleSheet, Pressable } from 'react-native'
import TextSemiBold from '../../components/TextSemiBold'
import TextRegular from '../../components/TextRegular'
import ImageCard from '../../components/ImageCard'
import { getMyOrders } from '../../api/OrderEndpoints'
import { AuthorizationContext } from '../../context/AuthorizationContext'
import { showMessage } from 'react-native-flash-message'
import * as GlobalStyles from '../../styles/GlobalStyles'
import defaultProductImage from '../../../assets/product.jpeg'
import { API_BASE_URL } from '@env'
import { deleteReview } from '../../api/ReviewEndpoints'
import { MaterialCommunityIcons } from '@expo/vector-icons'

export default function MyOrdersScreen({ navigation }) {
  const [orders, setOrders] = useState([])
  const { loggedInUser } = useContext(AuthorizationContext)

  useEffect(() => {
    if (loggedInUser) {
      fetchOrders()
    } else {
      setOrders([])
    }
  }, [loggedInUser])

  const fetchOrders = async () => {
    try {
      const fetchedOrders = await getMyOrders()
      setOrders(fetchedOrders)
    } catch (error) {
      showMessage({
        message: `There was an error while retrieving your orders. ${error} `,
        type: 'error',
        style: GlobalStyles.flashStyle,
        titleStyle: GlobalStyles.flashTextStyle
      })
    }
  }

  const handleDeleteReview = async id => {
    try {
      await deleteReview(id)
      await fetchOrders()
    } catch (error) {
      showMessage({
        message: `There was an error while deleting the review. ${error} `,
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

  const renderOrder = ({ item }) => {
    return (
      <ImageCard
        imageUri={
          item.restaurant?.logo
            ? { uri: API_BASE_URL + '/' + item.restaurant.logo }
            : defaultProductImage
        }
        title={`Order #${item.id}`}
      >
        <TextSemiBold>{item.restaurant?.name}</TextSemiBold>
        <TextRegular>{item.address}</TextRegular>
        <TextRegular>{item.price?.toFixed(2)}€</TextRegular>

        {item.review ? (
          <View style={styles.reviewContainer}> // TODO
            <View style={styles.starsRow}>
              {renderStars(item.review.rating)}
            </View>
            {item.review.comment ? (
              <TextRegular numberOfLines={3}>{item.review.comment}</TextRegular>
            ) : (
              <TextRegular textStyle={styles.noComment}>No comment</TextRegular>
            )}
            <Pressable
              onPress={() =>
                navigation.navigate('EditReviewScreen', {
                  id: item.id,
                  review: item.review
                })
              }
              style={({ pressed }) => [
                {
                  backgroundColor: pressed
                    ? GlobalStyles.brandBackground
                    : GlobalStyles.brandGreen
                }
              ]}
            >
              {/* <MaterialCommunityIcons name="pencil" size={14} color="white" />{' '} */}
              <TextRegular>Edit review</TextRegular>
            </Pressable>
            <Pressable
              onPress={() => handleDeleteReview(item.review.id)}
              style={({ pressed }) => [
                {
                  backgroundColor: pressed
                    ? GlobalStyles.brandBackground
                    : GlobalStyles.brandPrimary
                }
              ]}
            >
              <MaterialCommunityIcons name="delete" size={14} color="white" />{' '}
              <TextRegular>Delete review</TextRegular>
            </Pressable>
          </View>
        ) : item.deliveredAt ? (
          <Pressable
            onPress={() =>
              navigation.navigate('EditReviewScreen', {
                id: item.id
              })
            }
            style={({ pressed }) => [
              {
                backgroundColor: pressed
                  ? GlobalStyles.brandBackground
                  : GlobalStyles.brandGreen
              }
            ]}
          >
            Write review
          </Pressable>
        ) : (
          <TextRegular textStyle={styles.noComment}>
            Order not delivered
          </TextRegular>
        )}
      </ImageCard>
    )
  }

  const renderEmptyOrdersList = () => {
    return (
      <TextRegular textStyle={styles.emptyList}>
        You have no orders yet.
      </TextRegular>
    )
  }

  return (
    <View style={styles.container}>
      <FlatList
        style={styles.container}
        data={orders}
        renderItem={renderOrder}
        keyExtractor={item => item.id.toString()}
        ListEmptyComponent={renderEmptyOrdersList}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  emptyList: {
    textAlign: 'center',
    padding: 50
  },
  starsRow: {
    flexDirection: 'row',
    marginBottom: 6
  },
  noComment: {
    color: '#888',
    fontStyle: 'italic'
  },
  reviewContainer: {

  }
})
