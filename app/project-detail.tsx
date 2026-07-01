import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { projectService } from "../services/projectService";
import type { Project } from "../types/project";

export default function ProjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
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
        const message =
          err?.response?.data?.message || "Gagal memuat detail project";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [id]);

  if (isLoading) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator size="large" color="#2E5BFF" />
      </SafeAreaView>
    );
  }

  if (error || !project) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
        </View>
        <View
          style={[
            styles.container,
            { justifyContent: "center", alignItems: "center" },
          ]}
        >
          <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
          <Text style={styles.emptyText}>
            {error || "Project tidak ditemukan."}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      {/* Custom Header */}
      <View style={styles.customHeader}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.headerBackBtn}
        >
          <Ionicons name="arrow-back" size={22} color="#2E5BFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detail Project</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.headerRow}>
            <Text style={styles.projectName}>{project.name}</Text>
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

          {project.description ? (
            <Text style={styles.description}>{project.description}</Text>
          ) : null}

          <View style={styles.idRow}>
            <Ionicons name="pricetag-outline" size={16} color="#9CA3AF" />
            <Text style={styles.idText}>Project ID: {project.id}</Text>
          </View>
        </View>

        {/* Task Count Card */}
        <View style={styles.statCard}>
          <View style={styles.statIconWrapper}>
            <Ionicons name="checkbox-outline" size={28} color="#2E5BFF" />
          </View>
          <Text style={styles.statValue}>{project.task_count}</Text>
          <Text style={styles.statLabel}>Total Tugas</Text>
        </View>

        {/* Client / Partner Info */}
        {project.partner ? (
          <View style={styles.detailCard}>
            <Text style={styles.detailCardTitle}>Klien</Text>
            <View style={styles.detailContent}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>
                  {project.partner.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailName}>{project.partner.name}</Text>
                <Text style={styles.detailLabel}>Perusahaan Klien</Text>
              </View>
            </View>
          </View>
        ) : null}

        {/* PIC Info */}
        {project.user ? (
          <View style={styles.detailCard}>
            <Text style={styles.detailCardTitle}>Person In Charge (PIC)</Text>
            <View style={styles.detailContent}>
              <View
                style={[styles.avatarCircle, { backgroundColor: "#E6F4EA" }]}
              >
                <Text style={[styles.avatarText, { color: "#10B981" }]}>
                  {project.user.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailName}>{project.user.name}</Text>
                <Text style={styles.detailLabel}>PIC Project</Text>
              </View>
            </View>
          </View>
        ) : null}

        {/* Company Info */}
        {project.company ? (
          <View style={styles.detailCard}>
            <Text style={styles.detailCardTitle}>Perusahaan</Text>
            <View style={styles.detailContent}>
              <View
                style={[styles.avatarCircle, { backgroundColor: "#FFF4E5" }]}
              >
                <Text style={[styles.avatarText, { color: "#FFB020" }]}>
                  {project.company.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailName}>{project.company.name}</Text>
                <Text style={styles.detailLabel}>Entitas</Text>
              </View>
            </View>
          </View>
        ) : null}

        {/* Date Range */}
        {project.date_start || project.date ? (
          <View style={styles.detailCard}>
            <Text style={styles.detailCardTitle}>Periode Project</Text>
            <View style={styles.dateRow}>
              <View style={styles.dateBox}>
                <Ionicons name="calendar-outline" size={20} color="#2E5BFF" />
                <Text style={styles.dateLabel}>Mulai</Text>
                <Text style={styles.dateValue}>
                  {project.date_start || "—"}
                </Text>
              </View>
              <Ionicons name="arrow-forward" size={20} color="#D1D5DB" />
              <View style={styles.dateBox}>
                <Ionicons name="calendar-outline" size={20} color="#2E5BFF" />
                <Text style={styles.dateLabel}>Selesai</Text>
                <Text style={styles.dateValue}>{project.date || "—"}</Text>
              </View>
            </View>
          </View>
        ) : null}

        {/* Status Card */}
        <View style={styles.detailCard}>
          <Text style={styles.detailCardTitle}>Status</Text>
          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: project.active ? "#10B981" : "#EF4444" },
              ]}
            />
            <Text style={styles.statusText}>
              {project.active ? "Aktif" : "Tidak Aktif"}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Helper functions ──
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#eeeeefff",
  },
  customHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    height: 56,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    marginTop: Platform.OS === "android" ? 8 : 0,
  },
  headerBackBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1F2937",
    flex: 1,
    textAlign: "left",
    marginRight: 40,
  },
  headerSpacer: {
    width: 40,
  },
  scrollContainer: {
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
  infoCard: {
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
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  projectName: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1F2937",
    flex: 1,
    marginRight: 12,
  },
  stageBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  stageBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  description: {
    fontSize: 14,
    color: "#4B5563",
    lineHeight: 20,
    marginBottom: 12,
  },
  idRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  idText: {
    fontSize: 13,
    color: "#9CA3AF",
    fontWeight: "600",
    marginLeft: 6,
  },
  statCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 2,
  },
  statIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 20,
    backgroundColor: "#E0E7FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  statValue: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1F2937",
  },
  statLabel: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 4,
  },
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
  detailCardTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#9CA3AF",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  detailContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#E0E7FF",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#2E5BFF",
  },
  detailTextContainer: {
    marginLeft: 14,
    flex: 1,
  },
  detailName: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1F2937",
  },
  detailLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  dateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 8,
  },
  dateBox: {
    alignItems: "center",
    width: "45%",
  },
  dateLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 8,
    fontWeight: "600",
  },
  dateValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1F2937",
    marginTop: 2,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1F2937",
  },
  emptyText: {
    fontSize: 14,
    color: "#9CA3AF",
    marginTop: 12,
  },
});
