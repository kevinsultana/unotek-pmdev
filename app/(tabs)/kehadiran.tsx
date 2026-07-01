import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Location from "expo-location";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

interface LeaveAllocation {
  type: string;
  allocated: number;
  used: number;
  remaining: number;
}

export default function KehadiranScreen() {
  const insets = useSafeAreaInsets();
  // Clock states
  const [currentTime, setCurrentTime] = useState("");
  const [currentDate, setCurrentDate] = useState("");

  // Camera & GPS permissions & refs
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  // Attendance simulation states
  const [hasCheckedIn, setHasCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState("");
  const [checkOutTime, setCheckOutTime] = useState("");

  // Camera & GPS simulation modals
  const [isAttendanceModalVisible, setIsAttendanceModalVisible] = useState(false);
  const [attendanceType, setAttendanceType] = useState<"checkin" | "checkout">("checkin");
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsCoords, setGpsCoords] = useState<{ lat: string; lng: string } | null>(null);
  const [gpsAddress, setGpsAddress] = useState<string | null>(null);
  const [photoCaptured, setPhotoCaptured] = useState(false);
  const [isSubmittingAttendance, setIsSubmittingAttendance] = useState(false);

  // Leave / Cuti states
  const [isLeaveModalVisible, setIsLeaveModalVisible] = useState(false);
  const [leaveType, setLeaveType] = useState("Cuti Tahunan");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [isSubmittingLeave, setIsSubmittingLeave] = useState(false);

  // Mock time-off allocations (GET Time-Off Allocation API)
  const allocations: LeaveAllocation[] = [
    { type: "Cuti Tahunan", allocated: 15, used: 3, remaining: 12 },
    { type: "Sakit", allocated: 10, used: 2, remaining: 8 },
    { type: "Izin Khusus", allocated: 5, used: 1, remaining: 4 },
  ];

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
      );
      setCurrentDate(
        now.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
      );
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Handle opening Checkin/Checkout modal
  const openAttendanceFlow = async (type: "checkin" | "checkout") => {
    setAttendanceType(type);
    setIsAttendanceModalVisible(true);
    setPhotoCaptured(false);
    setPhotoUri(null);
    setGpsCoords(null);

    // Request Camera Permission
    const cameraPermissionResult = await requestCameraPermission();
    if (!cameraPermissionResult.granted) {
      Alert.alert("Izin Kamera Diperlukan", "Aplikasi membutuhkan akses kamera untuk melakukan foto selfie presensi.");
      setIsAttendanceModalVisible(false);
      return;
    }

    // Request Location Permission & Get Location
    setGpsLoading(true);
    setGpsAddress(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Izin Lokasi Diperlukan", "Aplikasi membutuhkan akses GPS untuk memvalidasi lokasi Anda.");
        setGpsLoading(false);
        setIsAttendanceModalVisible(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const lat = location.coords.latitude;
      const lng = location.coords.longitude;

      setGpsCoords({
        lat: lat.toFixed(6),
        lng: lng.toFixed(6),
      });

      // Get address name (reverse geocode)
      try {
        const reverseGeocode = await Location.reverseGeocodeAsync({
          latitude: lat,
          longitude: lng,
        });

        if (reverseGeocode && reverseGeocode.length > 0) {
          const addressObj = reverseGeocode[0];
          const name = addressObj.name ? `${addressObj.name}, ` : "";
          const street = addressObj.street ? `${addressObj.street}, ` : "";
          const district = addressObj.district ? `${addressObj.district}, ` : "";
          const city = addressObj.city || addressObj.subregion || "";
          const niceAddress = `${name}${street}${district}${city}`.trim().replace(/,\s*$/, "");
          setGpsAddress(niceAddress || "Lokasi tidak dikenal");
        } else {
          setGpsAddress("Alamat tidak ditemukan");
        }
      } catch (geocodeError) {
        console.log(geocodeError);
        setGpsAddress("Alamat terdeteksi");
      }
    } catch (error) {
      console.log(error);
      Alert.alert("Error GPS", "Gagal mendapatkan koordinat lokasi GPS Anda.");
    } finally {
      setGpsLoading(false);
    }
  };

  // Simulate taking a photo (POST Checkin/Checkout dependency)
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
      } catch (error) {
        console.log(error);
        Alert.alert("Error Kamera", "Gagal menangkap gambar dari kamera.");
      }
    }
  };

  // Handle final submission (POST Checkin / POST Checkout API mockup)
  const handleConfirmAttendance = () => {
    if (!photoCaptured) {
      Alert.alert("Foto Diperlukan", "Harap ambil foto wajah Anda terlebih dahulu.");
      return;
    }
    if (gpsLoading || !gpsCoords) {
      Alert.alert("GPS Belum Terdeteksi", "Sedang mencari koordinat lokasi presisi...");
      return;
    }

    setIsSubmittingAttendance(true);
    setTimeout(() => {
      setIsSubmittingAttendance(false);
      setIsAttendanceModalVisible(false);
      const now = new Date();
      const timeStr = now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

      if (attendanceType === "checkin") {
        setHasCheckedIn(true);
        setCheckInTime(timeStr);
        Alert.alert("Check In Sukses", `Anda berhasil absen masuk pada jam ${timeStr}`);
      } else {
        setHasCheckedIn(false);
        setCheckOutTime(timeStr);
        Alert.alert("Check Out Sukses", `Anda berhasil absen keluar pada jam ${timeStr}`);
      }
    }, 1500);
  };

  // Submit Leave (POST Leave API mockup)
  const handleRequestLeave = () => {
    if (!startDate || !endDate || !reason) {
      Alert.alert("Form Belum Lengkap", "Silakan isi semua kolom tanggal dan alasan cuti.");
      return;
    }

    setIsSubmittingLeave(true);
    setTimeout(() => {
      setIsSubmittingLeave(false);
      setIsLeaveModalVisible(false);
      Alert.alert("Pengajuan Berhasil", "Pengajuan cuti/izin Anda telah dikirim dan menunggu persetujuan HRD.");
      setStartDate("");
      setEndDate("");
      setReason("");
    }, 1500);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Header Title */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Presensi & Cuti</Text>
          <Text style={styles.sectionSubtitle}>Kelola absensi harian dan pengajuan izin</Text>
        </View>

        {/* Live Date/Time Card */}
        <View style={styles.timeCard}>
          <Text style={styles.dateText}>{currentDate}</Text>
          <Text style={styles.timeText}>{currentTime}</Text>
          <Text style={styles.timeLabel}>Waktu Kerja Aktif</Text>
        </View>

        {/* Dynamic Attendance Action Card */}
        <View style={styles.attendanceCard}>
          <Text style={styles.cardHeading}>Presensi Hari Ini</Text>
          <Text style={styles.cardDesc}>
            {hasCheckedIn
              ? "Anda sedang aktif bekerja. Lakukan Check Out jika jam kerja sudah selesai."
              : "Silakan lakukan Check In menggunakan kamera selfie & GPS untuk mulai bekerja."}
          </Text>

          <TouchableOpacity
            style={[styles.actionBtn, hasCheckedIn ? styles.checkoutBtn : styles.checkinBtn]}
            onPress={() => openAttendanceFlow(hasCheckedIn ? "checkout" : "checkin")}
          >
            <Ionicons name="finger-print" size={28} color="#FFFFFF" />
            <Text style={styles.actionBtnText}>
              {hasCheckedIn ? "Check Out Sekarang" : "Check In Sekarang"}
            </Text>
          </TouchableOpacity>

          {checkInTime ? (
            <View style={styles.historyRow}>
              <View style={styles.historyCol}>
                <Text style={styles.historyLabel}>Check In</Text>
                <Text style={styles.historyVal}>{checkInTime}</Text>
              </View>
              <View style={styles.historyCol}>
                <Text style={styles.historyLabel}>Check Out</Text>
                <Text style={styles.historyVal}>{checkOutTime || "--:--"}</Text>
              </View>
            </View>
          ) : null}
        </View>

        {/* Time-Off Allocation Header */}
        <View style={styles.rowBetween}>
          <Text style={styles.subHeading}>Alokasi Cuti (Time-Off)</Text>
          <TouchableOpacity style={styles.requestBtn} onPress={() => setIsLeaveModalVisible(true)}>
            <Text style={styles.requestBtnText}>Ajukan Cuti / Izin</Text>
          </TouchableOpacity>
        </View>

        {/* List of allocations */}
        <View style={styles.allocationsContainer}>
          {allocations.map((alloc) => (
            <View key={alloc.type} style={styles.allocCard}>
              <View style={styles.allocInfo}>
                <Text style={styles.allocType}>{alloc.type}</Text>
                <Text style={styles.allocDetail}>Terpakai: {alloc.used} hari</Text>
              </View>
              <View style={styles.allocValueWrapper}>
                <Text style={styles.allocValue}>{alloc.remaining}</Text>
                <Text style={styles.allocSubVal}>/{alloc.allocated} hari</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* ==================== ATTENDANCE MODAL (CAMERA + GPS) ==================== */}
      <Modal visible={isAttendanceModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: Math.max(insets.bottom, 24) }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {attendanceType === "checkin" ? "Check-In Presensi" : "Check-Out Presensi"}
              </Text>
              <TouchableOpacity onPress={() => setIsAttendanceModalVisible(false)}>
                <Ionicons name="close" size={24} color="#1F2937" />
              </TouchableOpacity>
            </View>

            {/* Real Camera Viewfinder */}
            <View style={styles.cameraViewfinder}>
              {photoCaptured && photoUri ? (
                <View style={styles.capturedContainer}>
                  <Image source={{ uri: photoUri }} style={styles.capturedPhoto} />
                  <TouchableOpacity onPress={() => setPhotoCaptured(false)} style={styles.retakeBtn}>
                    <Ionicons name="refresh-outline" size={16} color="#FFFFFF" style={{ marginRight: 4 }} />
                    <Text style={styles.retakeBtnText}>Ambil Ulang</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <CameraView style={styles.camera} facing="front" ref={cameraRef} />
                  <View style={styles.cameraOverlay}>
                    <TouchableOpacity style={styles.captureTriggerCircle} onPress={handleCapturePhoto}>
                      <View style={styles.captureInnerCircle} />
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>

            {/* GPS Location Tracker Info */}
            <View style={styles.gpsContainer}>
              <View style={styles.row}>
                <Ionicons name="location" size={20} color={gpsCoords ? "#10B981" : "#FFB020"} />
                <Text style={styles.gpsLabel}>Deteksi Koordinat GPS (Lokasi)</Text>
              </View>

              {gpsLoading ? (
                <View style={styles.gpsLoadingRow}>
                  <ActivityIndicator size="small" color="#2E5BFF" />
                  <Text style={styles.gpsText}>Mencari lokasi presisi...</Text>
                </View>
              ) : gpsCoords ? (
                <View style={styles.gpsSuccessRow}>
                  {gpsAddress ? (
                    <Text style={styles.gpsAddressText}>{gpsAddress}</Text>
                  ) : null}
                  <Text style={styles.gpsCoordsText}>
                    Lat: {gpsCoords.lat}, Lng: {gpsCoords.lng}
                  </Text>
                  <Text style={styles.gpsAccuracy}>Akurasi: 6 meter (Lokasi Terdeteksi)</Text>
                </View>
              ) : (
                <Text style={styles.gpsText}>GPS belum terdeteksi.</Text>
              )}
            </View>

            {/* Action Buttons */}
            <TouchableOpacity
              style={[styles.confirmBtn, isSubmittingAttendance ? styles.disabledBtn : null]}
              onPress={handleConfirmAttendance}
              disabled={isSubmittingAttendance}
            >
              {isSubmittingAttendance ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.confirmBtnText}>Kirim Presensi Sekarang</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ==================== LEAVE/CUTI REQUEST FORM MODAL ==================== */}
      <Modal visible={isLeaveModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: Math.max(insets.bottom, 24) }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pengajuan Cuti / Izin (POST Leave)</Text>
              <TouchableOpacity onPress={() => setIsLeaveModalVisible(false)}>
                <Ionicons name="close" size={24} color="#1F2937" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 400 }}>
              {/* Type Select */}
              <Text style={styles.fieldLabel}>Tipe Pengajuan</Text>
              <View style={styles.typeRow}>
                {["Cuti Tahunan", "Sakit", "Izin Khusus"].map((type) => {
                  const isSel = leaveType === type;
                  return (
                    <TouchableOpacity
                      key={type}
                      style={[styles.typeSelectBtn, isSel ? styles.typeSelectActive : null]}
                      onPress={() => setLeaveType(type)}
                    >
                      <Text style={[styles.typeSelectText, isSel ? styles.typeSelectActiveText : null]}>
                        {type}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Start Date */}
              <Text style={styles.fieldLabel}>Tanggal Mulai</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Contoh: 12 Juli 2026"
                placeholderTextColor="#A9B5C9"
                value={startDate}
                onChangeText={setStartDate}
              />

              {/* End Date */}
              <Text style={styles.fieldLabel}>Tanggal Selesai</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Contoh: 14 Juli 2026"
                placeholderTextColor="#A9B5C9"
                value={endDate}
                onChangeText={setEndDate}
              />

              {/* Reason Description */}
              <Text style={styles.fieldLabel}>Alasan / Keterangan</Text>
              <TextInput
                style={[styles.formInput, { height: 80, textAlignVertical: "top" }]}
                placeholder="Tuliskan keterangan detail pengajuan Anda..."
                placeholderTextColor="#A9B5C9"
                multiline
                numberOfLines={3}
                value={reason}
                onChangeText={setReason}
              />
            </ScrollView>

            {/* Action Buttons */}
            <TouchableOpacity
              style={[styles.confirmBtn, isSubmittingLeave ? styles.disabledBtn : null]}
              onPress={handleRequestLeave}
              disabled={isSubmittingLeave}
            >
              {isSubmittingLeave ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.confirmBtnText}>Kirim Form Pengajuan</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#eeeeefff",
    paddingBottom: -30,
  },
  scrollContainer: {
    padding: 24,
    paddingBottom: 20,
  },
  sectionHeader: {
    marginBottom: 20,
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1F2937",
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 4,
  },
  timeCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 2,
  },
  dateText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4B5563",
    marginBottom: 8,
  },
  timeText: {
    fontSize: 36,
    fontWeight: "800",
    color: "#1F2937",
    letterSpacing: 1,
  },
  timeLabel: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 4,
  },
  attendanceCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    marginBottom: 28,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 2,
  },
  cardHeading: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1F2937",
  },
  cardDesc: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 6,
    marginBottom: 20,
    lineHeight: 18,
  },
  actionBtn: {
    height: 56,
    borderRadius: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  checkinBtn: {
    backgroundColor: "#2E5BFF",
    shadowColor: "#2E5BFF",
  },
  checkoutBtn: {
    backgroundColor: "#EF4444",
    shadowColor: "#EF4444",
  },
  actionBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    marginLeft: 12,
  },
  historyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    paddingTop: 16,
  },
  historyCol: {
    alignItems: "center",
    width: "48%",
  },
  historyLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#9CA3AF",
    marginBottom: 4,
  },
  historyVal: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  subHeading: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
  },
  requestBtn: {
    backgroundColor: "#E0E7FF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  requestBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#2E5BFF",
  },
  allocationsContainer: {
    marginTop: 4,
  },
  allocCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
  allocInfo: {
    flex: 1,
  },
  allocType: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1F2937",
  },
  allocDetail: {
    fontSize: 11,
    color: "#9CA3AF",
    marginTop: 2,
  },
  allocValueWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  allocValue: {
    fontSize: 20,
    fontWeight: "800",
    color: "#2E5BFF",
  },
  allocSubVal: {
    fontSize: 12,
    color: "#9CA3AF",
    marginBottom: 2,
    marginLeft: 2,
    fontWeight: "600",
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1F2937",
  },
  cameraViewfinder: {
    height: 380,
    backgroundColor: "#1F2937",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    overflow: "hidden",
  },
  captureTrigger: {
    alignItems: "center",
  },
  captureTriggerText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 10,
  },
  camera: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  cameraOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "flex-end",
    alignItems: "center",
    paddingBottom: 16,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
  },
  captureTriggerCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 4,
    borderColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
  captureInnerCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
  },
  capturedContainer: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  capturedPhoto: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  retakeBtn: {
    position: "absolute",
    bottom: 12,
    right: 12,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  retakeBtnText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
  gpsContainer: {
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    marginBottom: 24,
  },
  gpsLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#4B5563",
    marginLeft: 8,
  },
  gpsText: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 8,
  },
  gpsLoadingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  gpsSuccessRow: {
    marginTop: 8,
  },
  gpsAddressText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 4,
  },
  gpsCoordsText: {
    fontSize: 11,
    color: "#6B7280",
    fontWeight: "500",
  },
  gpsAccuracy: {
    fontSize: 11,
    color: "#10B981",
    fontWeight: "600",
    marginTop: 4,
  },
  confirmBtn: {
    height: 52,
    backgroundColor: "#2E5BFF",
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  confirmBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  disabledBtn: {
    backgroundColor: "#93ACFF",
  },

  // Form styles
  fieldLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#4B5563",
    marginBottom: 8,
    marginTop: 12,
  },
  typeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  typeSelectBtn: {
    width: "31%",
    paddingVertical: 10,
    backgroundColor: "#F3F4F6",
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  typeSelectActive: {
    backgroundColor: "#2E5BFF",
    borderColor: "#2E5BFF",
  },
  typeSelectText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#4B5563",
  },
  typeSelectActiveText: {
    color: "#FFFFFF",
  },
  formInput: {
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    backgroundColor: "#F9FAFB",
    paddingHorizontal: 16,
    height: 48,
    color: "#1F2937",
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
});
