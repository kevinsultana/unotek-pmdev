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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  colors,
  hpx,
  radius,
  rf,
  shadows,
  spacing,
  wpx
} from "../../src/constants/theme";

export default function ActionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Curved Header */}
      <View
        style={[
          styles.curvedHeader,
          { paddingTop: insets.top > 0 ? insets.top + hpx(10) : hpx(24) },
        ]}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Pusat Aksi</Text>
          <Text style={styles.headerSub}>Pilih menu aksi yang ingin dibuka</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Menu 1: Task & Proyek */}
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push("/tasks")}
          activeOpacity={0.85}
        >
          <View style={styles.cardHeader}>
            <View style={[styles.iconBg, { backgroundColor: colors.primary }]}>
              <Ionicons name="checkbox" size={wpx(24)} color="#FFFFFF" />
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Utama</Text>
            </View>
          </View>

          <Text style={styles.cardTitle}>Tugas & Proyek</Text>
          <Text style={styles.cardSub}>
            Kelola daftar tugas harian, pantau status pengerjaan, dan progress projek perusahaan.
          </Text>

          <View style={styles.ctaRow}>
            <Text style={styles.ctaText}>Buka Daftar Tugas</Text>
            <Ionicons name="chevron-forward" size={wpx(18)} color={colors.primary} />
          </View>
        </TouchableOpacity>

        {/* Menu 2: Pipeline */}
        <TouchableOpacity
          style={[styles.actionCard, { marginTop: spacing.lg, borderColor: "#EDE9FE" }]}
          onPress={() => router.push("/pipeline" as any)}
          activeOpacity={0.85}
        >
          <View style={styles.cardHeader}>
            <View style={[styles.iconBg, { backgroundColor: "#7C3AED" }]}>
              <Ionicons name="git-network-outline" size={wpx(24)} color="#FFFFFF" />
            </View>
            <View style={[styles.badge, { backgroundColor: "#EDE9FE" }]}>
              <Text style={[styles.badgeText, { color: "#7C3AED" }]}>Baru</Text>
            </View>
          </View>

          <Text style={styles.cardTitle}>Pipeline Proyek</Text>
          <Text style={styles.cardSub}>
            Kelola prospek bisnis, tahapan deal, win probability, dan potensi estimasi pendapatan.
          </Text>

          <View style={[styles.ctaRow, { backgroundColor: "#EDE9FE" }]}>
            <Text style={[styles.ctaText, { color: "#7C3AED" }]}>Buka Pipeline Proyek</Text>
            <Ionicons name="chevron-forward" size={wpx(18)} color="#7C3AED" />
          </View>
        </TouchableOpacity>

        <View style={{ height: hpx(30) }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
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
  headerContent: {
    alignItems: "center",
  },
  headerTitle: {
    fontSize: rf(22),
    fontWeight: "800" as any,
    color: "#FFFFFF",
  },
  headerSub: {
    fontSize: rf(13),
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: hpx(4),
    textAlign: "center",
  },
  scroll: {
    paddingHorizontal: spacing["2xl"],
    paddingTop: hpx(20),
    paddingBottom: hpx(40),
  },

  /* Action Cards */
  actionCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.xl,
    borderWidth: 1.5,
    borderColor: colors.primaryLight,
    ...shadows.elevated,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  iconBg: {
    width: wpx(44),
    height: wpx(44),
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.card,
  },
  badge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  badgeText: {
    fontSize: rf(11),
    fontWeight: "700" as any,
    color: colors.primary,
  },
  cardTitle: {
    fontSize: rf(17),
    fontWeight: "800" as any,
    color: colors.textPrimary,
    marginBottom: hpx(4),
  },
  cardSub: {
    fontSize: rf(13),
    color: colors.textSecondary,
    lineHeight: rf(19),
    marginBottom: spacing.lg,
  },
  ctaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.lg,
    paddingVertical: hpx(10),
    borderRadius: radius.md,
  },
  ctaText: {
    fontSize: rf(13),
    fontWeight: "700" as any,
    color: colors.primary,
  },
});
