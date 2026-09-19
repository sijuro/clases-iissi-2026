import { createNativeStackNavigator } from '@react-navigation/native-stack'
import React from 'react'
import MyOrdersScreen from './MyOrdersScreen'

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
    </Stack.Navigator>
  )
}
