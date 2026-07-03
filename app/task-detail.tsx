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
import { colors, hpx, radius, rf, shadows, sizes, spacing, textPresets, wpx } from "../src/constants/theme";
import { Badge } from "../src/components/ui";
import { taskService } from "../services/taskService";
import type { Task } from "../types/task";

// ponytail: single stage colour map, also used in timeline.tsx
export const STAGE_COLORS: Record<string, string> = {
  Open: "#F59E0B",
  "In Progress": colors.primary,
  "Ready to Test": "#7C3AED",
  Passed: "#059669",
  Failed: colors.error,
  Done: "#059669",
};
const STAGE_BG: Record<string, string> = {
  Open: "#FEF3C7",
  "In Progress": colors.primaryLight,
  "Ready to Test": "#EDE9FE",
  Passed: "#D1FAE5",
  Failed: "#FEE2E2",
  Done: "#D1FAE5",
};

const PRIORITY_MAP: Record<string, { label: string; color: string; bg: string }> = {
  "0": { label: "Normal", color: colors.textMuted, bg: "#F1F5F9" },
  "1": { label: "Urgent", color: colors.error, bg: "#FEE2E2" },
};

const tz = "Asia/Jakarta";

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("id-ID", {
      day: "numeric", month: "long", year: "numeric", timeZone: tz,
    });
  } catch {
    return iso;
  }
}

function stripHtml(html?: string | null) {
  if (!html) return "";
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

// ── Shared sub-components ──────────────────────────────────────────────────
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

function AvatarCircle({ name, bg }: { name: string; bg?: string }) {
  return (
    <View style={[detailStyles.avatar, bg ? { backgroundColor: bg } : undefined]}>
      <Text style={detailStyles.avatarText}>{name.charAt(0).toUpperCase()}</Text>
    </View>
  );
}

// ── Screen ─────────────────────────────────────────────────────────────────
export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [task, setTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        setIsLoading(true);
        setError(null);
        const res = await taskService.getById(Number(id));
        setTask(res.data.data);
      } catch (err: any) {
        setError(err?.response?.data?.message || "Gagal memuat detail tugas");
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

  if (error || !task) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <Stack.Screen options={{ headerShown: false }} />
        <View style={[styles.curvedHeader, { paddingTop: insets.top }]}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
              <Ionicons name="arrow-back" size={wpx(22)} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Detail Tugas</Text>
            <View style={styles.backBtn} />
          </View>
        </View>
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
          <Text style={styles.emptyText}>{error || "Tugas tidak ditemukan."}</Text>
        </View>
      </View>
    );
  }

  const st = STAGE_COLORS[task.stage?.name ?? ""];
  const sbg = STAGE_BG[task.stage?.name ?? ""];
  const pr = PRIORITY_MAP[task.priority] ?? PRIORITY_MAP["0"];
  const cleanDesc = stripHtml(task.description);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <Stack.Screen options={{ headerShown: false }} />

      <View style={[styles.curvedHeader, { paddingTop: insets.top }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={wpx(22)} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Detail Tugas</Text>
          <View style={styles.backBtn} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.floatingCard}>
          {/* ── Hero ──────────────────────────────────────────────────── */}
          <View style={styles.hero}>
            <View style={styles.badgeRow}>
              {st && sbg ? (
                <View style={[styles.heroBadge, { backgroundColor: sbg }]}>
                  <Text style={[styles.heroBadgeText, { color: st }]}>{task.stage?.name}</Text>
                </View>
              ) : null}
              <View style={[styles.heroBadge, { backgroundColor: pr.bg }]}>
                <Text style={[styles.heroBadgeText, { color: pr.color }]}>{pr.label}</Text>
              </View>
            </View>
            <Text style={styles.heroTitle}>{task.name}</Text>
            <Text style={styles.heroId}>#{task.id}</Text>
          </View>

          {/* ── Relations ─────────────────────────────────────────────── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informasi</Text>

            {task.project && (
              <DetailRow icon="folder-outline" label="Project">
                <Text style={detailStyles.valueText}>{task.project.name}</Text>
              </DetailRow>
            )}
            {task.partner_id && (
              <DetailRow icon="business-outline" label="Klien">
                <Text style={detailStyles.valueText}>{task.partner_id.name}</Text>
              </DetailRow>
            )}
            {task.parent_id && (
              <DetailRow icon="git-branch-outline" label="Parent Task">
                <Text style={detailStyles.valueText}>{task.parent_id.name}</Text>
              </DetailRow>
            )}
          </View>

          {/* ── Assignees ─────────────────────────────────────────────── */}
          {task.user_ids?.length ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Assignee</Text>
              {task.user_ids.map((u, i) => (
                <View key={u.id} style={[detailStyles.row, i === (task.user_ids?.length ?? 0) - 1 && { borderBottomWidth: 0 }]}>
                  <View style={detailStyles.rowLeft}>
                    <AvatarCircle name={u.name} />
                    <Text style={detailStyles.assigneeName}>{u.name}</Text>
                  </View>
                </View>
              ))}
            </View>
          ) : null}

          {/* ── Dates ─────────────────────────────────────────────────── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tanggal</Text>
            <View style={styles.dateRow}>
              <View style={styles.dateBox}>
                <Ionicons name="calendar-outline" size={18} color={colors.amber} />
                <Text style={styles.dateLabel}>Deadline</Text>
                <Text style={styles.dateValue}>{fmtDate(task.date_deadline)}</Text>
              </View>
              <View style={styles.dateArrow}>
                <Ionicons name="arrow-forward" size={16} color={colors.border} />
              </View>
              <View style={styles.dateBox}>
                <Ionicons name="time-outline" size={18} color={colors.success} />
                <Text style={styles.dateLabel}>Assign</Text>
                <Text style={styles.dateValue}>{fmtDate(task.date_assign)}</Text>
              </View>
            </View>
          </View>

          {/* ── Description ───────────────────────────────────────────── */}
          {cleanDesc ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Deskripsi</Text>
              <Text style={styles.descText}>{cleanDesc}</Text>
            </View>
          ) : null}

          {/* ── Tags ──────────────────────────────────────────────────── */}
          {task.tag_ids?.length ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Tags</Text>
              <View style={styles.tagsRow}>
                {task.tag_ids.map((tag) => (
                  <View key={tag.id} style={styles.tag}>
                    <Text style={styles.tagText}>{tag.name}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {/* ── Child Tasks ───────────────────────────────────────────── */}
          {task.child_ids?.length ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Sub Tugas ({task.child_ids.length})</Text>
              {task.child_ids.map((child) => (
                <View key={child.id} style={styles.childRow}>
                  <Ionicons name="git-commit-outline" size={16} color={colors.textMuted} />
                  <Text style={styles.childName}>{child.name}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
        <View style={{ height: hpx(24) }} />
      </ScrollView>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { ...textPresets.body, marginTop: spacing.md },

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

  // Hero
  hero: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing["2xl"],
    marginBottom: spacing.lg,
    ...shadows.card,
  },
  badgeRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.md },
  heroBadge: { paddingHorizontal: spacing.sm + 2, paddingVertical: spacing.xs, borderRadius: radius.sm },
  heroBadgeText: { fontSize: rf(11), fontWeight: "700" as any },
  heroTitle: { ...textPresets.display, marginBottom: spacing.xs },
  heroId: { ...textPresets.label, fontWeight: "600" as any },

  // Section
  section: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing["2xl"],
    marginBottom: spacing.lg,
    ...shadows.card,
  },
  sectionTitle: {
    ...textPresets.sectionHeader,
    marginBottom: spacing.lg + spacing.xs,
  },

  // Dates
  dateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dateBox: {
    flex: 1,
    alignItems: "center",
    gap: spacing.sm,
  },
  dateArrow: {
    width: wpx(32),
    alignItems: "center",
  },
  dateLabel: { ...textPresets.label, marginTop: spacing.xs },
  dateValue: {
    ...textPresets.cardTitle,
    fontSize: rf(13),
    textAlign: "center",
  },

  // Description
  descText: { ...textPresets.body, lineHeight: rf(22) },

  // Tags
  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  tag: { backgroundColor: colors.primaryLight, paddingHorizontal: spacing.md, paddingVertical: spacing.xs + 1, borderRadius: radius.sm },
  tagText: { fontSize: rf(12), fontWeight: "600" as any, color: colors.primary },

  // Child tasks
  childRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingVertical: spacing.sm },
  childName: { ...textPresets.body, fontSize: rf(13), color: colors.textPrimary },
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
  rowLeft: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  rowLabel: { ...textPresets.body, color: colors.textSecondary },
  rowRight: { flex: 1, alignItems: "flex-end" },
  valueText: { ...textPresets.cardTitle, fontSize: rf(14) },

  // Avatar
  avatar: {
    width: wpx(32),
    height: hpx(32),
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { fontSize: rf(13), fontWeight: "800" as any, color: colors.primary },
  assigneeName: { ...textPresets.body, color: colors.textPrimary, fontWeight: "600" as any },
});
