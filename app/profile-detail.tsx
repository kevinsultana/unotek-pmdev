import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useProfile } from "../hooks/useProfile";

export default function ProfileDetailScreen() {
  const router = useRouter();
  const { profile, isLoading } = useProfile();

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color="#2E5BFF" />
      </SafeAreaView>
    );
  }

  const user = profile?.user;
  const emp = profile?.employee;
  const priv = profile?.privileges;

  const avatarInitials = (emp?.name || user?.name || "U").charAt(0).toUpperCase();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <Stack.Screen options={{ headerShown: false }} />

      {/* Custom Header */}
      <View style={styles.customHeader}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBackBtn}>
          <Ionicons name="arrow-back" size={22} color="#2E5BFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detail Data Diri</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Avatar & Name */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{avatarInitials}</Text>
          </View>
          <Text style={styles.fullName}>{emp?.name || user?.name}</Text>
          {emp?.job_title ? <Text style={styles.jobTitle}>{emp.job_title}</Text> : null}
        </View>

        {/* User Account */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Akun</Text>

          <View style={styles.infoRow}>
            <Ionicons name="person-outline" size={20} color="#2E5BFF" />
            <View style={styles.infoTextWrapper}>
              <Text style={styles.infoLabel}>Username</Text>
              <Text style={styles.infoValue}>{user?.login || "—"}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Ionicons name="mail-outline" size={20} color="#2E5BFF" />
            <View style={styles.infoTextWrapper}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{user?.email || "—"}</Text>
            </View>
          </View>
        </View>

        {/* Employee Info */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Karyawan</Text>

          <View style={styles.infoRow}>
            <Ionicons name="id-card-outline" size={20} color="#10B981" />
            <View style={styles.infoTextWrapper}>
              <Text style={styles.infoLabel}>Nama Lengkap</Text>
              <Text style={styles.infoValue}>{emp?.name || "—"}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Ionicons name="briefcase-outline" size={20} color="#10B981" />
            <View style={styles.infoTextWrapper}>
              <Text style={styles.infoLabel}>Jabatan</Text>
              <Text style={styles.infoValue}>{emp?.job_title || "—"}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Ionicons name="layers-outline" size={20} color="#10B981" />
            <View style={styles.infoTextWrapper}>
              <Text style={styles.infoLabel}>Departemen</Text>
              <Text style={styles.infoValue}>{emp?.department || "—"}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Ionicons name="business-outline" size={20} color="#10B981" />
            <View style={styles.infoTextWrapper}>
              <Text style={styles.infoLabel}>Perusahaan</Text>
              <Text style={styles.infoValue}>{emp?.company || "—"}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={20} color="#10B981" />
            <View style={styles.infoTextWrapper}>
              <Text style={styles.infoLabel}>Telepon</Text>
              <Text style={styles.infoValue}>{emp?.work_phone || "—"}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Ionicons name="mail-unread-outline" size={20} color="#10B981" />
            <View style={styles.infoTextWrapper}>
              <Text style={styles.infoLabel}>Email Kantor</Text>
              <Text style={styles.infoValue}>{emp?.work_email || "—"}</Text>
            </View>
          </View>
        </View>

        {/* Privileges */}
        {priv ? (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Hak Akses</Text>
            {renderPrivilege("Project", priv.project)}
            {renderPrivilege("Tugas", priv.task)}
            {renderPrivilege("Presensi", priv.attendance)}
            {renderPrivilege("Cuti", priv.time_off)}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function renderPrivilege(label: string, p: { create: boolean; read: boolean; update: boolean; delete: boolean }) {
  const badge = (allowed: boolean) => (
    <View style={[styles.privBadge, { backgroundColor: allowed ? "#E6F4EA" : "#FEE2E2" }]}>
      <Text style={[styles.privBadgeText, { color: allowed ? "#10B981" : "#EF4444" }]}>
        {allowed ? "✓" : "✗"}
      </Text>
    </View>
  );

  return (
    <View key={label} style={styles.privRow}>
      <Text style={styles.privLabel}>{label}</Text>
      <View style={styles.privBadges}>
        {badge(p.create)}
        {badge(p.read)}
        {badge(p.update)}
        {badge(p.delete)}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#eeeeefff" },
  customHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    height: 56,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  headerBackBtn: { width: 40, height: 40, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  headerTitle: { fontSize: 17, fontWeight: "700", color: "#1F2937", flex: 1, textAlign: "center", marginRight: 40 },
  headerSpacer: { width: 40 },
  scrollContainer: { padding: 24, paddingBottom: 40 },
  // Avatar
  avatarSection: { alignItems: "center", marginBottom: 24, marginTop: 8 },
  avatarCircle: {
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
  avatarText: { fontSize: 24, fontWeight: "800", color: "#2E5BFF" },
  fullName: { fontSize: 20, fontWeight: "800", color: "#1F2937" },
  jobTitle: { fontSize: 14, color: "#6B7280", marginTop: 4 },
  // Section
  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#9CA3AF",
    marginBottom: 16,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  infoRow: { flexDirection: "row", alignItems: "center" },
  infoTextWrapper: { marginLeft: 14, flex: 1 },
  infoLabel: { fontSize: 12, fontWeight: "600", color: "#9CA3AF" },
  infoValue: { fontSize: 15, fontWeight: "700", color: "#1F2937", marginTop: 2 },
  divider: { height: 1, backgroundColor: "#F3F4F6", marginVertical: 14, marginLeft: 34 },
  // Privileges
  privRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  privLabel: { fontSize: 14, fontWeight: "700", color: "#1F2937" },
  privBadges: { flexDirection: "row", gap: 6 },
  privBadge: { width: 28, height: 28, borderRadius: 8, justifyContent: "center", alignItems: "center" },
  privBadgeText: { fontSize: 13, fontWeight: "800" },
});
