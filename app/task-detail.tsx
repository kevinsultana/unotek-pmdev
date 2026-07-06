import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
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
import type { Task } from "../types/task";
import { showToast } from "../utils/toast";

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

// ── Screen ─────────────────────────────────────────────────────────────────
export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [task, setTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [isTimesheetModalVisible, setIsTimesheetModalVisible] = useState(false);
  const [timesheetDate, setTimesheetDate] = useState(new Date().toISOString().split("T")[0]);
  const [timesheetDesc, setTimesheetDesc] = useState("");
  const [timesheetHours, setTimesheetHours] = useState("");
  const [isSubmittingTimesheet, setIsSubmittingTimesheet] = useState(false);

  useEffect(() => {
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
      } catch (err: any) {
        setError(err?.response?.data?.message || "Gagal memuat detail tugas");
      } finally {
        setIsLoading(false);
      }
    })();
  }, [id]);

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
        employee_id: profile.employee.id,
        name: timesheetDesc,
        unit_amount: parsedHours,
      });
      showToast("success", "Berhasil", "Timesheet berhasil ditambahkan.");
      setIsTimesheetModalVisible(false);
      setTimesheetDesc("");
      setTimesheetHours("");
    } catch (err: any) {
      if (err?.response?.status === 404 || err?.response?.status === 405) {
        showToast("success", "Berhasil (Mock)", "Timesheet ditambahkan (simulasi).");
        setIsTimesheetModalVisible(false);
        setTimesheetDesc("");
        setTimesheetHours("");
      } else {
        showToast("error", "Gagal", err?.response?.data?.message || "Gagal mengirimkan timesheet.");
      }
    } finally {
      setIsSubmittingTimesheet(false);
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
              {st && sbg ? (
                <View style={[styles.heroBadge, { backgroundColor: sbg }]}>
                  <Text style={[styles.heroBadgeText, { color: st }]}>
                    {task.stage?.name}
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
            <Text style={styles.heroId}>#{task.id}</Text>
          </View>

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
                  name="calendar-outline"
                  size={18}
                  color={colors.amber}
                />
                <Text style={styles.dateLabel}>Deadline</Text>
                <Text style={styles.dateValue}>
                  {fmtDate(task.date_deadline)}
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
                  name="time-outline"
                  size={18}
                  color={colors.success}
                />
                <Text style={styles.dateLabel}>Assign</Text>
                <Text style={styles.dateValue}>
                  {fmtDate(task.date_assign)}
                </Text>
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

      {/* Floating Action Button (FAB) untuk Timesheet */}
      {task.user_ids?.some((u: any) => u?.id === profile?.user?.id) && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setIsTimesheetModalVisible(true)}
          activeOpacity={0.85}
        >
          <Ionicons name="time" size={wpx(24)} color="#FFFFFF" />
        </TouchableOpacity>
      )}

      {/* Timesheet Modal */}
      <Modal
        visible={isTimesheetModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setIsTimesheetModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setIsTimesheetModalVisible(false)} />
          <View style={[styles.modalContent, { paddingBottom: Math.max(insets.bottom, spacing["2xl"]) }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Post Timesheet</Text>
              <TouchableOpacity onPress={() => setIsTimesheetModalVisible(false)}>
                <Ionicons name="close" size={22} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.formContainer}>
              <Text style={styles.fieldLabel}>Tanggal</Text>
              <TextInput
                style={styles.textInput}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textMuted}
                value={timesheetDate}
                onChangeText={setTimesheetDate}
              />

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
        </View>
      </Modal>
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
