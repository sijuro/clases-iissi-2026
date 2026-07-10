import { createNativeStackNavigator } from '@react-navigation/native-stack'
import React from 'react'
import MyOrdersScreen from './MyOrdersScreen'
import EditOrderCommentsScreen from './EditOrderCommentsScreen'

const Stack = createNativeStackNavigator()

export default function MyOrdersStack() {
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
        name="EditOrderCommentsScreen"
        component={EditOrderCommentsScreen}
        options={{
          title: 'Edit order comments'
        }}
      />
    </Stack.Navigator>
  )
}
