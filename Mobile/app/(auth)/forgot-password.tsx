import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, StyleSheet, TouchableWithoutFeedback, View } from 'react-native';
import { Button, HelperText, Text, TextInput } from 'react-native-paper';
import mobileApi from '../api';

const ForgotPwScreen = () => {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const handleConfirm = async () => {
    try {
      setLoading(true)
      if (!email) {
        setErrorMsg('Không được bỏ trống email')
        return
      }
      const link = Linking.createURL('/(auth)/forgot-password')
      const payload = {
        email,
        mobileUrl:link
      }
      console.log(payload)
      await mobileApi.forgorPw(payload)
    } catch (error: any) {
      // Alert.alert('Thông báo', 'Sai email hoặc mật khẩu');
      console.log('Có lỗi xảy ra: ', error?.response?.data)
    }
    finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView // bàn phím đẩy giao diện lên
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}
        accessible={false}>
        <View style={styles.formContainer}>

          <Text variant="headlineMedium" style={styles.title}>
            Quên mật khẩu!
          </Text>

          <TextInput
            label="Email xác thực"
            mode="outlined"
            value={email} // nhét email vào để gõ 1 chữ, onChangeText chạy
            onChangeText={setEmail}// gõ chữ nào lưu lại chữ đó trong state email
            style={styles.input}// hiển thị chữ vừa gõ
            autoCapitalize="none"
            activeOutlineColor='#3498db'
          />

          {errorMsg ?
            <HelperText type='error' visible={true}>
              {errorMsg}
            </HelperText>
            : <></>}

          <View style={{
            gap: 10,
            flexDirection: 'row',
            justifyContent: 'space-between'
          }}>
            <Button
              mode="contained"
              style={styles.btnCancel}
              contentStyle={{ height: 50 }}
              textColor='#000'
              onPress={() => {
                setEmail('')
                router.back()
              }}
            >
              Hủy
            </Button>

            <Button
              mode="contained"
              onPress={handleConfirm}
              style={styles.btnConfirm}
              loading={loading}
              contentStyle={{ height: 50 }}
            >
              Xác nhận
            </Button>
          </View>
          {/* <Text>Đã gửi email đặt lại mật khẩu:{email}</Text> */}
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  )
}

export default ForgotPwScreen

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    padding: 20,
  },
  formContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'center'
  },
  title: {
    textAlign: 'center',
    marginBottom: 30,
    fontWeight: 'bold',
    color: '#3498db',
  },
  input: {
    marginBottom: 16,
    // Màu nền của riêng ô input
    backgroundColor: '#fff'
  },
  btnConfirm: {
    flex: 4,
    marginTop: 10,
    borderRadius: 8,
    backgroundColor: '#3498db'
  },
  btnCancel: {
    flex: 3,
    marginTop: 10,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc'
  },
  forgotPassword: {
    textAlign: 'right',
    color: '#3498db',
    marginBottom: 10,
  }
});