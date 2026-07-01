import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ProfileScreen() {
  const router = useRouter();

  const handleLogout = () => {
    router.replace("/");
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.profileCardBig}>
          <View style={styles.avatarBig}>
            <Text style={styles.avatarBigText}>U</Text>
          </View>
          <Text style={styles.profileNameBig}>User</Text>
          <Text style={styles.profileRoleBig}>Mobile Developer</Text>
          <Text style={styles.profileIdBig}>NIP: UNOTEK-2024-0042</Text>
        </View>

        <View style={styles.menuGroup}>
          <TouchableOpacity style={styles.menuItem}>
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

          <TouchableOpacity style={[styles.menuItem, { borderBottomWidth: 0 }]} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={22} color="#EF4444" />
            <Text style={[styles.menuText, { color: "#EF4444" }]}>Keluar dari Aplikasi</Text>
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
