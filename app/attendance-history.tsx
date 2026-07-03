import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, hpx, radius, rf, shadows, sizes, spacing, textPresets, wpx } from "../src/constants/theme";
import { attendanceService } from "../services/attendanceService";
import type { AttendanceRecord } from "../types/attendance";

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

function fmtTime(iso?: string) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" });
  } catch { return iso; }
}

export default function AttendanceHistoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const [dateFrom, setDateFrom] = useState<Date>(firstOfMonth);
  const [dateTo, setDateTo] = useState<Date>(lastOfMonth);
  const [showPicker, setShowPicker] = useState<"from" | "to" | null>(null);
  const [tempPickerDate, setTempPickerDate] = useState(new Date());

  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async (pageNum: number, append = false) => {
    if (append) setIsLoadingMore(true); else setIsLoading(true);
    setError(null);
    try {
      const params: any = { page: pageNum, per_page: PER_PAGE, date_from: formatDate(dateFrom), date_to: formatDate(dateTo) };
      const res = await attendanceService.getHistory(params);
      const items = res.data.data || [];
      const pagination = res.data.pagination;
      if (append) setRecords((p) => [...p, ...items]); else setRecords(items);
      setTotalPages(pagination?.total_pages || 1);
      setPage(pageNum);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Gagal memuat riwayat");
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [dateFrom, dateTo]);

  useEffect(() => { fetchHistory(1); }, [dateFrom, dateTo]);

  const handlePickerChange = (_e: DateTimePickerEvent, d?: Date) => {
    setShowPicker(null);
    if (d && showPicker === "from") setDateFrom(d);
    else if (d && showPicker === "to") setDateTo(d);
  };

  const handleLoadMore = () => {
    if (page < totalPages && !isLoadingMore) fetchHistory(page + 1, true);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Riwayat Presensi</Text>
        <View style={styles.headerBtn} />
      </View>

      {/* Date filter */}
      <View style={styles.filterRow}>
        <TouchableOpacity style={styles.dateBtn} onPress={() => setShowPicker("from")}>
          <Text style={styles.dateBtnLabel}>Dari</Text>
          <Text style={styles.dateBtnValue}>{toDisplay(dateFrom)}</Text>
        </TouchableOpacity>
        <Ionicons name="arrow-forward" size={14} color={colors.border} style={{ marginHorizontal: spacing.sm }} />
        <TouchableOpacity style={styles.dateBtn} onPress={() => setShowPicker("to")}>
          <Text style={styles.dateBtnLabel}>Sampai</Text>
          <Text style={styles.dateBtnValue}>{toDisplay(dateTo)}</Text>
        </TouchableOpacity>
      </View>

      {/* iOS Picker overlay */}
      {showPicker && Platform.OS === "ios" ? (
        <View style={StyleSheet.absoluteFill}>
          <TouchableOpacity style={styles.pickerBg} onPress={() => setShowPicker(null)} />
          <View style={styles.pickerContainer}>
            <View style={styles.pickerHeader}>
              <TouchableOpacity onPress={() => {
                if (showPicker === "from") setDateFrom(tempPickerDate);
                else setDateTo(tempPickerDate);
                setShowPicker(null);
              }}>
                <Text style={styles.pickerDone}>Selesai</Text>
              </TouchableOpacity>
            </View>
            <DateTimePicker
              value={showPicker === "from" ? dateFrom : dateTo}
              mode="date" display="inline" themeVariant="light"
              onChange={(_e, d) => { if (d) setTempPickerDate(d); }}
            />
          </View>
        </View>
      ) : showPicker ? (
        <DateTimePicker
          value={showPicker === "from" ? dateFrom : dateTo}
          mode="date" display="default"
          onChange={handlePickerChange}
        />
      ) : null}

      {/* List */}
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        onMomentumScrollEnd={({ nativeEvent }) => {
          const { contentOffset, contentSize, layoutMeasurement } = nativeEvent;
          if (contentOffset.y + layoutMeasurement.height >= contentSize.height - 40) handleLoadMore();
        }}
      >
        {isLoading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: spacing["4xl"] }} />
        ) : error ? (
          <View style={styles.center}>
            <Ionicons name="alert-circle-outline" size={40} color={colors.error} />
            <Text style={styles.emptyText}>{error}</Text>
          </View>
        ) : records.length === 0 ? (
          <View style={styles.center}>
            <Ionicons name="time-outline" size={40} color={colors.textMuted} />
            <Text style={styles.emptyText}>Belum ada riwayat presensi.</Text>
          </View>
        ) : (
          <>
            <Text style={styles.countText}>{records.length} record</Text>
            {records.map((rec) => (
              <View key={rec.id} style={styles.recordCard}>
                <View style={styles.recordHeader}>
                  <Text style={styles.recordDate}>{fmtTime(rec.check_in)}</Text>
                  <Text style={styles.recordHours}>
                    {rec.worked_hours != null
                      ? `${Math.floor(rec.worked_hours)}j ${Math.round((rec.worked_hours - Math.floor(rec.worked_hours)) * 60)}m`
                      : "—"}
                  </Text>
                </View>
                <View style={styles.recordBody}>
                  <View style={styles.recordCol}>
                    <Text style={styles.recordLabel}>Check In</Text>
                    <Text style={styles.recordValue}>{fmtTime(rec.check_in)}</Text>
                  </View>
                  <View style={styles.recordDivider} />
                  <View style={styles.recordCol}>
                    <Text style={styles.recordLabel}>Check Out</Text>
                    <Text style={styles.recordValue}>{fmtTime(rec.check_out)}</Text>
                  </View>
                </View>
              </View>
            ))}
            {isLoadingMore && <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: spacing.lg }} />}
            {page >= totalPages && records.length > 0 && (
              <Text style={styles.endText}>Semua data telah dimuat</Text>
            )}
          </>
        )}
        <View style={{ height: spacing["2xl"] }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  center: { alignItems: "center", paddingVertical: spacing["4xl"] },
  emptyText: { ...textPresets.body, marginTop: spacing.md },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    height: sizes.headerHeight,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginTop: Platform.OS === "android" ? spacing.sm : 0,
  },
  headerBtn: { width: sizes.headerBtnWidth, height: sizes.headerBtn, borderRadius: radius.md, justifyContent: "center", alignItems: "center" },
  headerTitle: { ...textPresets.screenTitle, fontSize: rf(17), flex: 1, textAlign: "left", marginLeft: spacing.xs },

  // Filter
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dateBtn: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  dateBtnLabel: { ...textPresets.label, marginBottom: hpx(2) },
  dateBtnValue: { ...textPresets.cardTitle, fontSize: rf(13) },

  // List
  scroll: { padding: spacing["2xl"], paddingBottom: spacing["4xl"] },
  countText: { ...textPresets.caption, marginBottom: spacing.md },
  recordCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.card,
  },
  recordHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: spacing.sm,
  },
  recordDate: { ...textPresets.cardTitle, fontSize: rf(13) },
  recordHours: { fontSize: rf(12), fontWeight: "600" as any, color: colors.primary },
  recordBody: { flexDirection: "row", alignItems: "center" },
  recordCol: { flex: 1, alignItems: "center" },
  recordLabel: { ...textPresets.label, marginBottom: spacing.xs },
  recordValue: { ...textPresets.cardTitle, fontSize: rf(15) },
  recordDivider: { width: 1, height: hpx(30), backgroundColor: colors.border, marginHorizontal: spacing.md },

  endText: { textAlign: "center", ...textPresets.caption, marginTop: spacing.sm },

  // iOS picker
  pickerBg: { flex: 1, backgroundColor: colors.overlay },
  pickerContainer: { backgroundColor: colors.card, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, paddingBottom: hpx(34) },
  pickerHeader: { flexDirection: "row", justifyContent: "flex-end", paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.xs },
  pickerDone: { fontSize: rf(16), fontWeight: "700" as any, color: colors.primary },
});
