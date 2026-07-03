import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback } from "react";
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
  const {
    tasks,
    isLoading,
    error,
    filter,
    setFilter,
    searchQuery,
    setSearchQuery,
    refresh,
  } = useTasks();

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Curved Header */}
      <View style={[styles.curvedHeader]}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Tugas</Text>
          <Text style={styles.headerSub}>Daftar tugas yang didelegasikan</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Floating Card */}
        <View style={styles.floatingCard}>
          {/* Filter Toggle */}
          <View style={styles.toggleRow}>
            {(["my", "all"] as const).map((f) => (
              <TouchableOpacity
                key={f}
                style={[styles.toggleBtn, filter === f && styles.toggleActive]}
                onPress={() => setFilter(f)}
              >
                <Text
                  style={[
                    styles.toggleText,
                    filter === f && styles.toggleTextActive,
                  ]}
                >
                  {f === "my" ? "Tugas Saya" : "Semua Tugas"}
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
              placeholder="Cari tugas..."
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons
                  name="close-circle"
                  size={18}
                  color={colors.textMuted}
                />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Task List */}
          {isLoading ? (
            <ActivityIndicator
              size="large"
              color={colors.primary}
              style={{ marginVertical: hpx(32) }}
            />
          ) : error ? (
            <View style={styles.center}>
              <Ionicons
                name="alert-circle-outline"
                size={40}
                color={colors.error}
              />
              <Text style={styles.emptyText}>{error}</Text>
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
            tasks.map((task) => {
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
                    <Text style={styles.projectName} numberOfLines={1}>
                      {task.project?.name || ""}
                    </Text>
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
            })
          )}
        </View>
        <View style={{ height: hpx(80) }} />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push("/task-create")}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={wpx(24)} color="#FFFFFF" />
      </TouchableOpacity>
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
    paddingBottom: hpx(20),
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
    justifyContent: "space-between",
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
});
