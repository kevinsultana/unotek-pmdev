import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { contactService } from "../services/contactService";
import {
  colors,
  hpx,
  radius,
  rf,
  shadows,
  spacing,
  wpx,
} from "../src/constants/theme";
import type { CompanyType, Contact } from "../types/contact";
import { showToast } from "../utils/toast";

export default function ContactFormScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    id?: string;
    company_type?: CompanyType;
    parent_id?: string;
    parent_name?: string;
  }>();

  const isEdit = Boolean(params.id);
  const contactId = params.id ? parseInt(params.id, 10) : 0;
  const initialCompanyType: CompanyType = params.company_type || "company";
  const parentCompanyId = params.parent_id ? parseInt(params.parent_id, 10) : undefined;

  // Form State
  const [companyType, setCompanyType] = useState<CompanyType>(initialCompanyType);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [mobile, setMobile] = useState("");
  const [website, setWebsite] = useState("");
  const [vat, setVat] = useState("");
  const [jobFunction, setJobFunction] = useState("");
  const [street, setStreet] = useState("");
  const [street2, setStreet2] = useState("");
  const [city, setCity] = useState("");
  const [zip, setZip] = useState("");
  const [comment, setComment] = useState("");

  const [parentId, setParentId] = useState<number | undefined>(parentCompanyId);
  const [parentName, setParentName] = useState<string>(params.parent_name || "");
  const [companyList, setCompanyList] = useState<Contact[]>([]);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);

  // Load Companies for Dropdown
  useEffect(() => {
    async function loadDropdowns() {
      try {
        const compRes = await contactService.list({ company_type: "company", per_page: 100 });
        setCompanyList(compRes.items || []);

        if (parentCompanyId && !params.parent_name) {
          const match = compRes.items?.find((c) => c.id === parentCompanyId);
          if (match) setParentName(match.name);
        }
      } catch (err) {
        console.warn("Error loading form dropdowns:", err);
      }
    }
    loadDropdowns();
  }, [parentCompanyId, params.parent_name]);

  // Load Edit Data
  useEffect(() => {
    if (!isEdit || !contactId) return;

    async function loadData() {
      try {
        setFetching(true);
        const data = await contactService.getById(contactId);
        setName(data.name || "");
        setCompanyType(data.company_type || "company");
        setEmail(data.email || "");
        setPhone(data.phone || "");
        setMobile(data.mobile || "");
        setWebsite(data.website || "");
        setVat(data.vat || "");
        setJobFunction(data.function || "");
        setStreet(data.street || "");
        setStreet2(data.street2 || "");
        setCity(data.city || "");
        setZip(data.zip || "");
        setComment(data.comment || "");

        const pId = typeof data.parent_id === "object" ? data.parent_id?.id : data.parent_id;
        if (pId) {
          setParentId(pId);
          setParentName(data.company_name || data.parent_name || "");
        }
      } catch (err) {
        console.warn("Failed loading contact for edit:", err);
        showToast("error", "Gagal", "Tidak dapat memuat data kontak untuk diedit.");
      } finally {
        setFetching(false);
      }
    }
    loadData();
  }, [isEdit, contactId]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      showToast("error", "Validasi Gagal", "Nama wajib diisi.");
      return;
    }

    try {
      setLoading(true);
      if (isEdit) {
        await contactService.update(contactId, {
          name: name.trim(),
          company_type: companyType,
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          mobile: mobile.trim() || undefined,
          website: website.trim() || undefined,
          vat: vat.trim() || undefined,
          function: jobFunction.trim() || undefined,
          street: street.trim() || undefined,
          street2: street2.trim() || undefined,
          city: city.trim() || undefined,
          zip: zip.trim() || undefined,
          comment: comment.trim() || undefined,
          parent_id: parentId,
          company_name: parentName || undefined,
        });
        showToast("success", "Berhasil Diperbarui", `Kontak ${name} berhasil disimpan.`);
      } else {
        await contactService.create({
          name: name.trim(),
          company_type: companyType,
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          mobile: mobile.trim() || undefined,
          website: website.trim() || undefined,
          vat: vat.trim() || undefined,
          function: jobFunction.trim() || undefined,
          street: street.trim() || undefined,
          street2: street2.trim() || undefined,
          city: city.trim() || undefined,
          zip: zip.trim() || undefined,
          comment: comment.trim() || undefined,
          parent_id: parentId,
          company_name: parentName || undefined,
        });
        showToast(
          "success",
          "Kontak Dibuat",
          `Kontak ${companyType === "company" ? "Perusahaan" : "Person"} ${name} berhasil ditambahkan.`
        );
      }
      router.back();
    } catch (err) {
      console.warn("Submit contact error:", err);
      showToast("error", "Gagal Menyimpan", "Terjadi kesalahan saat menyimpan kontak.");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <View style={styles.centerLoading}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Memuat formulir...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Header Standard Curved matching Pipeline/Maintenance */}
      <View style={styles.curvedHeader}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={wpx(24)} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {isEdit
              ? `Edit ${companyType === "company" ? "Perusahaan" : "Person"}`
              : `Tambah ${companyType === "company" ? "Perusahaan" : "Person"}`}
          </Text>
          <Text style={styles.headerSub}>Formulir Kontak CRM</Text>
        </View>

        <TouchableOpacity
          style={[styles.saveHeaderBtn, loading && { opacity: 0.6 }]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.saveHeaderBtnText}>Simpan</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Form Content */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom > 0 ? insets.bottom + hpx(40) : hpx(50) },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Company Type Selector (if not editing) */}
          {!isEdit ? (
            <View style={styles.typeSelectorBg}>
              <TouchableOpacity
                style={[
                  styles.typeOption,
                  companyType === "company" && styles.typeOptionActive,
                ]}
                onPress={() => setCompanyType("company")}
              >
                <Ionicons
                  name="business"
                  size={wpx(16)}
                  color={companyType === "company" ? colors.primary : colors.textMuted}
                />
                <Text
                  style={[
                    styles.typeOptionText,
                    companyType === "company" && styles.typeOptionTextActive,
                  ]}
                >
                  Perusahaan (Company)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.typeOption,
                  companyType === "person" && styles.typeOptionActive,
                ]}
                onPress={() => setCompanyType("person")}
              >
                <Ionicons
                  name="person"
                  size={wpx(16)}
                  color={companyType === "person" ? colors.primary : colors.textMuted}
                />
                <Text
                  style={[
                    styles.typeOptionText,
                    companyType === "person" && styles.typeOptionTextActive,
                  ]}
                >
                  Person / Pejabat
                </Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {/* Basic Info Group */}
          <View style={styles.formGroup}>
            <Text style={styles.groupLabel}>Informasi Utama</Text>

            {/* Name */}
            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>
                {companyType === "company" ? "Nama Perusahaan *" : "Nama Lengkap Person *"}
              </Text>
              <TextInput
                style={styles.textInput}
                placeholder={
                  companyType === "company" ? "cth. PT. Bank Nusantara Tbk" : "cth. Budi Santoso"
                }
                placeholderTextColor={colors.textMuted}
                value={name}
                onChangeText={setName}
              />
            </View>

            {/* Person-specific fields */}
            {companyType === "person" ? (
              <>
                {/* Parent Company selector */}
                <View style={styles.fieldBlock}>
                  <Text style={styles.fieldLabel}>Perusahaan Induk (Parent Company)</Text>
                  {parentName ? (
                    <View style={styles.parentPresetBox}>
                      <Ionicons name="business" size={wpx(16)} color={colors.primary} />
                      <Text style={styles.parentPresetText}>{parentName}</Text>
                    </View>
                  ) : (
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.companyChipRow}
                    >
                      {companyList.map((c) => {
                        const isSelected = parentId === c.id;
                        return (
                          <TouchableOpacity
                            key={c.id}
                            style={[
                              styles.companyChip,
                              isSelected && styles.companyChipSelected,
                            ]}
                            onPress={() => {
                              setParentId(isSelected ? undefined : c.id);
                              setParentName(isSelected ? "" : c.name);
                            }}
                          >
                            <Text
                              style={[
                                styles.companyChipText,
                                isSelected && styles.companyChipTextSelected,
                              ]}
                            >
                              {c.name}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  )}
                </View>

                {/* Job Position */}
                <View style={styles.fieldBlock}>
                  <Text style={styles.fieldLabel}>Jabatan / Posisi Pekerjaan (Function)</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="cth. Sales Director, Head of IT, Manager Procurement"
                    placeholderTextColor={colors.textMuted}
                    value={jobFunction}
                    onChangeText={setJobFunction}
                  />
                </View>
              </>
            ) : (
              /* Company-specific fields */
              <>
                {/* VAT / NPWP */}
                <View style={styles.fieldBlock}>
                  <Text style={styles.fieldLabel}>NPWP / Tax ID (VAT)</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="cth. 01.234.567.8-012.000"
                    placeholderTextColor={colors.textMuted}
                    value={vat}
                    onChangeText={setVat}
                  />
                </View>

                {/* Website */}
                <View style={styles.fieldBlock}>
                  <Text style={styles.fieldLabel}>Website Perusahaan</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="cth. https://www.perusahaan.co.id"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="url"
                    autoCapitalize="none"
                    value={website}
                    onChangeText={setWebsite}
                  />
                </View>
              </>
            )}
          </View>

          {/* Contact Methods Group */}
          <View style={styles.formGroup}>
            <Text style={styles.groupLabel}>Informasi Kontak & Komunikasi</Text>

            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Email</Text>
              <TextInput
                style={styles.textInput}
                placeholder="cth. contact@perusahaan.co.id"
                placeholderTextColor={colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>No. Telepon (Kantor / Fixed)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="cth. +62215551234"
                placeholderTextColor={colors.textMuted}
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />
            </View>

            {companyType === "person" ? (
              <View style={styles.fieldBlock}>
                <Text style={styles.fieldLabel}>No. HP / Mobile</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="cth. +6281234567890"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="phone-pad"
                  value={mobile}
                  onChangeText={setMobile}
                />
              </View>
            ) : null}
          </View>

          {/* Address Group */}
          <View style={styles.formGroup}>
            <Text style={styles.groupLabel}>Alamat Lokasi</Text>

            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Alamat Jalan (Street)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="cth. Jl. Jend. Sudirman No. 45"
                placeholderTextColor={colors.textMuted}
                value={street}
                onChangeText={setStreet}
              />
            </View>

            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Alamat Tambahan (Gedung / Lt)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="cth. Gedung Menara Palma Lt. 12"
                placeholderTextColor={colors.textMuted}
                value={street2}
                onChangeText={setStreet2}
              />
            </View>

            <View style={styles.rowTwoCols}>
              <View style={[styles.fieldBlock, { flex: 1 }]}>
                <Text style={styles.fieldLabel}>Kota (City)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="cth. Jakarta Selatan"
                  placeholderTextColor={colors.textMuted}
                  value={city}
                  onChangeText={setCity}
                />
              </View>
              <View style={[styles.fieldBlock, { flex: 0.6 }]}>
                <Text style={styles.fieldLabel}>Kode Pos (Zip)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="cth. 12190"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="number-pad"
                  value={zip}
                  onChangeText={setZip}
                />
              </View>
            </View>
          </View>

          {/* Notes Group */}
          <View style={styles.formGroup}>
            <Text style={styles.groupLabel}>Catatan Tambahan</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="Tambahkan catatan khusus mengenai kontak ini..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              value={comment}
              onChangeText={setComment}
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitBtn, loading && { opacity: 0.7 }]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.88}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitBtnText}>
                {isEdit ? "Simpan Perubahan Kontak" : "Buat Kontak Baru"}
              </Text>
            )}
          </TouchableOpacity>

          <View style={{ height: hpx(30) }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  centerLoading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.surface,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: rf(14),
    color: colors.textSecondary,
  },
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
  headerContent: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: rf(20),
    fontWeight: "800" as any,
    color: "#FFFFFF",
  },
  headerSub: {
    fontSize: rf(12),
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: hpx(2),
  },
  saveHeaderBtn: {
    padding: spacing.xs,
  },
  saveHeaderBtnText: {
    fontSize: rf(14),
    fontWeight: "700" as any,
    color: "#FFFFFF",
  },
  typeSelectorBg: {
    flexDirection: "row",
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.xs,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  typeOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: hpx(10),
    borderRadius: radius.sm,
    gap: spacing.xs,
  },
  typeOptionActive: {
    backgroundColor: colors.primaryLight,
  },
  typeOptionText: {
    fontSize: rf(13),
    fontWeight: "600" as any,
    color: colors.textSecondary,
  },
  typeOptionTextActive: {
    color: colors.primary,
    fontWeight: "700" as any,
  },
  scrollContent: {
    paddingHorizontal: spacing["2xl"],
    paddingTop: hpx(16),
  },
  formGroup: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  groupLabel: {
    fontSize: rf(14),
    fontWeight: "800" as any,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  fieldBlock: {
    marginBottom: spacing.md,
  },
  fieldLabel: {
    fontSize: rf(12),
    fontWeight: "600" as any,
    color: colors.textSecondary,
    marginBottom: hpx(6),
  },
  textInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: hpx(46),
    fontSize: rf(14),
    color: colors.textPrimary,
  },
  textArea: {
    height: hpx(100),
    paddingVertical: spacing.md,
  },
  rowTwoCols: {
    flexDirection: "row",
    gap: spacing.md,
  },
  parentPresetBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.md,
    paddingVertical: hpx(10),
    borderRadius: radius.md,
    gap: spacing.sm,
  },
  parentPresetText: {
    fontSize: rf(14),
    fontWeight: "700" as any,
    color: colors.primary,
  },
  companyChipRow: {
    flexDirection: "row",
    gap: spacing.xs,
    paddingVertical: spacing.xs,
  },
  companyChip: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: hpx(8),
    borderRadius: radius.full,
  },
  companyChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  companyChipText: {
    fontSize: rf(12),
    fontWeight: "600" as any,
    color: colors.textSecondary,
  },
  companyChipTextSelected: {
    color: "#FFFFFF",
  },
  submitBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: hpx(14),
    alignItems: "center",
    justifyContent: "center",
    ...shadows.elevated,
  },
  submitBtnText: {
    fontSize: rf(15),
    fontWeight: "800" as any,
    color: "#FFFFFF",
  },
});
