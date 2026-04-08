import Ionicons from '@expo/vector-icons/Ionicons'
import { Tabs } from 'expo-router'
import React from 'react'

const TabLayout = () => {
  // anh mày quản lý màn hình mấy thằng tab
  return (
    <Tabs
      screenOptions={{ tabBarActiveTintColor: '#2596be' }}
    >
      <Tabs.Screen name='index'
        options={{
          title: 'Trang chủ',
          headerShown: false,
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? 'home-sharp' : 'home-outline'}
              color={color} size={24}
            />
          )
        }}
      />
      <Tabs.Screen name='class'
        options={{
          title: 'Lớp học',
          headerShown: false,
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? 'school-sharp' : 'school-outline'}
              color={color} size={24}
            />
          )
        }}
      />

      <Tabs.Screen name='notis'
        options={{
          title: 'Thông báo',
          headerShown: false,
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={focused ? 'notifications-sharp' : 'notifications-outline'}
              color={color} size={24}
            />
          )
        }}
      />

      <Tabs.Screen name='account'
        options={{
          title: 'Tài khoản',
          headerShown: false,
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={focused ? 'person-sharp' : 'person-outline'}
              color={color} size={24}
            />
          )
        }}
      />
    </Tabs>
  )
}

export default TabLayout