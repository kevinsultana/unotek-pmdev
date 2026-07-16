import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { useFocusEffect, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useState } from "react";
import {
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { timeOffService } from "../../services/timeOffService";
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
import type { TimeOff, TimeOffBalanceItem } from "../../types/timeOff";
import { showToast } from "../../utils/toast";

interface Submission {
  id: string;
  type: "Cuti" | "Lembur" | "Reimbursement" | "Maintenance";
  title: string;
  details: string;
  amountOrDuration: string;
  date: string;
  status: "pending" | "approved" | "rejected" | "cancel";
  photo_uri?: string | null;
}

const STATUS_MAP = {
  pending: { label: "Pending", c: "#F59E0B", b: "#FEF3C7", icon: "time-outline" },
  approved: { label: "Disetujui", c: "#059669", b: "#D1FAE5", icon: "checkmark-circle-outline" },
  rejected: { label: "Ditolak", c: colors.error, b: "#FEE2E2", icon: "close-circle-outline" },
  cancel: { label: "Dibatalkan", c: colors.textMuted, b: "#F1F5F9", icon: "close-circle-outline" },
} as const;

export default function PengajuanScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [mockSubmissions, setMockSubmissions] = useState<Submission[]>([]);

  // Keyboard active tracking
  const [isKeyboardActive, setIsKeyboardActive] = useState(false);

  React.useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      () => setIsKeyboardActive(true)
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => setIsKeyboardActive(false)
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const handleBackdropPress = () => {
    if (isKeyboardActive) {
      Keyboard.dismiss();
    } else {
      resetForm();
    }
  };

  // Date picker states
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [activeDateField, setActiveDateField] = useState<"cutiDateFrom" | "cutiDateTo" | "lemburDate" | null>(null);

  const formatThousands = (val: string) => {
    const clean = val.replace(/\D/g, "");
    if (!clean) return "";
    return Number(clean).toLocaleString("id-ID");
  };

  const formatDateString = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const toDisplayDate = (dateStr: string) => {
    if (!dateStr) return "Pilih Tanggal";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const onDateChange = (_event: DateTimePickerEvent, date?: Date) => {
    setShowDatePicker(false);
    if (date && activeDateField) {
      const formatted = formatDateString(date);
      if (activeDateField === "cutiDateFrom") setCutiDateFrom(formatted);
      else if (activeDateField === "cutiDateTo") setCutiDateTo(formatted);
      else if (activeDateField === "lemburDate") setLemburDate(formatted);
    }
    setActiveDateField(null);
  };

  const [cutiRecords, setCutiRecords] = useState<TimeOff[]>([]);
  const [balances, setBalances] = useState<TimeOffBalanceItem[]>([]);
  const [isLoadingCuti, setIsLoadingCuti] = useState(false);
  const [cutiError, setCutiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [activeFilter, setActiveFilter] = useState<"all" | "pending" | "approved" | "rejected" | "cancel">("all");

  // Modal states
  const [modalType, setModalType] = useState<"cuti" | "lembur" | null>(null);

  // Form fields
  const [selectedTypeId, setSelectedTypeId] = useState<number | null>(null);
  const [cutiDateFrom, setCutiDateFrom] = useState("");
  const [cutiDateTo, setCutiDateTo] = useState("");
  const [cutiReason, setCutiReason] = useState("");

  const [lemburDate, setLemburDate] = useState("");
  const [lemburHours, setLemburHours] = useState("");
  const [lemburReason, setLemburReason] = useState("");



  const resetForm = () => {
    setSelectedTypeId(null);
    setCutiDateFrom("");
    setCutiDateTo("");
    setCutiReason("");
    setLemburDate("");
    setLemburHours("");
    setLemburReason("");
    setModalType(null);
  };

  const mapStateToStatus = (state: string): "pending" | "approved" | "rejected" | "cancel" => {
    if (["draft", "confirm", "validate1"].includes(state)) return "pending";
    if (["validate", "approved"].includes(state)) return "approved";
    if (state === "cancel") return "cancel";
    return "rejected";
  };

  const fetchCutiRecords = useCallback(async () => {
    setIsLoadingCuti(true);
    setCutiError(null);
    try {
      const res = await timeOffService.list({ page: 1, per_page: 50 });
      setCutiRecords(res.data.data || []);
    } catch (err: any) {
      setCutiError(err?.response?.data?.message || "Gagal memuat riwayat cuti");
    } finally {
      setIsLoadingCuti(false);
    }
  }, []);

  const fetchBalances = useCallback(async () => {
    try {
      const res = await timeOffService.getBalance();
      setBalances(res.data.data?.balances || []);
    } catch {
      // non-critical
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchCutiRecords();
      fetchBalances();
    }, [fetchCutiRecords, fetchBalances]),
  );

  const handleSubmit = async () => {
    if (modalType === "cuti") {
      if (!selectedTypeId || !cutiDateFrom || !cutiDateTo || !cutiReason) {
        showToast("error", "Validasi", "Harap isi semua kolom form.");
        return;
      }
      setIsSubmitting(true);
      try {
        await timeOffService.create({
          holiday_status_id: selectedTypeId,
          date_from: cutiDateFrom,
          date_to: cutiDateTo,
          name: cutiReason,
        });
        showToast("success", "Berhasil", "Pengajuan cuti berhasil dikirim.");
        fetchCutiRecords();
        fetchBalances();
        resetForm();
      } catch (err: any) {
        showToast(
          "error",
          "Gagal",
          err?.response?.data?.message || "Gagal mengirim pengajuan cuti."
        );
      } finally {
        setIsSubmitting(false);
      }
    } else if (modalType === "lembur") {
      if (!lemburDate || !lemburHours || !lemburReason) {
        showToast("error", "Validasi", "Harap isi semua kolom form.");
        return;
      }
      const newEntry: Submission = {
        id: String(Date.now()),
        type: "Lembur",
        title: "Lembur Tambahan",
        details: lemburReason,
        amountOrDuration: `${lemburHours} jam`,
        date: lemburDate,
        status: "pending",
      };
      setMockSubmissions((prev) => [newEntry, ...prev]);
      showToast("success", "Berhasil", "Pengajuan lembur berhasil dikirim.");
      resetForm();
    }
  };

  const mappedCuti: Submission[] = cutiRecords.map((item) => {
    const fromDate = item.date_from ? item.date_from.substring(0, 10) : "";
    const toDate = item.date_to ? item.date_to.substring(0, 10) : "";
    return {
      id: String(item.id),
      type: "Cuti",
      title: item.holiday_status?.name || "Cuti / Izin",
      details: item.name || "Tanpa keterangan",
      amountOrDuration: `${item.number_of_days} hari`,
      date: fromDate && toDate ? `${fromDate} s/d ${toDate}` : fromDate || toDate || "—",
      status: mapStateToStatus(item.state),
    };
  });

  const allSubmissions = [...mappedCuti, ...mockSubmissions];
  allSubmissions.sort((a, b) => {
    const getTimestamp = (dateStr: string) => {
      const firstDate = dateStr.split(" ")[0]; // Ambil bagian awal sebelum "s/d"
      const parsed = Date.parse(firstDate);
      return isNaN(parsed) ? 0 : parsed;
    };
    const timeA = getTimestamp(a.date);
    const timeB = getTimestamp(b.date);
    if (timeA !== timeB) {
      return timeB - timeA; // Descending (terbaru di atas)
    }
    return b.id.localeCompare(a.id, undefined, { numeric: true });
  });

  const filteredSubmissions = allSubmissions.filter((item) => {
    if (activeFilter === "all") return true;
    return item.status === activeFilter;
  });

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Curved Header */}
      <View style={[styles.curvedHeader]}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Pengajuan</Text>
          <Text style={styles.headerSub}>Ajukan izin, lembur, & klaim biaya</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Floating Actions Card */}
        <View style={styles.floatingCard}>
          <Text style={styles.sectionTitle}>Buat Pengajuan Baru</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={[styles.actionBtn, { borderColor: "#DBEAFE" }]}
              onPress={() => router.push("/kehadiran")}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIconBg, { backgroundColor: "#DBEAFE" }]}>
                <Ionicons name="finger-print-outline" size={20} color="#1E40AF" />
              </View>
              <Text style={styles.actionLabel}>Kehadiran</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, { borderColor: "#EDE9FE" }]}
              onPress={() => setModalType("cuti")}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIconBg, { backgroundColor: "#EDE9FE" }]}>
                <Ionicons name="calendar-outline" size={20} color="#7C3AED" />
              </View>
              <Text style={styles.actionLabel}>Cuti / Izin</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, { borderColor: "#FEF3C7" }]}
              onPress={() => setModalType("lembur")}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIconBg, { backgroundColor: "#FEF3C7" }]}>
                <Ionicons name="time-outline" size={20} color="#D97706" />
              </View>
              <Text style={styles.actionLabel}>Lembur</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, { borderColor: "#D1FAE5" }]}
              onPress={() => router.push("/reimbursement")}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIconBg, { backgroundColor: "#D1FAE5" }]}>
                <Ionicons name="receipt-outline" size={20} color="#059669" />
              </View>
              <Text style={styles.actionLabel}>Reimbursement</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, { borderColor: "#FFE4E6" }]}
              onPress={() => router.push("/maintenance")}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIconBg, { backgroundColor: "#FFE4E6" }]}>
                <Ionicons name="build-outline" size={20} color="#E11D48" />
              </View>
              <Text style={styles.actionLabel}>Maintenance</Text>
            </TouchableOpacity>


          </View>
        </View>



        {/* History List */}
        <View style={styles.historySection}>
          <Text style={styles.historyTitle}>Riwayat Pengajuan</Text>

          {/* Status Filter Tabs */}
          <View style={styles.filterRow}>
            {(["all", "pending", "approved", "rejected", "cancel"] as const).map((filterVal) => (
              <TouchableOpacity
                key={filterVal}
                style={[
                  styles.filterTab,
                  activeFilter === filterVal && styles.filterTabActive,
                ]}
                onPress={() => setActiveFilter(filterVal)}
              >
                <Text
                  style={[
                    styles.filterText,
                    activeFilter === filterVal && styles.filterTextActive,
                  ]}
                >
                  {filterVal === "all"
                    ? "Semua"
                    : filterVal === "pending"
                      ? "Pending"
                      : filterVal === "approved"
                        ? "Disetujui"
                        : filterVal === "rejected"
                          ? "Ditolak"
                          : "Batal"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* List items */}
          {filteredSubmissions.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="folder-open-outline" size={40} color={colors.textMuted} />
              <Text style={styles.emptyText}>Tidak ada riwayat pengajuan.</Text>
            </View>
          ) : (
            filteredSubmissions.map((item) => {
              const config = STATUS_MAP[item.status];
              return (
                <View key={item.id} style={styles.historyCard}>
                  <View style={styles.cardHeader}>
                    <View style={styles.typeRow}>
                      <Ionicons
                        name={
                          item.type === "Cuti"
                            ? "calendar"
                            : item.type === "Lembur"
                              ? "time"
                              : "receipt"
                        }
                        size={14}
                        color={colors.primary}
                      />
                      <Text style={styles.typeText}>{item.type}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: config.b }]}>
                      <Ionicons name={config.icon} size={11} color={config.c} style={{ marginRight: 3 }} />
                      <Text style={[styles.statusText, { color: config.c }]}>{config.label}</Text>
                    </View>
                  </View>
                  <Text style={styles.itemTitle}>{item.title}</Text>
                  <Text style={styles.itemDetails}>{item.details}</Text>
                  {item.photo_uri && (
                    <View style={styles.attachmentPreviewContainer}>
                      <Ionicons name="attach" size={14} color={colors.primary} />
                      <Text style={styles.attachmentPreviewText}>Lampiran Bukti</Text>
                      <Image source={{ uri: item.photo_uri }} style={styles.historyAttachmentThumb} />
                    </View>
                  )}
                  <View style={styles.cardFooter}>
                    <Text style={styles.itemVal}>{item.amountOrDuration}</Text>
                    <Text style={styles.itemDate}>{item.date}</Text>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* ── Submission Modals ── */}
      <Modal visible={modalType !== null} animationType="slide" transparent onRequestClose={resetForm}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1 }}
        >
          <View style={styles.modalOverlay}>
            <Pressable style={StyleSheet.absoluteFill} onPress={handleBackdropPress} />
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={[styles.modalContent, { paddingBottom: Math.max(insets.bottom, spacing["2xl"]) }]}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>
                    {modalType === "cuti"
                      ? "Form Cuti / Izin"
                      : modalType === "lembur"
                        ? "Form Pengajuan Lembur"
                        : "Form Reimbursement"}
                  </Text>
                  <TouchableOpacity onPress={resetForm}>
                    <Ionicons name="close" size={22} color={colors.textPrimary} />
                  </TouchableOpacity>
                </View>

                {/* CUTI FORM */}
                {modalType === "cuti" && (
                  <View style={styles.formContainer}>
                    {/* Sisa Alokasi Cuti */}
                    <View style={styles.balanceContainer}>
                      <Text style={styles.balanceHeader}>Sisa Alokasi Cuti Anda</Text>
                      {balances.length === 0 ? (
                        <Text style={styles.noBalanceText}>Tidak ada alokasi cuti aktif.</Text>
                      ) : (
                        <View style={styles.balanceGrid}>
                          {balances.map((b) => (
                            <View key={b.leave_type.id} style={styles.balanceItem}>
                              <Text style={styles.balanceName} numberOfLines={1}>{b.leave_type.name}</Text>
                              <Text style={styles.balanceCount}>
                                <Text style={styles.balanceCountNum}>{b.remaining}</Text> hari
                              </Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>

                    <Text style={styles.fieldLabel}>Pilih Tipe Cuti / Izin</Text>
                    {balances.length === 0 ? (
                      <Text style={styles.noBalanceText}>Memuat tipe cuti...</Text>
                    ) : (
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.typeSelectorScroll}>
                        {balances.map((b) => (
                          <TouchableOpacity
                            key={b.leave_type.id}
                            style={[
                              styles.dropdownBtn,
                              selectedTypeId === b.leave_type.id && styles.dropdownBtnActive,
                              { paddingHorizontal: spacing.md, marginRight: spacing.xs, flex: 0, minWidth: wpx(100) }
                            ]}
                            onPress={() => setSelectedTypeId(b.leave_type.id)}
                          >
                            <Text style={[styles.dropdownText, selectedTypeId === b.leave_type.id && styles.dropdownTextActive]}>
                              {b.leave_type.name}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    )}

                    <View style={{ flexDirection: "row", gap: spacing.md, marginTop: spacing.xs }}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.fieldLabel}>Tanggal Mulai</Text>
                        {Platform.OS === "ios" ? (
                          <View style={[styles.textInput, { justifyContent: "center", alignItems: "flex-start" }]}>
                            <DateTimePicker
                              value={cutiDateFrom ? new Date(cutiDateFrom) : new Date()}
                              mode="date"
                              display="default"
                              locale="id-ID"
                              themeVariant="light"
                              onChange={(_e, d) => {
                                if (d) setCutiDateFrom(formatDateString(d));
                              }}
                              style={{ marginLeft: -8 }}
                            />
                          </View>
                        ) : (
                          <TouchableOpacity
                            style={[styles.textInput, { justifyContent: "center" }]}
                            onPress={() => {
                              setActiveDateField("cutiDateFrom");
                              setShowDatePicker(true);
                            }}
                            activeOpacity={0.7}
                          >
                            <Text style={[styles.textInputValue, !cutiDateFrom && { color: colors.textMuted }]}>
                              {toDisplayDate(cutiDateFrom)}
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.fieldLabel}>Tanggal Selesai</Text>
                        {Platform.OS === "ios" ? (
                          <View style={[styles.textInput, { justifyContent: "center", alignItems: "flex-start" }]}>
                            <DateTimePicker
                              value={cutiDateTo ? new Date(cutiDateTo) : new Date()}
                              mode="date"
                              display="default"
                              locale="id-ID"
                              themeVariant="light"
                              onChange={(_e, d) => {
                                if (d) setCutiDateTo(formatDateString(d));
                              }}
                              style={{ marginLeft: -8 }}
                            />
                          </View>
                        ) : (
                          <TouchableOpacity
                            style={[styles.textInput, { justifyContent: "center" }]}
                            onPress={() => {
                              setActiveDateField("cutiDateTo");
                              setShowDatePicker(true);
                            }}
                            activeOpacity={0.7}
                          >
                            <Text style={[styles.textInputValue, !cutiDateTo && { color: colors.textMuted }]}>
                              {toDisplayDate(cutiDateTo)}
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>

                    <Text style={styles.fieldLabel}>Alasan / Keterangan</Text>
                    <TextInput
                      style={[styles.textInput, styles.textArea]}
                      multiline
                      placeholder="Tulis alasan pengajuan cuti secara rinci..."
                      placeholderTextColor={colors.textMuted}
                      value={cutiReason}
                      onChangeText={setCutiReason}
                    />
                  </View>
                )}

                {/* LEMBUR FORM */}
                {modalType === "lembur" && (
                  <View style={styles.formContainer}>
                    <Text style={styles.fieldLabel}>Tanggal Lembur</Text>
                    {Platform.OS === "ios" ? (
                      <View style={[styles.textInput, { justifyContent: "center", alignItems: "flex-start" }]}>
                        <DateTimePicker
                          value={lemburDate ? new Date(lemburDate) : new Date()}
                          mode="date"
                          display="default"
                          locale="id-ID"
                          themeVariant="light"
                          onChange={(_e, d) => {
                            if (d) setLemburDate(formatDateString(d));
                          }}
                          style={{ marginLeft: -8 }}
                        />
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={[styles.textInput, { justifyContent: "center" }]}
                        onPress={() => {
                          setActiveDateField("lemburDate");
                          setShowDatePicker(true);
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.textInputValue, !lemburDate && { color: colors.textMuted }]}>
                          {toDisplayDate(lemburDate)}
                        </Text>
                      </TouchableOpacity>
                    )}

                    <Text style={styles.fieldLabel}>Estimasi Durasi (Jam)</Text>
                    <TextInput
                      style={styles.textInput}
                      keyboardType="numeric"
                      placeholder="Contoh: 4"
                      placeholderTextColor={colors.textMuted}
                      value={lemburHours}
                      onChangeText={setLemburHours}
                    />

                    <Text style={styles.fieldLabel}>Deskripsi Pekerjaan Lembur</Text>
                    <TextInput
                      style={[styles.textInput, styles.textArea]}
                      multiline
                      placeholder="Detail task/pekerjaan yang diselesaikan..."
                      placeholderTextColor={colors.textMuted}
                      value={lemburReason}
                      onChangeText={setLemburReason}
                    />
                  </View>
                )}



                <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} activeOpacity={0.85}>
                  <Text style={styles.submitText}>Kirim Pengajuan</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Android date picker */}
      {showDatePicker && Platform.OS !== "ios" && activeDateField && (
        <DateTimePicker
          value={
            activeDateField === "cutiDateFrom" && cutiDateFrom
              ? new Date(cutiDateFrom)
              : activeDateField === "cutiDateTo" && cutiDateTo
                ? new Date(cutiDateTo)
                : activeDateField === "lemburDate" && lemburDate
                  ? new Date(lemburDate)
                  : new Date()
          }
          mode="date"
          display="default"
          onChange={onDateChange}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
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

  // Floating Actions Card
  floatingCard: {
    marginTop: -hpx(36),
    backgroundColor: colors.card,
    borderRadius: wpx(20),
    padding: spacing["2xl"],
    ...shadows.elevated,
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: rf(15),
    fontWeight: "700" as any,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: spacing.sm,
  },
  actionBtn: {
    width: "48%",
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.2,
    borderRadius: radius.md,
    paddingVertical: hpx(10),
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.card,
  },
  actionIconBg: {
    width: wpx(32),
    height: wpx(32),
    borderRadius: radius.full,
    justifyContent: "center",
    alignItems: "center",
  },
  actionLabel: {
    fontSize: rf(12),
    fontWeight: "700" as any,
    color: colors.textPrimary,
    marginLeft: spacing.sm,
    flex: 1,
  },

  // History section
  historySection: {
    marginTop: spacing.sm,
  },
  historyTitle: {
    fontSize: rf(16),
    fontWeight: "800" as any,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  filterRow: {
    flexDirection: "row",
    backgroundColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.xs - 1,
    marginBottom: spacing.md,
  },
  filterTab: {
    flex: 1,
    paddingVertical: hpx(8),
    borderRadius: radius.sm,
    alignItems: "center",
  },
  filterTabActive: { backgroundColor: colors.card, ...shadows.card },
  filterText: {
    fontSize: rf(12),
    fontWeight: "600" as any,
    color: colors.textMuted,
  },
  filterTextActive: { color: colors.primary, fontWeight: "700" as any },

  emptyContainer: {
    alignItems: "center",
    paddingVertical: hpx(40),
  },
  emptyText: {
    ...textPresets.body,
    marginTop: spacing.md,
    color: colors.textMuted,
  },

  historyCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  typeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  typeText: {
    fontSize: rf(11),
    fontWeight: "700" as any,
    color: colors.textSecondary,
    textTransform: "uppercase",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    paddingVertical: hpx(2),
    borderRadius: radius.xs,
  },
  statusText: {
    fontSize: rf(10),
    fontWeight: "700" as any,
  },
  itemTitle: {
    ...textPresets.cardTitle,
    fontSize: rf(15),
    marginBottom: spacing.xs,
  },
  itemDetails: {
    ...textPresets.body,
    fontSize: rf(13),
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
  itemVal: {
    fontSize: rf(13),
    fontWeight: "700" as any,
    color: colors.primary,
  },
  itemDate: {
    fontSize: rf(11),
    color: colors.textMuted,
  },

  // Modal
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
  amountInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    height: sizes.buttonMd,
  },
  currencyPrefix: {
    fontSize: rf(14),
    fontWeight: "700" as any,
    color: colors.textPrimary,
    marginRight: spacing.xs,
  },
  amountInput: {
    flex: 1,
    height: "100%",
    color: colors.textPrimary,
    fontSize: rf(14),
    padding: 0,
  },
  textInputValue: {
    color: colors.textPrimary,
    fontSize: rf(14),
  },
  textArea: {
    height: hpx(80),
    paddingTop: spacing.md,
    textAlignVertical: "top",
  },
  dropdownRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  dropdownBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingVertical: hpx(10),
    alignItems: "center",
    backgroundColor: colors.card,
  },
  dropdownBtnActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  dropdownText: {
    fontSize: rf(12),
    fontWeight: "600" as any,
    color: colors.textSecondary,
  },
  dropdownTextActive: {
    color: colors.primary,
    fontWeight: "700" as any,
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


  balanceContainer: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  balanceHeader: {
    fontSize: rf(12),
    fontWeight: "700" as any,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  noBalanceText: {
    fontSize: rf(12),
    color: colors.textMuted,
    fontStyle: "italic",
  },
  balanceGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  balanceItem: {
    flex: 1,
    minWidth: wpx(100),
    backgroundColor: colors.card,
    borderRadius: radius.sm,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  balanceName: {
    fontSize: rf(11),
    fontWeight: "600" as any,
    color: colors.textPrimary,
    marginBottom: hpx(2),
  },
  balanceCount: {
    fontSize: rf(11),
    color: colors.textSecondary,
  },
  balanceCountNum: {
    fontSize: rf(14),
    fontWeight: "800" as any,
    color: colors.primary,
  },
  typeSelectorScroll: {
    paddingVertical: hpx(4),
  },
  previewContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.md,
  },
  previewImage: {
    width: wpx(60),
    height: hpx(60),
    borderRadius: radius.sm,
    backgroundColor: colors.border,
  },
  removePhotoBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: radius.sm,
  },
  removePhotoText: {
    fontSize: rf(12),
    fontWeight: "600" as any,
    color: colors.error,
  },
  photoActionsRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  photoActionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    gap: spacing.sm,
    height: sizes.buttonMd,
  },
  photoActionText: {
    fontSize: rf(13),
    fontWeight: "600" as any,
    color: colors.textPrimary,
  },
  attachmentPreviewContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  attachmentPreviewText: {
    fontSize: rf(12),
    color: colors.textSecondary,
    fontWeight: "600" as any,
    marginRight: spacing.sm,
  },
  historyAttachmentThumb: {
    width: wpx(32),
    height: hpx(32),
    borderRadius: radius.xs,
    backgroundColor: colors.border,
  },
});
