import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import {
  ActivityIndicator,
  Platform,
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
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detail Data Diri</Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
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

        <View style={{ height: spacing["3xl"] }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: spacing.lg, height: sizes.headerHeight, backgroundColor: colors.card,
    borderBottomWidth: 1, borderBottomColor: colors.border,
    marginTop: Platform.OS === "android" ? spacing.sm : 0,
  },
  headerBtn: { width: sizes.headerBtnWidth, height: sizes.headerBtn, borderRadius: radius.md, justifyContent: "center", alignItems: "center" },
  headerTitle: { ...textPresets.screenTitle, fontSize: 17, flex: 1, textAlign: "left", marginLeft: spacing.xs },

  scroll: { padding: spacing["2xl"], paddingBottom: spacing["4xl"] },
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
