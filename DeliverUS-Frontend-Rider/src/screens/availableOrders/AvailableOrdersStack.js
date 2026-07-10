import { createNativeStackNavigator } from '@react-navigation/native-stack'
import React from 'react'
import AvailableOrdersScreen from './AvailableOrdersScreen'
import OrderDetailScreen from './OrderDetailScreen'

const Stack = createNativeStackNavigator()

export default function AvailableOrdersStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="AvailableOrdersScreen"
        component={AvailableOrdersScreen}
        options={{
          title: 'Available Orders'
        }}
      />
      <Stack.Screen
        name="OrderDetailScreen"
        component={OrderDetailScreen}
        options={{
          title: 'Order Detail'
        }}
      />
    </Stack.Navigator>
  )
}
