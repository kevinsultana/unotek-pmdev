import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, hpx, radius, rf, shadows, sizes, spacing, textPresets, wpx } from "../src/constants/theme";
import { timeOffService } from "../services/timeOffService";
import type { TimeOff, TimeOffBalanceItem } from "../types/timeOff";
import { showToast } from "../utils/toast";

const PER_PAGE = 20;

function formatDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function toDisplay(d: Date) {
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

const STATE_COLORS: Record<string, { c: string; b: string }> = {
  draft: { c: "#F59E0B", b: "#FEF3C7" },
  confirm: { c: colors.primary, b: colors.primaryLight },
  validate1: { c: "#7C3AED", b: "#EDE9FE" },
  validate: { c: "#059669", b: "#D1FAE5" },
  refuse: { c: colors.error, b: "#FEE2E2" },
  cancel: { c: colors.textMuted, b: "#F1F5F9" },
  approved: { c: "#059669", b: "#D1FAE5" },
};

export default function LeaveAllocationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [records, setRecords] = useState<TimeOff[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const now = new Date();
  const [dateFrom, setDateFrom] = useState(new Date(now.getFullYear(), now.getMonth(), 1));
  const [dateTo, setDateTo] = useState(new Date(now.getFullYear(), now.getMonth() + 1, 0));
  const [showPicker, setShowPicker] = useState<"from" | "to" | null>(null);
  const [tempPickerDate, setTempPickerDate] = useState(new Date());

  // Create modal
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [balances, setBalances] = useState<TimeOffBalanceItem[]>([]);
  const [selectedTypeId, setSelectedTypeId] = useState<number | null>(null);
  const [createDateFrom, setCreateDateFrom] = useState("");
  const [createDateTo, setCreateDateTo] = useState("");
  const [createReason, setCreateReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCreatePicker, setShowCreatePicker] = useState<"from" | "to" | null>(null);
  const [createDateFromDate, setCreateDateFromDate] = useState(new Date());
  const [createDateToDate, setCreateDateToDate] = useState(new Date());

  const fetchRecords = useCallback(async (pageNum: number, append = false) => {
    if (append) setIsLoadingMore(true); else setIsLoading(true);
    setError(null);
    try {
      const params: any = { page: pageNum, per_page: PER_PAGE, date_from: formatDate(dateFrom), date_to: formatDate(dateTo) };
      const res = await timeOffService.list(params);
      const items = res.data.data || [];
      const pagination = res.data.pagination;
      if (append) setRecords((p) => [...p, ...items]); else setRecords(items);
      setTotalPages(pagination?.total_pages || 1);
      setPage(pageNum);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Gagal memuat data cuti");
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [dateFrom, dateTo]);

  useEffect(() => { fetchRecords(1); }, [dateFrom, dateTo]);

  useEffect(() => {
    (async () => {
      try {
        const res = await timeOffService.getBalance();
        setBalances(res.data.data?.balances || []);
      } catch { /* non-critical */ }
    })();
  }, []);

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
      setCreateDateFrom(""); setCreateDateTo(""); setCreateReason("");
      showToast("success", "Berhasil", "Pengajuan cuti telah dikirim.");
      fetchRecords(1);
    } catch (err: any) {
      showToast("error", "Gagal", err?.response?.data?.message || "Terjadi kesalahan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePickerChange = (_e: DateTimePickerEvent, d?: Date) => {
    setShowPicker(null);
    if (d && showPicker === "from") setDateFrom(d);
    else if (d && showPicker === "to") setDateTo(d);
  };

  const handleLoadMore = () => {
    if (page < totalPages && !isLoadingMore) fetchRecords(page + 1, true);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <Stack.Screen options={{ headerShown: false }} />

      <View style={[styles.curvedHeader, { paddingTop: insets.top }]}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Cuti / Izin</Text>
        </View>
      </View>

      <View style={styles.filterRow}>
        <TouchableOpacity style={styles.dateBtn} onPress={() => setShowPicker("from")}>
          <Text style={styles.dateLabel}>Dari</Text>
          <Text style={styles.dateValue}>{toDisplay(dateFrom)}</Text>
        </TouchableOpacity>
        <Ionicons name="arrow-forward" size={14} color={colors.border} style={{ marginHorizontal: spacing.sm }} />
        <TouchableOpacity style={styles.dateBtn} onPress={() => setShowPicker("to")}>
          <Text style={styles.dateLabel}>Sampai</Text>
          <Text style={styles.dateValue}>{toDisplay(dateTo)}</Text>
        </TouchableOpacity>
      </View>

      {showPicker && Platform.OS === "ios" ? (
        <View style={StyleSheet.absoluteFill}>
          <TouchableOpacity style={styles.pickerBg} onPress={() => setShowPicker(null)} />
          <View style={styles.pickerContainer}>
            <View style={styles.pickerHeader}>
              <TouchableOpacity onPress={() => { if (showPicker === "from") setDateFrom(tempPickerDate); else setDateTo(tempPickerDate); setShowPicker(null); }}>
                <Text style={styles.pickerDone}>Selesai</Text>
              </TouchableOpacity>
            </View>
            <DateTimePicker value={showPicker === "from" ? dateFrom : dateTo} mode="date" display="inline" themeVariant="light" onChange={(_e, d) => { if (d) setTempPickerDate(d); }} />
          </View>
        </View>
      ) : null}

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        onMomentumScrollEnd={({ nativeEvent }) => {
          const { contentOffset, contentSize, layoutMeasurement } = nativeEvent;
          if (contentOffset.y + layoutMeasurement.height >= contentSize.height - 40) handleLoadMore();
        }}
      >
        <View style={styles.floatingCard}>
          {isLoading ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: spacing["4xl"] }} />
          ) : error ? (
            <View style={styles.center}>
              <Ionicons name="alert-circle-outline" size={40} color={colors.error} />
              <Text style={styles.emptyText}>{error}</Text>
            </View>
          ) : records.length === 0 ? (
            <View style={styles.center}>
              <Ionicons name="umbrella-outline" size={40} color={colors.textMuted} />
              <Text style={styles.emptyText}>Belum ada pengajuan cuti.</Text>
            </View>
          ) : (
            records.map((rec) => {
              const st = STATE_COLORS[rec.state] ?? STATE_COLORS.draft;
              const fmt = (iso: string) => {
                try { return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Jakarta" }); }
                catch { return iso; }
              };
              return (
                <TouchableOpacity key={rec.id} style={styles.recordCard} activeOpacity={0.7} onPress={() => router.push(`/time-off-detail?id=${rec.id}`)}>
                  <View style={styles.recordTop}>
                    <Text style={styles.recordType}>{rec.holiday_status?.name || rec.name || "Cuti"}</Text>
                    <View style={[styles.stateBadge, { backgroundColor: st.b }]}>
                      <Text style={[styles.stateBadgeText, { color: st.c }]}>{rec.state_label || rec.state}</Text>
                    </View>
                  </View>
                  <View style={styles.recordDateRow}>
                    <Ionicons name="calendar-outline" size={13} color={colors.textMuted} />
                    <Text style={styles.recordDates}>{fmt(rec.date_from)} → {fmt(rec.date_to)}</Text>
                  </View>
                  <Text style={styles.recordDays}>{rec.number_of_days} hari</Text>
                </TouchableOpacity>
              );
            })
          )}
          {isLoadingMore && <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: spacing.lg }} />}
          {page >= totalPages && records.length > 0 && <Text style={styles.endText}>Semua data telah dimuat</Text>}
        </View>
        <View style={{ height: hpx(24) }} />
      </ScrollView>

      {showPicker && Platform.OS !== "ios" ? (
        <DateTimePicker value={showPicker === "from" ? dateFrom : dateTo} mode="date" display="default" onChange={handlePickerChange} />
      ) : null}

      <TouchableOpacity style={styles.fab} onPress={() => setIsCreateModalVisible(true)} activeOpacity={0.85}>
        <Ionicons name="add" size={26} color="#FFFFFF" />
      </TouchableOpacity>

      {/* ── Create Modal ── */}
      <Modal visible={isCreateModalVisible} animationType="slide" transparent>
        <View style={modalStyles.overlay}>
          <View style={[modalStyles.content, { paddingBottom: Math.max(insets.bottom, spacing["2xl"]) }]}>
            <View style={modalStyles.header}>
              <Text style={modalStyles.title}>Ajukan Cuti / Izin</Text>
              <TouchableOpacity onPress={() => setIsCreateModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: hpx(420) }}>
              <Text style={modalStyles.fieldLabel}>Tipe Cuti</Text>
              {balances.map((b) => {
                const isSel = selectedTypeId === b.leave_type.id;
                const pct = b.allocated > 0 ? (b.taken / b.allocated) * 100 : 0;
                return (
                  <TouchableOpacity key={b.leave_type.id} style={[modalStyles.pickerRow, isSel && modalStyles.pickerRowActive]} onPress={() => setSelectedTypeId(b.leave_type.id)}>
                    <View style={modalStyles.pickerRowLeft}>
                      <View style={[modalStyles.radio, isSel && modalStyles.radioActive]} />
                      <View>
                        <Text style={[modalStyles.pickerRowTitle, isSel && modalStyles.pickerRowTitleActive]}>{b.leave_type.name}</Text>
                        <Text style={modalStyles.pickerRowSub}>Sisa: {b.remaining} dari {b.allocated} hari</Text>
                      </View>
                    </View>
                    <View style={modalStyles.pickerRowRight}>
                      <Text style={[modalStyles.pickerRowRemain, isSel && modalStyles.pickerRowRemainActive]}>{b.remaining}</Text>
                      <View style={modalStyles.progressTrack}>
                        <View style={[modalStyles.progressBar, { width: `${Math.min(pct, 100)}%` }]} />
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
              <Text style={modalStyles.fieldLabel}>Tanggal Mulai</Text>
              <TouchableOpacity style={modalStyles.formField} onPress={() => { setIsCreateModalVisible(false); setTimeout(() => setShowCreatePicker("from"), 300); }}>
                <Text style={createDateFrom ? modalStyles.formValue : modalStyles.formPlaceholder}>{createDateFrom || "Pilih tanggal"}</Text>
              </TouchableOpacity>
              <Text style={modalStyles.fieldLabel}>Tanggal Selesai</Text>
              <TouchableOpacity style={modalStyles.formField} onPress={() => { setIsCreateModalVisible(false); setTimeout(() => setShowCreatePicker("to"), 300); }}>
                <Text style={createDateTo ? modalStyles.formValue : modalStyles.formPlaceholder}>{createDateTo || "Pilih tanggal"}</Text>
              </TouchableOpacity>
              <Text style={modalStyles.fieldLabel}>Alasan</Text>
              <TextInput style={[modalStyles.formField, { height: hpx(80), textAlignVertical: "top", paddingTop: spacing.md }]} placeholder="Tuliskan alasan..." placeholderTextColor={colors.textMuted} multiline value={createReason} onChangeText={setCreateReason} />
            </ScrollView>
            <TouchableOpacity style={[modalStyles.submitBtn, isSubmitting && { opacity: 0.6 }]} onPress={handleCreate} disabled={isSubmitting} activeOpacity={0.85}>
              {isSubmitting ? <ActivityIndicator color="#FFFFFF" size="small" /> : <Text style={modalStyles.submitBtnText}>Kirim Pengajuan</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* iOS create date pickers */}
      {showCreatePicker && Platform.OS === "ios" ? (
        <View style={StyleSheet.absoluteFill}>
          <TouchableOpacity style={styles.pickerBg} onPress={() => { setShowCreatePicker(null); setIsCreateModalVisible(true); }} />
          <View style={styles.pickerContainer}>
            <View style={styles.pickerHeader}>
              <TouchableOpacity onPress={() => {
                const d = showCreatePicker === "from" ? createDateFromDate : createDateToDate;
                const v = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
                if (showCreatePicker === "from") setCreateDateFrom(v); else setCreateDateTo(v);
                setShowCreatePicker(null);
                setIsCreateModalVisible(true);
              }}>
                <Text style={styles.pickerDone}>Selesai</Text>
              </TouchableOpacity>
            </View>
            <DateTimePicker
              value={showCreatePicker === "from" ? createDateFromDate : createDateToDate}
              mode="date" display="inline" themeVariant="light"
              onChange={(_e, d) => { if (d) { if (showCreatePicker === "from") setCreateDateFromDate(d); else setCreateDateToDate(d); }}}
            />
          </View>
        </View>
      ) : showCreatePicker ? (
        <DateTimePicker
          value={showCreatePicker === "from" ? createDateFromDate : createDateToDate}
          mode="date" display="default"
          onChange={(_e, d) => {
            setShowCreatePicker(null);
            if (!d) return;
            const v = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
            if (showCreatePicker === "from") { setCreateDateFrom(v); setCreateDateFromDate(d); }
            else { setCreateDateTo(v); setCreateDateToDate(d); }
            setIsCreateModalVisible(true);
          }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  center: { alignItems: "center", paddingVertical: spacing["4xl"] },
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
  headerContent: { alignItems: "center" },
  headerTitle: {
    fontSize: rf(17),
    fontWeight: "700" as any,
    color: "#FFFFFF",
    textAlign: "center",
  },

  filterRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    paddingHorizontal: spacing["2xl"], paddingVertical: spacing.md,
    marginTop: -hpx(24), zIndex: 2,
  },
  dateBtn: { flex: 1, backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border, paddingVertical: spacing.md, paddingHorizontal: spacing.md, ...shadows.card },
  dateLabel: { ...textPresets.label, marginBottom: 2 },
  dateValue: { ...textPresets.cardTitle, fontSize: rf(13) },

  scroll: { paddingHorizontal: spacing["2xl"], paddingBottom: hpx(40) },
  floatingCard: {
    backgroundColor: colors.card,
    borderRadius: wpx(20),
    padding: spacing["2xl"],
    ...shadows.elevated,
  },

  recordCard: {
    backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg,
    marginBottom: spacing.md, ...shadows.card,
  },
  recordTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.sm },
  recordType: { ...textPresets.cardTitle, flex: 1, marginRight: spacing.sm },
  stateBadge: { paddingHorizontal: spacing.sm + 1, paddingVertical: spacing.xs, borderRadius: radius.sm },
  stateBadgeText: { fontSize: rf(10), fontWeight: "700" as any },
  recordDateRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs, marginBottom: spacing.xs },
  recordDates: { fontSize: rf(12), color: colors.textSecondary, flex: 1 },
  recordDays: { fontSize: rf(12), fontWeight: "700" as any, color: colors.primary, textAlign: "right" },
  endText: { textAlign: "center", ...textPresets.caption, marginTop: spacing.sm },

  fab: {
    position: "absolute", right: spacing["2xl"], bottom: spacing["2xl"],
    width: sizes.fabSize, height: sizes.fabSize, borderRadius: radius.full,
    backgroundColor: colors.primary, justifyContent: "center", alignItems: "center",
    ...shadows.elevated, shadowColor: colors.primary,
  },

  // iOS picker
  pickerBg: { flex: 1, backgroundColor: colors.overlay },
  pickerContainer: { backgroundColor: colors.card, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, paddingBottom: hpx(34) },
  pickerHeader: { flexDirection: "row", justifyContent: "flex-end", paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.xs },
  pickerDone: { fontSize: rf(16), fontWeight: "700" as any, color: colors.primary },
});

const modalStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: "flex-end" },
  content: { backgroundColor: colors.card, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: spacing["2xl"] },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.xl },
  title: { ...textPresets.screenTitle },
  fieldLabel: { ...textPresets.label, marginBottom: spacing.sm, marginTop: spacing.md, fontWeight: "700" as any },

  pickerRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border,
    padding: spacing.md, marginBottom: spacing.sm,
  },
  pickerRowActive: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
  pickerRowLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  radio: { width: wpx(18), height: hpx(18), borderRadius: radius.full, borderWidth: 2, borderColor: colors.border, marginRight: spacing.md },
  radioActive: { borderColor: colors.primary, backgroundColor: colors.primary },
  pickerRowTitle: { fontSize: rf(14), fontWeight: "700" as any, color: colors.textPrimary },
  pickerRowTitleActive: { color: colors.primary },
  pickerRowSub: { fontSize: rf(11), color: colors.textMuted, marginTop: hpx(2) },
  pickerRowRight: { alignItems: "flex-end", marginLeft: spacing.md },
  pickerRowRemain: { fontSize: rf(18), fontWeight: "800" as any, color: colors.textMuted },
  pickerRowRemainActive: { color: colors.primary },
  progressTrack: { width: wpx(44), height: hpx(4), backgroundColor: colors.border, borderRadius: 2, marginTop: spacing.xs, overflow: "hidden" },
  progressBar: { height: "100%", backgroundColor: colors.primary, borderRadius: 2 },

  formField: {
    borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md,
    height: sizes.selectHeight,
    justifyContent: "center", marginBottom: spacing.md,
  },
  formValue: { color: colors.textPrimary, fontSize: rf(14) },
  formPlaceholder: { color: colors.textMuted, fontSize: rf(14) },

  submitBtn: { height: sizes.buttonMd, backgroundColor: colors.primary, borderRadius: radius.md, justifyContent: "center", alignItems: "center", marginTop: spacing.lg },
  submitBtnText: { color: "#FFFFFF", fontSize: rf(16), fontWeight: "700" as any },
});
