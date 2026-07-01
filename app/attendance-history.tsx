import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
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
import { SafeAreaView } from "react-native-safe-area-context";
import { attendanceService } from "../services/attendanceService";
import type { AttendanceRecord } from "../types/attendance";

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

export default function AttendanceHistoryScreen() {
  const router = useRouter();

  // Default: bulan ini
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

  const fetchHistory = useCallback(
    async (pageNum: number, append: boolean = false) => {
      if (append) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }
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

        const res = await attendanceService.getHistory(params);
        const items = res.data.data || [];
        const pagination = res.data.pagination;

        if (append) {
          setRecords((prev) => [...prev, ...items]);
        } else {
          setRecords(items);
        }
        setTotalPages(pagination?.total_pages || 1);
        setPage(pageNum);
      } catch (err: any) {
        const message =
          err?.response?.data?.message || "Gagal memuat riwayat presensi";
        setError(message);
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [dateFrom, dateTo],
  );

  // Fetch on mount & when dateFrom/dateTo change
  useEffect(() => {
    fetchHistory(1);
  }, [dateFrom, dateTo]);

  const handlePickerChange = (
    _event: DateTimePickerEvent,
    selectedDate?: Date,
  ) => {
    setShowPicker(null);
    if (selectedDate && showPicker === "from") {
      setDateFrom(selectedDate);
    } else if (selectedDate && showPicker === "to") {
      setDateTo(selectedDate);
    }
  };

  const handleLoadMore = () => {
    if (page < totalPages && !isLoadingMore) {
      fetchHistory(page + 1, true);
    }
  };

  const formatDateTime = (iso?: string) => {
    if (!iso) return "—";
    try {
      const d = new Date(iso);
      const date = d.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
      const time = d.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Jakarta",
      });
      return `${date} ${time}`;
    } catch {
      return iso;
    }
  };

  const formatHours = (hours?: number | null) => {
    if (hours == null) return "—";
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}j ${m}m`;
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
        <Text style={styles.headerTitle}>Riwayat Presensi</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Filter Row — Date Pickers */}
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

      {/* Date Time Picker Modal */}
      {showPicker && Platform.OS === "ios" ? (
        <View style={[StyleSheet.absoluteFill, styles.pickerOverlayIos]}>
            <TouchableOpacity style={styles.pickerOverlayBgIos} onPress={() => setShowPicker(null)} />
            <View style={styles.pickerContainerIos}>
              <View style={styles.pickerHeaderIos}>
                <TouchableOpacity onPress={() => {
                  if (showPicker === "from") setDateFrom(tempPickerDate);
                  else setDateTo(tempPickerDate);
                  setShowPicker(null);
                }}>
                  <Text style={styles.pickerDoneTextIos}>Selesai</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={showPicker === "from" ? dateFrom : dateTo}
                mode="date"
                display="inline"
                themeVariant="light"
                onChange={(_e, d) => { if (d) setTempPickerDate(d); }}
              />
            </View>
          </View>
      ) : showPicker ? (
        <DateTimePicker
          value={showPicker === "from" ? dateFrom : dateTo}
          mode="date"
          display="default"
          onChange={handlePickerChange}
        />
      ) : null}

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        onMomentumScrollEnd={({ nativeEvent }) => {
          const { contentOffset, contentSize, layoutMeasurement } = nativeEvent;
          if (
            contentOffset.y + layoutMeasurement.height >=
            contentSize.height - 40
          ) {
            handleLoadMore();
          }
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
            <Ionicons name="time-outline" size={48} color="#9CA3AF" />
            <Text style={styles.emptyText}>Belum ada riwayat presensi.</Text>
          </View>
        ) : (
          <>
            <Text style={styles.countText}>
              Menampilkan {records.length} record{records.length > 1 ? "" : ""}
            </Text>
            {records.map((rec) => (
              <View key={rec.id} style={styles.recordCard}>
                <View style={styles.recordHeader}>
                  <Text style={styles.recordDate}>
                    {formatDateTime(rec.check_in)}
                  </Text>
                  <Text style={styles.recordHours}>
                    {formatHours(rec.worked_hours)}
                  </Text>
                </View>
                <View style={styles.recordDetail}>
                  <View style={styles.recordCol}>
                    <Text style={styles.recordLabel}>Check In</Text>
                    <Text style={styles.recordValue}>
                      {rec.check_in
                        ? new Date(rec.check_in).toLocaleTimeString("id-ID", {
                            hour: "2-digit",
                            minute: "2-digit",
                            timeZone: "Asia/Jakarta",
                          })
                        : "—"}
                    </Text>
                  </View>
                  <View style={styles.recordDivider} />
                  <View style={styles.recordCol}>
                    <Text style={styles.recordLabel}>Check Out</Text>
                    <Text style={styles.recordValue}>
                      {rec.check_out
                        ? new Date(rec.check_out).toLocaleTimeString("id-ID", {
                            hour: "2-digit",
                            minute: "2-digit",
                            timeZone: "Asia/Jakarta",
                          })
                        : "—"}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
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
      </ScrollView>
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
  datePickerValue: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1F2937",
  },
  scrollContainer: { padding: 16, paddingBottom: 40 },
  countText: {
    fontSize: 12,
    color: "#9CA3AF",
    fontWeight: "600",
    marginBottom: 12,
  },
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
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    paddingBottom: 8,
  },
  recordDate: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1F2937",
  },
  recordHours: {
    fontSize: 12,
    fontWeight: "600",
    color: "#2E5BFF",
  },
  recordDetail: {
    flexDirection: "row",
    alignItems: "center",
  },
  recordCol: {
    flex: 1,
    alignItems: "center",
  },
  recordLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#9CA3AF",
    marginBottom: 4,
  },
  recordValue: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1F2937",
  },
  recordDivider: {
    width: 1,
    height: 30,
    backgroundColor: "#E5E7EB",
    marginHorizontal: 12,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 14,
    color: "#9CA3AF",
    marginTop: 12,
  },
  endText: {
    textAlign: "center",
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 8,
  },
  // iOS Picker
  pickerContainerIos: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34,
  },
  pickerHeaderIos: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 4,
  },
  pickerDoneTextIos: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2E5BFF",
  },
  pickerOverlayIos: {
    zIndex: 999,
    justifyContent: "flex-end",
  },
  pickerOverlayBgIos: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
});
