import { useContext, useEffect, useState } from 'react'
import { StyleSheet, FlatList, View } from 'react-native'

import { getAvailableCoupons } from '../../api/CouponEndpoints'
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

export default function AvailableCouponsScreen() {
  const [coupons, setCoupons] = useState([])
  const { loggedInUser } = useContext(AuthorizationContext)

  useEffect(() => {
    if (loggedInUser) {
      fetchCoupons()
    } else {
      setCoupons([])
    }
  }, [loggedInUser])

  const renderCoupon = ({ item }) => {
    return (
      <View style={styles.card}>
        <View style={styles.codeRow}>
          <MaterialCommunityIcons
            name="ticket-percent-outline"
            size={20}
            color={GlobalStyles.brandPrimary}
          />
          <TextSemiBold textStyle={styles.code}>{item.code}</TextSemiBold>
          <View style={styles.discountBadge}>
            <TextSemiBold textStyle={styles.discountText}>
              {item.discountPercentage}% OFF
            </TextSemiBold>
          </View>
        </View>
        <TextRegular>{item.description}</TextRegular>
        <TextRegular textStyle={styles.detail}>
          <MaterialCommunityIcons
            name="cart-outline"
            size={14}
            color={GlobalStyles.brandBlue}
          />{' '}
          Min. order: {item.minPrice.toFixed(2)}€
        </TextRegular>
        <TextRegular textStyle={styles.detail}>
          <MaterialCommunityIcons
            name="calendar-clock"
            size={14}
            color={GlobalStyles.brandBlue}
          />{' '}
          Expires: {formatDate(item.expiresAt)}
        </TextRegular>
        <TextRegular textStyle={styles.detail}>
          <MaterialCommunityIcons
            name="counter"
            size={14}
            color={GlobalStyles.brandBlue}
          />{' '}
          Uses: {item.usedCount}/{item.maxUses}
        </TextRegular>
      </View>
    )
  }

  const renderEmptyCouponsList = () => {
    return (
      <TextRegular textStyle={styles.emptyList}>
        No available coupons were retrieved. Are you logged in?
      </TextRegular>
    )
  }

  const fetchCoupons = async () => {
    try {
      const fetchedCoupons = await getAvailableCoupons()
      setCoupons(fetchedCoupons)
    } catch (error) {
      showMessage({
        message: `There was an error while retrieving available coupons. ${error} `,
        type: 'error',
        style: GlobalStyles.flashStyle,
        titleStyle: GlobalStyles.flashTextStyle
      })
    }
  }

  return (
    <FlatList
      style={styles.container}
      data={coupons}
      renderItem={renderCoupon}
      keyExtractor={item => item.id.toString()}
      ListEmptyComponent={renderEmptyCouponsList}
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
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6
  },
  code: {
    fontSize: 18,
    marginLeft: 6,
    flex: 1
  },
  discountBadge: {
    backgroundColor: GlobalStyles.brandPrimary,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2
  },
  discountText: {
    color: 'white',
    fontSize: 12
  },
  detail: {
    fontSize: 13,
    color: '#555',
    marginTop: 2
  },
  emptyList: {
    textAlign: 'center',
    padding: 50
  }
})
