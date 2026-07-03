import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, hpx, radius, rf, shadows, sizes, spacing, textPresets, wpx } from "../src/constants/theme";
import { Badge } from "../src/components/ui";
import { timeOffService } from "../services/timeOffService";
import type { TimeOff } from "../types/timeOff";

const STATE_COLORS: Record<string, { c: string; b: string }> = {
  draft: { c: "#F59E0B", b: "#FEF3C7" },
  confirm: { c: colors.primary, b: colors.primaryLight },
  validate1: { c: "#7C3AED", b: "#EDE9FE" },
  validate: { c: "#059669", b: "#D1FAE5" },
  refuse: { c: colors.error, b: "#FEE2E2" },
  cancel: { c: colors.textMuted, b: "#F1F5F9" },
  approved: { c: "#059669", b: "#D1FAE5" },
};

const tz = "Asia/Jakarta";

function fmtDateTime(iso: string) {
  try {
    const d = new Date(iso);
    const date = d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric", timeZone: tz });
    const time = d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", timeZone: tz });
    return `${date} ${time}`;
  } catch { return iso; }
}

// ── Detail Row ────────────────────────────────────────────────────────────
function DetailRow({ icon, label, value, iconColor }: { icon: keyof typeof Ionicons.glyphMap; label: string; value?: string; iconColor?: string }) {
  const c = iconColor ?? colors.primary;
  return (
    <View style={detailStyles.row}>
      <View style={[detailStyles.iconBox, { backgroundColor: `${c}15` }]}>
        <Ionicons name={icon} size={18} color={c} />
      </View>
      <View style={detailStyles.text}>
        <Text style={detailStyles.label}>{label}</Text>
        <Text style={detailStyles.value}>{value || "—"}</Text>
      </View>
    </View>
  );
}

function Section({ children }: { children: React.ReactNode }) {
  return <View style={detailStyles.section}>{children}</View>;
}

export default function TimeOffDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [data, setData] = useState<TimeOff | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        setIsLoading(true);
        setError(null);
        const res = await timeOffService.getById(Number(id));
        setData(res.data.data);
      } catch (err: any) {
        setError(err?.response?.data?.message || "Gagal memuat detail cuti");
      } finally {
        setIsLoading(false);
      }
    })();
  }, [id]);

  if (isLoading) {
    return (
      <View style={[styles.center, { paddingTop: insets.top + spacing["5xl"] }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Header router={router} />
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
          <Text style={styles.emptyText}>{error || "Data tidak ditemukan."}</Text>
        </View>
      </View>
    );
  }

  const st = STATE_COLORS[data.state] ?? STATE_COLORS.draft;
  const canCancel = ["draft", "confirm", "validate"].includes(data.state);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      <Stack.Screen options={{ headerShown: false }} />
      <Header router={router} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Status badge */}
        <View style={styles.hero}>
          <Badge label={data.state_label || data.state} />
        </View>

        {/* Info */}
        <Section>
          <DetailRow icon="umbrella-outline" label="Tipe Cuti" value={data.holiday_status?.name} />
          <View style={detailStyles.divider} />
          <DetailRow icon="person-outline" label="Karyawan" value={data.employee?.name} iconColor="#059669" />
          {data.department && (
            <>
              <View style={detailStyles.divider} />
              <DetailRow icon="business-outline" label="Departemen" value={data.department.name} iconColor="#F59E0B" />
            </>
          )}
        </Section>

        {/* Dates */}
        <Section>
          <View style={styles.dateRow}>
            <View style={styles.dateBox}>
              <Ionicons name="calendar-outline" size={16} color={colors.amber} />
              <Text style={styles.dateLabel}>Mulai</Text>
              <Text style={styles.dateValue}>{fmtDateTime(data.date_from)}</Text>
            </View>
            <Ionicons name="arrow-forward" size={14} color={colors.border} />
            <View style={styles.dateBox}>
              <Ionicons name="calendar-outline" size={16} color={colors.success} />
              <Text style={styles.dateLabel}>Selesai</Text>
              <Text style={styles.dateValue}>{fmtDateTime(data.date_to)}</Text>
            </View>
          </View>
        </Section>

        {/* Duration */}
        <Section>
          <View style={styles.statRow}>
            <Ionicons name="time-outline" size={24} color={colors.primary} />
            <Text style={styles.statValue}>{data.number_of_days}</Text>
            <Text style={styles.statLabel}>Hari</Text>
          </View>
        </Section>

        {/* Notes */}
        {data.name && (
          <Section>
            <Text style={styles.noteTitle}>Keterangan</Text>
            <Text style={styles.noteText}>{data.name}</Text>
          </Section>
        )}

        {canCancel && <View style={{ height: hpx(80) }} />}
      </ScrollView>

      {canCancel && (
        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.cancelBtn} onPress={() => {
            Alert.alert("Batalkan Cuti", "Yakin ingin membatalkan pengajuan ini?", [
              { text: "Tidak", style: "cancel" },
              { text: "Ya, Batalkan", style: "destructive", onPress: async () => {
                setIsCancelling(true);
                try {
                  await timeOffService.cancel(data.id);
                  const res = await timeOffService.getById(data.id);
                  setData(res.data.data);
                } catch (err: any) {
                  Alert.alert("Gagal", err?.response?.data?.message || "Terjadi kesalahan.");
                } finally { setIsCancelling(false); }
              }},
            ]);
          }} disabled={isCancelling} activeOpacity={0.7}>
            {isCancelling ? (
              <ActivityIndicator size="small" color={colors.error} />
            ) : (
              <>
                <Ionicons name="close-circle-outline" size={18} color={colors.error} />
                <Text style={styles.cancelBtnText}>Batalkan Pengajuan</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

function Header({ router }: { router: any }) {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn} activeOpacity={0.7}>
        <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Detail Cuti</Text>
      <View style={styles.headerBtn} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { ...textPresets.body, marginTop: spacing.md },

  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: spacing.lg, height: sizes.headerHeight, backgroundColor: colors.card,
    borderBottomWidth: 1, borderBottomColor: colors.border,
    marginTop: Platform.OS === "android" ? spacing.sm : 0,
  },
  headerBtn: { width: sizes.headerBtnWidth, height: sizes.headerBtn, borderRadius: radius.md, justifyContent: "center", alignItems: "center" },
  headerTitle: { ...textPresets.screenTitle, fontSize: 17, flex: 1, textAlign: "left", marginLeft: spacing.xs },

  scroll: { padding: spacing["2xl"], paddingBottom: spacing["4xl"] },

  hero: { alignItems: "center", marginBottom: spacing.xl, marginTop: spacing.sm },

  // Dates
  dateRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  dateBox: { flex: 1, alignItems: "center", gap: spacing.sm },
  dateLabel: { ...textPresets.label, marginTop: spacing.xs },
  dateValue: { ...textPresets.cardTitle, fontSize: 13, textAlign: "center" },

  // Stat
  statRow: { alignItems: "center", gap: spacing.sm },
  statValue: { ...textPresets.display, fontSize: 28 },
  statLabel: { ...textPresets.body },

  // Note
  noteTitle: { ...textPresets.sectionHeader, marginBottom: spacing.md },
  noteText: { ...textPresets.body, lineHeight: 20 },

  // Bottom bar
  bottomBar: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    backgroundColor: colors.card, paddingHorizontal: spacing["2xl"],
    paddingVertical: spacing.lg, paddingBottom: spacing["3xl"],
    borderTopWidth: 1, borderTopColor: colors.border,
    ...shadows.elevated,
  },
  cancelBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    height: sizes.buttonMd, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.error,
    backgroundColor: colors.card, gap: spacing.sm,
  },
  cancelBtnText: { color: colors.error, fontSize: 15, fontWeight: "700" as any },
});

// ── DetailRow sub-styles ──────────────────────────────────────────────────
const detailStyles = StyleSheet.create({
  section: {
    backgroundColor: colors.card, borderRadius: radius.xl, padding: spacing["2xl"],
    marginBottom: spacing.lg, ...shadows.card,
  },
  row: { flexDirection: "row", alignItems: "center" },
  iconBox: { width: 36, height: 36, borderRadius: radius.md, justifyContent: "center", alignItems: "center", marginRight: spacing.md },
  text: { flex: 1 },
  label: { ...textPresets.label },
  value: { ...textPresets.cardTitle, marginTop: 2 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.md, marginLeft: 52 },
});
