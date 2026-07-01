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

export default function HomeScreen() {
  const router = useRouter();

  // Mock data representing GET User API response
  const user = {
    name: "User",
    role: "Mobile Developer",
    department: "Tech Department",
    avatarInitials: "U",
    sisaCuti: 12,
    tasksCount: 5,
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Top Profile Header */}
        <View style={styles.header}>
          <View style={styles.profileRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{user.avatarInitials}</Text>
            </View>
            <View style={styles.profileTextContainer}>
              <Text style={styles.welcomeText}>Selamat Datang,</Text>
              <Text style={styles.userName}>{user.name}</Text>
              <Text style={styles.userDept}>{user.department}</Text>
            </View>
            <View style={styles.badgeContainer}>
              <Text style={styles.badgeText}>Aktif</Text>
            </View>
          </View>
        </View>

        {/* Dashboard Cards Grid */}
        <View style={styles.gridContainer}>
          <View style={styles.statCard}>
            <View style={[styles.iconWrapper, { backgroundColor: "#E0E7FF" }]}>
              <Ionicons name="checkbox-outline" size={24} color="#2E5BFF" />
            </View>
            <Text style={styles.statValue}>{user.tasksCount}</Text>
            <Text style={styles.statLabel}>Tugas Aktif</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.iconWrapper, { backgroundColor: "#E6F4EA" }]}>
              <Ionicons name="calendar-outline" size={24} color="#10B981" />
            </View>
            <Text style={styles.statValue}>{user.sisaCuti}</Text>
            <Text style={styles.statLabel}>Sisa Cuti</Text>
          </View>
        </View>

        {/* Info Banner / Quick Guide */}
        <View style={styles.infoBanner}>
          <Ionicons name="information-circle" size={24} color="#2E5BFF" style={styles.infoIcon} />
          <View style={styles.infoTextWrapper}>
            <Text style={styles.infoTitle}>Aksi Cepat Absensi</Text>
            <Text style={styles.infoDesc}>
              Sekarang tombol absensi Check-in & Check-out berada langsung di tab **Kehadiran** di bagian tengah bawah.
            </Text>
          </View>
        </View>

        {/* Shortcut menu to other tabs */}
        <Text style={styles.sectionHeading}>Akses Menu Utama</Text>
        <View style={styles.shortcutGrid}>
          <TouchableOpacity
            style={styles.shortcutItem}
            onPress={() => router.push("/timeline")}
          >
            <View style={[styles.shortcutIcon, { backgroundColor: "#FFF4E5" }]}>
              <Ionicons name="list-outline" size={20} color="#FFB020" />
            </View>
            <Text style={styles.shortcutLabel}>Daftar Tugas</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.shortcutItem}
            onPress={() => router.push("/kehadiran")}
          >
            <View style={[styles.shortcutIcon, { backgroundColor: "#E0E7FF" }]}>
              <Ionicons name="finger-print" size={20} color="#2E5BFF" />
            </View>
            <Text style={styles.shortcutLabel}>Absen & Cuti</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.shortcutItem}
            onPress={() => router.push("/perusahaan")}
          >
            <View style={[styles.shortcutIcon, { backgroundColor: "#E6F4EA" }]}>
              <Ionicons name="business" size={20} color="#10B981" />
            </View>
            <Text style={styles.shortcutLabel}>Info Kantor</Text>
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
  header: {
    marginBottom: 24,
    marginTop: 12,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#E0E7FF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#2E5BFF",
  },
  avatarText: {
    color: "#2E5BFF",
    fontSize: 18,
    fontWeight: "800",
  },
  profileTextContainer: {
    marginLeft: 14,
    flex: 1,
  },
  welcomeText: {
    fontSize: 12,
    color: "#8F9BB3",
    fontWeight: "600",
  },
  userName: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1F2937",
  },
  userDept: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  badgeContainer: {
    backgroundColor: "#E6F4EA",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11,
    color: "#10B981",
    fontWeight: "800",
  },
  gridContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  statCard: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 2,
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  statValue: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1F2937",
  },
  statLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
  },
  infoBanner: {
    flexDirection: "row",
    backgroundColor: "#E0E7FF",
    borderRadius: 20,
    padding: 16,
    marginBottom: 28,
  },
  infoIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  infoTextWrapper: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#2E5BFF",
  },
  infoDesc: {
    fontSize: 12,
    color: "#4B5563",
    marginTop: 4,
    lineHeight: 18,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 16,
  },
  shortcutGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  shortcutItem: {
    width: "30%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 12,
    alignItems: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 1,
  },
  shortcutIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  shortcutLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#4B5563",
    textAlign: "center",
  },
});
