import { Stack, useRootNavigationState, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import useAuthStore from "./authStore";

export default function RootLayout() {
  const token = useAuthStore(state => state.access_token)
  const role = useAuthStore(state => state.user?.role)
  const router = useRouter()
  const segments = useSegments()
  const rootNavigationState = useRootNavigationState();
  useEffect(() => {
    // chưa dựng khung xong thì thoát
    if (!rootNavigationState?.key) return
    // kiểm tra có phải đang ở các file của thư mục auth không
    const isAuthGroup = segments[0] === "(auth)"
    const isRootIndex = segments.length as number === 0

    // nhét vào đây để chờ render xong mới chuyển hướng
    const timeout = setTimeout(() => {
      // ko có token và 
      if (!token) {
        // ở trang index hoặc không ở auth
        if (isRootIndex || !isAuthGroup)
          router.replace("/login") // đá về login
      }
      else // có token mà ở trang index hoặc login
        if(role !== 'PARENT') return
        else if (isRootIndex || isAuthGroup)
          router.replace('/(tabs)') // đá về tabs
    }, 1);

    return () => clearTimeout(timeout)
  }, [token, rootNavigationState?.key, segments]);

  // anh quản lý 2 thằng là auth và tabs
  return (
    <Stack >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="class-detail" options={{ headerShown: false }} />
    </Stack>
  )
}