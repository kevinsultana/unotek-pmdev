import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { maintenanceService } from "../services/maintenanceService";
import {
  colors,
  hpx,
  radius,
  rf,
  shadows,
  sizes,
  spacing,
  wpx,
} from "../src/constants/theme";
import type { MaintenanceRequest } from "../types/maintenance";
import { showToast } from "../utils/toast";

const URGENCY_LEVELS = [
  { value: "low", label: "Low", c: "#059669", b: "#D1FAE5" },
  { value: "medium", label: "Medium", c: "#D97706", b: "#FEF3C7" },
  { value: "high", label: "High", c: "#E11D48", b: "#FFE4E6" },
  { value: "critical", label: "Critical", c: "#DC2626", b: "#FEE2E2" },
] as const;

const CATEGORIES = [
  { value: "hardware", label: "Hardware", icon: "laptop-outline" },
  { value: "software", label: "Software", icon: "code-working-outline" },
  { value: "facility", label: "Fasilitas", icon: "business-outline" },
  { value: "other", label: "Lainnya", icon: "help-circle-outline" },
] as const;

export default function MaintenanceFormScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const requestId = params.id ? Number(params.id) : null;

  // Form Fields State
  const [assetName, setAssetName] = useState("");
  const [assetCode, setAssetCode] = useState("");
  const [category, setCategory] = useState<MaintenanceRequest["category"]>("hardware");
  const [urgency, setUrgency] = useState<MaintenanceRequest["urgency"]>("low");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<string[]>([]);

  // General States
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showImageSourcePicker, setShowImageSourcePicker] = useState(false);
  const [activePreviewUri, setActivePreviewUri] = useState<string | null>(null);

  // Load existing data if editing
  useEffect(() => {
    if (requestId) {
      const loadRequestData = async () => {
        setIsLoading(true);
        try {
          const req = await maintenanceService.getById(requestId);
          if (req) {
            // Can only edit draft requests
            if (req.state !== "draft") {
              showToast("error", "Akses Ditolak", "Hanya pengajuan dengan status Draft yang dapat diubah.");
              router.back();
              return;
            }
            setAssetName(req.asset_name);
            setAssetCode(req.asset_code);
            setCategory(req.category);
            setUrgency(req.urgency);
            setTitle(req.title);
            setDescription(req.description);
            setImages(req.images || []);
          } else {
            showToast("error", "Error", "Pengajuan tidak ditemukan.");
            router.back();
          }
        } catch (err: any) {
          showToast("error", "Error", err?.message || "Gagal memuat data.");
        } finally {
          setIsLoading(false);
        }
      };
      loadRequestData();
    }
  }, [requestId, router]);

  // Image Picking Helpers
  const handlePickFromCamera = async () => {
    setShowImageSourcePicker(false);
    if (images.length >= 5) {
      showToast("error", "Validasi", "Maksimal 5 foto bukti kerusakan.");
      return;
    }
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      showToast("error", "Izin Kamera", "Aplikasi membutuhkan akses kamera.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      setImages((prev) => [...prev, result.assets[0].uri]);
    }
  };

  const handlePickFromGallery = async () => {
    setShowImageSourcePicker(false);
    const maxRemaining = 5 - images.length;
    if (maxRemaining <= 0) {
      showToast("error", "Validasi", "Maksimal 5 foto bukti kerusakan.");
      return;
    }
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showToast("error", "Izin Galeri", "Aplikasi membutuhkan akses galeri.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      selectionLimit: maxRemaining,
      quality: 0.8,
    });
    if (!result.canceled && result.assets) {
      const selectedUris = result.assets.map((asset) => asset.uri);
      setImages((prev) => [...prev, ...selectedUris].slice(0, 5));
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Submit Operations
  const handleSave = async (submitDirectly: boolean) => {
    if (!assetName.trim() || !assetCode.trim() || !title.trim() || !description.trim()) {
      showToast("error", "Validasi", "Harap isi semua kolom form yang diwajibkan.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: Omit<MaintenanceRequest, "id" | "date" | "notes"> = {
        asset_name: assetName.trim(),
        asset_code: assetCode.trim(),
        category,
        urgency,
        title: title.trim(),
        description: description.trim(),
        images,
        state: submitDirectly ? "submitted" : "draft",
      };

      if (requestId) {
        await maintenanceService.update(requestId, payload);
        showToast(
          "success",
          "Berhasil",
          submitDirectly
            ? "Pengajuan maintenance berhasil dikirim."
            : "Draft pengajuan berhasil diperbarui."
        );
      } else {
        await maintenanceService.create(payload);
        showToast(
          "success",
          "Berhasil",
          submitDirectly
            ? "Pengajuan maintenance berhasil dikirim."
            : "Draft pengajuan berhasil disimpan."
        );
      }
      router.back();
    } catch (err: any) {
      showToast("error", "Gagal", err?.message || "Gagal menyimpan pengajuan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <Stack.Screen options={{ headerShown: false }} />

      {/* Curved Header */}
      <View style={[styles.curvedHeader, { paddingTop: insets.top }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={wpx(22)} color="#FFFFFF" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>
            {requestId ? "Edit Pengajuan" : "Buat Pengajuan Baru"}
          </Text>

          <View style={styles.headerRightPlaceholder} />
        </View>
      </View>

      {/* Loading Overlay */}
      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Memuat data...</Text>
        </View>
      ) : (
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={[styles.formScroll, { paddingBottom: insets.bottom + spacing.xl }]}
            showsVerticalScrollIndicator={false}
          >
            {/* 1. Category Selector */}
            <Text style={styles.label}>Kategori Masalah <Text style={styles.required}>*</Text></Text>
            <View style={styles.categoryGrid}>
              {CATEGORIES.map((cat) => {
                const isSelected = category === cat.value;
                return (
                  <TouchableOpacity
                    key={cat.value}
                    style={[
                      styles.categoryCard,
                      isSelected && styles.categoryCardSelected,
                    ]}
                    onPress={() => setCategory(cat.value)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={cat.icon as any}
                      size={20}
                      color={isSelected ? colors.primary : colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.categoryCardText,
                        isSelected && styles.categoryCardTextSelected,
                      ]}
                    >
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* 2. Asset Name */}
            <Text style={styles.label}>Nama Aset Kantor <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={styles.input}
              placeholder="Contoh: Laptop Asus ROG / Kursi Kerja"
              placeholderTextColor={colors.textMuted}
              value={assetName}
              onChangeText={setAssetName}
            />

            {/* 3. Asset Code */}
            <Text style={styles.label}>Kode Inventaris / Serial Number <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={styles.input}
              placeholder="Contoh: AST-UNOTEK-009 / SN-8927498"
              placeholderTextColor={colors.textMuted}
              value={assetCode}
              onChangeText={setAssetCode}
            />

            {/* 4. Urgency Segmented Control */}
            <Text style={styles.label}>Tingkat Urgensi <Text style={styles.required}>*</Text></Text>
            <View style={styles.urgencyGrid}>
              {URGENCY_LEVELS.map((level) => {
                const isSelected = urgency === level.value;
                return (
                  <TouchableOpacity
                    key={level.value}
                    style={[
                      styles.urgencyBtn,
                      { borderColor: level.c },
                      isSelected && { backgroundColor: level.b },
                    ]}
                    onPress={() => setUrgency(level.value)}
                    activeOpacity={0.75}
                  >
                    <Text
                      style={[
                        styles.urgencyText,
                        { color: level.c },
                        isSelected && { fontWeight: "700" as any },
                      ]}
                    >
                      {level.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* 5. Title */}
            <Text style={styles.label}>Judul Pengajuan / Masalah <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={styles.input}
              placeholder="Contoh: Layar monitor berkedip merah"
              placeholderTextColor={colors.textMuted}
              value={title}
              onChangeText={setTitle}
            />

            {/* 6. Description */}
            <Text style={styles.label}>Detail Masalah <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              multiline
              numberOfLines={4}
              placeholder="Jelaskan secara rinci kerusakan atau masalah yang terjadi pada aset kantor..."
              placeholderTextColor={colors.textMuted}
              value={description}
              onChangeText={setDescription}
            />

            {/* 7. Image Pickers */}
            <View style={styles.photoSectionHeader}>
              <Text style={styles.label}>Foto Bukti Kerusakan ({images.length}/5)</Text>
              {images.length < 5 && (
                <TouchableOpacity
                  onPress={() => setShowImageSourcePicker(true)}
                  style={styles.addPhotoTextBtn}
                >
                  <Ionicons name="camera" size={16} color={colors.primary} />
                  <Text style={styles.addPhotoText}>Tambah Foto</Text>
                </TouchableOpacity>
              )}
            </View>

            {images.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.photoList}
              >
                {images.map((imgUri, index) => (
                  <View key={index} style={styles.photoContainer}>
                    <TouchableOpacity
                      activeOpacity={0.9}
                      onPress={() => setActivePreviewUri(imgUri)}
                    >
                      <Image source={{ uri: imgUri }} style={styles.photoThumb} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.photoRemoveBtn}
                      activeOpacity={0.7}
                      onPress={() => handleRemoveImage(index)}
                    >
                      <Ionicons name="close" size={14} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            ) : (
              <TouchableOpacity
                style={styles.photoPlaceholder}
                onPress={() => setShowImageSourcePicker(true)}
                activeOpacity={0.6}
              >
                <Ionicons name="images-outline" size={32} color={colors.textMuted} />
                <Text style={styles.photoPlaceholderText}>
                  Belum ada foto bukti kerusakan yang dilampirkan.
                </Text>
                <Text style={styles.photoPlaceholderSub}>
                  Ketuk untuk mengambil foto atau pilih dari galeri.
                </Text>
              </TouchableOpacity>
            )}

            {/* Action Buttons */}
            <View style={styles.actionButtonsContainer}>
              <TouchableOpacity
                style={[styles.btnOutline, isSubmitting && { opacity: 0.6 }]}
                disabled={isSubmitting}
                onPress={() => handleSave(false)}
                activeOpacity={0.7}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <>
                    <Ionicons name="save-outline" size={16} color={colors.primary} style={{ marginRight: 6 }} />
                    <Text style={[styles.btnText, { color: colors.primary }]}>Simpan Draft</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.btnSolid, isSubmitting && { opacity: 0.6 }]}
                disabled={isSubmitting}
                onPress={() => handleSave(true)}
                activeOpacity={0.8}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="paper-plane" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={[styles.btnText, { color: "#FFFFFF" }]}>Kirim Pengajuan</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      )}

      {/* Image Source Selection Modal */}
      <Modal
        visible={showImageSourcePicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowImageSourcePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setShowImageSourcePicker(false)}
          />
          <View style={styles.sourceSelectContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pilih Sumber Foto</Text>
              <TouchableOpacity onPress={() => setShowImageSourcePicker(false)}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.sourceBtnRow}>
              <TouchableOpacity
                style={styles.sourceBtn}
                onPress={handlePickFromCamera}
                activeOpacity={0.7}
              >
                <View style={[styles.sourceIconBg, { backgroundColor: "#DBEAFE" }]}>
                  <Ionicons name="camera" size={24} color="#1E40AF" />
                </View>
                <Text style={styles.sourceLabel}>Kamera</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.sourceBtn}
                onPress={handlePickFromGallery}
                activeOpacity={0.7}
              >
                <View style={[styles.sourceIconBg, { backgroundColor: "#EDE9FE" }]}>
                  <Ionicons name="images" size={24} color="#7C3AED" />
                </View>
                <Text style={styles.sourceLabel}>Galeri</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Image Preview Modal */}
      <Modal
        visible={activePreviewUri !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setActivePreviewUri(null)}
      >
        <View style={styles.imageOverlayContainer}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setActivePreviewUri(null)}
          />
          <TouchableOpacity
            style={styles.closePreviewBtn}
            onPress={() => setActivePreviewUri(null)}
          >
            <Ionicons name="close" size={32} color="#FFFFFF" />
          </TouchableOpacity>
          {activePreviewUri && (
            <Image
              source={{ uri: activePreviewUri }}
              style={styles.fullScreenImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  curvedHeader: {
    height: hpx(110),
    backgroundColor: colors.primary,
    borderBottomLeftRadius: wpx(25),
    borderBottomRightRadius: wpx(25),
    justifyContent: "flex-end",
    paddingBottom: hpx(16),
    zIndex: 1,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing["2xl"],
  },
  backBtn: {
    width: sizes.headerBtnWidth,
    height: sizes.headerBtn,
    borderRadius: radius.full,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: rf(17),
    fontWeight: "800" as any,
    color: "#FFFFFF",
  },
  headerRightPlaceholder: {
    width: sizes.headerBtnWidth,
  },

  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: spacing.sm,
    fontSize: rf(13),
    color: colors.textSecondary,
  },

  // Form styles
  formScroll: {
    paddingHorizontal: spacing["2xl"],
    paddingTop: spacing.xl,
  },
  label: {
    fontSize: rf(13),
    fontWeight: "700" as any,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    marginTop: spacing.md,
  },
  required: {
    color: colors.error,
  },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1.2,
    borderColor: colors.border,
    borderRadius: radius.md,
    height: sizes.buttonMd,
    paddingHorizontal: spacing.md,
    fontSize: rf(13),
    color: colors.textPrimary,
  },
  textArea: {
    height: hpx(100),
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    textAlignVertical: "top",
  },

  // Category selection cards
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  categoryCard: {
    flex: 1,
    minWidth: "45%",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderWidth: 1.2,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: hpx(12),
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  categoryCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  categoryCardText: {
    fontSize: rf(13),
    fontWeight: "600" as any,
    color: colors.textSecondary,
  },
  categoryCardTextSelected: {
    color: colors.primary,
    fontWeight: "700" as any,
  },

  // Urgency horizontal grid
  urgencyGrid: {
    flexDirection: "row",
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  urgencyBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderRadius: radius.md,
    paddingVertical: hpx(10),
    backgroundColor: colors.card,
  },
  urgencyText: {
    fontSize: rf(12),
    fontWeight: "600" as any,
  },

  // Photos Styles
  photoSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  addPhotoTextBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  addPhotoText: {
    fontSize: rf(13),
    fontWeight: "700" as any,
    color: colors.primary,
  },
  photoList: {
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  photoContainer: {
    position: "relative",
  },
  photoThumb: {
    width: wpx(80),
    height: wpx(80),
    borderRadius: radius.md,
    backgroundColor: colors.border,
  },
  photoRemoveBtn: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "rgba(15, 23, 42, 0.7)",
    width: wpx(20),
    height: wpx(20),
    borderRadius: radius.full,
    justifyContent: "center",
    alignItems: "center",
  },
  photoPlaceholder: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: "dashed",
    borderRadius: radius.md,
    backgroundColor: colors.card,
    paddingVertical: hpx(24),
    paddingHorizontal: spacing.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  photoPlaceholderText: {
    fontSize: rf(12),
    color: colors.textSecondary,
    fontWeight: "600" as any,
    textAlign: "center",
    marginTop: spacing.xs,
  },
  photoPlaceholderSub: {
    fontSize: rf(11),
    color: colors.textMuted,
    textAlign: "center",
    marginTop: hpx(2),
  },

  // Footer Actions
  actionButtonsContainer: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.xl,
    marginBottom: spacing["2xl"],
  },
  btnOutline: {
    flex: 1,
    height: sizes.buttonMd,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.primary,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.card,
  },
  btnSolid: {
    flex: 1.2,
    height: sizes.buttonMd,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    ...shadows.elevated,
    shadowColor: colors.primary,
  },
  btnText: {
    fontSize: rf(14),
    fontWeight: "700" as any,
  },

  // Image Source Picker Modal
  sourceSelectContent: {
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
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: spacing.sm,
  },
  modalTitle: {
    fontSize: rf(16),
    fontWeight: "800" as any,
    color: colors.textPrimary,
  },
  sourceBtnRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: spacing.lg,
  },
  sourceBtn: {
    alignItems: "center",
    gap: spacing.xs,
  },
  sourceIconBg: {
    width: wpx(56),
    height: wpx(56),
    borderRadius: radius.full,
    justifyContent: "center",
    alignItems: "center",
  },
  sourceLabel: {
    fontSize: rf(13),
    fontWeight: "600" as any,
    color: colors.textSecondary,
  },

  // Preview Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: "flex-end",
  },
  imageOverlayContainer: {
    flex: 1,
    backgroundColor: "#000000",
    justifyContent: "center",
    alignItems: "center",
  },
  closePreviewBtn: {
    position: "absolute",
    top: hpx(50),
    right: wpx(20),
    zIndex: 10,
    width: wpx(40),
    height: wpx(40),
    justifyContent: "center",
    alignItems: "center",
  },
  fullScreenImage: {
    width: "100%",
    height: "80%",
  },
});
