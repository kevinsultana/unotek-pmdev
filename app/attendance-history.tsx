import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import * as Location from "expo-location";
import { router, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { attendanceService } from "../services/attendanceService";
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
import type { AttendanceRecord } from "../types/attendance";

const PER_PAGE = 20;

function formatDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function toDisplay(d: Date) {
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function fmtTime(iso?: string) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Jakarta",
    });
  } catch {
    return iso;
  }
}

function fmtRecordDate(iso?: string) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("id-ID", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function getTypeBadgeBg(type?: string | null) {
  if (!type) return "#F1F5F9";
  const t = type.toLowerCase();
  if (t === "wfo") return colors.primaryLight;
  if (t === "wfh") return "#EDE9FE";
  if (t === "wfa") return "#FEF3C7";
  return "#F1F5F9";
}

function getTypeBadgeColor(type?: string | null) {
  if (!type) return colors.textSecondary;
  const t = type.toLowerCase();
  if (t === "wfo") return colors.primary;
  if (t === "wfh") return "#7C3AED";
  if (t === "wfa") return "#D97706";
  return colors.textSecondary;
}

function AttendanceAddressText({ lat, lng }: { lat?: number | null; lng?: number | null }) {
  const [address, setAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (lat == null || lng == null) {
      setAddress("Lokasi tidak terekam");
      return;
    }

    let isMounted = true;
    const getAddress = async () => {
      setLoading(true);
      try {
        const result = await Location.reverseGeocodeAsync({
          latitude: lat,
          longitude: lng,
        });
        if (isMounted) {
          if (result?.length) {
            const a = result[0];
            const addr = [a.name, a.street, a.district, a.city || a.subregion]
              .filter(Boolean)
              .join(", ") || "Lokasi tidak dikenal";
            setAddress(addr);
          } else {
            setAddress(`Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`);
          }
        }
      } catch {
        if (isMounted) {
          setAddress(`Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    getAddress();

    return () => {
      isMounted = false;
    };
  }, [lat, lng]);

  if (loading) {
    return <Text style={styles.addressLoading}>Mencari alamat…</Text>;
  }

  return (
    <Text style={styles.addressText} numberOfLines={2}>
      {address}
    </Text>
  );
}

export default function AttendanceHistoryScreen() {
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

  const fetchHistory = useCallback(
    async (pageNum: number, append = false) => {
      if (append) setIsLoadingMore(true);
      else setIsLoading(true);
      setError(null);
      try {
        const params: any = {
          page: pageNum,
          per_page: PER_PAGE,
          date_from: formatDate(dateFrom),
          date_to: formatDate(dateTo),
        };
        const res = await attendanceService.getHistory(params);
        const items = res.data.data || [];
        const pagination = res.data.pagination;
        if (append) setRecords((p) => [...p, ...items]);
        else setRecords(items);
        setTotalPages(pagination?.total_pages || 1);
        setPage(pageNum);
      } catch (err: any) {
        setError(err?.response?.data?.message || "Gagal memuat riwayat");
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [dateFrom, dateTo],
  );

  useEffect(() => {
    fetchHistory(1);
  }, [dateFrom, dateTo]);

  const handlePickerChange = (_e: DateTimePickerEvent, d?: Date) => {
    setShowPicker(null);
    if (d && showPicker === "from") setDateFrom(d);
    else if (d && showPicker === "to") setDateTo(d);
  };

  const handleLoadMore = () => {
    if (page < totalPages && !isLoadingMore) fetchHistory(page + 1, true);
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
          <Text style={styles.headerTitle}>Riwayat Presensi</Text>
          <View style={styles.backBtn} />
        </View>
      </View>

      {/* Date filter */}
      <View style={styles.filterRow}>
        {Platform.OS === "ios" ? (
          <View style={[styles.dateBtn]}>
            <Text style={styles.dateBtnLabel}>Dari</Text>
            <DateTimePicker
              value={dateFrom}
              mode="date"
              display="default"
              locale="id-ID"
              themeVariant="light"
              onChange={(_e, d) => {
                if (d) setDateFrom(d);
              }}
            />
          </View>
        ) : (
          <TouchableOpacity
            style={styles.dateBtn}
            activeOpacity={0.7}
            onPress={() => {
              setTempPickerDate(dateFrom);
              setShowPicker("from");
            }}
          >
            <Text style={styles.dateBtnLabel}>Dari</Text>
            <Text style={styles.dateBtnValue}>{toDisplay(dateFrom)}</Text>
          </TouchableOpacity>
        )}
        <Ionicons
          name="arrow-forward"
          size={14}
          color={colors.border}
          style={{ marginHorizontal: spacing.sm }}
        />
        {Platform.OS === "ios" ? (
          <View style={[styles.dateBtn]}>
            <Text style={styles.dateBtnLabel}>Sampai</Text>
            <DateTimePicker
              value={dateTo}
              mode="date"
              display="default"
              locale="id-ID"
              themeVariant="light"
              onChange={(_e, d) => {
                if (d) setDateTo(d);
              }}
            />
          </View>
        ) : (
          <TouchableOpacity
            style={styles.dateBtn}
            activeOpacity={0.7}
            onPress={() => {
              setTempPickerDate(dateTo);
              setShowPicker("to");
            }}
          >
            <Text style={styles.dateBtnLabel}>Sampai</Text>
            <Text style={styles.dateBtnValue}>{toDisplay(dateTo)}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* List */}
      <ScrollView
        contentContainerStyle={styles.scroll}
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
        <View style={styles.floatingCard}>
          {isLoading ? (
            <ActivityIndicator
              size="large"
              color={colors.primary}
              style={{ marginVertical: spacing["4xl"] }}
            />
          ) : error ? (
            <View style={styles.center}>
              <Ionicons
                name="alert-circle-outline"
                size={40}
                color={colors.error}
              />
              <Text style={styles.emptyText}>{error}</Text>
            </View>
          ) : records.length === 0 ? (
            <View style={styles.center}>
              <Ionicons
                name="time-outline"
                size={40}
                color={colors.textMuted}
              />
              <Text style={styles.emptyText}>Belum ada riwayat presensi.</Text>
            </View>
          ) : (
            <>
              <Text style={styles.countText}>{records.length} record</Text>
              {records.map((rec) => (
                <View key={rec.id} style={styles.recordCard}>
                  <View style={styles.recordHeader}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
                      <Text style={styles.recordDate}>
                        {fmtRecordDate(rec.check_in)}
                      </Text>
                      {rec.attendance_type && (
                        <View style={[styles.typeBadge, { backgroundColor: getTypeBadgeBg(rec.attendance_type) }]}>
                          <Text style={[styles.typeBadgeText, { color: getTypeBadgeColor(rec.attendance_type) }]}>
                            {rec.attendance_type.toUpperCase()}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.recordHours}>
                      {rec.worked_hours != null
                        ? `${Math.floor(rec.worked_hours)}j ${Math.round((rec.worked_hours - Math.floor(rec.worked_hours)) * 60)}m`
                        : "—"}
                    </Text>
                  </View>
                  <View style={styles.recordBody}>
                    <View style={styles.recordCol}>
                      <Text style={styles.recordLabel}>Check In</Text>
                      <Text style={styles.recordValue}>
                        {fmtTime(rec.check_in)}
                      </Text>
                      {rec.check_in_latitude != null && (
                        <View style={styles.addressRow}>
                          <Ionicons name="location-outline" size={10} color={colors.textMuted} />
                          <AttendanceAddressText
                            lat={rec.check_in_latitude}
                            lng={rec.check_in_longitude}
                          />
                        </View>
                      )}
                    </View>
                    <View style={styles.recordDivider} />
                    <View style={styles.recordCol}>
                      <Text style={styles.recordLabel}>Check Out</Text>
                      <Text style={styles.recordValue}>
                        {fmtTime(rec.check_out)}
                      </Text>
                      {rec.check_out && rec.check_out_latitude != null && (
                        <View style={styles.addressRow}>
                          <Ionicons name="location-outline" size={10} color={colors.textMuted} />
                          <AttendanceAddressText
                            lat={rec.check_out_latitude}
                            lng={rec.check_out_longitude}
                          />
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              ))}
              {isLoadingMore && (
                <ActivityIndicator
                  size="small"
                  color={colors.primary}
                  style={{ marginVertical: spacing.lg }}
                />
              )}
              {page >= totalPages && records.length > 0 && (
                <Text style={styles.endText}>Semua data telah dimuat</Text>
              )}
            </>
          )}
        </View>
        <View style={{ height: hpx(24) }} />
      </ScrollView>

      {/* Android date picker rendered outside ScrollView */}
      {
        showPicker && Platform.OS !== "ios" ? (
          <DateTimePicker
            value={showPicker === "from" ? dateFrom : dateTo}
            mode="date"
            display="default"
            onChange={handlePickerChange}
          />
        ) : null
      }
    </View >
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
    textAlign: "center",
  },

  // Filter
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing["2xl"],
    paddingVertical: spacing.md,
    // marginTop: -hpx(24),
    zIndex: 2,
  },
  dateBtn: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    ...shadows.card,
  },
  dateBtnLabel: { ...textPresets.label, marginBottom: hpx(2) },
  dateBtnValue: { ...textPresets.cardTitle, fontSize: rf(13) },

  // Scroll
  scroll: { paddingHorizontal: spacing["2xl"], paddingBottom: hpx(40) },
  floatingCard: {
    backgroundColor: colors.card,
    borderRadius: wpx(20),
    padding: spacing["2xl"],
    ...shadows.elevated,
  },

  // List
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
  typeBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: hpx(2),
    borderRadius: radius.xs,
    justifyContent: "center",
    alignItems: "center",
  },
  typeBadgeText: {
    fontSize: rf(10),
    fontWeight: "800" as any,
  },
  recordHours: {
    fontSize: rf(12),
    fontWeight: "600" as any,
    color: colors.primary,
  },
  recordBody: { flexDirection: "row", alignItems: "center" },
  recordCol: { flex: 1, alignItems: "center" },
  recordLabel: { ...textPresets.label, marginBottom: spacing.xs },
  recordValue: { ...textPresets.cardTitle, fontSize: rf(15) },
  recordDivider: {
    width: 1,
    height: hpx(30),
    backgroundColor: colors.border,
    marginHorizontal: spacing.md,
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: wpx(2),
    marginTop: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  addressText: {
    fontSize: rf(9),
    color: colors.textSecondary,
    textAlign: "center",
    flexShrink: 1,
  },
  addressLoading: {
    fontSize: rf(9),
    color: colors.textMuted,
    fontStyle: "italic",
    textAlign: "center",
  },

  endText: {
    textAlign: "center",
    ...textPresets.caption,
    marginTop: spacing.sm,
  },

  // iOS picker
  pickerBg: { flex: 1, backgroundColor: colors.overlay },
  pickerContainer: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingBottom: hpx(34),
  },
  pickerHeader: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
  },
  pickerDone: {
    fontSize: rf(16),
    fontWeight: "700" as any,
    color: colors.primary,
  },
  doneBtn: {
    height: sizes.buttonMd,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    justifyContent: "center",
    alignItems: "center",
    marginTop: spacing.lg,
  },
  doneBtnText: {
    color: "#FFFFFF",
    fontSize: rf(16),
    fontWeight: "700" as any,
  },
});
