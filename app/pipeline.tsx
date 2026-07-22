import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
  PipelineItem,
  PipelinePriority,
  PipelineStage,
} from "../types/pipeline";
import { showToast } from "../utils/toast";

const STAGE_CONFIG: Record<
  PipelineStage,
  { label: string; bg: string; text: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  Lead: { label: "Lead", bg: "#FEF3C7", text: "#D97706", icon: "bulb-outline" },
  Qualification: { label: "Kualifikasi", bg: "#EDE9FE", text: "#7C3AED", icon: "filter-outline" },
  Proposal: { label: "Proposal", bg: "#DBEAFE", text: "#1E40AF", icon: "document-text-outline" },
  Negotiation: { label: "Negosiasi", bg: "#E0E7FF", text: "#4F46E5", icon: "chatbubbles-outline" },
  Won: { label: "Won (Menang)", bg: "#D1FAE5", text: "#059669", icon: "checkmark-circle-outline" },
  Lost: { label: "Lost (Gagal)", bg: "#FEE2E2", text: "#DC2626", icon: "close-circle-outline" },
};

const STAGES: (PipelineStage | "All")[] = [
  "All",
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

export default function PipelineScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [pipelines, setPipelines] = useState<PipelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStage, setSelectedStage] = useState<PipelineStage | "All">("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<PipelineItem | null>(null);

  // Form State
  const [formTitle, setFormTitle] = useState("");
  const [formClient, setFormClient] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formStage, setFormStage] = useState<PipelineStage>("Lead");
  const [formPriority, setFormPriority] = useState<PipelinePriority>("Medium");
  const [formProbability, setFormProbability] = useState("50");
  const [formExpectedDate, setFormExpectedDate] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchPipelines = useCallback(async () => {
    try {
      setLoading(true);
      const data = await pipelineService.list({
        stage: selectedStage,
        search: searchQuery,
      });
      setPipelines(data);
    } catch (err: any) {
      showToast("error", "Gagal memuat pipeline", err?.message);
    } finally {
      setLoading(false);
    }
  }, [selectedStage, searchQuery]);

  useEffect(() => {
    fetchPipelines();
  }, [fetchPipelines]);

  useFocusEffect(
    useCallback(() => {
      fetchPipelines();
    }, [fetchPipelines])
  );

  // Open modal for create
  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormTitle("");
    setFormClient("");
    setFormAmount("");
    setFormStage("Lead");
    setFormPriority("Medium");
    setFormProbability("50");
    setFormExpectedDate(new Date().toISOString().split("T")[0]);
    setFormNotes("");
    setModalVisible(true);
  };

  // Open modal for edit
  const handleOpenEdit = (item: PipelineItem) => {
    setEditingItem(item);
    setFormTitle(item.title);
    setFormClient(item.client);
    setFormAmount(item.amount.toString());
    setFormStage(item.stage);
    setFormPriority(item.priority);
    setFormProbability(item.probability.toString());
    setFormExpectedDate(item.expectedCloseDate);
    setFormNotes(item.notes || "");
    setModalVisible(true);
  };

  // Handle Save (Create or Update)
  const handleSave = async () => {
    if (!formTitle.trim()) {
      showToast("error", "Judul Wajib Diisi", "Silakan masukkan nama pipeline/proyek.");
      return;
    }
    if (!formClient.trim()) {
      showToast("error", "Nama Klien Wajib Diisi", "Silakan masukkan nama klien/perusahaan.");
      return;
    }

    const numAmount = parseFloat(formAmount.replace(/[^0-9]/g, "")) || 0;
    const numProb = Math.min(100, Math.max(0, parseInt(formProbability) || 50));

    try {
      setSubmitting(true);
      if (editingItem) {
        await pipelineService.update(editingItem.id, {
          title: formTitle.trim(),
          client: formClient.trim(),
          amount: numAmount,
          stage: formStage,
          priority: formPriority,
          probability: numProb,
          expectedCloseDate: formExpectedDate.trim() || new Date().toISOString().split("T")[0],
          notes: formNotes.trim(),
        });
        showToast("success", "Berhasil Diperbarui", "Data pipeline telah diperbarui.");
      } else {
        await pipelineService.create({
          title: formTitle.trim(),
          client: formClient.trim(),
          amount: numAmount,
          stage: formStage,
          priority: formPriority,
          probability: numProb,
          expectedCloseDate: formExpectedDate.trim() || new Date().toISOString().split("T")[0],
          notes: formNotes.trim(),
        });
        showToast("success", "Berhasil Ditambahkan", "Pipeline baru telah dibuat.");
      }
      setModalVisible(false);
      fetchPipelines();
    } catch (err: any) {
      showToast("error", "Gagal Menyimpan", err?.message || "Terjadi kesalahan sistem.");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Delete
  const handleDelete = (item: PipelineItem) => {
    Alert.alert(
      "Hapus Pipeline",
      `Apakah Anda yakin ingin menghapus "${item.title}"?`,
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: async () => {
            try {
              await pipelineService.delete(item.id);
              showToast("success", "Terhapus", "Pipeline berhasil dihapus.");
              fetchPipelines();
            } catch (err: any) {
              showToast("error", "Gagal Hapus", err?.message);
            }
          },
        },
      ]
    );
  };

  // Compute Total Summary
  const totalAmount = pipelines.reduce((sum, i) => sum + i.amount, 0);
  const wonCount = pipelines.filter((i) => i.stage === "Won").length;

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.curvedHeader}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => (router.canGoBack() ? router.back() : router.replace("/(tabs)/action"))}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Pipeline Proyek</Text>
          <Text style={styles.headerSub}>Manajemen Prospek, Deal, & Opporunity</Text>
        </View>

        <TouchableOpacity style={styles.addHeaderBtn} onPress={handleOpenCreate}>
          <Ionicons name="add" size={26} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Metric Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total Potential Value</Text>
            <Text style={styles.summaryValue}>{formatRupiah(totalAmount)}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <View style={styles.subSummary}>
              <Text style={styles.subSummaryNum}>{pipelines.length}</Text>
              <Text style={styles.subSummaryLabel}>Total Items</Text>
            </View>
            <View style={styles.subSummary}>
              <Text style={[styles.subSummaryNum, { color: colors.success }]}>{wonCount}</Text>
              <Text style={styles.subSummaryLabel}>Won Deals</Text>
            </View>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari judul pipeline atau nama klien..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Stage Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterContent}
        >
          {STAGES.map((stg) => {
            const isSelected = selectedStage === stg;
            return (
              <TouchableOpacity
                key={stg}
                style={[
                  styles.filterChip,
                  isSelected && styles.filterChipActive,
                ]}
                onPress={() => setSelectedStage(stg)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    isSelected && styles.filterChipTextActive,
                  ]}
                >
                  {stg === "All" ? "Semua Stage" : stg}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Pipeline List */}
        {loading ? (
          <View style={styles.centerLoading}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Memuat pipeline...</Text>
          </View>
        ) : pipelines.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="folder-open-outline" size={48} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>Belum Ada Pipeline</Text>
            <Text style={styles.emptySub}>
              Klik tombol (+) di kanan atas atau tombol di bawah untuk menambahkan pipeline baru.
            </Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={handleOpenCreate}>
              <Ionicons name="add-circle" size={20} color="#FFFFFF" />
              <Text style={styles.emptyBtnText}>Tambah Pipeline Baru</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.listContainer}>
            {pipelines.map((item) => {
              const cfg = STAGE_CONFIG[item.stage] || STAGE_CONFIG.Lead;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={styles.itemCard}
                  onPress={() => router.push(`/pipeline-detail?id=${item.id}`)}
                  activeOpacity={0.85}
                >
                  {/* Card Header Row */}
                  <View style={styles.cardHeader}>
                    <View style={[styles.stageBadge, { backgroundColor: cfg.bg }]}>
                      <Ionicons name={cfg.icon} size={14} color={cfg.text} />
                      <Text style={[styles.stageBadgeText, { color: cfg.text }]}>
                        {cfg.label}
                      </Text>
                    </View>

                    <View style={styles.cardActions}>
                      <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={(e) => {
                          e?.stopPropagation?.();
                          handleOpenEdit(item);
                        }}
                      >
                        <Ionicons name="create-outline" size={18} color={colors.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={(e) => {
                          e?.stopPropagation?.();
                          handleDelete(item);
                        }}
                      >
                        <Ionicons name="trash-outline" size={18} color={colors.error} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Title & Client */}
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <View style={styles.clientRow}>
                    <Ionicons name="business-outline" size={14} color={colors.textMuted} />
                    <Text style={styles.clientText}>{item.client}</Text>
                  </View>

                  {/* Amount Value */}
                  <View style={styles.amountBox}>
                    <Text style={styles.amountLabel}>Nilai Prospek:</Text>
                    <Text style={styles.amountValue}>{formatRupiah(item.amount)}</Text>
                  </View>

                  {/* Progress Bar & Probability */}
                  <View style={styles.probContainer}>
                    <View style={styles.probHeader}>
                      <Text style={styles.probLabel}>Probabilitas Win</Text>
                      <Text style={styles.probValue}>{item.probability}%</Text>
                    </View>
                    <View style={styles.probBarBg}>
                      <View
                        style={[
                          styles.probBarFill,
                          {
                            width: `${item.probability}%`,
                            backgroundColor:
                              item.probability > 70
                                ? colors.success
                                : item.probability > 30
                                ? colors.amber
                                : colors.error,
                          },
                        ]}
                      />
                    </View>
                  </View>

                  {/* Footer metadata */}
                  <View style={styles.cardFooter}>
                    <View style={styles.footerItem}>
                      <Ionicons name="calendar-outline" size={13} color={colors.textMuted} />
                      <Text style={styles.footerText}>Target: {item.expectedCloseDate}</Text>
                    </View>
                    <View style={styles.priorityBadge}>
                      <Text style={styles.priorityText}>Pri: {item.priority}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Floating Add Button */}
      <TouchableOpacity style={styles.fab} onPress={handleOpenCreate} activeOpacity={0.85}>
        <Ionicons name="add" size={30} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Create / Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingItem ? "Edit Pipeline" : "Tambah Pipeline Baru"}
              </Text>
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
                  placeholder="Contoh: Pengadaan Server UNOTEK 2026"
                  placeholderTextColor={colors.textMuted}
                  value={formTitle}
                  onChangeText={setFormTitle}
                />
              </View>

              {/* Form Input: Client */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Nama Klien / Perusahaan *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Contoh: PT Bank Nusantara"
                  placeholderTextColor={colors.textMuted}
                  value={formClient}
                  onChangeText={setFormClient}
                />
              </View>

              {/* Form Input: Amount */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Nilai Potential (Rp)</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Contoh: 150000000"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                  value={formAmount}
                  onChangeText={setFormAmount}
                />
              </View>

              {/* Form Input: Stage Selection */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Tahapan (Stage)</Text>
                <View style={styles.chipRow}>
                  {STAGES.filter((s) => s !== "All").map((stg) => {
                    const isSelected = formStage === stg;
                    return (
                      <TouchableOpacity
                        key={stg}
                        style={[styles.selectChip, isSelected && styles.selectChipActive]}
                        onPress={() => setFormStage(stg as PipelineStage)}
                      >
                        <Text style={[styles.selectChipText, isSelected && styles.selectChipTextActive]}>
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
                        <Text style={[styles.selectChipText, isSelected && styles.selectChipTextActive]}>
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
                        <Text style={[styles.selectChipText, isSelected && styles.selectChipTextActive]}>
                          {p}%
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Form Input: Date */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Target Selesai / Close Date (YYYY-MM-DD)</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="2026-08-30"
                  placeholderTextColor={colors.textMuted}
                  value={formExpectedDate}
                  onChangeText={setFormExpectedDate}
                />
              </View>

              {/* Form Input: Notes */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Catatan & Keterangan</Text>
                <TextInput
                  style={[styles.formInput, { height: hpx(70), textAlignVertical: "top" }]}
                  placeholder="Tuliskan perkembangan negosiasi atau catatan tambahan..."
                  placeholderTextColor={colors.textMuted}
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
                <Text style={styles.saveBtnText}>
                  {editingItem ? "Simpan Perubahan" : "Tambah Pipeline"}
                </Text>
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
  backBtn: {
    padding: spacing.xs,
  },
  headerContent: { flex: 1, alignItems: "center" },
  headerTitle: { fontSize: rf(20), fontWeight: "800" as any, color: "#FFFFFF" },
  headerSub: {
    fontSize: rf(12),
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: hpx(2),
  },
  addHeaderBtn: {
    padding: spacing.xs,
  },
  scroll: {
    paddingHorizontal: spacing["2xl"],
    paddingTop: hpx(16),
    paddingBottom: hpx(90),
  },

  /* Summary Card */
  summaryCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  summaryItem: {
    alignItems: "center",
    marginBottom: spacing.md,
  },
  summaryLabel: { fontSize: rf(12), color: colors.textMuted },
  summaryValue: {
    fontSize: rf(22),
    fontWeight: "800" as any,
    color: colors.primary,
    marginTop: hpx(4),
  },
  summaryDivider: { height: 1, backgroundColor: colors.border, marginBottom: spacing.md },
  summaryRow: { flexDirection: "row", justifyContent: "space-around" },
  subSummary: { alignItems: "center" },
  subSummaryNum: { fontSize: rf(16), fontWeight: "800" as any, color: colors.textPrimary },
  subSummaryLabel: { fontSize: rf(11), color: colors.textMuted, marginTop: 2 },

  /* Search Box */
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: sizes.searchHeight,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  searchInput: { flex: 1, fontSize: rf(14), color: colors.textPrimary },

  /* Filter Scroll */
  filterScroll: { marginBottom: spacing.lg },
  filterContent: { gap: spacing.xs, paddingRight: spacing.md },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: { fontSize: rf(12), color: colors.textSecondary, fontWeight: "600" as any },
  filterChipTextActive: { color: "#FFFFFF", fontWeight: "700" as any },

  /* Loading & Empty */
  centerLoading: { paddingVertical: hpx(40), alignItems: "center" },
  loadingText: { marginTop: spacing.md, color: colors.textMuted, fontSize: rf(13) },
  emptyState: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing["2xl"],
    alignItems: "center",
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyTitle: { fontSize: rf(16), fontWeight: "700" as any, color: colors.textPrimary, marginTop: spacing.md },
  emptySub: { fontSize: rf(12), color: colors.textMuted, textAlign: "center", marginTop: spacing.xs, lineHeight: rf(18) },
  emptyBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    marginTop: spacing.lg,
    gap: spacing.xs,
  },
  emptyBtnText: { color: "#FFFFFF", fontWeight: "700" as any, fontSize: rf(13) },

  /* Pipeline Cards */
  listContainer: { gap: spacing.md },
  itemCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  stageBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.sm,
    gap: 4,
  },
  stageBadgeText: { fontSize: rf(11), fontWeight: "700" as any },
  cardActions: { flexDirection: "row", gap: spacing.xs },
  actionBtn: { padding: spacing.xs },
  cardTitle: { fontSize: rf(15), fontWeight: "700" as any, color: colors.textPrimary, marginTop: spacing.xs },
  clientRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 3 },
  clientText: { fontSize: rf(12), color: colors.textMuted },
  amountBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    padding: spacing.sm,
    borderRadius: radius.sm,
    marginTop: spacing.md,
  },
  amountLabel: { fontSize: rf(12), color: colors.textMuted },
  amountValue: { fontSize: rf(14), fontWeight: "800" as any, color: colors.primary },
  probContainer: { marginTop: spacing.md },
  probHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  probLabel: { fontSize: rf(11), color: colors.textMuted },
  probValue: { fontSize: rf(11), fontWeight: "700" as any, color: colors.textPrimary },
  probBarBg: { height: hpx(6), backgroundColor: colors.border, borderRadius: radius.full, overflow: "hidden" },
  probBarFill: { height: "100%", borderRadius: radius.full },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.md,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  footerText: { fontSize: rf(11), color: colors.textMuted },
  priorityBadge: { backgroundColor: colors.surface, paddingHorizontal: spacing.xs, paddingVertical: 2, borderRadius: radius.sm },
  priorityText: { fontSize: rf(10), fontWeight: "700" as any, color: colors.textSecondary },

  /* FAB */
  fab: {
    position: "absolute",
    right: spacing["2xl"],
    bottom: hpx(30),
    width: wpx(56),
    height: wpx(56),
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.elevated,
  },

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
});
