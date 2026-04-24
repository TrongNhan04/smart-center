import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert, Keyboard, KeyboardAvoidingView, Platform, StyleSheet,
  TouchableWithoutFeedback, View
} from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';
import mobileApi from '../api';
import useAuthStore from '../authStore';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false)
  const [showMK, setShowMK] = useState(false)
  const login = useAuthStore(state => state.login)
  const setSelectedStuId = useAuthStore(state => state.setSelectedStuId)
  const router = useRouter();

  const handleLogin = async () => {
    try {
      setLoading(true)

      if (!email || !password) {
        Alert.alert('Thông báo', 'Vui lòng điền đầy đủ thông tin');
        return
      }

      const payload = { email, password }
      const res = await mobileApi.login(payload)
      const user = res.data.user
      Alert.alert('Thông báo', 'Đăng nhập thành công!');
      login(user, res.data.access_token)
      if (user.children.length > 0)
        setSelectedStuId(user.children[0])

      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Thông báo', 'Sai email hoặc mật khẩu');
      console.log('Có lỗi xảy ra: ', error?.response?.data)
    }
    finally {
      setLoading(false)
    }
  };

  return (
    <KeyboardAvoidingView // bàn phím đẩy giao diện lên
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >

      <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}
        accessible={false}>
        <View style={styles.formContainer}>

          <Text variant="headlineMedium" style={styles.title}>
            Chào mừng!
          </Text>

          <TextInput
            label="Email của bạn"
            mode="outlined"
            value={email} // nhét email vào để gõ 1 chữ, onChangeText chạy
            onChangeText={setEmail}// gõ chữ nào lưu lại chữ đó trong state email
            style={styles.input}// hiển thị chữ vừa gõ
            autoCapitalize="none"
            activeOutlineColor='#3498db'
          />

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

          <Text
            style={styles.forgotPassword}
            onPress={()=>router.push('/(auth)/forgot-password')} 
          >
            Quên mật khẩu?
          </Text>

          <Button
            mode="contained"
            onPress={handleLogin}
            style={styles.button}
            loading={loading}
            contentStyle={{ height: 50 }}
          >
            Đăng Nhập
          </Button>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

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
  button: {
    marginTop: 10,
    borderRadius: 8,
    backgroundColor: '#3498db'
  },
  forgotPassword: {
  textAlign: 'right',
  color: '#3498db',
  marginBottom: 10,
}
});