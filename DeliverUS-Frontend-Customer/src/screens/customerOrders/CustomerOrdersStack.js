import { createNativeStackNavigator } from '@react-navigation/native-stack'
import React from 'react'
import MyOrdersScreen from './MyOrdersScreen'
import EditOrderScreen from './EditOrderScreen'

const Stack = createNativeStackNavigator()

export default function CustomerOrdersStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="MyOrdersScreen"
        component={MyOrdersScreen}
        options={{
          title: 'My Orders'
        }}
      />
      <Stack.Screen
        name="EditOrderScreen"
        component={EditOrderScreen}
        options={{
          title: 'Order detail'
        }}
      />
    </Stack.Navigator>
  )
}
