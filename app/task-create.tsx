import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { projectService } from "../services/projectService";
import { taskService } from "../services/taskService";
import type { Project } from "../types/project";
import type { TaskStageItem, TaskTagItem } from "../types/task";
import { showToast } from "../utils/toast";

export default function TaskCreateScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // ── Form fields ──
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedStage, setSelectedStage] = useState<TaskStageItem | null>(null);
  const [selectedTags, setSelectedTags] = useState<TaskTagItem[]>([]);
  const [priority, setPriority] = useState("0");
  const [plannedHours, setPlannedHours] = useState("");
  const [dateDeadline, setDateDeadline] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // ── Reference data ──
  const [projects, setProjects] = useState<Project[]>([]);
  const [stages, setStages] = useState<TaskStageItem[]>([]);
  const [tags, setTags] = useState<TaskTagItem[]>([]);
  const [isLoadingRef, setIsLoadingRef] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Dropdown modals ──
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
      showToast("error", "Gagal", err?.response?.data?.message || "Terjadi kesalahan.");
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
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <Stack.Screen options={{ headerShown: false }} />

      {/* Custom Header */}
      <View style={styles.customHeader}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBackBtn}>
          <Ionicons name="arrow-back" size={22} color="#2E5BFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Buat Tugas Baru</Text>
        <View style={styles.headerSpacer} />
      </View>

      {isLoadingRef ? (
        <ActivityIndicator size="large" color="#2E5BFF" style={{ marginVertical: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          {/* Name */}
          <Text style={styles.label}>Nama Tugas <Text style={{ color: "#EF4444" }}>*</Text></Text>
          <TextInput
            style={styles.input}
            placeholder="Masukkan nama tugas"
            placeholderTextColor="#A9B5C9"
            value={name}
            onChangeText={setName}
          />

          {/* Description */}
          <Text style={styles.label}>Deskripsi</Text>
          <TextInput
            style={[styles.input, { height: 80, textAlignVertical: "top" }]}
            placeholder="Deskripsi tugas..."
            placeholderTextColor="#A9B5C9"
            multiline
            value={description}
            onChangeText={setDescription}
          />

          {/* Project */}
          <Text style={styles.label}>Project</Text>
          <TouchableOpacity style={styles.selectBtn} onPress={() => setShowProjectPicker(true)}>
            <Text style={selectedProject ? styles.selectValue : styles.selectPlaceholder}>
              {selectedProject?.name || "Pilih project"}
            </Text>
            <Ionicons name="chevron-down" size={18} color="#8F9BB3" />
          </TouchableOpacity>

          {/* Stage */}
          <Text style={styles.label}>Stage</Text>
          <TouchableOpacity style={styles.selectBtn} onPress={() => setShowStagePicker(true)}>
            <Text style={selectedStage ? styles.selectValue : styles.selectPlaceholder}>
              {selectedStage?.name || "Pilih stage"}
            </Text>
            <Ionicons name="chevron-down" size={18} color="#8F9BB3" />
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
                style={[styles.priorityBtn, priority === p.value && styles.priorityBtnActive]}
                onPress={() => setPriority(p.value)}
              >
                <Text style={[styles.priorityBtnText, priority === p.value && styles.priorityBtnTextActive]}>
                  {p.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Deadline */}
          <Text style={styles.label}>Deadline</Text>
          <TouchableOpacity style={styles.selectBtn} onPress={() => setShowDatePicker(true)}>
            <Text style={styles.selectValue}>
              {dateDeadline.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
            </Text>
            <Ionicons name="calendar-outline" size={18} color="#8F9BB3" />
          </TouchableOpacity>

          {showDatePicker && Platform.OS === "ios" ? (
            <View style={[StyleSheet.absoluteFill, styles.pickerOverlayIos]}>
              <TouchableOpacity style={styles.pickerOverlayBgIos} onPress={() => setShowDatePicker(false)} />
              <View style={styles.pickerContainerIos}>
                <View style={styles.pickerHeaderIos}>
                  <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                    <Text style={styles.pickerDoneTextIos}>Selesai</Text>
                  </TouchableOpacity>
                </View>
                <View style={{ backgroundColor: "#FFFFFF" }}>
                  <DateTimePicker
                    value={dateDeadline}
                    mode="date"
                    display="inline"
                    themeVariant="light"
                    onChange={(_e, d) => { if (d) setDateDeadline(d); }}
                  />
                </View>
              </View>
            </View>
          ) : showDatePicker ? (
            <DateTimePicker
              value={dateDeadline}
              mode="date"
              display="default"
              onChange={(_e, d) => { if (d) setDateDeadline(d); }}
            />
          ) : null}

          {/* Planned Hours */}
          <Text style={styles.label}>Estimasi Jam</Text>
          <TextInput
            style={styles.input}
            placeholder="Contoh: 8"
            placeholderTextColor="#A9B5C9"
            keyboardType="numeric"
            value={plannedHours}
            onChangeText={setPlannedHours}
          />

          {/* Tags */}
          <Text style={styles.label}>Tags</Text>
          <TouchableOpacity style={styles.selectBtn} onPress={() => setShowTagPicker(true)}>
            <Text style={selectedTags.length ? styles.selectValue : styles.selectPlaceholder}>
              {selectedTags.length ? selectedTags.map((t) => t.name).join(", ") : "Pilih tags"}
            </Text>
            <Ionicons name="chevron-down" size={18} color="#8F9BB3" />
          </TouchableOpacity>

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitBtn, isSubmitting && { opacity: 0.6 }]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.submitBtnText}>Buat Tugas</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* ── Project Picker Modal ── */}
      <Modal visible={showProjectPicker} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: Math.max(insets.bottom, 24) }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pilih Project</Text>
              <TouchableOpacity onPress={() => setShowProjectPicker(false)}>
                <Ionicons name="close" size={24} color="#1F2937" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 400 }}>
              {projects.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  style={[styles.pickerItem, selectedProject?.id === p.id && styles.pickerItemActive]}
                  onPress={() => { setSelectedProject(p); setShowProjectPicker(false); }}
                >
                  <Text style={[styles.pickerItemText, selectedProject?.id === p.id && styles.pickerItemTextActive]}>
                    {p.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── Stage Picker Modal ── */}
      <Modal visible={showStagePicker} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: Math.max(insets.bottom, 24) }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pilih Stage</Text>
              <TouchableOpacity onPress={() => setShowStagePicker(false)}>
                <Ionicons name="close" size={24} color="#1F2937" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 400 }}>
              {stages.map((s) => (
                <TouchableOpacity
                  key={s.id}
                  style={[styles.pickerItem, selectedStage?.id === s.id && styles.pickerItemActive]}
                  onPress={() => { setSelectedStage(s); setShowStagePicker(false); }}
                >
                  <Text style={[styles.pickerItemText, selectedStage?.id === s.id && styles.pickerItemTextActive]}>
                    {s.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── Tag Picker Modal ── */}
      <Modal visible={showTagPicker} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: Math.max(insets.bottom, 24) }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pilih Tags</Text>
              <TouchableOpacity onPress={() => setShowTagPicker(false)}>
                <Ionicons name="close" size={24} color="#1F2937" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 400 }}>
              {tags.map((t) => {
                const isSel = !!selectedTags.find((st) => st.id === t.id);
                return (
                  <TouchableOpacity
                    key={t.id}
                    style={[styles.pickerItem, isSel && styles.pickerItemActive]}
                    onPress={() => toggleTag(t)}
                  >
                    <View style={[styles.checkbox, isSel && styles.checkboxActive]}>
                      {isSel && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
                    </View>
                    <Text style={[styles.pickerItemText, isSel && styles.pickerItemTextActive]}>
                      {t.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <TouchableOpacity style={styles.doneBtn} onPress={() => setShowTagPicker(false)}>
              <Text style={styles.doneBtnText}>Selesai</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#eeeeefff" },
  customHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    height: 56,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  headerBackBtn: { width: 40, height: 40, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  headerTitle: { fontSize: 17, fontWeight: "700", color: "#1F2937", flex: 1, textAlign: "center", marginRight: 40 },
  headerSpacer: { width: 40 },
  scrollContainer: { padding: 24, paddingBottom: 40 },
  // Form
  label: { fontSize: 13, fontWeight: "700", color: "#4B5563", marginBottom: 8, marginTop: 16 },
  input: {
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    backgroundColor: "#F9FAFB",
    paddingHorizontal: 16,
    height: 48,
    color: "#1F2937",
    fontSize: 14,
    fontWeight: "500",
  },
  selectBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    backgroundColor: "#F9FAFB",
    paddingHorizontal: 16,
    height: 48,
  },
  selectValue: { color: "#1F2937", fontSize: 14, fontWeight: "500", flex: 1 },
  selectPlaceholder: { color: "#A9B5C9", fontSize: 14, fontWeight: "500", flex: 1 },
  priorityRow: { flexDirection: "row", gap: 12 },
  priorityBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    alignItems: "center",
  },
  priorityBtnActive: { backgroundColor: "#2E5BFF", borderColor: "#2E5BFF" },
  priorityBtnText: { fontSize: 14, fontWeight: "700", color: "#4B5563" },
  priorityBtnTextActive: { color: "#FFFFFF" },
  submitBtn: {
    height: 52,
    backgroundColor: "#2E5BFF",
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 32,
  },
  submitBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: "#FFFFFF", borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: "800", color: "#1F2937" },
  pickerItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 4,
  },
  pickerItemActive: { backgroundColor: "#EEF2FF" },
  pickerItemText: { fontSize: 14, fontWeight: "600", color: "#374151" },
  pickerItemTextActive: { color: "#2E5BFF" },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  checkboxActive: { backgroundColor: "#2E5BFF", borderColor: "#2E5BFF" },
  doneBtn: {
    height: 48,
    backgroundColor: "#2E5BFF",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
  },
  doneBtnText: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
  // iOS Picker
  pickerOverlayIos: {
    zIndex: 999,
    justifyContent: "flex-end",
  },
  pickerOverlayBgIos: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  pickerContainerIos: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34,
  },
  pickerHeaderIos: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 4,
  },
  pickerDoneTextIos: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2E5BFF",
  },
});
