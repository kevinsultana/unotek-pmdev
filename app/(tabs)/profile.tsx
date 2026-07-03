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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, hpx, radius, rf, shadows, sizes, spacing, textPresets, wpx } from "../../src/constants/theme";
import { Avatar, Card } from "../../src/components/ui";
import { useAuth } from "../../hooks/useAuth";
import { useProfile } from "../../hooks/useProfile";

const MENU_ITEMS = [
  { route: "/profile-detail", icon: "person-outline", label: "Detail Data Diri", color: colors.primary },
  { route: null, icon: "shield-checkmark-outline", label: "Keamanan & Sandi", color: "#7C3AED" },
  { route: null, icon: "help-circle-outline", label: "Pusat Bantuan", color: colors.amber },
] as const;

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { logout } = useAuth();
  const { profile, isLoading } = useProfile();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = () => {
    Alert.alert("Konfirmasi", "Apakah Anda yakin ingin keluar dari aplikasi?", [
      { text: "Batal", style: "cancel" },
      {
        text: "Keluar",
        style: "destructive",
        onPress: async () => {
          setIsLoggingOut(true);
          try { await logout(); } catch { /* ignore */ }
          router.replace("/");
        },
      },
    ]);
  };

  if (isLoading) {
    return (
      <View style={[styles.center, { paddingTop: insets.top + spacing["5xl"] }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const emp = profile?.employee;
  const userName = emp?.name || profile?.user?.name || "User";
  const userRole = emp?.job_title || "";
  const userCompany = emp?.company || "";
  const initials = userName.charAt(0).toUpperCase();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* ── Profile Hero ───────────────────────────────────────────── */}
        <Card style={styles.profileCard}>
          <Avatar initials={initials} size={80} />
          <Text style={styles.name}>{userName}</Text>
          {userRole ? <Text style={styles.role}>{userRole}</Text> : null}
          {userCompany ? <Text style={styles.company}>{userCompany}</Text> : null}
        </Card>

        {/* ── Menu Group ─────────────────────────────────────────────── */}
        <View style={styles.menuGroup}>
          {MENU_ITEMS.map((item, i) => (
            <TouchableOpacity
              key={item.label}
              style={[styles.menuItem, i === MENU_ITEMS.length - 1 && { borderBottomWidth: 0 }]}
              onPress={() => item.route ? router.push(item.route) : null}
              activeOpacity={0.7}
            >
              <View style={[styles.menuIcon, { backgroundColor: `${item.color}15` }]}>
                <Ionicons name={item.icon as any} size={20} color={item.color} />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Logout ─────────────────────────────────────────────────── */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={handleLogout}
          disabled={isLoggingOut}
          activeOpacity={0.7}
        >
          {isLoggingOut ? (
            <ActivityIndicator size="small" color={colors.error} />
          ) : (
            <Ionicons name="log-out-outline" size={20} color={colors.error} />
          )}
          <Text style={styles.logoutText}>
            {isLoggingOut ? "Keluar…" : "Keluar dari Aplikasi"}
          </Text>
        </TouchableOpacity>

        <View style={{ height: spacing["4xl"] }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface, paddingBottom: -30 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  scroll: { padding: spacing["2xl"], paddingBottom: spacing["4xl"] },

  // Profile card
  profileCard: {
    alignItems: "center",
    padding: spacing["3xl"],
    marginBottom: spacing["2xl"],
    marginTop: spacing.md,
  },
  name: { ...textPresets.screenTitle, marginTop: spacing.lg, marginBottom: spacing.xs },
  role: { ...textPresets.body, marginBottom: spacing.xs },
  company: { ...textPresets.caption },

  // Menu group
  menuGroup: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    ...shadows.card,
    marginBottom: spacing["2xl"],
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuIcon: {
    width: sizes.iconSm,
    height: sizes.iconSm,
    borderRadius: radius.md,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
  },
  menuLabel: {
    ...textPresets.body,
    color: colors.textPrimary,
    fontWeight: "600" as any,
    flex: 1,
  },

  // Logout
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadows.card,
  },
  logoutText: {
    ...textPresets.body,
    color: colors.error,
    fontWeight: "600" as any,
  },
});
