import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert, Keyboard, KeyboardAvoidingView, Platform, StyleSheet,
  TouchableWithoutFeedback, View
} from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';
import mobileApi from './api';
import useAuthStore from './authStore';

export default function LoginScreen() {
  // state để lưu dữ liệu người dùng gõ vào
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false)
  const [showMK, setShowMK] = useState(false)
  const [visible, setVisible] = useState(false)
  const login = useAuthStore(state => state.login)
  const router = useRouter();

  const handleLogin = async () => {
    try {
      setLoading(true)
      const payload = { email, password }
      const res = await mobileApi.login(payload)
      Alert.alert('Thông báo', 'Đăng nhập thành công!');
      login(res.data.user, res.data.access_token)
      setVisible(true)
      router.replace('/(tabs)');
    } catch (error:any) {
      Alert.alert('Thông báo', `Đăng nhập thất bại`);
      console.log('Có lỗi xảy ra: ', error)
    }
    finally {
      setLoading(false)
    }
    // console.log("Đăng nhập:", email, password);
  };

  return (<>
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
            onChangeText={setEmail}// setEmail lại, rereander 
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

          {/* Nút bấm tự có hiệu ứng Ripple (gợn sóng) khi chạm vào */}
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
  </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    //justifyContent: 'center',
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