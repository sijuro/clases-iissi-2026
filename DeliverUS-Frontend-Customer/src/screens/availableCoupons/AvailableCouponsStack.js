import { createNativeStackNavigator } from '@react-navigation/native-stack'
import React from 'react'
import AvailableCouponsScreen from './AvailableCouponsScreen'

const Stack = createNativeStackNavigator()

export default function AvailableCouponsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="AvailableCouponsScreen"
        component={AvailableCouponsScreen}
        options={{
          title: 'Available Coupons'
        }}
      />
    </Stack.Navigator>
  )
}
