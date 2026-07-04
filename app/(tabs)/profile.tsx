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
import { useAuth } from "../../hooks/useAuth";
import { useProfile } from "../../hooks/useProfile";
import {
  colors,
  hpx,
  radius,
  rf,
  shadows,
  spacing,
  wpx,
} from "../../src/constants/theme";

const MENU_ITEMS = [
  {
    route: "/profile-detail",
    icon: "person-outline",
    label: "Detail Data Diri",
  },
  { route: null, icon: "shield-checkmark-outline", label: "Keamanan & Sandi" },
  { route: null, icon: "help-circle-outline", label: "Pusat Bantuan" },
] as const;

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { logout } = useAuth();
  const { profile, isLoading } = useProfile();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = () => {
    Alert.alert("Konfirmasi", "Apakah Anda yakin ingin keluar?", [
      { text: "Batal", style: "cancel" },
      {
        text: "Keluar",
        style: "destructive",
        onPress: async () => {
          setIsLoggingOut(true);
          try {
            await logout();
          } catch { }
          router.replace("/");
        },
      },
    ]);
  };

  if (isLoading) {
    return (
      <View
        style={[
          styles.container,
          styles.center,
          { paddingTop: insets.top + hpx(48) },
        ]}
      >
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
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Curved Header */}
      <View style={[styles.curvedHeader]}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Profil</Text>
          <Text style={styles.headerSub}>Kelola akun & data pribadi</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Floating Profile Card */}
        <View style={styles.profileCard}>
          {/* Avatar — straddles the curve */}
          <View style={styles.avatarOuter}>
            <View style={styles.avatarInner}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
          </View>
          <Text style={styles.profileName}>{userName}</Text>
          {userRole ? <Text style={styles.profileRole}>{userRole}</Text> : null}
          {userCompany ? (
            <Text style={styles.profileCompany}>{userCompany}</Text>
          ) : null}
        </View>

        {/* Menu Group */}
        <View style={styles.menuCard}>
          {MENU_ITEMS.map((item, i) => (
            <TouchableOpacity
              key={item.label}
              style={[
                styles.menuItem,
                i === MENU_ITEMS.length - 1 && { borderBottomWidth: 0 },
              ]}
              onPress={() => (item.route ? router.push(item.route) : null)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={item.icon as any}
                size={wpx(20)}
                color={colors.textMuted}
              />
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Ionicons
                name="chevron-forward"
                size={wpx(16)}
                color={colors.textMuted}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={handleLogout}
          disabled={isLoggingOut}
          activeOpacity={0.7}
        >
          {isLoggingOut ? (
            <ActivityIndicator size="small" color={colors.error} />
          ) : (
            <Ionicons
              name="log-out-outline"
              size={wpx(20)}
              color={colors.error}
            />
          )}
          <Text style={styles.logoutText}>
            {isLoggingOut ? "Keluar…" : "Keluar dari Aplikasi"}
          </Text>
        </TouchableOpacity>

        <View style={{ height: hpx(24) }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  // Curved Header
  curvedHeader: {
    height: hpx(130),
    backgroundColor: colors.primary,
    borderBottomLeftRadius: wpx(30),
    borderBottomRightRadius: wpx(30),
    paddingHorizontal: spacing["2xl"],
    justifyContent: "flex-end",
    paddingBottom: hpx(16),
    zIndex: 1,
  },
  headerContent: { alignItems: "center" },
  headerTitle: {
    fontSize: rf(22),
    fontWeight: "700" as any,
    color: "#FFFFFF",
  },
  headerSub: {
    fontSize: rf(13),
    color: "rgba(255,255,255,0.7)",
    marginTop: hpx(4),
  },

  scroll: {
    paddingHorizontal: spacing["2xl"],
    paddingBottom: hpx(40),
    paddingTop: hpx(95),
  },

  // Floating Profile Card
  profileCard: {
    marginTop: -hpx(50),
    backgroundColor: colors.card,
    borderRadius: wpx(20),
    paddingTop: hpx(40),
    paddingHorizontal: spacing["2xl"],
    paddingBottom: spacing["2xl"],
    alignItems: "center",
    ...shadows.elevated,
    marginBottom: hpx(20),
    zIndex: 10,
  },
  avatarOuter: {
    position: "absolute",
    top: -hpx(36),
    alignSelf: "center",
    width: wpx(72),
    height: wpx(72),
    borderRadius: radius.full,
    backgroundColor: colors.card,
    justifyContent: "center",
    alignItems: "center",
    ...shadows.elevated,
  },
  avatarInner: {
    width: wpx(64),
    height: wpx(64),
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: rf(24),
    fontWeight: "800" as any,
    color: colors.primary,
  },
  profileName: {
    fontSize: rf(20),
    fontWeight: "800" as any,
    color: colors.textPrimary,
    marginBottom: hpx(4),
  },
  profileRole: {
    fontSize: rf(14),
    color: colors.textSecondary,
    marginBottom: hpx(2),
  },
  profileCompany: {
    fontSize: rf(12),
    color: colors.textMuted,
  },

  // Menu Group
  menuCard: {
    backgroundColor: colors.card,
    borderRadius: wpx(16),
    paddingHorizontal: spacing.lg,
    ...shadows.card,
    marginBottom: hpx(16),
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.md,
  },
  menuLabel: {
    flex: 1,
    fontSize: rf(14),
    fontWeight: "600" as any,
    color: colors.textPrimary,
  },

  // Logout
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: wpx(16),
    padding: spacing.lg,
    ...shadows.card,
  },
  logoutText: {
    fontSize: rf(14),
    fontWeight: "600" as any,
    color: colors.error,
  },
});
