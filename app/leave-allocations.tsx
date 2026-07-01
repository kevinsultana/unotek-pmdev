import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { timeOffService } from "../services/timeOffService";
import type { TimeOff, TimeOffBalanceItem } from "../types/timeOff";
import { showToast } from "../utils/toast";

const PER_PAGE = 20;

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function toDisplay(date: Date): string {
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const stateStyleMap: Record<string, { color: string; bg: string }> = {
  draft: { color: "#FFB020", bg: "#FFF4E5" },
  confirm: { color: "#2E5BFF", bg: "#E0E7FF" },
  validate1: { color: "#8B5CF6", bg: "#EDE9FE" },
  validate: { color: "#10B981", bg: "#E6F4EA" },
  refuse: { color: "#EF4444", bg: "#FEE2E2" },
  cancel: { color: "#9CA3AF", bg: "#F3F4F6" },
  approved: { color: "#10B981", bg: "#E6F4EA" },
};

export default function LeaveAllocationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // ── List state ──
  const [records, setRecords] = useState<TimeOff[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Date filter ──
  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const [dateFrom, setDateFrom] = useState<Date>(firstOfMonth);
  const [dateTo, setDateTo] = useState<Date>(lastOfMonth);
  const [showPicker, setShowPicker] = useState<"from" | "to" | null>(null);

  // ── Balances ──
  const [balances, setBalances] = useState<TimeOffBalanceItem[]>([]);

  // ── Create modal state ──
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [selectedTypeId, setSelectedTypeId] = useState<number | null>(null);
  const [createDateFrom, setCreateDateFrom] = useState("");
  const [createDateTo, setCreateDateTo] = useState("");
  const [createReason, setCreateReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCreatePicker, setShowCreatePicker] = useState<
    "from" | "to" | null
  >(null);
  const [createDateFromDate, setCreateDateFromDate] = useState(new Date());
  const [createDateToDate, setCreateDateToDate] = useState(new Date());

  // ── Fetch list ──
  const fetchRecords = useCallback(
    async (pageNum: number, append: boolean = false) => {
      if (append) setIsLoadingMore(true);
      else setIsLoading(true);
      setError(null);

      try {
        const params: {
          page: number;
          per_page: number;
          date_from?: string;
          date_to?: string;
        } = { page: pageNum, per_page: PER_PAGE };
        params.date_from = formatDate(dateFrom);
        params.date_to = formatDate(dateTo);

        const res = await timeOffService.list(params);
        const items = res.data.data || [];
        const pagination = res.data.pagination;

        if (append) setRecords((prev) => [...prev, ...items]);
        else setRecords(items);
        setTotalPages(pagination?.total_pages || 1);
        setPage(pageNum);
      } catch (err: any) {
        setError(err?.response?.data?.message || "Gagal memuat data cuti");
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [dateFrom, dateTo],
  );

  useEffect(() => {
    fetchRecords(1);
  }, [dateFrom, dateTo]);

  // ── Fetch balances ──
  useEffect(() => {
    (async () => {
      try {
        const res = await timeOffService.getBalance();
        setBalances(res.data.data?.balances || []);
      } catch {
        // non-critical
      }
    })();
  }, []);

  // ── Create time off ──
  const handleCreate = async () => {
    if (!selectedTypeId || !createDateFrom || !createDateTo || !createReason) {
      showToast("info", "Form Belum Lengkap", "Harap isi semua field.");
      return;
    }

    setIsSubmitting(true);
    try {
      await timeOffService.create({
        holiday_status_id: selectedTypeId,
        date_from: `${createDateFrom} 08:00:00`,
        date_to: `${createDateTo} 17:00:00`,
        name: createReason,
      });
      setIsCreateModalVisible(false);
      setSelectedTypeId(null);
      setCreateDateFrom("");
      setCreateDateTo("");
      setCreateReason("");
      showToast("success", "Berhasil", "Pengajuan cuti telah dikirim.");
      fetchRecords(1);
    } catch (err: any) {
      showToast(
        "error",
        "Gagal",
        err?.response?.data?.message || "Terjadi kesalahan.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePickerChange = (
    _event: DateTimePickerEvent,
    selectedDate?: Date,
  ) => {
    // Dismiss picker after selection on both platforms
    setShowPicker(null);
    if (selectedDate && showPicker === "from") setDateFrom(selectedDate);
    else if (selectedDate && showPicker === "to") setDateTo(selectedDate);
  };

  const handleLoadMore = () => {
    if (page < totalPages && !isLoadingMore) fetchRecords(page + 1, true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <Stack.Screen options={{ headerShown: false }} />

      {/* Custom Header */}
      <View style={styles.customHeader}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.headerBackBtn}
        >
          <Ionicons name="arrow-back" size={22} color="#2E5BFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cuti / Izin</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Date Filter */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={styles.datePickerBtn}
          onPress={() => setShowPicker("from")}
        >
          <Text style={styles.datePickerLabel}>Dari</Text>
          <Text style={styles.datePickerValue}>{toDisplay(dateFrom)}</Text>
        </TouchableOpacity>
        <Ionicons
          name="arrow-forward"
          size={16}
          color="#D1D5DB"
          style={{ marginHorizontal: 8 }}
        />
        <TouchableOpacity
          style={styles.datePickerBtn}
          onPress={() => setShowPicker("to")}
        >
          <Text style={styles.datePickerLabel}>Sampai</Text>
          <Text style={styles.datePickerValue}>{toDisplay(dateTo)}</Text>
        </TouchableOpacity>
      </View>

      {showPicker && (
        <DateTimePicker
          value={showPicker === "from" ? dateFrom : dateTo}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={handlePickerChange}
        />
      )}

      {/* List */}
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        onMomentumScrollEnd={({ nativeEvent }) => {
          const { contentOffset, contentSize, layoutMeasurement } = nativeEvent;
          if (
            contentOffset.y + layoutMeasurement.height >=
            contentSize.height - 40
          )
            handleLoadMore();
        }}
      >
        {isLoading ? (
          <ActivityIndicator
            size="large"
            color="#2E5BFF"
            style={{ marginVertical: 40 }}
          />
        ) : error ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
            <Text style={styles.emptyText}>{error}</Text>
          </View>
        ) : records.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="umbrella-outline" size={48} color="#9CA3AF" />
            <Text style={styles.emptyText}>Belum ada pengajuan cuti.</Text>
          </View>
        ) : (
          <>
            {records.map((rec) => {
              const st = stateStyleMap[rec.state] || stateStyleMap.draft;
              const tz = "Asia/Jakarta";
              const fmtDate = (iso: string) => {
                try {
                  return new Date(iso).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    timeZone: tz,
                  });
                } catch {
                  return iso;
                }
              };
              const fmtTime = (iso: string) => {
                try {
                  return new Date(iso).toLocaleTimeString("id-ID", {
                    hour: "2-digit",
                    minute: "2-digit",
                    timeZone: tz,
                  });
                } catch {
                  return "";
                }
              };
              return (
                <TouchableOpacity
                  key={rec.id}
                  style={styles.recordCard}
                  activeOpacity={0.7}
                  onPress={() => router.push(`/time-off-detail?id=${rec.id}`)}
                >
                  <View style={styles.recordHeader}>
                    <Text style={styles.recordType}>
                      {rec.holiday_status?.name || rec.name || "Cuti"}
                    </Text>
                    <View
                      style={[styles.stateBadge, { backgroundColor: st.bg }]}
                    >
                      <Text
                        style={[styles.stateBadgeText, { color: st.color }]}
                      >
                        {rec.state_label}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.recordDateRow}>
                    <Ionicons
                      name="calendar-outline"
                      size={14}
                      color="#6B7280"
                    />
                    <Text style={styles.recordDateText}>
                      {fmtDate(rec.date_from)} {fmtTime(rec.date_from)} →{" "}
                      {fmtDate(rec.date_to)} {fmtTime(rec.date_to)}
                    </Text>
                  </View>
                  <Text style={styles.recordDays}>
                    {rec.number_of_days} hari
                  </Text>
                </TouchableOpacity>
              );
            })}
            {isLoadingMore && (
              <ActivityIndicator
                size="small"
                color="#2E5BFF"
                style={{ marginVertical: 16 }}
              />
            )}
            {page >= totalPages && records.length > 0 && (
              <Text style={styles.endText}>Semua data telah dimuat</Text>
            )}
          </>
        )}
        {/* Extra space for FAB */}
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setIsCreateModalVisible(true)}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>

      {/* ── Create Modal ── */}
      <Modal visible={isCreateModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { paddingBottom: Math.max(insets.bottom, 24) },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Ajukan Cuti / Izin</Text>
              <TouchableOpacity onPress={() => setIsCreateModalVisible(false)}>
                <Ionicons name="close" size={24} color="#1F2937" />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              style={{ maxHeight: 400 }}
            >
              <Text style={styles.fieldLabel}>Tipe Cuti</Text>
              {balances.map((b) => {
                const isSel = selectedTypeId === b.leave_type.id;
                const pct = b.allocated > 0 ? (b.taken / b.allocated) * 100 : 0;
                return (
                  <TouchableOpacity
                    key={b.leave_type.id}
                    style={[
                      styles.selectionBox,
                      isSel && styles.selectionBoxActive,
                    ]}
                    onPress={() => setSelectedTypeId(b.leave_type.id)}
                  >
                    <View style={styles.selectionBoxLeft}>
                      <View
                        style={[styles.radio, isSel && styles.radioActive]}
                      />
                      <View style={styles.selectionBoxInfo}>
                        <Text
                          style={[
                            styles.selectionBoxTitle,
                            isSel && styles.selectionBoxTitleActive,
                          ]}
                        >
                          {b.leave_type.name}
                        </Text>
                        <Text style={styles.selectionBoxSub}>
                          Sisa: {b.remaining} dari {b.allocated} hari
                        </Text>
                      </View>
                    </View>
                    <View style={styles.selectionBoxRight}>
                      <Text
                        style={[
                          styles.selectionBoxRemaining,
                          isSel && styles.selectionBoxRemainingActive,
                        ]}
                      >
                        {b.remaining}
                      </Text>
                      <View style={styles.selectionBoxProgressTrack}>
                        <View
                          style={[
                            styles.selectionBoxProgressBar,
                            { width: `${Math.min(pct, 100)}%` },
                          ]}
                        />
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}

              <Text style={styles.fieldLabel}>Tanggal Mulai</Text>
              <TouchableOpacity
                style={styles.formInput}
                onPress={() => setShowCreatePicker("from")}
              >
                <Text
                  style={
                    createDateFrom
                      ? styles.formInputValue
                      : styles.formInputPlaceholder
                  }
                >
                  {createDateFrom || "Pilih tanggal"}
                </Text>
              </TouchableOpacity>

              <Text style={styles.fieldLabel}>Tanggal Selesai</Text>
              <TouchableOpacity
                style={styles.formInput}
                onPress={() => setShowCreatePicker("to")}
              >
                <Text
                  style={
                    createDateTo
                      ? styles.formInputValue
                      : styles.formInputPlaceholder
                  }
                >
                  {createDateTo || "Pilih tanggal"}
                </Text>
              </TouchableOpacity>

              {showCreatePicker && (
                <DateTimePicker
                  value={
                    showCreatePicker === "from"
                      ? createDateFromDate
                      : createDateToDate
                  }
                  mode="date"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={(_e, d) => {
                    setShowCreatePicker(null);
                    if (!d) return;
                    const y = d.getFullYear();
                    const m = String(d.getMonth() + 1).padStart(2, "0");
                    const day = String(d.getDate()).padStart(2, "0");
                    const formatted = `${y}-${m}-${day}`;
                    if (showCreatePicker === "from") {
                      setCreateDateFrom(formatted);
                      setCreateDateFromDate(d);
                    } else {
                      setCreateDateTo(formatted);
                      setCreateDateToDate(d);
                    }
                  }}
                />
              )}

              <Text style={styles.fieldLabel}>Alasan</Text>
              <TextInput
                style={[
                  styles.formInput,
                  { height: 80, textAlignVertical: "top" },
                ]}
                placeholder="Tuliskan alasan..."
                placeholderTextColor="#A9B5C9"
                multiline
                value={createReason}
                onChangeText={setCreateReason}
              />
            </ScrollView>

            <TouchableOpacity
              style={[styles.confirmBtn, isSubmitting && styles.disabledBtn]}
              onPress={handleCreate}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.confirmBtnText}>Kirim Pengajuan</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    textAlign: "center",
    marginRight: 40,
  },
  headerSpacer: { width: 40 },
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  datePickerBtn: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  datePickerLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: "#9CA3AF",
    marginBottom: 2,
  },
  datePickerValue: { fontSize: 13, fontWeight: "700", color: "#1F2937" },
  // Balance strip
  balanceStrip: {
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    height: 0,
  },
  balanceStripContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    backgroundColor: "#fffefe",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  balanceMiniCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
    width: 160,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  balanceMiniName: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 6,
  },
  balanceMiniRemain: { fontSize: 26, fontWeight: "800", color: "#1F2937" },
  balanceMiniTotal: { fontSize: 14, fontWeight: "600", color: "#D1D5DB" },
  balanceMiniProgressTrack: {
    height: 6,
    backgroundColor: "#F3F4F6",
    borderRadius: 3,
    marginTop: 8,
    marginBottom: 6,
    overflow: "hidden",
  },
  balanceMiniProgressBar: {
    height: "100%",
    backgroundColor: "#2E5BFF",
    borderRadius: 3,
  },
  balanceMiniTaken: { fontSize: 10, color: "#9CA3AF", fontWeight: "500" },
  // List
  scrollContainer: { padding: 16, paddingBottom: 40 },
  recordCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 1,
  },
  recordHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  recordType: { fontSize: 15, fontWeight: "700", color: "#1F2937", flex: 1 },
  stateBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  stateBadgeText: { fontSize: 11, fontWeight: "700" },
  recordDateRow: { flexDirection: "row", alignItems: "center" },
  recordDateText: {
    fontSize: 12,
    color: "#6B7280",
    marginLeft: 6,
    fontWeight: "500",
    flex: 1,
  },
  recordDays: {
    fontSize: 11,
    color: "#2E5BFF",
    fontWeight: "700",
    marginTop: 6,
    textAlign: "right",
  },
  emptyContainer: { alignItems: "center", paddingVertical: 60 },
  emptyText: { fontSize: 14, color: "#9CA3AF", marginTop: 12 },
  endText: {
    textAlign: "center",
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 8,
  },
  // FAB
  fab: {
    position: "absolute",
    right: 24,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#2E5BFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#2E5BFF",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: "800", color: "#1F2937" },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#4B5563",
    marginBottom: 8,
    marginTop: 12,
  },
  typeRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 },
  // Selection boxes for leave type
  selectionBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F9FAFB",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    padding: 14,
    marginBottom: 10,
  },
  selectionBoxActive: {
    backgroundColor: "#EEF2FF",
    borderColor: "#2E5BFF",
  },
  selectionBoxLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    marginRight: 12,
  },
  radioActive: {
    borderColor: "#2E5BFF",
    backgroundColor: "#2E5BFF",
  },
  selectionBoxInfo: { flex: 1 },
  selectionBoxTitle: { fontSize: 14, fontWeight: "700", color: "#1F2937" },
  selectionBoxTitleActive: { color: "#2E5BFF" },
  selectionBoxSub: { fontSize: 11, color: "#9CA3AF", marginTop: 2 },
  selectionBoxRight: {
    alignItems: "flex-end",
    marginLeft: 12,
  },
  selectionBoxRemaining: { fontSize: 20, fontWeight: "800", color: "#4B5563" },
  selectionBoxRemainingActive: { color: "#2E5BFF" },
  selectionBoxProgressTrack: {
    width: 50,
    height: 4,
    backgroundColor: "#E5E7EB",
    borderRadius: 2,
    marginTop: 4,
    overflow: "hidden",
  },
  selectionBoxProgressBar: {
    height: "100%",
    backgroundColor: "#2E5BFF",
    borderRadius: 2,
  },
  formInput: {
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    backgroundColor: "#F9FAFB",
    paddingHorizontal: 16,
    height: 48,
    justifyContent: "center",
    marginBottom: 12,
  },
  formInputValue: { color: "#1F2937", fontSize: 14, fontWeight: "500" },
  formInputPlaceholder: { color: "#A9B5C9", fontSize: 14, fontWeight: "500" },
  confirmBtn: {
    height: 52,
    backgroundColor: "#2E5BFF",
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
  },
  confirmBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
  disabledBtn: { backgroundColor: "#93ACFF" },
});
