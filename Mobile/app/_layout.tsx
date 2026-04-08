import { Stack } from "expo-router";
import useAuthStore from "./authStore";

export default function RootLayout() {
  const token = useAuthStore(state => state.access_token)

  if (!token) // ko có token là đá về login
    return (<Stack>
      <Stack.Screen name='(auth)' options={{ headerShown: false }} />
    </Stack>)

  // anh mày quản lý 2 thằng là auth và tabs
  return (<Stack >
    <Stack.Screen name='(auth)' options={{ headerShown: false }} />
    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
  </Stack>)
}
