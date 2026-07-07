import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { expenseService } from "../services/expenseService";
import {
  colors,
  hpx,
  radius,
  rf,
  shadows,
  sizes,
  spacing,
  wpx
} from "../src/constants/theme";
import type { ExpenseCategory } from "../types/expense";
import { showToast } from "../utils/toast";

export default function ReimbursementFormScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const expenseId = params.id ? Number(params.id) : null;

  interface FormPhoto {
    id?: number;
    uri: string;
    isLocal: boolean;
  }

  // Form Fields
  const [formTitle, setFormTitle] = useState("");
  const [formCategory, setFormCategory] = useState<ExpenseCategory | null>(null);
  const [formAmount, setFormAmount] = useState("");
  const [formDate, setFormDate] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formPhotos, setFormPhotos] = useState<FormPhoto[]>([]);

  // States
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeFormFieldDate, setActiveFormFieldDate] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [activePreviewUri, setActivePreviewUri] = useState<string | null>(null);

  // Formatting helpers
  const formatDateString = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const toDisplayDate = (dateStr: string) => {
    if (!dateStr) return "Pilih Tanggal";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const formatThousands = (val: string) => {
    const clean = val.replace(/\D/g, "");
    if (!clean) return "";
    return Number(clean).toLocaleString("id-ID");
  };

  // Image attachment pickers
  const handlePickFromCamera = async () => {
    if (formPhotos.length >= 5) {
      showToast("error", "Validasi", "Maksimal 5 foto bukti.");
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
      setFormPhotos(prev => [...prev, { uri: result.assets[0].uri, isLocal: true }]);
    }
  };

  const handlePickFromGallery = async () => {
    const maxRemaining = 5 - formPhotos.length;
    if (maxRemaining <= 0) {
      showToast("error", "Validasi", "Maksimal 5 foto bukti.");
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
      const selected = result.assets.map(asset => ({
        uri: asset.uri,
        isLocal: true,
      })).slice(0, maxRemaining);
      setFormPhotos(prev => [...prev, ...selected]);
    }
  };

  const handleRemovePhoto = (index: number) => {
    setFormPhotos(prev => prev.filter((_, i) => i !== index));
  };

  // Load Categories & Expense detail if editing
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Load Categories first
      const catRes = await expenseService.listCategories();
      const loadedCats = catRes.data.data || [];
      setCategories(loadedCats);

      if (expenseId) {
        // Load Expense Detail
        const detailRes = await expenseService.getById(expenseId);
        const detail = detailRes.data.data;
        if (detail) {
          setFormTitle(detail.name);
          const foundCategory = loadedCats.find((c) => c.name === detail.product?.name) || {
            id: detail.product?.id || 0,
            name: detail.product?.name || "",
          };
          setFormCategory(foundCategory);
          setFormAmount(Number(detail.total_amount_currency).toLocaleString("id-ID"));
          setFormDate(detail.date);
          setFormDescription(detail.description || "");
          const loadedPhotos = detail.attachments?.map((att: any) => ({
            id: att.id,
            uri: att.url,
            isLocal: false,
          })) || [];
          setFormPhotos(loadedPhotos);
        }
      }
    } catch (err: any) {
      showToast(
        "error",
        "Gagal",
        err?.response?.data?.message || "Gagal memuat data form."
      );
    } finally {
      setIsLoading(false);
    }
  }, [expenseId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Save / Update Handler
  const handleSave = async () => {
    if (!formTitle || !formCategory || !formAmount || !formDate) {
      showToast("error", "Validasi", "Harap isi semua kolom wajib.");
      return;
    }

    setIsSubmitting(true);
    try {
      let attachmentIds: number[] = [];

      // 1. Upload local images in parallel or sequence, keep server image IDs
      for (const photo of formPhotos) {
        if (photo.isLocal) {
          const uploadRes = await expenseService.uploadAttachment(photo.uri);
          if (uploadRes.data.success && uploadRes.data.data?.id) {
            attachmentIds.push(uploadRes.data.data.id);
          }
        } else if (photo.id) {
          attachmentIds.push(photo.id);
        }
      }

      const rawAmount = parseInt(formAmount.replace(/\./g, ""), 10);

      if (expenseId) {
        // Update Expense
        const updateData: any = {
          name: formTitle,
          product_id: formCategory.id,
          total_amount_currency: rawAmount,
          date: formDate,
          description: formDescription || null,
          quantity: 1,
          attachment_ids: attachmentIds,
        };

        await expenseService.update(expenseId, updateData);
        showToast("success", "Berhasil", "Perubahan draft berhasil disimpan.");
      } else {
        // Create Expense
        const createData = {
          name: formTitle,
          product_id: formCategory.id,
          total_amount_currency: rawAmount,
          date: formDate,
          description: formDescription || undefined,
          quantity: 1,
          attachment_ids: attachmentIds.length > 0 ? attachmentIds : undefined,
        };

        await expenseService.create(createData);
        showToast("success", "Berhasil", "Draft reimbursement berhasil disimpan.");
      }

      // Navigate back to the list and refresh
      router.back();
    } catch (err: any) {
      showToast(
        "error",
        "Gagal",
        err?.response?.data?.message || "Gagal menyimpan reimbursement."
      );
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
            {expenseId ? "Edit Reimbursement" : "Form Reimbursement"}
          </Text>
          <View style={{ width: wpx(36) }} />
        </View>
      </View>

      {/* Form Content */}
      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Memuat data...</Text>
        </View>
      ) : (
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.formScroll,
              { paddingBottom: Math.max(insets.bottom, spacing.xl) },
            ]}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.fieldLabel}>Kategori Biaya *</Text>
            <TouchableOpacity
              style={styles.selectBtn}
              onPress={() => setShowCategoryPicker(true)}
              activeOpacity={0.7}
            >
              <Text
                style={
                  formCategory
                    ? styles.selectValue
                    : styles.selectPlaceholder
                }
              >
                {formCategory?.name || "Pilih Kategori Biaya"}
              </Text>
              <Ionicons
                name="chevron-down"
                size={18}
                color={colors.textMuted}
              />
            </TouchableOpacity>

            <Text style={styles.fieldLabel}>Judul Pengajuan *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Contoh: Bensin dinas meeting client"
              placeholderTextColor={colors.textMuted}
              value={formTitle}
              onChangeText={setFormTitle}
            />

            <Text style={styles.fieldLabel}>Nominal Biaya (Rupiah) *</Text>
            <View style={styles.amountInputContainer}>
              <Text style={styles.currencyPrefix}>Rp.</Text>
              <TextInput
                style={styles.amountInput}
                keyboardType="numeric"
                placeholder="Contoh: 150.000"
                placeholderTextColor={colors.textMuted}
                value={formAmount}
                onChangeText={(val) => setFormAmount(formatThousands(val))}
              />
            </View>

            <Text style={styles.fieldLabel}>Tanggal Transaksi *</Text>
            {Platform.OS === "ios" ? (
              <View
                style={[
                  styles.textInput,
                  { justifyContent: "center", alignItems: "flex-start" },
                ]}
              >
                <DateTimePicker
                  value={formDate ? new Date(formDate) : new Date()}
                  mode="date"
                  display="default"
                  locale="id-ID"
                  themeVariant="light"
                  onChange={(_e, d) => d && setFormDate(formatDateString(d))}
                  style={{ marginLeft: -8 }}
                />
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.textInput, { justifyContent: "center" }]}
                onPress={() => setActiveFormFieldDate(true)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.textInputValue,
                    !formDate && { color: colors.textMuted },
                  ]}
                >
                  {toDisplayDate(formDate)}
                </Text>
              </TouchableOpacity>
            )}

            <Text style={styles.fieldLabel}>Keterangan Tambahan</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              multiline
              placeholder="Detail tujuan pengeluaran..."
              placeholderTextColor={colors.textMuted}
              value={formDescription}
              onChangeText={setFormDescription}
            />

            <Text style={styles.fieldLabel}>Lampiran Bukti (Foto - Maksimal 5)</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.photosScroll}
            >
              {formPhotos.map((photo, index) => (
                <View key={index} style={styles.photoContainer}>
                  <TouchableOpacity
                    onPress={() => setActivePreviewUri(photo.uri)}
                    activeOpacity={0.8}
                  >
                    <Image source={{ uri: photo.uri }} style={styles.photoThumbnail} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.photoDeleteBadge}
                    onPress={() => handleRemovePhoto(index)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="close-circle" size={18} color={colors.error} />
                  </TouchableOpacity>
                </View>
              ))}

              {formPhotos.length < 5 && (
                <View style={styles.addPhotoButtonsContainer}>
                  <TouchableOpacity
                    style={styles.photoAddBox}
                    onPress={handlePickFromCamera}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="camera-outline" size={20} color={colors.primary} />
                    <Text style={styles.photoAddBoxText}>Kamera</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.photoAddBox}
                    onPress={handlePickFromGallery}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="image-outline" size={20} color={colors.primary} />
                    <Text style={styles.photoAddBoxText}>Galeri</Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>

            {/* Submit Buttons */}
            <View style={styles.buttonsRow}>
              <TouchableOpacity
                style={[styles.submitBtn, isSubmitting && { opacity: 0.6 }]}
                onPress={handleSave}
                disabled={isSubmitting}
                activeOpacity={0.8}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitBtnText}>
                    {expenseId ? "Simpan Perubahan" : "Simpan Draft"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      )}

      {/* Android date picker field */}
      {activeFormFieldDate && Platform.OS !== "ios" && (
        <DateTimePicker
          value={formDate ? new Date(formDate) : new Date()}
          mode="date"
          display="default"
          onChange={(_e, d) => {
            setActiveFormFieldDate(false);
            if (d) setFormDate(formatDateString(d));
          }}
        />
      )}

      {/* Category Picker Modal */}
      <Modal
        visible={showCategoryPicker}
        animationType="slide"
        transparent
        onRequestClose={() => setShowCategoryPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setShowCategoryPicker(false)}
          />
          <View style={styles.subModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pilih Kategori</Text>
              <TouchableOpacity onPress={() => setShowCategoryPicker(false)}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <ScrollView
              style={{ maxHeight: 300 }}
              showsVerticalScrollIndicator={false}
            >
              {categories.length === 0 ? (
                <View
                  style={{ paddingVertical: spacing.lg, alignItems: "center" }}
                >
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text
                    style={{ marginTop: spacing.sm, color: colors.textMuted }}
                  >
                    Memuat kategori...
                  </Text>
                </View>
              ) : (
                categories.map((c) => (
                  <TouchableOpacity
                    key={c.id}
                    style={[
                      styles.categoryItem,
                      formCategory?.id === c.id && styles.categoryItemActive,
                    ]}
                    onPress={() => {
                      setFormCategory(c);
                      setShowCategoryPicker(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.categoryItemText,
                        formCategory?.id === c.id &&
                        styles.categoryItemTextActive,
                      ]}
                    >
                      {c.name}
                    </Text>
                    {formCategory?.id === c.id && (
                      <Ionicons
                        name="checkmark"
                        size={16}
                        color={colors.primary}
                      />
                    )}
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Full Screen Image Viewer Modal */}
      <Modal
        visible={activePreviewUri !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setActivePreviewUri(null)}
      >
        <View style={styles.fullscreenImageContainer}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setActivePreviewUri(null)} />
          <TouchableOpacity
            style={styles.closeImageBtn}
            onPress={() => setActivePreviewUri(null)}
          >
            <Ionicons name="close" size={30} color="#FFFFFF" />
          </TouchableOpacity>
          {activePreviewUri ? (
            <Image
              source={{ uri: activePreviewUri }}
              style={styles.fullscreenImage}
              resizeMode="contain"
            />
          ) : null}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: {
    marginTop: spacing.sm,
    color: colors.textMuted,
    fontSize: rf(14),
  },

  // Header
  curvedHeader: {
    height: hpx(115),
    backgroundColor: colors.primary,
    borderBottomLeftRadius: wpx(25),
    borderBottomRightRadius: wpx(25),
    paddingHorizontal: spacing.xl,
    justifyContent: "flex-end",
    paddingBottom: hpx(16),
    zIndex: 1,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  backBtn: {
    width: wpx(36),
    height: wpx(36),
    borderRadius: radius.full,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  headerTitle: {
    fontSize: rf(18),
    fontWeight: "800" as any,
    color: "#FFFFFF",
  },

  // Form scroll
  formScroll: {
    padding: spacing.xl,
    gap: spacing.md,
  },
  fieldLabel: {
    fontSize: rf(13),
    fontWeight: "700" as any,
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },

  // Input elements
  textInput: {
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    height: sizes.buttonMd,
    color: colors.textPrimary,
    fontSize: rf(14),
  },
  amountInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    height: sizes.buttonMd,
  },
  currencyPrefix: {
    fontSize: rf(14),
    fontWeight: "700" as any,
    color: colors.textPrimary,
    marginRight: spacing.xs,
  },
  amountInput: {
    flex: 1,
    height: "100%",
    color: colors.textPrimary,
    fontSize: rf(14),
    padding: 0,
  },
  textInputValue: {
    color: colors.textPrimary,
    fontSize: rf(14),
  },
  textArea: {
    height: hpx(80),
    paddingTop: spacing.md,
    textAlignVertical: "top",
  },

  // Dropdown Button
  selectBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    height: sizes.buttonMd,
  },
  selectValue: {
    color: colors.textPrimary,
    fontSize: rf(14),
    flex: 1,
  },
  selectPlaceholder: {
    color: colors.textMuted,
    fontSize: rf(14),
    flex: 1,
  },

  // Attachment
  previewContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.md,
  },
  previewImage: {
    width: wpx(60),
    height: hpx(60),
    borderRadius: radius.sm,
    backgroundColor: colors.border,
  },
  removePhotoBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: radius.sm,
  },
  removePhotoText: {
    fontSize: rf(12),
    fontWeight: "600" as any,
    color: colors.error,
  },
  photoActionsRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  photoActionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    gap: spacing.sm,
    height: sizes.buttonMd,
  },
  photoActionText: {
    fontSize: rf(13),
    fontWeight: "600" as any,
    color: colors.textPrimary,
  },

  // Submit Buttons
  buttonsRow: {
    marginTop: spacing.lg,
  },
  submitBtn: {
    height: sizes.buttonMd,
    borderRadius: radius.md,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.primary,
    ...shadows.elevated,
    shadowColor: colors.primary,
  },
  submitBtnText: {
    color: "#FFFFFF",
    fontSize: rf(14),
    fontWeight: "700" as any,
  },

  // Modal Pickers styles
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: "flex-end",
  },
  subModalContent: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.xl,
    maxHeight: "50%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  modalTitle: {
    fontSize: rf(18),
    fontWeight: "800" as any,
    color: colors.textPrimary,
  },
  categoryItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    marginBottom: spacing.xs,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryItemActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  categoryItemText: {
    fontSize: rf(14),
    fontWeight: "600" as any,
    color: colors.textSecondary,
  },
  categoryItemTextActive: {
    color: colors.primary,
    fontWeight: "700" as any,
  },
  fullscreenImageContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.95)",
    justifyContent: "center",
    alignItems: "center",
  },
  closeImageBtn: {
    position: "absolute",
    top: 50,
    right: spacing.xl,
    zIndex: 10,
    padding: spacing.xs,
  },
  fullscreenImage: {
    width: "100%",
    height: "80%",
  },
  photosScroll: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.xs,
    gap: spacing.md,
  },
  photoContainer: {
    position: "relative",
    width: wpx(76),
    height: hpx(76),
  },
  photoThumbnail: {
    width: wpx(70),
    height: hpx(70),
    borderRadius: radius.md,
    backgroundColor: colors.border,
    borderWidth: 1,
    borderColor: colors.border,
  },
  photoDeleteBadge: {
    position: "absolute",
    top: -4,
    right: 0,
    zIndex: 2,
    backgroundColor: "#FFFFFF",
    borderRadius: radius.full,
  },
  addPhotoButtonsContainer: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  photoAddBox: {
    width: wpx(70),
    height: hpx(70),
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderStyle: "dashed",
    borderRadius: radius.md,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.primaryLight,
  },
  photoAddBoxText: {
    fontSize: rf(10),
    fontWeight: "700" as any,
    color: colors.primary,
    marginTop: 4,
  },
});
