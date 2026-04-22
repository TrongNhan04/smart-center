import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, AppState, View } from 'react-native';
import { Card, Divider, IconButton, Text } from 'react-native-paper';
import QRCode from 'react-native-qrcode-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { io } from 'socket.io-client';
import mobileApi from './api';

const PaymentScreen = () => {
  const router = useRouter()
  const { invoiceId, code, student, debt } = useLocalSearchParams()
  const [qrData, setQrData] = useState(null)
  const appState = useRef(AppState.currentState) // lấy trạng thái app

  // useEffect 1 chạy khi mở qr thanh toán 1 hóa đơn
  useEffect(() => {
    const fetchQR = async () => {
      try {
        if (!invoiceId) return
        const res = await mobileApi.payment(invoiceId)
        setQrData(res.data.qrCode)
        // console.log(res.data)
      } catch (error: any) {
        Alert.alert('Thông báo', 'Lỗi tải dữ liệu!');
        console.log('Có lỗi xảy ra: ', error?.response?.data)
      }
    }
    fetchQR()
  }, [invoiceId])

  // useEffect 2 chạy khi có socket từ backend 
  useEffect(() => {
    if (!invoiceId) return
    // socket, nhớ đổi ip giống api
    const socket = io('http://192.168.1.101:3000')
    const envName = `PAYMENT_SUCCESS_${invoiceId}`

    socket.on(envName, data => {
      console.log('đã nhận được: ', data)
      router.replace('/payment-success')
    })

    // kiểm tra state của app 
    const subcription = AppState.addEventListener('change', nextAppState => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // app đã thức dậy
        checkPaidInvoice(Number(invoiceId))
      }
      appState.current = nextAppState
    })

    return () => {
      socket.off(envName)
      socket.disconnect()
      subcription.remove()
    }
  }, [invoiceId])

  const checkPaidInvoice = async (id: number) => {
    try {
      const res = await mobileApi.getInvoiceById(id)
      if(res.data.DaTra === res.data.TongTien){
        console.log('api báo đã thanh toán');
        router.replace('/payment-success')
      }
    } catch (error:any) {
      console.log('Có lỗi xảy ra: ', error?.response?.data)
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#eef2f6' }}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={{
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 8, paddingTop: 12, paddingBottom: 8
      }}>
        <IconButton
          icon="arrow-left"
          size={24}
          onPress={() => router.back()}
          style={{ margin: 0 }}
        />
        <Text variant="titleLarge"
          style={{ fontWeight: 'bold', marginLeft: 8, color: '#2c3e50' }}>
          Thanh toán học phí
        </Text>
      </View>

      <View style={{ paddingHorizontal: 16, gap: 16, marginTop: 8 }}>

        {/* card 1 thông tin hóa đơn */}
        <Card mode="elevated"
          style={{ backgroundColor: '#f7fafc', borderRadius: 12 }}>
          <Card.Content style={{ gap: 12 }}>

            <View style={{
              flexDirection: 'row', justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <Text variant="bodyLarge" style={{ color: '#7f8c8d' }}>
                Học viên</Text>
              <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>
                {student}</Text>
            </View>

            <Divider style={{ backgroundColor: '#dce3ea' }} />

            <View style={{
              flexDirection: 'row', justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <Text variant="bodyLarge" style={{ color: '#7f8c8d' }}>Mã HĐ</Text>
              <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>{code}</Text>
            </View>

            <Divider style={{ backgroundColor: '#dce3ea' }} />

            <View style={{
              flexDirection: 'row', justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <Text variant="titleMedium" style={{ color: '#7f8c8d' }}>
                Số tiền cần thanh toán</Text>
              <Text variant="headlineSmall"
                style={{ fontWeight: 'bold', color: '#e74c3c' }}>
                {Number(debt).toLocaleString('vi-VN')} đ
              </Text>
            </View>

          </Card.Content>
        </Card>

        {/* card 2 mã qr */}
        <Card mode="elevated"
          style={{ backgroundColor: '#f0f7fe', borderRadius: 12 }}>
          <Card.Content
            style={{ alignItems: 'center', paddingVertical: 24, gap: 16 }}>

            <Text variant="bodyMedium"
              style={{ color: '#7f8c8d', textAlign: 'center' }}>
              Mở ứng dụng ngân hàng và quét mã QR bên dưới để thanh toán
            </Text>

            {qrData ? (
              <View style={{
                padding: 12, borderWidth: 1, borderColor: '#e0e0e0',
                borderRadius: 12, backgroundColor: '#fff'
              }}>
                <QRCode
                  value={qrData}
                  size={150}
                />
              </View>
            ) : (
              <View style={{ height: 220, justifyContent: 'center' }}>
                <ActivityIndicator size="large" color="#3498db" />
              </View>
            )}
          </Card.Content>
        </Card>

      </View>
    </SafeAreaView>
  );
}
export default PaymentScreen