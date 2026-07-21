import { Ionicons } from "@expo/vector-icons";
import { Stack, useFocusEffect, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  RefreshControl,
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
import type { MaintenanceRequest } from "../types/maintenance";
import { showToast } from "../utils/toast";

const STATUS_MAP: Record<
  string,
  { label: string; c: string; b: string; icon: string }
> = {
  draft: { label: "Draft", c: "#6B7280", b: "#F3F4F6", icon: "document-text-outline" },
  submitted: { label: "Diajukan", c: "#2563EB", b: "#DBEAFE", icon: "paper-plane-outline" },
  in_progress: { label: "Diproses", c: "#7C3AED", b: "#EDE9FE", icon: "construct-outline" },
  done: { label: "Selesai", c: "#059669", b: "#D1FAE5", icon: "checkmark-circle-outline" },
  refused: { label: "Ditolak", c: "#DC2626", b: "#FEE2E2", icon: "close-circle-outline" },
};

const URGENCY_MAP: Record<
  string,
  { label: string; c: string; b: string }
> = {
  low: { label: "Low", c: "#059669", b: "#D1FAE5" },
  medium: { label: "Medium", c: "#D97706", b: "#FEF3C7" },
  high: { label: "High", c: "#E11D48", b: "#FFE4E6" },
  critical: { label: "Critical", c: "#DC2626", b: "#FEE2E2" },
};

const CATEGORY_MAP: Record<
  string,
  { label: string; icon: string; color: string; bg: string }
> = {
  hardware: { label: "Hardware", icon: "laptop-outline", color: "#1E40AF", bg: "#DBEAFE" },
  software: { label: "Software", icon: "code-working-outline", color: "#7C3AED", bg: "#EDE9FE" },
  facility: { label: "Fasilitas", icon: "business-outline", color: "#D97706", bg: "#FEF3C7" },
  other: { label: "Lainnya", icon: "help-circle-outline", color: "#6B7280", bg: "#F3F4F6" },
};

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

export default function MaintenanceScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // State Management
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Detail Modal States
  const [selectedDetail, setSelectedDetail] = useState<MaintenanceRequest | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [activePreviewUri, setActivePreviewUri] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<
    "Semua" | "Draft" | "Diajukan" | "Diproses" | "Selesai" | "Ditolak"
  >("Semua");

  const [showStatusPicker, setShowStatusPicker] = useState(false);

  const { profile, isLoading: isProfileLoading } = useProfile();

  // Load Data
  const fetchRequests = useCallback(async (showIndicator = true) => {
    const userId = profile?.user?.id;
    if (!userId) return;
    if (showIndicator) setIsLoading(true);
    try {
      const data = await maintenanceService.list({ owner_user_id: userId });
      setRequests(data || []);
    } catch (err: any) {
      console.error("fetchRequests error:", err);
      showToast("error", "Error", err?.message || "Gagal memuat data maintenance.");
    } finally {
      setIsLoading(false);
    }
  }, [profile?.user?.id]);

  useFocusEffect(
    useCallback(() => {
      if (profile?.user?.id) {
        fetchRequests(false);
      }
    }, [fetchRequests, profile?.user?.id])
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchRequests(false);
    setIsRefreshing(false);
  };

  // Actions
  const handleShowDetail = async (id: number) => {
    setIsDetailLoading(true);
    setShowDetailModal(true);
    try {
      const detail = await maintenanceService.getById(id);
      setSelectedDetail(detail);
    } catch (err: any) {
      showToast("error", "Gagal", err?.message || "Gagal memuat detail pengajuan.");
      setShowDetailModal(false);
    } finally {
      setIsDetailLoading(false);
    }
  };

  const handleEdit = (item: MaintenanceRequest) => {
    setShowDetailModal(false);
    router.push({
      pathname: "/maintenance-form",
      params: { id: item.id },
    });
  };

  const handleDelete = (id: number) => {
    Alert.alert(
      "Hapus Draft",
      "Apakah Anda yakin ingin menghapus draft pengajuan maintenance ini?",
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: async () => {
            try {
              await maintenanceService.delete(id);
              showToast("success", "Berhasil", "Draft pengajuan berhasil dihapus.");
              setShowDetailModal(false);
              fetchRequests();
            } catch (err: any) {
              showToast("error", "Gagal", err?.message || "Gagal menghapus draft");
            }
          },
        },
      ]
    );
  };

  const handleSubmitRequest = (id: number) => {
    Alert.alert(
      "Kirim Pengajuan",
      "Kirim laporan maintenance ini untuk ditindaklanjuti?",
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Kirim",
          onPress: async () => {
            try {
              await maintenanceService.submit(id);
              showToast("success", "Berhasil", "Pengajuan maintenance berhasil dikirim.");
              setShowDetailModal(false);
              fetchRequests();
            } catch (err: any) {
              showToast("error", "Gagal", err?.message || "Gagal mengirim pengajuan");
            }
          },
        },
      ]
    );
  };

  // Helper date display
  const toDisplayDate = (dateStr: string) => {
    if (!dateStr) return "";
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
  // Filter Logic
  const filteredRequests = requests.filter((item) => {
    // 1. Status Filter
    if (activeTab !== "Semua") {
      const mappedState =
        activeTab === "Draft"
          ? "draft"
          : activeTab === "Diajukan"
            ? "submitted"
            : activeTab === "Diproses"
              ? "in_progress"
              : activeTab === "Selesai"
                ? "done"
                : activeTab === "Ditolak"
                  ? "refused"
                  : "";
      if (item.state !== mappedState) return false;
    }

    // 2. Search Query Filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const assetName = item.asset_name?.toLowerCase() || "";
      const assetCode = item.asset_code?.toLowerCase() || "";
      const title = item.title?.toLowerCase() || "";
      return (
        assetName.includes(query) ||
        assetCode.includes(query) ||
        title.includes(query)
      );
    }

    return true;
  });

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

          <Text style={styles.headerTitle}>Maintenance Aset</Text>

          <View style={styles.headerRightActions}>
            <TouchableOpacity
              onPress={() => router.push("/maintenance-form")}
              style={styles.headerActionBtn}
              activeOpacity={0.7}
            >
              <Ionicons name="add" size={wpx(24)} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Content Area */}
      <View style={styles.filterSection}>
        {/* Search & Filter Row */}
        <View style={styles.searchFilterRow}>
          <View style={styles.searchBar}>
            <Ionicons
              name="search-outline"
              size={18}
              color={colors.textMuted}
              style={{ marginRight: spacing.sm }}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Cari nama aset, kode, atau masalah..."
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons name="close-circle" size={16} color={colors.textMuted} />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Filter Status Select Button */}
          <TouchableOpacity
            style={[
              styles.filterIconBtn,
              activeTab !== "Semua" && styles.filterIconBtnActive,
            ]}
            onPress={() => setShowStatusPicker(true)}
            activeOpacity={0.7}
          >
            <Ionicons
              name="funnel-outline"
              size={20}
              color={activeTab !== "Semua" ? "#FFFFFF" : colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        {/* Selected Filter Indicator Pill */}
        {activeTab !== "Semua" && (
          <View style={styles.activeFilterPillContainer}>
            <View style={styles.activeFilterPill}>
              <Text style={styles.activeFilterPillText}>Status: {activeTab}</Text>
              <TouchableOpacity onPress={() => setActiveTab("Semua")}>
                <Ionicons name="close" size={14} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* List content */}
      {isLoading || isProfileLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Memuat pengajuan...</Text>
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[styles.listContainer, { paddingBottom: insets.bottom + spacing.xl }]}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        >
          {filteredRequests.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconBg}>
                <Ionicons name="build-outline" size={wpx(48)} color={colors.textMuted} />
              </View>
              <Text style={styles.emptyText}>Tidak ada pengajuan maintenance.</Text>
              <TouchableOpacity
                style={styles.emptyActionBtn}
                onPress={() => router.push("/maintenance-form")}
              >
                <Text style={styles.emptyActionText}>Buat Pengajuan Baru</Text>
              </TouchableOpacity>
            </View>
          ) : (
            filteredRequests.map((item) => {
              const statusConfig = STATUS_MAP[item.state] || STATUS_MAP.draft;
              const urgencyConfig = URGENCY_MAP[item.urgency] || URGENCY_MAP.low;
              const categoryConfig = CATEGORY_MAP[item.category] || CATEGORY_MAP.other;

              return (
                <TouchableOpacity
                  key={item.id}
                  style={styles.card}
                  activeOpacity={0.7}
                  onPress={() => handleShowDetail(item.id)}
                >
                  {/* Card Header */}
                  <View style={styles.cardHeader}>
                    <View style={styles.categoryRow}>
                      <View
                        style={[
                          styles.categoryIconContainer,
                          { backgroundColor: categoryConfig.bg },
                        ]}
                      >
                        <Ionicons
                          name={categoryConfig.icon as any}
                          size={16}
                          color={categoryConfig.color}
                        />
                      </View>
                      <Text style={styles.categoryLabelText}>
                        {categoryConfig.label}
                      </Text>
                    </View>

                    <View style={styles.headerBadges}>
                      {/* Urgency Badge */}
                      <View
                        style={[
                          styles.badge,
                          { backgroundColor: urgencyConfig.b, marginRight: spacing.xs },
                        ]}
                      >
                        <Text style={[styles.badgeText, { color: urgencyConfig.c }]}>
                          {urgencyConfig.label}
                        </Text>
                      </View>

                      {/* Status Badge */}
                      <View
                        style={[styles.badge, { backgroundColor: statusConfig.b }]}
                      >
                        <Ionicons
                          name={statusConfig.icon as any}
                          size={11}
                          color={statusConfig.c}
                          style={{ marginRight: 2 }}
                        />
                        <Text style={[styles.badgeText, { color: statusConfig.c }]}>
                          {statusConfig.label}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Card Body */}
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <Text style={styles.assetInfoText}>
                    Aset: {item.asset_name} ({item.asset_code})
                  </Text>

                  {/* Card Footer */}
                  <View style={styles.cardFooter}>
                    <Text style={styles.cardDate}>{toDisplayDate(item.date)}</Text>
                    <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      )}

      {/* Floating Action Button (FAB) */}
      {!isLoading && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push("/maintenance-form")}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      )}

      {/* Status Picker Modal */}
      <Modal
        visible={showStatusPicker}
        animationType="fade"
        transparent
        onRequestClose={() => setShowStatusPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowStatusPicker(false)} />
          <View style={styles.modalStatusSelectContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Status</Text>
              <TouchableOpacity onPress={() => setShowStatusPicker(false)}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 300 }} showsVerticalScrollIndicator={false}>
              {(["Semua", "Draft", "Diajukan", "Diproses", "Selesai", "Ditolak"] as const).map(
                (tab) => (
                  <TouchableOpacity
                    key={tab}
                    style={[
                      styles.categoryItem,
                      activeTab === tab && styles.categoryItemActive,
                    ]}
                    onPress={() => {
                      setActiveTab(tab);
                      setShowStatusPicker(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.categoryItemText,
                        activeTab === tab && styles.categoryItemTextActive,
                      ]}
                    >
                      {tab}
                    </Text>
                    {activeTab === tab && (
                      <Ionicons name="checkmark" size={16} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                )
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Detail Maintenance Modal */}
      <Modal
        visible={showDetailModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowDetailModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowDetailModal(false)} />
          <View style={styles.detailModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Detail Maintenance</Text>
              <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {isDetailLoading ? (
              <View style={{ paddingVertical: spacing.xl, alignItems: "center" }}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={{ marginTop: spacing.sm, color: colors.textMuted }}>
                  Memuat detail...
                </Text>
              </View>
            ) : selectedDetail ? (
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.detailScroll}
              >
                {/* Title */}
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Judul Pengajuan</Text>
                  <Text style={styles.detailValue}>{selectedDetail.title}</Text>
                </View>

                {/* Status & Urgency */}
                <View style={styles.detailGridRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.detailLabel}>Status</Text>
                    {(() => {
                      const stat = STATUS_MAP[selectedDetail.state] || STATUS_MAP.draft;
                      return (
                        <View
                          style={[
                            styles.badge,
                            { backgroundColor: stat.b, alignSelf: "flex-start", marginTop: 4 },
                          ]}
                        >
                          <Ionicons
                            name={stat.icon as any}
                            size={11}
                            color={stat.c}
                            style={{ marginRight: 3 }}
                          />
                          <Text style={[styles.badgeText, { color: stat.c, fontWeight: "700" }]}>
                            {stat.label}
                          </Text>
                        </View>
                      );
                    })()}
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.detailLabel}>Tingkat Urgensi</Text>
                    {(() => {
                      const urg = URGENCY_MAP[selectedDetail.urgency] || URGENCY_MAP.low;
                      return (
                        <View
                          style={[
                            styles.badge,
                            { backgroundColor: urg.b, alignSelf: "flex-start", marginTop: 4 },
                          ]}
                        >
                          <Text style={[styles.badgeText, { color: urg.c, fontWeight: "700" }]}>
                            {urg.label}
                          </Text>
                        </View>
                      );
                    })()}
                  </View>
                </View>

                {/* Category */}
                <View style={styles.detailGridRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.detailLabel}>Kategori</Text>
                    {(() => {
                      const cat = CATEGORY_MAP[selectedDetail.category] || CATEGORY_MAP.other;
                      return (
                        <View
                          style={[
                            styles.badge,
                            { backgroundColor: cat.bg, alignSelf: "flex-start", marginTop: 4 },
                          ]}
                        >
                          <Text style={[styles.badgeText, { color: cat.color, fontWeight: "700" }]}>
                            {cat.label}
                          </Text>
                        </View>
                      );
                    })()}
                  </View>

                  {selectedDetail.problem_category_name ? (
                    <View style={{ flex: 1 }}>
                      <Text style={styles.detailLabel}>Kategori Detail</Text>
                      <View
                        style={[
                          styles.badge,
                          { backgroundColor: colors.primaryLight, alignSelf: "flex-start", marginTop: 4 },
                        ]}
                      >
                        <Text style={[styles.badgeText, { color: colors.primary, fontWeight: "700" }]}>
                          {selectedDetail.problem_category_name}
                        </Text>
                      </View>
                    </View>
                  ) : null}
                </View>

                {/* Asset info */}
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Nama Aset</Text>
                  <Text style={styles.detailValue}>{selectedDetail.asset_name}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Kode Inventaris / SN</Text>
                  <Text style={styles.detailValue}>{selectedDetail.asset_code}</Text>
                </View>

                {/* Date */}
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Tanggal Pengajuan</Text>
                  <Text style={styles.detailValue}>{toDisplayDate(selectedDetail.date)}</Text>
                </View>

                {/* Description */}
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Deskripsi Kerusakan</Text>
                  <Text style={styles.detailValueDesc}>{stripHtml(selectedDetail.description) || "-"}</Text>
                </View>

                {/* Photos */}
                {((selectedDetail.attachments && selectedDetail.attachments.length > 0) || (selectedDetail.images && selectedDetail.images.length > 0)) ? (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Foto Bukti Kerusakan</Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={{ gap: spacing.sm, paddingTop: spacing.xs }}
                    >
                      {selectedDetail.attachments && selectedDetail.attachments.length > 0 ? (
                        selectedDetail.attachments.map((att) => (
                          <TouchableOpacity
                            key={att.id}
                            activeOpacity={0.9}
                            onPress={() => setActivePreviewUri(att.url)}
                          >
                            <Image source={{ uri: att.url }} style={styles.detailImageThumb} />
                          </TouchableOpacity>
                        ))
                      ) : (
                        selectedDetail.images?.map((imgUri, index) => (
                          <TouchableOpacity
                            key={index}
                            activeOpacity={0.9}
                            onPress={() => setActivePreviewUri(imgUri)}
                          >
                            <Image source={{ uri: imgUri }} style={styles.detailImageThumb} />
                          </TouchableOpacity>
                        ))
                      )}
                    </ScrollView>
                  </View>
                ) : null}

                {/* Technician reply notes */}
                {selectedDetail.notes ? (
                  <View style={styles.notesSection}>
                    <View style={styles.notesHeader}>
                      <Ionicons
                        name="chatbubble-ellipses-outline"
                        size={16}
                        color={colors.primary}
                        style={{ marginRight: 6 }}
                      />
                      <Text style={styles.notesTitle}>Catatan Penanganan Teknisi</Text>
                    </View>
                    <Text style={styles.notesBody}>{stripHtml(selectedDetail.notes) || "-"}</Text>
                  </View>
                ) : null}

                {/* Action Buttons for Draft & Submitted */}
                {(selectedDetail.state === "draft" || selectedDetail.state === "submitted") && (
                  <View style={styles.detailActionBtnRow}>
                    {selectedDetail.state === "draft" && (
                      <TouchableOpacity
                        style={[styles.btnOutline, { flex: 1, borderColor: colors.error }]}
                        onPress={() => handleDelete(selectedDetail.id)}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={16}
                          color={colors.error}
                          style={{ marginRight: 4 }}
                        />
                        <Text style={[styles.btnText, { color: colors.error }]}>Hapus</Text>
                      </TouchableOpacity>
                    )}

                    <TouchableOpacity
                      style={[styles.btnOutline, { flex: 1, borderColor: colors.primary }]}
                      onPress={() => handleEdit(selectedDetail)}
                    >
                      <Ionicons
                        name="create-outline"
                        size={16}
                        color={colors.primary}
                        style={{ marginRight: 4 }}
                      />
                      <Text style={[styles.btnText, { color: colors.primary }]}>Ubah</Text>
                    </TouchableOpacity>

                    {selectedDetail.state === "draft" && (
                      <TouchableOpacity
                        style={[styles.btnSolid, { flex: 1.5, backgroundColor: colors.primary }]}
                        onPress={() => handleSubmitRequest(selectedDetail.id)}
                      >
                        <Ionicons
                          name="paper-plane-outline"
                          size={16}
                          color="#FFFFFF"
                          style={{ marginRight: 6 }}
                        />
                        <Text style={[styles.btnText, { color: "#FFFFFF" }]}>Kirim</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </ScrollView>
            ) : null}
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
    fontSize: rf(18),
    fontWeight: "800" as any,
    color: "#FFFFFF",
  },
  headerRightActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerActionBtn: {
    width: sizes.headerBtnWidth,
    height: sizes.headerBtn,
    borderRadius: radius.full,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: spacing.sm,
  },

  // Filters Section
  filterSection: {
    paddingHorizontal: spacing["2xl"],
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  searchFilterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  searchBar: {
    flex: 1,
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
  filterIconBtn: {
    width: sizes.searchHeight,
    height: sizes.searchHeight,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: "center",
    alignItems: "center",
  },
  filterIconBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  activeFilterPillContainer: {
    flexDirection: "row",
    marginTop: spacing.sm,
  },
  activeFilterPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: hpx(4),
    borderRadius: radius.sm,
    gap: spacing.xs,
  },
  activeFilterPillText: {
    fontSize: rf(11),
    fontWeight: "700" as any,
    color: colors.primary,
  },

  // Loading & Empty States
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing["2xl"],
  },
  loadingText: {
    marginTop: spacing.sm,
    fontSize: rf(13),
    color: colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: hpx(80),
    paddingHorizontal: spacing["2xl"],
  },
  emptyIconBg: {
    width: wpx(90),
    height: wpx(90),
    borderRadius: radius.full,
    backgroundColor: colors.border,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  emptyText: {
    fontSize: rf(14),
    color: colors.textMuted,
    textAlign: "center",
    marginBottom: spacing.lg,
  },
  emptyActionBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: hpx(12),
    borderRadius: radius.md,
    ...shadows.elevated,
    shadowColor: colors.primary,
  },
  emptyActionText: {
    color: "#FFFFFF",
    fontSize: rf(13),
    fontWeight: "700" as any,
  },

  // List and Cards
  listContainer: {
    paddingHorizontal: spacing["2xl"],
    paddingTop: spacing.sm,
    gap: spacing.md,
  },
  card: {
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
    marginBottom: spacing.sm,
  },
  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  categoryIconContainer: {
    width: wpx(26),
    height: wpx(26),
    borderRadius: radius.full,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.xs,
  },
  categoryLabelText: {
    fontSize: rf(11),
    fontWeight: "700" as any,
    color: colors.textSecondary,
    textTransform: "uppercase",
  },
  headerBadges: {
    flexDirection: "row",
    alignItems: "center",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    paddingVertical: hpx(2),
    borderRadius: radius.xs,
  },
  badgeText: {
    fontSize: rf(10),
    fontWeight: "700" as any,
  },
  cardTitle: {
    fontSize: rf(15),
    fontWeight: "700" as any,
    color: colors.textPrimary,
    marginBottom: hpx(4),
  },
  assetInfoText: {
    fontSize: rf(12),
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
  cardDate: {
    fontSize: rf(11),
    color: colors.textMuted,
  },

  // FAB
  fab: {
    position: "absolute",
    right: spacing["2xl"],
    bottom: spacing["2xl"],
    width: sizes.fabSize,
    height: sizes.fabSize,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    ...shadows.elevated,
    shadowColor: colors.primary,
    zIndex: 10,
  },

  // General Modal Overlay
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: "flex-end",
  },

  // Status Select Modal
  modalStatusSelectContent: {
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

  // Detail Modal
  detailModalContent: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing["2xl"],
    paddingTop: spacing["2xl"],
    paddingBottom: spacing["3xl"],
    height: "85%", // height limit to look premium
  },
  detailScroll: {
    gap: spacing.lg,
    paddingBottom: spacing["3xl"],
  },
  detailRow: {
    flexDirection: "column",
    gap: hpx(4),
  },
  detailGridRow: {
    flexDirection: "row",
    gap: spacing.lg,
  },
  detailLabel: {
    fontSize: rf(12),
    fontWeight: "700" as any,
    color: colors.textMuted,
    textTransform: "uppercase",
  },
  detailValue: {
    fontSize: rf(15),
    fontWeight: "600" as any,
    color: colors.textPrimary,
  },
  detailValueDesc: {
    fontSize: rf(14),
    lineHeight: rf(20),
    color: colors.textSecondary,
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  detailImageThumb: {
    width: wpx(80),
    height: wpx(80),
    borderRadius: radius.md,
    backgroundColor: colors.border,
  },

  // Notes Section
  notesSection: {
    backgroundColor: "#FAF5FF", // subtle purple bg
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: "#E9D5FF",
    marginTop: spacing.xs,
  },
  notesHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  notesTitle: {
    fontSize: rf(12),
    fontWeight: "700" as any,
    color: colors.secondary,
  },
  notesBody: {
    fontSize: rf(13),
    lineHeight: rf(18),
    color: colors.textSecondary,
    fontWeight: "500" as any,
  },

  // Detail Action Buttons
  detailActionBtnRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  btnOutline: {
    height: sizes.buttonSm + 4,
    borderRadius: radius.md,
    borderWidth: 1.5,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.card,
  },
  btnSolid: {
    height: sizes.buttonSm + 4,
    borderRadius: radius.md,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    ...shadows.elevated,
    shadowColor: colors.primary,
  },
  btnText: {
    fontSize: rf(13),
    fontWeight: "700" as any,
  },

  // Image Preview Modal Styles
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
