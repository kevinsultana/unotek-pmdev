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
import { taskService } from "../services/taskService";
import { Badge } from "../src/components/ui";
import { colors, hpx, radius, rf, shadows, sizes, spacing, textPresets, wpx } from "../src/constants/theme";
import type { Project } from "../types/project";
import type { Task } from "../types/task";

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

const TASK_STAGE_MAP: Record<string, { c: string; b: string }> = {
  Open: { c: "#F59E0B", b: "#FEF3C7" },
  "In Progress": { c: colors.primary, b: colors.primaryLight },
  "Ready to Test": { c: "#7C3AED", b: "#EDE9FE" },
  Passed: { c: "#059669", b: "#D1FAE5" },
  Failed: { c: colors.error, b: "#FEE2E2" },
  Done: { c: "#059669", b: "#D1FAE5" },
};

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

  const [isTasksExpanded, setIsTasksExpanded] = useState(false);
  const [projectTasks, setProjectTasks] = useState<Task[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [tasksError, setTasksError] = useState<string | null>(null);

  const fetchProjectTasks = async () => {
    if (!id) return;
    try {
      setIsLoadingTasks(true);
      setTasksError(null);
      const res = await taskService.list({ project_id: Number(id), page: 1, per_page: 20 });
      setProjectTasks(res.data.data || []);
    } catch (err: any) {
      setTasksError(err?.response?.data?.message || "Gagal memuat tugas project");
    } finally {
      setIsLoadingTasks(false);
    }
  };

  const toggleTasksCollapse = () => {
    const nextState = !isTasksExpanded;
    setIsTasksExpanded(nextState);
    if (nextState && projectTasks.length === 0) {
      fetchProjectTasks();
    }
  };

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

          {/* ── Task Count (Pressable & Collapse Toggle) ────────────────── */}
          <TouchableOpacity
            style={styles.taskCountCard}
            onPress={toggleTasksCollapse}
            activeOpacity={0.7}
          >
            <View style={[styles.taskCountIcon, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="checkbox-outline" size={24} color={colors.primary} />
            </View>
            <View style={styles.taskCountText}>
              <Text style={styles.taskCountValue}>{project.task_count}</Text>
              <Text style={styles.taskCountLabel}>Total Tugas</Text>
              <Text style={styles.taskCountSubLabel}>
                {isTasksExpanded ? "Sembunyikan daftar tugas" : "Ketuk untuk melihat daftar tugas"}
              </Text>
            </View>
            <Ionicons
              name={isTasksExpanded ? "chevron-down" : "chevron-forward"}
              size={20}
              color={colors.textMuted}
              style={{ marginLeft: "auto", marginRight: spacing.sm }}
            />
          </TouchableOpacity>

          {isTasksExpanded && (
            <View style={styles.tasksSection}>
              {isLoadingTasks ? (
                <ActivityIndicator size="small" color={colors.primary} style={{ paddingVertical: spacing.md }} />
              ) : tasksError ? (
                <View style={styles.centerMin}>
                  <Text style={styles.errorText}>{tasksError}</Text>
                </View>
              ) : projectTasks.length === 0 ? (
                <View style={styles.centerMin}>
                  <Text style={styles.noTasksText}>Belum ada tugas di project ini.</Text>
                </View>
              ) : (
                projectTasks.map((t) => {
                  const stageStyle = TASK_STAGE_MAP[t.stage?.name ?? ""] ?? {
                    c: colors.textMuted,
                    b: "#F1F5F9",
                  };
                  return (
                    <TouchableOpacity
                      key={t.id}
                      style={styles.taskItemCard}
                      onPress={() => router.push(`/task-detail?id=${t.id}`)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.taskItemTop}>
                        <Text style={styles.taskItemName} numberOfLines={1}>{t.name}</Text>
                        <View style={[styles.taskItemStage, { backgroundColor: stageStyle.b }]}>
                          <Text style={[styles.taskItemStageText, { color: stageStyle.c }]}>
                            {t.stage?.name || "—"}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.taskItemBottom}>
                        {t.user_ids != null && t.user_ids.length > 0 ? (
                          <View style={styles.taskItemAssignees}>
                            {t.user_ids.map((u) => (
                              <View key={u.id} style={styles.assigneeTag}>
                                <Text style={styles.assigneeTagText} numberOfLines={1}>
                                  {u.name}
                                </Text>
                              </View>
                            ))}
                          </View>
                        ) : (
                          <Text style={styles.taskItemNoAssignee}>Belum ada assignee</Text>
                        )}
                        {t.date_deadline ? (
                          <View style={styles.taskItemDeadline}>
                            <Ionicons name="calendar-outline" size={12} color={colors.textMuted} />
                            <Text style={styles.taskItemDeadlineText}>
                              {t.date_deadline.substring(0, 10)}
                            </Text>
                          </View>
                        ) : null}
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </View>
          )}

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
  taskCountSubLabel: {
    ...textPresets.caption,
    fontSize: rf(11),
    color: colors.primary,
    marginTop: hpx(2),
    fontWeight: "600" as any,
  },
  tasksSection: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  centerMin: {
    alignItems: "center",
    paddingVertical: spacing.md,
  },
  errorText: {
    ...textPresets.body,
    color: colors.error,
    fontSize: rf(12),
  },
  noTasksText: {
    ...textPresets.body,
    color: colors.textMuted,
    fontSize: rf(12),
  },
  taskItemCard: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  taskItemTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  taskItemName: {
    ...textPresets.cardTitle,
    fontSize: rf(14),
    flex: 1,
    marginRight: spacing.sm,
  },
  taskItemStage: {
    paddingHorizontal: spacing.sm,
    paddingVertical: hpx(2),
    borderRadius: radius.xs,
  },
  taskItemStageText: {
    fontSize: rf(10),
    fontWeight: "700" as any,
  },
  taskItemBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.xs,
  },
  taskItemAssignees: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: spacing.xs,
    flex: 1,
    marginRight: spacing.sm,
  },
  assigneeTag: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: spacing.sm,
    paddingVertical: hpx(2),
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  assigneeTagText: {
    fontSize: rf(10),
    color: colors.textSecondary,
    fontWeight: "600" as any,
  },
  taskItemNoAssignee: {
    fontSize: rf(11),
    color: colors.textMuted,
    fontStyle: "italic",
  },
  taskItemDeadline: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  taskItemDeadlineText: {
    fontSize: rf(11),
    color: colors.textSecondary,
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
