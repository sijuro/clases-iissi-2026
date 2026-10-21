import React, { useEffect, useState } from 'react'
import {
  StyleSheet,
  View,
  FlatList,
  ImageBackground,
  Image,
  Pressable
} from 'react-native'
import { showMessage } from 'react-native-flash-message'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { getOrderDetail } from '../../api/OrderEndpoints'
import ImageCard from '../../components/ImageCard'
import TextRegular from '../../components/TextRegular'
import TextSemiBold from '../../components/TextSemiBold'
import * as GlobalStyles from '../../styles/GlobalStyles'
import defaultProductImage from '../../../assets/product.jpeg'
import restaurantLogo from '../../../assets/restaurantLogo.jpeg'
import { API_BASE_URL } from '@env'

import { Formik } from 'formik'
import * as yup from 'yup'
import InputItem from '../../components/InputItem'
import { addReview, editReview } from '../../api/ReviewEndpoints'

import TextError from '../../components/TextError'

const getElapsedMinutes = dateString => {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now - date
  return Math.floor(diffMs / 60000)
}

export default function EditReviewScreen({ navigation, route }) {
  const [order, setOrder] = useState({})
  const [backendErrors, setBackendErrors] = useState([])
  const review = route.params?.review

  useEffect(() => {
    fetchOrderDetail()
  }, [route])

  const validationSchema = yup.object().shape({
    rating: yup
      .number()
      .typeError('Rating must be a number')
      .integer('Ratings must be an integer')
      .min(1, 'Rating must be higher than 1')
      .max(5, 'Ratings must be lower than 5')
      .required(),

    comment: yup.string().max(500, 'Comment length must be lower than 500')
  })

  const submitReview = async values => {
    setBackendErrors([])

    try {
      const payload = {
        rating: Number(values.rating),
        comment: values.comment
      }

      if (review) {
        await editReview(review.id, payload)
      } else {
        await addReview(route.params.id, payload)
      }
      navigation.goBack()
    } catch (error) {
      setBackendErrors(error.errors)
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

  const renderReviewForm = () => {
    const initialValues = {
      rating: review?.rating?.toString() ?? '',
      comment: review?.comment ?? ''
    }
    return (
      <Formik
        validationSchema={validationSchema}
        initialValues={initialValues}
        onSubmit={submitReview}
      >
        {({ handleSubmit }) => (
          <View style={{ alignItems: 'center' }}>
            <View style={styles.starsRow}>
              {renderStars(initialValues.rating)}
            </View>
            <InputItem
              name="rating"
              label="Ratings:"
              placeholder={initialValues.rating}
            />
            <InputItem
              name="comment"
              label="Comments"
              placeholder={initialValues.comment}
            />

            {backendErrors &&
              backendErrors.map((error, index) => (
                <TextError key={index}>
                  {error.param}-{error.msg}
                </TextError>
              ))}

            <Pressable
              onPress={handleSubmit}
              style={({ pressed }) => [
                {
                  backgroundColor: pressed
                    ? GlobalStyles.brandSuccessTap
                    : GlobalStyles.brandSuccess
                },
                styles.button
              ]}
            >
              <MaterialCommunityIcons
                name="comment-text"
                size={14}
                color="white"
              />{' '}
              <TextRegular textStyle={styles.text}>Save review</TextRegular>
            </Pressable>
          </View>
        )}
      </Formik>
    )
  }

  const renderHeader = () => {
    if (!order.restaurant) return null
    return (
      <View>
        <ImageBackground
          source={
            order.restaurant?.heroImage
              ? {
                  uri: API_BASE_URL + '/' + order.restaurant.heroImage,
                  cache: 'force-cache'
                }
              : undefined
          }
          style={styles.imageBackground}
        >
          <View style={styles.restaurantHeaderContainer}>
            <Image
              style={styles.image}
              source={
                order.restaurant.logo
                  ? {
                      uri: API_BASE_URL + '/' + order.restaurant.logo,
                      cache: 'force-cache'
                    }
                  : restaurantLogo
              }
            />
            <TextSemiBold textStyle={styles.textTitle}>
              {order.restaurant.name}
            </TextSemiBold>
            <TextRegular textStyle={styles.description}>
              <MaterialCommunityIcons name="store" size={14} color={'white'} />{' '}
              {order.restaurant.address}, {order.restaurant.postalCode}
            </TextRegular>
          </View>
        </ImageBackground>

        <View style={styles.orderInfoContainer}>
          <TextSemiBold textStyle={styles.orderInfoTitle}>
            Order #{order.id}
          </TextSemiBold>
          <TextRegular textStyle={styles.orderInfoText}>
            <MaterialCommunityIcons
              name="map-marker"
              size={14}
              color={GlobalStyles.brandPrimary}
            />{' '}
            Delivery address: {order.address}
          </TextRegular>
          <TextRegular textStyle={styles.orderInfoText}>
            <MaterialCommunityIcons
              name="cash"
              size={14}
              color={GlobalStyles.brandPrimary}
            />{' '}
            Total: {order.price.toFixed(2)}€
          </TextRegular>
          <TextRegular textStyle={styles.orderInfoText}>
            <MaterialCommunityIcons
              name="clock-outline"
              size={14}
              color={GlobalStyles.brandPrimary}
            />{' '}
            Ordered {getElapsedMinutes(order.createdAt)} min ago
          </TextRegular>
        </View>
      </View>
    )
  }

  const renderProduct = ({ item }) => {
    return (
      <ImageCard
        imageUri={
          item.image
            ? { uri: API_BASE_URL + '/' + item.image }
            : defaultProductImage
        }
        title={item.name}
      >
        <TextRegular numberOfLines={2}>{item.description}</TextRegular>
        <TextSemiBold textStyle={styles.price}>
          {item.price.toFixed(2)}€
        </TextSemiBold>
        <TextRegular>Quantity: {item.OrderProducts.quantity}</TextRegular>
      </ImageCard>
    )
  }

  const renderEmptyProductsList = () => {
    return (
      <TextRegular textStyle={styles.emptyList}>
        This order has no products.
      </TextRegular>
    )
  }

  const fetchOrderDetail = async () => {
    try {
      const fetchedOrder = await getOrderDetail(route.params.id)
      setOrder(fetchedOrder)
    } catch (error) {
      showMessage({
        message: `There was an error while retrieving order details (id ${route.params.id}). ${error}`,
        type: 'error',
        style: GlobalStyles.flashStyle,
        titleStyle: GlobalStyles.flashTextStyle
      })
    }
  }

  return (
    <View style={styles.container}>
      <FlatList
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyProductsList}
        ListFooterComponent={renderReviewForm}
        style={styles.container}
        data={order.products}
        renderItem={renderProduct}
        keyExtractor={item => item.id.toString()}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  restaurantHeaderContainer: {
    height: 250,
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    flexDirection: 'column',
    alignItems: 'center'
  },
  imageBackground: {
    flex: 1,
    resizeMode: 'cover',
    justifyContent: 'center'
  },
  image: {
    height: 100,
    width: 100,
    margin: 10
  },
  description: {
    color: 'white',
    marginTop: 4
  },
  textTitle: {
    fontSize: 20,
    color: 'white'
  },
  emptyList: {
    textAlign: 'center',
    padding: 50
  },
  price: {
    color: GlobalStyles.brandPrimary
  },
  orderInfoContainer: {
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc'
  },
  orderInfoTitle: {
    fontSize: 18,
    marginBottom: 5
  },
  orderInfoText: {
    fontSize: 14,
    color: '#333',
    marginVertical: 2
  },
  starsRow: {
    flexDirection: 'row',
    marginBottom: 6
  }
})
