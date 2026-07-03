import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Location from "expo-location";
import { useFocusEffect, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { colors, hpx, radius, rf, shadows, sizes, spacing, textPresets, wpx } from "../../src/constants/theme";
import { Card } from "../../src/components/ui";
import { useAttendance } from "../../hooks/useAttendance";
import { showToast } from "../../utils/toast";

export default function KehadiranScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    status: attStatus,
    isLoading: attLoading,
    checkIn,
    checkOut,
    refresh: refreshAttendance,
  } = useAttendance();

  // Clock
  const [currentTime, setCurrentTime] = useState("");
  const [currentDate, setCurrentDate] = useState("");

  // Camera & GPS
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  const hasCheckedIn = attStatus?.employee?.attendance_state === "checked_in";
  const todayRecords = attStatus?.today ?? [];
  const lastRecord = todayRecords[todayRecords.length - 1];
  const hasCheckedOutToday =
    todayRecords.length > 0 && lastRecord?.check_out !== null;

  const formatTime = (isoString: string | null | undefined) => {
    if (!isoString) return "";
    try {
      const date = new Date(isoString);
      return date
        .toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          timeZone: "Asia/Jakarta",
        })
        .replace(/\./g, ".");
    } catch {
      return isoString;
    }
  };

  // Modal states
  const [isAttendanceModalVisible, setIsAttendanceModalVisible] = useState(false);
  const [attendanceType, setAttendanceType] = useState<"checkin" | "checkout">("checkin");
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsCoords, setGpsCoords] = useState<{ lat: string; lng: string } | null>(null);
  const [gpsAddress, setGpsAddress] = useState<string | null>(null);
  const [photoCaptured, setPhotoCaptured] = useState(false);
  const [isSubmittingAttendance, setIsSubmittingAttendance] = useState(false);

  useFocusEffect(
    useCallback(() => {
      refreshAttendance();
    }, [refreshAttendance]),
  );

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      );
      setCurrentDate(
        now.toLocaleDateString("id-ID", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        }),
      );
    };
    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const openAttendanceFlow = async (type: "checkin" | "checkout") => {
    setAttendanceType(type);
    setIsAttendanceModalVisible(true);
    setPhotoCaptured(false);
    setPhotoUri(null);
    setGpsCoords(null);

    const cameraPermissionResult = await requestCameraPermission();
    if (!cameraPermissionResult.granted) {
      showToast("error", "Izin Kamera", "Akses kamera diperlukan untuk foto selfie presensi.");
      setIsAttendanceModalVisible(false);
      return;
    }

    setGpsLoading(true);
    setGpsAddress(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        showToast("error", "Izin Lokasi", "Akses GPS diperlukan untuk validasi lokasi.");
        setGpsLoading(false);
        setIsAttendanceModalVisible(false);
        return;
      }
      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const lat = location.coords.latitude;
      const lng = location.coords.longitude;
      setGpsCoords({ lat: lat.toFixed(6), lng: lng.toFixed(6) });
      try {
        const reverseGeocode = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
        if (reverseGeocode?.length) {
          const a = reverseGeocode[0];
          const parts = [a.name, a.street, a.district, a.city || a.subregion].filter(Boolean);
          setGpsAddress(parts.join(", ") || "Lokasi tidak dikenal");
        } else {
          setGpsAddress("Alamat tidak ditemukan");
        }
      } catch {
        setGpsAddress("Lokasi terdeteksi");
      }
    } catch {
      showToast("error", "Error GPS", "Gagal mendapatkan koordinat GPS.");
    } finally {
      setGpsLoading(false);
    }
  };

  const handleCapturePhoto = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({ quality: 0.5, skipProcessing: true });
        if (photo) {
          setPhotoUri(photo.uri);
          setPhotoCaptured(true);
        }
      } catch {
        showToast("error", "Kamera", "Gagal menangkap gambar.");
      }
    }
  };

  const handleConfirmAttendance = async () => {
    setIsSubmittingAttendance(true);
    try {
      if (attendanceType === "checkin") {
        await checkIn({} as any);
        showToast("success", "Check In Sukses", "Anda berhasil absen masuk.");
      } else {
        await checkOut({} as any);
        showToast("success", "Check Out Sukses", "Anda berhasil absen keluar.");
      }
      setIsAttendanceModalVisible(false);
      setPhotoCaptured(false);
      setPhotoUri(null);
      setGpsCoords(null);
      setGpsAddress(null);
    } catch (error: any) {
      const message = error?.response?.data?.message || "Gagal mengirim presensi. Coba lagi.";
      showToast("error", "Presensi Gagal", message);
    } finally {
      setIsSubmittingAttendance(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* ── Page Heading ──────────────────────────────────────────── */}
        <View style={styles.heading}>
          <Text style={styles.pageTitle}>Presensi</Text>
          <Text style={styles.pageSub}>Absensi harian & pengajuan izin</Text>
        </View>

        {/* ── Live Clock Card ────────────────────────────────────────── */}
        <Card style={styles.clockCard}>
          <Text style={styles.clockDate}>{currentDate}</Text>
          <Text style={styles.clockTime}>{currentTime}</Text>
          <View style={styles.clockBadge}>
            <View style={styles.clockPulse} />
            <Text style={styles.clockLabel}>Waktu Kerja Aktif</Text>
          </View>
        </Card>

        {/* ── Attendance Action Card ─────────────────────────────────── */}
        <Card style={styles.attCard}>
          <Text style={styles.attTitle}>Presensi Hari Ini</Text>
          <Text style={styles.attDesc}>
            {hasCheckedOutToday
              ? "Presensi hari ini sudah lengkap."
              : hasCheckedIn
                ? "Anda sedang aktif bekerja. Lakukan Check Out jika jam kerja selesai."
                : "Lakukan Check In dengan selfie & GPS untuk mulai bekerja."}
          </Text>

          {!hasCheckedOutToday ? (
            <TouchableOpacity
              style={[styles.attBtn, hasCheckedIn ? styles.attBtnOut : styles.attBtnIn]}
              onPress={() => openAttendanceFlow(hasCheckedIn ? "checkout" : "checkin")}
              activeOpacity={0.85}
            >
              <Ionicons name="finger-print" size={24} color="#FFFFFF" />
              <Text style={styles.attBtnText}>
                {hasCheckedIn ? "Check Out Sekarang" : "Check In Sekarang"}
              </Text>
            </TouchableOpacity>
          ) : null}

          {todayRecords.map((record, idx) => {
            const inTime = formatTime(record.check_in);
            const outTime = formatTime(record.check_out);
            return (
              <View key={record.id} style={[styles.recordRow, idx === 0 && { borderTopWidth: 0 }]}>
                <View style={styles.recordCol}>
                  <Text style={styles.recordLabel}>Check In</Text>
                  <Text style={styles.recordVal}>{inTime}</Text>
                </View>
                <View style={styles.recordDivider} />
                <View style={styles.recordCol}>
                  <Text style={styles.recordLabel}>Check Out</Text>
                  <Text style={styles.recordVal}>{outTime || "--:--"}</Text>
                </View>
              </View>
            );
          })}
        </Card>

        {/* ── Navigation Links ──────────────────────────────────────── */}
        <TouchableOpacity style={styles.navCard} onPress={() => router.push("/attendance-history")} activeOpacity={0.7}>
          <View style={[styles.navIcon, { backgroundColor: colors.primaryLight }]}>
            <Ionicons name="time-outline" size={22} color={colors.primary} />
          </View>
          <View style={styles.navText}>
            <Text style={styles.navTitle}>Riwayat Presensi</Text>
            <Text style={styles.navDesc}>Lihat riwayat absensi harian lengkap</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.navCard} onPress={() => router.push("/leave-allocations")} activeOpacity={0.7}>
          <View style={[styles.navIcon, { backgroundColor: "#D1FAE5" }]}>
            <Ionicons name="umbrella-outline" size={22} color="#059669" />
          </View>
          <View style={styles.navText}>
            <Text style={styles.navTitle}>Alokasi Cuti</Text>
            <Text style={styles.navDesc}>Detail sisa cuti & tipe cuti tersedia</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </TouchableOpacity>

        <View style={{ height: spacing["2xl"] }} />
      </ScrollView>

      {/* ── Attendance Modal ─────────────────────────────────────────── */}
      <Modal visible={isAttendanceModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: Math.max(insets.bottom, spacing["2xl"]) }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {attendanceType === "checkin" ? "Check-In Presensi" : "Check-Out Presensi"}
              </Text>
              <TouchableOpacity onPress={() => setIsAttendanceModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Camera */}
            <View style={styles.cameraView}>
              {photoCaptured && photoUri ? (
                <View style={styles.capturedContainer}>
                  <Image source={{ uri: photoUri }} style={styles.capturedPhoto} />
                  <TouchableOpacity onPress={() => setPhotoCaptured(false)} style={styles.retakeBtn}>
                    <Ionicons name="refresh-outline" size={14} color="#FFFFFF" />
                    <Text style={styles.retakeText}>Ambil Ulang</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <CameraView style={styles.camera} facing="front" ref={cameraRef} />
                  <View style={styles.camOverlay}>
                    <TouchableOpacity style={styles.captureBtn} onPress={handleCapturePhoto}>
                      <View style={styles.captureInner} />
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>

            {/* GPS Info */}
            <View style={styles.gpsBox}>
              <View style={styles.gpsHeader}>
                <Ionicons name="location" size={18} color={gpsCoords ? colors.success : colors.amber} />
                <Text style={styles.gpsLabel}>Lokasi GPS</Text>
              </View>
              {gpsLoading ? (
                <View style={styles.gpsBody}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={styles.gpsText}>Mendeteksi lokasi…</Text>
                </View>
              ) : gpsCoords ? (
                <View style={styles.gpsBody}>
                  {gpsAddress ? <Text style={styles.gpsAddress}>{gpsAddress}</Text> : null}
                  <Text style={styles.gpsCoords}>Lat: {gpsCoords.lat}, Lng: {gpsCoords.lng}</Text>
                </View>
              ) : (
                <Text style={styles.gpsText}>GPS belum terdeteksi.</Text>
              )}
            </View>

            {/* Submit */}
            <TouchableOpacity
              style={[styles.submitBtn, isSubmittingAttendance && styles.submitBtnDisabled]}
              onPress={handleConfirmAttendance}
              disabled={isSubmittingAttendance}
              activeOpacity={0.85}
            >
              {isSubmittingAttendance ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.submitText}>Kirim Presensi</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface, paddingBottom: -30 },
  scroll: { padding: spacing["2xl"], paddingBottom: spacing["4xl"] },

  // Heading
  heading: { marginBottom: spacing["2xl"], marginTop: spacing.md },
  pageTitle: { ...textPresets.display },
  pageSub: { ...textPresets.body, marginTop: spacing.xs },

  // Clock
  clockCard: {
    alignItems: "center",
    padding: spacing["3xl"],
    marginBottom: spacing.lg,
  },
  clockDate: { ...textPresets.body, marginBottom: spacing.md },
  clockTime: {
    fontSize: rf(40),
    fontWeight: "800" as TextStyle["fontWeight"],
    color: colors.textPrimary,
    letterSpacing: 1,
    marginBottom: spacing.md,
  },
  clockBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  clockPulse: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
    backgroundColor: colors.success,
  },
  clockLabel: { ...textPresets.caption },

  // Attendance card
  attCard: {
    padding: spacing["2xl"],
    marginBottom: spacing.lg,
  },
  attTitle: { ...textPresets.cardTitle, fontSize: rf(16), marginBottom: spacing.sm },
  attDesc: { ...textPresets.body, fontSize: rf(13), marginBottom: spacing.xl, lineHeight: rf(18) },
  attBtn: {
    height: sizes.buttonMd,
    borderRadius: radius.md,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.md,
    ...shadows.elevated,
  },
  attBtnIn: { backgroundColor: colors.primary, shadowColor: colors.primary },
  attBtnOut: { backgroundColor: colors.error, shadowColor: colors.error },
  attBtnText: { color: "#FFFFFF", fontSize: rf(16), fontWeight: "700" as any },

  // Today records
  recordRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.lg,
  },
  recordCol: { flex: 1, alignItems: "center" },
  recordDivider: { width: 1, height: hpx(32), backgroundColor: colors.border, marginHorizontal: spacing.lg },
  recordLabel: { ...textPresets.label, marginBottom: spacing.xs },
  recordVal: { ...textPresets.cardTitle, fontSize: rf(16) },

  // Navigation cards
  navCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginTop: spacing.md,
    ...shadows.card,
  },
  navIcon: {
    width: sizes.iconMd,
    height: sizes.iconMd,
    borderRadius: radius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  navText: { flex: 1, marginLeft: spacing.md },
  navTitle: { ...textPresets.cardTitle },
  navDesc: { ...textPresets.body, fontSize: rf(12), marginTop: hpx(2) },

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
  cameraView: {
    height: hpx(360),
    backgroundColor: colors.textPrimary,
    borderRadius: radius.lg,
    overflow: "hidden",
    marginBottom: spacing.lg,
    position: "relative",
  },
  camera: { flex: 1, width: "100%", height: "100%" },
  camOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    paddingBottom: spacing.lg,
  },
  captureBtn: {
    width: wpx(60),
    height: hpx(60),
    borderRadius: radius.full,
    borderWidth: 4,
    borderColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
  captureInner: {
    width: sizes.iconMd,
    height: sizes.iconMd,
    borderRadius: radius.full,
    backgroundColor: "#FFFFFF",
  },
  capturedContainer: { width: "100%", height: "100%", justifyContent: "center", alignItems: "center" },
  capturedPhoto: { width: "100%", height: "100%", resizeMode: "cover" },
  retakeBtn: {
    position: "absolute",
    bottom: spacing.md,
    right: spacing.md,
    backgroundColor: "rgba(0,0,0,0.6)",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
  },
  retakeText: { color: "#FFFFFF", fontSize: rf(11), fontWeight: "700" as any },

  // GPS
  gpsBox: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xl,
  },
  gpsHeader: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  gpsLabel: { ...textPresets.cardTitle, fontSize: rf(14) },
  gpsBody: { marginTop: spacing.sm, gap: spacing.xs },
  gpsText: { ...textPresets.caption, marginTop: spacing.sm },
  gpsAddress: { ...textPresets.body, color: colors.textPrimary, fontWeight: "600" as any },
  gpsCoords: { ...textPresets.label },

  // Submit
  submitBtn: {
    height: sizes.buttonMd,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitText: { color: "#FFFFFF", fontSize: rf(16), fontWeight: "700" as any },
});
