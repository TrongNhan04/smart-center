import { Stack } from 'expo-router'
import React from 'react'

const ClassLayout = () => {
  return (
    <Stack screenOptions={{headerShown:false}}>
        <Stack.Screen name='index'/>
        <Stack.Screen name='class-detail'/>
    </Stack>
  )
}

export default ClassLayout