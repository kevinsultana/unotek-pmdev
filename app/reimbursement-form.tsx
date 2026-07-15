import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
  View
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
import type { Expense, ExpenseCategory } from "../types/expense";
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

  interface FormLinePhoto {
    id?: number;
    uri: string;
    isLocal: boolean;
  }

  interface FormLine {
    id?: number;
    name: string;
    product_id: number;
    product_name: string;
    quantity: number;
    price_unit: number;
    photos: FormLinePhoto[];
  }

  // Header / Form Fields
  const [formTitle, setFormTitle] = useState("");
  const [formDate, setFormDate] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formPhotos, setFormPhotos] = useState<FormPhoto[]>([]);

  // Lines State
  const [formLines, setFormLines] = useState<FormLine[]>([]);

  // Modal Line Item States
  const [showLineModal, setShowLineModal] = useState(false);
  const [editingLineIndex, setEditingLineIndex] = useState<number | null>(null);
  const [lineName, setLineName] = useState("");
  const [lineCategory, setLineCategory] = useState<ExpenseCategory | null>(null);
  const [linePrice, setLinePrice] = useState("");
  const [lineQuantity, setLineQuantity] = useState("1");
  const [linePhotos, setLinePhotos] = useState<FormLinePhoto[]>([]);

  // General States
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

  // Header General Photos
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

  // Line modal photo attachments
  const handleLinePickFromCamera = async () => {
    if (linePhotos.length >= 5) {
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
      setLinePhotos(prev => [...prev, { uri: result.assets[0].uri, isLocal: true }]);
    }
  };

  const handleLinePickFromGallery = async () => {
    const maxRemaining = 5 - linePhotos.length;
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
      setLinePhotos(prev => [...prev, ...selected]);
    }
  };

  const handleLineRemovePhoto = (index: number) => {
    setLinePhotos(prev => prev.filter((_, i) => i !== index));
  };

  // Line item CRUD inside the form
  const handleOpenAddLine = () => {
    setEditingLineIndex(null);
    setLineName("");
    setLineCategory(null);
    setLinePrice("");
    setLineQuantity("1");
    setLinePhotos([]);
    setShowLineModal(true);
  };

  const handleOpenEditLine = (index: number) => {
    const line = formLines[index];
    setEditingLineIndex(index);
    setLineName(line.name);
    const cat = categories.find((c) => c.id === line.product_id) || {
      id: line.product_id,
      name: line.product_name,
    };
    setLineCategory(cat);
    setLinePrice(line.price_unit.toLocaleString("id-ID"));
    setLineQuantity(line.quantity.toString());
    setLinePhotos(line.photos);
    setShowLineModal(true);
  };

  const handleSaveLine = () => {
    if (!lineName || !lineCategory || !linePrice || !lineQuantity) {
      showToast("error", "Validasi", "Harap isi semua kolom wajib item.");
      return;
    }
    const price = parseInt(linePrice.replace(/\./g, ""), 10);
    const qty = parseInt(lineQuantity, 10);
    if (isNaN(price) || price <= 0) {
      showToast("error", "Validasi", "Harga satuan tidak valid.");
      return;
    }
    if (isNaN(qty) || qty <= 0) {
      showToast("error", "Validasi", "Kuantitas tidak valid.");
      return;
    }

    const newLine: FormLine = {
      name: lineName,
      product_id: lineCategory.id,
      product_name: lineCategory.name,
      quantity: qty,
      price_unit: price,
      photos: linePhotos,
    };

    if (editingLineIndex !== null) {
      setFormLines(prev => {
        const next = [...prev];
        next[editingLineIndex] = newLine;
        return next;
      });
    } else {
      setFormLines(prev => [...prev, newLine]);
    }
    setShowLineModal(false);
  };

  const handleDeleteLine = (index: number) => {
    Alert.alert(
      "Hapus Item",
      "Apakah Anda yakin ingin menghapus item pengeluaran ini?",
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: () => {
            setFormLines(prev => prev.filter((_, i) => i !== index));
          },
        },
      ]
    );
  };

  // Load Categories & Expense detail if editing
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const catRes = await expenseService.listCategories();
      const loadedCats = catRes.data.data || [];
      setCategories(loadedCats);

      if (expenseId) {
        const detailRes = await expenseService.getById(expenseId);
        const detail = detailRes.data.data;
        if (detail) {
          setFormTitle(detail.name);
          setFormDate(detail.date);
          setFormDescription(detail.description || "");

          // Header general attachments
          const loadedPhotos = detail.attachments?.map((att: any) => ({
            id: att.id,
            uri: att.url,
            isLocal: false,
          })) || [];
          setFormPhotos(loadedPhotos);

          // Lines and their line attachments
          if (detail.lines && detail.lines.length > 0) {
            const mappedLines = await Promise.all(
              detail.lines.map(async (line) => {
                let lineAtts: FormLinePhoto[] = [];
                try {
                  const attRes = await expenseService.listLineAttachments(line.id);
                  lineAtts = attRes.data.data?.map((att) => ({
                    id: att.id,
                    uri: att.url,
                    isLocal: false,
                  })) || [];
                } catch {
                  // Fallback to empty if fails
                }
                return {
                  id: line.id,
                  name: line.name,
                  product_id: line.product?.id || line.product_id || 0,
                  product_name: line.product?.name || "",
                  quantity: line.quantity,
                  price_unit: line.price_unit,
                  photos: lineAtts,
                };
              })
            );
            setFormLines(mappedLines);
          } else {
            // Migrate old single expense structure to a single line item
            setFormLines([
              {
                id: undefined,
                name: detail.name,
                product_id: detail.product?.id || 0,
                product_name: detail.product?.name || "",
                quantity: detail.quantity || 1,
                price_unit: detail.total_amount_currency,
                photos: [],
              },
            ]);
          }
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

  const getLocalUri = async (uri: string): Promise<string> => {
    if (!uri.startsWith("http")) {
      return uri;
    }
    try {
      const filename = uri.split("/").pop() || `temp_${Date.now()}.jpg`;
      const tempUri = `${FileSystem.documentDirectory}${filename}`;
      const downloadResult = await FileSystem.downloadAsync(uri, tempUri);
      return downloadResult.uri;
    } catch (error) {
      console.log("Failed to download remote attachment:", error);
      return uri;
    }
  };

  // Main Save Handler
  const handleSave = async () => {
    if (!formTitle || !formDate) {
      showToast("error", "Validasi", "Harap isi Judul dan Tanggal pengajuan.");
      return;
    }
    if (formLines.length === 0) {
      showToast("error", "Validasi", "Harap tambahkan minimal 1 item pengeluaran.");
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Upload header photos
      let headerAttachmentIds: number[] = [];
      for (const photo of formPhotos) {
        if (photo.isLocal) {
          const uploadRes = await expenseService.uploadAttachment(photo.uri);
          if (uploadRes.data.success && uploadRes.data.data?.id) {
            headerAttachmentIds.push(uploadRes.data.data.id);
          }
        } else if (photo.id) {
          headerAttachmentIds.push(photo.id);
        }
      }

      // 2. Prepare payload lines
      const reqLines = formLines.map(line => ({
        name: line.name,
        product_id: line.product_id,
        quantity: line.quantity,
        price_unit: line.price_unit,
      }));

      let savedExpense: Expense | null = null;

      if (expenseId) {
        // Update Expense (this deletes old lines and replaces them with reqLines)
        const updateData = {
          name: formTitle,
          date: formDate,
          description: formDescription || undefined,
          attachment_ids: headerAttachmentIds,
          lines: reqLines,
        };
        const res = await expenseService.update(expenseId, updateData);
        savedExpense = res.data.data;
      } else {
        // Create Expense with Lines
        const createData = {
          name: formTitle,
          date: formDate,
          description: formDescription || undefined,
          attachment_ids: headerAttachmentIds.length > 0 ? headerAttachmentIds : undefined,
          lines: reqLines,
        };
        const res = await expenseService.create(createData);
        savedExpense = res.data.data;
      }

      // 3. Upload line-level photos
      let uploadFailCount = 0;
      if (savedExpense && savedExpense.lines && savedExpense.lines.length > 0) {
        for (let i = 0; i < formLines.length; i++) {
          const localLine = formLines[i];
          const serverLine = savedExpense.lines[i];
          if (serverLine && serverLine.id) {
            for (const photo of localLine.photos) {
              try {
                const uploadUri = await getLocalUri(photo.uri);
                const uploadRes = await expenseService.uploadLineAttachment(uploadUri, serverLine.id);
                if (!uploadRes.data.success) {
                  uploadFailCount++;
                }
                if (uploadUri !== photo.uri) {
                  await FileSystem.deleteAsync(uploadUri, { idempotent: true });
                }
              } catch (uploadErr) {
                console.log("Error uploading line photo:", uploadErr);
                uploadFailCount++;
              }
            }
          }
        }
      }

      if (uploadFailCount > 0) {
        showToast(
          "success",
          "Tersimpan dengan Catatan",
          `Reimbursement tersimpan, namun ${uploadFailCount} foto gagal diunggah.`
        );
      } else {
        showToast("success", "Berhasil", "Reimbursement berhasil disimpan.");
      }
      router.back();
    } catch (err: any) {
      showToast(
        "error",
        "Gagal",
        err?.response?.data?.message || "Gagal menyimpan reimbursement."
      );
      console.log(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculatedTotal = formLines.reduce(
    (sum, l) => sum + l.price_unit * l.quantity,
    0
  );

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
            <Text style={styles.fieldLabel}>Judul Pengajuan *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Contoh: Perjalanan Dinas Jakarta"
              placeholderTextColor={colors.textMuted}
              value={formTitle}
              onChangeText={setFormTitle}
            />

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
              placeholder="Keterangan perjalanan dinas atau pengeluaran..."
              placeholderTextColor={colors.textMuted}
              value={formDescription}
              onChangeText={setFormDescription}
            />


            {/* Lines Section */}
            <View style={styles.linesSectionHeader}>
              <Text style={styles.linesTitle}>Item Pengeluaran *</Text>
              <TouchableOpacity
                style={styles.lineAddBtn}
                onPress={handleOpenAddLine}
                activeOpacity={0.7}
              >
                <Ionicons name="add-circle-outline" size={18} color={colors.primary} />
                <Text style={styles.lineAddBtnText}>Tambah Item</Text>
              </TouchableOpacity>
            </View>

            {formLines.length === 0 ? (
              <View style={styles.emptyLinesBox}>
                <Ionicons name="list-outline" size={24} color={colors.textMuted} />
                <Text style={styles.emptyLinesText}>Belum ada item pengeluaran yang ditambahkan.</Text>
              </View>
            ) : (
              <View style={styles.linesList}>
                {formLines.map((line, index) => (
                  <View key={index} style={styles.lineCard}>
                    <View style={styles.lineCardHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.lineCardName}>{line.name}</Text>
                        <Text style={styles.lineCardCategory}>{line.product_name}</Text>
                      </View>
                      <Text style={styles.lineCardTotal}>
                        Rp {(line.price_unit * line.quantity).toLocaleString("id-ID")}
                      </Text>
                    </View>

                    <View style={styles.lineCardFooter}>
                      <Text style={styles.lineCardDetails}>
                        {line.quantity}x @ Rp {line.price_unit.toLocaleString("id-ID")}
                      </Text>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
                        {line.photos.length > 0 && (
                          <View style={{ flexDirection: "row", alignItems: "center" }}>
                            <Ionicons name="attach-outline" size={14} color={colors.textSecondary} style={{ marginRight: 2 }} />
                            <Text style={styles.lineCardPhotosCount}>{line.photos.length}</Text>
                          </View>
                        )}
                        <View style={styles.lineCardActions}>
                          <TouchableOpacity
                            onPress={() => handleOpenEditLine(index)}
                            style={styles.lineActionBtn}
                          >
                            <Ionicons name="create-outline" size={16} color={colors.primary} />
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => handleDeleteLine(index)}
                            style={styles.lineActionBtn}
                          >
                            <Ionicons name="trash-outline" size={16} color={colors.error} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  </View>
                ))}

                {/* Calculated summary */}
                <View style={styles.summaryBox}>
                  <Text style={styles.summaryLabel}>Total Estimasi:</Text>
                  <Text style={styles.summaryValue}>Rp {calculatedTotal.toLocaleString("id-ID")}</Text>
                </View>
              </View>
            )}

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
                      lineCategory?.id === c.id && styles.categoryItemActive,
                    ]}
                    onPress={() => {
                      setLineCategory(c);
                      setShowCategoryPicker(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.categoryItemText,
                        lineCategory?.id === c.id &&
                        styles.categoryItemTextActive,
                      ]}
                    >
                      {c.name}
                    </Text>
                    {lineCategory?.id === c.id && (
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

      {/* Modal Add/Edit Line Item */}
      <Modal
        visible={showLineModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowLineModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowLineModal(false)} />
          <View style={styles.lineModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingLineIndex !== null ? "Edit Item Pengeluaran" : "Tambah Item Pengeluaran"}
              </Text>
              <TouchableOpacity onPress={() => setShowLineModal(false)}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.lineFormScroll}>
              <Text style={styles.fieldLabel}>Nama / Deskripsi Item *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Contoh: Tiket Pesawat PP Jakarta"
                placeholderTextColor={colors.textMuted}
                value={lineName}
                onChangeText={setLineName}
              />

              <Text style={styles.fieldLabel}>Kategori Biaya *</Text>
              <TouchableOpacity
                style={styles.selectBtn}
                onPress={() => setShowCategoryPicker(true)}
                activeOpacity={0.7}
              >
                <Text
                  style={
                    lineCategory
                      ? styles.selectValue
                      : styles.selectPlaceholder
                  }
                >
                  {lineCategory?.name || "Pilih Kategori"}
                </Text>
                <Ionicons
                  name="chevron-down"
                  size={18}
                  color={colors.textMuted}
                />
              </TouchableOpacity>

              <View style={{ flexDirection: "row", gap: spacing.md }}>
                <View style={{ flex: 1.5 }}>
                  <Text style={styles.fieldLabel}>Harga Satuan (Rp) *</Text>
                  <View style={styles.amountInputContainer}>
                    <Text style={styles.currencyPrefix}>Rp.</Text>
                    <TextInput
                      style={styles.amountInput}
                      keyboardType="numeric"
                      placeholder="Harga"
                      placeholderTextColor={colors.textMuted}
                      value={linePrice}
                      onChangeText={(val) => setLinePrice(formatThousands(val))}
                    />
                  </View>
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Kuantitas *</Text>
                  <TextInput
                    style={styles.textInput}
                    keyboardType="numeric"
                    placeholder="Contoh: 1"
                    placeholderTextColor={colors.textMuted}
                    value={lineQuantity}
                    onChangeText={setLineQuantity}
                  />
                </View>
              </View>

              <Text style={styles.fieldLabel}>Lampiran Bukti Item (Maksimal 5)</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.photosScroll}
              >
                {linePhotos.map((photo, index) => (
                  <View key={index} style={styles.photoContainer}>
                    <TouchableOpacity
                      onPress={() => setActivePreviewUri(photo.uri)}
                      activeOpacity={0.8}
                    >
                      <Image source={{ uri: photo.uri }} style={styles.photoThumbnail} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.photoDeleteBadge}
                      onPress={() => handleLineRemovePhoto(index)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="close-circle" size={18} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                ))}

                {linePhotos.length < 5 && (
                  <View style={styles.addPhotoButtonsContainer}>
                    <TouchableOpacity
                      style={styles.photoAddBox}
                      onPress={handleLinePickFromCamera}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="camera-outline" size={20} color={colors.primary} />
                      <Text style={styles.photoAddBoxText}>Kamera</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.photoAddBox}
                      onPress={handleLinePickFromGallery}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="image-outline" size={20} color={colors.primary} />
                      <Text style={styles.photoAddBoxText}>Galeri</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </ScrollView>

              <View style={styles.modalButtonsRow}>
                <TouchableOpacity
                  style={[styles.formBtn, styles.draftBtn]}
                  onPress={() => setShowLineModal(false)}
                >
                  <Text style={styles.draftBtnText}>Batal</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.formBtn, styles.submitBtn]}
                  onPress={handleSaveLine}
                >
                  <Text style={styles.submitBtnText}>Simpan Item</Text>
                </TouchableOpacity>
              </View>
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

  // Lines Section
  linesSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: spacing.xs,
  },
  linesTitle: {
    fontSize: rf(14),
    fontWeight: "700" as any,
    color: colors.textPrimary,
  },
  lineAddBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
  },
  lineAddBtnText: {
    fontSize: rf(12),
    fontWeight: "700" as any,
    color: colors.primary,
  },
  emptyLinesBox: {
    paddingVertical: spacing.xl,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: "dashed",
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    gap: spacing.xs,
  },
  emptyLinesText: {
    fontSize: rf(12),
    color: colors.textMuted,
    textAlign: "center",
  },
  linesList: {
    gap: spacing.md,
  },
  lineCard: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  lineCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  lineCardName: {
    fontSize: rf(14),
    fontWeight: "700" as any,
    color: colors.textPrimary,
  },
  lineCardCategory: {
    fontSize: rf(11),
    fontWeight: "600" as any,
    color: colors.textMuted,
    marginTop: 2,
    textTransform: "uppercase",
  },
  lineCardTotal: {
    fontSize: rf(14),
    fontWeight: "800" as any,
    color: colors.primary,
  },
  lineCardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
  lineCardDetails: {
    fontSize: rf(12),
    color: colors.textSecondary,
    fontWeight: "600" as any,
  },
  lineCardPhotosCount: {
    fontSize: rf(11),
    color: colors.textSecondary,
    fontWeight: "700" as any,
  },
  lineCardActions: {
    flexDirection: "row",
    gap: spacing.md,
  },
  lineActionBtn: {
    padding: 2,
  },
  summaryBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.primaryLight,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  summaryLabel: {
    fontSize: rf(13),
    fontWeight: "700" as any,
    color: colors.primary,
  },
  summaryValue: {
    fontSize: rf(16),
    fontWeight: "800" as any,
    color: colors.primary,
  },

  // Modal Line
  lineModalContent: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.xl,
    maxHeight: "90%",
  },
  lineFormScroll: {
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  modalButtonsRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.md,
  },
  formBtn: {
    flex: 1,
    height: sizes.buttonMd,
    borderRadius: radius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  draftBtn: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  draftBtnText: {
    color: colors.textPrimary,
    fontSize: rf(14),
    fontWeight: "700" as any,
  },
});
