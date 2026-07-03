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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAttendance } from "../../hooks/useAttendance";
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

  const [currentTime, setCurrentTime] = useState("");
  const [currentDate, setCurrentDate] = useState("");

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

  const [isAttendanceModalVisible, setIsAttendanceModalVisible] =
    useState(false);
  const [attendanceType, setAttendanceType] = useState<"checkin" | "checkout">(
    "checkin",
  );
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsCoords, setGpsCoords] = useState<{
    lat: string;
    lng: string;
  } | null>(null);
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
      showToast("error", "Izin Kamera", "Akses kamera diperlukan.");
      setIsAttendanceModalVisible(false);
      return;
    }
    setGpsLoading(true);
    setGpsAddress(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        showToast("error", "Izin Lokasi", "Akses GPS diperlukan.");
        setGpsLoading(false);
        setIsAttendanceModalVisible(false);
        return;
      }
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const { latitude: lat, longitude: lng } = location.coords;
      setGpsCoords({ lat: lat.toFixed(6), lng: lng.toFixed(6) });
      try {
        const reverseGeocode = await Location.reverseGeocodeAsync({
          latitude: lat,
          longitude: lng,
        });
        if (reverseGeocode?.length) {
          const a = reverseGeocode[0];
          setGpsAddress(
            [a.name, a.street, a.district, a.city || a.subregion]
              .filter(Boolean)
              .join(", ") || "Lokasi tidak dikenal",
          );
        } else setGpsAddress("Alamat tidak ditemukan");
      } catch {
        setGpsAddress("Lokasi terdeteksi");
      }
    } catch {
      showToast("error", "Error GPS", "Gagal mendapatkan koordinat.");
    } finally {
      setGpsLoading(false);
    }
  };

  const handleCapturePhoto = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.5,
          skipProcessing: true,
        });
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
      showToast(
        "error",
        "Presensi Gagal",
        error?.response?.data?.message || "Coba lagi.",
      );
    } finally {
      setIsSubmittingAttendance(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Curved Header */}
      <View style={[styles.curvedHeader]}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Presensi</Text>
          <Text style={styles.headerSub}>Absensi harian & pengajuan izin</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Floating Clock Card */}
        <View style={styles.floatingCard}>
          <Text style={styles.clockDate}>{currentDate}</Text>
          <Text style={styles.clockTime}>{currentTime}</Text>
          <View style={styles.pulseRow}>
            <View style={styles.pulseDot} />
            <Text style={styles.pulseLabel}>Waktu Kerja Aktif</Text>
          </View>
        </View>

        {/* Attendance action */}
        <View style={styles.actionCard}>
          <Text style={styles.actionTitle}>Presensi Hari Ini</Text>
          <Text style={styles.actionDesc}>
            {hasCheckedOutToday
              ? "Presensi hari ini sudah lengkap."
              : hasCheckedIn
                ? "Anda sedang aktif bekerja. Lakukan Check Out jika jam kerja selesai."
                : "Lakukan Check In dengan selfie & GPS untuk mulai bekerja."}
          </Text>
          {!hasCheckedOutToday && (
            <TouchableOpacity
              style={[
                styles.attBtn,
                hasCheckedIn ? styles.attBtnOut : styles.attBtnIn,
              ]}
              onPress={() =>
                openAttendanceFlow(hasCheckedIn ? "checkout" : "checkin")
              }
              activeOpacity={0.85}
            >
              <Ionicons name="finger-print" size={wpx(22)} color="#FFFFFF" />
              <Text style={styles.attBtnText}>
                {hasCheckedIn ? "Check Out Sekarang" : "Check In Sekarang"}
              </Text>
            </TouchableOpacity>
          )}
          {todayRecords.map((record, idx) => {
            const inTime = formatTime(record.check_in);
            const outTime = formatTime(record.check_out);
            return (
              <View
                key={record.id}
                style={[styles.recordRow, idx === 0 && { borderTopWidth: 0 }]}
              >
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
        </View>

        {/* Nav links */}
        <TouchableOpacity
          style={styles.navCard}
          onPress={() => router.push("/attendance-history")}
          activeOpacity={0.7}
        >
          <View
            style={[styles.navIcon, { backgroundColor: colors.primaryLight }]}
          >
            <Ionicons
              name="time-outline"
              size={wpx(20)}
              color={colors.primary}
            />
          </View>
          <View style={styles.navText}>
            <Text style={styles.navTitle}>Riwayat Presensi</Text>
            <Text style={styles.navDesc}>
              Lihat riwayat absensi harian lengkap
            </Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={wpx(16)}
            color={colors.textMuted}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navCard}
          onPress={() => router.push("/leave-allocations")}
          activeOpacity={0.7}
        >
          <View style={[styles.navIcon, { backgroundColor: "#D1FAE5" }]}>
            <Ionicons name="umbrella-outline" size={wpx(20)} color="#059669" />
          </View>
          <View style={styles.navText}>
            <Text style={styles.navTitle}>Alokasi Cuti</Text>
            <Text style={styles.navDesc}>
              Detail sisa cuti & tipe cuti tersedia
            </Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={wpx(16)}
            color={colors.textMuted}
          />
        </TouchableOpacity>

        <View style={{ height: hpx(24) }} />
      </ScrollView>

      {/* ── Attendance Modal ── */}
      <Modal
        visible={isAttendanceModalVisible}
        animationType="slide"
        transparent
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { paddingBottom: Math.max(insets.bottom, spacing["2xl"]) },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {attendanceType === "checkin"
                  ? "Check-In Presensi"
                  : "Check-Out Presensi"}
              </Text>
              <TouchableOpacity
                onPress={() => setIsAttendanceModalVisible(false)}
              >
                <Ionicons
                  name="close"
                  size={wpx(22)}
                  color={colors.textPrimary}
                />
              </TouchableOpacity>
            </View>
            <View style={styles.cameraView}>
              {photoCaptured && photoUri ? (
                <View style={styles.capturedContainer}>
                  <Image
                    source={{ uri: photoUri }}
                    style={styles.capturedPhoto}
                  />
                  <TouchableOpacity
                    onPress={() => setPhotoCaptured(false)}
                    style={styles.retakeBtn}
                  >
                    <Ionicons
                      name="refresh-outline"
                      size={12}
                      color="#FFFFFF"
                    />
                    <Text style={styles.retakeText}>Ambil Ulang</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <CameraView
                    style={styles.camera}
                    facing="front"
                    ref={cameraRef}
                  />
                  <View style={styles.cameraOverlay}>
                    <TouchableOpacity
                      style={styles.captureBtn}
                      onPress={handleCapturePhoto}
                    >
                      <View style={styles.captureInner} />
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
            <View style={styles.gpsBox}>
              <View style={styles.gpsRow}>
                <Ionicons
                  name="location"
                  size={16}
                  color={gpsCoords ? colors.success : colors.amber}
                />
                <Text style={styles.gpsLabel}>Lokasi GPS</Text>
              </View>
              {gpsLoading ? (
                <View style={styles.gpsBody}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={styles.gpsHint}>Mendeteksi lokasi…</Text>
                </View>
              ) : gpsCoords ? (
                <View style={styles.gpsBody}>
                  {gpsAddress ? (
                    <Text style={styles.gpsAddress}>{gpsAddress}</Text>
                  ) : null}
                  <Text style={styles.gpsCoords}>
                    Lat: {gpsCoords.lat}, Lng: {gpsCoords.lng}
                  </Text>
                </View>
              ) : (
                <Text style={styles.gpsHint}>GPS belum terdeteksi.</Text>
              )}
            </View>
            <TouchableOpacity
              style={[
                styles.submitBtn,
                isSubmittingAttendance && { opacity: 0.6 },
              ]}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },

  // Curved Header
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

  // Floating Clock Card
  floatingCard: {
    marginTop: -hpx(36),
    backgroundColor: colors.card,
    borderRadius: wpx(20),
    padding: spacing["2xl"],
    alignItems: "center",
    ...shadows.elevated,
    marginBottom: hpx(16),
    zIndex: 10,
  },
  clockDate: {
    fontSize: rf(13),
    fontWeight: "500" as any,
    color: colors.textSecondary,
    marginBottom: hpx(8),
  },
  clockTime: {
    fontSize: rf(40),
    fontWeight: "800" as TextStyle["fontWeight"],
    color: colors.textPrimary,
    letterSpacing: wpx(1),
    marginBottom: hpx(8),
  },
  pulseRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  pulseDot: {
    width: wpx(8),
    height: wpx(8),
    borderRadius: radius.full,
    backgroundColor: colors.success,
  },
  pulseLabel: { ...textPresets.caption },

  // Action Card
  actionCard: {
    backgroundColor: colors.card,
    borderRadius: wpx(16),
    padding: spacing["2xl"],
    marginBottom: hpx(16),
    ...shadows.card,
  },
  actionTitle: {
    fontSize: rf(16),
    fontWeight: "700" as any,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  actionDesc: {
    fontSize: rf(13),
    color: colors.textSecondary,
    lineHeight: rf(18),
    marginBottom: spacing.xl,
  },
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
  attBtnText: { color: "#FFFFFF", fontSize: rf(15), fontWeight: "700" as any },

  // Records
  recordRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.lg,
  },
  recordCol: { flex: 1, alignItems: "center" },
  recordDivider: {
    width: 1,
    height: hpx(32),
    backgroundColor: colors.border,
    marginHorizontal: spacing.lg,
  },
  recordLabel: { ...textPresets.label, marginBottom: spacing.xs },
  recordVal: { ...textPresets.cardTitle, fontSize: rf(16) },

  // Nav Cards
  navCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: hpx(12),
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
  cameraOverlay: {
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
  capturedContainer: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
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
  gpsBox: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xl,
  },
  gpsRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  gpsLabel: { ...textPresets.cardTitle, fontSize: rf(14) },
  gpsBody: { marginTop: spacing.sm, gap: spacing.xs },
  gpsHint: { ...textPresets.caption, marginTop: spacing.sm },
  gpsAddress: {
    ...textPresets.body,
    color: colors.textPrimary,
    fontWeight: "600" as any,
  },
  gpsCoords: { ...textPresets.label },
  submitBtn: {
    height: sizes.buttonMd,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  submitText: { color: "#FFFFFF", fontSize: rf(16), fontWeight: "700" as any },
});
