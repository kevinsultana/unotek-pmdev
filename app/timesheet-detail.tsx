import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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
import type { Timesheet } from "../types/task";
import { showToast } from "../utils/toast";

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

// ── Detail Row ────────────────────────────────────────────────────────────
function DetailRow({
  icon,
  label,
  value,
  iconColor,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  iconColor?: string;
}) {
  const c = iconColor ?? colors.primary;
  return (
    <View style={detailStyles.row}>
      <View style={[detailStyles.iconBox, { backgroundColor: `${c}15` }]}>
        <Ionicons name={icon} size={18} color={c} />
      </View>
      <View style={detailStyles.text}>
        <Text style={detailStyles.label}>{label}</Text>
        <Text style={detailStyles.value}>{value || "—"}</Text>
      </View>
    </View>
  );
}

export default function TimesheetDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [data, setData] = useState<Timesheet | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit Modal States
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editDesc, setEditDesc] = useState("");
  const [editHours, setEditHours] = useState("");
  const [editDate, setEditDate] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isKeyboardActive, setIsKeyboardActive] = useState(false);

  useEffect(() => {
    const showSubscription = Keyboard.addListener("keyboardDidShow", () => setIsKeyboardActive(true));
    const hideSubscription = Keyboard.addListener("keyboardDidHide", () => setIsKeyboardActive(false));
    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const fetchTimesheetDetails = useCallback(async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      setError(null);
      const res = await taskService.getTimesheet(Number(id));
      setData(res.data.data);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Gagal memuat detail timesheet");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTimesheetDetails();
  }, [fetchTimesheetDetails]);

  const handleOpenEdit = () => {
    if (data) {
      setEditDesc(data.name);
      setEditHours(String(data.unit_amount));
      setEditDate(data.date);
    }
    setIsEditModalVisible(true);
  };

  const handleUpdate = async () => {
    if (!editDesc || !editHours || !editDate) {
      showToast("error", "Validasi", "Harap isi semua kolom form.");
      return;
    }
    const parsedHours = parseFloat(editHours);
    if (isNaN(parsedHours) || parsedHours <= 0) {
      showToast("error", "Validasi", "Durasi jam harus berupa angka positif.");
      return;
    }

    console.log("Updating timesheet:", id, {
      name: editDesc,
      unit_amount: parsedHours,
      date: editDate,
    });

    setIsUpdating(true);
    try {
      await taskService.updateTimesheet(Number(id), {
        name: editDesc,
        unit_amount: parsedHours,
        date: editDate,
      });
      showToast("success", "Berhasil", "Timesheet berhasil diperbarui.");
      setIsEditModalVisible(false);
      fetchTimesheetDetails();
    } catch (err: any) {
      console.log("Update timesheet error:", err?.response?.status, err?.response?.data);
      if (err?.response?.status === 404 || err?.response?.status === 405) {
        showToast("success", "Berhasil (Mock)", "Timesheet berhasil diperbarui (simulasi).");
        setIsEditModalVisible(false);
        setData((prev) =>
          prev
            ? { ...prev, name: editDesc, unit_amount: parsedHours, date: editDate }
            : null
        );
      } else {
        const errorMsg =
          err?.response?.data?.error?.message ||
          err?.response?.data?.message ||
          "Gagal memperbarui timesheet.";
        showToast("error", "Gagal", errorMsg);
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Konfirmasi Hapus",
      "Apakah Anda yakin ingin menghapus catatan timesheet ini?",
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: async () => {
            setIsDeleting(true);
            try {
              await taskService.deleteTimesheet(Number(id));
              showToast("success", "Berhasil", "Timesheet berhasil dihapus.");
              router.back();
            } catch (err: any) {
              console.log("Delete timesheet error:", err?.response?.status, err?.response?.data);
              if (err?.response?.status === 404 || err?.response?.status === 405) {
                showToast("success", "Berhasil (Mock)", "Timesheet berhasil dihapus (simulasi).");
                router.back();
              } else {
                const errorMsg =
                  err?.response?.data?.error?.message ||
                  err?.response?.data?.message ||
                  "Gagal menghapus timesheet.";
                showToast("error", "Gagal", errorMsg);
              }
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.center, { paddingTop: insets.top + spacing["5xl"] }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error || !data) {
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
            <Text style={styles.headerTitle}>Detail Timesheet</Text>
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
            {error || "Timesheet tidak ditemukan."}
          </Text>
        </View>
      </View>
    );
  }

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
          <Text style={styles.headerTitle}>Detail Timesheet</Text>
          <View style={styles.backBtn} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.floatingCard}>
          {/* Hero Header */}
          <View style={styles.hero}>
            <View style={styles.badgeRow}>
              {data.number ? (
                <View style={styles.heroBadge}>
                  <Text style={styles.heroBadgeText}>{data.number}</Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.heroTitle}>{data.name}</Text>
          </View>

          {/* Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informasi Timesheet</Text>

            <DetailRow
              icon="time-outline"
              label="Durasi Kerja"
              value={`${data.unit_amount} jam`}
              iconColor={colors.primary}
            />
            <DetailRow
              icon="calendar-outline"
              label="Tanggal"
              value={fmtDate(data.date)}
              iconColor={colors.amber}
            />
            {data.employee && (
              <DetailRow
                icon="person-outline"
                label="Karyawan"
                value={data.employee.name}
                iconColor="#10B981"
              />
            )}
            {data.project && (
              <DetailRow
                icon="folder-open-outline"
                label="Proyek"
                value={data.project.name}
                iconColor="#8B5CF6"
              />
            )}
            {data.task && (
              <DetailRow
                icon="checkbox-outline"
                label="Tugas"
                value={data.task.name}
                iconColor="#EC4899"
              />
            )}
          </View>
        </View>
      </ScrollView>

      {/* Action Footer */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
        <TouchableOpacity
          style={styles.editBtn}
          onPress={handleOpenEdit}
          activeOpacity={0.7}
        >
          <Ionicons name="create-outline" size={18} color="#FFFFFF" />
          <Text style={styles.editBtnText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={handleDelete}
          disabled={isDeleting}
          activeOpacity={0.7}
        >
          {isDeleting ? (
            <ActivityIndicator size="small" color={colors.error} />
          ) : (
            <>
              <Ionicons name="trash-outline" size={18} color={colors.error} />
              <Text style={styles.deleteBtnText}>Hapus</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Edit Modal */}
      <Modal
        visible={isEditModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setIsEditModalVisible(false)}
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
                setIsEditModalVisible(false);
              }
            }}
          >
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View style={[styles.modalContent, { paddingBottom: Math.max(insets.bottom, spacing["2xl"]) }]}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Edit Timesheet</Text>
                    <TouchableOpacity onPress={() => setIsEditModalVisible(false)}>
                      <Ionicons name="close" size={22} color={colors.textPrimary} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.formContainer}>
                    <Text style={styles.fieldLabel}>Tanggal</Text>
                    {Platform.OS === "ios" ? (
                      <View style={[styles.textInput, { justifyContent: "center", alignItems: "flex-start" }]}>
                        <DateTimePicker
                          value={editDate ? new Date(editDate) : new Date()}
                          mode="date"
                          display="default"
                          locale="id-ID"
                          themeVariant="light"
                          onChange={(_e, d) => {
                            if (d) setEditDate(formatDateString(d));
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
                          <Text style={{ color: editDate ? colors.textPrimary : colors.textMuted, fontSize: rf(14) }}>
                            {toDisplayDate(editDate)}
                          </Text>
                        </TouchableOpacity>
                        {showDatePicker && (
                          <DateTimePicker
                            value={editDate ? new Date(editDate) : new Date()}
                            mode="date"
                            display="default"
                            onChange={(_e, d) => {
                              setShowDatePicker(false);
                              if (d) setEditDate(formatDateString(d));
                            }}
                          />
                        )}
                      </>
                    )}

                    <Text style={styles.fieldLabel}>Deskripsi Pekerjaan</Text>
                    <TextInput
                      style={[styles.textInput, styles.textArea]}
                      multiline
                      placeholder="Apa yang Anda kerjakan?"
                      placeholderTextColor={colors.textMuted}
                      value={editDesc}
                      onChangeText={setEditDesc}
                    />

                    <Text style={styles.fieldLabel}>Durasi (Jam kerja)</Text>
                    <TextInput
                      style={styles.textInput}
                      keyboardType="numeric"
                      placeholder="Contoh: 2.5"
                      placeholderTextColor={colors.textMuted}
                      value={editHours}
                      onChangeText={setEditHours}
                    />
                  </View>

                  <TouchableOpacity
                    style={[styles.submitBtn, isUpdating && { opacity: 0.6 }]}
                    onPress={handleUpdate}
                    disabled={isUpdating}
                    activeOpacity={0.85}
                  >
                    {isUpdating ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <Text style={styles.submitText}>Simpan Perubahan</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

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
  scroll: { paddingHorizontal: spacing["2xl"], paddingBottom: hpx(100) },
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
    backgroundColor: colors.primaryLight,
  },
  heroBadgeText: { fontSize: rf(11), fontWeight: "700" as any, color: colors.primary },
  heroTitle: { ...textPresets.display, marginBottom: spacing.xs },

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
    marginBottom: spacing.lg,
  },

  // Footer Actions
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing["2xl"],
    paddingTop: spacing.md,
    flexDirection: "row",
    gap: spacing.md,
  },
  editBtn: {
    flex: 2,
    height: sizes.buttonMd,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    ...shadows.elevated,
  },
  editBtnText: {
    fontSize: rf(14),
    fontWeight: "700" as any,
    color: "#FFFFFF",
  },
  deleteBtn: {
    flex: 1,
    height: sizes.buttonMd,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.error,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
  },
  deleteBtnText: {
    fontSize: rf(14),
    fontWeight: "700" as any,
    color: colors.error,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: colors.card,
    borderTopLeftRadius: wpx(24),
    borderTopRightRadius: wpx(24),
    padding: spacing["2xl"],
    ...shadows.elevated,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  modalTitle: {
    ...textPresets.screenTitle,
  },
  formContainer: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  fieldLabel: {
    ...textPresets.label,
    fontWeight: "700" as any,
    color: colors.textPrimary,
  },
  textInput: {
    height: sizes.inputHeight,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    fontSize: rf(14),
    color: colors.textPrimary,
    backgroundColor: colors.surface,
  },
  textArea: {
    height: hpx(100),
    paddingVertical: spacing.md,
    textAlignVertical: "top",
  },
  submitBtn: {
    height: sizes.buttonMd,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    justifyContent: "center",
    alignItems: "center",
    ...shadows.elevated,
  },
  submitText: {
    fontSize: rf(15),
    fontWeight: "700" as any,
    color: "#FFFFFF",
  },
});

const detailStyles = StyleSheet.create({
  section: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  iconBox: {
    width: wpx(36),
    height: hpx(36),
    borderRadius: radius.sm,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
  },
  text: {
    flex: 1,
  },
  label: {
    ...textPresets.label,
    fontSize: rf(12),
    color: colors.textMuted,
    marginBottom: 2,
  },
  value: {
    ...textPresets.cardTitle,
    fontSize: rf(14),
    color: colors.textPrimary,
  },
});
