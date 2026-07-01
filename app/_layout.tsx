import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { AuthProvider } from "../context/AuthContext";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" backgroundColor="#FFFFFF" />
      <AuthProvider>
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="forgot-password" />
          <Stack.Screen name="project-detail" />
          <Stack.Screen name="attendance-history" />
          <Stack.Screen name="leave-allocations" />
          <Stack.Screen name="time-off-detail" />
          <Stack.Screen name="task-detail" />
          <Stack.Screen name="(tabs)" />
        </Stack>
      </AuthProvider>
      <Toast />
    </SafeAreaProvider>
  );
}
