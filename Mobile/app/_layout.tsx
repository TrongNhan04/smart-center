import { Stack } from "expo-router";
import { PaperProvider } from "react-native-paper";

export default function RootLayout() {
  // đặt tên phải trùng với tên file


  return <PaperProvider>
    <Stack >
      <Stack.Screen name="login" options={{ headerShown: false }}></Stack.Screen>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }}></Stack.Screen>
    </Stack>;
  </PaperProvider>

  //return <Stack />
}
