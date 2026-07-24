import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { contactService } from "../services/contactService";
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

  // 2-Step Flow State for creating Company -> Person
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [createdCompany, setCreatedCompany] = useState<{ id: number; name: string } | null>(null);
  const [showCompanySuccessModal, setShowCompanySuccessModal] = useState(false);
  const [showPersonSuccessModal, setShowPersonSuccessModal] = useState(false);
  const [lastCreatedPersonName, setLastCreatedPersonName] = useState("");

  // Modal State for Parent Company Dropdown
  const [parentModalVisible, setParentModalVisible] = useState(false);
  const [parentSearchQuery, setParentSearchQuery] = useState("");

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
      const isCompany = companyType === "company";

      if (isEdit) {
        await contactService.update(contactId, {
          name: name.trim(),
          company_type: companyType,
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          website: isCompany ? website.trim() || undefined : undefined,
          vat: isCompany ? vat.trim() || undefined : undefined,
          function: !isCompany ? jobFunction.trim() || undefined : undefined,
          street: isCompany ? street.trim() || undefined : undefined,
          street2: isCompany ? street2.trim() || undefined : undefined,
          city: isCompany ? city.trim() || undefined : undefined,
          zip: isCompany ? zip.trim() || undefined : undefined,
          comment: comment.trim() || undefined,
          parent_id: parentId,
          company_name: parentName || undefined,
        });
        showToast("success", "Berhasil Diperbarui", `Kontak ${name} berhasil disimpan.`);
        router.back();
      } else {
        const res = await contactService.create({
          name: name.trim(),
          company_type: companyType,
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          website: isCompany ? website.trim() || undefined : undefined,
          vat: isCompany ? vat.trim() || undefined : undefined,
          function: !isCompany ? jobFunction.trim() || undefined : undefined,
          street: isCompany ? street.trim() || undefined : undefined,
          street2: isCompany ? street2.trim() || undefined : undefined,
          city: isCompany ? city.trim() || undefined : undefined,
          zip: isCompany ? zip.trim() || undefined : undefined,
          comment: comment.trim() || undefined,
          parent_id: parentId,
          company_name: parentName || undefined,
        });

        if (companyType === "company" && currentStep === 1) {
          setCreatedCompany({ id: res.id, name: res.name });
          setShowCompanySuccessModal(true);
        } else if (currentStep === 2) {
          setLastCreatedPersonName(res.name);
          setShowPersonSuccessModal(true);
        } else {
          showToast(
            "success",
            "Kontak Dibuat",
            `Kontak ${companyType === "company" ? "Perusahaan" : "Person"} ${name} berhasil ditambahkan.`
          );
          router.back();
        }
      }
    } catch (err) {
      console.warn("Submit contact error:", err);
      showToast("error", "Gagal Menyimpan", "Terjadi kesalahan saat menyimpan kontak.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoToStep2 = () => {
    if (!createdCompany) return;
    setShowCompanySuccessModal(false);
    setCurrentStep(2);
    setCompanyType("person");
    setParentId(createdCompany.id);
    setParentName(createdCompany.name);

    // Clear person specific fields, keep address
    setName("");
    setEmail("");
    setPhone("");
    setJobFunction("");
    setComment("");
  };

  const handleFinishCompany = () => {
    setShowCompanySuccessModal(false);
    if (createdCompany) {
      router.replace({
        pathname: "/contact-detail",
        params: { id: createdCompany.id },
      } as any);
    } else {
      router.back();
    }
  };

  const handleAddAnotherPerson = () => {
    setShowPersonSuccessModal(false);
    setName("");
    setEmail("");
    setPhone("");
    setJobFunction("");
    setComment("");
  };

  const handleFinishPerson = () => {
    setShowPersonSuccessModal(false);
    if (createdCompany) {
      router.replace({
        pathname: "/contact-detail",
        params: { id: createdCompany.id },
      } as any);
    } else {
      router.back();
    }
  };

  const filteredCompanyList = companyList.filter((c) => {
    if (!parentSearchQuery.trim()) return true;
    const q = parentSearchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.city?.toLowerCase().includes(q) ||
      c.vat?.toLowerCase().includes(q)
    );
  });

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
              : currentStep === 2
                ? "Tambah Person"
                : companyType === "company"
                  ? "Tambah Perusahaan"
                  : "Tambah Person"}
          </Text>
          <Text style={styles.headerSub}>
            {currentStep === 2 ? `Person untuk ${createdCompany?.name || parentName}` : "Formulir Kontak CRM"}
          </Text>
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
            <Text style={styles.saveHeaderBtnText}>
              {currentStep === 1 && companyType === "company" && !isEdit ? "Lanjut" : "Simpan"}
            </Text>
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
          {/* Stepper Header for 2-Step Flow */}
          {!isEdit && (initialCompanyType === "company" || currentStep === 2) ? (
            <View style={styles.stepperContainer}>
              <View style={[styles.stepItem, currentStep === 1 && styles.stepItemActive]}>
                <View
                  style={[
                    styles.stepBadge,
                    currentStep === 1
                      ? styles.stepBadgeActive
                      : currentStep > 1
                        ? styles.stepBadgeDone
                        : styles.stepBadgeInactive,
                  ]}
                >
                  {currentStep > 1 ? (
                    <Ionicons name="checkmark" size={wpx(14)} color="#FFFFFF" />
                  ) : (
                    <Text style={[styles.stepBadgeText, currentStep === 1 && styles.stepBadgeTextActive]}>
                      1
                    </Text>
                  )}
                </View>
                <Text style={[styles.stepLabel, currentStep === 1 && styles.stepLabelActive]}>
                  Perusahaan
                </Text>
              </View>

              <View style={[styles.stepLine, currentStep > 1 && styles.stepLineActive]} />

              <View style={[styles.stepItem, currentStep === 2 && styles.stepItemActive]}>
                <View
                  style={[
                    styles.stepBadge,
                    currentStep === 2 ? styles.stepBadgeActive : styles.stepBadgeInactive,
                  ]}
                >
                  <Text style={[styles.stepBadgeText, currentStep === 2 && styles.stepBadgeTextActive]}>
                    2
                  </Text>
                </View>
                <Text style={[styles.stepLabel, currentStep === 2 && styles.stepLabelActive]}>
                  Person Terkait
                </Text>
              </View>
            </View>
          ) : null}

          {/* Locked Parent Company Banner when in Step 2 */}
          {currentStep === 2 && (createdCompany || parentName) ? (
            <View style={styles.parentLockedBanner}>
              <View style={styles.parentLockedIcon}>
                <Ionicons name="business" size={wpx(22)} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.parentLockedSub}>Menambahkan Person Terkait Untuk:</Text>
                <Text style={styles.parentLockedName}>{createdCompany?.name || parentName}</Text>
              </View>
              <View style={styles.parentLockedTag}>
                <Ionicons name="lock-closed" size={wpx(13)} color={colors.primary} />
                <Text style={styles.parentLockedTagText}>Terhubung</Text>
              </View>
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
                {/* Parent Company selector (Modal Dropdown) */}
                <View style={styles.fieldBlock}>
                  <Text style={styles.fieldLabel}>Perusahaan Induk (Parent Company)</Text>
                  <TouchableOpacity
                    style={styles.dropdownSelectInput}
                    onPress={() => setParentModalVisible(true)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="business" size={wpx(18)} color={colors.primary} />
                    <Text
                      style={[
                        styles.dropdownSelectText,
                        !parentName && styles.dropdownPlaceholderText,
                      ]}
                      numberOfLines={1}
                    >
                      {parentName || "Pilih Perusahaan Induk..."}
                    </Text>
                    {parentName ? (
                      <TouchableOpacity
                        onPress={(e) => {
                          e.stopPropagation();
                          setParentId(undefined);
                          setParentName("");
                        }}
                        style={{ padding: spacing.xs }}
                      >
                        <Ionicons name="close-circle" size={wpx(18)} color={colors.textMuted} />
                      </TouchableOpacity>
                    ) : (
                      <Ionicons name="chevron-down" size={wpx(18)} color={colors.textMuted} />
                    )}
                  </TouchableOpacity>
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
              <Text style={styles.fieldLabel}>No. Telepon / HP (phone)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="cth. +6281234567890"
                placeholderTextColor={colors.textMuted}
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />
            </View>
          </View>

          {/* Address Group (Only for Company) */}
          {companyType === "company" ? (
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
          ) : null}

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
                {isEdit
                  ? "Simpan Perubahan Kontak"
                  : currentStep === 1 && companyType === "company"
                    ? "Simpan Perusahaan & Lanjut"
                    : currentStep === 2
                      ? "Simpan Kontak Person"
                      : "Buat Kontak Baru"}
              </Text>
            )}
          </TouchableOpacity>

          <View style={{ height: hpx(30) }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modal Selection for Parent Company */}
      <Modal
        visible={parentModalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setParentModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <StatusBar style="light" />

          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setParentModalVisible(false)}
            >
              <Ionicons name="close" size={wpx(22)} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.modalHeaderTitle}>Pilih Perusahaan Induk</Text>
            <View style={{ width: wpx(36) }} />
          </View>

          {/* Search Input Box */}
          <View style={styles.modalSearchBox}>
            <Ionicons name="search" size={wpx(18)} color={colors.textMuted} />
            <TextInput
              style={styles.modalSearchInput}
              placeholder="Cari nama perusahaan, NPWP, kota..."
              placeholderTextColor={colors.textMuted}
              value={parentSearchQuery}
              onChangeText={setParentSearchQuery}
            />
            {parentSearchQuery ? (
              <TouchableOpacity onPress={() => setParentSearchQuery("")}>
                <Ionicons name="close-circle" size={wpx(18)} color={colors.textMuted} />
              </TouchableOpacity>
            ) : null}
          </View>

          <ScrollView
            contentContainerStyle={styles.modalScroll}
            showsVerticalScrollIndicator={false}
          >
            {/* Option to clear selection / None */}
            <TouchableOpacity
              style={[
                styles.companySelectItem,
                !parentId && styles.companySelectItemActive,
              ]}
              onPress={() => {
                setParentId(undefined);
                setParentName("");
                setParentModalVisible(false);
              }}
              activeOpacity={0.8}
            >
              <View style={styles.companySelectIconBg}>
                <Ionicons name="close-circle-outline" size={wpx(20)} color={colors.textMuted} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.companySelectName}>Tanpa Perusahaan Induk</Text>
                <Text style={styles.companySelectSub}>Kontak individu mandiri</Text>
              </View>
              {!parentId && (
                <Ionicons name="checkmark-circle" size={wpx(20)} color={colors.primary} />
              )}
            </TouchableOpacity>

            {filteredCompanyList.length === 0 ? (
              <View style={styles.modalEmptyBox}>
                <Ionicons name="business-outline" size={wpx(48)} color={colors.textMuted} />
                <Text style={styles.modalEmptyTitle}>Perusahaan Tidak Ditemukan</Text>
                <Text style={styles.modalEmptySub}>
                  Tidak ada hasil pencarian untuk "{parentSearchQuery}"
                </Text>
              </View>
            ) : (
              filteredCompanyList.map((comp) => {
                const isSelected = parentId === comp.id;
                return (
                  <TouchableOpacity
                    key={comp.id}
                    style={[
                      styles.companySelectItem,
                      isSelected && styles.companySelectItemActive,
                    ]}
                    onPress={() => {
                      setParentId(comp.id);
                      setParentName(comp.name);
                      setParentModalVisible(false);
                    }}
                    activeOpacity={0.8}
                  >
                    <View style={styles.companySelectIconBg}>
                      <Ionicons name="business" size={wpx(20)} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.companySelectName}>{comp.name}</Text>
                      {comp.city || comp.email ? (
                        <Text style={styles.companySelectSub} numberOfLines={1}>
                          {[comp.city, comp.email].filter(Boolean).join(" • ")}
                        </Text>
                      ) : null}
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={wpx(20)} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* Modal 1: Step 1 Company Success Prompt */}
      <Modal
        visible={showCompanySuccessModal}
        transparent
        animationType="fade"
        onRequestClose={handleFinishCompany}
      >
        <View style={styles.promptOverlay}>
          <View style={styles.promptCard}>
            <View style={styles.promptSuccessIconBg}>
              <Ionicons name="business" size={wpx(36)} color="#059669" />
            </View>
            <Text style={styles.promptTitle}>Perusahaan Berhasil Dibuat!</Text>
            <Text style={styles.promptSub}>
              Perusahaan <Text style={{ fontWeight: "700", color: colors.textPrimary }}>{createdCompany?.name}</Text> telah tersimpan di sistem.
              {"\n\n"}Apakah Anda ingin langsung menambahkan Kontak Person (PIC / Pejabat) untuk perusahaan ini?
            </Text>

            <View style={styles.promptActionsColumn}>
              <TouchableOpacity
                style={styles.promptPrimaryBtn}
                onPress={handleGoToStep2}
                activeOpacity={0.88}
              >
                <Ionicons name="person-add" size={wpx(18)} color="#FFFFFF" />
                <Text style={styles.promptPrimaryBtnText}>+ Langsung Tambah Person</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.promptSecondaryBtn}
                onPress={handleFinishCompany}
                activeOpacity={0.88}
              >
                <Ionicons name="checkmark-circle-outline" size={wpx(18)} color={colors.textSecondary} />
                <Text style={styles.promptSecondaryBtnText}>Selesai (Nanti Saja)</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal 2: Step 2 Person Success Prompt */}
      <Modal
        visible={showPersonSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={handleFinishPerson}
      >
        <View style={styles.promptOverlay}>
          <View style={styles.promptCard}>
            <View style={styles.promptSuccessIconBgPerson}>
              <Ionicons name="person-circle" size={wpx(36)} color="#7C3AED" />
            </View>
            <Text style={styles.promptTitle}>Person Berhasil Ditambahkan!</Text>
            <Text style={styles.promptSub}>
              Kontak <Text style={{ fontWeight: "700", color: colors.textPrimary }}>{lastCreatedPersonName}</Text> telah terhubung ke perusahaan <Text style={{ fontWeight: "700", color: colors.textPrimary }}>{createdCompany?.name || parentName}</Text>.
            </Text>

            <View style={styles.promptActionsColumn}>
              <TouchableOpacity
                style={styles.promptPrimaryBtnPerson}
                onPress={handleAddAnotherPerson}
                activeOpacity={0.88}
              >
                <Ionicons name="person-add" size={wpx(18)} color="#FFFFFF" />
                <Text style={styles.promptPrimaryBtnText}>+ Tambah Person Lainnya</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.promptSecondaryBtn}
                onPress={handleFinishPerson}
                activeOpacity={0.88}
              >
                <Ionicons name="checkmark-done-circle" size={wpx(18)} color={colors.textSecondary} />
                <Text style={styles.promptSecondaryBtnText}>Selesai & Lihat Detail</Text>
              </TouchableOpacity>
            </View>
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
  dropdownSelectInput: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: hpx(48),
    gap: spacing.sm,
  },
  dropdownSelectText: {
    flex: 1,
    fontSize: rf(14),
    fontWeight: "600" as any,
    color: colors.textPrimary,
  },
  dropdownPlaceholderText: {
    color: colors.textMuted,
    fontWeight: "400" as any,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  modalHeader: {
    height: hpx(90),
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xl,
    paddingTop: hpx(24),
  },
  modalCloseBtn: {
    width: wpx(36),
    height: wpx(36),
    borderRadius: radius.full,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  modalHeaderTitle: {
    fontSize: rf(16),
    fontWeight: "800" as any,
    color: "#FFFFFF",
  },
  modalSearchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: radius.md,
    marginHorizontal: spacing.xl,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    height: sizes.searchHeight,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
    ...shadows.card,
  },
  modalSearchInput: {
    flex: 1,
    fontSize: rf(14),
    color: colors.textPrimary,
  },
  modalScroll: {
    paddingHorizontal: spacing.xl,
    paddingBottom: hpx(40),
    paddingTop: spacing.sm,
    gap: spacing.sm,
  },
  companySelectItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
    ...shadows.card,
  },
  companySelectItemActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  companySelectIconBg: {
    width: wpx(38),
    height: wpx(38),
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  companySelectName: {
    fontSize: rf(14),
    fontWeight: "700" as any,
    color: colors.textPrimary,
  },
  companySelectSub: {
    fontSize: rf(12),
    color: colors.textMuted,
    marginTop: hpx(1),
  },
  modalEmptyBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: hpx(50),
  },
  modalEmptyTitle: {
    fontSize: rf(16),
    fontWeight: "700" as any,
    color: colors.textPrimary,
    marginTop: spacing.md,
  },
  modalEmptySub: {
    fontSize: rf(12),
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  stepperContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  stepItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  stepItemActive: {},
  stepBadge: {
    width: wpx(24),
    height: wpx(24),
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  stepBadgeActive: {
    backgroundColor: colors.primary,
  },
  stepBadgeDone: {
    backgroundColor: "#059669",
  },
  stepBadgeInactive: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stepBadgeText: {
    fontSize: rf(12),
    fontWeight: "700" as any,
    color: colors.textMuted,
  },
  stepBadgeTextActive: {
    color: "#FFFFFF",
  },
  stepLabel: {
    fontSize: rf(12),
    fontWeight: "600" as any,
    color: colors.textMuted,
  },
  stepLabelActive: {
    color: colors.primary,
    fontWeight: "800" as any,
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: colors.border,
    marginHorizontal: spacing.sm,
  },
  stepLineActive: {
    backgroundColor: "#059669",
  },
  parentLockedBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primaryLight,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.primary + "40",
    gap: spacing.md,
  },
  parentLockedIcon: {
    width: wpx(40),
    height: wpx(40),
    borderRadius: radius.md,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  parentLockedSub: {
    fontSize: rf(11),
    color: colors.primary,
    fontWeight: "600" as any,
  },
  parentLockedName: {
    fontSize: rf(15),
    fontWeight: "800" as any,
    color: colors.primary,
    marginTop: hpx(1),
  },
  parentLockedTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: spacing.sm,
    paddingVertical: hpx(4),
    borderRadius: radius.full,
    gap: hpx(4),
  },
  parentLockedTagText: {
    fontSize: rf(11),
    fontWeight: "700" as any,
    color: colors.primary,
  },
  promptOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.65)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
  },
  promptCard: {
    width: "100%",
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing["2xl"],
    alignItems: "center",
    ...shadows.elevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  promptSuccessIconBg: {
    width: wpx(64),
    height: wpx(64),
    borderRadius: radius.full,
    backgroundColor: "#D1FAE5",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  promptSuccessIconBgPerson: {
    width: wpx(64),
    height: wpx(64),
    borderRadius: radius.full,
    backgroundColor: "#F3E8FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  promptTitle: {
    fontSize: rf(18),
    fontWeight: "800" as any,
    color: colors.textPrimary,
    textAlign: "center",
    marginBottom: spacing.xs,
  },
  promptSub: {
    fontSize: rf(13),
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: rf(19),
    marginBottom: spacing.xl,
  },
  promptActionsColumn: {
    width: "100%",
    gap: spacing.sm,
  },
  promptPrimaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: hpx(14),
    gap: spacing.xs,
    ...shadows.card,
  },
  promptPrimaryBtnPerson: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#7C3AED",
    borderRadius: radius.lg,
    paddingVertical: hpx(14),
    gap: spacing.xs,
    ...shadows.card,
  },
  promptPrimaryBtnText: {
    fontSize: rf(14),
    fontWeight: "700" as any,
    color: "#FFFFFF",
  },
  promptSecondaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingVertical: hpx(12),
    gap: spacing.xs,
  },
  promptSecondaryBtnText: {
    fontSize: rf(13),
    fontWeight: "600" as any,
    color: colors.textSecondary,
  },
});
