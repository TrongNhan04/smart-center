import { Stack } from "expo-router";

export default function AuthLayout() {
    // anh quản lý màn hình login
  return <Stack >
    <Stack.Screen name='login' options={{headerShown:false}}/>
  </Stack>
}