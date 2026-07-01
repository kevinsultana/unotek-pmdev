import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { projectService } from "../../services/projectService";
import type { Project } from "../../types/project";

export default function PerusahaanScreen() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchProjects = useCallback(async () => {
    try {
      setError(null);
      const res = await projectService.list({ active: true });
      setProjects(res.data.data);
    } catch (err: any) {
      const message =
        err?.response?.data?.message || "Gagal memuat daftar project";
      setError(message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Refresh projects setiap kali tab ini di-fokuskan
  useFocusEffect(
    useCallback(() => {
      fetchProjects();
    }, [fetchProjects]),
  );

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchProjects();
  };

  const filteredProjects = projects.filter((p) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.partner?.name?.toLowerCase().includes(q) ||
      p.user?.name?.toLowerCase().includes(q) ||
      p.stage_id?.name?.toLowerCase().includes(q)
    );
  });

  const getStageColor = (stageName?: string) => {
    switch (stageName) {
      case "Initiation":
      case "Requirement Gathering":
        return "#FFB020";
      case "Implementation":
      case "Blueprint Approval":
        return "#2E5BFF";
      case "UAT":
        return "#8B5CF6";
      case "Go-Live Preparation":
      case "Hypercare Support":
        return "#10B981";
      default:
        return "#8F9BB3";
    }
  };

  const getStageBg = (stageName?: string) => {
    switch (stageName) {
      case "Initiation":
      case "Requirement Gathering":
        return "#FFF4E5";
      case "Implementation":
      case "Blueprint Approval":
        return "#E0E7FF";
      case "UAT":
        return "#EDE9FE";
      case "Go-Live Preparation":
      case "Hypercare Support":
        return "#E6F4EA";
      default:
        return "#F3F4F6";
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.headerContainer}>
        <Text style={styles.sectionTitle}>Perusahaan</Text>
        <Text style={styles.sectionSubtitle}>Daftar project & informasi internal</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchWrapper}>
        <Ionicons name="search-outline" size={20} color="#8F9BB3" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Cari nama project, klien, PIC..."
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

      {/* Project List */}
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={["#2E5BFF"]} />
        }
      >
        {isLoading ? (
          <ActivityIndicator size="large" color="#2E5BFF" style={{ marginVertical: 40 }} />
        ) : error ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
            <Text style={styles.emptyText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={fetchProjects}>
              <Text style={styles.retryBtnText}>Coba Lagi</Text>
            </TouchableOpacity>
          </View>
        ) : filteredProjects.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="folder-open-outline" size={48} color="#9CA3AF" />
            <Text style={styles.emptyText}>
              {searchQuery ? "Project tidak ditemukan." : "Belum ada project."}
            </Text>
          </View>
        ) : (
          filteredProjects.map((project) => (
            <TouchableOpacity
              key={project.id}
              style={styles.projectCard}
              activeOpacity={0.7}
              onPress={() => router.push(`/project-detail?id=${project.id}`)}
            >
              {/* Card Header */}
              <View style={styles.cardHeader}>
                <View style={styles.projectIdBadge}>
                  <Text style={styles.projectIdText}>#{project.id}</Text>
                </View>
                {project.stage_id ? (
                  <View
                    style={[
                      styles.stageBadge,
                      { backgroundColor: getStageBg(project.stage_id.name) },
                    ]}
                  >
                    <Text
                      style={[
                        styles.stageBadgeText,
                        { color: getStageColor(project.stage_id.name) },
                      ]}
                    >
                      {project.stage_id.name}
                    </Text>
                  </View>
                ) : null}
              </View>

              {/* Project Name */}
              <Text style={styles.projectName}>{project.name}</Text>
              {project.description ? (
                <Text style={styles.projectDesc}>{project.description}</Text>
              ) : null}

              {/* Detail Rows */}
              <View style={styles.detailSection}>
                {project.partner ? (
                  <View style={styles.detailRow}>
                    <Ionicons name="business-outline" size={16} color="#6B7280" />
                    <Text style={styles.detailText}>{project.partner.name}</Text>
                  </View>
                ) : null}

                {project.user ? (
                  <View style={styles.detailRow}>
                    <Ionicons name="person-outline" size={16} color="#6B7280" />
                    <Text style={styles.detailText}>{project.user.name}</Text>
                  </View>
                ) : null}

                {project.company ? (
                  <View style={styles.detailRow}>
                    <Ionicons name="build-outline" size={16} color="#6B7280" />
                    <Text style={styles.detailText}>{project.company.name}</Text>
                  </View>
                ) : null}
              </View>

              {/* Footer: Task Count */}
              <View style={styles.cardFooter}>
                <View style={styles.taskCountWrapper}>
                  <Ionicons name="checkbox-outline" size={14} color="#2E5BFF" />
                  <Text style={styles.taskCountText}>
                    {project.task_count} tugas
                  </Text>
                </View>

                {project.date_start || project.date ? (
                  <View style={styles.dateWrapper}>
                    <Ionicons name="calendar-outline" size={14} color="#9CA3AF" />
                    <Text style={styles.dateText}>
                      {project.date_start || "—"} {project.date ? `→ ${project.date}` : ""}
                    </Text>
                  </View>
                ) : null}
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#eeeeefff",
    paddingBottom: -30,
  },
  headerContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1F2937",
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 4,
  },
  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 14,
    paddingHorizontal: 16,
    marginHorizontal: 24,
    height: 50,
    marginBottom: 8,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: "#1F2937",
    fontSize: 14,
    fontWeight: "500",
  },
  scrollContainer: {
    padding: 24,
    paddingBottom: 40,
  },
  projectCard: {
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
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  projectIdBadge: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  projectIdText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#6B7280",
  },
  stageBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  stageBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  projectName: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1F2937",
    marginBottom: 6,
  },
  projectDesc: {
    fontSize: 13,
    color: "#4B5563",
    lineHeight: 18,
    marginBottom: 12,
  },
  detailSection: {
    backgroundColor: "#F9FAFB",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  detailText: {
    fontSize: 12,
    color: "#4B5563",
    marginLeft: 8,
    fontWeight: "500",
    flex: 1,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    paddingTop: 12,
  },
  taskCountWrapper: {
    flexDirection: "row",
    alignItems: "center",
  },
  taskCountText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#2E5BFF",
    marginLeft: 6,
  },
  dateWrapper: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    justifyContent: "flex-end",
  },
  dateText: {
    fontSize: 10,
    color: "#9CA3AF",
    marginLeft: 4,
    fontWeight: "500",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: "#9CA3AF",
    marginTop: 12,
  },
  retryBtn: {
    marginTop: 16,
    backgroundColor: "#2E5BFF",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  retryBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
});
