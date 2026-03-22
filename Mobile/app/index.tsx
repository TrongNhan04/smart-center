import { Redirect } from 'expo-router'
import React from 'react'
import useAuthStore from './authStore'

const Index = () => {
  const token = useAuthStore(state => state.access_token)
  
  if(token) // có token thì vào
    return <Redirect href={`/(tabs)`}/>

  // không có token thì login
  return <Redirect href={`/login`}/>
}

export default Index