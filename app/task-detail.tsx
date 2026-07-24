import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as Clipboard from "expo-clipboard";
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  LayoutAnimation,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  UIManager,
  useWindowDimensions,
  View,
} from "react-native";
import RenderHTML from "react-native-render-html";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { profileService } from "../services/profileService";
import { taskService } from "../services/taskService";
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
} from "../src/constants/theme";
import type { ProfileResponse } from "../types/profile";
import type { Task, TaskStageItem, Timesheet } from "../types/task";
import { showToast } from "../utils/toast";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export const STAGE_COLORS: Record<string, string> = {
  New: "#F59E0B",
  Baru: "#F59E0B",
  Open: "#F59E0B",
  "In Progress": colors.primary,
  "Dalam Proses": colors.primary,
  "Dalam Pengerjaan": colors.primary,
  "Ready to Test": "#7C3AED",
  "Siap Diuji": "#7C3AED",
  Passed: "#059669",
  Lulus: "#059669",
  Failed: colors.error,
  Gagal: colors.error,
  Done: "#059669",
  Selesai: "#059669",
  "On Hold": "#D97706",
  Hold: "#D97706",
  Tertunda: "#D97706",
  Cancelled: "#9CA3AF",
  Batal: "#9CA3AF",
  Dibatalkan: "#9CA3AF",
  Backlog: "#6B7280",
};
const STAGE_BG: Record<string, string> = {
  New: "#FEF3C7",
  Baru: "#FEF3C7",
  Open: "#FEF3C7",
  "In Progress": colors.primaryLight,
  "Dalam Proses": colors.primaryLight,
  "Dalam Pengerjaan": colors.primaryLight,
  "Ready to Test": "#EDE9FE",
  "Siap Diuji": "#EDE9FE",
  Passed: "#D1FAE5",
  Lulus: "#D1FAE5",
  Failed: "#FEE2E2",
  Gagal: "#FEE2E2",
  Done: "#D1FAE5",
  Selesai: "#D1FAE5",
  "On Hold": "#FEF3C7",
  Hold: "#FEF3C7",
  Tertunda: "#FEF3C7",
  Cancelled: "#F3F4F6",
  Batal: "#F3F4F6",
  Dibatalkan: "#F3F4F6",
  Backlog: "#F3F4F6",
};

const PRIORITY_MAP: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  "0": { label: "Normal", color: colors.textMuted, bg: "#F1F5F9" },
  "1": { label: "Urgent", color: colors.error, bg: "#FEE2E2" },
};

const tz = "Asia/Jakarta";

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: tz,
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
function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View style={detailStyles.infoBlock}>
      <Text style={detailStyles.infoLabel}>{label}</Text>
      <Text style={detailStyles.infoValue}>{value}</Text>
    </View>
  );
}

function AvatarCircle({ name, bg }: { name: string; bg?: string }) {
  return (
    <View
      style={[detailStyles.avatar, bg ? { backgroundColor: bg } : undefined]}
    >
      <Text style={detailStyles.avatarText}>
        {name.charAt(0).toUpperCase()}
      </Text>
    </View>
  );
}

const tagsStyles = {
  body: {
    color: colors.textPrimary,
    fontSize: rf(14),
    lineHeight: rf(22),
  },
  p: {
    color: colors.textPrimary,
    fontSize: rf(14),
    lineHeight: rf(22),
    marginVertical: 4,
  },
  span: {
    fontSize: rf(14),
  },
  ul: {
    color: colors.textPrimary,
    marginVertical: 4,
    paddingLeft: spacing.lg,
  },
  ol: {
    color: colors.textPrimary,
    marginVertical: 4,
    paddingLeft: spacing.lg,
  },
  li: {
    color: colors.textPrimary,
    fontSize: rf(14),
    lineHeight: rf(22),
  },
};

const formatDateString = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const toDisplayDate = (dateStr?: string | null) => {
  if (!dateStr) return "Pilih Tanggal";
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
};

// ── Screen ─────────────────────────────────────────────────────────────────
export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [task, setTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [isTimesheetModalVisible, setIsTimesheetModalVisible] = useState(false);
  const [timesheetDate, setTimesheetDate] = useState(new Date().toISOString().split("T")[0]);
  const [timesheetDesc, setTimesheetDesc] = useState("");
  const [timesheetHours, setTimesheetHours] = useState("");
  const [isSubmittingTimesheet, setIsSubmittingTimesheet] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [isLoadingTimesheets, setIsLoadingTimesheets] = useState(true);

  // Status/SpeedDial states
  const [stages, setStages] = useState<TaskStageItem[]>([]);
  const [taskStates, setTaskStates] = useState<{ id: string; name: string }[]>([]);
  const [isSpeedDialOpen, setIsSpeedDialOpen] = useState(false);
  const [isStatusModalVisible, setIsStatusModalVisible] = useState(false);
  const [isStateModalVisible, setIsStateModalVisible] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isUpdatingState, setIsUpdatingState] = useState(false);

  const [isKeyboardActive, setIsKeyboardActive] = useState(false);
  const [isUpdateTaskModalVisible, setIsUpdateTaskModalVisible] = useState(false);
  const [editTaskName, setEditTaskName] = useState("");
  const [editTaskPriority, setEditTaskPriority] = useState("0");
  const [editTaskPlannedHours, setEditTaskPlannedHours] = useState("");
  const [isUpdatingTask, setIsUpdatingTask] = useState(false);

  useEffect(() => {
    const showSubscription = Keyboard.addListener("keyboardDidShow", () => setIsKeyboardActive(true));
    const hideSubscription = Keyboard.addListener("keyboardDidHide", () => setIsKeyboardActive(false));
    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const toggleSpeedDial = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsSpeedDialOpen(!isSpeedDialOpen);
  };

  const fetchTimesheets = async (taskId: number) => {
    setIsLoadingTimesheets(true);
    try {
      const res = await taskService.listTimesheets({ task_id: taskId });
      setTimesheets(res.data.data || []);
    } catch (err) {
      console.log("Failed to load timesheets:", err);
    } finally {
      setIsLoadingTimesheets(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      if (!id) return;
      (async () => {
        try {
          setIsLoading(true);
          setError(null);
          const [taskRes, profileRes] = await Promise.all([
            taskService.getById(Number(id)),
            profileService.getProfile(),
          ]);
          setTask(taskRes.data.data);
          setProfile(profileRes.data.data);

          // Fetch timesheets
          await fetchTimesheets(taskRes.data.data.id);

          try {
            const [stagesRes, statesRes] = await Promise.all([
              taskService.listStages({
                project_id: taskRes.data.data.project?.id,
              }),
              taskService.listStates(),
            ]);
            setStages(stagesRes.data.data || []);
            setTaskStates(statesRes.data.data || []);
          } catch (stagesErr) {
            console.log("Failed to load stages/states:", stagesErr);
          }
        } catch (err: any) {
          setError(err?.response?.data?.message || "Gagal memuat detail tugas");
        } finally {
          setIsLoading(false);
        }
      })();
    }, [id])
  );

  const isAssignee = !!(
    task?.user_ids?.some(
      (u) =>
        u.id === profile?.user?.id ||
        u.name.toLowerCase() === profile?.user?.name?.toLowerCase() ||
        u.name.toLowerCase() === profile?.employee?.name?.toLowerCase()
    )
  );

  const handlePostTimesheet = async () => {
    if (!timesheetDate || !timesheetDesc || !timesheetHours) {
      showToast("error", "Validasi", "Harap isi semua kolom form.");
      return;
    }
    const parsedHours = parseFloat(timesheetHours);
    if (isNaN(parsedHours) || parsedHours <= 0) {
      showToast("error", "Validasi", "Durasi jam harus berupa angka positif.");
      return;
    }
    if (!profile?.employee?.id) {
      showToast("error", "Error", "ID karyawan tidak ditemukan.");
      return;
    }

    setIsSubmittingTimesheet(true);
    try {
      await taskService.postTimesheet(task!.id, {
        date: timesheetDate,
        name: timesheetDesc,
        unit_amount: parsedHours,
      });
      showToast("success", "Berhasil", "Timesheet berhasil ditambahkan.");
      setIsTimesheetModalVisible(false);
      setTimesheetDesc("");
      setTimesheetHours("");
      await fetchTimesheets(task!.id);
    } catch (err: any) {
      if (err?.response?.status === 404 || err?.response?.status === 405) {
        showToast("success", "Berhasil (Mock)", "Timesheet ditambahkan (simulasi).");
        setIsTimesheetModalVisible(false);
        setTimesheetDesc("");
        setTimesheetHours("");
        await fetchTimesheets(task!.id);
      } else {
        showToast("error", "Gagal", err?.response?.data?.message || "Gagal mengirimkan timesheet.");
        console.log(err?.response?.data)
      }
    } finally {
      setIsSubmittingTimesheet(false);
    }
  };

  const handleOpenUpdateTask = () => {
    if (task) {
      setEditTaskName(task.name);
      setEditTaskPriority(task.priority || "0");
      setEditTaskPlannedHours(task.planned_hours ? String(task.planned_hours) : "");
    }
    setIsUpdateTaskModalVisible(true);
  };

  const handleUpdateTask = async () => {
    if (!editTaskName.trim()) {
      showToast("error", "Validasi", "Nama tugas tidak boleh kosong.");
      return;
    }

    setIsUpdatingTask(true);
    try {
      const plannedHoursNum = editTaskPlannedHours.trim()
        ? parseFloat(editTaskPlannedHours)
        : undefined;

      await taskService.update(task!.id, {
        name: editTaskName.trim(),
        priority: editTaskPriority,
        planned_hours: plannedHoursNum !== undefined && !isNaN(plannedHoursNum) ? plannedHoursNum : undefined,
      });

      showToast("success", "Berhasil", "Detail tugas berhasil diperbarui.");
      setIsUpdateTaskModalVisible(false);

      // Refresh task detail
      const taskRes = await taskService.getById(task!.id);
      setTask(taskRes.data.data);
    } catch (err: any) {
      showToast("error", "Gagal", err?.response?.data?.message || "Gagal memperbarui tugas.");
      console.log("UPDATE TASK ERROR:", JSON.stringify(err?.response?.data, null, 2));
    } finally {
      setIsUpdatingTask(false);
    }
  };

  const handleUpdateStatus = async (stageId: number) => {
    setIsUpdatingStatus(true);
    try {
      await taskService.update(task!.id, { stage_id: stageId });
      showToast("success", "Berhasil", "Status tugas berhasil diperbarui.");
      setIsStatusModalVisible(false);

      // Refresh task detail
      const taskRes = await taskService.getById(task!.id);
      setTask(taskRes.data.data);
    } catch (err: any) {
      showToast("error", "Gagal", err?.response?.data?.message || "Gagal memperbarui status.");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleUpdateStage = async (stateVal: string) => {
    setIsUpdatingState(true);
    try {
      await taskService.update(task!.id, { state: stateVal });
      showToast("success", "Berhasil", "Tahap tugas (stage) berhasil diperbarui.");
      setIsStateModalVisible(false);

      // Refresh task detail
      const taskRes = await taskService.getById(task!.id);
      setTask(taskRes.data.data);
    } catch (err: any) {
      showToast("error", "Gagal", err?.response?.data?.message || "Gagal memperbarui tahap.");
    } finally {
      setIsUpdatingState(false);
    }
  };

  const handleCopyTaskNumber = async () => {
    if (task?.number) {
      await Clipboard.setStringAsync(task.number);
      showToast("success", "Disalin", `Nomor tugas #${task.number} berhasil disalin ke clipboard.`);
    }
  };

  if (isLoading) {
    return (
      <View
        style={[styles.center, { paddingTop: insets.top + spacing["5xl"] }]}
      >
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
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backBtn}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={wpx(22)} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Detail Tugas</Text>
            <View style={styles.backBtn} />
          </View>
        </View>
        <View style={styles.center}>
          <Ionicons
            name="alert-circle-outline"
            size={48}
            color={colors.error}
          />
          <Text style={styles.emptyText}>
            {error || "Tugas tidak ditemukan."}
          </Text>
        </View>
      </View>
    );
  }

  const st = STAGE_COLORS[task.stage?.name ?? ""] || "#4B5563";
  const sbg = STAGE_BG[task.stage?.name ?? ""] || "#F3F4F6";
  const pr = PRIORITY_MAP[task.priority] ?? PRIORITY_MAP["0"];
  const cleanDesc = stripHtml(task.description);
  const totalTimesheetHours = timesheets.reduce((acc, curr) => acc + (curr.unit_amount || 0), 0);

  const getEmployeeName = (emp: any) => {
    if (!emp) return "Karyawan";
    if (Array.isArray(emp)) return emp[1] || "Karyawan";
    if (typeof emp === "object") return emp.name || "Karyawan";
    return String(emp);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <Stack.Screen options={{ headerShown: false }} />

      <View style={[styles.curvedHeader, { paddingTop: insets.top }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={wpx(22)} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Detail Tugas</Text>
          <View style={styles.backBtn} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.floatingCard}>
          {/* ── Hero ──────────────────────────────────────────────────── */}
          <View style={styles.hero}>
            <View style={styles.badgeRow}>
              {task.stage?.name ? (
                <View style={[styles.heroBadge, { backgroundColor: sbg }]}>
                  <Text style={[styles.heroBadgeText, { color: st }]}>
                    {task.stage.name}
                  </Text>
                </View>
              ) : null}
              <View style={[styles.heroBadge, { backgroundColor: pr.bg }]}>
                <Text style={[styles.heroBadgeText, { color: pr.color }]}>
                  {pr.label}
                </Text>
              </View>
            </View>
            <Text style={styles.heroTitle}>{task.name}</Text>
            {task.number ? (
              <TouchableOpacity
                onPress={handleCopyTaskNumber}
                activeOpacity={0.7}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  alignSelf: "flex-start",
                  gap: spacing.xs,
                }}
              >
                <Text style={styles.heroId}>{task.number}</Text>
                <Ionicons
                  name="copy-outline"
                  size={rf(12)}
                  color={colors.textMuted}
                />
              </TouchableOpacity>
            ) : null}
          </View>

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

          {/* ── Relations ─────────────────────────────────────────────── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informasi</Text>

            {task.project && (
              <DetailRow label="Project" value={task.project.name} />
            )}
            {task.partner_id && (
              <DetailRow label="Klien" value={task.partner_id.name} />
            )}
            {task.parent_id && (
              <DetailRow label="Parent Task" value={task.parent_id.name} />
            )}
          </View>

          {/* ── Assignees ─────────────────────────────────────────────── */}
          {task.user_ids?.length ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Assignee</Text>
              {task.user_ids.map((u, i) => (
                <View
                  key={u.id}
                  style={[
                    detailStyles.row,
                    i === (task.user_ids?.length ?? 0) - 1 && {
                      borderBottomWidth: 0,
                    },
                  ]}
                >
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
                <Ionicons
                  name="time-outline"
                  size={18}
                  color={colors.success}
                />
                <Text style={styles.dateLabel}>Assign</Text>
                <Text style={styles.dateValue}>
                  {fmtDate(task.date_assign)}
                </Text>
              </View>
              <View style={styles.dateArrow}>
                <Ionicons
                  name="arrow-forward"
                  size={16}
                  color={colors.border}
                />
              </View>
              <View style={styles.dateBox}>
                <Ionicons
                  name="calendar-outline"
                  size={18}
                  color={colors.amber}
                />
                <Text style={styles.dateLabel}>Deadline</Text>
                <Text style={styles.dateValue}>
                  {fmtDate(task.date_deadline)}
                </Text>
              </View>
            </View>
          </View>

          {/* ── Description ───────────────────────────────────────────── */}
          {task.description && cleanDesc ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Deskripsi</Text>
              <RenderHTML
                contentWidth={width}
                source={{ html: task.description }}
                tagsStyles={tagsStyles}
              />
            </View>
          ) : null}

          {/* ── Timesheet ─────────────────────────────────────────────── */}
          {task.allow_timesheets ? (
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>
                  Timesheet Kerja ({timesheets.length})
                </Text>
                {!isLoadingTimesheets && timesheets.length > 0 && (
                  <Text style={styles.timesheetTotalText}>
                    Total: {totalTimesheetHours} jam
                  </Text>
                )}
              </View>

              {isLoadingTimesheets ? (
                <ActivityIndicator
                  size="small"
                  color={colors.primary}
                  style={{ marginVertical: spacing.md }}
                />
              ) : timesheets.length === 0 ? (
                <View style={styles.emptyTimesheetContainer}>
                  <Ionicons
                    name="document-text-outline"
                    size={24}
                    color={colors.textMuted}
                  />
                  <Text style={styles.emptyTimesheetText}>
                    Belum ada catatan timesheet untuk tugas ini.
                  </Text>
                </View>
              ) : (
                <View style={styles.timesheetListContainer}>
                  {timesheets.map((ts) => {
                    const empName = getEmployeeName(ts.employee);
                    return (
                      <TouchableOpacity
                        key={ts.id}
                        style={styles.timesheetRow}
                        activeOpacity={0.7}
                        onPress={() =>
                          router.push({
                            pathname: "/timesheet-detail",
                            params: { id: ts.id },
                          })
                        }
                      >
                        <View style={styles.timesheetLeft}>
                          <View style={styles.timesheetInfo}>
                            <Text
                              style={styles.timesheetName}
                              numberOfLines={1}
                              ellipsizeMode="tail"
                            >
                              {ts.name}
                            </Text>
                            <View style={styles.timesheetMeta}>
                              <Text style={styles.timesheetEmployee}>
                                {empName}
                              </Text>
                              <View style={styles.timesheetDot} />
                              <Text style={styles.timesheetDate}>
                                {fmtDate(ts.date)}
                              </Text>
                            </View>
                          </View>
                        </View>
                        <View style={styles.timesheetRight}>
                          <View style={styles.timesheetHoursBadge}>
                            <Text style={styles.timesheetHoursText}>
                              {ts.unit_amount} jam
                            </Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          ) : null}

          {/* ── Child Tasks ───────────────────────────────────────────── */}
          {task.child_ids?.length ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Sub Tugas ({task.child_ids.length})
              </Text>
              {task.child_ids.map((child) => (
                <View key={child.id} style={styles.childRow}>
                  <Ionicons
                    name="git-commit-outline"
                    size={16}
                    color={colors.textMuted}
                  />
                  <Text style={styles.childName}>{child.name}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
        <View style={{ height: hpx(80) }} />
      </ScrollView>

      {/* Speed Dial Backdrop */}
      {isSpeedDialOpen && (
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={() => {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setIsSpeedDialOpen(false);
          }}
        >
          <View style={styles.backdrop} />
        </Pressable>
      )}

      {/* Speed Dial FAB Menu */}
      {isAssignee && (
        <View style={styles.speedDialContainer}>
          {isSpeedDialOpen && (
            <View style={styles.speedDialMenu}>
              {task.allow_timesheets && (
                <View style={styles.speedDialItem}>
                  <View style={styles.speedDialLabelBg}>
                    <Text style={styles.speedDialLabel}>Isi Timesheet</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.miniFab, { backgroundColor: colors.primary, marginRight: wpx(8) }]}
                    onPress={() => {
                      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                      setIsSpeedDialOpen(false);
                      setIsTimesheetModalVisible(true);
                    }}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="time" size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              )}
              <View style={styles.speedDialItem}>
                <View style={styles.speedDialLabelBg}>
                  <Text style={styles.speedDialLabel}>Update Status</Text>
                </View>
                <TouchableOpacity
                  style={[styles.miniFab, { backgroundColor: "#10B981", marginRight: wpx(8) }]}
                  onPress={() => {
                    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                    setIsSpeedDialOpen(false);
                    setIsStatusModalVisible(true);
                  }}
                  activeOpacity={0.85}
                >
                  <Ionicons name="sync" size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
              <View style={styles.speedDialItem}>
                <View style={styles.speedDialLabelBg}>
                  <Text style={styles.speedDialLabel}>Update Stage</Text>
                </View>
                <TouchableOpacity
                  style={[styles.miniFab, { backgroundColor: "#F59E0B", marginRight: wpx(8) }]}
                  onPress={() => {
                    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                    setIsSpeedDialOpen(false);
                    setIsStateModalVisible(true);
                  }}
                  activeOpacity={0.85}
                >
                  <Ionicons name="list-circle" size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
              <View style={styles.speedDialItem}>
                <View style={styles.speedDialLabelBg}>
                  <Text style={styles.speedDialLabel}>Update Task</Text>
                </View>
                <TouchableOpacity
                  style={[styles.miniFab, { backgroundColor: "#6366F1", marginRight: wpx(8) }]}
                  onPress={() => {
                    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                    setIsSpeedDialOpen(false);
                    handleOpenUpdateTask();
                  }}
                  activeOpacity={0.85}
                >
                  <Ionicons name="create" size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>
          )}
          <TouchableOpacity
            style={[styles.fab, isSpeedDialOpen && { backgroundColor: colors.textSecondary }]}
            onPress={toggleSpeedDial}
            activeOpacity={0.85}
          >
            <Ionicons name={isSpeedDialOpen ? "close" : "add"} size={wpx(24)} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}

      {/* Update Status Modal */}
      <Modal
        visible={isStatusModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setIsStatusModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setIsStatusModalVisible(false)} />
          <View style={[styles.modalContent, { paddingBottom: Math.max(insets.bottom, spacing["2xl"]) }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pilih Status Baru</Text>
              <TouchableOpacity onPress={() => setIsStatusModalVisible(false)}>
                <Ionicons name="close" size={22} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {isUpdatingStatus ? (
              <ActivityIndicator
                size="large"
                color={colors.primary}
                style={{ marginVertical: spacing["4xl"] }}
              />
            ) : (
              <View style={styles.statusListContainer}>
                {stages.map((stage) => {
                  const isCurrent = task?.stage?.id === stage.id;
                  const sColor = STAGE_COLORS[stage.name] || colors.textPrimary;
                  return (
                    <TouchableOpacity
                      key={stage.id}
                      style={[
                        styles.statusRow,
                        isCurrent && { borderColor: colors.primary, borderWidth: 1.5 },
                      ]}
                      onPress={() => handleUpdateStatus(stage.id)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.statusBadgeDot, { backgroundColor: sColor }]} />
                      <Text style={[styles.statusRowText, { color: sColor }]}>
                        {stage.name}
                      </Text>
                      {isCurrent && (
                        <Ionicons
                          name="checkmark"
                          size={18}
                          color={colors.primary}
                          style={{ marginLeft: "auto" }}
                        />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Update Stage Modal */}
      <Modal
        visible={isStateModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setIsStateModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setIsStateModalVisible(false)} />
          <View style={[styles.modalContent, { paddingBottom: Math.max(insets.bottom, spacing["2xl"]) }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pilih Stage Baru</Text>
              <TouchableOpacity onPress={() => setIsStateModalVisible(false)}>
                <Ionicons name="close" size={22} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {isUpdatingState ? (
              <ActivityIndicator
                size="large"
                color={colors.primary}
                style={{ marginVertical: spacing["4xl"] }}
              />
            ) : (
              <View style={styles.statusListContainer}>
                {taskStates.map((stateItem) => {
                  const isCurrent = task?.state === stateItem.id;
                  const sColor = STAGE_COLORS[stateItem.name] || colors.textPrimary;
                  return (
                    <TouchableOpacity
                      key={stateItem.id}
                      style={[
                        styles.statusRow,
                        isCurrent && { borderColor: colors.primary, borderWidth: 1.5 },
                      ]}
                      onPress={() => handleUpdateStage(stateItem.id)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.statusBadgeDot, { backgroundColor: sColor }]} />
                      <Text style={[styles.statusRowText, { color: sColor }]}>
                        {stateItem.name}
                      </Text>
                      {isCurrent && (
                        <Ionicons
                          name="checkmark"
                          size={18}
                          color={colors.primary}
                          style={{ marginLeft: "auto" }}
                        />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Timesheet Modal */}
      <Modal
        visible={isTimesheetModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setIsTimesheetModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1 }}
        >
          <TouchableWithoutFeedback
            onPress={() => {
              if (isKeyboardActive) {
                Keyboard.dismiss();
              } else {
                setIsTimesheetModalVisible(false);
              }
            }}
          >
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View style={[styles.modalContent, { paddingBottom: Math.max(insets.bottom, spacing["2xl"]) }]}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Post Timesheet</Text>
                    <TouchableOpacity onPress={() => setIsTimesheetModalVisible(false)}>
                      <Ionicons name="close" size={22} color={colors.textPrimary} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.formContainer}>
                    <Text style={styles.fieldLabel}>Tanggal</Text>
                    {Platform.OS === "ios" ? (
                      <View style={[styles.textInput, { justifyContent: "center", alignItems: "flex-start" }]}>
                        <DateTimePicker
                          value={timesheetDate ? new Date(timesheetDate) : new Date()}
                          mode="date"
                          display="default"
                          locale="id-ID"
                          themeVariant="light"
                          onChange={(_e, d) => {
                            if (d) setTimesheetDate(formatDateString(d));
                          }}
                          style={{ marginLeft: -8 }}
                        />
                      </View>
                    ) : (
                      <>
                        <TouchableOpacity
                          style={[styles.textInput, { justifyContent: "center" }]}
                          onPress={() => setShowDatePicker(true)}
                          activeOpacity={0.7}
                        >
                          <Text style={{ color: timesheetDate ? colors.textPrimary : colors.textMuted, fontSize: rf(14) }}>
                            {toDisplayDate(timesheetDate)}
                          </Text>
                        </TouchableOpacity>
                        {showDatePicker && (
                          <DateTimePicker
                            value={timesheetDate ? new Date(timesheetDate) : new Date()}
                            mode="date"
                            display="default"
                            onChange={(_e, d) => {
                              setShowDatePicker(false);
                              if (d) setTimesheetDate(formatDateString(d));
                            }}
                          />
                        )}
                      </>
                    )}

                    <Text style={styles.fieldLabel}>Karyawan</Text>
                    <TextInput
                      style={[styles.textInput, { backgroundColor: colors.surface, color: colors.textMuted }]}
                      value={profile?.employee?.name || profile?.user?.name || "Memuat..."}
                      editable={false}
                    />

                    <Text style={styles.fieldLabel}>Deskripsi Pekerjaan</Text>
                    <TextInput
                      style={[styles.textInput, styles.textArea]}
                      multiline
                      placeholder="Apa yang Anda kerjakan?"
                      placeholderTextColor={colors.textMuted}
                      value={timesheetDesc}
                      onChangeText={setTimesheetDesc}
                    />

                    <Text style={styles.fieldLabel}>Durasi (Jam spent)</Text>
                    <TextInput
                      style={styles.textInput}
                      keyboardType="numeric"
                      placeholder="Contoh: 2.5"
                      placeholderTextColor={colors.textMuted}
                      value={timesheetHours}
                      onChangeText={setTimesheetHours}
                    />
                  </View>

                  <TouchableOpacity
                    style={[styles.submitBtn, isSubmittingTimesheet && { opacity: 0.6 }]}
                    onPress={handlePostTimesheet}
                    disabled={isSubmittingTimesheet}
                    activeOpacity={0.85}
                  >
                    {isSubmittingTimesheet ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <Text style={styles.submitText}>Kirim Timesheet</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>

      {/* Update Task Modal */}
      <Modal
        visible={isUpdateTaskModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setIsUpdateTaskModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1 }}
        >
          <TouchableWithoutFeedback
            onPress={() => {
              if (isKeyboardActive) {
                Keyboard.dismiss();
              } else {
                setIsUpdateTaskModalVisible(false);
              }
            }}
          >
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View style={[styles.modalContent, { paddingBottom: Math.max(insets.bottom, spacing["2xl"]) }]}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Update Detail Tugas</Text>
                    <TouchableOpacity onPress={() => setIsUpdateTaskModalVisible(false)}>
                      <Ionicons name="close" size={22} color={colors.textPrimary} />
                    </TouchableOpacity>
                  </View>

                  {isUpdatingTask ? (
                    <ActivityIndicator
                      size="large"
                      color={colors.primary}
                      style={{ marginVertical: spacing["4xl"] }}
                    />
                  ) : (
                    <View style={styles.formContainer}>
                      <Text style={styles.fieldLabel}>Nama Tugas</Text>
                      <TextInput
                        style={styles.textInput}
                        placeholder="Masukkan nama tugas..."
                        placeholderTextColor={colors.textMuted}
                        value={editTaskName}
                        onChangeText={setEditTaskName}
                      />

                      <Text style={styles.fieldLabel}>Prioritas</Text>
                      <View style={{ flexDirection: "row", gap: spacing.md }}>
                        <TouchableOpacity
                          style={[
                            styles.prioritySelectBtn,
                            editTaskPriority === "0" && { borderColor: colors.primary, backgroundColor: colors.primaryLight },
                          ]}
                          onPress={() => setEditTaskPriority("0")}
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.prioritySelectText, editTaskPriority === "0" && { color: colors.primary }]}>
                            Normal
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.prioritySelectBtn,
                            editTaskPriority === "1" && { borderColor: colors.error, backgroundColor: "#FEE2E2" },
                          ]}
                          onPress={() => setEditTaskPriority("1")}
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.prioritySelectText, editTaskPriority === "1" && { color: colors.error }]}>
                            Urgent
                          </Text>
                        </TouchableOpacity>
                      </View>

                      <Text style={styles.fieldLabel}>Estimasi Waktu (Planned Hours)</Text>
                      <TextInput
                        style={styles.textInput}
                        keyboardType="numeric"
                        placeholder="Contoh: 16"
                        placeholderTextColor={colors.textMuted}
                        value={editTaskPlannedHours}
                        onChangeText={setEditTaskPlannedHours}
                      />
                    </View>
                  )}

                  {!isUpdatingTask && (
                    <TouchableOpacity
                      style={styles.submitBtn}
                      onPress={handleUpdateTask}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.submitText}>Simpan Perubahan</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  prioritySelectBtn: {
    flex: 1,
    height: sizes.buttonMd,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
  },
  prioritySelectText: {
    fontSize: rf(14),
    fontWeight: "700" as any,
    color: colors.textPrimary,
  },
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
    fontSize: rf(20),
    fontWeight: "700" as any,
    color: "#FFFFFF",
    flex: 1,
    textAlign: "center",
    marginHorizontal: spacing.sm,
  },

  // Scroll
  scroll: { paddingHorizontal: spacing["2xl"], paddingBottom: hpx(40) },
  floatingCard: {
    marginTop: hpx(6),
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
  heroBadge: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
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

  // Timesheets styles
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  timesheetTotalText: {
    fontSize: rf(13),
    fontWeight: "700" as any,
    color: colors.primary,
  },
  emptyTimesheetContainer: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },
  emptyTimesheetText: {
    ...textPresets.body,
    fontSize: rf(13),
    color: colors.textMuted,
    textAlign: "center",
  },
  timesheetListContainer: {
    gap: spacing.md,
  },
  timesheetRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  timesheetLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    flex: 1,
  },
  timesheetAvatar: {
    width: wpx(32),
    height: hpx(32),
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
  },
  timesheetAvatarText: {
    fontSize: rf(12),
    fontWeight: "800" as any,
    color: colors.primary,
  },
  timesheetInfo: {
    flex: 1,
    gap: hpx(2),
  },
  timesheetName: {
    ...textPresets.cardTitle,
    fontSize: rf(14),
    color: colors.textPrimary,
  },
  timesheetMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  timesheetEmployee: {
    ...textPresets.caption,
    fontSize: rf(12),
    color: colors.textSecondary,
    fontWeight: "500" as any,
  },
  timesheetDot: {
    width: wpx(4),
    height: hpx(4),
    borderRadius: radius.full,
    backgroundColor: colors.textMuted,
  },
  timesheetDate: {
    ...textPresets.caption,
    fontSize: rf(11),
    color: colors.textMuted,
  },
  timesheetRight: {
    alignItems: "flex-end",
    justifyContent: "center",
    marginLeft: spacing.sm,
  },
  timesheetHoursBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs - 2,
    borderRadius: radius.sm,
  },
  timesheetHoursText: {
    fontSize: rf(12),
    fontWeight: "700" as any,
    color: colors.primary,
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
  tag: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 1,
    borderRadius: radius.sm,
  },
  tagText: {
    fontSize: rf(12),
    fontWeight: "600" as any,
    color: colors.primary,
  },

  // Child tasks
  childRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  childName: {
    ...textPresets.body,
    fontSize: rf(13),
    color: colors.textPrimary,
  },
  // FAB & Modal styles
  fab: {
    width: sizes.fabSize,
    height: sizes.fabSize,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    ...shadows.elevated,
    shadowColor: colors.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing["2xl"],
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  modalTitle: { ...textPresets.screenTitle },
  formContainer: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  fieldLabel: {
    fontSize: rf(13),
    fontWeight: "700" as any,
    color: colors.textPrimary,
  },
  textInput: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    height: sizes.buttonMd,
    color: colors.textPrimary,
    fontSize: rf(14),
  },
  textArea: {
    height: hpx(80),
    paddingTop: spacing.md,
    textAlignVertical: "top",
  },
  submitBtn: {
    height: sizes.buttonMd,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    justifyContent: "center",
    alignItems: "center",
    ...shadows.elevated,
    shadowColor: colors.primary,
  },
  submitText: {
    color: "#FFFFFF",
    fontSize: rf(16),
    fontWeight: "700" as any,
  },

  // Speed Dial styles
  speedDialContainer: {
    position: "absolute",
    right: spacing["2xl"],
    bottom: spacing["2xl"],
    alignItems: "flex-end",
    zIndex: 999,
  },
  speedDialMenu: {
    alignItems: "flex-end",
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  speedDialItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  speedDialLabelBg: {
    backgroundColor: "rgba(0,0,0,0.75)",
    paddingHorizontal: spacing.md,
    paddingVertical: hpx(4),
    borderRadius: radius.sm,
  },
  speedDialLabel: {
    color: "#FFFFFF",
    fontSize: rf(12),
    fontWeight: "600" as any,
  },
  miniFab: {
    width: wpx(40),
    height: hpx(40),
    borderRadius: radius.full,
    justifyContent: "center",
    alignItems: "center",
    ...shadows.elevated,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "transparent",
  },

  // Status List Modal styles
  statusListContainer: {
    gap: spacing.md,
    marginVertical: spacing.md,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  statusBadgeDot: {
    width: wpx(8),
    height: hpx(8),
    borderRadius: radius.full,
  },
  statusRowText: {
    fontSize: rf(14),
    fontWeight: "700" as any,
  },
});

// ── DetailRow sub-styles ───────────────────────────────────────────────────
const detailStyles = StyleSheet.create({
  infoBlock: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoLabel: {
    ...textPresets.body,
    fontSize: rf(12),
    color: colors.textSecondary,
    marginBottom: hpx(4),
  },
  infoValue: {
    ...textPresets.cardTitle,
    fontSize: rf(14),
    color: colors.textPrimary,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowLeft: { flexDirection: "row", alignItems: "center", gap: spacing.sm },

  // Avatar
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
  assigneeName: {
    ...textPresets.body,
    color: colors.textPrimary,
    fontWeight: "600" as any,
  },
});
