import React, { useEffect, useState } from 'react'
import {
  StyleSheet,
  View,
  FlatList,
  ImageBackground,
  Image
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

const getElapsedMinutes = (dateString) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now - date
  return Math.floor(diffMs / 60000)
}

export default function OrderDetailScreen({ navigation, route }) {
  const [order, setOrder] = useState({})

  useEffect(() => {
    fetchOrderDetail()
  }, [route])

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
              <MaterialCommunityIcons name="store" size={14} color={'white'} /> {order.restaurant.address}, {order.restaurant.postalCode}
            </TextRegular>
          </View>
        </ImageBackground>

        <View style={styles.orderInfoContainer}>
          <TextSemiBold textStyle={styles.orderInfoTitle}>
            Order #{order.id}
          </TextSemiBold>
          <TextRegular textStyle={styles.orderInfoText}>
            <MaterialCommunityIcons name="map-marker" size={14} color={GlobalStyles.brandPrimary} /> Deliver to: {order.user.firstName} - {order.address}
          </TextRegular>
          <TextRegular textStyle={styles.orderInfoText}>
            <MaterialCommunityIcons name="cash" size={14} color={GlobalStyles.brandPrimary} /> Total: {order.price.toFixed(2)}€
          </TextRegular>
          <TextRegular textStyle={styles.orderInfoText}>
            <MaterialCommunityIcons name="clock-outline" size={14} color={GlobalStyles.brandPrimary} /> Ordered {getElapsedMinutes(order.createdAt)} min ago
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
        <TextRegular>
          Quantity: {item.OrderProducts.quantity}
        </TextRegular>
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
  }
})
