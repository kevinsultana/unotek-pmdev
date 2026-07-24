import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
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
  wpx
} from "../src/constants/theme";
import type { CrmStage, PipelineItem } from "../types/pipeline";
import { showToast } from "../utils/toast";

const STAGE_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  Lead: { label: "Lead", bg: "#FEF3C7", text: "#D97706", icon: "bulb-outline" },
  Qualification: { label: "Kualifikasi", bg: "#EDE9FE", text: "#7C3AED", icon: "filter-outline" },
  Qualified: { label: "Kualifikasi", bg: "#EDE9FE", text: "#7C3AED", icon: "filter-outline" },
  Opportunity: { label: "Opportunity", bg: "#DBEAFE", text: "#1E40AF", icon: "briefcase-outline" },
  Proposal: { label: "Proposal", bg: "#DBEAFE", text: "#1E40AF", icon: "document-text-outline" },
  Proposition: { label: "Proposal", bg: "#DBEAFE", text: "#1E40AF", icon: "document-text-outline" },
  Negotiation: { label: "Negosiasi", bg: "#E0E7FF", text: "#4F46E5", icon: "chatbubbles-outline" },
  Won: { label: "Won (Menang)", bg: "#D1FAE5", text: "#059669", icon: "checkmark-circle-outline" },
  Lost: { label: "Lost (Gagal)", bg: "#FEE2E2", text: "#DC2626", icon: "close-circle-outline" },
};

const DEFAULT_STAGES: CrmStage[] = [
  { id: "all", name: "Semua Stage" },
  { id: 1, name: "Lead" },
  { id: 2, name: "Qualification" },
  { id: 3, name: "Proposal" },
  { id: 4, name: "Negotiation" },
  { id: 5, name: "Won" },
  { id: 6, name: "Lost" },
];

function formatRupiah(amount: number): string {
  return "Rp " + amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export default function PipelineScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [pipelines, setPipelines] = useState<PipelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stages, setStages] = useState<CrmStage[]>(DEFAULT_STAGES);
  const [selectedStage, setSelectedStage] = useState<CrmStage>(DEFAULT_STAGES[0]);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch Stages from API
  const fetchStages = useCallback(async () => {
    try {
      const fetchedStages = await pipelineService.fetchStages();
      if (fetchedStages && fetchedStages.length > 0) {
        const allItem: CrmStage = { id: "all", name: "Semua Stage" };
        setStages([allItem, ...fetchedStages]);
      }
    } catch (err) {
      console.warn("Failed to load CRM stages from API:", err);
    }
  }, []);

  // Fetch Pipelines list with search & stage filter
  const fetchPipelines = useCallback(async () => {
    try {
      setLoading(true);
      const stgNameLower = selectedStage.name.toLowerCase();
      const isLostStage = stgNameLower.includes("lost");
      const isWonStage = stgNameLower.includes("won");

      const stageIdParam = (selectedStage.id !== "all" && !isLostStage && !isWonStage) ? selectedStage.id : undefined;
      const stageNameParam = selectedStage.id === "all" ? "All" : selectedStage.name;
      const wonStatusParam = isLostStage ? "lost" : isWonStage ? "won" : undefined;

      const data = await pipelineService.list({
        stage: stageNameParam,
        stage_id: stageIdParam,
        won_status: wonStatusParam,
        search: searchQuery,
      });
      setPipelines(data);
    } catch (err: any) {
      showToast("error", "Gagal memuat CRM Leads", err?.message);
    } finally {
      setLoading(false);
    }
  }, [selectedStage, searchQuery]);

  useEffect(() => {
    fetchStages();
  }, [fetchStages]);

  useEffect(() => {
    fetchPipelines();
  }, [fetchPipelines]);

  useFocusEffect(
    useCallback(() => {
      fetchPipelines();
    }, [fetchPipelines])
  );

  // Open full-screen form for Create
  const handleOpenCreate = () => {
    router.push("/pipeline-form");
  };

  // Open full-screen form for Edit
  const handleOpenEdit = (item: PipelineItem) => {
    router.push({ pathname: "/pipeline-form", params: { id: item.id } });
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
              showToast("success", "Terhapus", "CRM Lead berhasil dihapus.");
              fetchPipelines();
            } catch (err: any) {
              showToast("error", "Gagal Hapus", err?.message);
            }
          },
        },
      ]
    );
  };

  // Handle Pull to Refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchStages(), fetchPipelines()]);
    setRefreshing(false);
  }, [fetchStages, fetchPipelines]);

  // Compute Total Summary
  const totalAmount = pipelines.reduce((sum, i) => sum + i.amount, 0);
  const wonCount = pipelines.filter(
    (i) => i.stage === "Won" || i.wonStatus === "won"
  ).length;

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
          <Text style={styles.headerTitle}>CRM Leads & Pipeline</Text>
          <Text style={styles.headerSub}>Manajemen Prospek, Deal, & Opportunity</Text>
        </View>

        <TouchableOpacity style={styles.addHeaderBtn} onPress={handleOpenCreate}>
          <Ionicons name="add" size={26} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* Metric Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total Potential Revenue</Text>
            <Text style={styles.summaryValue}>{formatRupiah(totalAmount)}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <View style={styles.subSummary}>
              <Text style={styles.subSummaryNum}>{pipelines.length}</Text>
              <Text style={styles.subSummaryLabel}>Total Leads</Text>
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
            placeholder="Cari prospek atau nama klien..."
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

        {/* Stage Filter Chips (Dynamic from API / Default) */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterContent}
        >
          {stages.map((stg) => {
            const isSelected = selectedStage.id === stg.id;
            return (
              <TouchableOpacity
                key={String(stg.id)}
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
                  {stg.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Pipeline List */}
        {loading ? (
          <View style={styles.centerLoading}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Memuat daftar CRM Leads...</Text>
          </View>
        ) : pipelines.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="folder-open-outline" size={48} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>Belum Ada CRM Leads</Text>
            <Text style={styles.emptySub}>
              Klik tombol (+) di kanan atas atau tombol di bawah untuk menambahkan prospek baru.
            </Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={handleOpenCreate}>
              <Ionicons name="add-circle" size={20} color="#FFFFFF" />
              <Text style={styles.emptyBtnText}>Tambah Lead Baru</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.listContainer}>
            {pipelines.map((item) => {
              const isLost = item.wonStatus === "lost" || item.stage === "Lost";
              const cfg =
                STAGE_CONFIG[item.stage] || {
                  label: item.stage,
                  bg: "#DBEAFE",
                  text: colors.primary,
                  icon: "bulb-outline",
                };
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
                        {cfg.label || item.stage}
                      </Text>
                    </View>

                    <View style={styles.cardActions}>
                      {!isLost ? (
                        <TouchableOpacity
                          style={styles.actionBtn}
                          onPress={(e) => {
                            e?.stopPropagation?.();
                            handleOpenEdit(item);
                          }}
                        >
                          <Ionicons name="create-outline" size={18} color={colors.primary} />
                        </TouchableOpacity>
                      ) : (
                        <View style={styles.actionBtn}>
                          <Ionicons name="lock-closed-outline" size={16} color={colors.textMuted} />
                        </View>
                      )}
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

                  {/* Lost Reason Badge if Lost */}
                  {isLost && (item.lostReason || item.lost_feedback) ? (
                    <View style={styles.lostReasonBox}>
                      <Ionicons name="alert-circle-outline" size={14} color={colors.error} />
                      <Text style={styles.lostReasonBoxText} numberOfLines={1}>
                        Alasan Lost: {item.lostReason || item.lost_feedback}
                      </Text>
                    </View>
                  ) : null}

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
  lostReasonBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEE2E2",
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
    marginTop: spacing.xs,
    gap: 4,
  },
  lostReasonBoxText: {
    fontSize: rf(11),
    color: colors.error,
    fontWeight: "700" as any,
    flex: 1,
  },
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
    width: sizes.fabSize,
    height: sizes.fabSize,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.elevated,
  },
});
