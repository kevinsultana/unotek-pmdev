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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, hpx, radius, rf, shadows, sizes, spacing, textPresets, wpx } from "../src/constants/theme";
import { Avatar } from "../src/components/ui";
import { useProfile } from "../hooks/useProfile";

export default function ProfileDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile, isLoading } = useProfile();

  if (isLoading) {
    return (
      <View style={[styles.center, { paddingTop: insets.top + spacing["5xl"] }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const user = profile?.user;
  const emp = profile?.employee;
  const priv = profile?.privileges;
  const initials = (emp?.name || user?.name || "U").charAt(0).toUpperCase();

  const sections: Array<{ title: string; color: string; items: Array<{ icon: keyof typeof Ionicons.glyphMap; label: string; value?: string | null }> }> = [
    {
      title: "Akun",
      color: colors.primary,
      items: [
        { icon: "person-outline", label: "Username", value: user?.login },
        { icon: "mail-outline", label: "Email", value: user?.email },
      ],
    },
    {
      title: "Karyawan",
      color: "#059669",
      items: [
        { icon: "id-card-outline", label: "Nama Lengkap", value: emp?.name },
        { icon: "briefcase-outline", label: "Jabatan", value: emp?.job_title },
        { icon: "layers-outline", label: "Departemen", value: emp?.department },
        { icon: "business-outline", label: "Perusahaan", value: emp?.company },
        { icon: "call-outline", label: "Telepon", value: emp?.work_phone },
        { icon: "mail-unread-outline", label: "Email Kantor", value: emp?.work_email },
      ],
    },
  ];

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <Stack.Screen options={{ headerShown: false }} />

      <View style={[styles.curvedHeader, { paddingTop: insets.top }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={wpx(22)} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Detail Data Diri</Text>
          <View style={styles.backBtn} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.floatingCard}>
          {/* Avatar */}
          <View style={styles.hero}>
            <Avatar initials={initials} size={72} />
            <Text style={styles.fullName}>{emp?.name || user?.name}</Text>
            {emp?.job_title ? <Text style={styles.jobTitle}>{emp.job_title}</Text> : null}
          </View>

          {/* Sections */}
          {sections.map((section) => (
            <View key={section.title} style={styles.section}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              {section.items.map((item, i) => (
                <View key={item.label}>
                  <View style={styles.infoRow}>
                    <View style={[styles.infoIcon, { backgroundColor: `${section.color}15` }]}>
                      <Ionicons name={item.icon} size={18} color={section.color} />
                    </View>
                    <View style={styles.infoText}>
                      <Text style={styles.infoLabel}>{item.label}</Text>
                      <Text style={styles.infoValue}>{item.value || "—"}</Text>
                    </View>
                  </View>
                  {i < section.items.length - 1 && <View style={styles.divider} />}
                </View>
              ))}
            </View>
          ))}

          {/* Privileges */}
          {priv ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Hak Akses</Text>
              {(["project", "task", "attendance", "time_off"] as const).map((key) => {
                const p = priv[key];
                if (!p) return null;
                return (
                  <View key={key} style={styles.privRow}>
                    <Text style={styles.privLabel}>{key === "time_off" ? "Cuti" : key.charAt(0).toUpperCase() + key.slice(1)}</Text>
                    <View style={styles.privBadges}>
                      {(["create", "read", "update", "delete"] as const).map((action) => (
                        <View key={action} style={[styles.privBadge, { backgroundColor: p[action] ? "#D1FAE5" : "#FEE2E2" }]}>
                          <Text style={[styles.privBadgeText, { color: p[action] ? "#059669" : colors.error }]}>
                            {p[action] ? "✓" : "✗"}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                );
              })}
            </View>
          ) : null}
        </View>
        <View style={{ height: hpx(24) }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  // Curved header
  curvedHeader: {
    height: hpx(130),
    backgroundColor: colors.primary,
    borderBottomLeftRadius: wpx(30),
    borderBottomRightRadius: wpx(30),
    paddingHorizontal: spacing["2xl"],
    justifyContent: "flex-end",
    paddingBottom: hpx(12),
    zIndex: 1,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backBtn: {
    width: sizes.headerBtnWidth,
    height: sizes.headerBtn,
    borderRadius: radius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: rf(17),
    fontWeight: "700" as any,
    color: "#FFFFFF",
    flex: 1,
    textAlign: "center",
    marginHorizontal: spacing.sm,
  },

  // Scroll
  scroll: { paddingHorizontal: spacing["2xl"], paddingBottom: hpx(40) },
  floatingCard: {
    marginTop: -hpx(24),
    backgroundColor: colors.card,
    borderRadius: wpx(20),
    padding: spacing["2xl"],
    ...shadows.elevated,
  },

  hero: { alignItems: "center", marginBottom: spacing["2xl"], marginTop: spacing.sm },
  fullName: { ...textPresets.screenTitle, marginTop: spacing.md },
  jobTitle: { ...textPresets.body, marginTop: spacing.xs },

  section: {
    backgroundColor: colors.card, borderRadius: radius.xl, padding: spacing["2xl"],
    marginBottom: spacing.lg, ...shadows.card,
  },
  sectionTitle: { ...textPresets.sectionHeader, marginBottom: spacing.lg },
  infoRow: { flexDirection: "row", alignItems: "center" },
  infoIcon: { width: 36, height: 36, borderRadius: radius.md, justifyContent: "center", alignItems: "center", marginRight: spacing.md },
  infoText: { flex: 1 },
  infoLabel: { ...textPresets.label },
  infoValue: { ...textPresets.cardTitle, marginTop: 2 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.md, marginLeft: 52 },

  // Privileges
  privRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    marginBottom: spacing.md,
  },
  privLabel: { ...textPresets.cardTitle },
  privBadges: { flexDirection: "row", gap: spacing.xs },
  privBadge: { width: 28, height: 28, borderRadius: radius.sm, justifyContent: "center", alignItems: "center" },
  privBadgeText: { fontSize: 12, fontWeight: "800" as any },
});
