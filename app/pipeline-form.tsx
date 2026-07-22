import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
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
  CrmStage,
  PipelineItem,
  PipelinePriority,
  PipelineStage,
} from "../types/pipeline";
import { showToast } from "../utils/toast";

const DEFAULT_STAGES: PipelineStage[] = [
  "Lead",
  "Qualification",
  "Proposal",
  "Negotiation",
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
  // Opportunity, Qualification, Proposal, Negotiation, etc.
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
  const [stage, setStage] = useState<PipelineStage>("Lead");
  const [priority, setPriority] = useState<PipelinePriority>("Medium");
  const [probability, setProbability] = useState("50");
  const [dateDeadline, setDateDeadline] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [notes, setNotes] = useState("");

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
          stage,
          stageId,
          priority,
          probability: numProb,
          expectedCloseDate: formattedDate,
          notes: notes.trim(),
        });
        showToast("success", "Berhasil Diperbarui", "Data CRM Lead telah diperbarui.");
      } else {
        await pipelineService.create({
          title: title.trim(),
          client: client.trim(),
          email_from: email.trim(),
          phone: phone.trim(),
          amount: numAmount,
          stage,
          stageId,
          priority,
          probability: numProb,
          expectedCloseDate: formattedDate,
          notes: notes.trim(),
        });
        showToast("success", "Berhasil Ditambahkan", "CRM Lead baru telah dibuat.");
      }
      router.back();
    } catch (err: any) {
      showToast("error", "Gagal Menyimpan", err?.message || "Terjadi kesalahan sistem.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Memuat formulir CRM Lead...</Text>
      </View>
    );
  }

  const stageOptions = stages.length > 0 ? stages.map((s) => s.name) : DEFAULT_STAGES;

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.curvedHeader}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.headerTitleBox}>
          <Text style={styles.headerTitle}>
            {isEdit ? "Edit CRM Lead" : "Tambah CRM Lead Baru"}
          </Text>
          <Text style={styles.headerSub}>
            {isEdit ? "Perbarui informasi prospek bisnis" : "Isi formulir prospek bisnis baru"}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
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

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Nama Klien / Perusahaan *</Text>
            <TextInput
              style={styles.formInput}
              placeholder="Contoh: PT Bank Nusantara Tbk"
              placeholderTextColor={colors.textMuted}
              value={client}
              onChangeText={setClient}
            />
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
            <Text style={styles.formLabel}>Target Deadline / Closing</Text>
            {Platform.OS === "ios" ? (
              <View style={styles.datePickerBtn}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Ionicons name="calendar-outline" size={20} color={colors.primary} />
                  <Text style={styles.datePickerText}>
                    {dateDeadline.toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </Text>
                </View>
                <DateTimePicker
                  value={dateDeadline}
                  mode="date"
                  display="default"
                  locale="id-ID"
                  themeVariant="light"
                  onChange={(_e, d) => {
                    if (d) setDateDeadline(d);
                  }}
                />
              </View>
            ) : (
              <TouchableOpacity
                style={styles.datePickerBtn}
                activeOpacity={0.7}
                onPress={() => setShowDatePicker(true)}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Ionicons name="calendar-outline" size={20} color={colors.primary} />
                  <Text style={styles.datePickerText}>
                    {dateDeadline.toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </Text>
                </View>
                <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            )}

            {Platform.OS === "android" && showDatePicker && (
              <DateTimePicker
                value={dateDeadline}
                mode="date"
                display="default"
                onChange={(_e, d) => {
                  if (d) setDateDeadline(d);
                  setShowDatePicker(false);
                }}
              />
            )}
          </View>
        </View>

        {/* Section 3: Status & Klasifikasi */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="git-network-outline" size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>Status & Klasifikasi Stage</Text>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Tahapan Stage</Text>
            <View style={styles.chipRow}>
              {stageOptions
                .filter((stgName) => {
                  const name = stgName.toLowerCase().trim();
                  return !name.includes("won") && !name.includes("lost") && !name.includes("menang") && !name.includes("gagal");
                })
                .map((stgName) => {
                const isSelected = stage.toLowerCase() === stgName.toLowerCase();
                return (
                  <TouchableOpacity
                    key={stgName}
                    style={[styles.selectChip, isSelected && styles.selectChipActive]}
                    onPress={() => {
                      setStage(stgName as PipelineStage);
                      setProbability(getProbabilityByStage(stgName));
                    }}
                  >
                    <Text
                      style={[
                        styles.selectChipText,
                        isSelected && styles.selectChipTextActive,
                      ]}
                    >
                      {stgName}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Prioritas</Text>
            <View style={styles.chipRow}>
              {PRIORITIES.map((prio) => {
                const isSelected = priority === prio;
                return (
                  <TouchableOpacity
                    key={prio}
                    style={[styles.selectChip, isSelected && styles.selectChipActive]}
                    onPress={() => setPriority(prio)}
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
  headerTitleBox: { flex: 1, alignItems: "center", marginRight: spacing.xl },
  headerTitle: { fontSize: rf(19), fontWeight: "800" as any, color: "#FFFFFF" },
  headerSub: { fontSize: rf(11), color: "rgba(255, 255, 255, 0.7)", marginTop: 2 },

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
});
