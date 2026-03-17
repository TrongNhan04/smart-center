import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
// 1. Import các component "ăn sẵn" từ thư viện Paper
import axios from 'axios';
import { useRouter } from 'expo-router';
import { Button, Text, TextInput } from 'react-native-paper';
import { useAuthStore } from './authStore';

export default function LoginScreen() {
  // Vẫn phải có State để hứng dữ liệu người dùng gõ vào
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false)
  const login = useAuthStore(state=>state.login)
  const router = useRouter();

  const handleLogin = async () => {
    try {
      setLoading(true)
      const payload = { email, password }
      const res = await axios.post('http://192.168.1.102:3000/auth/login', payload)
      console.log(res.data)
      Alert.alert('Thông báo', 'Đăng nhập thành công!');
      login(res.data.user, res.data.access_token)
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert('Thông báo', 'Đăng nhập thất bại!');
      console.log('Có lỗi xảy ra: ', error)
    }
    finally {
      setLoading(false)
    }
    // console.log("Đăng nhập:", email, password);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      {/* <TouchableWithoutFeedback onPress={()=>Keyboard.dismiss()} accessible={false}> */}
      <View style={styles.formContainer}>

        {/* Component Text của Paper có sẵn các size chuẩn (variant) */}
        <Text variant="headlineMedium" style={styles.title}>
          Chào mừng!
        </Text>

        <TextInput
          label="Email của bạn"
          mode="outlined"
          value={email} // nhét email vào để gõ 1 chữ, onChangeText chạy
          onChangeText={setEmail}// setEmail lại, rereander 
          style={styles.input}// hiển thị chữ vừa gõ
          autoCapitalize="none"
          activeOutlineColor='#3498db'
        />

        <TextInput
          label="Mật khẩu"
          mode="outlined"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          style={styles.input}
          activeOutlineColor='#3498db'
        />

        {/* Nút bấm tự có hiệu ứng Ripple (gợn sóng) khi chạm vào */}
        <Button
          mode="contained"
          onPress={handleLogin}
          style={styles.button}
          loading={loading}
          contentStyle={{ height: 50 }} // Cho nút cao lên chút cho dễ bấm
        >
          Đăng Nhập
        </Button>

      </View>
      {/* </TouchableWithoutFeedback> */}
    </KeyboardAvoidingView>
  );
}

// 2. CSS bây giờ chỉ dùng để bố cục (căn giữa, đẩy margin), KHÔNG CẦN tô màu hay vẽ viền nữa
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
  }
});