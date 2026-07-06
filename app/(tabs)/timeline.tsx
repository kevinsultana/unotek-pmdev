import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTasks } from "../../hooks/useTasks";
import { projectService } from "../../services/projectService";
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
import type { Project, ProjectListParams } from "../../types/project";

const STAGE_MAP: Record<string, { c: string; b: string }> = {
  Open: { c: "#F59E0B", b: "#FEF3C7" },
  "In Progress": { c: colors.primary, b: colors.primaryLight },
  "Ready to Test": { c: "#7C3AED", b: "#EDE9FE" },
  Passed: { c: "#059669", b: "#D1FAE5" },
  Failed: { c: colors.error, b: "#FEE2E2" },
  Done: { c: "#059669", b: "#D1FAE5" },
};
const PRIORITY_MAP: Record<string, { label: string; c: string; b: string }> = {
  "0": { label: "Normal", c: colors.textMuted, b: "#F1F5F9" },
  "1": { label: "Urgent", c: colors.error, b: "#FEE2E2" },
};

const STAGE_STYLES: Record<string, { c: string; b: string }> = {
  Initiation: { c: "#F59E0B", b: "#FEF3C7" },
  "Requirement Gathering": { c: "#F59E0B", b: "#FEF3C7" },
  Implementation: { c: colors.primary, b: colors.primaryLight },
  "Blueprint Approval": { c: colors.primary, b: colors.primaryLight },
  UAT: { c: "#7C3AED", b: "#EDE9FE" },
  "Go-Live Preparation": { c: "#059669", b: "#D1FAE5" },
  "Hypercare Support": { c: "#059669", b: "#D1FAE5" },
};

function stageStyle(name?: string) {
  return STAGE_STYLES[name ?? ""] ?? { c: colors.textMuted, b: "#F1F5F9" };
}

function stripHtml(html?: string | null) {
  if (!html) return "";
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .trim();
}

export default function TimelineScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ filter?: string }>();

  const {
    tasks,
    isLoading: tasksLoading,
    isLoadMore,
    error: tasksError,
    filter: tasksFilter,
    setFilter: setTasksFilter,
    searchQuery,
    setSearchQuery,
    refresh: refreshTasks,
    loadMore,
  } = useTasks();

  const isCloseToBottom = ({ layoutMeasurement, contentOffset, contentSize }: any) => {
    const paddingToBottom = 50;
    return layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;
  };

  const handleScroll = (event: any) => {
    if (activeTab !== "projects" && isCloseToBottom(event.nativeEvent)) {
      loadMore();
    }
  };

  const [activeTab, setActiveTab] = useState<"my" | "all" | "projects">("projects");
  const [localProjectSearchQuery, setLocalProjectSearchQuery] = useState("");
  const [projectSearchQuery, setProjectSearchQuery] = useState("");
  const [localSearchQuery, setLocalSearchQuery] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [projectsError, setProjectsError] = useState<string | null>(null);

  // Debounced effect for tasks search
  useEffect(() => {
    if (!localSearchQuery.trim()) {
      setSearchQuery("");
      return;
    }
    const timer = setTimeout(() => {
      setSearchQuery(localSearchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [localSearchQuery, setSearchQuery]);

  // Debounced effect for projects search
  useEffect(() => {
    if (!localProjectSearchQuery.trim()) {
      setProjectSearchQuery("");
      return;
    }
    const timer = setTimeout(() => {
      setProjectSearchQuery(localProjectSearchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [localProjectSearchQuery]);

  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>({});

  const toggleProject = (projectName: string) => {
    setExpandedProjects((prev) => ({
      ...prev,
      [projectName]: !prev[projectName],
    }));
  };

  const fetchProjects = useCallback(async (searchVal?: string) => {
    try {
      setProjectsError(null);
      setProjectsLoading(true);
      const params: ProjectListParams = { active: true };
      if (searchVal?.trim()) {
        params.search = searchVal.trim();
      }
      const res = await projectService.list(params);
      setProjects(res.data.data || []);
    } catch (err: any) {
      setProjectsError(err?.response?.data?.message || "Gagal memuat daftar projek");
    } finally {
      setProjectsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (params.filter === "projects") {
      setActiveTab("projects");
    } else if (params.filter === "all") {
      setActiveTab("all");
      setTasksFilter("all");
    } else if (params.filter === "my") {
      setActiveTab("my");
      setTasksFilter("my");
    }
  }, [params.filter]);

  useEffect(() => {
    if (activeTab === "projects") {
      fetchProjects(projectSearchQuery);
    }
  }, [projectSearchQuery, activeTab, fetchProjects]);

  useFocusEffect(
    useCallback(() => {
      if (activeTab === "projects") {
        fetchProjects(projectSearchQuery);
      } else {
        refreshTasks();
      }
    }, [activeTab, projectSearchQuery, fetchProjects, refreshTasks]),
  );

  const handleTabChange = (tab: "my" | "all" | "projects") => {
    setActiveTab(tab);
    if (tab === "my") {
      setTasksFilter("my");
    } else if (tab === "all") {
      setTasksFilter("all");
    }
  };

  // Group tasks by project
  const groupedTasks = tasks.reduce<Record<string, typeof tasks>>((acc, task) => {
    const projectName = task.project?.name || "Tanpa Projek";
    if (!acc[projectName]) {
      acc[projectName] = [];
    }
    acc[projectName].push(task);
    return acc;
  }, {});

  const filteredProjects = projects;

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Curved Header */}
      <View style={[styles.curvedHeader]}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Tugas</Text>
          <Text style={styles.headerSub}>Daftar tugas & projek perusahaan</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {/* Floating Card */}
        <View style={styles.floatingCard}>
          {/* Filter Toggle */}
          <View style={styles.toggleRow}>
            {(["projects", "my", "all",] as const).map((f) => (
              <TouchableOpacity
                key={f}
                style={[styles.toggleBtn, activeTab === f && styles.toggleActive]}
                onPress={() => handleTabChange(f)}
              >
                <Text
                  style={[
                    styles.toggleText,
                    activeTab === f && styles.toggleTextActive,
                  ]}
                >
                  {f === "my" ? "Tugas Saya" : f === "all" ? "Semua Tugas" : "Projek"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Search */}
          <View style={styles.searchBox}>
            <Ionicons
              name="search-outline"
              size={18}
              color={colors.textMuted}
            />
            <TextInput
              style={styles.searchInput}
              placeholder={activeTab === "projects" ? "Cari projek, klien, PIC..." : "Cari tugas..."}
              placeholderTextColor={colors.textMuted}
              value={activeTab === "projects" ? localProjectSearchQuery : localSearchQuery}
              onChangeText={activeTab === "projects" ? setLocalProjectSearchQuery : setLocalSearchQuery}
            />
            {(activeTab === "projects" ? localProjectSearchQuery : localSearchQuery) ? (
              <TouchableOpacity
                onPress={() => {
                  if (activeTab === "projects") {
                    setLocalProjectSearchQuery("");
                    setProjectSearchQuery("");
                  } else {
                    setLocalSearchQuery("");
                    setSearchQuery("");
                  }
                }}
              >
                <Ionicons
                  name="close-circle"
                  size={18}
                  color={colors.textMuted}
                />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Render List */}
          {activeTab === "projects" ? (
            projectsLoading ? (
              <ActivityIndicator
                size="large"
                color={colors.primary}
                style={{ marginVertical: hpx(40) }}
              />
            ) : projectsError ? (
              <View style={styles.center}>
                <Ionicons
                  name="alert-circle-outline"
                  size={40}
                  color={colors.error}
                />
                <Text style={styles.emptyText}>{projectsError}</Text>
                <TouchableOpacity style={styles.retryBtn} onPress={() => fetchProjects(projectSearchQuery)}>
                  <Text style={styles.retryText}>Coba Lagi</Text>
                </TouchableOpacity>
              </View>
            ) : filteredProjects.length === 0 ? (
              <View style={styles.center}>
                <Ionicons
                  name="folder-open-outline"
                  size={40}
                  color={colors.textMuted}
                />
                <Text style={styles.emptyText}>
                  {projectSearchQuery ? "Projek tidak ditemukan." : "Belum ada projek."}
                </Text>
              </View>
            ) : (
              filteredProjects.map((project) => {
                const st = stageStyle(project.stage_id?.name);
                return (
                  <TouchableOpacity
                    key={project.id}
                    style={styles.projectCard}
                    activeOpacity={0.7}
                    onPress={() => router.push(`/project-detail?id=${project.id}`)}
                  >
                    <View style={styles.p_cardTop}>
                      <View style={styles.idBadge}>
                        <Text style={styles.idText}>#{project.id}</Text>
                      </View>
                      {project.stage_id && (
                        <View style={[styles.stageBadge, { backgroundColor: st.b }]}>
                          <Text style={[styles.stageBadgeText, { color: st.c }]}>
                            {project.stage_id.name}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.p_projectName}>{project.name}</Text>
                    {project.description ? (
                      <Text style={styles.projectDesc} numberOfLines={2}>
                        {project.description}
                      </Text>
                    ) : null}
                    <View style={styles.chips}>
                      {project.partner && (
                        <View style={styles.chip}>
                          <Ionicons
                            name="business-outline"
                            size={12}
                            color={colors.textSecondary}
                          />
                          <Text style={styles.chipText}>{project.partner.name}</Text>
                        </View>
                      )}
                      {project.user && (
                        <View style={styles.chip}>
                          <Ionicons
                            name="person-outline"
                            size={12}
                            color={colors.textSecondary}
                          />
                          <Text style={styles.chipText}>{project.user.name}</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.p_footer}>
                      <View style={styles.footerItem}>
                        <Ionicons
                          name="checkbox-outline"
                          size={14}
                          color={colors.primary}
                        />
                        <Text style={styles.p_footerText}>{project.task_count} tugas</Text>
                      </View>
                      {(project.date_start || project.date) && (
                        <View style={styles.footerItem}>
                          <Ionicons
                            name="calendar-outline"
                            size={13}
                            color={colors.textMuted}
                          />
                          <Text style={styles.footerDate}>
                            {project.date_start || "—"} → {project.date || "—"}
                          </Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })
            )
          ) : tasksLoading ? (
            <ActivityIndicator
              size="large"
              color={colors.primary}
              style={{ marginVertical: hpx(32) }}
            />
          ) : tasksError ? (
            <View style={styles.center}>
              <Ionicons
                name="alert-circle-outline"
                size={40}
                color={colors.error}
              />
              <Text style={styles.emptyText}>{tasksError}</Text>
            </View>
          ) : tasks.length === 0 ? (
            <View style={styles.center}>
              <Ionicons
                name="documents-outline"
                size={40}
                color={colors.textMuted}
              />
              <Text style={styles.emptyText}>Tidak ada tugas.</Text>
            </View>
          ) : (
            Object.entries(groupedTasks).map(([projectName, projectTasks]) => {
              const isExpanded = !!expandedProjects[projectName];
              return (
                <View key={projectName} style={styles.projectSection}>
                  <TouchableOpacity
                    style={styles.projectHeaderRow}
                    activeOpacity={0.7}
                    onPress={() => toggleProject(projectName)}
                  >
                    <Ionicons
                      name="folder-open-outline"
                      size={16}
                      color={colors.primary}
                      style={{ marginRight: spacing.sm }}
                    />
                    <Text style={styles.projectHeaderTitle} numberOfLines={1}>
                      {projectName}
                    </Text>
                    <Text style={styles.projectTaskCount}>({projectTasks.length})</Text>
                    <Ionicons
                      name={isExpanded ? "chevron-down-outline" : "chevron-forward-outline"}
                      size={16}
                      color={colors.textMuted}
                      style={{ marginLeft: "auto" }}
                    />
                  </TouchableOpacity>

                  {isExpanded && (
                    <View style={styles.projectTaskList}>
                      {projectTasks.map((task) => {
                        const st = STAGE_MAP[task.stage?.name ?? ""] ?? {
                          c: colors.textMuted,
                          b: "#F1F5F9",
                        };
                        const pr = PRIORITY_MAP[task.priority] ?? PRIORITY_MAP["0"];
                        const desc = stripHtml(task.description);
                        return (
                          <TouchableOpacity
                            key={task.id}
                            style={styles.taskCard}
                            activeOpacity={0.7}
                            onPress={() => router.push(`/task-detail?id=${task.id}`)}
                          >
                            <View style={styles.cardTop}>
                              <View style={styles.cardBadges}>
                                <View style={[styles.badge, { backgroundColor: st.b }]}>
                                  <Text style={[styles.badgeText, { color: st.c }]}>
                                    {task.stage?.name || "—"}
                                  </Text>
                                </View>
                                <View style={[styles.badge, { backgroundColor: pr.b }]}>
                                  <Text style={[styles.badgeText, { color: pr.c }]}>
                                    {pr.label}
                                  </Text>
                                </View>
                              </View>
                            </View>
                            <Text style={styles.taskTitle}>{task.name}</Text>
                            {desc ? (
                              <Text style={styles.taskDesc} numberOfLines={2}>
                                {desc}
                              </Text>
                            ) : null}
                            <View style={styles.footer}>
                              {task.date_deadline && (
                                <View style={styles.footerItem}>
                                  <Ionicons
                                    name="calendar-outline"
                                    size={13}
                                    color={colors.textMuted}
                                  />
                                  <Text style={styles.footerText}>
                                    {task.date_deadline.substring(0, 10)}
                                  </Text>
                                </View>
                              )}
                              {task.user_ids != null && task.user_ids.length > 0 && (
                                <View style={styles.footerItem}>
                                  <Ionicons
                                    name="people-outline"
                                    size={13}
                                    color={colors.textMuted}
                                  />
                                  <Text style={styles.footerText} numberOfLines={1}>
                                    {task.user_ids.map((u) => u.name).join(", ")}
                                  </Text>
                                </View>
                              )}
                            </View>
                            {task.tag_ids != null && task.tag_ids.length > 0 && (
                              <View style={styles.tagsRow}>
                                {task.tag_ids.map((tag) => (
                                  <View key={tag.id} style={styles.tag}>
                                    <Text style={styles.tagText}>{tag.name}</Text>
                                  </View>
                                ))}
                              </View>
                            )}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}
                </View>
              );
            })
          )}
          {isLoadMore && (
            <ActivityIndicator
              size="small"
              color={colors.primary}
              style={{ marginVertical: spacing.md }}
            />
          )}
        </View>
        <View style={{ height: hpx(80) }} />
      </ScrollView>

      {/* FAB */}
      {activeTab !== "projects" && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push("/task-create")}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={wpx(24)} color="#FFFFFF" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  center: { alignItems: "center", paddingVertical: hpx(32) },
  emptyText: { ...textPresets.body, marginTop: spacing.md },

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
  headerTitle: { fontSize: rf(22), fontWeight: "800" as any, color: "#FFFFFF" },
  headerSub: {
    fontSize: rf(13),
    color: "rgba(255,255,255,0.7)",
    marginTop: hpx(4),
  },
  scroll: {
    paddingHorizontal: spacing["2xl"],
    paddingBottom: hpx(40),
    paddingTop: hpx(45),
  },
  floatingCard: {
    marginTop: -hpx(36),
    backgroundColor: colors.card,
    borderRadius: wpx(20),
    padding: spacing["2xl"],
    ...shadows.elevated,
  },

  toggleRow: {
    flexDirection: "row",
    backgroundColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.xs,
    marginBottom: spacing.lg,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: hpx(10),
    borderRadius: radius.sm,
    alignItems: "center",
  },
  toggleActive: { backgroundColor: colors.card, ...shadows.card },
  toggleText: {
    fontSize: rf(13),
    fontWeight: "700" as any,
    color: colors.textMuted,
  },
  toggleTextActive: { color: colors.primary },

  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    height: sizes.searchHeight,
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  searchInput: { flex: 1, color: colors.textPrimary, fontSize: rf(14) },

  projectSection: {
    marginBottom: spacing.lg,
  },
  projectHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  projectHeaderTitle: {
    fontSize: rf(14),
    fontWeight: "700" as any,
    color: colors.textPrimary,
    maxWidth: "70%",
  },
  projectTaskCount: {
    fontSize: rf(13),
    fontWeight: "600" as any,
    color: colors.primary,
    marginLeft: spacing.xs,
  },
  projectTaskList: {
    paddingLeft: spacing.xs,
  },

  taskCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  projectName: { ...textPresets.caption, flex: 1, marginRight: spacing.sm },
  cardBadges: { flexDirection: "row", gap: spacing.xs },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: hpx(3),
    borderRadius: radius.sm,
  },
  badgeText: { fontSize: rf(10), fontWeight: "700" as any },
  taskTitle: { ...textPresets.cardTitle, marginBottom: spacing.xs },
  taskDesc: {
    ...textPresets.body,
    fontSize: rf(13),
    lineHeight: rf(18),
    marginBottom: spacing.md,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  footerItem: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  footerText: { ...textPresets.label, fontSize: rf(11) },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginTop: spacing.sm + 2,
  },
  tag: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: hpx(2),
    borderRadius: radius.xs,
  },
  tagText: {
    fontSize: rf(10),
    fontWeight: "600" as any,
    color: colors.primary,
  },

  fab: {
    position: "absolute",
    right: spacing["2xl"],
    bottom: spacing["2xl"],
    width: sizes.fabSize,
    height: sizes.fabSize,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    ...shadows.elevated,
    shadowColor: colors.primary,
  },
  projectCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  p_cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  idBadge: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs - 1,
    borderRadius: radius.sm,
  },
  idText: {
    fontSize: rf(10),
    fontWeight: "700" as any,
    color: colors.textMuted,
  },
  stageBadge: {
    paddingHorizontal: spacing.sm + 1,
    paddingVertical: spacing.xs - 1,
    borderRadius: radius.sm,
  },
  stageBadgeText: { fontSize: rf(10), fontWeight: "700" as any },
  p_projectName: { ...textPresets.cardTitle, marginBottom: spacing.xs },
  projectDesc: {
    ...textPresets.body,
    fontSize: rf(13),
    lineHeight: rf(18),
    marginBottom: spacing.md,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm + 1,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  chipText: {
    fontSize: rf(11),
    color: colors.textSecondary,
    fontWeight: "500" as any,
  },
  p_footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  p_footerItem: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  p_footerText: {
    fontSize: rf(12),
    fontWeight: "600" as any,
    color: colors.primary,
  },
  footerDate: { fontSize: rf(10), color: colors.textMuted },
  retryBtn: {
    marginTop: spacing.lg,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
  },
  retryText: { color: "#FFFFFF", fontSize: rf(14), fontWeight: "700" as any },
});
