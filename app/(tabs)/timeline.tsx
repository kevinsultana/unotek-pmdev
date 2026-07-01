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
import { SafeAreaView } from "react-native-safe-area-context";
import { useTasks } from "../../hooks/useTasks";

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

export default function TimelineScreen() {
  const router = useRouter();
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

  const getStageStyle = (stageName?: string | null) => {
    if (!stageName) return { color: "#9CA3AF", bg: "#F3F4F6", label: "—" };
    const found = stageColorMap[stageName];
    return found || { color: "#6B7280", bg: "#F3F4F6", label: stageName };
  };

  const getPriorityStyle = (p: string) => {
    return priorityMap[p] || priorityMap["0"];
  };

  const stripHtml = (html?: string | null) => {
    if (!html) return "";
    return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").trim();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Tugas Saya (Tasks)</Text>
          <Text style={styles.sectionSubtitle}>Daftar tugas yang didelegasikan untuk Anda</Text>
        </View>

        {/* Filter Toggle: My Tasks / All Tasks */}
        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[styles.toggleBtn, filter === "my" && styles.toggleBtnActive]}
            onPress={() => setFilter("my")}
          >
            <Text style={[styles.toggleBtnText, filter === "my" && styles.toggleBtnTextActive]}>
              Tugas Saya
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, filter === "all" && styles.toggleBtnActive]}
            onPress={() => setFilter("all")}
          >
            <Text style={[styles.toggleBtnText, filter === "all" && styles.toggleBtnTextActive]}>
              Semua Tugas
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchWrapper}>
          <Ionicons name="search-outline" size={20} color="#8F9BB3" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari tugas..."
            placeholderTextColor="#A9B5C9"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={20} color="#8F9BB3" />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Task List */}
        <View style={styles.taskListContainer}>
          {isLoading ? (
            <ActivityIndicator size="large" color="#2E5BFF" style={{ marginVertical: 40 }} />
          ) : error ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
              <Text style={styles.emptyText}>{error}</Text>
            </View>
          ) : tasks.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="documents-outline" size={48} color="#9CA3AF" />
              <Text style={styles.emptyText}>Tidak ada tugas.</Text>
            </View>
          ) : (
            tasks.map((task) => {
              const st = getStageStyle(task.stage?.name);
              const pr = getPriorityStyle(task.priority);
              const desc = stripHtml(task.description);
              return (
                <TouchableOpacity
                  key={task.id}
                  style={styles.taskCard}
                  activeOpacity={0.7}
                  onPress={() => router.push(`/task-detail?id=${task.id}`)}
                >
                  {/* Header: Project Name + Stage Badge */}
                  <View style={styles.taskCardTop}>
                    <Text style={styles.projectName} numberOfLines={1}>
                      {task.project?.name || ""}
                    </Text>
                    <View style={[styles.stageBadge, { backgroundColor: st.bg }]}>
                      <Text style={[styles.stageBadgeText, { color: st.color }]}>
                        {task.stage?.name || "—"}
                      </Text>
                    </View>
                  </View>

                  {/* Task Name */}
                  <Text style={styles.taskName}>{task.name}</Text>

                  {/* Description (stripped) */}
                  {desc ? (
                    <Text style={styles.taskDesc} numberOfLines={2}>
                      {desc}
                    </Text>
                  ) : null}

                  {/* Info Row: Priority + Partner + Deadline */}
                  <View style={styles.infoRow}>
                    <View style={[styles.priorityBadge, { backgroundColor: pr.bg }]}>
                      <Text style={[styles.priorityBadgeText, { color: pr.color }]}>
                        {pr.label}
                      </Text>
                    </View>

                    {task.partner_id ? (
                      <View style={styles.partnerBadge}>
                        <Ionicons name="business-outline" size={12} color="#6B7280" />
                        <Text style={styles.partnerText}>{task.partner_id.name}</Text>
                      </View>
                    ) : null}
                  </View>

                  {/* Footer: Deadline + Assignee */}
                  <View style={styles.taskCardFooter}>
                    {task.date_deadline ? (
                      <View style={styles.footerItem}>
                        <Ionicons name="calendar-outline" size={14} color="#6B7280" />
                        <Text style={styles.footerText}>
                          {task.date_deadline.substring(0, 10)}
                        </Text>
                      </View>
                    ) : null}

                    {task.user_ids && task.user_ids.length > 0 ? (
                      <View style={styles.footerItem}>
                        <Ionicons name="people-outline" size={14} color="#6B7280" />
                        <Text style={styles.footerText} numberOfLines={1}>
                          {task.user_ids.map((u) => u.name).join(", ")}
                        </Text>
                      </View>
                    ) : null}
                  </View>

                  {/* Tags */}
                  {task.tag_ids && task.tag_ids.length > 0 ? (
                    <View style={styles.tagsRow}>
                      {task.tag_ids.map((tag) => (
                        <View key={tag.id} style={styles.tagBadge}>
                          <Text style={styles.tagText}>{tag.name}</Text>
                        </View>
                      ))}
                    </View>
                  ) : null}
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#eeeeefff", paddingBottom: -30 },
  scrollContainer: { padding: 24, paddingBottom: 40 },
  sectionHeader: { marginBottom: 16, marginTop: 12 },
  sectionTitle: { fontSize: 22, fontWeight: "800", color: "#1F2937" },
  sectionSubtitle: { fontSize: 14, color: "#6B7280", marginTop: 4 },
  // Toggle filter
  toggleRow: {
    flexDirection: "row",
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  toggleBtnActive: { backgroundColor: "#FFFFFF", shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  toggleBtnText: { fontSize: 13, fontWeight: "700", color: "#6B7280" },
  toggleBtnTextActive: { color: "#2E5BFF" },
  // Search
  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 48,
    marginBottom: 20,
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, color: "#1F2937", fontSize: 14, fontWeight: "500" },
  // Task list
  taskListContainer: { marginTop: 4 },
  taskCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 2,
  },
  taskCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  projectName: { fontSize: 12, fontWeight: "600", color: "#9CA3AF", flex: 1, marginRight: 8 },
  stageBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  stageBadgeText: { fontSize: 11, fontWeight: "700" },
  taskName: { fontSize: 16, fontWeight: "800", color: "#1F2937", marginBottom: 6 },
  taskDesc: { fontSize: 13, color: "#6B7280", lineHeight: 18, marginBottom: 12 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12, flexWrap: "wrap" },
  priorityBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  priorityBadgeText: { fontSize: 10, fontWeight: "700" },
  partnerBadge: { flexDirection: "row", alignItems: "center", gap: 4 },
  partnerText: { fontSize: 11, color: "#6B7280", fontWeight: "600" },
  taskCardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    paddingTop: 12,
    flexWrap: "wrap",
    gap: 8,
  },
  footerItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  footerText: { fontSize: 11, color: "#6B7280", fontWeight: "500", flexShrink: 1 },
  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 10 },
  tagBadge: { backgroundColor: "#F0F4FF", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  tagText: { fontSize: 10, fontWeight: "600", color: "#2E5BFF" },
  emptyContainer: { alignItems: "center", paddingVertical: 40 },
  emptyText: { fontSize: 14, color: "#9CA3AF", marginTop: 12 },
});
