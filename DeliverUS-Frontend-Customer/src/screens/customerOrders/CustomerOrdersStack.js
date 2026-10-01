import { createNativeStackNavigator } from '@react-navigation/native-stack'
import React from 'react'
import MyOrdersScreen from './MyOrdersScreen'
import EditReviewScreen from './EditReviewScreen'

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
        name="EditReviewScreen"
        component={EditReviewScreen}
        options={{
          title: 'Review'
        }}
      />
    </Stack.Navigator>
  )
}
