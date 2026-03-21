import { Stack } from "expo-router";

export default function RootLayout() {
  // đặt tên phải trùng với tên file
  return <Stack >
    <Stack.Screen name="login" options={{headerShown:false}}></Stack.Screen>
    <Stack.Screen name="(tabs)" options={{ headerShown: false }}></Stack.Screen>
  </Stack>;
  //return <Stack />
}
