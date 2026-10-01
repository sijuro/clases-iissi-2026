import { createNativeStackNavigator } from '@react-navigation/native-stack'
import React from 'react'
import MyReviewsScreen from './MyReviewsScreen'

const Stack = createNativeStackNavigator()

export default function MyReviewsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="MyReviewsScreen"
        component={MyReviewsScreen}
        options={{
          title: 'My Reviews'
        }}
      />
    </Stack.Navigator>
  )
}
