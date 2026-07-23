import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
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
  spacing,
  wpx
} from "../src/constants/theme";
import type {
  CrmLostReason,
  CrmStage,
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

function stripHtmlTags(str?: string): string {
  if (!str) return "";
  return str
    .replace(/<br\s*[\/]?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\n\s*\n/g, "\n")
    .trim();
}

function normalizeUri(uri?: string): string {
  if (!uri) return "";
  if (
    uri.startsWith("http://") ||
    uri.startsWith("https://") ||
    uri.startsWith("file://") ||
    uri.startsWith("content://") ||
    uri.startsWith("data:")
  ) {
    return uri;
  }
  if (uri.startsWith("/")) {
    return `file://${uri}`;
  }
  return uri;
}

export default function PipelineDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id?: string }>();

  const [pipeline, setPipeline] = useState<PipelineItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [stages, setStages] = useState<CrmStage[]>([]);
  const [lostReasons, setLostReasons] = useState<CrmLostReason[]>([]);

  // Mark Lost Modal State
  const [lostModalVisible, setLostModalVisible] = useState(false);
  const [selectedLostReason, setSelectedLostReason] = useState<CrmLostReason | null>(null);
  const [lostFeedback, setLostFeedback] = useState("");
  const [submittingLost, setSubmittingLost] = useState(false);

  // Add Document Link Modal State
  const [docModalVisible, setDocModalVisible] = useState(false);
  const [docName, setDocName] = useState("");
  const [docUri, setDocUri] = useState("");

  // Preview Image Modal State
  const [previewImageUri, setPreviewImageUri] = useState<string | null>(null);

  const fetchStages = useCallback(async () => {
    try {
      const fetchedStages = await pipelineService.fetchStages();
      if (fetchedStages && fetchedStages.length > 0) {
        setStages(fetchedStages);
      }
    } catch (err) {
      console.warn("Failed to load CRM stages in detail screen:", err);
    }
  }, []);

  const fetchLostReasons = useCallback(async () => {
    try {
      const fetchedReasons = await pipelineService.fetchLostReasons();
      if (fetchedReasons && fetchedReasons.length > 0) {
        setLostReasons(fetchedReasons);
      }
    } catch (err) {
      console.warn("Failed to load Lost Reasons in detail screen:", err);
    }
  }, []);

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
      fetchStages();
      fetchLostReasons();
      fetchDetail();
    }, [fetchStages, fetchLostReasons, fetchDetail])
  );

  // Open full screen form for Edit
  const handleOpenEdit = () => {
    if (!pipeline) return;
    router.push({ pathname: "/pipeline-form", params: { id: pipeline.id } });
  };

  // Quick Change Stage using CRM Stage Name & ID
  const handleQuickChangeStage = async (newStageName: string, newStageId?: number | string) => {
    if (!pipeline || pipeline.stage === newStageName) return;
    try {
      const name = newStageName.toLowerCase().trim();
      let newProb = 90;
      if (name.includes("activity") || name.includes("aktivitas")) newProb = 10;
      else if (name.includes("lead")) newProb = 50;
      else if (name.includes("won") || name.includes("menang")) newProb = 100;
      else if (name.includes("lost") || name.includes("gagal")) newProb = 0;

      if (newStageId) {
        await pipelineService.moveStage(pipeline.id, newStageId, newProb, pipeline.title);
      } else {
        await pipelineService.update(pipeline.id, {
          title: pipeline.title,
          stage: newStageName as PipelineStage,
          probability: newProb,
        });
      }
      setPipeline({
        ...pipeline,
        stage: newStageName as PipelineStage,
        stageId: newStageId,
        probability: newProb,
      });
      showToast("success", "Stage Diperbarui", `Status pipeline diubah menjadi ${newStageName} (${newProb}%).`);
      fetchDetail();
    } catch (err: any) {
      showToast("error", "Gagal Mengubah Stage", err?.message);
    }
  };

  // Handle Mark Won
  const handleMarkWon = async () => {
    if (!pipeline) return;
    Alert.alert(
      "Tandai Won (Menang)",
      `Apakah Anda yakin ingin menandai prospek "${pipeline.title}" sebagai Won (Menang)?`,
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Tandai Won 🎉",
          onPress: async () => {
            try {
              await pipelineService.markWon(pipeline.id);
              showToast("success", "Status Menang (Won)", "Prospek berhasil ditandai sebagai Won! 🎉");
              fetchDetail();
            } catch (err: any) {
              showToast("error", "Gagal Tandai Won", err?.message);
            }
          },
        },
      ]
    );
  };

  // Open Mark Lost Modal
  const handleOpenMarkLost = () => {
    setSelectedLostReason(lostReasons[0] || null);
    setLostFeedback("");
    setLostModalVisible(true);
  };

  // Save Mark Lost
  const handleSaveMarkLost = async () => {
    if (!pipeline) return;
    try {
      setSubmittingLost(true);
      const reasonName = selectedLostReason ? selectedLostReason.name : "";
      const feedbackText = [reasonName, lostFeedback.trim()].filter(Boolean).join(" - ");

      await pipelineService.markLost(pipeline.id, selectedLostReason?.id, feedbackText);
      showToast("success", "Status Lost (Gagal)", "Prospek berhasil ditandai sebagai Lost.");
      setLostModalVisible(false);
      fetchDetail();
    } catch (err: any) {
      showToast("error", "Gagal Tandai Lost", err?.message);
    } finally {
      setSubmittingLost(false);
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
        mediaTypes: ["images"],
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
        mediaTypes: ["images"],
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

  // Open / View Document, Photo, or PDF Attachment
  const handleOpenDocument = async (att: PipelineAttachment) => {
    if (!att) {
      showToast("error", "Lampiran Kosong", "Berkas lampiran tidak ditemukan.");
      return;
    }

    const attName = att.name || "Dokumen";
    const rawUri = att.uri || "";
    const normUri = normalizeUri(rawUri);

    if (!normUri) {
      showToast("error", "URI Tidak Valid", "Lokasi atau link berkas lampiran kosong.");
      return;
    }

    const isImage =
      att.type === "image" ||
      !!attName.match(/\.(jpg|jpeg|png|gif|webp)$/i) ||
      normUri.startsWith("file://") ||
      normUri.startsWith("content://") ||
      normUri.startsWith("data:image");

    if (isImage) {
      setPreviewImageUri(normUri);
      return;
    }

    try {
      await Linking.openURL(normUri);
    } catch {
      Alert.alert(
        "Detail Dokumen / Link",
        `Nama Dokumen: ${attName}\n\nURL / Path:\n${normUri}`,
        [
          { text: "Tutup", style: "cancel" },
          {
            text: "Informasi Link",
            onPress: () => showToast("info", "Link Berkas", normUri),
          },
        ]
      );
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
  const isLost = pipeline.wonStatus === "lost" || pipeline.stage === "Lost";

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
          {!isLost && (
            <TouchableOpacity style={styles.headerIconBtn} onPress={handleOpenEdit}>
              <Ionicons name="create-outline" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.headerIconBtn} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {isLost && (
          <View style={styles.readOnlyBanner}>
            <Ionicons name="lock-closed" size={18} color="#DC2626" />
            <View style={{ flex: 1 }}>
              <Text style={styles.readOnlyBannerText}>
                Prospek ini berstatus Lost (Gagal) dan bersifat Read-Only (Hanya dapat dilihat).
              </Text>
              {(pipeline.lostReason || pipeline.lost_feedback) ? (
                <Text style={styles.readOnlyBannerReason}>
                  Alasan Lost: {pipeline.lostReason || pipeline.lost_feedback}
                </Text>
              ) : null}
            </View>
          </View>
        )}

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

        {/* Quick Deal Outcome Actions */}
        {!isLost && (
          <View style={styles.dealActionsRow}>
            <TouchableOpacity
              style={[styles.dealWonBtn, pipeline.stage === "Won" && styles.dealWonBtnActive]}
              onPress={handleMarkWon}
              activeOpacity={0.85}
            >
              <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
              <Text style={styles.dealWonBtnText}>Tandai Won (Menang)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.dealLostBtn, pipeline.stage === "Lost" && styles.dealLostBtnActive]}
              onPress={handleOpenMarkLost}
              activeOpacity={0.85}
            >
              <Ionicons name="close-circle" size={20} color="#FFFFFF" />
              <Text style={styles.dealLostBtnText}>Tandai Lost (Gagal)</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Quick Stage Update Stepper */}
        {!isLost && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Ubah Tahapan Stage</Text>
            <Text style={styles.sectionSub}>Tekan stage di bawah untuk memperbarui status proyek:</Text>

            <View style={styles.stageStepperRow}>
              {(stages.length > 0 ? stages : ALL_STAGES)
                .filter((stgItem) => {
                  const stgName = (typeof stgItem === "string" ? stgItem : stgItem.name).toLowerCase().trim();
                  return !stgName.includes("won") && !stgName.includes("lost") && !stgName.includes("menang") && !stgName.includes("gagal");
                })
                .map((stgItem) => {
                const stgName = typeof stgItem === "string" ? stgItem : stgItem.name;
                const stgId = typeof stgItem === "string" ? undefined : stgItem.id;

                const isCurrent =
                  pipeline.stage.toLowerCase() === stgName.toLowerCase() ||
                  (pipeline.stageId && String(pipeline.stageId) === String(stgId));

                const cfg =
                  STAGE_CONFIG[stgName as PipelineStage] || {
                    label: stgName,
                    bg: "#DBEAFE",
                    text: colors.primary,
                    icon: "bulb-outline",
                  };

                return (
                  <TouchableOpacity
                    key={String(stgId || stgName)}
                    style={[
                      styles.stageStepChip,
                      isCurrent ? { backgroundColor: cfg.bg, borderColor: cfg.text } : null,
                    ]}
                    onPress={() => handleQuickChangeStage(stgName, stgId)}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name={cfg.icon as any}
                      size={14}
                      color={isCurrent ? cfg.text : colors.textMuted}
                    />
                    <Text
                      style={[
                        styles.stageStepText,
                        isCurrent ? { color: cfg.text, fontWeight: "700" as any } : null,
                      ]}
                    >
                      {stgName}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

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
                {formatRupiah(pipeline.amount)}
              </Text>
            </View>
          </View>

          {isLost && (pipeline.lostReason || pipeline.lost_feedback) ? (
            <View style={styles.infoRow}>
              <View style={[styles.infoIconBg, { backgroundColor: "#FEE2E2" }]}>
                <Ionicons name="alert-circle-outline" size={18} color={colors.error} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.infoLabel}>Alasan Lost (Gagal)</Text>
                <Text style={[styles.infoVal, { color: colors.error, fontWeight: "700" as any }]}>
                  {pipeline.lostReason || pipeline.lost_feedback}
                </Text>
              </View>
            </View>
          ) : null}
        </View>

        {/* Notes & Description Card */}
        <View style={styles.sectionCard}>
          <View style={styles.notesHeaderRow}>
            <Text style={styles.sectionTitle}>Catatan & Perkembangan</Text>
            {!isLost && (
              <TouchableOpacity onPress={handleOpenEdit}>
                <Text style={styles.editNotesText}>Edit Catatan</Text>
              </TouchableOpacity>
            )}
          </View>

          {stripHtmlTags(pipeline.notes) ? (
            <Text style={styles.notesBody}>{stripHtmlTags(pipeline.notes)}</Text>
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
          {!isLost && (
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
          )}

          {/* Attachment List */}
          {attachments.length === 0 ? (
            <View style={styles.emptyAttBox}>
              <Ionicons name="attach-outline" size={32} color={colors.textMuted} />
              <Text style={styles.emptyAttText}>Belum ada lampiran dokumen atau foto.</Text>
            </View>
          ) : (
            <View style={styles.attList}>
              {attachments.map((att) => {
                const attName = att?.name || "Dokumen Lampiran";
                const rawUri = att?.uri || "";
                const normUri = normalizeUri(rawUri);
                const isPdf =
                  attName.toLowerCase().endsWith(".pdf") || normUri.toLowerCase().endsWith(".pdf");
                const isImage =
                  (att?.type === "image" || !!attName.match(/\.(jpg|jpeg|png|gif|webp)$/i)) &&
                  !!normUri;

                return (
                  <View key={att.id} style={styles.attCard}>
                    {isImage && normUri ? (
                      <TouchableOpacity onPress={() => handleOpenDocument(att)}>
                        <Image source={{ uri: normUri }} style={styles.attImageThumb} />
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        style={[
                          styles.attDocIconBg,
                          isPdf ? { backgroundColor: "#FEE2E2" } : null,
                        ]}
                        onPress={() => handleOpenDocument(att)}
                      >
                        <Ionicons
                          name={isPdf ? "document-text" : "document-attach"}
                          size={24}
                          color={isPdf ? colors.error : colors.primary}
                        />
                      </TouchableOpacity>
                    )}

                    <TouchableOpacity
                      style={{ flex: 1 }}
                      onPress={() => handleOpenDocument(att)}
                    >
                      <Text style={styles.attName} numberOfLines={1}>
                        {attName}
                      </Text>
                      <Text style={styles.attDate}>
                        {isPdf ? "Dokumen PDF • " : isImage ? "Foto / Gambar • " : ""}{att.createdAt}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.attViewIconBtn}
                      onPress={() => handleOpenDocument(att)}
                    >
                      <Ionicons name="eye-outline" size={18} color={colors.primary} />
                    </TouchableOpacity>

                    {!isLost && (
                      <TouchableOpacity
                        style={styles.attDeleteIconBtn}
                        onPress={() => handleDeleteAttachment(att)}
                      >
                        <Ionicons name="trash-outline" size={18} color={colors.error} />
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtonsRow}>
          {!isLost && (
            <TouchableOpacity style={styles.editFullBtn} onPress={handleOpenEdit}>
              <Ionicons name="create-outline" size={20} color="#FFFFFF" />
              <Text style={styles.editFullBtnText}>Edit Pipeline</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.deleteFullBtn, isLost ? { flex: 1 } : null]}
            onPress={handleDelete}
          >
            <Ionicons name="trash-outline" size={20} color={colors.error} />
            <Text style={styles.deleteFullBtnText}>Hapus</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: hpx(40) }} />
      </ScrollView>

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

      {/* Mark Lost Modal */}
      <Modal visible={lostModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Ionicons name="close-circle" size={22} color={colors.error} />
                <Text style={styles.modalTitle}>Tandai Prospek Sebagai Lost</Text>
              </View>
              <TouchableOpacity onPress={() => setLostModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ marginBottom: spacing.lg }} showsVerticalScrollIndicator={false}>
              <Text style={styles.formLabel}>Pilih Alasan Prospek Gagal / Lost *</Text>
              <View style={styles.chipRow}>
                {lostReasons.map((reason) => {
                  const isSelected = selectedLostReason?.id === reason.id;
                  return (
                    <TouchableOpacity
                      key={reason.id}
                      style={[styles.selectChip, isSelected ? styles.selectChipActive : null]}
                      onPress={() => setSelectedLostReason(reason)}
                    >
                      <Text
                        style={[
                          styles.selectChipText,
                          isSelected ? styles.selectChipTextActive : null,
                        ]}
                      >
                        {reason.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={[styles.formGroup, { marginTop: spacing.md }]}>
                <Text style={styles.formLabel}>Catatan Alasan / Feedback Tambahan (Opsional)</Text>
                <TextInput
                  style={[styles.formInput, { height: hpx(80), textAlignVertical: "top" }]}
                  placeholder="Contoh: Klien memilih vendor X karena harga lebih kompetitif..."
                  placeholderTextColor={colors.textMuted}
                  multiline
                  value={lostFeedback}
                  onChangeText={setLostFeedback}
                />
              </View>
            </ScrollView>

            <View style={{ flexDirection: "row", gap: spacing.md }}>
              <TouchableOpacity
                style={styles.cancelModalBtn}
                onPress={() => setLostModalVisible(false)}
              >
                <Text style={styles.cancelModalBtnText}>Batal</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.confirmLostBtn, submittingLost ? { opacity: 0.6 } : null]}
                onPress={handleSaveMarkLost}
                disabled={submittingLost}
              >
                {submittingLost ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.confirmLostBtnText}>Simpan Status Lost</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Image Preview Fullscreen Modal */}
      <Modal
        visible={!!previewImageUri}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewImageUri(null)}
      >
        <View style={styles.previewOverlay}>
          <View style={styles.previewHeaderRow}>
            <Text style={styles.previewTitleText}>Pratinjau Foto Lampiran</Text>
            <TouchableOpacity
              style={styles.previewCloseIconBtn}
              onPress={() => setPreviewImageUri(null)}
            >
              <Ionicons name="close-circle" size={34} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.previewImageContainer}>
            {previewImageUri ? (
              <Image
                source={{ uri: normalizeUri(previewImageUri) }}
                style={styles.previewFullImage}
                resizeMode="contain"
              />
            ) : null}
          </View>
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

  readOnlyBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEE2E2",
    borderWidth: 1,
    borderColor: "#FCA5A5",
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  readOnlyBannerText: {
    fontSize: rf(12),
    color: "#991B1B",
    fontWeight: "600" as any,
  },
  readOnlyBannerReason: {
    fontSize: rf(12),
    color: "#B91C1C",
    fontWeight: "700" as any,
    marginTop: 3,
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

  /* Deal Outcome Actions Row */
  dealActionsRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  dealWonBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#059669",
    paddingVertical: hpx(12),
    borderRadius: radius.md,
    gap: spacing.xs,
    ...shadows.card,
  },
  dealWonBtnActive: {
    backgroundColor: "#047857",
  },
  dealWonBtnText: { color: "#FFFFFF", fontWeight: "700" as any, fontSize: rf(13) },
  dealLostBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#DC2626",
    paddingVertical: hpx(12),
    borderRadius: radius.md,
    gap: spacing.xs,
    ...shadows.card,
  },
  dealLostBtnActive: {
    backgroundColor: "#B91C1C",
  },
  dealLostBtnText: { color: "#FFFFFF", fontWeight: "700" as any, fontSize: rf(13) },

  cancelModalBtn: {
    flex: 1,
    paddingVertical: hpx(12),
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  cancelModalBtnText: { color: colors.textSecondary, fontWeight: "700" as any, fontSize: rf(14) },
  confirmLostBtn: {
    flex: 2,
    paddingVertical: hpx(12),
    borderRadius: radius.md,
    backgroundColor: colors.error,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmLostBtnText: { color: "#FFFFFF", fontWeight: "700" as any, fontSize: rf(14) },

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
    backgroundColor: "rgba(0,0,0,0.95)",
    paddingTop: hpx(45),
    paddingBottom: hpx(25),
  },
  previewHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    zIndex: 10,
  },
  previewTitleText: { fontSize: rf(16), fontWeight: "700" as any, color: "#FFFFFF" },
  previewCloseIconBtn: { padding: spacing.xs },
  previewImageContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.md,
  },
  previewFullImage: {
    width: "100%",
    height: "100%",
  },
});
