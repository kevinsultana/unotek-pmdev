import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import React from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTasks } from "../../hooks/useTasks";

export default function TimelineScreen() {
  const { tasks, isLoading, error, filter, setFilter, toggleStatus } = useTasks();

  const filteredTasks = tasks.filter((task) => {
    if (filter === "all") return true;

    // Map filter to kanban_state / stage interpretation
    if (filter === "todo") return !task.kanban_state || task.kanban_state === "todo" || task.stage_id === 1;
    if (filter === "in_progress") return task.kanban_state === "in_progress" || task.stage_id === 2;
    if (filter === "done") return task.kanban_state === "done" || task.stage_id === 3;
    return true;
  });

  const getDisplayStatus = (task: typeof tasks[0]): string => {
    const state = task.kanban_state || "";
    if (state === "done") return "done";
    if (state === "in_progress") return "in_progress";
    return "todo";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "todo":
        return (
          <View style={[styles.statusBadge, { backgroundColor: "#FFF4E5" }]}>
            <Text style={[styles.statusBadgeText, { color: "#FFB020" }]}>To Do</Text>
          </View>
        );
      case "in_progress":
        return (
          <View style={[styles.statusBadge, { backgroundColor: "#E0E7FF" }]}>
            <Text style={[styles.statusBadgeText, { color: "#2E5BFF" }]}>In Progress</Text>
          </View>
        );
      case "done":
        return (
          <View style={[styles.statusBadge, { backgroundColor: "#E6F4EA" }]}>
            <Text style={[styles.statusBadgeText, { color: "#10B981" }]}>Done</Text>
          </View>
        );
      default:
        return null;
    }
  };

  const getPriorityBadge = (priority: string) => {
    let color = "#6B7280";
    let bg = "#F3F4F6";

    if (priority === "High") {
      color = "#EF4444";
      bg = "#FEE2E2";
    } else if (priority === "Medium") {
      color = "#3B82F6";
      bg = "#DBEAFE";
    }

    return (
      <View style={[styles.priorityBadge, { backgroundColor: bg }]}>
        <Text style={[styles.priorityBadgeText, { color: color }]}>{priority}</Text>
      </View>
    );
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

        {/* Filter Row */}
        <View style={styles.filterRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {(["all", "todo", "in_progress", "done"] as const).map((type) => {
              const labelMap: Record<string, string> = {
                all: "Semua",
                todo: "To Do",
                in_progress: "In Progress",
                done: "Done",
              };
              const isActive = filter === type;
              return (
                <TouchableOpacity
                  key={type}
                  style={[styles.filterButton, isActive ? styles.filterActiveButton : null]}
                  onPress={() => setFilter(type)}
                >
                  <Text style={[styles.filterButtonText, isActive ? styles.filterActiveButtonText : null]}>
                    {labelMap[type]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
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
          ) : filteredTasks.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="documents-outline" size={48} color="#9CA3AF" />
              <Text style={styles.emptyText}>Tidak ada tugas untuk filter ini.</Text>
            </View>
          ) : (
            filteredTasks.map((task) => {
              const displayStatus = getDisplayStatus(task);
              return (
                <View key={task.id} style={styles.taskCard}>
                  <View style={styles.taskCardHeader}>
                    <View style={styles.row}>
                      <Text style={styles.taskId}>#{task.id}</Text>
                      {getPriorityBadge(task.priority || "Medium")}
                    </View>
                    {getStatusBadge(displayStatus)}
                  </View>

                  <Text style={styles.taskTitle}>{task.name}</Text>
                  {task.description ? (
                    <Text style={styles.taskDesc}>{task.description}</Text>
                  ) : null}

                  <View style={styles.taskCardFooter}>
                    <View style={styles.dueDateWrapper}>
                      <Ionicons name="calendar-outline" size={14} color="#6B7280" />
                      <Text style={styles.dueDateText}>
                        Batas: {task.date_deadline || "Tidak ditentukan"}
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => toggleStatus(task.id, task.stage_id)}
                    >
                      <Text style={styles.actionBtnText}>Ubah Status</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </View>
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
  scrollContainer: {
    padding: 24,
    paddingBottom: 40,
  },
  sectionHeader: {
    marginBottom: 20,
    marginTop: 12,
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
  filterRow: {
    marginBottom: 20,
    flexDirection: "row",
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  filterActiveButton: {
    backgroundColor: "#2E5BFF",
    borderColor: "#2E5BFF",
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#4B5563",
  },
  filterActiveButtonText: {
    color: "#FFFFFF",
  },
  taskListContainer: {
    marginTop: 8,
  },
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
  taskCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  taskId: {
    fontSize: 12,
    fontWeight: "700",
    color: "#9CA3AF",
    marginRight: 8,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  priorityBadgeText: {
    fontSize: 10,
    fontWeight: "700",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1F2937",
    marginBottom: 6,
  },
  taskDesc: {
    fontSize: 13,
    color: "#4B5563",
    lineHeight: 18,
    marginBottom: 16,
  },
  taskCardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    paddingTop: 12,
  },
  dueDateWrapper: {
    flexDirection: "row",
    alignItems: "center",
  },
  dueDateText: {
    fontSize: 11,
    color: "#6B7280",
    marginLeft: 6,
    fontWeight: "500",
  },
  actionBtn: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#2E5BFF",
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
});
