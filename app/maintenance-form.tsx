import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
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
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useProfile } from "../hooks/useProfile";
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
import type { Equipment, MaintenanceAttachment, MaintenanceRequest, MaintenanceStage, MaintenanceTeam, ProblemCategory } from "../types/maintenance";
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

const MAINTENANCE_TYPES = [
  { value: "corrective", label: "Korektif" },
  { value: "preventive", label: "Preventif" },
] as const;

const stripHtml = (htmlStr?: string | null) => {
  if (!htmlStr) return "";
  return htmlStr
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
};

export default function MaintenanceFormScreen() {
  const { profile } = useProfile();
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
  const [isSubmittedEdit, setIsSubmittedEdit] = useState(false);
  const [showImageSourcePicker, setShowImageSourcePicker] = useState(false);
  const [activePreviewUri, setActivePreviewUri] = useState<string | null>(null);

  // Equipment Selector State
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [equipmentId, setEquipmentId] = useState<number | null>(null);
  const [showEquipmentPicker, setShowEquipmentPicker] = useState(false);
  const [equipmentSearchQuery, setEquipmentSearchQuery] = useState("");
  const [isEquipmentsLoading, setIsEquipmentsLoading] = useState(false);

  // New Fields State
  const [maintenanceType, setMaintenanceType] = useState<"corrective" | "preventive">("corrective");
  const [teams, setTeams] = useState<MaintenanceTeam[]>([]);
  const [teamId, setTeamId] = useState<number | null>(null);
  const [stages, setStages] = useState<MaintenanceStage[]>([]);
  const [stageId, setStageId] = useState<number | null>(null);
  const [showTeamPicker, setShowTeamPicker] = useState(false);
  const [showStagePicker, setShowStagePicker] = useState(false);
  const [isMetadataLoading, setIsMetadataLoading] = useState(false);

  // Problem Category Selector State
  const [problemCategories, setProblemCategories] = useState<ProblemCategory[]>([]);
  const [problemCategoryId, setProblemCategoryId] = useState<number | null>(null);
  const [showProblemCategoryPicker, setShowProblemCategoryPicker] = useState(false);

  // Existing Attachments State
  const [existingAttachments, setExistingAttachments] = useState<MaintenanceAttachment[]>([]);
  const [isDeletingAttachmentId, setIsDeletingAttachmentId] = useState<number | null>(null);

  // Load equipments list
  useEffect(() => {
    const empId = profile?.employee?.id;
    if (!empId) return;

    const loadEquipments = async () => {
      setIsEquipmentsLoading(true);
      try {
        const data = await maintenanceService.listEquipments({ employee_id: empId });
        setEquipments(data);
      } catch (err) {
        console.warn("Failed to load equipments list:", err);
      } finally {
        setIsEquipmentsLoading(false);
      }
    };

    loadEquipments();
  }, [profile?.employee?.id]);

  // Load teams/stages/problem-categories metadata
  useEffect(() => {
    const loadMetadata = async () => {
      setIsMetadataLoading(true);
      try {
        const [teamsData, stagesData, problemCatsData] = await Promise.all([
          maintenanceService.listTeams(),
          maintenanceService.listStages(),
          maintenanceService.listProblemCategories(),
        ]);
        setTeams(teamsData);
        setStages(stagesData);
        setProblemCategories(problemCatsData);
      } catch (err) {
        console.warn("Failed to load teams, stages, or problem categories metadata:", err);
      } finally {
        setIsMetadataLoading(false);
      }
    };

    loadMetadata();
  }, []);

  // Load existing data if editing
  useEffect(() => {
    if (requestId) {
      const loadRequestData = async () => {
        setIsLoading(true);
        try {
          const req = await maintenanceService.getById(requestId);
          if (req) {
            // Can only edit draft or submitted requests
            if (req.state !== "draft" && req.state !== "submitted") {
              showToast("error", "Akses Ditolak", "Hanya pengajuan dengan status Draft atau Diajukan yang dapat diubah.");
              router.back();
              return;
            }
            setIsSubmittedEdit(req.state === "submitted");
            setAssetName(req.asset_name || "");
            setAssetCode(req.asset_code || "");
            setCategory(req.category || "hardware");
            setUrgency(req.urgency || "low");
            setTitle(req.title || "");
            setDescription(stripHtml(req.description || ""));
            setImages([]);
            if (req.equipment_id) {
              setEquipmentId(req.equipment_id);
            }
            if (req.maintenance_type) {
              setMaintenanceType(req.maintenance_type);
            }
            if (req.maintenance_team_id) {
              setTeamId(req.maintenance_team_id);
            }
            if (req.stage_id) {
              setStageId(req.stage_id);
            }
            if (req.problem_category_id) {
              setProblemCategoryId(req.problem_category_id);
            }

            // Load attachments from server
            try {
              const atts = await maintenanceService.listAttachments(requestId);
              setExistingAttachments(atts);
            } catch (err) {
              console.warn("Failed to load attachments in edit mode:", err);
            }
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

  // Equipment Select Helper
  const handleSelectEquipment = (equip: Equipment) => {
    setEquipmentId(equip.id);
    setAssetName(equip.name);
    setAssetCode(equip.code);

    if (equip.category?.name) {
      const name = equip.category.name.toLowerCase();
      if (name.includes("hard") || name.includes("comp") || name.includes("laptop") || name.includes("pc")) {
        setCategory("hardware");
      } else if (name.includes("soft") || name.includes("app") || name.includes("licens")) {
        setCategory("software");
      } else if (name.includes("fac") || name.includes("build") || name.includes("room") || name.includes("furn") || name.includes("kursi") || name.includes("meja")) {
        setCategory("facility");
      } else {
        setCategory("other");
      }
    } else {
      setCategory("hardware");
    }

    setShowEquipmentPicker(false);
    setEquipmentSearchQuery("");
  };

  const handleSelectProblemCategory = (cat: ProblemCategory) => {
    setProblemCategoryId(cat.id);
    const name = cat.name.toLowerCase();
    if (name.includes("hard") || name.includes("comp") || name.includes("laptop") || name.includes("pc")) {
      setCategory("hardware");
    } else if (name.includes("soft") || name.includes("app") || name.includes("licens")) {
      setCategory("software");
    } else if (name.includes("fac") || name.includes("build") || name.includes("room") || name.includes("furn") || name.includes("kursi") || name.includes("meja")) {
      setCategory("facility");
    } else {
      setCategory("other");
    }
    setShowProblemCategoryPicker(false);
  };

  // Image Picking Helpers
  const totalPhotosCount = existingAttachments.length + images.length;

  const handlePickFromCamera = async () => {
    setShowImageSourcePicker(false);
    if (totalPhotosCount >= 5) {
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
    const maxRemaining = 5 - totalPhotosCount;
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
      setImages((prev) => [...prev, ...selectedUris].slice(0, maxRemaining));
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleDeleteAttachment = (attachmentId: number) => {
    Alert.alert(
      "Hapus Lampiran",
      "Apakah Anda yakin ingin menghapus foto bukti kerusakan ini?",
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: async () => {
            setIsDeletingAttachmentId(attachmentId);
            try {
              await maintenanceService.deleteAttachment(attachmentId);
              showToast("success", "Berhasil", "Lampiran berhasil dihapus.");
              setExistingAttachments((prev) => prev.filter((a) => a.id !== attachmentId));
            } catch (err: any) {
              showToast("error", "Gagal", err?.message || "Gagal menghapus lampiran.");
            } finally {
              setIsDeletingAttachmentId(null);
            }
          },
        },
      ]
    );
  };

  // Submit Operations
  const handleSave = async (submitDirectly: boolean) => {
    const cleanAssetName = (assetName || "").trim();
    const cleanAssetCode = (assetCode || "").trim();
    const cleanTitle = (title || "").trim();
    const cleanDescription = (description || "").trim();

    if (!equipmentId || !cleanTitle || !cleanDescription || !problemCategoryId) {
      showToast("error", "Validasi", "Harap isi semua kolom form yang diwajibkan (termasuk Kategori Detail).");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: any = {
        asset_name: cleanAssetName,
        asset_code: cleanAssetCode,
        category,
        urgency,
        title: cleanTitle,
        description: cleanDescription,
        state: submitDirectly ? "submitted" : "draft",
        equipment_id: equipmentId || undefined,
        maintenance_type: maintenanceType,
        maintenance_team_id: teamId || undefined,
        stage_id: stageId || undefined,
        problem_category_id: problemCategoryId || undefined,
      };

      let savedRequest: MaintenanceRequest;
      if (requestId) {
        savedRequest = await maintenanceService.update(requestId, payload);
      } else {
        savedRequest = await maintenanceService.create(payload);
      }

      // If there are new local images, upload them
      if (images.length > 0) {
        for (const imgUri of images) {
          try {
            await maintenanceService.uploadAttachment(imgUri, savedRequest.id);
          } catch (uploadErr) {
            console.error("Failed to upload attachment:", imgUri, uploadErr);
          }
        }
      }

      showToast(
        "success",
        "Berhasil",
        isSubmittedEdit
          ? "Perubahan berhasil disimpan."
          : (submitDirectly
            ? "Pengajuan maintenance berhasil dikirim."
            : "Pengajuan maintenance berhasil disimpan.")
      );
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
            <TouchableOpacity
              style={styles.pickerSelector}
              onPress={() => setShowProblemCategoryPicker(true)}
              activeOpacity={0.7}
            >
              <Text style={[styles.pickerSelectorText, !problemCategoryId && { color: colors.textMuted }]}>
                {problemCategoryId ? (problemCategories.find(c => c.id === problemCategoryId)?.name || "Kategori Terpilih") : "Pilih Kategori Masalah..."}
              </Text>
              <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
            </TouchableOpacity>

            {/* Selector Aset Terdaftar */}
            <Text style={styles.label}>Aset Kantor <Text style={styles.required}>*</Text></Text>

            {equipmentId ? (
              <View style={styles.selectedAssetContainer}>
                <Ionicons name="checkmark-circle" size={18} color="#059669" />
                <Text style={styles.selectedAssetText} numberOfLines={1}>
                  {assetName} ({assetCode})
                </Text>
                <TouchableOpacity onPress={() => {
                  setEquipmentId(null);
                  setAssetName("");
                  setAssetCode("");
                }}>
                  <Ionicons name="close-circle" size={18} color="#DC2626" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.pickerSelector}
                onPress={() => setShowEquipmentPicker(true)}
                activeOpacity={0.7}
              >
                <Text style={[styles.pickerSelectorText, { color: colors.textMuted }]}>
                  Pilih Aset Kantor...
                </Text>
                <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            )}

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

            {/* Tipe Maintenance */}
            <Text style={styles.label}>Tipe Maintenance <Text style={styles.required}>*</Text></Text>
            <View style={styles.urgencyGrid}>
              {MAINTENANCE_TYPES.map((type) => {
                const isSelected = maintenanceType === type.value;
                return (
                  <TouchableOpacity
                    key={type.value}
                    style={[
                      styles.urgencyBtn,
                      { borderColor: colors.primary },
                      isSelected && { backgroundColor: colors.primaryLight },
                    ]}
                    onPress={() => setMaintenanceType(type.value)}
                    activeOpacity={0.75}
                  >
                    <Text
                      style={[
                        styles.urgencyText,
                        { color: colors.primary },
                        isSelected && { fontWeight: "700" as any },
                      ]}
                    >
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Tim Maintenance */}
            <Text style={styles.label}>Tim Penanggung Jawab</Text>
            <TouchableOpacity
              style={styles.pickerSelector}
              onPress={() => setShowTeamPicker(true)}
              activeOpacity={0.7}
            >
              <Text style={[styles.pickerSelectorText, !teamId && { color: colors.textMuted }]}>
                {teamId ? (teams.find(t => t.id === teamId)?.name || "Tim Terpilih") : "Pilih tim penanggung jawab..."}
              </Text>
              <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
            </TouchableOpacity>



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
            {requestId && existingAttachments.length > 0 && (
              <View style={{ marginBottom: spacing.md }}>
                <Text style={styles.label}>Foto Terlampir (Server)</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.photoList}
                >
                  {existingAttachments.map((att) => (
                    <View key={att.id} style={styles.photoContainer}>
                      <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={() => setActivePreviewUri(att.url)}
                      >
                        <Image source={{ uri: att.url }} style={styles.photoThumb} />
                      </TouchableOpacity>
                      {isDeletingAttachmentId === att.id ? (
                        <View style={[styles.photoRemoveBtn, { backgroundColor: "rgba(0,0,0,0.5)" }]}>
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        </View>
                      ) : (
                        <TouchableOpacity
                          style={styles.photoRemoveBtn}
                          activeOpacity={0.7}
                          onPress={() => handleDeleteAttachment(att.id)}
                        >
                          <Ionicons name="close" size={14} color="#FFFFFF" />
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}

            <View style={styles.photoSectionHeader}>
              <Text style={styles.label}>Foto Baru ({totalPhotosCount}/5)</Text>
              {totalPhotosCount < 5 && (
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
            ) : existingAttachments.length === 0 ? (
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
            ) : null}

            {/* Action Buttons */}
            <View style={styles.actionButtonsContainer}>
              {isSubmittedEdit ? (
                <TouchableOpacity
                  style={[styles.btnSolid, { flex: 1, backgroundColor: colors.primary }, isSubmitting && { opacity: 0.6 }]}
                  disabled={isSubmitting}
                  onPress={() => handleSave(true)}
                  activeOpacity={0.8}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Ionicons name="save-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                      <Text style={[styles.btnText, { color: "#FFFFFF" }]}>Simpan Perubahan</Text>
                    </>
                  )}
                </TouchableOpacity>
              ) : (
                <>
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
                </>
              )}
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

      {/* Equipment Picker Modal */}
      <Modal
        visible={showEquipmentPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEquipmentPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setShowEquipmentPicker(false)}
          />
          <View style={[styles.detailModalContent, { height: "75%" }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pilih Aset / Peralatan</Text>
              <TouchableOpacity onPress={() => setShowEquipmentPicker(false)}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.searchBar}>
              <Ionicons
                name="search-outline"
                size={18}
                color={colors.textMuted}
                style={{ marginRight: spacing.sm }}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Cari nama aset atau kode..."
                placeholderTextColor={colors.textMuted}
                value={equipmentSearchQuery}
                onChangeText={setEquipmentSearchQuery}
              />
              {equipmentSearchQuery ? (
                <TouchableOpacity onPress={() => setEquipmentSearchQuery("")}>
                  <Ionicons name="close-circle" size={16} color={colors.textMuted} />
                </TouchableOpacity>
              ) : null}
            </View>

            {isEquipmentsLoading ? (
              <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={{ marginTop: spacing.sm, color: colors.textSecondary }}>Memuat daftar aset...</Text>
              </View>
            ) : (
              <ScrollView
                style={{ flex: 1, marginTop: spacing.md }}
                showsVerticalScrollIndicator={false}
              >
                {equipments.filter(item => {
                  const query = equipmentSearchQuery.toLowerCase();
                  return (
                    item.name.toLowerCase().includes(query) ||
                    item.code.toLowerCase().includes(query)
                  );
                }).length === 0 ? (
                  <View style={{ alignItems: "center", paddingVertical: hpx(40) }}>
                    <Text style={{ color: colors.textMuted }}>Aset tidak ditemukan</Text>
                  </View>
                ) : (
                  equipments.filter(item => {
                    const query = equipmentSearchQuery.toLowerCase();
                    return (
                      item.name.toLowerCase().includes(query) ||
                      item.code.toLowerCase().includes(query)
                    );
                  }).map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.equipmentItem}
                      onPress={() => handleSelectEquipment(item)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.equipmentName}>{item.name}</Text>
                      <Text style={styles.equipmentCode}>Kode: {item.code}</Text>
                      {item.category?.name ? (
                        <Text style={styles.equipmentCategory}>Kategori: {item.category.name}</Text>
                      ) : null}
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Team Picker Modal */}
      <Modal
        visible={showTeamPicker}
        animationType="slide"
        transparent
        onRequestClose={() => setShowTeamPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowTeamPicker(false)} />
          <View style={styles.modalStatusSelectContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pilih Tim Maintenance</Text>
              <TouchableOpacity onPress={() => setShowTeamPicker(false)}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 300 }} showsVerticalScrollIndicator={false}>
              <TouchableOpacity
                style={[
                  styles.categoryItem,
                  !teamId && styles.categoryItemActive,
                ]}
                onPress={() => {
                  setTeamId(null);
                  setShowTeamPicker(false);
                }}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.categoryItemText,
                    !teamId && styles.categoryItemTextActive,
                  ]}
                >
                  Tanpa Tim (Belum Ditentukan)
                </Text>
                {!teamId && (
                  <Ionicons name="checkmark" size={16} color={colors.primary} />
                )}
              </TouchableOpacity>

              {teams.map((team) => (
                <TouchableOpacity
                  key={team.id}
                  style={[
                    styles.categoryItem,
                    teamId === team.id && styles.categoryItemActive,
                  ]}
                  onPress={() => {
                    setTeamId(team.id);
                    setShowTeamPicker(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.categoryItemText,
                      teamId === team.id && styles.categoryItemTextActive,
                    ]}
                  >
                    {team.name}
                  </Text>
                  {teamId === team.id && (
                    <Ionicons name="checkmark" size={16} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Stage Picker Modal */}
      <Modal
        visible={showStagePicker}
        animationType="slide"
        transparent
        onRequestClose={() => setShowStagePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowStagePicker(false)} />
          <View style={styles.modalStatusSelectContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pilih Tahapan</Text>
              <TouchableOpacity onPress={() => setShowStagePicker(false)}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 300 }} showsVerticalScrollIndicator={false}>
              {stages.map((stage) => (
                <TouchableOpacity
                  key={stage.id}
                  style={[
                    styles.categoryItem,
                    stageId === stage.id && styles.categoryItemActive,
                  ]}
                  onPress={() => {
                    setStageId(stage.id);
                    setShowStagePicker(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.categoryItemText,
                      stageId === stage.id && styles.categoryItemTextActive,
                    ]}
                  >
                    {stage.name}
                  </Text>
                  {stageId === stage.id && (
                    <Ionicons name="checkmark" size={16} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Problem Category Picker Modal */}
      <Modal
        visible={showProblemCategoryPicker}
        animationType="slide"
        transparent
        onRequestClose={() => setShowProblemCategoryPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowProblemCategoryPicker(false)} />
          <View style={styles.modalStatusSelectContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pilih Kategori Detail</Text>
              <TouchableOpacity onPress={() => setShowProblemCategoryPicker(false)}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 300 }} showsVerticalScrollIndicator={false}>
              <TouchableOpacity
                style={[
                  styles.categoryItem,
                  !problemCategoryId && styles.categoryItemActive,
                ]}
                onPress={() => {
                  setProblemCategoryId(null);
                  setShowProblemCategoryPicker(false);
                }}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.categoryItemText,
                    !problemCategoryId && styles.categoryItemTextActive,
                  ]}
                >
                  Tanpa Kategori Detail
                </Text>
                {!problemCategoryId && (
                  <Ionicons name="checkmark" size={16} color={colors.primary} />
                )}
              </TouchableOpacity>

              {problemCategories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryItem,
                    problemCategoryId === cat.id && styles.categoryItemActive,
                  ]}
                  onPress={() => handleSelectProblemCategory(cat)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.categoryItemText,
                      problemCategoryId === cat.id && styles.categoryItemTextActive,
                    ]}
                  >
                    {cat.name}
                  </Text>
                  {problemCategoryId === cat.id && (
                    <Ionicons name="checkmark" size={16} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
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
  selectorHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.md,
  },
  selectAssetBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: hpx(4),
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.primaryLight,
    borderRadius: radius.sm,
  },
  selectAssetBtnText: {
    fontSize: rf(12),
    fontWeight: "700" as any,
    color: colors.primary,
  },
  optional: {
    fontSize: rf(11),
    color: colors.textMuted,
    fontWeight: "normal",
  },
  selectedAssetContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#DCFCE7",
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.xs,
    gap: spacing.sm,
  },
  selectedAssetText: {
    flex: 1,
    fontSize: rf(13),
    color: "#166534",
    fontWeight: "600" as any,
  },
  equipmentItem: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  equipmentName: {
    fontSize: rf(14),
    fontWeight: "700" as any,
    color: colors.textPrimary,
  },
  equipmentCode: {
    fontSize: rf(12),
    color: colors.textSecondary,
    marginTop: 2,
  },
  equipmentCategory: {
    fontSize: rf(11),
    color: colors.textMuted,
    textTransform: "uppercase",
    marginTop: 2,
  },
  detailModalContent: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing["2xl"],
    paddingTop: spacing["2xl"],
    paddingBottom: spacing["3xl"],
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    height: sizes.searchHeight,
  },
  searchInput: {
    flex: 1,
    height: "100%",
    fontSize: rf(13),
    color: colors.textPrimary,
  },
  modalStatusSelectContent: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing["2xl"],
  },
  categoryItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface,
  },
  categoryItemActive: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
  },
  categoryItemText: {
    fontSize: rf(14),
    color: colors.textSecondary,
    fontWeight: "500" as any,
  },
  categoryItemTextActive: {
    color: colors.primary,
    fontWeight: "700" as any,
  },
  pickerSelector: {
    backgroundColor: colors.card,
    borderWidth: 1.2,
    borderColor: colors.border,
    borderRadius: radius.md,
    height: sizes.buttonMd,
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.xs,
  },
  pickerSelectorText: {
    fontSize: rf(13),
    color: colors.textPrimary,
  },
});
