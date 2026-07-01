import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { timeOffService } from "../services/timeOffService";
import type { TimeOff } from "../types/timeOff";

const stateStyleMap: Record<
  string,
  { color: string; bg: string; label: string }
> = {
  draft: { color: "#FFB020", bg: "#FFF4E5", label: "Draft" },
  confirm: { color: "#2E5BFF", bg: "#E0E7FF", label: "Menunggu" },
  validate1: { color: "#8B5CF6", bg: "#EDE9FE", label: "Approval 1" },
  validate: { color: "#10B981", bg: "#E6F4EA", label: "Disetujui" },
  refuse: { color: "#EF4444", bg: "#FEE2E2", label: "Ditolak" },
  cancel: { color: "#9CA3AF", bg: "#F3F4F6", label: "Dibatalkan" },
  approved: { color: "#10B981", bg: "#E6F4EA", label: "Disetujui" },
};

const tz = "Asia/Jakarta";

function fmtDateTime(iso: string) {
  try {
    const d = new Date(iso);
    const date = d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: tz,
    });
    const time = d.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: tz,
    });
    return `${date} ${time}`;
  } catch {
    return iso;
  }
}

function fmtDateOnly(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: tz,
    });
  } catch {
    return iso;
  }
}

export default function TimeOffDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<TimeOff | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        setIsLoading(true);
        setError(null);
        const res = await timeOffService.getById(Number(id));
        setData(res.data.data);
      } catch (err: any) {
        setError(err?.response?.data?.message || "Gagal memuat detail cuti");
      } finally {
        setIsLoading(false);
      }
    })();
  }, [id]);

  if (isLoading) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator size="large" color="#2E5BFF" />
      </SafeAreaView>
    );
  }

  if (error || !data) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
        </View>
        <View
          style={[
            styles.container,
            { justifyContent: "center", alignItems: "center" },
          ]}
        >
          <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
          <Text style={styles.emptyText}>
            {error || "Data tidak ditemukan."}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const st = stateStyleMap[data.state] || stateStyleMap.draft;
  const canCancel =
    data.state === "draft" ||
    data.state === "confirm" ||
    data.state === "validate";

  const handleCancel = () => {
    Alert.alert(
      "Batalkan Cuti",
      "Apakah Anda yakin ingin membatalkan pengajuan cuti ini?",
      [
        { text: "Tidak", style: "cancel" },
        {
          text: "Ya, Batalkan",
          style: "destructive",
          onPress: async () => {
            setIsCancelling(true);
            try {
              await timeOffService.cancel(data.id);
              // Refresh data
              const res = await timeOffService.getById(data.id);
              setData(res.data.data);
            } catch (err: any) {
              Alert.alert(
                "Gagal",
                err?.response?.data?.message ||
                  "Terjadi kesalahan saat membatalkan cuti.",
              );
            } finally {
              setIsCancelling(false);
            }
          },
        },
      ],
    );
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
        <Text style={styles.headerTitle}>Detail Cuti</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={[styles.stateBadge, { backgroundColor: st.bg }]}>
            <Text style={[styles.stateBadgeText, { color: st.color }]}>
              {data.state_label || st.label}
            </Text>
          </View>
        </View>

        {/* Leave Type & Employee */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="umbrella-outline" size={20} color="#2E5BFF" />
            <View style={styles.infoTextWrapper}>
              <Text style={styles.infoLabel}>Tipe Cuti</Text>
              <Text style={styles.infoValue}>
                {data.holiday_status?.name || "—"}
              </Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Ionicons name="person-outline" size={20} color="#10B981" />
            <View style={styles.infoTextWrapper}>
              <Text style={styles.infoLabel}>Karyawan</Text>
              <Text style={styles.infoValue}>{data.employee?.name || "—"}</Text>
            </View>
          </View>
          {data.department ? (
            <>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Ionicons name="business-outline" size={20} color="#FFB020" />
                <View style={styles.infoTextWrapper}>
                  <Text style={styles.infoLabel}>Departemen</Text>
                  <Text style={styles.infoValue}>{data.department.name}</Text>
                </View>
              </View>
            </>
          ) : null}
        </View>

        {/* Date Range */}
        <View style={styles.detailCard}>
          <Text style={styles.detailCardTitle}>Periode</Text>
          <View style={styles.dateRow}>
            <View style={styles.dateBox}>
              <Ionicons name="calendar-outline" size={20} color="#2E5BFF" />
              <Text style={styles.dateLabel}>Mulai</Text>
              <Text style={styles.dateValue}>
                {fmtDateTime(data.date_from)}
              </Text>
            </View>
            <Ionicons name="arrow-forward" size={20} color="#D1D5DB" />
            <View style={styles.dateBox}>
              <Ionicons name="calendar-outline" size={20} color="#2E5BFF" />
              <Text style={styles.dateLabel}>Selesai</Text>
              <Text style={styles.dateValue}>{fmtDateTime(data.date_to)}</Text>
            </View>
          </View>
        </View>

        {/* Duration */}
        <View style={styles.statCard}>
          <Ionicons name="time-outline" size={28} color="#2E5BFF" />
          <Text style={styles.statValue}>{data.number_of_days}</Text>
          <Text style={styles.statLabel}>Hari</Text>
        </View>

        {/* Notes */}
        {data.name ? (
          <View style={styles.detailCard}>
            <Text style={styles.detailCardTitle}>Keterangan</Text>
            <Text style={styles.noteText}>{data.name}</Text>
          </View>
        ) : null}

        {canCancel && <View style={{ height: 80 }} />}
      </ScrollView>

      {canCancel && (
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={handleCancel}
            disabled={isCancelling}
          >
            {isCancelling ? (
              <ActivityIndicator color="#EF4444" size="small" />
            ) : (
              <>
                <Ionicons
                  name="close-circle-outline"
                  size={20}
                  color="#EF4444"
                />
                <Text style={styles.cancelBtnText}>Batalkan Pengajuan</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
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
  header: { paddingHorizontal: 24, paddingTop: 16 },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContainer: { padding: 24, paddingBottom: 40 },
  // Status
  statusCard: { alignItems: "center", marginBottom: 20, marginTop: 8 },
  stateBadge: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 12 },
  stateBadgeText: { fontSize: 14, fontWeight: "800" },
  // Info card
  infoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 2,
  },
  infoRow: { flexDirection: "row", alignItems: "center" },
  infoTextWrapper: { marginLeft: 14, flex: 1 },
  infoLabel: { fontSize: 12, fontWeight: "600", color: "#9CA3AF" },
  infoValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginVertical: 14,
    marginLeft: 34,
  },
  // Detail card
  detailCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 1,
  },
  detailCardTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#9CA3AF",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  dateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 8,
  },
  dateBox: { alignItems: "center", width: "45%" },
  dateLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 8,
    fontWeight: "600",
  },
  dateValue: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1F2937",
    marginTop: 2,
    textAlign: "center",
  },
  // Stat
  statCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 2,
  },
  statValue: {
    fontSize: 32,
    fontWeight: "800",
    color: "#1F2937",
    marginTop: 8,
  },
  statLabel: { fontSize: 13, color: "#6B7280", marginTop: 4 },
  // Note
  noteText: { fontSize: 14, color: "#4B5563", lineHeight: 20 },
  // Empty
  emptyText: { fontSize: 14, color: "#9CA3AF", marginTop: 12 },
  // Bottom Bar
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 24,
    paddingVertical: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 6,
  },
  cancelBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#EF4444",
    backgroundColor: "#FFFFFF",
  },
  cancelBtnText: {
    color: "#EF4444",
    fontSize: 16,
    fontWeight: "700",
    marginLeft: 8,
  },
});
