import React, { useCallback, useContext, useState } from 'react'
import { FlatList, StyleSheet } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { showMessage } from 'react-native-flash-message'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { API_BASE_URL } from '@env'

import TextSemiBold from '../../components/TextSemiBold'
import TextRegular from '../../components/TextRegular'
import ImageCard from '../../components/ImageCard'
import { getOrders } from '../../api/OrderEndpoints'
import { AuthorizationContext } from '../../context/AuthorizationContext'
import * as GlobalStyles from '../../styles/GlobalStyles'
import restaurantLogo from '../../../assets/restaurantLogo.jpeg'

export default function MyOrdersScreen({ navigation }) {
  const [orders, setOrders] = useState([])
  const { loggedInUser } = useContext(AuthorizationContext)

  useFocusEffect(
    useCallback(() => {
      if (loggedInUser) {
        fetchOrders()
      } else {
        setOrders([])
      }
    }, [loggedInUser])
  )

  const fetchOrders = async () => {
    try {
      const fetchedOrders = await getOrders()
      setOrders(fetchedOrders)
    } catch (error) {
      showMessage({
        message: `There was an error while retrieving orders. ${error} `,
        type: 'error',
        style: GlobalStyles.flashStyle,
        titleStyle: GlobalStyles.flashTextStyle
      })
    }
  }

  const renderOrder = ({ item }) => {
    return (
      <ImageCard
        imageUri={
          item.restaurant?.logo
            ? { uri: API_BASE_URL + '/' + item.restaurant.logo }
            : restaurantLogo
        }
        onPress={() => {
          navigation.navigate('EditOrderScreen', { id: item.id })
        }}
        title={`Order #${item.id} - ${item.restaurant?.name}`}
      >
        <TextSemiBold>
          <MaterialCommunityIcons
            name="map-marker"
            size={14}
            color={GlobalStyles.brandPrimary}
          />{' '}
          <TextRegular textStyle={{ color: GlobalStyles.brandPrimary }}>
            {item.address}
          </TextRegular>
        </TextSemiBold>
        <TextSemiBold>
          <MaterialCommunityIcons name="cash" size={14} color={'#555'} />{' '}
          <TextRegular>{item.price.toFixed(2)}€</TextRegular>
        </TextSemiBold>
        {item.couponId && (
          <TextSemiBold>
            <MaterialCommunityIcons
              name="ticket-percent"
              size={14}
              color={GlobalStyles.brandGreen}
            />{' '}
            <TextRegular textStyle={{ color: GlobalStyles.brandGreen }}>
              Coupon {item.coupon?.code}: -{item.couponDiscount.toFixed(2)}€
            </TextRegular>
          </TextSemiBold>
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
    <FlatList
      style={styles.container}
      data={orders}
      renderItem={renderOrder}
      keyExtractor={item => item.id.toString()}
      ListEmptyComponent={renderEmptyOrdersList}
    />
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  emptyList: {
    textAlign: 'center',
    padding: 50
  }
})
