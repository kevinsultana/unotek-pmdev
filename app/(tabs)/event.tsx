import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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
} from "../../src/constants/theme";

interface CompanyEvent {
  id: string;
  title: string;
  category: "internal" | "webinar" | "gathering" | "libur";
  date: string;
  time: string;
  location: string;
  speaker?: string;
  description: string;
  status: "upcoming" | "active" | "completed";
}

const MOCK_EVENTS: CompanyEvent[] = [
  {
    id: "1",
    title: "Town Hall Meeting Q3 2026",
    category: "internal",
    date: "10 Juli 2026",
    time: "09:00 - 11:30 WIB",
    location: "Meeting Room Utama & Zoom",
    speaker: "Direksi & HR Manager",
    description: "Evaluasi kinerja tengah tahun kuartal kedua, penyampaian target kuartal ketiga, serta sesi Q&A bersama seluruh karyawan.",
    status: "upcoming",
  },
  {
    id: "2",
    title: "Webinar: React Native & Expo v54 Best Practices",
    category: "webinar",
    date: "15 Juli 2026",
    time: "14:00 - 16:00 WIB",
    location: "Zoom Meeting (Online)",
    speaker: "Kevin Sultana (Lead Mobile Developer)",
    description: "Kupas tuntas fitur terbaru Expo v54, optimasi performa aplikasi, serta sharing session implementasi real-time update.",
    status: "upcoming",
  },
  {
    id: "3",
    title: "Company Fun Gathering 2026",
    category: "gathering",
    date: "25 Agustus 2026",
    time: "08:00 WIB - Selesai",
    location: "Dufan, Ancol (Jakarta)",
    speaker: "Panitia Corporate Event",
    description: "Acara kebersamaan tahunan karyawan UNOTEK dengan tema 'Together We Grow'. Siapkan kaos seragam Anda dan nikmati berbagai wahana menarik!",
    status: "upcoming",
  },
  {
    id: "4",
    title: "Hari Raya Idul Adha 1447 H",
    category: "libur",
    date: "16 Juni 2026",
    time: "Allday (Hari Libur)",
    location: "Nasional (Libur Resmi)",
    description: "Hari Libur Nasional Idul Adha. Seluruh aktivitas kantor diliburkan dan akan kembali aktif pada hari kerja berikutnya.",
    status: "completed",
  },
];

const CATEGORY_MAP = {
  all: { label: "Semua", c: colors.primary, b: colors.primaryLight },
  internal: { label: "Internal", c: "#7C3AED", b: "#EDE9FE", icon: "people-outline" },
  webinar: { label: "Webinar", c: "#0284C7", b: "#E0F2FE", icon: "videocam-outline" },
  gathering: { label: "Gathering", c: "#D97706", b: "#FEF3C7", icon: "sparkles-outline" },
  libur: { label: "Libur", c: colors.error, b: "#FEE2E2", icon: "calendar-outline" },
} as const;

export default function EventScreen() {
  const insets = useSafeAreaInsets();
  const [activeCategory, setActiveCategory] = useState<keyof typeof CATEGORY_MAP>("all");

  const filteredEvents = MOCK_EVENTS.filter((item) => {
    if (activeCategory === "all") return true;
    return item.category === activeCategory;
  });

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Curved Header */}
      <View style={styles.curvedHeader}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Event & Agenda</Text>
          <Text style={styles.headerSub}>Jadwal kegiatan, training, & webinar perusahaan</Text>
        </View>
      </View>

      {/* Horizontal Date Strip (Decorative mockup of a calendar week) */}
      <View style={styles.calendarStripContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.calendarScroll}>
          {[
            { day: "Sen", date: "6", active: true },
            { day: "Sel", date: "7" },
            { day: "Rab", date: "8" },
            { day: "Kam", date: "9" },
            { day: "Jum", date: "10" },
            { day: "Sab", date: "11" },
            { day: "Min", date: "12" },
          ].map((item, idx) => (
            <View
              key={idx}
              style={[
                styles.calendarDayCard,
                item.active && styles.calendarDayCardActive,
              ]}
            >
              <Text style={[styles.calendarDayText, item.active && styles.calendarDayTextActive]}>
                {item.day}
              </Text>
              <Text style={[styles.calendarDateText, item.active && styles.calendarDateTextActive]}>
                {item.date}
              </Text>
              {item.active && <View style={styles.activeDot} />}
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Category Tabs */}
      <View style={styles.tabContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScroll}>
          {(Object.keys(CATEGORY_MAP) as Array<keyof typeof CATEGORY_MAP>).map((catKey) => {
            const cat = CATEGORY_MAP[catKey];
            const isSelected = activeCategory === catKey;
            return (
              <TouchableOpacity
                key={catKey}
                style={[
                  styles.tabButton,
                  isSelected && { backgroundColor: cat.c, borderColor: cat.c },
                ]}
                onPress={() => setActiveCategory(catKey)}
                activeOpacity={0.8}
              >
                <Text style={[styles.tabLabel, isSelected && { color: "#FFFFFF", fontWeight: "700" }]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {filteredEvents.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-clear-outline" size={48} color={colors.textMuted} />
            <Text style={styles.emptyText}>Tidak ada event untuk kategori ini.</Text>
          </View>
        ) : (
          filteredEvents.map((item) => {
            const config = CATEGORY_MAP[item.category];
            return (
              <View key={item.id} style={styles.eventCard}>
                <View style={styles.cardHeader}>
                  <View style={[styles.badge, { backgroundColor: config.b }]}>
                    <Ionicons name={config.icon} size={12} color={catConfigColor(item.category)} style={{ marginRight: 4 }} />
                    <Text style={[styles.badgeText, { color: catConfigColor(item.category) }]}>
                      {config.label}
                    </Text>
                  </View>
                  <Text style={styles.eventDateText}>{item.date}</Text>
                </View>

                <Text style={styles.eventTitle}>{item.title}</Text>
                <Text style={styles.eventDesc}>{item.description}</Text>

                {item.speaker && (
                  <View style={styles.infoRow}>
                    <Ionicons name="person-circle-outline" size={16} color={colors.textSecondary} />
                    <Text style={styles.infoText}>{item.speaker}</Text>
                  </View>
                )}

                <View style={styles.infoRow}>
                  <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
                  <Text style={styles.infoText}>{item.time}</Text>
                </View>

                <View style={styles.infoRow}>
                  <Ionicons name="location-outline" size={16} color={colors.textSecondary} />
                  <Text style={styles.infoText}>{item.location}</Text>
                </View>

                {item.category === "webinar" && (
                  <TouchableOpacity style={styles.actionBtn} activeOpacity={0.8}>
                    <Ionicons name="videocam" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.actionBtnText}>Gabung Zoom Meeting</Text>
                  </TouchableOpacity>
                )}

                {item.category === "internal" && (
                  <TouchableOpacity style={[styles.actionBtn, { backgroundColor: "#7C3AED" }]} activeOpacity={0.8}>
                    <Ionicons name="checkmark-circle-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.actionBtnText}>Konfirmasi Hadir</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

function catConfigColor(cat: string) {
  if (cat === "internal") return "#7C3AED";
  if (cat === "webinar") return "#0284C7";
  if (cat === "gathering") return "#D97706";
  if (cat === "libur") return colors.error;
  return colors.primary;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  curvedHeader: {
    height: hpx(130),
    backgroundColor: colors.primary,
    borderBottomLeftRadius: wpx(30),
    borderBottomRightRadius: wpx(30),
    paddingHorizontal: spacing["2xl"],
    justifyContent: "flex-end",
    paddingBottom: hpx(16),
    zIndex: 1,
  },
  headerContent: { alignItems: "center" },
  headerTitle: { fontSize: rf(22), fontWeight: "800" as any, color: "#FFFFFF" },
  headerSub: {
    fontSize: rf(13),
    color: "rgba(255,255,255,0.7)",
    marginTop: hpx(4),
    textAlign: "center",
  },

  // Calendar Strip
  calendarStripContainer: {
    backgroundColor: colors.card,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    ...shadows.card,
  },
  calendarScroll: {
    paddingHorizontal: spacing["2xl"],
    gap: spacing.sm,
  },
  calendarDayCard: {
    width: wpx(46),
    height: hpx(64),
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.surface,
  },
  calendarDayCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  calendarDayText: {
    fontSize: rf(10),
    fontWeight: "600" as any,
    color: colors.textMuted,
  },
  calendarDayTextActive: {
    color: colors.primary,
    fontWeight: "700" as any,
  },
  calendarDateText: {
    fontSize: rf(16),
    fontWeight: "800" as any,
    color: colors.textPrimary,
    marginTop: hpx(2),
  },
  calendarDateTextActive: {
    color: colors.primary,
  },
  activeDot: {
    width: wpx(4),
    height: wpx(4),
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    marginTop: hpx(2),
  },

  // Category Tabs
  tabContainer: {
    paddingVertical: spacing.md,
  },
  tabScroll: {
    paddingHorizontal: spacing["2xl"],
    gap: spacing.sm,
  },
  tabButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: hpx(8),
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  tabLabel: {
    fontSize: rf(12),
    fontWeight: "600" as any,
    color: colors.textSecondary,
  },

  scroll: {
    paddingHorizontal: spacing["2xl"],
    paddingBottom: hpx(40),
  },

  // Cards
  eventCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    paddingVertical: hpx(4),
    borderRadius: radius.xs,
  },
  badgeText: {
    fontSize: rf(10),
    fontWeight: "800" as any,
    textTransform: "uppercase",
  },
  eventDateText: {
    fontSize: rf(12),
    fontWeight: "600" as any,
    color: colors.textMuted,
  },
  eventTitle: {
    fontSize: rf(16),
    fontWeight: "800" as any,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  eventDesc: {
    fontSize: rf(13),
    color: colors.textSecondary,
    lineHeight: rf(18),
    marginBottom: spacing.md,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginBottom: hpx(6),
  },
  infoText: {
    fontSize: rf(12),
    color: colors.textSecondary,
    fontWeight: "500" as any,
  },

  actionBtn: {
    height: sizes.buttonSm,
    backgroundColor: "#0284C7",
    borderRadius: radius.md,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: spacing.md,
    ...shadows.elevated,
    shadowColor: "#0284C7",
  },
  actionBtnText: {
    color: "#FFFFFF",
    fontSize: rf(13),
    fontWeight: "700" as any,
  },

  emptyContainer: {
    alignItems: "center",
    paddingVertical: hpx(60),
  },
  emptyText: {
    fontSize: rf(13),
    color: colors.textMuted,
    marginTop: spacing.md,
  },
});
