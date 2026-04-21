import { Stack, useRouter } from 'expo-router'
import React from 'react'
import { View } from 'react-native'
import { Button, Icon, Text } from 'react-native-paper'
import { SafeAreaView } from 'react-native-safe-area-context'

const SuccessScreen = () => {
  const router = useRouter()
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#eef2f6' }}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={{
        flex: 1, justifyContent: 'center',
        alignItems: 'center', padding: 24, gap: 16
      }}>

        <View style={{ marginBottom: 12 }}>
          <Icon
            source="check-circle"
            size={110}
            color="#27ae60"
          />
        </View>

        <Text
          variant="headlineSmall"
          style={{ fontWeight: 'bold', color: '#2c3e50', textAlign: 'center' }}>
          Thanh toán thành công!
        </Text>

        <Text
          variant="bodyLarge"
          style={{ color: '#7f8c8d', textAlign: 'center', marginBottom: 24, paddingHorizontal: 16, lineHeight: 24 }}>
          Cảm ơn bạn. Khoản thanh toán đã được ghi nhận thành công vào hệ thống.
        </Text>

        <Button
          mode="contained"
          icon="file-document-outline" 
          onPress={() => router.replace('/(tabs)/invoice')}
          style={{ width: '60%', borderRadius: 12 }}
          buttonColor="#3498db"
          contentStyle={{ paddingVertical: 6 }}
        >
          Xem lại hóa đơn
        </Button>

      </View>
    </SafeAreaView>
  )
}

export default SuccessScreen