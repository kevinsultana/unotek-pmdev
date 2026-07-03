import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../hooks/useAuth";
import { useProfile } from "../../hooks/useProfile";
import { Avatar, Card, SectionHeader } from "../../src/components/ui";
import {
  colors,
  hpx,
  radius,
  rf,
  shadows,
  sizes,
  spacing,
  textPresets,
  wpx,
} from "../../src/constants/theme";

const QUICK_ACTIONS = [
  {
    route: "/timeline",
    icon: "list-outline",
    label: "Task",
    color: "#F59E0B",
    bg: "#FEF3C7",
  },
  {
    route: "/kehadiran",
    icon: "finger-print",
    label: "Absensi",
    color: colors.primary,
    bg: colors.primaryLight,
  },
  {
    route: "/perusahaan",
    icon: "business-outline",
    label: "Company",
    color: "#059669",
    bg: "#D1FAE5",
  },
] as const;

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { refreshUser } = useAuth();
  const { profile, isLoading } = useProfile();

  useFocusEffect(
    useCallback(() => {
      refreshUser();
    }, [refreshUser]),
  );

  const userName = profile?.employee?.name || "User";
  const userDept = profile?.employee?.department || "";
  const avatarInitials = userName.charAt(0).toUpperCase();

  if (isLoading) {
    return (
      <View
        style={[styles.center, { paddingTop: insets.top + spacing["5xl"] }]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Profile Header ────────────────────────────────────────── */}
        <View style={styles.profileSection}>
          <Avatar initials={avatarInitials} size={56} />
          <View style={styles.profileInfo}>
            <Text style={styles.greeting}>Selamat Datang</Text>
            <Text style={styles.name}>{userName}</Text>
            {userDept ? <Text style={styles.dept}>{userDept}</Text> : null}
          </View>
          <View style={styles.statusDot} />
        </View>

        {/* ── Stats Grid ────────────────────────────────────────────── */}
        <View style={styles.statsGrid}>
          <Card style={styles.statCard}>
            <View
              style={[
                styles.statIcon,
                { backgroundColor: colors.primaryLight },
              ]}
            >
              <Ionicons
                name="checkbox-outline"
                size={22}
                color={colors.primary}
              />
            </View>
            <Text style={styles.statValue}>5</Text>
            <Text style={styles.statLabel}>Tugas Aktif</Text>
          </Card>

          <Card style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: "#D1FAE5" }]}>
              <Ionicons name="calendar-outline" size={22} color="#059669" />
            </View>
            <Text style={styles.statValue}>12</Text>
            <Text style={styles.statLabel}>Sisa Cuti</Text>
          </Card>
        </View>

        {/* ── Quick Actions ─────────────────────────────────────────── */}
        <SectionHeader title="Menu Cepat" />
        <View style={styles.actionsGrid}>
          {QUICK_ACTIONS.map((action) => (
            <TouchableOpacity
              key={action.route}
              style={styles.actionCard}
              onPress={() => router.push(action.route)}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIcon, { backgroundColor: action.bg }]}>
                <Ionicons
                  name={action.icon as any}
                  size={22}
                  color={action.color}
                />
              </View>
              <Text style={styles.actionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Bottom spacer ─────────────────────────────────────────── */}
        <View style={{ height: spacing["3xl"] }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scroll: {
    padding: spacing["2xl"],
    paddingBottom: spacing["4xl"],
  },

  // Profile
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing["3xl"],
    paddingTop: spacing.md,
  },
  profileInfo: {
    flex: 1,
    marginLeft: spacing.lg,
  },
  greeting: {
    ...textPresets.label,
    marginBottom: hpx(2),
  },
  name: {
    ...textPresets.display,
    fontSize: rf(20), // slightly smaller than full display
    marginBottom: hpx(2),
  },
  dept: {
    ...textPresets.body,
    fontSize: rf(13),
  },
  statusDot: {
    width: wpx(10),
    height: hpx(10),
    borderRadius: radius.full,
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: "#D1FAE5",
  },

  // Stats
  statsGrid: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing["3xl"],
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    padding: spacing.xl,
    // ponytail: no row-gap on RN < 0.71, using gap above works for 0.81
  },
  statIcon: {
    width: sizes.iconMd,
    height: sizes.iconMd,
    borderRadius: radius.md,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  statValue: {
    ...textPresets.display,
    marginBottom: spacing.xs,
  },
  statLabel: {
    ...textPresets.caption,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  // Quick Actions
  actionsGrid: {
    flexDirection: "row",
    gap: spacing.md,
  },
  actionCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: "center",
    ...shadows.card,
  },
  actionIcon: {
    width: sizes.iconMd,
    height: sizes.iconMd,
    borderRadius: radius.md,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: hpx(10),
  },
  actionLabel: {
    ...textPresets.cardTitle,
    fontSize: rf(12),
    textAlign: "center",
  },
});
