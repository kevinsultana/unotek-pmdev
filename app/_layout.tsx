import * as NavigationBar from "expo-navigation-bar";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { Appearance, Platform } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { AuthProvider } from "../context/AuthContext";

export default function RootLayout() {
  useEffect(() => {
    if (Platform.OS !== "android") return;
    const apply = () => {
      NavigationBar.setBackgroundColorAsync("#ffffff");
      NavigationBar.setButtonStyleAsync("dark");
    };
    apply();
    const sub = Appearance.addChangeListener(apply);
    return () => sub.remove();
  }, []);

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
          <Stack.Screen name="kehadiran" />
          <Stack.Screen name="leave-allocations" />
          <Stack.Screen name="time-off-detail" />
          <Stack.Screen name="task-detail" />
          <Stack.Screen name="profile-detail" />
          <Stack.Screen name="task-create" />
          <Stack.Screen name="reimbursement" />
          <Stack.Screen name="reimbursement-form" />
          <Stack.Screen name="(tabs)" />
        </Stack>
      </AuthProvider>
      <Toast />
    </SafeAreaProvider>
  );
}
