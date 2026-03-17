import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

const AboutScreen = () => {
  const router = useRouter()
  return (
    <View style={styles.container}>
      <Text style={styles.text}>About screen</Text>
      <Pressable onPress={()=>router.navigate('/')}>
        <Text style={styles.button}>Go to Home screen</Text>
      </Pressable>
    </View>
  );
}
export default AboutScreen

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