import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { projectService } from "../services/projectService";
import { Badge } from "../src/components/ui";
import { colors, hpx, radius, rf, shadows, sizes, spacing, textPresets, wpx } from "../src/constants/theme";
import type { Project } from "../types/project";

// ponytail: shared status colour map — single source instead of switch-case per screen
const STAGE_STYLES: Record<string, { color: string; bg: string }> = {
  Initiation: { color: "#F59E0B", bg: "#FEF3C7" },
  "Requirement Gathering": { color: "#F59E0B", bg: "#FEF3C7" },
  Implementation: { color: colors.primary, bg: colors.primaryLight },
  "Blueprint Approval": { color: colors.primary, bg: colors.primaryLight },
  UAT: { color: "#7C3AED", bg: "#EDE9FE" },
  "Go-Live Preparation": { color: "#059669", bg: "#D1FAE5" },
  "Hypercare Support": { color: "#059669", bg: "#D1FAE5" },
};

function stageStyle(name?: string) {
  return STAGE_STYLES[name ?? ""] ?? { color: colors.textMuted, bg: "#F1F5F9" };
}

// ── Detail Row component ───────────────────────────────────────────────────
function DetailRow({ icon, label, children }: { icon: keyof typeof Ionicons.glyphMap; label: string; children: React.ReactNode }) {
  return (
    <View style={detailStyles.row}>
      <View style={detailStyles.rowLeft}>
        <Ionicons name={icon} size={18} color={colors.textMuted} />
        <Text style={detailStyles.rowLabel}>{label}</Text>
      </View>
      <View style={detailStyles.rowRight}>{children}</View>
    </View>
  );
}

export default function ProjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        setIsLoading(true);
        setError(null);
        const res = await projectService.getById(Number(id));
        setProject(res.data.data);
      } catch (err: any) {
        setError(err?.response?.data?.message || "Gagal memuat detail project");
      } finally {
        setIsLoading(false);
      }
    })();
  }, [id]);

  if (isLoading) {
    return (
      <View style={[styles.center, { paddingTop: insets.top + spacing["5xl"] }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error || !project) {
    return (
      <View style={styles.container}>
        <View style={[styles.curvedHeader, { paddingTop: insets.top }]}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
              <Ionicons name="arrow-back" size={wpx(22)} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Detail Project</Text>
            <View style={styles.backBtn} />
          </View>
        </View>
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
          <Text style={styles.emptyText}>{error || "Project tidak ditemukan."}</Text>
        </View>
      </View>
    );
  }

  const pStage = stageStyle(project.stage_id?.name);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <Stack.Screen options={{ headerShown: false }} />

      {/* Curved Header */}
      <View style={[styles.curvedHeader, { paddingTop: insets.top }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={wpx(22)} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Detail Project</Text>
          <View style={styles.backBtn} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Floating Card */}
        <View style={styles.floatingCard}>
          {/* Hero */}
          <View style={styles.heroSection}>
            <View style={styles.heroTop}>
              <Badge label={project.stage_id?.name ?? "—"} />
            </View>
            <Text style={styles.heroTitle}>{project.name}</Text>
            {project.description ? (
              <Text style={styles.heroDesc}>{project.description}</Text>
            ) : null}
            <View style={styles.projectId}>
              <Ionicons name="pricetag-outline" size={14} color={colors.textMuted} />
              <Text style={styles.projectIdText}>ID: {project.id}</Text>
            </View>
          </View>

          {/* ── Task Count ────────────────────────────────────────────── */}
          <View style={styles.taskCountCard}>
            <View style={[styles.taskCountIcon, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="checkbox-outline" size={24} color={colors.primary} />
            </View>
            <View style={styles.taskCountText}>
              <Text style={styles.taskCountValue}>{project.task_count}</Text>
              <Text style={styles.taskCountLabel}>Total Tugas</Text>
            </View>
          </View>

          {/* ── Detail Sections ───────────────────────────────────────── */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Informasi Project</Text>

            {!!project.partner && (
              <DetailRow icon="people-outline" label="Klien">
                <View style={detailStyles.person}>
                  <View style={detailStyles.avatar}>
                    <Text style={detailStyles.avatarText}>
                      {(project.partner.name || "").charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <Text style={detailStyles.personName}>{project.partner.name || ""}</Text>
                </View>
              </DetailRow>
            )}

            {!!project.user && (
              <DetailRow icon="person-outline" label="PIC">
                <View style={detailStyles.person}>
                  <View style={[detailStyles.avatar, { backgroundColor: "#D1FAE5" }]}>
                    <Text style={[detailStyles.avatarText, { color: "#059669" }]}>
                      {(project.user.name || "").charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <Text style={detailStyles.personName}>{project.user.name || ""}</Text>
                </View>
              </DetailRow>
            )}

            {!!project.company && (
              <DetailRow icon="business-outline" label="Perusahaan">
                <View style={detailStyles.person}>
                  <View style={[detailStyles.avatar, { backgroundColor: "#FEF3C7" }]}>
                    <Text style={[detailStyles.avatarText, { color: "#F59E0B" }]}>
                      {(project.company.name || "").charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <Text style={detailStyles.personName}>{project.company.name || ""}</Text>
                </View>
              </DetailRow>
            )}

            {!!(project.date_start || project.date) && (
              <DetailRow icon="calendar-outline" label="Periode">
                <Text style={detailStyles.dateText}>
                  {(project.date_start && project.date_start !== "false" ? project.date_start : "—")} → {(project.date && project.date !== "false" ? project.date : "—")}
                </Text>
              </DetailRow>
            )}

            <DetailRow icon="radio-button-on" label="Status">
              <View style={detailStyles.statusRow}>
                <View style={[detailStyles.statusDot, { backgroundColor: project.active ? colors.success : colors.error }]} />
                <Text style={detailStyles.statusValue}>{project.active ? "Aktif" : "Tidak Aktif"}</Text>
              </View>
            </DetailRow>
          </View>
        </View>

        <View style={{ height: spacing["4xl"] }} />
      </ScrollView>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { ...textPresets.body, marginTop: spacing.md },

  // Curved Header
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
  scroll: { paddingHorizontal: spacing["2xl"], paddingBottom: spacing["5xl"] },

  // Floating Card
  floatingCard: {
    marginTop: hpx(6),
    backgroundColor: colors.card,
    borderRadius: wpx(20),
    padding: spacing["2xl"],
    ...shadows.elevated,
  },

  // Hero section (inside floating card)
  heroSection: {
    marginBottom: spacing.xl,
  },
  heroTop: {
    flexDirection: "row",
    marginBottom: spacing.md,
  },
  heroTitle: {
    ...textPresets.display,
    marginBottom: spacing.sm,
  },
  heroDesc: {
    ...textPresets.body,
    marginBottom: spacing.md,
  },
  projectId: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  projectIdText: {
    ...textPresets.label,
  },

  // Task count
  taskCountCard: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  taskCountIcon: {
    width: sizes.iconLg,
    height: sizes.iconLg,
    borderRadius: radius.md,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.lg,
  },
  taskCountText: { flex: 1 },
  taskCountValue: {
    ...textPresets.display,
    fontSize: rf(22),
  },
  taskCountLabel: {
    ...textPresets.caption,
    marginTop: hpx(2),
  },

  // Section
  sectionCard: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.xl,
  },
  sectionTitle: {
    ...textPresets.sectionHeader,
    marginBottom: spacing.lg + spacing.xs,
  },
});

// ── DetailRow sub-styles ───────────────────────────────────────────────────
const detailStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  rowLabel: {
    ...textPresets.body,
    color: colors.textSecondary,
  },
  rowRight: {
    flex: 1,
    alignItems: "flex-end",
  },

  // Person sub-component
  person: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  avatar: {
    width: wpx(32),
    height: hpx(32),
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: rf(13),
    fontWeight: "800" as any,
    color: colors.primary,
  },
  personName: {
    ...textPresets.cardTitle,
    fontSize: rf(14),
  },

  // Date
  dateText: {
    ...textPresets.body,
    color: colors.textPrimary,
  },

  // Status
  statusRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  statusDot: { width: 8, height: 8, borderRadius: radius.full },
  statusValue: {
    ...textPresets.cardTitle,
    fontSize: rf(14),
  },
});
