import { StyleSheet, Text, View } from "react-native";
import useAuthStore from "../authStore";

export default function Index() {
  const user = useAuthStore(state => state.user)
  // const logout = useAuthStore(state => state.logout)
  return (
    <View style={styles.container}>

      <Text style={{ fontSize: 20 }}>Xin chào: {user?.full_name}</Text>

      {/* <Button title="Đăng xuất" onPress={() => logout()} /> */}
    </View>
  );
}

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
