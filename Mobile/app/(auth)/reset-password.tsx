import { useLocalSearchParams, useRouter } from 'expo-router'
import React, { useState } from 'react'
import {
  Alert,
  Keyboard, KeyboardAvoidingView, Platform, StyleSheet,
  TouchableWithoutFeedback, View
} from 'react-native'
import { Button, HelperText, Text, TextInput } from 'react-native-paper'
import mobileApi from '../api'

const ResertPwScreen = () => {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [showMK, setShowMK] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const token = useLocalSearchParams()

  const handleConfirm = async () => {
    try {
      setLoading(true)
      if (!password) {
        setErrorMsg('Vui lòng nhập mật khẩu mới')
        return
      }
      const payload = {
        ...token,
        password
      }
      //console.log(payload);

      await mobileApi.resetPw(payload)
      Alert.alert(
        'Thành công',
        'Cập nhật mật khẩu thành công.',
        [
          {
            text: 'OK',
            onPress: () => {
              setErrorMsg('')
              setPassword('')
              router.replace('/(auth)/login')// đá về login
            }
          }
        ],
        // không cho user bấm ra ngoài khoảng không để tắt thông báo
        { cancelable: false }
      );
    } catch (error: any) {
      Alert.alert('Thông báo', error?.response?.data?.message);
      console.log('Có lỗi xảy ra: ', error?.response?.data)
    }
    finally {
      setErrorMsg('')
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
            Cập nhật mật khẩu mới!
          </Text>

          <TextInput
            label="Mật khẩu"
            mode="outlined"
            secureTextEntry={!showMK} // nếu secureTextEntry đúng sẽ che ô đang nhập
            textContentType='password'
            value={password}
            onChangeText={setPassword}
            style={styles.input}
            activeOutlineColor='#3498db'
            right={
              <TextInput.Icon
                icon={showMK ? 'eye-off' : 'eye'}
                onPress={() => setShowMK(!showMK)}
              />
            }
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
                //  setPassword('')
                router.replace('/login')
              }}
            >
              Hủy
            </Button>

            <Button
              mode="contained"
              onPress={handleConfirm}
              //onPress={() => console.log(token)}
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

export default ResertPwScreen

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