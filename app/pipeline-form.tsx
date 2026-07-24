import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
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
import { pipelineService } from "../services/pipelineService";
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
import type {
  CrmStage,
  PipelinePriority,
  PipelineStage,
} from "../types/pipeline";
import { showToast } from "../utils/toast";

const DEFAULT_STAGES: PipelineStage[] = [
  "Activity",
  "Lead",
  "Opportunity",
];

const PRIORITIES: PipelinePriority[] = ["Low", "Medium", "High"];

function formatCurrencyInput(val: string): string {
  const digits = val.replace(/[^0-9]/g, "");
  if (!digits) return "";
  const formatted = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `Rp ${formatted}`;
}

export function getProbabilityByStage(stageName: string): string {
  const name = stageName.toLowerCase().trim();
  if (name.includes("activity") || name.includes("aktivitas")) {
    return "10";
  }
  if (name.includes("lead")) {
    return "50";
  }
  if (name.includes("won") || name.includes("menang")) {
    return "100";
  }
  if (name.includes("lost") || name.includes("gagal")) {
    return "0";
  }
  return "90";
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

export default function PipelineFormScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id?: string }>();

  const isEdit = !!params.id;

  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [stages, setStages] = useState<CrmStage[]>([]);

  // Form Fields State
  const [title, setTitle] = useState("");
  const [client, setClient] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [stage, setStage] = useState<PipelineStage>("Activity");
  const [priority, setPriority] = useState<PipelinePriority>("Low");
  const [probability, setProbability] = useState("10");
  const [dateDeadline, setDateDeadline] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [notes, setNotes] = useState("");

  // Contact Selection Modal state
  const [contactModalVisible, setContactModalVisible] = useState(false);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [companiesList, setCompaniesList] = useState<Contact[]>([]);
  const [personsMap, setPersonsMap] = useState<Record<number, Contact[]>>({});
  const [contactSearchQuery, setContactSearchQuery] = useState("");

  // Quick Create Contact Modal state (Full 2-Step Flow)
  const [createContactModalVisible, setCreateContactModalVisible] = useState(false);
  const [newContactStep, setNewContactStep] = useState<1 | 2>(1);
  const [newContactType, setNewContactType] = useState<CompanyType>("company");
  const [newContactName, setNewContactName] = useState("");
  const [newContactEmail, setNewContactEmail] = useState("");
  const [newContactPhone, setNewContactPhone] = useState("");
  const [newContactWebsite, setNewContactWebsite] = useState("");
  const [newContactVat, setNewContactVat] = useState("");
  const [newContactFunction, setNewContactFunction] = useState("");
  const [newContactStreet, setNewContactStreet] = useState("");
  const [newContactStreet2, setNewContactStreet2] = useState("");
  const [newContactCity, setNewContactCity] = useState("");
  const [newContactZip, setNewContactZip] = useState("");
  const [newContactComment, setNewContactComment] = useState("");
  const [newContactParentId, setNewContactParentId] = useState<number | undefined>(undefined);
  const [creatingContact, setCreatingContact] = useState(false);

  // Success modals inside quick create modal
  const [createdCompanyInModal, setCreatedCompanyInModal] = useState<Contact | null>(null);
  const [showCompanyModalSuccess, setShowCompanyModalSuccess] = useState(false);
  const [showPersonModalSuccess, setShowPersonModalSuccess] = useState(false);
  const [lastCreatedPersonNameModal, setLastCreatedPersonNameModal] = useState("");

  const resetQuickCreateState = () => {
    setNewContactStep(1);
    setNewContactType("company");
    setNewContactName("");
    setNewContactEmail("");
    setNewContactPhone("");
    setNewContactWebsite("");
    setNewContactVat("");
    setNewContactFunction("");
    setNewContactStreet("");
    setNewContactStreet2("");
    setNewContactCity("");
    setNewContactZip("");
    setNewContactComment("");
    setNewContactParentId(undefined);
    setCreatedCompanyInModal(null);
    setShowCompanyModalSuccess(false);
    setShowPersonModalSuccess(false);
    setLastCreatedPersonNameModal("");
  };

  // Load stages & initial data if editing
  useEffect(() => {
    async function init() {
      try {
        const fetchedStages = await pipelineService.fetchStages();
        if (fetchedStages && fetchedStages.length > 0) {
          setStages(fetchedStages);
        }
      } catch (err) {
        console.warn("Failed to load stages:", err);
      }

      if (isEdit && params.id) {
        try {
          const item = await pipelineService.getById(params.id);
          if (item) {
            if (item.wonStatus === "lost" || item.stage === "Lost") {
              showToast("error", "Tidak Dapat Di-edit", "CRM Lead ini berstatus Lost (Gagal) dan tidak dapat diubah lagi.");
              router.back();
              return;
            }
            setTitle(item.title);
            setClient(item.client);
            setEmail(item.email_from || "");
            setPhone(item.phone || "");
            setAmount(item.amount ? formatCurrencyInput(item.amount.toString()) : "");
            setStage(item.stage || "Lead");
            setPriority(item.priority || "Medium");
            setProbability(item.probability ? item.probability.toString() : "50");
            if (item.expectedCloseDate) {
              const parsedDate = new Date(item.expectedCloseDate);
              if (!isNaN(parsedDate.getTime())) {
                setDateDeadline(parsedDate);
              }
            }
            setNotes(stripHtmlTags(item.notes || ""));
          } else {
            showToast("error", "Data Tidak Ditemukan", "Lead tidak ditemukan.");
            router.back();
          }
        } catch (err: any) {
          showToast("error", "Gagal Memuat Data", err?.message);
        } finally {
          setLoading(false);
        }
      }
    }
    init();
  }, [isEdit, params.id]);

  // Load contacts list for modal
  const handleOpenContactModal = async () => {
    setContactModalVisible(true);
    if (companiesList.length === 0) {
      try {
        setContactsLoading(true);
        const res = await contactService.list({ company_type: "company", per_page: 100 });
        const comps = res.items || [];
        setCompaniesList(comps);

        const pMap: Record<number, Contact[]> = {};
        await Promise.all(
          comps.map(async (c) => {
            try {
              const pList = await contactService.getPersonsForCompany(c.id);
              pMap[c.id] = pList;
            } catch {
              pMap[c.id] = [];
            }
          })
        );
        setPersonsMap(pMap);
      } catch (err) {
        console.warn("Failed loading contacts for pipeline modal:", err);
      } finally {
        setContactsLoading(false);
      }
    }
  };

  // Select contact & auto-populate email + phone
  const handleSelectCompanyContact = (company: Contact) => {
    setClient(company.name);
    if (company.email) setEmail(company.email);
    if (company.phone) {
      setPhone(company.phone);
    }
    setContactModalVisible(false);
    showToast("info", "Kontak Dipilih", `Mengisi data dari perusahaan ${company.name}`);
  };

  const handleSelectPersonContact = (person: Contact, parentComp?: Contact) => {
    const clientName = parentComp
      ? `${person.name} (${parentComp.name})`
      : person.name;
    setClient(clientName);
    if (person.email) setEmail(person.email);
    if (person.phone) {
      setPhone(person.phone);
    }
    setContactModalVisible(false);
    showToast("info", "Kontak Person Dipilih", `Mengisi data dari ${person.name}`);
  };

  const handleQuickCreateContact = async () => {
    if (!newContactName.trim()) {
      showToast("error", "Nama Wajib Diisi", "Masukkan nama perusahaan atau kontak person.");
      return;
    }

    try {
      setCreatingContact(true);
      const isCompany = newContactType === "company";

      const created = await contactService.create({
        name: newContactName.trim(),
        company_type: newContactType,
        email: newContactEmail.trim() || undefined,
        phone: newContactPhone.trim() || undefined,
        website: isCompany ? newContactWebsite.trim() || undefined : undefined,
        vat: isCompany ? newContactVat.trim() || undefined : undefined,
        function: !isCompany ? newContactFunction.trim() || undefined : undefined,
        street: isCompany ? newContactStreet.trim() || undefined : undefined,
        street2: isCompany ? newContactStreet2.trim() || undefined : undefined,
        city: isCompany ? newContactCity.trim() || undefined : undefined,
        zip: isCompany ? newContactZip.trim() || undefined : undefined,
        comment: newContactComment.trim() || undefined,
        parent_id: !isCompany ? newContactParentId : undefined,
      });

      // Refresh contacts list in state
      const res = await contactService.list({ company_type: "company", per_page: 100 });
      const comps = res.items || [];
      setCompaniesList(comps);

      const pMap: Record<number, Contact[]> = {};
      await Promise.all(
        comps.map(async (c) => {
          try {
            const pList = await contactService.getPersonsForCompany(c.id);
            pMap[c.id] = pList;
          } catch {
            pMap[c.id] = [];
          }
        })
      );
      setPersonsMap(pMap);

      if (isCompany && newContactStep === 1) {
        setCreatedCompanyInModal(created);
        setShowCompanyModalSuccess(true);
      } else if (newContactStep === 2) {
        setLastCreatedPersonNameModal(created.name);
        setShowPersonModalSuccess(true);
      } else {
        showToast("success", "Kontak Dibuat", `${created.name} berhasil disimpan.`);
        setCreateContactModalVisible(false);
        setContactModalVisible(false);
        resetQuickCreateState();

        if (newContactType === "company") {
          handleSelectCompanyContact(created);
        } else {
          const parentComp = comps.find((c) => c.id === newContactParentId);
          handleSelectPersonContact(created, parentComp);
        }
      }
    } catch (err: any) {
      console.warn("Failed creating contact in modal:", err);
      showToast("error", "Gagal Membuat Kontak", err?.message || "Terjadi kesalahan saat menyimpan kontak.");
    } finally {
      setCreatingContact(false);
    }
  };

  const handleGoToModalStep2 = () => {
    if (!createdCompanyInModal) return;
    setShowCompanyModalSuccess(false);
    setNewContactStep(2);
    setNewContactType("person");
    setNewContactParentId(createdCompanyInModal.id);

    // Clear person fields
    setNewContactName("");
    setNewContactEmail("");
    setNewContactPhone("");
    setNewContactFunction("");
    setNewContactComment("");
  };

  const handleFinishModalCompany = () => {
    setShowCompanyModalSuccess(false);
    setCreateContactModalVisible(false);
    setContactModalVisible(false);
    if (createdCompanyInModal) {
      handleSelectCompanyContact(createdCompanyInModal);
    }
    resetQuickCreateState();
  };

  const handleAddAnotherModalPerson = () => {
    setShowPersonModalSuccess(false);
    setNewContactName("");
    setNewContactEmail("");
    setNewContactPhone("");
    setNewContactFunction("");
    setNewContactComment("");
  };

  const handleFinishModalPerson = () => {
    setShowPersonModalSuccess(false);
    setCreateContactModalVisible(false);
    setContactModalVisible(false);

    if (createdCompanyInModal) {
      const parentComp = companiesList.find((c) => c.id === createdCompanyInModal.id) || createdCompanyInModal;
      const personsForThisComp = personsMap[createdCompanyInModal.id] || [];
      const lastPerson = personsForThisComp.find((p) => p.name === lastCreatedPersonNameModal) || personsForThisComp[0];
      if (lastPerson) {
        handleSelectPersonContact(lastPerson, parentComp);
      } else {
        handleSelectCompanyContact(createdCompanyInModal);
      }
    }
    resetQuickCreateState();
  };

  const handleSave = async () => {
    if (!title.trim()) {
      showToast("error", "Judul Wajib Diisi", "Masukkan judul opportunity / prospek.");
      return;
    }
    if (!client.trim()) {
      showToast("error", "Nama Klien Wajib Diisi", "Masukkan nama klien / perusahaan.");
      return;
    }

    const numAmount = parseFloat(amount.replace(/[^0-9]/g, "")) || 0;
    const numProb = Math.min(100, Math.max(0, parseInt(probability) || 50));
    const formattedDate = dateDeadline.toISOString().split("T")[0];

    // Match stage_id from loaded stages
    const matchedStage = stages.find(
      (s) => s.name.toLowerCase() === stage.toLowerCase()
    );
    const stageId = matchedStage ? matchedStage.id : undefined;

    try {
      setSubmitting(true);
      if (isEdit && params.id) {
        await pipelineService.update(params.id, {
          title: title.trim(),
          client: client.trim(),
          email_from: email.trim(),
          phone: phone.trim(),
          amount: numAmount,
          stage: stage,
          stageId: stageId,
          priority: priority,
          probability: numProb,
          expectedCloseDate: formattedDate,
          notes: notes.trim(),
        });
        showToast("success", "CRM Lead Diperbarui", "Perubahan berhasil disimpan.");
      } else {
        await pipelineService.create({
          title: title.trim(),
          client: client.trim(),
          email_from: email.trim(),
          phone: phone.trim(),
          amount: numAmount,
          stage: stage,
          stageId: stageId,
          priority: priority,
          probability: numProb,
          expectedCloseDate: formattedDate,
          notes: notes.trim(),
        });
        showToast("success", "CRM Lead Ditambahkan", "Prospek baru berhasil disimpan ke pipeline.");
      }
      router.back();
    } catch (err: any) {
      showToast("error", "Gagal Menyimpan", err?.message);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredCompanies = companiesList.filter((comp) => {
    const q = contactSearchQuery.toLowerCase();
    if (!q) return true;
    const compMatch =
      comp.name.toLowerCase().includes(q) ||
      comp.email?.toLowerCase().includes(q) ||
      comp.phone?.toLowerCase().includes(q) ||
      comp.city?.toLowerCase().includes(q);

    const persons = personsMap[comp.id] || [];
    const personMatch = persons.some(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.email?.toLowerCase().includes(q) ||
        p.phone?.toLowerCase().includes(q) ||
        p.function?.toLowerCase().includes(q)
    );

    return compMatch || personMatch;
  });

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Memuat formulir...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Header Standard Curved matching App */}
      <View style={styles.curvedHeader}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={wpx(24)} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.headerTitleBox}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {isEdit ? "Edit CRM Lead" : "Tambah CRM Lead"}
          </Text>
          <Text style={styles.headerSub}>Formulir Prospek & Opportunity</Text>
        </View>

        <TouchableOpacity
          style={[styles.saveHeaderBtn, submitting && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={submitting}
          activeOpacity={0.8}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.saveHeaderBtnText}>Simpan</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Section 1: Informasi Prospek & Klien */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="briefcase-outline" size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>Informasi Prospek & Klien</Text>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Judul Opportunity / Prospek *</Text>
            <TextInput
              style={styles.formInput}
              placeholder="Contoh: Pengadaan Server UNOTEK 2026"
              placeholderTextColor={colors.textMuted}
              value={title}
              onChangeText={setTitle}
            />
          </View>

          {/* Nama Klien / Perusahaan - Dropdown Modal Trigger */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Nama Klien / Perusahaan *</Text>
            <TouchableOpacity
              style={styles.selectInput}
              onPress={handleOpenContactModal}
              activeOpacity={0.8}
            >
              <Ionicons name="business-outline" size={wpx(18)} color={colors.primary} />
              <Text
                style={client ? styles.selectInputText : styles.selectInputPlaceholder}
                numberOfLines={1}
              >
                {client || "Pilih Kontak / Perusahaan..."}
              </Text>
              <Ionicons name="chevron-down" size={wpx(18)} color={colors.textMuted} />
            </TouchableOpacity>
            {client ? (
              <Text style={styles.fieldHelper}>
                * Anda dapat mengubah email & no telp di bawah ini jika diperlukan.
              </Text>
            ) : null}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Email Kontak (email_from)</Text>
            <TextInput
              style={styles.formInput}
              placeholder="Contoh: contact@banknusantara.co.id"
              placeholderTextColor={colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>No. Telepon / Handphone (phone)</Text>
            <TextInput
              style={styles.formInput}
              placeholder="Contoh: +6281234567890"
              placeholderTextColor={colors.textMuted}
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />
          </View>
        </View>

        {/* Section 2: Estimasi & Nilai Deal */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="cash-outline" size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>Estimasi Nilai & Deadline</Text>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Nilai Potential Revenue (Rp)</Text>
            <TextInput
              style={styles.formInput}
              placeholder="Contoh: Rp 150.000.000"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              value={amount}
              onChangeText={(text) => setAmount(formatCurrencyInput(text))}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Estimasi Tanggal Closing</Text>
            <TouchableOpacity
              style={styles.datePickerBtn}
              onPress={() => setShowDatePicker(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.datePickerText}>
                {dateDeadline.toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </Text>
              <Ionicons name="calendar-outline" size={20} color={colors.primary} />
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={dateDeadline}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={(event, selectedDate) => {
                  setShowDatePicker(false);
                  if (selectedDate) setDateDeadline(selectedDate);
                }}
              />
            )}
          </View>
        </View>

        {/* Section 3: Stage & Probabilitas */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="git-network-outline" size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>Tahapan Deal (Stage)</Text>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Pilih Stage</Text>
            <View style={styles.chipRow}>
              {DEFAULT_STAGES.map((stg) => {
                const isActive = stage === stg;
                return (
                  <TouchableOpacity
                    key={stg}
                    style={[styles.selectChip, isActive && styles.selectChipActive]}
                    onPress={() => {
                      setStage(stg);
                      setProbability(getProbabilityByStage(stg));
                    }}
                  >
                    <Text style={[styles.selectChipText, isActive && styles.selectChipTextActive]}>
                      {stg}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Prioritas</Text>
            <View style={styles.chipRow}>
              {PRIORITIES.map((p) => {
                const isActive = priority === p;
                return (
                  <TouchableOpacity
                    key={p}
                    style={[styles.selectChip, isActive && styles.selectChipActive]}
                    onPress={() => setPriority(p)}
                  >
                    <Text style={[styles.selectChipText, isActive && styles.selectChipTextActive]}>
                      {p}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        {/* Section 4: Catatan Perkembangan */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="create-outline" size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>Catatan Perkembangan & Keterangan</Text>
          </View>

          <View style={styles.formGroup}>
            <TextInput
              style={[styles.formInput, { height: hpx(100), textAlignVertical: "top" }]}
              placeholder="Tuliskan catatan negosiasi, syarat penawaran, atau progres tim..."
              placeholderTextColor={colors.textMuted}
              multiline
              value={notes}
              onChangeText={setNotes}
            />
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveBtn, submitting && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={submitting}
          activeOpacity={0.85}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.saveBtnText}>
              {isEdit ? "Simpan Perubahan Lead" : "Tambah CRM Lead"}
            </Text>
          )}
        </TouchableOpacity>

        <View style={{ height: hpx(40) }} />
      </ScrollView>

      {/* Modal Selection for Contacts & Companies */}
      <Modal
        visible={contactModalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setContactModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <StatusBar style="light" />

          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setContactModalVisible(false)}
            >
              <Ionicons name="close" size={wpx(22)} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.modalHeaderTitle}>Pilih Kontak Perusahaan / Person</Text>
            <TouchableOpacity
              style={styles.modalAddHeaderBtn}
              onPress={() => setCreateContactModalVisible(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={wpx(18)} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Search Box inside Modal */}
          <View style={styles.modalSearchBox}>
            <Ionicons name="search" size={wpx(18)} color={colors.textMuted} />
            <TextInput
              style={styles.modalSearchInput}
              placeholder="Cari perusahaan, person, email, telp..."
              placeholderTextColor={colors.textMuted}
              value={contactSearchQuery}
              onChangeText={setContactSearchQuery}
            />
            {contactSearchQuery ? (
              <TouchableOpacity onPress={() => setContactSearchQuery("")}>
                <Ionicons name="close-circle" size={wpx(18)} color={colors.textMuted} />
              </TouchableOpacity>
            ) : null}
          </View>

          {contactsLoading ? (
            <View style={styles.modalCenterLoading}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Memuat kontak perusahaan & person...</Text>
            </View>
          ) : (
            <ScrollView
              contentContainerStyle={styles.modalScroll}
              showsVerticalScrollIndicator={false}
            >
              {filteredCompanies.length === 0 ? (
                <View style={styles.modalEmptyBox}>
                  <Ionicons name="business-outline" size={wpx(48)} color={colors.textMuted} />
                  <Text style={styles.modalEmptyTitle}>Kontak Tidak Ditemukan</Text>
                  <Text style={styles.modalEmptySub}>
                    Tidak ada kontak yang cocok dengan "{contactSearchQuery}".
                  </Text>
                </View>
              ) : (
                filteredCompanies.map((comp) => {
                  const pList = personsMap[comp.id] || [];
                  return (
                    <View key={comp.id} style={styles.contactCompCard}>
                      {/* Company Row */}
                      <TouchableOpacity
                        style={styles.companyRowSelect}
                        onPress={() => handleSelectCompanyContact(comp)}
                        activeOpacity={0.8}
                      >
                        <View style={styles.compIconBg}>
                          <Ionicons name="business" size={wpx(20)} color={colors.primary} />
                        </View>
                        <View style={styles.compMainInfo}>
                          <Text style={styles.compNameText}>{comp.name}</Text>
                          {comp.email || comp.phone ? (
                            <Text style={styles.compSubText} numberOfLines={1}>
                              {[comp.email, comp.phone].filter(Boolean).join(" • ")}
                            </Text>
                          ) : (
                            <Text style={styles.compSubText}>Perusahaan (Company)</Text>
                          )}
                        </View>
                        <View style={styles.selectBtnBadge}>
                          <Text style={styles.selectBtnBadgeText}>Pilih Company</Text>
                        </View>
                      </TouchableOpacity>

                      {/* Linked Persons List */}
                      {pList.length > 0 ? (
                        <View style={styles.personSubSection}>
                          <Text style={styles.personSubHeaderLabel}>
                            Person Terkait ({pList.length}):
                          </Text>
                          {pList.map((person) => (
                            <TouchableOpacity
                              key={person.id}
                              style={styles.personRowSelect}
                              onPress={() => handleSelectPersonContact(person, comp)}
                              activeOpacity={0.8}
                            >
                              <View style={styles.personMiniAvatar}>
                                <Ionicons name="person" size={wpx(14)} color="#7C3AED" />
                              </View>
                              <View style={styles.personMainInfo}>
                                <Text style={styles.personNameText}>{person.name}</Text>
                                <Text style={styles.personSubText} numberOfLines={1}>
                                  {[person.function, person.phone, person.email]
                                    .filter(Boolean)
                                    .join(" • ")}
                                </Text>
                              </View>
                              <Ionicons
                                name="chevron-forward"
                                size={wpx(16)}
                                color={colors.primary}
                              />
                            </TouchableOpacity>
                          ))}
                        </View>
                      ) : null}
                    </View>
                  );
                })
              )}
            </ScrollView>
          )}
        </View>
      </Modal>

      {/* Modal Quick Create Contact (2-Step Flow) */}
      <Modal
        visible={createContactModalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => {
          setCreateContactModalVisible(false);
          resetQuickCreateState();
        }}
      >
        <View style={styles.modalContainer}>
          <StatusBar style="light" />

          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => {
                setCreateContactModalVisible(false);
                resetQuickCreateState();
              }}
            >
              <Ionicons name="close" size={wpx(22)} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.modalHeaderTitle} numberOfLines={1}>
              {newContactStep === 2
                ? "Tambah Person (Step 2)"
                : newContactType === "company"
                ? "Tambah Perusahaan (Step 1)"
                : "Tambah Person"}
            </Text>
            <View style={{ width: wpx(36) }} />
          </View>

          <ScrollView
            contentContainerStyle={styles.createModalScroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Stepper Header for 2-Step Flow */}
            <View style={styles.stepperContainer}>
              <View style={[styles.stepItem, newContactStep === 1 && styles.stepItemActive]}>
                <View
                  style={[
                    styles.stepBadge,
                    newContactStep === 1
                      ? styles.stepBadgeActive
                      : newContactStep > 1
                      ? styles.stepBadgeDone
                      : styles.stepBadgeInactive,
                  ]}
                >
                  {newContactStep > 1 ? (
                    <Ionicons name="checkmark" size={wpx(14)} color="#FFFFFF" />
                  ) : (
                    <Text style={[styles.stepBadgeText, newContactStep === 1 && styles.stepBadgeTextActive]}>
                      1
                    </Text>
                  )}
                </View>
                <Text style={[styles.stepLabel, newContactStep === 1 && styles.stepLabelActive]}>
                  Perusahaan
                </Text>
              </View>

              <View style={[styles.stepLine, newContactStep > 1 && styles.stepLineActive]} />

              <View style={[styles.stepItem, newContactStep === 2 && styles.stepItemActive]}>
                <View
                  style={[
                    styles.stepBadge,
                    newContactStep === 2 ? styles.stepBadgeActive : styles.stepBadgeInactive,
                  ]}
                >
                  <Text style={[styles.stepBadgeText, newContactStep === 2 && styles.stepBadgeTextActive]}>
                    2
                  </Text>
                </View>
                <Text style={[styles.stepLabel, newContactStep === 2 && styles.stepLabelActive]}>
                  Person Terkait
                </Text>
              </View>
            </View>

            {/* Locked Parent Company Banner when in Step 2 */}
            {newContactStep === 2 && createdCompanyInModal ? (
              <View style={styles.parentLockedBanner}>
                <View style={styles.parentLockedIcon}>
                  <Ionicons name="business" size={wpx(22)} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.parentLockedSub}>Menambahkan Person Terkait Untuk:</Text>
                  <Text style={styles.parentLockedName}>{createdCompanyInModal.name}</Text>
                </View>
                <View style={styles.parentLockedTag}>
                  <Ionicons name="lock-closed" size={wpx(13)} color={colors.primary} />
                  <Text style={styles.parentLockedTagText}>Terhubung</Text>
                </View>
              </View>
            ) : null}

            {/* Basic Info Group */}
            <View style={styles.formGroupCard}>
              <Text style={styles.formGroupTitle}>Informasi Utama</Text>

              <View style={styles.fieldBlock}>
                <Text style={styles.formLabel}>
                  {newContactType === "company" ? "Nama Perusahaan *" : "Nama Lengkap Kontak Person *"}
                </Text>
                <TextInput
                  style={styles.formInput}
                  placeholder={
                    newContactType === "company"
                      ? "Contoh: PT. Bank Nusantara Tbk"
                      : "Contoh: Budi Santoso"
                  }
                  placeholderTextColor={colors.textMuted}
                  value={newContactName}
                  onChangeText={setNewContactName}
                />
              </View>

              {newContactType === "person" ? (
                <View style={styles.fieldBlock}>
                  <Text style={styles.formLabel}>Jabatan / Posisi Pekerjaan</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="Contoh: Manager IT / Procurement"
                    placeholderTextColor={colors.textMuted}
                    value={newContactFunction}
                    onChangeText={setNewContactFunction}
                  />
                </View>
              ) : (
                <>
                  <View style={styles.fieldBlock}>
                    <Text style={styles.formLabel}>NPWP / Tax ID (VAT)</Text>
                    <TextInput
                      style={styles.formInput}
                      placeholder="Contoh: 01.234.567.8-012.000"
                      placeholderTextColor={colors.textMuted}
                      value={newContactVat}
                      onChangeText={setNewContactVat}
                    />
                  </View>

                  <View style={styles.fieldBlock}>
                    <Text style={styles.formLabel}>Website Perusahaan</Text>
                    <TextInput
                      style={styles.formInput}
                      placeholder="Contoh: https://www.perusahaan.co.id"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="url"
                      autoCapitalize="none"
                      value={newContactWebsite}
                      onChangeText={setNewContactWebsite}
                    />
                  </View>
                </>
              )}
            </View>

            {/* Contact Methods Group */}
            <View style={styles.formGroupCard}>
              <Text style={styles.formGroupTitle}>Informasi Kontak & Komunikasi</Text>

              <View style={styles.fieldBlock}>
                <Text style={styles.formLabel}>Email</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Contoh: contact@perusahaan.co.id"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={newContactEmail}
                  onChangeText={setNewContactEmail}
                />
              </View>

              <View style={styles.fieldBlock}>
                <Text style={styles.formLabel}>No. Telepon / HP</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Contoh: +6281234567890"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="phone-pad"
                  value={newContactPhone}
                  onChangeText={setNewContactPhone}
                />
              </View>
            </View>

            {/* Address Group (Only for Company) */}
            {newContactType === "company" ? (
              <View style={styles.formGroupCard}>
                <Text style={styles.formGroupTitle}>Alamat Lokasi</Text>

                <View style={styles.fieldBlock}>
                  <Text style={styles.formLabel}>Alamat Jalan (Street)</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="Contoh: Jl. Jend. Sudirman No. 45"
                    placeholderTextColor={colors.textMuted}
                    value={newContactStreet}
                    onChangeText={setNewContactStreet}
                  />
                </View>

                <View style={styles.fieldBlock}>
                  <Text style={styles.formLabel}>Alamat Tambahan (Gedung / Lt)</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="Contoh: Gedung Menara Palma Lt. 12"
                    placeholderTextColor={colors.textMuted}
                    value={newContactStreet2}
                    onChangeText={setNewContactStreet2}
                  />
                </View>

                <View style={styles.rowTwoCols}>
                  <View style={[styles.fieldBlock, { flex: 1 }]}>
                    <Text style={styles.formLabel}>Kota (City)</Text>
                    <TextInput
                      style={styles.formInput}
                      placeholder="Contoh: Jakarta Selatan"
                      placeholderTextColor={colors.textMuted}
                      value={newContactCity}
                      onChangeText={setNewContactCity}
                    />
                  </View>
                  <View style={[styles.fieldBlock, { flex: 0.6 }]}>
                    <Text style={styles.formLabel}>Kode Pos (Zip)</Text>
                    <TextInput
                      style={styles.formInput}
                      placeholder="Contoh: 12190"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="number-pad"
                      value={newContactZip}
                      onChangeText={setNewContactZip}
                    />
                  </View>
                </View>
              </View>
            ) : null}

            {/* Notes Group */}
            <View style={styles.formGroupCard}>
              <Text style={styles.formGroupTitle}>Catatan Tambahan</Text>
              <TextInput
                style={[styles.formInput, styles.textArea]}
                placeholder="Tambahkan catatan khusus..."
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                value={newContactComment}
                onChangeText={setNewContactComment}
              />
            </View>

            {/* Save Action Button */}
            <TouchableOpacity
              style={[styles.saveBtn, creatingContact && { opacity: 0.6 }]}
              onPress={handleQuickCreateContact}
              disabled={creatingContact}
              activeOpacity={0.85}
            >
              {creatingContact ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.saveBtnText}>
                  {newContactStep === 1 ? "Simpan Perusahaan & Lanjut" : "Simpan Kontak Person"}
                </Text>
              )}
            </TouchableOpacity>

            <View style={{ height: hpx(30) }} />
          </ScrollView>
        </View>

        {/* Modal Prompt 1: Company Success Prompt */}
        <Modal
          visible={showCompanyModalSuccess}
          transparent
          animationType="fade"
          onRequestClose={handleFinishModalCompany}
        >
          <View style={styles.promptOverlay}>
            <View style={styles.promptCard}>
              <View style={styles.promptSuccessIconBg}>
                <Ionicons name="business" size={wpx(36)} color="#059669" />
              </View>
              <Text style={styles.promptTitle}>Perusahaan Berhasil Dibuat!</Text>
              <Text style={styles.promptSub}>
                Perusahaan <Text style={{ fontWeight: "700", color: colors.textPrimary }}>{createdCompanyInModal?.name}</Text> telah disimpan.
                {"\n\n"}Apakah Anda ingin langsung menambahkan Kontak Person untuk perusahaan ini?
              </Text>

              <View style={styles.promptActionsColumn}>
                <TouchableOpacity
                  style={styles.promptPrimaryBtn}
                  onPress={handleGoToModalStep2}
                  activeOpacity={0.88}
                >
                  <Ionicons name="person-add" size={wpx(18)} color="#FFFFFF" />
                  <Text style={styles.promptPrimaryBtnText}>+ Langsung Tambah Person</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.promptSecondaryBtn}
                  onPress={handleFinishModalCompany}
                  activeOpacity={0.88}
                >
                  <Ionicons name="checkmark-circle-outline" size={wpx(18)} color={colors.textSecondary} />
                  <Text style={styles.promptSecondaryBtnText}>Selesai & Pilih Perusahaan Ini</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Modal Prompt 2: Person Success Prompt */}
        <Modal
          visible={showPersonModalSuccess}
          transparent
          animationType="fade"
          onRequestClose={handleFinishModalPerson}
        >
          <View style={styles.promptOverlay}>
            <View style={styles.promptCard}>
              <View style={styles.promptSuccessIconBgPerson}>
                <Ionicons name="person-circle" size={wpx(36)} color="#7C3AED" />
              </View>
              <Text style={styles.promptTitle}>Person Berhasil Ditambahkan!</Text>
              <Text style={styles.promptSub}>
                Kontak <Text style={{ fontWeight: "700", color: colors.textPrimary }}>{lastCreatedPersonNameModal}</Text> telah terhubung ke perusahaan <Text style={{ fontWeight: "700", color: colors.textPrimary }}>{createdCompanyInModal?.name}</Text>.
              </Text>

              <View style={styles.promptActionsColumn}>
                <TouchableOpacity
                  style={styles.promptPrimaryBtnPerson}
                  onPress={handleAddAnotherModalPerson}
                  activeOpacity={0.88}
                >
                  <Ionicons name="person-add" size={wpx(18)} color="#FFFFFF" />
                  <Text style={styles.promptPrimaryBtnText}>+ Tambah Person Lainnya</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.promptSecondaryBtn}
                  onPress={handleFinishModalPerson}
                  activeOpacity={0.88}
                >
                  <Ionicons name="checkmark-done-circle" size={wpx(18)} color={colors.textSecondary} />
                  <Text style={styles.promptSecondaryBtnText}>Selesai & Pilih Kontak Ini</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
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
  backBtn: { padding: spacing.xs },
  headerTitleBox: { flex: 1, alignItems: "center" },
  headerTitle: { fontSize: rf(20), fontWeight: "800" as any, color: "#FFFFFF" },
  headerSub: { fontSize: rf(12), color: "rgba(255, 255, 255, 0.8)", marginTop: hpx(2) },
  saveHeaderBtn: { padding: spacing.xs },
  saveHeaderBtnText: { fontSize: rf(14), fontWeight: "700" as any, color: "#FFFFFF" },

  scroll: {
    paddingHorizontal: spacing["2xl"],
    paddingTop: hpx(20),
    paddingBottom: hpx(50),
  },

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
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginBottom: spacing.md,
    paddingBottom: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface,
  },
  sectionTitle: { fontSize: rf(15), fontWeight: "800" as any, color: colors.textPrimary },

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
  selectInput: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: hpx(48),
    gap: spacing.sm,
  },
  selectInputText: {
    flex: 1,
    fontSize: rf(14),
    fontWeight: "600" as any,
    color: colors.textPrimary,
  },
  selectInputPlaceholder: {
    flex: 1,
    fontSize: rf(14),
    color: colors.textMuted,
  },
  fieldHelper: {
    fontSize: rf(11),
    color: colors.textMuted,
    marginTop: hpx(4),
    fontStyle: "italic",
  },

  datePickerBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    height: hpx(48),
  },
  datePickerText: {
    fontSize: rf(14),
    color: colors.textPrimary,
    fontWeight: "600" as any,
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
    ...shadows.elevated,
    marginTop: spacing.sm,
  },
  saveBtnText: { color: "#FFFFFF", fontWeight: "800" as any, fontSize: rf(15) },

  /* Modal Styles */
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
  modalCenterLoading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalScroll: {
    paddingHorizontal: spacing.xl,
    paddingBottom: hpx(40),
    paddingTop: spacing.sm,
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
  contactCompCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  companyRowSelect: {
    flexDirection: "row",
    alignItems: "center",
  },
  compIconBg: {
    width: wpx(38),
    height: wpx(38),
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  compMainInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  compNameText: {
    fontSize: rf(15),
    fontWeight: "700" as any,
    color: colors.textPrimary,
  },
  compSubText: {
    fontSize: rf(12),
    color: colors.textMuted,
    marginTop: hpx(1),
  },
  selectBtnBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  selectBtnBadgeText: {
    fontSize: rf(11),
    fontWeight: "700" as any,
    color: colors.primary,
  },
  personSubSection: {
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    gap: spacing.xs,
  },
  personSubHeaderLabel: {
    fontSize: rf(11),
    fontWeight: "700" as any,
    color: colors.textMuted,
    marginBottom: hpx(4),
  },
  personRowSelect: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  personMiniAvatar: {
    width: wpx(28),
    height: wpx(28),
    borderRadius: radius.full,
    backgroundColor: "#EDE9FE",
    alignItems: "center",
    justifyContent: "center",
  },
  personMainInfo: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  personNameText: {
    fontSize: rf(13),
    fontWeight: "700" as any,
    color: colors.textPrimary,
  },
  personSubText: {
    fontSize: rf(11),
    color: colors.textSecondary,
    marginTop: hpx(1),
  },
  modalAddHeaderBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    gap: hpx(4),
  },
  modalAddHeaderBtnText: {
    fontSize: rf(13),
    fontWeight: "700" as any,
    color: "#FFFFFF",
  },
  createModalScroll: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: hpx(50),
  },
  typeSelectorRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  typeTabBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
  },
  typeTabBtnActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  typeTabText: {
    fontSize: rf(12),
    fontWeight: "600" as any,
    color: colors.textMuted,
  },
  typeTabTextActive: {
    color: colors.primary,
    fontWeight: "700" as any,
  },
  typeTabTextActivePerson: {
    color: "#7C3AED",
    fontWeight: "700" as any,
  },
  formGroupCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  formGroupTitle: {
    fontSize: rf(14),
    fontWeight: "800" as any,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  fieldBlock: {
    marginBottom: spacing.md,
  },
  rowTwoCols: {
    flexDirection: "row",
    gap: spacing.md,
  },
  textArea: {
    height: hpx(80),
    paddingVertical: spacing.sm,
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
