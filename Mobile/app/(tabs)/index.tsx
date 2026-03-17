import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

export default function Index() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Home screen</Text>
      <Link href='/about' style={styles.button}>
        Go to About screen
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container:{
    flex:1,
    backgroundColor:'#fff',
    alignItems: 'center',
    justifyContent: 'center'
  },
  text:{
    color:"#25292e"
  },
  button:{
    fontSize:20,
    textDecorationLine: 'underline',
    color: '#25292e'
  }
})
