import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../hooks/useAuth";
import { useProfile } from "../../hooks/useProfile";

export default function ProfileScreen() {
  const router = useRouter();
  const { logout } = useAuth();
  const { profile, isLoading } = useProfile();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      "Konfirmasi",
      "Apakah Anda yakin ingin keluar dari aplikasi?",
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Keluar",
          style: "destructive",
          onPress: async () => {
            setIsLoggingOut(true);
            try {
              await logout();
            } catch {
              // Logout failed locally — still redirect
            }
            router.replace("/");
          },
        },
      ],
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color="#2E5BFF" />
      </SafeAreaView>
    );
  }

  // Data from API response → data.employee (field employee)
  const emp = profile?.employee;
  const userName = emp?.name || profile?.user?.name || "User";
  const userRole = emp?.job_title || "";
  const userDept = emp?.department || "";
  const userCompany = emp?.company || "";
  const userEmail = profile?.user?.email || "";
  const avatarInitials = userName.charAt(0).toUpperCase();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.profileCardBig}>
          <View style={styles.avatarBig}>
            <Text style={styles.avatarBigText}>{avatarInitials}</Text>
          </View>
          <Text style={styles.profileNameBig}>{userName}</Text>
          <Text style={styles.profileRoleBig}>{userRole}</Text>
          {userCompany ? (
            <Text style={styles.profileIdBig}>{userCompany}</Text>
          ) : null}
        </View>

        <View style={styles.menuGroup}>
          <TouchableOpacity style={styles.menuItem} onPress={() => router.push("/profile-detail")}>
            <Ionicons name="person-outline" size={22} color="#4B5563" />
            <Text style={styles.menuText}>Detail Data Diri</Text>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="shield-checkmark-outline" size={22} color="#4B5563" />
            <Text style={styles.menuText}>Keamanan & Sandi</Text>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="help-circle-outline" size={22} color="#4B5563" />
            <Text style={styles.menuText}>Pusat Bantuan (HRD)</Text>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, { borderBottomWidth: 0 }]}
            onPress={handleLogout}
            disabled={isLoggingOut}
          >
            {isLoggingOut ? (
              <ActivityIndicator size="small" color="#EF4444" />
            ) : (
              <Ionicons name="log-out-outline" size={22} color="#EF4444" />
            )}
            <Text style={[styles.menuText, { color: "#EF4444" }]}>
              {isLoggingOut ? "Keluar..." : "Keluar dari Aplikasi"}
            </Text>
            <Ionicons name="chevron-forward" size={18} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#eeeeefff",
    paddingBottom: -30,
  },
  scrollContainer: {
    padding: 24,
    paddingBottom: 40,
  },
  profileCardBig: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 2,
    marginTop: 12,
  },
  avatarBig: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#E0E7FF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#2E5BFF",
    marginBottom: 12,
  },
  avatarBigText: {
    fontSize: 24,
    fontWeight: "800",
    color: "#2E5BFF",
  },
  profileNameBig: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1F2937",
  },
  profileRoleBig: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 2,
  },
  profileIdBig: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 6,
  },
  menuGroup: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingHorizontal: 16,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 2,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  menuText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginLeft: 12,
  },
});
