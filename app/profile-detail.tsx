import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter, useFocusEffect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState, useCallback } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
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

  useFocusEffect(
    useCallback(() => {
      fetchFullEmployeeDetails();
    }, [fetchFullEmployeeDetails])
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
        </View>
        <View style={{ height: hpx(24) }} />
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
});
