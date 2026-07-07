import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { Stack, useFocusEffect, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image,
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
  textPresets,
  wpx,
} from "../src/constants/theme";
import type { Expense, ExpenseCategory } from "../types/expense";
import { showToast } from "../utils/toast";

const STATUS_MAP: Record<
  string,
  { label: string; c: string; b: string; icon: string }
> = {
  draft: { label: "Draft", c: "#6B7280", b: "#F3F4F6", icon: "document-text-outline" },
  reported: { label: "Submitted", c: "#F59E0B", b: "#FEF3C7", icon: "paper-plane-outline" },
  submitted: { label: "Submitted", c: "#F59E0B", b: "#FEF3C7", icon: "paper-plane-outline" },
  approved: { label: "Approved", c: "#2563EB", b: "#DBEAFE", icon: "checkmark-done-circle-outline" },
  posted: { label: "Posted", c: "#7C3AED", b: "#EDE9FE", icon: "journal-outline" },
  done: { label: "Paid", c: "#059669", b: "#D1FAE5", icon: "checkmark-circle-outline" },
  refused: { label: "Refused", c: colors.error, b: "#FEE2E2", icon: "close-circle-outline" },
};

export default function ReimbursementScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // State Management
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Detail Modal States
  const [selectedDetail, setSelectedDetail] = useState<Expense | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [activePreviewUri, setActivePreviewUri] = useState<string | null>(null);

  // Filters
  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const [dateFrom, setDateFrom] = useState<Date>(firstOfMonth);
  const [dateTo, setDateTo] = useState<Date>(lastOfMonth);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<
    "Semua" | "Draft" | "Submitter" | "Approved" | "Posted" | "Paid"
  >("Semua");

  // Date Pickers
  const [showDatePicker, setShowDatePicker] = useState<"from" | "to" | null>(null);
  const [showStatusPicker, setShowStatusPicker] = useState(false);

  // Load Data
  const fetchExpenses = useCallback(async (showIndicator = true) => {
    if (showIndicator) setIsLoading(true);
    try {
      const stateFilter =
        activeTab === "Draft"
          ? "draft"
          : activeTab === "Submitter"
            ? "reported"
            : activeTab === "Approved"
              ? "approved"
              : activeTab === "Posted"
                ? "posted"
                : activeTab === "Paid"
                  ? "done"
                  : undefined;

      const params = {
        page: 1,
        per_page: 50,
        state: stateFilter,
        date_from: formatDateString(dateFrom),
        date_to: formatDateString(dateTo),
        search: searchQuery || undefined,
      };

      const res = await expenseService.list(params);
      setExpenses(res.data.data || []);
    } catch (err: any) {
      showToast("error", "Error", err?.response?.data?.message || "Gagal memuat reimbursement");
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, dateFrom, dateTo, searchQuery]);

  const loadCategories = useCallback(async () => {
    try {
      const res = await expenseService.listCategories();
      setCategories(res.data.data || []);
    } catch {
      // Fail silently
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchExpenses(false);
    }, [fetchExpenses])
  );

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchExpenses(false);
    setIsRefreshing(false);
  };

  // Helper formatting functions
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

  const handleSubmitExpense = async (item: Expense) => {
    const hasAttachments =
      (item.attachments && item.attachments.length > 0) ||
      (item.attachment_ids && item.attachment_ids.length > 0);

    if (!hasAttachments) {
      showToast("error", "Validasi", "Wajib melampirkan foto bukti untuk mengirim pengajuan.");
      return;
    }
    setIsLoading(true);
    try {
      await expenseService.submit(item.id);
      showToast("success", "Berhasil", "Reimbursement berhasil dikirim.");
      fetchExpenses();
    } catch (err: any) {
      showToast("error", "Gagal", err?.response?.data?.message || "Gagal mengirim pengajuan");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (item: Expense) => {
    router.push({
      pathname: "/reimbursement-form",
      params: { id: item.id },
    });
  };

  const handleShowDetail = async (id: number) => {
    setIsDetailLoading(true);
    setShowDetailModal(true);
    try {
      const res = await expenseService.getById(id);
      setSelectedDetail(res.data.data);
    } catch (err: any) {
      showToast("error", "Gagal", err?.response?.data?.message || "Gagal memuat detail reimbursement");
      setShowDetailModal(false);
    } finally {
      setIsDetailLoading(false);
    }
  };

  const handleDelete = (id: number) => {
    Alert.alert(
      "Hapus Draft",
      "Apakah Anda yakin ingin menghapus draft reimbursement ini?",
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: async () => {
            try {
              await expenseService.delete(id);
              showToast("success", "Berhasil", "Draft reimbursement berhasil dihapus.");
              fetchExpenses();
            } catch (err: any) {
              showToast("error", "Gagal", err?.response?.data?.message || "Gagal menghapus draft");
            }
          },
        },
      ]
    );
  };

  const onDateFilterChange = (_event: DateTimePickerEvent, date?: Date) => {
    setShowDatePicker(null);
    if (date) {
      if (showDatePicker === "from") setDateFrom(date);
      else if (showDatePicker === "to") setDateTo(date);
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
          <Text style={styles.headerTitle}>Reimbursement</Text>
          <TouchableOpacity
            onPress={() => router.push("/reimbursement-form")}
            style={styles.headerAddBtn}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={wpx(24)} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Content Area */}
      <View style={styles.filterSection}>
        {/* Date Filter Range */}
        <View style={styles.dateFilterRow}>
          {Platform.OS === "ios" ? (
            <View style={styles.dateBtn}>
              <Text style={styles.dateBtnLabel}>Dari</Text>
              <DateTimePicker
                value={dateFrom}
                mode="date"
                display="default"
                locale="id-ID"
                themeVariant="light"
                onChange={(_e, d) => d && setDateFrom(d)}
              />
            </View>
          ) : (
            <TouchableOpacity
              style={styles.dateBtn}
              activeOpacity={0.7}
              onPress={() => setShowDatePicker("from")}
            >
              <Text style={styles.dateBtnLabel}>Dari</Text>
              <Text style={styles.dateBtnValue}>
                {dateFrom.toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
              </Text>
            </TouchableOpacity>
          )}

          <Ionicons
            name="arrow-forward"
            size={14}
            color={colors.textMuted}
            style={{ marginHorizontal: spacing.xs }}
          />

          {Platform.OS === "ios" ? (
            <View style={styles.dateBtn}>
              <Text style={styles.dateBtnLabel}>Sampai</Text>
              <DateTimePicker
                value={dateTo}
                mode="date"
                display="default"
                locale="id-ID"
                themeVariant="light"
                onChange={(_e, d) => d && setDateTo(d)}
              />
            </View>
          ) : (
            <TouchableOpacity
              style={styles.dateBtn}
              activeOpacity={0.7}
              onPress={() => setShowDatePicker("to")}
            >
              <Text style={styles.dateBtnLabel}>Sampai</Text>
              <Text style={styles.dateBtnValue}>
                {dateTo.toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Search & Filter Row */}
        <View style={styles.searchFilterRow}>
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={18} color={colors.textMuted} style={{ marginRight: spacing.sm }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Cari berdasarkan nama, referensi..."
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
              color={activeTab !== "Semua" ? "#FFFFFF" : colors.primary}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Expenses List */}
      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.listScroll}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={[colors.primary]} />
          }
        >
          {expenses.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="folder-open-outline" size={48} color={colors.textMuted} />
              <Text style={styles.emptyText}>Tidak ada riwayat reimbursement.</Text>
            </View>
          ) : (
            expenses.map((item) => {
              const statusConfig = STATUS_MAP[item.state] || STATUS_MAP.draft;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={styles.card}
                  onPress={() => item.state !== "draft" && handleShowDetail(item.id)}
                  activeOpacity={item.state !== "draft" ? 0.75 : 1}
                >
                  <View style={styles.cardHeader}>
                    <View style={styles.categoryBadge}>
                      <Ionicons name="receipt-outline" size={12} color={colors.primary} style={{ marginRight: 4 }} />
                      <Text style={styles.categoryText}>
                        {item.product?.name || "Expense"}
                      </Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusConfig.b }]}>
                      <Ionicons name={statusConfig.icon as any} size={11} color={statusConfig.c} style={{ marginRight: 3 }} />
                      <Text style={[styles.statusText, { color: statusConfig.c }]}>
                        {statusConfig.label}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.cardTitle}>{item.name}</Text>
                  {item.description ? (
                    <Text style={styles.cardDesc} numberOfLines={2}>
                      {item.description}
                    </Text>
                  ) : null}

                  {((item.attachments && item.attachments.length > 0) || (item.attachment_ids && item.attachment_ids.length > 0)) && (
                    <View style={styles.attachmentsRow}>
                      <Ionicons name="attach" size={14} color={colors.primary} />
                      <Text style={styles.attachmentsCount}>
                        {item.attachments?.length || item.attachment_ids?.length || 0} Lampiran
                      </Text>
                    </View>
                  )}

                  <View style={styles.cardFooter}>
                    <Text style={styles.cardAmount}>
                      Rp {item.total_amount_currency.toLocaleString("id-ID")}
                    </Text>
                    <Text style={styles.cardDate}>
                      {toDisplayDate(item.date)}
                    </Text>
                  </View>

                  {item.state === "draft" && (
                    <View style={styles.cardActions}>
                      <TouchableOpacity
                        style={[styles.cardActionBtn, styles.submitCardBtn]}
                        onPress={() => handleSubmitExpense(item)}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="paper-plane-outline" size={14} color="#059669" />
                        <Text style={styles.submitCardBtnText}>Kirim</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.cardActionBtn, styles.editBtn]}
                        onPress={() => handleEdit(item)}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="create-outline" size={14} color={colors.primary} />
                        <Text style={styles.editBtnText}>Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.cardActionBtn, styles.deleteBtn]}
                        onPress={() => handleDelete(item.id)}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="trash-outline" size={14} color={colors.error} />
                        <Text style={styles.deleteBtnText}>Hapus</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      )}

      {/* Floating Plus FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push("/reimbursement-form")}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Android date pickers */}
      {showDatePicker && Platform.OS !== "ios" && (
        <DateTimePicker
          value={showDatePicker === "from" ? dateFrom : dateTo}
          mode="date"
          display="default"
          onChange={onDateFilterChange}
        />
      )}

      {/* Status Picker Modal */}
      <Modal
        visible={showStatusPicker}
        animationType="slide"
        transparent
        onRequestClose={() => setShowStatusPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowStatusPicker(false)} />
          <View style={styles.subModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Status</Text>
              <TouchableOpacity onPress={() => setShowStatusPicker(false)}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 300 }} showsVerticalScrollIndicator={false}>
              {(["Semua", "Draft", "Submitter", "Approved", "Posted", "Paid"] as const).map((tab) => (
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
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Detail Reimbursement Modal */}
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
              <Text style={styles.modalTitle}>Detail Reimbursement</Text>
              <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {isDetailLoading ? (
              <View style={{ paddingVertical: spacing.xl, alignItems: "center" }}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={{ marginTop: spacing.sm, color: colors.textMuted }}>Memuat detail...</Text>
              </View>
            ) : selectedDetail ? (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.detailScroll}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Judul Pengajuan</Text>
                  <Text style={styles.detailValue}>{selectedDetail.name}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Nominal Biaya</Text>
                  <Text style={styles.detailValueHighlight}>
                    Rp {selectedDetail.total_amount_currency.toLocaleString("id-ID")}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Kategori</Text>
                  <View style={[styles.categoryBadge, { alignSelf: "flex-start", marginTop: 4 }]}>
                    <Text style={styles.categoryText}>{selectedDetail.product?.name || "Expense"}</Text>
                  </View>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Status</Text>
                  {(() => {
                    const detailStatus = STATUS_MAP[selectedDetail.state] || STATUS_MAP.draft;
                    return (
                      <View style={[styles.statusBadge, { backgroundColor: detailStatus.b, alignSelf: "flex-start", marginTop: 4 }]}>
                        <Ionicons name={detailStatus.icon as any} size={11} color={detailStatus.c} style={{ marginRight: 3 }} />
                        <Text style={[styles.statusText, { color: detailStatus.c }]}>{detailStatus.label}</Text>
                      </View>
                    );
                  })()}
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Tanggal Transaksi</Text>
                  <Text style={styles.detailValue}>{toDisplayDate(selectedDetail.date)}</Text>
                </View>

                {selectedDetail.description ? (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Keterangan Tambahan</Text>
                    <Text style={styles.detailValueDesc}>{selectedDetail.description}</Text>
                  </View>
                ) : null}

                {/* Attachments Section */}
                {selectedDetail.attachments && selectedDetail.attachments.length > 0 ? (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Lampiran Bukti ({selectedDetail.attachments.length})</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.detailPhotosScroll}>
                      {selectedDetail.attachments.map((att) => (
                        <TouchableOpacity
                          key={att.id}
                          onPress={() => setActivePreviewUri(att.url)}
                          activeOpacity={0.8}
                          style={styles.detailPhotoContainer}
                        >
                          <Image source={{ uri: att.url }} style={styles.detailPhotoThumbnail} />
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                ) : null}
              </ScrollView>
            ) : (
              <View style={{ paddingVertical: spacing.xl, alignItems: "center" }}>
                <Text style={{ color: colors.textMuted }}>Gagal mengambil detail.</Text>
              </View>
            )}
          </View>

          {/* Full Screen Image Viewer inside the Modal context to avoid multiple modals conflict on iOS */}
          {Platform.OS === "ios" && activePreviewUri !== null && (
            <View style={[StyleSheet.absoluteFillObject, styles.fullscreenImageContainer, { zIndex: 9999 }]}>
              <Pressable style={StyleSheet.absoluteFill} onPress={() => setActivePreviewUri(null)} />
              <TouchableOpacity
                style={styles.closeImageBtn}
                onPress={() => setActivePreviewUri(null)}
              >
                <Ionicons name="close" size={30} color="#FFFFFF" />
              </TouchableOpacity>
              <Image
                source={{ uri: activePreviewUri }}
                style={styles.fullscreenImage}
                resizeMode="contain"
              />
            </View>
          )}
        </View>
      </Modal>

      {/* Full Screen Image Viewer Modal for Android only */}
      {Platform.OS !== "ios" && (
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
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
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
  headerAddBtn: {
    width: wpx(36),
    height: wpx(36),
    borderRadius: radius.full,
    justifyContent: "center",
    alignItems: "flex-end",
  },
  headerTitle: {
    fontSize: rf(18),
    fontWeight: "800" as any,
    color: "#FFFFFF",
  },

  filterSection: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: spacing.sm,
  },
  dateFilterRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  dateBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: hpx(8),
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
  },
  dateBtnLabel: {
    fontSize: rf(11),
    color: colors.textMuted,
    fontWeight: "600" as any,
  },
  dateBtnValue: {
    fontSize: rf(13),
    color: colors.textPrimary,
    fontWeight: "700" as any,
  },

  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: hpx(40),
    flex: 1,
  },
  searchInput: {
    flex: 1,
    height: "100%",
    fontSize: rf(13),
    color: colors.textPrimary,
  },

  tabsContainer: {
    paddingVertical: spacing.xs,
  },
  tabItem: {
    paddingHorizontal: spacing.lg,
    paddingVertical: hpx(6),
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
  },
  tabItemActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabText: {
    fontSize: rf(12),
    fontWeight: "700" as any,
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: "#FFFFFF",
  },

  listScroll: {
    padding: spacing.xl,
    paddingBottom: hpx(100),
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: hpx(80),
    gap: spacing.md,
  },
  emptyText: {
    fontSize: rf(14),
    color: colors.textMuted,
    textAlign: "center",
  },

  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
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
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    paddingHorizontal: spacing.sm,
    paddingVertical: hpx(2),
    borderRadius: radius.xs,
  },
  categoryText: {
    fontSize: rf(10),
    fontWeight: "700" as any,
    color: colors.primary,
    textTransform: "uppercase",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    paddingVertical: hpx(2),
    borderRadius: radius.xs,
  },
  statusText: {
    fontSize: rf(10),
    fontWeight: "700" as any,
  },
  cardTitle: {
    ...textPresets.cardTitle,
    fontSize: rf(15),
    marginBottom: hpx(4),
  },
  cardDesc: {
    ...textPresets.body,
    fontSize: rf(13),
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  attachmentsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  attachmentsCount: {
    fontSize: rf(11),
    color: colors.textSecondary,
    fontWeight: "600" as any,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
  cardAmount: {
    fontSize: rf(14),
    fontWeight: "800" as any,
    color: colors.primary,
  },
  cardDate: {
    fontSize: rf(11),
    color: colors.textMuted,
  },

  fab: {
    position: "absolute",
    right: spacing.xl,
    bottom: spacing["5xl"],
    width: wpx(52),
    height: wpx(52),
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    ...shadows.elevated,
    shadowColor: colors.primary,
  },

  // Form Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: "flex-end",
  },
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
  },
  modalTitle: {
    fontSize: rf(18),
    fontWeight: "800" as any,
    color: colors.textPrimary,
  },
  formScroll: {
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  fieldLabel: {
    fontSize: rf(13),
    fontWeight: "700" as any,
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
  loadingCategories: {
    fontSize: rf(13),
    color: colors.textMuted,
    fontStyle: "italic",
  },
  categorySelectorScroll: {
    paddingVertical: hpx(4),
  },
  categorySelectBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: hpx(8),
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.sm,
    backgroundColor: colors.card,
    marginRight: spacing.sm,
  },
  categorySelectBtnActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  categorySelectText: {
    fontSize: rf(12),
    fontWeight: "600" as any,
    color: colors.textSecondary,
  },
  categorySelectTextActive: {
    color: colors.primary,
    fontWeight: "700" as any,
  },
  textInput: {
    backgroundColor: colors.surface,
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
    backgroundColor: colors.surface,
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
  previewContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
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
    backgroundColor: colors.surface,
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
    backgroundColor: colors.border,
    borderWidth: 1,
    borderColor: colors.border,
  },
  draftBtnText: {
    color: colors.textPrimary,
    fontSize: rf(14),
    fontWeight: "700" as any,
  },
  submitBtn: {
    backgroundColor: colors.primary,
    ...shadows.elevated,
    shadowColor: colors.primary,
  },
  submitBtnText: {
    color: "#FFFFFF",
    fontSize: rf(14),
    fontWeight: "700" as any,
  },
  cardActions: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
    justifyContent: "flex-end",
  },
  cardActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: hpx(4),
    paddingHorizontal: spacing.sm,
    borderRadius: radius.xs,
    borderWidth: 1,
  },
  editBtn: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  editBtnText: {
    fontSize: rf(11),
    fontWeight: "700" as any,
    color: colors.primary,
  },
  deleteBtn: {
    borderColor: colors.error,
    backgroundColor: "#FEE2E2",
  },
  deleteBtnText: {
    fontSize: rf(11),
    fontWeight: "700" as any,
    color: colors.error,
  },
  submitCardBtn: {
    borderColor: "#059669",
    backgroundColor: "#D1FAE5",
  },
  submitCardBtnText: {
    fontSize: rf(11),
    fontWeight: "700" as any,
    color: "#059669",
  },
  selectBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
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
  subModalContent: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.xl,
    maxHeight: "50%",
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
  searchFilterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginVertical: spacing.sm,
  },
  filterIconBtn: {
    width: hpx(40),
    height: hpx(40),
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  filterIconBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  detailModalContent: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.xl,
    maxHeight: "85%",
  },
  detailScroll: {
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  detailRow: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: spacing.sm,
    marginBottom: spacing.xs,
  },
  detailLabel: {
    fontSize: rf(12),
    color: colors.textMuted,
    fontWeight: "600" as any,
    textTransform: "uppercase",
  },
  detailValue: {
    fontSize: rf(14),
    color: colors.textPrimary,
    fontWeight: "700" as any,
    marginTop: 2,
  },
  detailValueHighlight: {
    fontSize: rf(16),
    color: colors.primary,
    fontWeight: "800" as any,
    marginTop: 2,
  },
  detailValueDesc: {
    fontSize: rf(13),
    color: colors.textSecondary,
    lineHeight: 18,
    marginTop: 4,
  },
  detailPhotosScroll: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.xs,
    gap: spacing.sm,
  },
  detailPhotoContainer: {
    width: wpx(70),
    height: hpx(70),
  },
  detailPhotoThumbnail: {
    width: wpx(64),
    height: hpx(64),
    borderRadius: radius.md,
    backgroundColor: colors.border,
    borderWidth: 1,
    borderColor: colors.border,
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
});
