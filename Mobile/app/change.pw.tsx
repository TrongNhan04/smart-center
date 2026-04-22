import { Stack, useRouter } from 'expo-router'
import React, { useState } from 'react'
import {
  Alert,
  Keyboard, KeyboardAvoidingView, Platform, StyleSheet,
  TouchableWithoutFeedback, View
} from 'react-native'
import { Button, HelperText, TextInput } from 'react-native-paper'
import mobileApi from './api'
import useAuthStore from './authStore'

const ChangePWScreen = () => {
  const router = useRouter()
  const [oldPw, setOldPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')

  const [showOld, setShowOld] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const [errorMsg, setErrorMsg] = useState('')
  const [loading, setLoading] = useState(false)

  const logout = useAuthStore(state=>state.logout)

  const handleUpdate = async () => {
    if (!oldPw || !newPw || !confirmPw) {
      setErrorMsg('Vui lòng nhập đầy đủ thông tin!')
      return
    }

    if (oldPw === newPw) {
      setErrorMsg('Mật khẩu không thay đổi!')
      return
    }

    if (newPw !== confirmPw) {
      setErrorMsg('Mật khẩu xác nhận không đúng!')
      return
    }

    try {
      setLoading(true)
      const body = {
        oldPassword: oldPw,
        newPassword: newPw
      }
      await mobileApi.updateProfile(body)
      Alert.alert(
        'Thành công',
        'Cập nhật mật khẩu thành công! Vui lòng đăng nhập lại.',
        [
          {
            text: 'OK',
            onPress: () => {
              resetMsgAll()
              logout()// xóa token và user
              router.replace('/(auth)/login')// đá về login
            }
          }
        ],
        // không cho user bấm ra ngoài khoảng không để tắt thông báo
        { cancelable: false }
      );
    } catch (error: any) {
      Alert.alert('Thông báo', 'Sai email hoặc mật khẩu');
      console.log('Có lỗi xảy ra: ', error?.response?.data)
    }
    finally { setLoading(false) }
  }

  const resetMsgAll = () => {
    setOldPw('')
    setNewPw('')
    setConfirmPw('')
    setErrorMsg('')
  }

  return (
    <KeyboardAvoidingView // bàn phím đẩy giao diện lên
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <Stack.Screen options={{ headerShown: false }} />
      <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}
        accessible={false}>
        <View style={styles.formContainer}>
          <TextInput
            label="Mật khẩu cũ"
            mode="outlined"
            secureTextEntry={!showOld} // nếu secureTextEntry đúng sẽ che ô đang nhập
            textContentType='password'
            value={oldPw}
            onChangeText={setOldPw}
            style={styles.input}
            activeOutlineColor='#3498db'
            right={
              <TextInput.Icon
                icon={showOld ? 'eye-off' : 'eye'}
                onPress={() => setShowOld(!showOld)}
              />
            }
          />

          <TextInput
            label="Mật khẩu mới"
            mode="outlined"
            secureTextEntry={!showNew} // nếu secureTextEntry đúng sẽ che ô đang nhập
            textContentType='password'
            value={newPw}
            onChangeText={setNewPw}
            style={styles.input}
            activeOutlineColor='#3498db'
            right={
              <TextInput.Icon
                icon={showNew ? 'eye-off' : 'eye'}
                onPress={() => setShowNew(!showNew)}
              />
            }
          />

          <TextInput
            label="Xác nhận mật khẩu mới"
            mode="outlined"
            secureTextEntry={!showConfirm} // nếu secureTextEntry đúng sẽ che ô đang nhập
            textContentType='password'
            value={confirmPw}
            onChangeText={setConfirmPw}
            style={styles.input}
            activeOutlineColor='#3498db'
            right={
              <TextInput.Icon
                icon={showConfirm ? 'eye-off' : 'eye'}
                onPress={() => setShowConfirm(!showConfirm)}
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
                resetMsgAll();
                router.back()
              }}
            >
              Hủy
            </Button>

            <Button
              mode="contained"
              onPress={handleUpdate}
              style={styles.btnUpdate}
              loading={loading}
              contentStyle={{ height: 50 }}
            >
              Cập nhật
            </Button>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  )
}

export default ChangePWScreen

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#eef2f6',
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
    backgroundColor: '#fff'
  },
  btnUpdate: {
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
  }
});