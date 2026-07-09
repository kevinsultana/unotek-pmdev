import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { employeeService } from "../services/employeeService";
import type { Employee } from "../types/employee";
import {
  colors,
  hpx,
  radius,
  rf,
  shadows,
  spacing,
  wpx
} from "../src/constants/theme";
import { showToast } from "../utils/toast";

const GENDER_OPTIONS = [
  { label: "Laki-laki", value: "male" as const },
  { label: "Perempuan", value: "female" as const },
];

const MARITAL_OPTIONS = [
  { label: "Lajang", value: "single" as const },
  { label: "Menikah", value: "married" as const },
  { label: "Duda/Janda", value: "widower" as const },
  { label: "Bercerai", value: "divorced" as const },
];

const toISODate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const toDisplay = (date: Date) => {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

export default function ProfileEditScreen() {
  const { id } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [name, setName] = useState("");
  const [workPhone, setWorkPhone] = useState("");
  const [mobilePhone, setMobilePhone] = useState("");
  const [privateEmail, setPrivateEmail] = useState("");
  const [privatePhone, setPrivatePhone] = useState("");
  const [birthday, setBirthday] = useState<Date | null>(null);
  const [sex, setSex] = useState<"male" | "female" | null>(null);
  const [marital, setMarital] = useState<Employee["marital"]>(null);
  const [identificationId, setIdentificationId] = useState("");

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchEmployee = async () => {
      setIsLoading(true);
      try {
        const res = await employeeService.getById(Number(id));
        if (res.data?.success && res.data.data) {
          const emp = res.data.data;
          setName(emp.name || "");
          setWorkPhone(emp.work_phone || "");
          setMobilePhone(emp.mobile_phone || "");
          setPrivateEmail(emp.private_email || "");
          setPrivatePhone(emp.private_phone || "");
          setSex(emp.sex || null);
          setMarital(emp.marital || null);
          setIdentificationId(emp.identification_id || "");

          if (emp.birthday) {
            // Odoo returns birthday as "YYYY-MM-DD" or ISO
            const datePart = emp.birthday.split(" ")[0];
            setBirthday(new Date(datePart));
          }
        } else {
          showToast("error", "Gagal memuat data karyawan");
          router.back();
        }
      } catch (err) {
        console.error("Error loading employee profile for edit:", err);
        showToast("error", "Terjadi kesalahan koneksi");
        router.back();
      } finally {
        setIsLoading(false);
      }
    };
    fetchEmployee();
  }, [id]);

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setBirthday(selectedDate);
    }
  };

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      showToast("error", "Nama Lengkap tidak boleh kosong!");
      return;
    }

    setIsSaving(true);
    const payload = {
      name,
      work_phone: workPhone || null,
      mobile_phone: mobilePhone || null,
      private_email: privateEmail || null,
      private_phone: privatePhone || null,
      birthday: birthday ? toISODate(birthday) : null,
      sex: sex || null,
      marital: marital || null,
      identification_id: identificationId || null,
    };

    try {
      const res = await employeeService.update(Number(id), payload);
      if (res.data?.success) {
        showToast("success", "Data diri berhasil diperbarui!");
        router.back();
      } else {
        showToast("error", res.data?.message || "Gagal memperbarui data");
      }
    } catch (err) {
      console.error("Error saving employee profile:", err);
      showToast("error", "Terjadi kesalahan koneksi");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Memuat form data diri...</Text>
      </View>
    );
  }

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
          <Text style={styles.headerTitle}>Edit Data Diri</Text>
          <TouchableOpacity
            onPress={handleSaveProfile}
            style={styles.saveBtn}
            activeOpacity={0.7}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons name="checkmark" size={wpx(24)} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Form Pekerjaan */}
        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>Pekerjaan & Kontak Kantor</Text>

          <Text style={styles.inputLabel}>Nama Lengkap *</Text>
          <TextInput
            style={styles.textInput}
            value={name}
            onChangeText={setName}
            placeholder="Nama Lengkap"
            placeholderTextColor={colors.textMuted}
          />

          <Text style={styles.inputLabel}>Telepon Kantor</Text>
          <TextInput
            style={styles.textInput}
            value={workPhone}
            onChangeText={setWorkPhone}
            placeholder="Contoh: +62 21..."
            placeholderTextColor={colors.textMuted}
            keyboardType="phone-pad"
          />
        </View>

        {/* Form Info Pribadi */}
        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>Informasi Pribadi</Text>

          <Text style={styles.inputLabel}>Nomor Identitas (NIK)</Text>
          <TextInput
            style={styles.textInput}
            value={identificationId}
            onChangeText={setIdentificationId}
            placeholder="NIK KTP"
            placeholderTextColor={colors.textMuted}
            keyboardType="number-pad"
          />

          <Text style={styles.inputLabel}>Telepon Pribadi (Handphone)</Text>
          <TextInput
            style={styles.textInput}
            value={privatePhone || mobilePhone}
            onChangeText={(txt) => {
              setPrivatePhone(txt);
              setMobilePhone(txt);
            }}
            placeholder="Contoh: 0812..."
            placeholderTextColor={colors.textMuted}
            keyboardType="phone-pad"
          />

          <Text style={styles.inputLabel}>Email Pribadi</Text>
          <TextInput
            style={styles.textInput}
            value={privateEmail}
            onChangeText={setPrivateEmail}
            placeholder="Contoh: email@pribadi.com"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <Text style={styles.inputLabel}>Tanggal Lahir</Text>
          <TouchableOpacity
            style={styles.datePickerBtn}
            activeOpacity={0.7}
            onPress={() => setShowDatePicker(true)}
          >
            <Ionicons name="calendar-outline" size={18} color={colors.primary} />
            <Text style={styles.datePickerBtnText}>
              {birthday ? toDisplay(birthday) : "Pilih Tanggal Lahir"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Form Status & Gender */}
        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>Status & Gender</Text>

          <Text style={styles.inputLabel}>Jenis Kelamin</Text>
          <View style={styles.radioRow}>
            {GENDER_OPTIONS.map((opt) => {
              const isSelected = sex === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.radioButton, isSelected && styles.radioButtonActive]}
                  activeOpacity={0.8}
                  onPress={() => setSex(opt.value as any)}
                >
                  <Text style={[styles.radioButtonText, isSelected && styles.radioButtonTextActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={[styles.inputLabel, { marginTop: spacing.md }]}>Status Pernikahan</Text>
          <View style={styles.radioRow}>
            {MARITAL_OPTIONS.map((opt) => {
              const isSelected = marital === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.radioButton, isSelected && styles.radioButtonActive]}
                  activeOpacity={0.8}
                  onPress={() => setMarital(opt.value)}
                >
                  <Text style={[styles.radioButtonText, isSelected && styles.radioButtonTextActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Date Picker Modal */}
      {showDatePicker && (
        <DateTimePicker
          value={birthday || new Date()}
          mode="date"
          // display={Platform.OS === "ios" ? "spinner" : "calendar"}
          display="compact"
          onChange={handleDateChange}
          maximumDate={new Date()} // Can't be born in the future
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  curvedHeader: {
    height: hpx(110),
    backgroundColor: colors.primary,
    borderBottomLeftRadius: wpx(25),
    borderBottomRightRadius: wpx(25),
    paddingHorizontal: spacing.xl,
    justifyContent: "flex-end",
    paddingBottom: hpx(14),
    zIndex: 1,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backBtn: {
    width: wpx(32),
    height: wpx(32),
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: rf(16),
    fontWeight: "700" as any,
    color: "#FFFFFF",
    flex: 1,
    textAlign: "center",
    marginHorizontal: spacing.sm,
  },
  saveBtn: {
    width: wpx(32),
    height: wpx(32),
    justifyContent: "center",
    alignItems: "center",
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.surface,
  },
  loadingText: {
    fontSize: rf(13),
    color: colors.textSecondary,
    marginTop: spacing.md,
  },

  scroll: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: hpx(40),
  },

  // Cards
  formCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  sectionTitle: {
    fontSize: rf(14),
    fontWeight: "800" as any,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  inputLabel: {
    fontSize: rf(11),
    fontWeight: "700" as any,
    color: colors.textSecondary,
    marginBottom: hpx(6),
  },
  textInput: {
    height: hpx(44),
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    fontSize: rf(13),
    color: colors.textPrimary,
    backgroundColor: colors.surface,
    marginBottom: spacing.md,
  },
  datePickerBtn: {
    flexDirection: "row",
    height: hpx(44),
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  datePickerBtnText: {
    fontSize: rf(13),
    color: colors.textPrimary,
    fontWeight: "600" as any,
  },

  // Radio button selectors
  radioRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  radioButton: {
    flex: 1,
    height: hpx(36),
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  radioButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  radioButtonText: {
    fontSize: rf(12),
    color: colors.textSecondary,
    fontWeight: "600" as any,
  },
  radioButtonTextActive: {
    color: colors.primary,
    fontWeight: "700" as any,
  },
});
