import React from 'react'
import { ActivityIndicator, View } from 'react-native'

const Index = () => {
  return (
    <View style={{flex:1, justifyContent:'center', alignItems:'center'}}>
      <ActivityIndicator size="large" color="#3498db" />
    </View>
  )
}

export default Index