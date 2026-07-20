import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter, useFocusEffect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState, useCallback, useEffect } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
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
import { employeeService } from "../services/employeeService";
import type { Employee } from "../types/employee";
import { Avatar } from "../src/components/ui";
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
import { assetService } from "../services/assetService";
import type { Asset } from "../types/asset";



const STATUS_MAP: Record<
  string,
  { label: string; c: string; b: string }
> = {
  active: { label: "Sedang Digunakan", c: "#059669", b: "#D1FAE5" },
  warning: { label: "Rusak Ringan", c: "#D97706", b: "#FEF3C7" },
  broken: { label: "Perlu Perbaikan", c: "#DC2626", b: "#FEE2E2" },
};

const formatBirthday = (bdayStr?: string | null) => {
  if (!bdayStr) return "—";
  try {
    const datePart = bdayStr.split(" ")[0];
    const parts = datePart.split("-");
    if (parts.length !== 3) return bdayStr;
    const year = parts[0];
    const monthIdx = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    
    const months = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    return `${day} ${months[monthIdx]} ${year}`;
  } catch {
    return bdayStr;
  }
};

const mapGender = (sex?: string | null) => {
  if (!sex) return "—";
  if (sex === "male") return "Laki-laki";
  if (sex === "female") return "Perempuan";
  return sex;
};

const mapMarital = (marital?: string | null) => {
  if (!marital) return "—";
  const mapping: Record<string, string> = {
    single: "Lajang",
    married: "Menikah",
    cohabitant: "Kohabitasi",
    widower: "Duda/Janda",
    divorced: "Bercerai",
  };
  return mapping[marital] || marital;
};

export default function ProfileDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile, isLoading: isProfileLoading } = useProfile();
  
  const [employeeDetail, setEmployeeDetail] = useState<Employee | null>(null);
  const [isLoadingEmployee, setIsLoadingEmployee] = useState(false);

  // Asset States
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isAssetsLoading, setIsAssetsLoading] = useState(true);
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);

  // Asset Form States
  const [assetName, setAssetName] = useState("");
  const [assetCode, setAssetCode] = useState("");
  const [assetCategory, setAssetCategory] = useState<Asset["category"]>("hardware");
  const [assetStatus, setAssetStatus] = useState<Asset["status"]>("active");
  const [isAssetSaving, setIsAssetSaving] = useState(false);

  // Dynamic Equipments States
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [assetNote, setAssetNote] = useState("");
  const [assetCost, setAssetCost] = useState("");
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  // Fetch categories on mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await assetService.listCategories();
        setCategories(res || []);
      } catch (err) {
        console.warn("Failed to load equipment categories:", err);
      }
    };
    loadCategories();
  }, []);

  const fetchFullEmployeeDetails = useCallback(async () => {
    const empId = profile?.employee?.id;
    if (!empId) return;
    setIsLoadingEmployee(true);
    try {
      const res = await employeeService.getById(empId);
      if (res.data?.success && res.data.data) {
        setEmployeeDetail(res.data.data);
      }
    } catch (err) {
      console.error("Error loading detailed employee record:", err);
    } finally {
      setIsLoadingEmployee(false);
    }
  }, [profile?.employee?.id]);

  const fetchAssets = useCallback(async () => {
    const empId = profile?.employee?.id;
    if (!empId) {
      setAssets([]);
      setIsAssetsLoading(false);
      return;
    }
    setIsAssetsLoading(true);
    try {
      const data = await assetService.list({ employee_id: empId });
      setAssets(data || []);
    } catch (err) {
      console.error("Error loading assets:", err);
    } finally {
      setIsAssetsLoading(false);
    }
  }, [profile?.employee?.id]);

  const handleSelectCategory = (cat: any) => {
    setSelectedCategoryId(cat.id);
    const name = cat.name.toLowerCase();
    if (name.includes("hard") || name.includes("comp") || name.includes("laptop") || name.includes("pc")) {
      setAssetCategory("hardware");
    } else if (name.includes("fac") || name.includes("build") || name.includes("room") || name.includes("furn") || name.includes("kursi") || name.includes("meja")) {
      setAssetCategory("facility");
    } else if (name.includes("mobil") || name.includes("motor") || name.includes("car") || name.includes("vehic")) {
      setAssetCategory("vehicle");
    } else {
      setAssetCategory("other");
    }
    setShowCategoryPicker(false);
  };

  const handleOpenAssetModal = (asset: Asset) => {
    setEditingAsset(asset);
    setAssetName(asset.name);
    setAssetCode(asset.code);
    setAssetCategory(asset.category);
    setAssetStatus(asset.status);
    setSelectedCategoryId(asset.category_id || null);
    setAssetNote(asset.note || "");
    setAssetCost(asset.cost ? String(asset.cost) : "");
    setShowAssetModal(true);
  };

  const handleCloseAssetModal = () => {
    setShowAssetModal(false);
    setEditingAsset(null);
    setAssetName("");
    setAssetCode("");
    setAssetNote("");
    setAssetCost("");
    setSelectedCategoryId(null);
  };

  const handleSaveAsset = async () => {
    if (!editingAsset) return;
    if (!assetNote.trim()) {
      Alert.alert("Validasi", "Harap isi catatan aset.");
      return;
    }
    setIsAssetSaving(true);
    try {
      const payload = {
        name: assetName.trim(),
        serial_no: assetCode.trim(),
        category_id: selectedCategoryId || undefined,
        employee_id: profile?.employee?.id,
        note: assetNote.trim(),
        cost: Number(assetCost) || 0,
      };

      await assetService.update(editingAsset.id, payload);
      await fetchAssets();
      handleCloseAssetModal();
    } catch (err: any) {
      Alert.alert("Gagal", err?.message || "Gagal menyimpan aset.");
    } finally {
      setIsAssetSaving(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchFullEmployeeDetails();
      fetchAssets();
    }, [fetchFullEmployeeDetails, fetchAssets])
  );

  const isLoading = isProfileLoading || isLoadingEmployee;

  if (isLoading && !employeeDetail) {
    return (
      <View style={[styles.center, { paddingTop: insets.top + spacing["5xl"] }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const user = profile?.user;
  const emp = (employeeDetail || profile?.employee) as any;
  const priv = profile?.privileges;
  const initials = (emp?.name || user?.name || "U").charAt(0).toUpperCase();

  const sections: Array<{
    title: string;
    color: string;
    items: Array<{
      icon: keyof typeof Ionicons.glyphMap;
      label: string;
      value?: string | null;
    }>;
  }> = [
    {
      title: "Akun",
      color: colors.primary,
      items: [
        { icon: "person-outline", label: "Username", value: user?.login },
        { icon: "mail-outline", label: "Email Akun", value: user?.email },
      ],
    },
    {
      title: "Pekerjaan",
      color: "#059669",
      items: [
        { icon: "briefcase-outline", label: "Jabatan", value: emp?.job_title },
        { icon: "layers-outline", label: "Departemen", value: emp?.department?.name || (emp as any)?.department },
        { icon: "business-outline", label: "Perusahaan", value: (emp as any)?.company || "UNOTEK" },
        { icon: "call-outline", label: "Telepon Kantor", value: emp?.work_phone },
        { icon: "mail-unread-outline", label: "Email Kantor", value: emp?.work_email },
      ],
    },
    {
      title: "Info Pribadi",
      color: "#D97706",
      items: [
        { icon: "mail-outline", label: "Email Pribadi", value: emp?.private_email },
        { icon: "phone-portrait-outline", label: "Telepon Pribadi", value: emp?.private_phone || emp?.mobile_phone },
        { icon: "calendar-outline", label: "Tanggal Lahir", value: formatBirthday(emp?.birthday) },
        { icon: "male-female-outline", label: "Jenis Kelamin", value: mapGender(emp?.sex) },
        { icon: "heart-outline", label: "Status Pernikahan", value: mapMarital(emp?.marital) },
        { icon: "card-outline", label: "Nomor Identitas (NIK)", value: emp?.identification_id },
      ],
    },
  ];

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <Stack.Screen options={{ headerShown: false }} />

      <View style={[styles.curvedHeader, { paddingTop: insets.top }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={wpx(22)} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Detail Data Diri</Text>
          
          {emp?.id ? (
            <TouchableOpacity
              onPress={() => router.push({ pathname: "/profile-edit", params: { id: emp.id } })}
              style={styles.backBtn}
              activeOpacity={0.7}
            >
              <Ionicons name="create-outline" size={wpx(22)} color="#FFFFFF" />
            </TouchableOpacity>
          ) : (
            <View style={styles.backBtn} />
          )}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.floatingCard}>
          {/* Hero Avatar Section */}
          <View style={styles.hero}>
            <Avatar initials={initials} size={72} />
            <Text style={styles.fullName}>{emp?.name || user?.name}</Text>
            {emp?.job_title ? (
              <Text style={styles.jobTitle}>{emp.job_title}</Text>
            ) : null}
          </View>

          {/* Expanded Sections */}
          {sections.map((section) => (
            <View key={section.title} style={styles.section}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              {section.items.map((item, i) => (
                <View key={item.label}>
                  <View style={styles.infoRow}>
                    <View
                      style={[
                        styles.infoIcon,
                        { backgroundColor: `${section.color}15` },
                      ]}
                    >
                      <Ionicons
                        name={item.icon}
                        size={18}
                        color={section.color}
                      />
                    </View>
                    <View style={styles.infoText}>
                      <Text style={styles.infoLabel}>{item.label}</Text>
                      <Text style={styles.infoValue}>{item.value || "—"}</Text>
                    </View>
                  </View>
                  {i < section.items.length - 1 && (
                    <View style={styles.divider} />
                  )}
                </View>
              ))}
            </View>
          ))}

          {/* Asset Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Aset Kantor</Text>
            </View>

            {isAssetsLoading ? (
              <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: spacing.md }} />
            ) : assets.length === 0 ? (
              <Text style={styles.emptyAssetsText}>Tidak ada aset yang dipegang.</Text>
            ) : (
              assets.map((asset, index) => {
                const statusConfig = STATUS_MAP[asset.status] || STATUS_MAP.active;
                return (
                  <View key={asset.id}>
                    <View style={styles.assetRow}>
                      <View style={styles.assetInfoTextContainer}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, flexWrap: "wrap" }}>
                          <Text style={{ fontWeight: "700", fontSize: rf(14), color: colors.textPrimary }}>
                            {asset.category_name || "Lainnya"}
                          </Text>
                          <View style={[styles.statusBadgeSmall, { backgroundColor: statusConfig.b }]}>
                            <Text style={[styles.statusBadgeTextSmall, { color: statusConfig.c }]}>
                              {statusConfig.label}
                            </Text>
                          </View>
                        </View>
                        <Text style={{ fontSize: rf(13), color: colors.textSecondary, marginTop: hpx(4) }}>
                          {asset.name}
                        </Text>
                        <Text style={{ fontSize: rf(11), color: colors.textMuted, marginTop: hpx(2) }}>
                          {asset.code}
                        </Text>
                      </View>
                      <View style={styles.assetActions}>
                        <TouchableOpacity
                          style={styles.assetActionBtn}
                          onPress={() => handleOpenAssetModal(asset)}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="create-outline" size={16} color={colors.textSecondary} />
                        </TouchableOpacity>
                      </View>
                    </View>
                    {index < assets.length - 1 && <View style={[styles.divider, { marginLeft: 0 }]} />}
                  </View>
                );
              })
            )}
          </View>
        </View>
        <View style={{ height: hpx(24) }} />

        {/* Asset Form Modal */}
        <Modal
          visible={showAssetModal}
          animationType="slide"
          transparent
          onRequestClose={handleCloseAssetModal}
        >
          <View style={styles.modalOverlay}>
            <Pressable style={StyleSheet.absoluteFill} onPress={handleCloseAssetModal} />
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  Edit Aset Kantor
                </Text>
                <TouchableOpacity onPress={handleCloseAssetModal}>
                  <Ionicons name="close" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>

              <View style={styles.formContainer}>
                <Text style={styles.fieldLabel}>Nama Aset</Text>
                <TextInput
                  style={[styles.textInput, { color: colors.textMuted }]}
                  placeholder="-"
                  placeholderTextColor={colors.textMuted}
                  value={assetName || "-"}
                  editable={false}
                />

                <Text style={styles.fieldLabel}>Kode Inventaris / SN</Text>
                <TextInput
                  style={[styles.textInput, { color: colors.textMuted }]}
                  placeholder="-"
                  placeholderTextColor={colors.textMuted}
                  value={assetCode || "-"}
                  editable={false}
                />

                <Text style={styles.fieldLabel}>Kategori Aset</Text>
                <TouchableOpacity
                  style={[styles.pickerSelector, { backgroundColor: colors.surface }]}
                  disabled={true}
                  activeOpacity={1}
                >
                  <Text style={[styles.pickerSelectorText, { color: colors.textMuted }]}>
                    {selectedCategoryId ? (categories.find(c => c.id === selectedCategoryId)?.name || "-") : "-"}
                  </Text>
                  <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
                </TouchableOpacity>

                <Text style={styles.fieldLabel}>Biaya Aset (Cost)</Text>
                <TextInput
                  style={[styles.textInput, { color: colors.textMuted }]}
                  placeholder="-"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                  value={assetCost || "-"}
                  editable={false}
                />

                <Text style={styles.fieldLabel}>Catatan (Note) *</Text>
                <TextInput
                  style={[styles.textInput, { height: hpx(60), paddingTop: spacing.xs, paddingBottom: spacing.xs }]}
                  multiline
                  placeholder="-"
                  placeholderTextColor={colors.textMuted}
                  value={assetNote}
                  onChangeText={setAssetNote}
                />

                <TouchableOpacity
                  style={[styles.submitBtn, isAssetSaving && { opacity: 0.6 }]}
                  disabled={isAssetSaving}
                  onPress={handleSaveAsset}
                  activeOpacity={0.8}
                >
                  {isAssetSaving ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.submitText}>Simpan Perubahan</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Category Picker Modal */}
        <Modal
          visible={showCategoryPicker}
          animationType="slide"
          transparent
          onRequestClose={() => setShowCategoryPicker(false)}
        >
          <View style={styles.modalOverlay}>
            <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowCategoryPicker(false)} />
            <View style={styles.modalStatusSelectContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Pilih Kategori Aset</Text>
                <TouchableOpacity onPress={() => setShowCategoryPicker(false)}>
                  <Ionicons name="close" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 300 }} showsVerticalScrollIndicator={false}>
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoryItem,
                      selectedCategoryId === cat.id && styles.categoryItemActive,
                    ]}
                    onPress={() => handleSelectCategory(cat)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.categoryItemText,
                        selectedCategoryId === cat.id && styles.categoryItemTextActive,
                      ]}
                    >
                      {cat.name}
                    </Text>
                    {selectedCategoryId === cat.id && (
                      <Ionicons name="checkmark" size={16} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  // Curved header
  curvedHeader: {
    height: hpx(130),
    backgroundColor: colors.primary,
    borderBottomLeftRadius: wpx(30),
    borderBottomRightRadius: wpx(30),
    paddingHorizontal: spacing["2xl"],
    justifyContent: "flex-end",
    paddingBottom: hpx(12),
    zIndex: 1,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backBtn: {
    width: sizes.headerBtnWidth,
    height: sizes.headerBtn,
    borderRadius: radius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: rf(17),
    fontWeight: "700" as any,
    color: "#FFFFFF",
    flex: 1,
    textAlign: "center",
    marginHorizontal: spacing.sm,
  },

  // Scroll
  scroll: {
    paddingHorizontal: spacing["2xl"],
    paddingBottom: hpx(40),
    paddingTop: hpx(45),
  },
  floatingCard: {
    marginTop: -hpx(24),
    backgroundColor: colors.card,
    borderRadius: wpx(20),
    padding: spacing["2xl"],
    ...shadows.elevated,
  },

  hero: {
    alignItems: "center",
    marginBottom: spacing["2xl"],
    marginTop: spacing.sm,
  },
  fullName: { ...textPresets.screenTitle, marginTop: spacing.md },
  jobTitle: { ...textPresets.body, marginTop: spacing.xs },

  section: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing["2xl"],
    marginBottom: spacing.lg,
    ...shadows.card,
  },
  sectionTitle: { ...textPresets.sectionHeader, marginBottom: spacing.lg },
  infoRow: { flexDirection: "row", alignItems: "center" },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
  },
  infoText: { flex: 1 },
  infoLabel: { ...textPresets.label },
  infoValue: { ...textPresets.cardTitle, marginTop: 2 },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
    marginLeft: 52,
  },

  // Asset Section Styles
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  addAssetBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: hpx(4),
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.primaryLight,
    borderRadius: radius.sm,
  },
  addAssetBtnText: {
    fontSize: rf(12),
    fontWeight: "700" as any,
    color: colors.primary,
  },
  emptyAssetsText: {
    fontSize: rf(13),
    color: colors.textMuted,
    fontStyle: "italic",
    textAlign: "center",
    paddingVertical: spacing.md,
  },
  assetRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  assetInfoTextContainer: {
    flex: 1,
  },
  assetNameText: {
    ...textPresets.cardTitle,
    fontSize: rf(14),
  },
  assetMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: hpx(2),
    gap: spacing.sm,
  },
  assetCodeText: {
    fontSize: rf(11),
    color: colors.textMuted,
  },
  statusBadgeSmall: {
    paddingHorizontal: spacing.sm,
    paddingVertical: hpx(1),
    borderRadius: radius.xs,
  },
  statusBadgeTextSmall: {
    fontSize: rf(9),
    fontWeight: "700" as any,
  },
  assetActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  assetActionBtn: {
    padding: spacing.xs,
  },

  // Modal & Forms
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: "flex-end",
  },
  modalContent: {
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
  modalTitle: { ...textPresets.screenTitle },
  formContainer: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  fieldLabel: {
    fontSize: rf(13),
    fontWeight: "700" as any,
    color: colors.textPrimary,
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
  selectGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  selectBtn: {
    flex: 1,
    minWidth: "45%",
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingVertical: hpx(10),
    alignItems: "center",
    backgroundColor: colors.card,
  },
  selectText: {
    fontSize: rf(12),
    fontWeight: "600" as any,
    color: colors.textSecondary,
  },
  selectGridVertical: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  selectBtnVertical: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: radius.sm,
    paddingVertical: hpx(10),
    alignItems: "center",
    backgroundColor: colors.card,
  },
  submitBtn: {
    height: sizes.buttonMd,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    justifyContent: "center",
    alignItems: "center",
    marginTop: spacing.md,
    ...shadows.elevated,
    shadowColor: colors.primary,
  },
  submitText: {
    color: "#FFFFFF",
    fontSize: rf(14),
    fontWeight: "700" as any,
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
