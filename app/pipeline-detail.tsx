import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useState } from "react";
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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { pipelineService } from "../services/pipelineService";
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
import type {
  PipelineAttachment,
  PipelineItem,
  PipelinePriority,
  PipelineStage,
} from "../types/pipeline";
import { showToast } from "../utils/toast";

const STAGE_CONFIG: Record<
  PipelineStage,
  { label: string; bg: string; text: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  Lead: { label: "Lead Prospek", bg: "#FEF3C7", text: "#D97706", icon: "bulb-outline" },
  Qualification: { label: "Kualifikasi", bg: "#EDE9FE", text: "#7C3AED", icon: "filter-outline" },
  Proposal: { label: "Proposal", bg: "#DBEAFE", text: "#1E40AF", icon: "document-text-outline" },
  Negotiation: { label: "Negosiasi", bg: "#E0E7FF", text: "#4F46E5", icon: "chatbubbles-outline" },
  Won: { label: "Won (Menang)", bg: "#D1FAE5", text: "#059669", icon: "checkmark-circle-outline" },
  Lost: { label: "Lost (Gagal)", bg: "#FEE2E2", text: "#DC2626", icon: "close-circle-outline" },
};

const ALL_STAGES: PipelineStage[] = [
  "Lead",
  "Qualification",
  "Proposal",
  "Negotiation",
  "Won",
  "Lost",
];

const PRIORITIES: PipelinePriority[] = ["Low", "Medium", "High"];

function formatRupiah(amount: number): string {
  return "Rp " + amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export default function PipelineDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id?: string }>();

  const [pipeline, setPipeline] = useState<PipelineItem | null>(null);
  const [loading, setLoading] = useState(true);

  // Edit Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formClient, setFormClient] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formStage, setFormStage] = useState<PipelineStage>("Lead");
  const [formPriority, setFormPriority] = useState<PipelinePriority>("Medium");
  const [formProbability, setFormProbability] = useState("50");
  const [formExpectedDate, setFormExpectedDate] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Add Document Link Modal State
  const [docModalVisible, setDocModalVisible] = useState(false);
  const [docName, setDocName] = useState("");
  const [docUri, setDocUri] = useState("");

  // Preview Image Modal State
  const [previewImageUri, setPreviewImageUri] = useState<string | null>(null);

  const fetchDetail = useCallback(async () => {
    if (!params.id) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await pipelineService.getById(params.id);
      if (data) {
        setPipeline(data);
      } else {
        showToast("error", "Data Tidak Ditemukan", "Pipeline tidak ada di sistem.");
      }
    } catch (err: any) {
      showToast("error", "Gagal memuat detail pipeline", err?.message);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useFocusEffect(
    useCallback(() => {
      fetchDetail();
    }, [fetchDetail])
  );

  // Open Edit Modal
  const handleOpenEdit = () => {
    if (!pipeline) return;
    setFormTitle(pipeline.title);
    setFormClient(pipeline.client);
    setFormAmount(pipeline.amount.toString());
    setFormStage(pipeline.stage);
    setFormPriority(pipeline.priority);
    setFormProbability(pipeline.probability.toString());
    setFormExpectedDate(pipeline.expectedCloseDate);
    setFormNotes(pipeline.notes || "");
    setModalVisible(true);
  };

  // Quick Change Stage
  const handleQuickChangeStage = async (newStage: PipelineStage) => {
    if (!pipeline || pipeline.stage === newStage) return;
    try {
      const updated = await pipelineService.update(pipeline.id, { stage: newStage });
      setPipeline(updated);
      showToast("success", "Stage Diperbarui", `Status pipeline diubah menjadi ${newStage}.`);
    } catch (err: any) {
      showToast("error", "Gagal Mengubah Stage", err?.message);
    }
  };

  // Save Edit
  const handleSave = async () => {
    if (!pipeline) return;
    if (!formTitle.trim()) {
      showToast("error", "Judul Wajib Diisi", "Silakan masukkan nama pipeline/proyek.");
      return;
    }
    if (!formClient.trim()) {
      showToast("error", "Nama Klien Wajib Diisi", "Silakan masukkan nama klien.");
      return;
    }

    const numAmount = parseFloat(formAmount.replace(/[^0-9]/g, "")) || 0;
    const numProb = Math.min(100, Math.max(0, parseInt(formProbability) || 50));

    try {
      setSubmitting(true);
      const updated = await pipelineService.update(pipeline.id, {
        title: formTitle.trim(),
        client: formClient.trim(),
        amount: numAmount,
        stage: formStage,
        priority: formPriority,
        probability: numProb,
        expectedCloseDate: formExpectedDate.trim() || new Date().toISOString().split("T")[0],
        notes: formNotes.trim(),
      });
      setPipeline(updated);
      setModalVisible(false);
      showToast("success", "Berhasil Diperbarui", "Data pipeline berhasil disimpan.");
    } catch (err: any) {
      showToast("error", "Gagal Menyimpan", err?.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Pick Image Attachment from Library
  const handlePickImage = async () => {
    if (!pipeline) return;
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        showToast("error", "Izin Ditolak", "Izin akses galeri foto diperlukan.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        const fileName = asset.fileName || `Lampiran_Gambar_${Date.now()}.jpg`;
        await pipelineService.addAttachment(pipeline.id, {
          name: fileName,
          uri: asset.uri,
          type: "image",
        });
        showToast("success", "Lampiran Ditambahkan", "Gambar berhasil dilampirkan.");
        fetchDetail();
      }
    } catch (err: any) {
      showToast("error", "Gagal Memilih Gambar", err?.message);
    }
  };

  // Pick Image from Camera
  const handleTakeCamera = async () => {
    if (!pipeline) return;
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        showToast("error", "Izin Ditolak", "Izin akses kamera diperlukan.");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        const fileName = `Foto_Kamera_${Date.now()}.jpg`;
        await pipelineService.addAttachment(pipeline.id, {
          name: fileName,
          uri: asset.uri,
          type: "image",
        });
        showToast("success", "Lampiran Ditambahkan", "Foto berhasil diambil & dilampirkan.");
        fetchDetail();
      }
    } catch (err: any) {
      showToast("error", "Gagal Mengambil Foto", err?.message);
    }
  };

  // Add Document Link Save
  const handleSaveDocumentLink = async () => {
    if (!pipeline) return;
    if (!docName.trim()) {
      showToast("error", "Nama Dokumen Wajib Diisi", "Masukkan nama lampiran dokumen.");
      return;
    }
    try {
      await pipelineService.addAttachment(pipeline.id, {
        name: docName.trim(),
        uri: docUri.trim() || "https://unotek.co.id/documents/attachment.pdf",
        type: "document",
      });
      setDocModalVisible(false);
      setDocName("");
      setDocUri("");
      showToast("success", "Dokumen Ditambahkan", "Lampiran dokumen berhasil disimpan.");
      fetchDetail();
    } catch (err: any) {
      showToast("error", "Gagal Menambah Dokumen", err?.message);
    }
  };

  // Delete Attachment
  const handleDeleteAttachment = (att: PipelineAttachment) => {
    if (!pipeline) return;
    Alert.alert(
      "Hapus Lampiran",
      `Apakah Anda yakin ingin menghapus lampiran "${att.name}"?`,
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: async () => {
            try {
              await pipelineService.removeAttachment(pipeline.id, att.id);
              showToast("success", "Lampiran Dihapus", "Lampiran berhasil dihapus.");
              fetchDetail();
            } catch (err: any) {
              showToast("error", "Gagal Hapus Lampiran", err?.message);
            }
          },
        },
      ]
    );
  };

  // Delete Pipeline
  const handleDelete = () => {
    if (!pipeline) return;
    Alert.alert(
      "Hapus Pipeline",
      `Apakah Anda yakin ingin menghapus "${pipeline.title}"?`,
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: async () => {
            try {
              await pipelineService.delete(pipeline.id);
              showToast("success", "Terhapus", "Pipeline berhasil dihapus.");
              router.back();
            } catch (err: any) {
              showToast("error", "Gagal Hapus", err?.message);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Memuat detail pipeline...</Text>
      </View>
    );
  }

  if (!pipeline) {
    return (
      <View style={styles.centerContainer}>
        <StatusBar style="light" />
        <Ionicons name="alert-circle-outline" size={54} color={colors.error} />
        <Text style={styles.emptyTitle}>Pipeline Tidak Ditemukan</Text>
        <TouchableOpacity style={styles.backBtnEmpty} onPress={() => router.back()}>
          <Text style={styles.backBtnEmptyText}>Kembali ke Daftar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const stageCfg = STAGE_CONFIG[pipeline.stage] || STAGE_CONFIG.Lead;
  const attachments = pipeline.attachments || [];

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Curved Header */}
      <View style={styles.curvedHeader}>
        <TouchableOpacity style={styles.headerBackBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.headerTitleBox}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            Detail Pipeline
          </Text>
          <Text style={styles.headerSub}>ID: {pipeline.id}</Text>
        </View>

        <View style={styles.headerRightActions}>
          <TouchableOpacity style={styles.headerIconBtn} onPress={handleOpenEdit}>
            <Ionicons name="create-outline" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIconBtn} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Main Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View style={[styles.stageBadge, { backgroundColor: stageCfg.bg }]}>
              <Ionicons name={stageCfg.icon} size={14} color={stageCfg.text} />
              <Text style={[styles.stageBadgeText, { color: stageCfg.text }]}>
                {stageCfg.label}
              </Text>
            </View>
            <View style={styles.priorityBadge}>
              <Text style={styles.priorityText}>Prioritas: {pipeline.priority}</Text>
            </View>
          </View>

          <Text style={styles.heroTitle}>{pipeline.title}</Text>

          <View style={styles.clientRow}>
            <Ionicons name="business" size={16} color={colors.primary} />
            <Text style={styles.clientText}>{pipeline.client}</Text>
          </View>

          <View style={styles.amountBox}>
            <Text style={styles.amountLabel}>Nilai Prospek (Potential Value)</Text>
            <Text style={styles.amountValue}>{formatRupiah(pipeline.amount)}</Text>
          </View>

          {/* Win Probability Bar */}
          <View style={styles.probBox}>
            <View style={styles.probHeader}>
              <Text style={styles.probLabel}>Probabilitas Deal (Win Rate)</Text>
              <Text style={styles.probValue}>{pipeline.probability}%</Text>
            </View>
            <View style={styles.probBarBg}>
              <View
                style={[
                  styles.probBarFill,
                  {
                    width: `${pipeline.probability}%`,
                    backgroundColor:
                      pipeline.probability > 70
                        ? colors.success
                        : pipeline.probability > 30
                        ? colors.amber
                        : colors.error,
                  },
                ]}
              />
            </View>
          </View>
        </View>

        {/* Quick Stage Update Stepper */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Ubah Tahapan Stage</Text>
          <Text style={styles.sectionSub}>Tekan stage di bawah untuk memperbarui status proyek:</Text>

          <View style={styles.stageStepperRow}>
            {ALL_STAGES.map((stg) => {
              const isCurrent = pipeline.stage === stg;
              const cfg = STAGE_CONFIG[stg];
              return (
                <TouchableOpacity
                  key={stg}
                  style={[
                    styles.stageStepChip,
                    isCurrent && { backgroundColor: cfg.bg, borderColor: cfg.text },
                  ]}
                  onPress={() => handleQuickChangeStage(stg)}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={cfg.icon}
                    size={14}
                    color={isCurrent ? cfg.text : colors.textMuted}
                  />
                  <Text
                    style={[
                      styles.stageStepText,
                      isCurrent && { color: cfg.text, fontWeight: "700" as any },
                    ]}
                  >
                    {stg}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Informational Specs */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Informasi Rinci Prospek</Text>

          <View style={styles.infoRow}>
            <View style={styles.infoIconBg}>
              <Ionicons name="calendar-outline" size={18} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.infoLabel}>Target Tanggal Closing</Text>
              <Text style={styles.infoVal}>{pipeline.expectedCloseDate}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoIconBg}>
              <Ionicons name="time-outline" size={18} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.infoLabel}>Tanggal Dibuat</Text>
              <Text style={styles.infoVal}>{pipeline.createdAt}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoIconBg}>
              <Ionicons name="cash-outline" size={18} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.infoLabel}>Estimasi Pendapatan Terbobot</Text>
              <Text style={styles.infoVal}>
                {formatRupiah(Math.round((pipeline.amount * pipeline.probability) / 100))}
              </Text>
            </View>
          </View>
        </View>

        {/* Notes & Description Card */}
        <View style={styles.sectionCard}>
          <View style={styles.notesHeaderRow}>
            <Text style={styles.sectionTitle}>Catatan & Perkembangan</Text>
            <TouchableOpacity onPress={handleOpenEdit}>
              <Text style={styles.editNotesText}>Edit Catatan</Text>
            </TouchableOpacity>
          </View>

          {pipeline.notes ? (
            <Text style={styles.notesBody}>{pipeline.notes}</Text>
          ) : (
            <Text style={styles.notesEmpty}>Belum ada catatan perkembangan tertulis.</Text>
          )}
        </View>

        {/* Lampiran & Dokumen Section */}
        <View style={styles.sectionCard}>
          <View style={styles.attachmentHeaderRow}>
            <View style={styles.attachmentTitleGroup}>
              <Text style={styles.sectionTitle}>Lampiran & Dokumen</Text>
              <View style={styles.attBadge}>
                <Text style={styles.attBadgeText}>{attachments.length}</Text>
              </View>
            </View>
          </View>

          {/* Action Buttons to Add Attachments */}
          <View style={styles.addAttButtonsRow}>
            <TouchableOpacity style={styles.addAttBtn} onPress={handlePickImage}>
              <Ionicons name="images-outline" size={18} color={colors.primary} />
              <Text style={styles.addAttBtnText}>Galeri</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.addAttBtn} onPress={handleTakeCamera}>
              <Ionicons name="camera-outline" size={18} color={colors.primary} />
              <Text style={styles.addAttBtnText}>Kamera</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.addAttBtn}
              onPress={() => {
                setDocName("");
                setDocUri("");
                setDocModalVisible(true);
              }}
            >
              <Ionicons name="document-attach-outline" size={18} color={colors.primary} />
              <Text style={styles.addAttBtnText}>Link / Dokumen</Text>
            </TouchableOpacity>
          </View>

          {/* Attachment List */}
          {attachments.length === 0 ? (
            <View style={styles.emptyAttBox}>
              <Ionicons name="attach-outline" size={32} color={colors.textMuted} />
              <Text style={styles.emptyAttText}>Belum ada lampiran dokumen atau foto.</Text>
            </View>
          ) : (
            <View style={styles.attList}>
              {attachments.map((att) => (
                <View key={att.id} style={styles.attCard}>
                  {att.type === "image" ? (
                    <TouchableOpacity onPress={() => setPreviewImageUri(att.uri)}>
                      <Image source={{ uri: att.uri }} style={styles.attImageThumb} />
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.attDocIconBg}>
                      <Ionicons name="document-text" size={24} color={colors.primary} />
                    </View>
                  )}

                  <View style={{ flex: 1 }}>
                    <Text style={styles.attName} numberOfLines={1}>
                      {att.name}
                    </Text>
                    <Text style={styles.attDate}>{att.createdAt}</Text>
                  </View>

                  {att.type === "image" && (
                    <TouchableOpacity
                      style={styles.attViewIconBtn}
                      onPress={() => setPreviewImageUri(att.uri)}
                    >
                      <Ionicons name="eye-outline" size={18} color={colors.primary} />
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={styles.attDeleteIconBtn}
                    onPress={() => handleDeleteAttachment(att)}
                  >
                    <Ionicons name="trash-outline" size={18} color={colors.error} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtonsRow}>
          <TouchableOpacity style={styles.editFullBtn} onPress={handleOpenEdit}>
            <Ionicons name="create-outline" size={20} color="#FFFFFF" />
            <Text style={styles.editFullBtnText}>Edit Pipeline</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.deleteFullBtn} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={20} color={colors.error} />
            <Text style={styles.deleteFullBtnText}>Hapus</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: hpx(40) }} />
      </ScrollView>

      {/* Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Pipeline Proyek</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {/* Form Input: Title */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Judul Pipeline / Proyek *</Text>
                <TextInput
                  style={styles.formInput}
                  value={formTitle}
                  onChangeText={setFormTitle}
                />
              </View>

              {/* Form Input: Client */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Nama Klien / Perusahaan *</Text>
                <TextInput
                  style={styles.formInput}
                  value={formClient}
                  onChangeText={setFormClient}
                />
              </View>

              {/* Form Input: Amount */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Nilai Potential (Rp)</Text>
                <TextInput
                  style={styles.formInput}
                  keyboardType="numeric"
                  value={formAmount}
                  onChangeText={setFormAmount}
                />
              </View>

              {/* Form Input: Stage Selection */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Tahapan (Stage)</Text>
                <View style={styles.chipRow}>
                  {ALL_STAGES.map((stg) => {
                    const isSelected = formStage === stg;
                    return (
                      <TouchableOpacity
                        key={stg}
                        style={[styles.selectChip, isSelected && styles.selectChipActive]}
                        onPress={() => setFormStage(stg)}
                      >
                        <Text
                          style={[
                            styles.selectChipText,
                            isSelected && styles.selectChipTextActive,
                          ]}
                        >
                          {stg}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Form Input: Priority */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Prioritas</Text>
                <View style={styles.chipRow}>
                  {PRIORITIES.map((prio) => {
                    const isSelected = formPriority === prio;
                    return (
                      <TouchableOpacity
                        key={prio}
                        style={[styles.selectChip, isSelected && styles.selectChipActive]}
                        onPress={() => setFormPriority(prio)}
                      >
                        <Text
                          style={[
                            styles.selectChipText,
                            isSelected && styles.selectChipTextActive,
                          ]}
                        >
                          {prio}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Form Input: Probability */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Probabilitas Win (%)</Text>
                <View style={styles.chipRow}>
                  {["25", "50", "75", "90", "100"].map((p) => {
                    const isSelected = formProbability === p;
                    return (
                      <TouchableOpacity
                        key={p}
                        style={[styles.selectChip, isSelected && styles.selectChipActive]}
                        onPress={() => setFormProbability(p)}
                      >
                        <Text
                          style={[
                            styles.selectChipText,
                            isSelected && styles.selectChipTextActive,
                          ]}
                        >
                          {p}%
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Form Input: Date */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Target Closing (YYYY-MM-DD)</Text>
                <TextInput
                  style={styles.formInput}
                  value={formExpectedDate}
                  onChangeText={setFormExpectedDate}
                />
              </View>

              {/* Form Input: Notes */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Catatan Perkembangan</Text>
                <TextInput
                  style={[styles.formInput, { height: hpx(80), textAlignVertical: "top" }]}
                  multiline
                  value={formNotes}
                  onChangeText={setFormNotes}
                />
              </View>
            </ScrollView>

            <TouchableOpacity
              style={[styles.saveBtn, submitting && { opacity: 0.6 }]}
              onPress={handleSave}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.saveBtnText}>Simpan Perubahan</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Add Document Link Modal */}
      <Modal visible={docModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Tambah Lampiran Dokumen</Text>
              <TouchableOpacity onPress={() => setDocModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Nama Dokumen *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Contoh: Proposal_Penawaran_V1.pdf"
                placeholderTextColor={colors.textMuted}
                value={docName}
                onChangeText={setDocName}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Link / URL Dokumen (Opsional)</Text>
              <TextInput
                style={styles.formInput}
                placeholder="https://..."
                placeholderTextColor={colors.textMuted}
                value={docUri}
                onChangeText={setDocUri}
              />
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveDocumentLink}>
              <Text style={styles.saveBtnText}>Simpan Dokumen</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Image Preview Fullscreen Modal */}
      <Modal visible={!!previewImageUri} transparent animationType="fade">
        <View style={styles.previewOverlay}>
          <TouchableOpacity
            style={styles.previewCloseBtn}
            onPress={() => setPreviewImageUri(null)}
          >
            <Ionicons name="close-circle" size={36} color="#FFFFFF" />
          </TouchableOpacity>
          {previewImageUri && (
            <Image source={{ uri: previewImageUri }} style={styles.previewFullImage} resizeMode="contain" />
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  centerContainer: {
    flex: 1,
    backgroundColor: colors.surface,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  loadingText: { marginTop: spacing.md, color: colors.textMuted, fontSize: rf(14) },
  emptyTitle: {
    fontSize: rf(16),
    fontWeight: "700" as any,
    color: colors.textPrimary,
    marginTop: spacing.md,
  },
  backBtnEmpty: {
    marginTop: spacing.lg,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  backBtnEmptyText: { color: "#FFFFFF", fontWeight: "700" as any },

  curvedHeader: {
    height: hpx(130),
    backgroundColor: colors.primary,
    borderBottomLeftRadius: wpx(30),
    borderBottomRightRadius: wpx(30),
    paddingHorizontal: spacing["2xl"],
    flexDirection: "row",
    alignItems: "flex-end",
    paddingBottom: hpx(16),
    zIndex: 1,
  },
  headerBackBtn: { padding: spacing.xs },
  headerTitleBox: { flex: 1, alignItems: "center" },
  headerTitle: { fontSize: rf(19), fontWeight: "800" as any, color: "#FFFFFF" },
  headerSub: { fontSize: rf(11), color: "rgba(255, 255, 255, 0.7)", marginTop: 2 },
  headerRightActions: { flexDirection: "row", gap: spacing.xs },
  headerIconBtn: { padding: spacing.xs },

  scroll: {
    paddingHorizontal: spacing["2xl"],
    paddingTop: hpx(16),
    paddingBottom: hpx(40),
  },

  /* Hero Card */
  heroCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    borderWidth: 1.5,
    borderColor: colors.primaryLight,
    ...shadows.elevated,
  },
  heroTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  stageBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    gap: 4,
  },
  stageBadgeText: { fontSize: rf(11), fontWeight: "700" as any },
  priorityBadge: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  priorityText: { fontSize: rf(11), fontWeight: "700" as any, color: colors.textSecondary },
  heroTitle: {
    fontSize: rf(19),
    fontWeight: "800" as any,
    color: colors.textPrimary,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  clientRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs, marginBottom: spacing.md },
  clientText: { fontSize: rf(13), color: colors.textSecondary, fontWeight: "600" as any },

  amountBox: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    alignItems: "center",
    marginBottom: spacing.md,
  },
  amountLabel: { fontSize: rf(11), color: colors.textMuted },
  amountValue: {
    fontSize: rf(22),
    fontWeight: "800" as any,
    color: colors.primary,
    marginTop: 2,
  },

  probBox: { marginTop: spacing.xs },
  probHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  probLabel: { fontSize: rf(12), color: colors.textMuted },
  probValue: { fontSize: rf(12), fontWeight: "700" as any, color: colors.textPrimary },
  probBarBg: { height: hpx(8), backgroundColor: colors.border, borderRadius: radius.full, overflow: "hidden" },
  probBarFill: { height: "100%", borderRadius: radius.full },

  /* Section Card */
  sectionCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  sectionTitle: { fontSize: rf(15), fontWeight: "800" as any, color: colors.textPrimary },
  sectionSub: { fontSize: rf(12), color: colors.textMuted, marginTop: 2, marginBottom: spacing.md },

  /* Stage Stepper */
  stageStepperRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  stageStepChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
    gap: 4,
  },
  stageStepText: { fontSize: rf(12), color: colors.textSecondary },

  /* Info Rows */
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface,
  },
  infoIconBg: {
    width: wpx(36),
    height: wpx(36),
    borderRadius: radius.sm,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  infoLabel: { fontSize: rf(11), color: colors.textMuted },
  infoVal: { fontSize: rf(13), fontWeight: "700" as any, color: colors.textPrimary, marginTop: 1 },

  /* Notes */
  notesHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.sm },
  editNotesText: { fontSize: rf(12), color: colors.primary, fontWeight: "700" as any },
  notesBody: { fontSize: rf(13), color: colors.textSecondary, lineHeight: rf(20) },
  notesEmpty: { fontSize: rf(12), color: colors.textMuted, fontStyle: "italic" },

  /* Attachment Section */
  attachmentHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  attachmentTitleGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  attBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  attBadgeText: { fontSize: rf(11), color: colors.primary, fontWeight: "700" as any },
  addAttButtonsRow: {
    flexDirection: "row",
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  addAttBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    gap: 4,
  },
  addAttBtnText: { fontSize: rf(11), fontWeight: "700" as any, color: colors.primary },
  emptyAttBox: {
    alignItems: "center",
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: "dashed",
  },
  emptyAttText: { fontSize: rf(12), color: colors.textMuted, marginTop: 4 },
  attList: { gap: spacing.xs },
  attCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.xs,
    gap: spacing.sm,
  },
  attImageThumb: {
    width: wpx(44),
    height: wpx(44),
    borderRadius: radius.sm,
    backgroundColor: colors.border,
  },
  attDocIconBg: {
    width: wpx(44),
    height: wpx(44),
    borderRadius: radius.sm,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  attName: { fontSize: rf(13), fontWeight: "700" as any, color: colors.textPrimary },
  attDate: { fontSize: rf(11), color: colors.textMuted, marginTop: 1 },
  attViewIconBtn: { padding: spacing.xs },
  attDeleteIconBtn: { padding: spacing.xs },

  /* Action Buttons Row */
  actionButtonsRow: { flexDirection: "row", gap: spacing.md },
  editFullBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    paddingVertical: hpx(12),
    borderRadius: radius.md,
    gap: spacing.xs,
  },
  editFullBtnText: { color: "#FFFFFF", fontWeight: "700" as any, fontSize: rf(14) },
  deleteFullBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEE2E2",
    paddingHorizontal: spacing.lg,
    paddingVertical: hpx(12),
    borderRadius: radius.md,
    gap: spacing.xs,
  },
  deleteFullBtnText: { color: colors.error, fontWeight: "700" as any, fontSize: rf(14) },

  /* Modal */
  modalOverlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: "flex-end" },
  modalContent: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.xl,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.lg,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: { fontSize: rf(17), fontWeight: "800" as any, color: colors.textPrimary },
  modalScroll: { marginBottom: spacing.lg },
  formGroup: { marginBottom: spacing.md },
  formLabel: { fontSize: rf(13), fontWeight: "700" as any, color: colors.textPrimary, marginBottom: spacing.xs },
  formInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: rf(14),
    color: colors.textPrimary,
  },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  selectChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectChipActive: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
  selectChipText: { fontSize: rf(12), color: colors.textSecondary },
  selectChipTextActive: { color: colors.primary, fontWeight: "700" as any },
  saveBtn: {
    backgroundColor: colors.primary,
    paddingVertical: hpx(14),
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtnText: { color: "#FFFFFF", fontWeight: "800" as any, fontSize: rf(15) },

  /* Fullscreen Image Preview */
  previewOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  previewCloseBtn: {
    position: "absolute",
    top: hpx(50),
    right: spacing.xl,
    zIndex: 10,
  },
  previewFullImage: {
    width: "100%",
    height: "80%",
  },
});
