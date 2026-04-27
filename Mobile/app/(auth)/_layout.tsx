import { Stack } from "expo-router";

export default function AuthLayout() {
    // anh quản lý màn hình login
  return <Stack screenOptions={{headerShown:false}} initialRouteName="login">
    <Stack.Screen name='login'/>
    <Stack.Screen name="forgot-password"/>
    <Stack.Screen name="reset-password"/>
  </Stack>
}