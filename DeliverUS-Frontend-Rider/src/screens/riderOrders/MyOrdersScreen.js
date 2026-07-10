import React from 'react'
import { View, StyleSheet } from 'react-native'
import TextSemiBold from '../../components/TextSemiBold'
import TextRegular from '../../components/TextRegular'

export default function MyOrdersScreen() {
  return (
    <View style={styles.container}>
      <TextSemiBold textStyle={styles.title}>Mis pedidos</TextSemiBold>
      <TextRegular textStyle={styles.subtitle}>Aquí se mostrarán los pedidos que estás gestionando.</TextRegular>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  title: {
    fontSize: 20,
    marginBottom: 10
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    color: '#888'
  }
})
