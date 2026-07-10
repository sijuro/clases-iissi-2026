import { useContext, useEffect, useState } from 'react'
import { StyleSheet, FlatList, View, Pressable } from 'react-native'

import { getAvailableOrders, acceptOrder } from '../../api/OrderEndpoints'
import ImageCard from '../../components/ImageCard'
import TextSemiBold from '../../components/TextSemiBold'
import TextRegular from '../../components/TextRegular'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import * as GlobalStyles from '../../styles/GlobalStyles'
import { AuthorizationContext } from '../../context/AuthorizationContext'
import { showMessage } from 'react-native-flash-message'
import restaurantLogo from '../../../assets/restaurantLogo.jpeg'
import { API_BASE_URL } from '@env'

const getElapsedMinutes = dateString => {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now - date
  return Math.floor(diffMs / 60000)
}

export default function AvailableOrdersScreen({ navigation, route }) {
  const [orders, setOrders] = useState([])
  const { loggedInUser } = useContext(AuthorizationContext)

  useEffect(() => {
    if (loggedInUser) {
      fetchOrders()
    } else {
      setOrders(null)
    }
  }, [loggedInUser, route])

  const renderOrder = ({ item }) => {
    return (
      <ImageCard
        imageUri={
          item.restaurant.logo
            ? { uri: API_BASE_URL + '/' + item.restaurant.logo }
            : restaurantLogo
        }
        onPress={() => {
          navigation.navigate('OrderDetailScreen', { id: item.id })
        }}
        title={`Order #${item.id} - ${item.restaurant.name}`}
      >
        <View style={styles.timeBadgeAbsolute}>
          <MaterialCommunityIcons
            name="clock-outline"
            size={12}
            color={'white'}
          />
          <TextRegular textStyle={styles.timeBadgeText}>
            {getElapsedMinutes(item.createdAt)} min
          </TextRegular>
        </View>

        <TextSemiBold>
          <MaterialCommunityIcons
            name="store"
            size={14}
            color={GlobalStyles.brandBlue}
          />{' '}
          <TextRegular textStyle={{ color: GlobalStyles.brandBlue }}>
            {item.restaurant.address}, {item.restaurant.postalCode}
          </TextRegular>
        </TextSemiBold>
        <TextSemiBold>
          <MaterialCommunityIcons
            name="map-marker"
            size={14}
            color={GlobalStyles.brandPrimary}
          />{' '}
          <TextRegular textStyle={{ color: GlobalStyles.brandPrimary }}>
            {item.user.firstName} ({item.user.phone}) - {item.address}
          </TextRegular>
        </TextSemiBold>
        <TextSemiBold>
          <MaterialCommunityIcons name="cash" size={14} color={'#555'} />{' '}
          <TextRegular>{item.price.toFixed(2)}€</TextRegular>
        </TextSemiBold>

        <View style={styles.actionButtonsContainer}>
          <Pressable
            onPress={() => handleAccept(item)}
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
              style={[
                { flex: 1, flexDirection: 'row', justifyContent: 'center' }
              ]}
            >
              <MaterialCommunityIcons name="moped" color={'white'} size={20} />
              <TextRegular textStyle={styles.text}>Accept order</TextRegular>
            </View>
          </Pressable>
        </View>
      </ImageCard>
    )
  }

  const renderEmptyOrdersList = () => {
    return (
      <TextRegular textStyle={styles.emptyList}>
        No available orders were retrieved. Are you logged in?
      </TextRegular>
    )
  }

  const fetchOrders = async () => {
    try {
      const fetchedOrders = await getAvailableOrders()
      setOrders(fetchedOrders)
    } catch (error) {
      showMessage({
        message: `There was an error while retrieving available orders. ${error} `,
        type: 'error',
        style: GlobalStyles.flashStyle,
        titleStyle: GlobalStyles.flashTextStyle
      })
    }
  }

  const handleAccept = async order => {
    try {
      await acceptOrder(order.id)
      showMessage({
        message: `Order #${order.id} assigned to you successfully!`,
        type: 'success',
        style: GlobalStyles.flashStyle,
        titleStyle: GlobalStyles.flashTextStyle
      })
      await fetchOrders()
      navigation.navigate('My orders', {
        screen: 'MyOrdersScreen',
        params: { dirty: true }
      })
    } catch (error) {
      showMessage({
        message: `Could not accept order #${order.id}. ${error}`,
        type: 'error',
        style: GlobalStyles.flashStyle,
        titleStyle: GlobalStyles.flashTextStyle
      })
    }
  }

  return (
    <>
      <FlatList
        style={styles.container}
        data={orders}
        renderItem={renderOrder}
        keyExtractor={item => item.id.toString()}
        ListEmptyComponent={renderEmptyOrdersList}
      />
    </>
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
  },
  timeBadgeAbsolute: {
    position: 'absolute',
    top: 5,
    right: 5,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: GlobalStyles.brandPrimary,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2
  },
  timeBadgeText: {
    color: 'white',
    fontSize: 11,
    marginLeft: 3
  }
})
