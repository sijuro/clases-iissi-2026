import { useContext, useEffect, useState } from 'react'
import { StyleSheet, FlatList, View, Pressable } from 'react-native'

import {
  getMyOrders,
  confirmPickup,
  deliverOrder
} from '../../api/OrderEndpoints'
import ImageCard from '../../components/ImageCard'
import TextSemiBold from '../../components/TextSemiBold'
import TextRegular from '../../components/TextRegular'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import * as GlobalStyles from '../../styles/GlobalStyles'
import { AuthorizationContext } from '../../context/AuthorizationContext'
import { showMessage } from 'react-native-flash-message'
import restaurantLogo from '../../../assets/restaurantLogo.jpeg'
import { API_BASE_URL } from '@env'

export default function MyOrdersScreen({ navigation, route }) {
  const [orders, setOrders] = useState([])
  const { loggedInUser } = useContext(AuthorizationContext)

  useEffect(() => {
    if (loggedInUser) {
      fetchOrders()
    } else {
      setOrders(null)
    }
  }, [loggedInUser, route])

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

  const handleConfirmPickup = async order => {
    try {
      await confirmPickup(order.id)
      showMessage({
        message: `Order #${order.id} confirmed as picked up!`,
        type: 'success',
        style: GlobalStyles.flashStyle,
        titleStyle: GlobalStyles.flashTextStyle
      })
      await fetchOrders()
    } catch (error) {
      showMessage({
        message: `Could not confirm pickup for order #${order.id}. ${error}`,
        type: 'error',
        style: GlobalStyles.flashStyle,
        titleStyle: GlobalStyles.flashTextStyle
      })
    }
  }

  const handleDeliver = async order => {
    try {
      await deliverOrder(order.id)
      showMessage({
        message: `Order #${order.id} delivered successfully!`,
        type: 'success',
        style: GlobalStyles.flashStyle,
        titleStyle: GlobalStyles.flashTextStyle
      })
      await fetchOrders()
    } catch (error) {
      showMessage({
        message: `Could not deliver order #${order.id}. ${error}`,
        type: 'error',
        style: GlobalStyles.flashStyle,
        titleStyle: GlobalStyles.flashTextStyle
      })
    }
  }

  const renderActionButton = item => {
    if (!item.sentAt) {
      return (
        <Pressable
          onPress={() => handleConfirmPickup(item)}
          style={({ pressed }) => [
            {
              backgroundColor: pressed
                ? GlobalStyles.brandBlueTap
                : GlobalStyles.brandBlue
            },
            styles.actionButton
          ]}
        >
          <View
            style={{ flex: 1, flexDirection: 'row', justifyContent: 'center' }}
          >
            <MaterialCommunityIcons name="moped" color={'white'} size={20} />
            <TextRegular textStyle={styles.text}>Confirm pickup</TextRegular>
          </View>
        </Pressable>
      )
    }
    if (!item.deliveredAt) {
      return (
        <Pressable
          onPress={() => handleDeliver(item)}
          style={({ pressed }) => [
            {
              backgroundColor: pressed
                ? GlobalStyles.brandGreenTap
                : GlobalStyles.brandGreen
            },
            styles.actionButton
          ]}
        >
          <View
            style={{ flex: 1, flexDirection: 'row', justifyContent: 'center' }}
          >
            <MaterialCommunityIcons
              name="package-variant-closed-check"
              color={'white'}
              size={20}
            />
            <TextRegular textStyle={styles.text}>Confirm delivery</TextRegular>
          </View>
        </Pressable>
      )
    }
    return null
  }

  const renderOrder = ({ item }) => {
    return (
      <ImageCard
        imageUri={
          item.restaurant.logo
            ? { uri: API_BASE_URL + '/' + item.restaurant.logo }
            : restaurantLogo
        }
        onPress={() => {
          navigation.navigate('EditOrderCommentsScreen', { id: item.id })
        }}
        title={`Order #${item.id} - ${item.restaurant.name}`}
      >
        <TextSemiBold>
          <MaterialCommunityIcons
            name="map-marker"
            size={14}
            color={GlobalStyles.brandPrimary}
          />{' '}
          <TextRegular textStyle={{ color: GlobalStyles.brandPrimary }}>
            {item.user.firstName} ({item.user.phone}) — {item.address}
          </TextRegular>
        </TextSemiBold>
        <TextSemiBold>
          <MaterialCommunityIcons name="cash" size={14} color={'#555'} />{' '}
          <TextRegular>{item.price.toFixed(2)}€</TextRegular>
        </TextSemiBold>
        <TextSemiBold>
          {item.deliveredAt ? (
            <TextRegular textStyle={{ color: GlobalStyles.brandGreen }}>
              Delivered
            </TextRegular>
          ) : item.sentAt ? (
            <TextRegular textStyle={{ color: GlobalStyles.brandBlue }}>
              Picked up — pending delivery
            </TextRegular>
          ) : (
            <TextRegular textStyle={{ color: GlobalStyles.brandBlue }}>
              Assigned — pending pickup
            </TextRegular>
          )}
        </TextSemiBold>

        {!item.deliveredAt && (
          <View style={styles.actionButtonsContainer}>
            {renderActionButton(item)}
          </View>
        )}
      </ImageCard>
    )
  }

  const renderEmptyOrdersList = () => {
    return (
      <TextRegular textStyle={styles.emptyList}>
        You have no orders assigned. Pick up an available order to get started.
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
  actionButtonsContainer: {
    flexDirection: 'row',
    bottom: 5,
    position: 'absolute',
    width: '90%'
  },
  actionButton: {
    borderRadius: 8,
    height: 40,
    marginTop: 12,
    margin: '1%',
    padding: 10,
    alignSelf: 'center',
    flexDirection: 'column',
    width: '100%'
  },
  text: {
    fontSize: 16,
    color: 'white',
    alignSelf: 'center',
    marginLeft: 5
  },
  emptyList: {
    textAlign: 'center',
    padding: 50
  }
})
