import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Stack, useRouter } from "expo-router";
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
import { projectService } from "../services/projectService";
import { taskService } from "../services/taskService";
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
import type { Project } from "../types/project";
import type { TaskStageItem, TaskTagItem } from "../types/task";
import { showToast } from "../utils/toast";

export default function TaskCreateScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Form fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedStage, setSelectedStage] = useState<TaskStageItem | null>(
    null,
  );
  const [selectedTags, setSelectedTags] = useState<TaskTagItem[]>([]);
  const [priority, setPriority] = useState("0");
  const [plannedHours, setPlannedHours] = useState("");
  const [dateDeadline, setDateDeadline] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Reference data
  const [projects, setProjects] = useState<Project[]>([]);
  const [stages, setStages] = useState<TaskStageItem[]>([]);
  const [tags, setTags] = useState<TaskTagItem[]>([]);
  const [isLoadingRef, setIsLoadingRef] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dropdown modals
  const [showProjectPicker, setShowProjectPicker] = useState(false);
  const [showStagePicker, setShowStagePicker] = useState(false);
  const [showTagPicker, setShowTagPicker] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [projRes, stageRes, tagRes] = await Promise.all([
          projectService.list({ active: true }),
          taskService.listStages(),
          taskService.listTags(),
        ]);
        setProjects(projRes.data.data || []);
        setStages(stageRes.data.data || []);
        setTags(tagRes.data.data || []);
      } catch {
        showToast("error", "Gagal", "Gagal memuat data referensi.");
      } finally {
        setIsLoadingRef(false);
      }
    })();
  }, []);

  const handleSubmit = async () => {
    if (!name.trim()) {
      showToast("info", "Form Belum Lengkap", "Nama tugas wajib diisi.");
      return;
    }
    setIsSubmitting(true);
    try {
      await taskService.create({
        name: name.trim(),
        project_id: selectedProject?.id,
        description: description.trim() || undefined,
        stage_id: selectedStage?.id,
        tag_ids: selectedTags.map((t) => t.id),
        priority,
        planned_hours: plannedHours ? Number(plannedHours) : undefined,
        date_deadline: dateDeadline
          ? `${dateDeadline.getFullYear()}-${String(dateDeadline.getMonth() + 1).padStart(2, "0")}-${String(dateDeadline.getDate()).padStart(2, "0")}`
          : undefined,
      });
      showToast("success", "Berhasil", "Tugas baru telah dibuat.");
      router.back();
    } catch (err: any) {
      showToast(
        "error",
        "Gagal",
        err?.response?.data?.message || "Terjadi kesalahan.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleTag = (tag: TaskTagItem) => {
    setSelectedTags((prev) =>
      prev.find((t) => t.id === tag.id)
        ? prev.filter((t) => t.id !== tag.id)
        : [...prev, tag],
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <Stack.Screen options={{ headerShown: false }} />

      <View style={[styles.curvedHeader, { paddingTop: insets.top }]}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Buat Tugas Baru</Text>
        </View>
      </View>

      {isLoadingRef ? (
        <ActivityIndicator
          size="large"
          color={colors.primary}
          style={{ marginVertical: spacing["4xl"] }}
        />
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.floatingCard}>
            {/* Nama Tugas */}
            <Text style={styles.label}>
              Nama Tugas <Text style={{ color: colors.error }}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Masukkan nama tugas"
              placeholderTextColor={colors.textMuted}
              value={name}
              onChangeText={setName}
            />

            {/* Deskripsi */}
            <Text style={styles.label}>Deskripsi</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Deskripsi tugas..."
              placeholderTextColor={colors.textMuted}
              multiline
              value={description}
              onChangeText={setDescription}
            />

            {/* Project */}
            <Text style={styles.label}>Project</Text>
            <TouchableOpacity
              style={styles.selectBtn}
              onPress={() => setShowProjectPicker(true)}
            >
              <Text
                style={
                  selectedProject
                    ? styles.selectValue
                    : styles.selectPlaceholder
                }
              >
                {selectedProject?.name || "Pilih project"}
              </Text>
              <Ionicons
                name="chevron-down"
                size={18}
                color={colors.textMuted}
              />
            </TouchableOpacity>

            {/* Stage */}
            <Text style={styles.label}>Stage</Text>
            <TouchableOpacity
              style={styles.selectBtn}
              onPress={() => setShowStagePicker(true)}
            >
              <Text
                style={
                  selectedStage ? styles.selectValue : styles.selectPlaceholder
                }
              >
                {selectedStage?.name || "Pilih stage"}
              </Text>
              <Ionicons
                name="chevron-down"
                size={18}
                color={colors.textMuted}
              />
            </TouchableOpacity>

            {/* Priority */}
            <Text style={styles.label}>Prioritas</Text>
            <View style={styles.priorityRow}>
              {[
                { value: "0", label: "Normal" },
                { value: "1", label: "Urgent" },
              ].map((p) => (
                <TouchableOpacity
                  key={p.value}
                  style={[
                    styles.priorityBtn,
                    priority === p.value && styles.priorityActive,
                  ]}
                  onPress={() => setPriority(p.value)}
                >
                  <Text
                    style={[
                      styles.priorityText,
                      priority === p.value && styles.priorityTextActive,
                    ]}
                  >
                    {p.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Deadline */}
            <Text style={styles.label}>Deadline</Text>
            <TouchableOpacity
              style={styles.selectBtn}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.selectValue}>
                {dateDeadline.toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </Text>
              <Ionicons
                name="calendar-outline"
                size={18}
                color={colors.textMuted}
              />
            </TouchableOpacity>

            {showDatePicker && Platform.OS === "ios" ? (
              <View style={StyleSheet.absoluteFill}>
                <TouchableOpacity
                  style={styles.pickerBg}
                  onPress={() => setShowDatePicker(false)}
                />
                <View style={styles.pickerContainer}>
                  <View style={styles.pickerHeader}>
                    <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                      <Text style={styles.pickerDone}>Selesai</Text>
                    </TouchableOpacity>
                  </View>
                  <DateTimePicker
                    value={dateDeadline}
                    mode="date"
                    display="inline"
                    themeVariant="light"
                    onChange={(_e, d) => {
                      if (d) setDateDeadline(d);
                    }}
                  />
                </View>
              </View>
            ) : showDatePicker ? (
              <DateTimePicker
                value={dateDeadline}
                mode="date"
                display="default"
                onChange={(_e, d) => {
                  if (d) setDateDeadline(d);
                }}
              />
            ) : null}

            {/* Estimated Hours */}
            <Text style={styles.label}>Estimasi Jam</Text>
            <TextInput
              style={styles.input}
              placeholder="Contoh: 8"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              value={plannedHours}
              onChangeText={setPlannedHours}
            />

            {/* Tags */}
            <Text style={styles.label}>Tags</Text>
            <TouchableOpacity
              style={styles.selectBtn}
              onPress={() => setShowTagPicker(true)}
            >
              <Text
                style={
                  selectedTags.length
                    ? styles.selectValue
                    : styles.selectPlaceholder
                }
                numberOfLines={1}
              >
                {selectedTags.length
                  ? selectedTags.map((t) => t.name).join(", ")
                  : "Pilih tags"}
              </Text>
              <Ionicons
                name="chevron-down"
                size={18}
                color={colors.textMuted}
              />
            </TouchableOpacity>

            {/* Submit */}
            <TouchableOpacity
              style={[styles.submitBtn, isSubmitting && { opacity: 0.6 }]}
              onPress={handleSubmit}
              disabled={isSubmitting}
              activeOpacity={0.8}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.submitText}>Buat Tugas</Text>
              )}
            </TouchableOpacity>
          </View>
          <View style={{ height: hpx(24) }} />
        </ScrollView>
      )}

      {/* ── Modals ── */}
      {renderPickerModal(
        showProjectPicker,
        setShowProjectPicker,
        "Pilih Project",
        projects,
        (p) => p.name,
        (p) => {
          setSelectedProject(p as Project);
          setShowProjectPicker(false);
        },
        selectedProject?.id,
      )}
      {renderPickerModal(
        showStagePicker,
        setShowStagePicker,
        "Pilih Stage",
        stages,
        (s) => s.name,
        (s) => {
          setSelectedStage(s as TaskStageItem);
          setShowStagePicker(false);
        },
        selectedStage?.id,
      )}
      {renderTagModal(
        showTagPicker,
        setShowTagPicker,
        tags,
        selectedTags,
        toggleTag,
      )}
    </View>
  );
}

// ── Picker Modal (generic) ─────────────────────────────────────────────────
function renderPickerModal<T extends { id: number }>(
  visible: boolean,
  close: (v: boolean) => void,
  title: string,
  items: T[],
  getName: (item: T) => string,
  onSelect: (item: T) => void,
  selectedId?: number,
) {
  return (
    <Modal key={title} visible={visible} animationType="slide" transparent>
      <View style={modalStyles.overlay}>
        <View style={modalStyles.content}>
          <View style={modalStyles.header}>
            <Text style={modalStyles.title}>{title}</Text>
            <TouchableOpacity onPress={() => close(false)}>
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
          <ScrollView style={{ maxHeight: 400 }}>
            {items.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  modalStyles.item,
                  selectedId === item.id && modalStyles.itemActive,
                ]}
                onPress={() => onSelect(item)}
              >
                <Text
                  style={[
                    modalStyles.itemText,
                    selectedId === item.id && modalStyles.itemTextActive,
                  ]}
                >
                  {getName(item)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ── Tag Picker Modal ───────────────────────────────────────────────────────
function renderTagModal(
  visible: boolean,
  close: (v: boolean) => void,
  tags: TaskTagItem[],
  selected: TaskTagItem[],
  toggle: (t: TaskTagItem) => void,
) {
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={modalStyles.overlay}>
        <View style={modalStyles.content}>
          <View style={modalStyles.header}>
            <Text style={modalStyles.title}>Pilih Tags</Text>
            <TouchableOpacity onPress={() => close(false)}>
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
          <ScrollView style={{ maxHeight: 400 }}>
            {tags.map((t) => {
              const isSel = !!selected.find((st) => st.id === t.id);
              return (
                <TouchableOpacity
                  key={t.id}
                  style={[modalStyles.item, isSel && modalStyles.itemActive]}
                  onPress={() => toggle(t)}
                >
                  <View
                    style={[
                      modalStyles.checkbox,
                      isSel && modalStyles.checkboxActive,
                    ]}
                  >
                    {isSel && (
                      <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                    )}
                  </View>
                  <Text
                    style={[
                      modalStyles.itemText,
                      isSel && modalStyles.itemTextActive,
                    ]}
                  >
                    {t.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          <TouchableOpacity
            style={modalStyles.doneBtn}
            onPress={() => close(false)}
          >
            <Text style={modalStyles.doneBtnText}>Selesai</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },

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
  headerContent: { alignItems: "center" },
  headerTitle: {
    fontSize: rf(17),
    fontWeight: "700" as any,
    color: "#FFFFFF",
    textAlign: "center",
  },

  // Scroll
  scroll: { paddingHorizontal: spacing["2xl"], paddingBottom: hpx(40) },
  floatingCard: {
    marginTop: hpx(6),
    backgroundColor: colors.card,
    borderRadius: wpx(20),
    padding: spacing["2xl"],
    ...shadows.elevated,
  },

  // Form
  label: {
    ...textPresets.label,
    marginBottom: spacing.sm,
    marginTop: spacing.lg,
    fontWeight: "700" as any,
  },
  input: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    paddingHorizontal: spacing.lg,
    height: sizes.selectHeight,
    color: colors.textPrimary,
    fontSize: rf(14),
  },
  textArea: {
    height: hpx(80),
    textAlignVertical: "top",
    paddingTop: spacing.md,
  },

  // Select
  selectBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    paddingHorizontal: spacing.lg,
    height: sizes.selectHeight,
  },
  selectValue: { color: colors.textPrimary, fontSize: rf(14), flex: 1 },
  selectPlaceholder: { color: colors.textMuted, fontSize: rf(14), flex: 1 },

  // Priority
  priorityRow: { flexDirection: "row", gap: spacing.md },
  priorityBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.border,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: "center",
  },
  priorityActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  priorityText: {
    fontSize: rf(14),
    fontWeight: "700" as any,
    color: colors.textSecondary,
  },
  priorityTextActive: { color: "#FFFFFF" },

  // Submit
  submitBtn: {
    height: sizes.buttonMd,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    justifyContent: "center",
    alignItems: "center",
    marginTop: spacing["3xl"],
  },
  submitText: { color: "#FFFFFF", fontSize: rf(16), fontWeight: "700" as any },

  // iOS Picker
  pickerBg: { flex: 1, backgroundColor: colors.overlay },
  pickerContainer: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingBottom: hpx(34),
  },
  pickerHeader: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
  },
  pickerDone: {
    fontSize: rf(16),
    fontWeight: "700" as any,
    color: colors.primary,
  },
});

// ── Modal sub-styles ──────────────────────────────────────────────────────
const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: "flex-end",
  },
  content: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing["2xl"],
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  title: { ...textPresets.screenTitle },
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    marginBottom: spacing.xs,
  },
  itemActive: { backgroundColor: colors.primaryLight },
  itemText: {
    fontSize: rf(14),
    fontWeight: "600" as any,
    color: colors.textSecondary,
  },
  itemTextActive: { color: colors.primary },
  checkbox: {
    width: wpx(20),
    height: hpx(20),
    borderRadius: radius.xs + 2,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
  },
  checkboxActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  doneBtn: {
    height: sizes.selectHeight,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    justifyContent: "center",
    alignItems: "center",
    marginTop: spacing.lg,
  },
  doneBtnText: { color: "#FFFFFF", fontSize: rf(15), fontWeight: "700" as any },
});
