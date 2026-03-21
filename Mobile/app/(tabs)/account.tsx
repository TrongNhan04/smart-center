import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

const AccountScreen = () => {
  const router = useRouter()
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Tài khoản cá nhân</Text>
      <Pressable onPress={()=>router.replace('/login')}>
        <Text style={styles.button}>Đăng xuất</Text>
      </Pressable>
    </View>
  );
}
export default AccountScreen

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center'
  },
  text: {
    color: "#25292e"
  },
  button: {
    fontSize: 20,
    textDecorationLine: 'underline',
    color: '#25292e'
  }
})