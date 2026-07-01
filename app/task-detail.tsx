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
import { SafeAreaView } from "react-native-safe-area-context";
import { taskService } from "../services/taskService";
import type { Task } from "../types/task";

const stageColorMap: Record<string, { color: string; bg: string }> = {
  Open: { color: "#FFB020", bg: "#FFF4E5" },
  "In Progress": { color: "#2E5BFF", bg: "#E0E7FF" },
  "Ready to Test": { color: "#8B5CF6", bg: "#EDE9FE" },
  Passed: { color: "#10B981", bg: "#E6F4EA" },
  Failed: { color: "#EF4444", bg: "#FEE2E2" },
  Done: { color: "#10B981", bg: "#E6F4EA" },
};

const priorityMap: Record<string, { label: string; color: string; bg: string }> = {
  "0": { label: "Normal", color: "#6B7280", bg: "#F3F4F6" },
  "1": { label: "Urgent", color: "#EF4444", bg: "#FEE2E2" },
};

const tz = "Asia/Jakarta";

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric", timeZone: tz });
  } catch { return iso; }
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

export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
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
      <SafeAreaView style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color="#2E5BFF" />
      </SafeAreaView>
    );
  }

  if (error || !task) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
        </View>
        <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
          <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
          <Text style={styles.emptyText}>{error || "Tugas tidak ditemukan."}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const st = stageColorMap[task.stage?.name || ""] || { color: "#9CA3AF", bg: "#F3F4F6" };
  const pr = priorityMap[task.priority] || priorityMap["0"];
  const cleanDesc = stripHtml(task.description);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <Stack.Screen options={{ headerShown: false }} />

      {/* Custom Header */}
      <View style={styles.customHeader}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBackBtn}>
          <Ionicons name="arrow-back" size={22} color="#2E5BFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detail Tugas</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Main Info Card */}
        <View style={styles.mainCard}>
          {/* Stage + Priority */}
          <View style={styles.badgeRow}>
            <View style={[styles.stageBadge, { backgroundColor: st.bg }]}>
              <Text style={[styles.stageBadgeText, { color: st.color }]}>{task.stage?.name || "—"}</Text>
            </View>
            <View style={[styles.priorityBadge, { backgroundColor: pr.bg }]}>
              <Text style={[styles.priorityBadgeText, { color: pr.color }]}>{pr.label}</Text>
            </View>
          </View>

          {/* Task Name */}
          <Text style={styles.taskName}>{task.name}</Text>

          {/* ID */}
          <Text style={styles.taskId}>#{task.id}</Text>
        </View>

        {/* Project & Partner */}
        <View style={styles.detailCard}>
          <Text style={styles.detailCardTitle}>Informasi</Text>

          {task.project ? (
            <View style={styles.detailRow}>
              <Ionicons name="folder-outline" size={18} color="#2E5BFF" />
              <View style={styles.detailTextWrapper}>
                <Text style={styles.detailLabel}>Project</Text>
                <Text style={styles.detailValue}>{task.project.name}</Text>
              </View>
            </View>
          ) : null}

          {task.partner_id ? (
            <View style={[styles.detailRow, { marginTop: 12 }]}>
              <Ionicons name="business-outline" size={18} color="#10B981" />
              <View style={styles.detailTextWrapper}>
                <Text style={styles.detailLabel}>Klien</Text>
                <Text style={styles.detailValue}>{task.partner_id.name}</Text>
              </View>
            </View>
          ) : null}

          {task.parent_id ? (
            <View style={[styles.detailRow, { marginTop: 12 }]}>
              <Ionicons name="git-branch-outline" size={18} color="#FFB020" />
              <View style={styles.detailTextWrapper}>
                <Text style={styles.detailLabel}>Parent Task</Text>
                <Text style={styles.detailValue}>{task.parent_id.name}</Text>
              </View>
            </View>
          ) : null}
        </View>

        {/* Assignees */}
        {task.user_ids && task.user_ids.length > 0 && (
          <View style={styles.detailCard}>
            <Text style={styles.detailCardTitle}>Assignee</Text>
            {task.user_ids.map((u) => (
              <View key={u.id} style={styles.assigneeRow}>
                <View style={styles.assigneeAvatar}>
                  <Text style={styles.assigneeAvatarText}>{u.name.charAt(0).toUpperCase()}</Text>
                </View>
                <Text style={styles.assigneeName}>{u.name}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Dates */}
        <View style={styles.detailCard}>
          <Text style={styles.detailCardTitle}>Tanggal</Text>
          <View style={styles.dateRow}>
            <View style={styles.dateBox}>
              <Ionicons name="calendar-outline" size={20} color="#2E5BFF" />
              <Text style={styles.dateLabel}>Deadline</Text>
              <Text style={styles.dateValue}>{fmtDate(task.date_deadline)}</Text>
            </View>
            <Ionicons name="arrow-forward" size={16} color="#D1D5DB" />
            <View style={styles.dateBox}>
              <Ionicons name="time-outline" size={20} color="#10B981" />
              <Text style={styles.dateLabel}>Assign</Text>
              <Text style={styles.dateValue}>{fmtDate(task.date_assign)}</Text>
            </View>
          </View>
        </View>

        {/* Description */}
        {cleanDesc ? (
          <View style={styles.detailCard}>
            <Text style={styles.detailCardTitle}>Deskripsi</Text>
            <Text style={styles.descText}>{cleanDesc}</Text>
          </View>
        ) : null}

        {/* Tags */}
        {task.tag_ids && task.tag_ids.length > 0 && (
          <View style={styles.detailCard}>
            <Text style={styles.detailCardTitle}>Tags</Text>
            <View style={styles.tagsRow}>
              {task.tag_ids.map((tag) => (
                <View key={tag.id} style={styles.tagBadge}>
                  <Text style={styles.tagText}>{tag.name}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Child Tasks */}
        {task.child_ids && task.child_ids.length > 0 && (
          <View style={styles.detailCard}>
            <Text style={styles.detailCardTitle}>Sub Tugas ({task.child_ids.length})</Text>
            {task.child_ids.map((child) => (
              <View key={child.id} style={styles.childRow}>
                <Ionicons name="git-commit-outline" size={16} color="#9CA3AF" />
                <Text style={styles.childName}>{child.name}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#eeeeefff" },
  customHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    height: 56,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  headerBackBtn: { width: 40, height: 40, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  headerTitle: { fontSize: 17, fontWeight: "700", color: "#1F2937", flex: 1, textAlign: "center", marginRight: 40 },
  headerSpacer: { width: 40 },
  headerRow: { paddingHorizontal: 24, paddingTop: 16 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: "#FFFFFF", justifyContent: "center", alignItems: "center" },
  scrollContainer: { padding: 24, paddingBottom: 40 },
  // Main card
  mainCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    marginBottom: 16,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 2,
  },
  badgeRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  stageBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8 },
  stageBadgeText: { fontSize: 11, fontWeight: "700" },
  priorityBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  priorityBadgeText: { fontSize: 11, fontWeight: "700" },
  taskName: { fontSize: 20, fontWeight: "800", color: "#1F2937", marginBottom: 6 },
  taskId: { fontSize: 13, color: "#9CA3AF", fontWeight: "600" },
  // Detail card
  detailCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 1,
  },
  detailCardTitle: { fontSize: 13, fontWeight: "700", color: "#9CA3AF", marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.5 },
  detailRow: { flexDirection: "row", alignItems: "flex-start" },
  detailTextWrapper: { marginLeft: 12, flex: 1 },
  detailLabel: { fontSize: 11, fontWeight: "600", color: "#9CA3AF" },
  detailValue: { fontSize: 15, fontWeight: "700", color: "#1F2937", marginTop: 2 },
  // Assignee
  assigneeRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  assigneeAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#E0E7FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  assigneeAvatarText: { fontSize: 14, fontWeight: "800", color: "#2E5BFF" },
  assigneeName: { fontSize: 14, fontWeight: "700", color: "#1F2937" },
  // Dates
  dateRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 8 },
  dateBox: { alignItems: "center", width: "45%" },
  dateLabel: { fontSize: 12, color: "#6B7280", marginTop: 6, fontWeight: "600" },
  dateValue: { fontSize: 13, fontWeight: "700", color: "#1F2937", marginTop: 2, textAlign: "center" },
  // Description
  descText: { fontSize: 14, color: "#4B5563", lineHeight: 22 },
  // Tags
  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tagBadge: { backgroundColor: "#F0F4FF", paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8 },
  tagText: { fontSize: 11, fontWeight: "600", color: "#2E5BFF" },
  // Child tasks
  childRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  childName: { fontSize: 13, fontWeight: "600", color: "#4B5563", marginLeft: 8, flex: 1 },
  // Empty
  emptyText: { fontSize: 14, color: "#9CA3AF", marginTop: 12 },
});
