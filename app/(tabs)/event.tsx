import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import React, { useState, useEffect, useCallback } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  RefreshControl,
  useWindowDimensions,
  Linking,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import RenderHTML from "react-native-render-html";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { useRouter, useFocusEffect } from "expo-router";
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
import { calendarEventService } from "../../services/calendarEventService";
import { profileService } from "../../services/profileService";
import type { CalendarEvent } from "../../types/calendarEvent";
import { showToast } from "../../utils/toast";

const CATEGORY_MAP = {
  all: { label: "Semua", c: colors.primary, b: colors.primaryLight },
  internal: { label: "Internal", c: "#7C3AED", b: "#EDE9FE", icon: "people-outline" },
  webinar: { label: "Webinar", c: "#0284C7", b: "#E0F2FE", icon: "videocam-outline" },
  gathering: { label: "Gathering", c: "#D97706", b: "#FEF3C7", icon: "sparkles-outline" },
  libur: { label: "Libur", c: colors.error, b: "#FEE2E2", icon: "calendar-outline" },
} as const;

// Helper to format date as YYYY-MM-DD
const toISODate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Helper to format date as DD/MM/YYYY for UI display
const toDisplay = (date: Date) => {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

export default function EventScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const router = useRouter();
  
  const [activeCategory, setActiveCategory] = useState<keyof typeof CATEGORY_MAP>("all");
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);

  // Date filters (Default range: from 1st of current month to 1st of next month)
  const [dateFrom, setDateFrom] = useState<Date>(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [dateTo, setDateTo] = useState<Date>(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth() + 1, 1);
  });
  const [showPicker, setShowPicker] = useState<"from" | "to" | null>(null);

  // Local state to mock confirmation transitions
  const [confirmedEventIds, setConfirmedEventIds] = useState<Record<number, boolean>>({});

  const fetchEvents = useCallback(async (showIndicator = true) => {
    if (showIndicator) setIsLoading(true);
    try {
      const response = await calendarEventService.list({
        date_from: toISODate(dateFrom),
        date_to: toISODate(dateTo),
        per_page: 100,
      });
      if (response.data?.success) {
        setEvents(response.data.data);
      } else {
        showToast("error", "Gagal memuat event");
      }
    } catch (error) {
      console.error("Error fetching events:", error);
      showToast("error", "Terjadi kesalahan koneksi");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [dateFrom, dateTo]);

  const fetchUserProfile = useCallback(async () => {
    try {
      const response = await profileService.getProfile();
      if (response.data?.success && response.data.data?.user) {
        setCurrentUserEmail(response.data.data.user.email);
      }
    } catch (error) {
      console.error("Error fetching user profile for event filter:", error);
    }
  }, []);

  // Fetch events when the screen gains focus
  useFocusEffect(
    useCallback(() => {
      fetchEvents();
    }, [fetchEvents])
  );

  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchEvents(false);
  }, [fetchEvents]);

  const handlePickerChange = (_e: DateTimePickerEvent, d?: Date) => {
    setShowPicker(null);
    if (d) {
      if (showPicker === "from") {
        setDateFrom(d);
      } else if (showPicker === "to") {
        setDateTo(d);
      }
    }
  };

  // Dynamically categorize the event based on its contents
  const getEventCategory = useCallback((event: CalendarEvent): "internal" | "webinar" | "gathering" | "libur" => {
    const nameLower = (event.name || "").toLowerCase();
    const descLower = (event.description || "").toLowerCase();
    
    if (
      nameLower.includes("libur") || 
      nameLower.includes("hari raya") || 
      nameLower.includes("cuti bersama") || 
      (event.allday && nameLower.includes("idul"))
    ) {
      return "libur";
    }
    
    if (event.videocall_location || nameLower.includes("webinar") || descLower.includes("webinar") || nameLower.includes("zoom")) {
      return "webinar";
    }
    
    if (event.privacy === "private" || event.privacy === "confidential") {
      return "internal";
    }
    
    if (nameLower.includes("gathering") || nameLower.includes("fun") || nameLower.includes("kebersamaan") || nameLower.includes("meetup")) {
      return "gathering";
    }
    
    return "internal";
  }, []);

  const getEventDatePart = (startStr: string) => {
    if (!startStr) return "";
    return startStr.replace("T", " ").split(" ")[0];
  };

  const formatEventDate = (startStr: string) => {
    try {
      if (!startStr) return "";
      const datePart = getEventDatePart(startStr);
      const parts = datePart.split("-");
      if (parts.length !== 3) return startStr;
      
      const year = parts[0];
      const monthIdx = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      
      const months = [
        "Januari", "Februari", "Maret", "April", "Mei", "Juni",
        "Juli", "Agustus", "September", "Oktober", "November", "Desember"
      ];
      
      return `${day} ${months[monthIdx]} ${year}`;
    } catch (e) {
      return startStr;
    }
  };

  const formatEventTime = (event: CalendarEvent) => {
    if (event.allday) return "Allday (Hari Libur)";
    try {
      if (!event.start || !event.stop) return "";
      const startParts = event.start.replace("T", " ").split(" ");
      const stopParts = event.stop.replace("T", " ").split(" ");
      
      if (startParts.length < 2 || stopParts.length < 2) return "";
      
      const startTime = startParts[1].substring(0, 5);
      const stopTime = stopParts[1].substring(0, 5);
      
      return `${startTime} - ${stopTime} WIB`;
    } catch (e) {
      return "";
    }
  };

  const handleConfirmPresence = (eventId: number) => {
    setConfirmedEventIds(prev => ({ ...prev, [eventId]: true }));
    showToast("success", "Kehadiran Anda berhasil dikonfirmasi!");
  };

  // Filter out events with 'confidential' privacy
  const nonConfidentialEvents = events.filter(event => event.privacy !== "confidential");

  // Sort events chronologically
  const sortedEvents = [...nonConfidentialEvents].sort((a, b) => a.start.localeCompare(b.start));

  // Filter events by category
  const filteredEvents = sortedEvents.filter((event) => {
    const category = getEventCategory(event);
    if (activeCategory === "all") return true;
    return category === activeCategory;
  });

  // Tags styling for RenderHTML
  const htmlTagsStyles = {
    body: {
      color: colors.textSecondary,
      fontSize: rf(13),
      lineHeight: rf(18),
      margin: 0,
    },
    p: {
      margin: 0,
      marginBottom: hpx(6),
    },
    strong: {
      fontWeight: "bold" as any,
      color: colors.textPrimary,
    },
  };

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

      {/* Date filter "Dari" & "Ke" (Sampai) */}
      <View style={styles.filterRow}>
        {Platform.OS === "ios" ? (
          <View style={styles.dateBtn}>
            <Text style={styles.dateBtnLabel}>Dari</Text>
            <DateTimePicker
              value={dateFrom}
              mode="date"
              display="default"
              locale="id-ID"
              themeVariant="light"
              onChange={(_e, d) => {
                if (d) setDateFrom(d);
              }}
            />
          </View>
        ) : (
          <TouchableOpacity
            style={styles.dateBtn}
            activeOpacity={0.7}
            onPress={() => setShowPicker("from")}
          >
            <Text style={styles.dateBtnLabel}>Dari</Text>
            <Text style={styles.dateBtnValue}>{toDisplay(dateFrom)}</Text>
          </TouchableOpacity>
        )}
        
        <Ionicons
          name="arrow-forward"
          size={14}
          color={colors.border}
          style={{ marginHorizontal: spacing.sm }}
        />

        {Platform.OS === "ios" ? (
          <View style={styles.dateBtn}>
            <Text style={styles.dateBtnLabel}>Sampai</Text>
            <DateTimePicker
              value={dateTo}
              mode="date"
              display="default"
              locale="id-ID"
              themeVariant="light"
              onChange={(_e, d) => {
                if (d) setDateTo(d);
              }}
            />
          </View>
        ) : (
          <TouchableOpacity
            style={styles.dateBtn}
            activeOpacity={0.7}
            onPress={() => setShowPicker("to")}
          >
            <Text style={styles.dateBtnLabel}>Sampai</Text>
            <Text style={styles.dateBtnValue}>{toDisplay(dateTo)}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Android DateTimePicker Modals */}
      {Platform.OS !== "ios" && showPicker && (
        <DateTimePicker
          value={showPicker === "from" ? dateFrom : dateTo}
          mode="date"
          display="default"
          onChange={handlePickerChange}
        />
      )}

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

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Memuat agenda event...</Text>
        </View>
      ) : (
        <ScrollView 
          contentContainerStyle={styles.scroll} 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={[colors.primary]} />
          }
        >
          {filteredEvents.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-clear-outline" size={48} color={colors.textMuted} />
              <Text style={styles.emptyText}>Tidak ada event untuk tanggal ini.</Text>
            </View>
          ) : (
            filteredEvents.map((item) => {
              const category = getEventCategory(item);
              const config = CATEGORY_MAP[category];

              // Find logged-in user attendee state
              const myAttendee = item.attendee_ids?.find(
                (att) => att.partner?.email === currentUserEmail
              );
              
              const isConfirmedLocally = confirmedEventIds[item.id];
              const myState = isConfirmedLocally ? "accepted" : (myAttendee?.state || "needsAction");

              return (
                <TouchableOpacity
                  key={item.id}
                  style={styles.eventCard}
                  activeOpacity={0.9}
                  onPress={() => router.push({ pathname: "/event-detail", params: { id: item.id } })}
                >
                  <View style={styles.cardHeader}>
                    <View style={[styles.badge, { backgroundColor: config.b }]}>
                      <Ionicons name={config.icon} size={12} color={catConfigColor(category)} style={{ marginRight: 4 }} />
                      <Text style={[styles.badgeText, { color: catConfigColor(category) }]}>
                        {config.label}
                      </Text>
                    </View>
                    <Text style={styles.eventDateText}>
                      {formatEventDate(item.start)}
                    </Text>
                  </View>

                  <Text style={styles.eventTitle}>{item.name}</Text>
                  
                  {item.description ? (
                    <View style={styles.htmlContainer} pointerEvents="none">
                      <RenderHTML
                        contentWidth={width - wpx(72)}
                        source={{ html: item.description }}
                        tagsStyles={htmlTagsStyles}
                      />
                    </View>
                  ) : null}

                  {/* Organizer info */}
                  {item.user && (
                    <View style={styles.infoRow}>
                      <Ionicons name="person-circle-outline" size={16} color={colors.textSecondary} />
                      <Text style={styles.infoText}>Organizer: {item.user.name}</Text>
                    </View>
                  )}

                  <View style={styles.infoRow}>
                    <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
                    <Text style={styles.infoText}>{formatEventTime(item)}</Text>
                  </View>

                  {item.location && (
                    <View style={styles.infoRow}>
                      <Ionicons name="location-outline" size={16} color={colors.textSecondary} />
                      <Text style={styles.infoText}>{item.location}</Text>
                    </View>
                  )}

                  {/* Attendee / Invite List summary */}
                  {item.partner_ids && item.partner_ids.length > 0 && (
                    <View style={styles.attendeeListRow}>
                      <Ionicons name="people-outline" size={16} color={colors.textSecondary} />
                      <Text style={styles.attendeeListText} numberOfLines={1}>
                        Peserta: {item.partner_ids.map(p => p.name).join(", ")}
                      </Text>
                    </View>
                  )}

                  {/* Invitation status badge */}
                  {currentUserEmail && myAttendee && (
                    <View style={styles.statusRow}>
                      <Text style={styles.statusLabelText}>Status Anda:</Text>
                      <View style={[
                        styles.statusBadge,
                        myState === "accepted" && styles.statusBadgeAccepted,
                        myState === "needsAction" && styles.statusBadgePending,
                        myState === "declined" && styles.statusBadgeDeclined,
                      ]}>
                        <Text style={[
                          styles.statusBadgeText,
                          myState === "accepted" && styles.statusBadgeTextAccepted,
                          myState === "needsAction" && styles.statusBadgeTextPending,
                          myState === "declined" && styles.statusBadgeTextDeclined,
                        ]}>
                          {myState === "accepted" ? "Hadir" : myState === "declined" ? "Absen" : "Undangan"}
                        </Text>
                      </View>
                    </View>
                  )}

                  {/* Dynamic Action Buttons */}
                  {category === "webinar" && (
                    <TouchableOpacity 
                      style={styles.actionBtn} 
                      activeOpacity={0.8}
                      onPress={() => {
                        const url = item.videocall_location || "https://zoom.us";
                        Linking.openURL(url).catch(() => {
                          showToast("error", "Tidak dapat membuka tautan webinar");
                        });
                      }}
                    >
                      <Ionicons name="videocam" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                      <Text style={styles.actionBtnText}>
                        {item.videocall_location ? "Gabung Webinar" : "Buka Zoom"}
                      </Text>
                    </TouchableOpacity>
                  )}

                  {category === "internal" && myState === "needsAction" && (
                    <TouchableOpacity 
                      style={[styles.actionBtn, { backgroundColor: "#7C3AED", shadowColor: "#7C3AED" }]} 
                      activeOpacity={0.8}
                      onPress={() => handleConfirmPresence(item.id)}
                    >
                      <Ionicons name="checkmark-circle-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                      <Text style={styles.actionBtnText}>Konfirmasi Hadir</Text>
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      )}
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

  // Date Filter Row
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing["2xl"],
    paddingVertical: spacing.md,
    zIndex: 2,
  },
  dateBtn: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    ...shadows.card,
    flexDirection: Platform.OS === "ios" ? "row" : "column",
    alignItems: Platform.OS === "ios" ? "center" : "flex-start",
    justifyContent: Platform.OS === "ios" ? "space-between" : "center",
    height: hpx(52),
  },
  dateBtnLabel: { 
    fontSize: rf(11),
    fontWeight: "600" as any,
    color: colors.textMuted,
    marginBottom: Platform.OS === "ios" ? 0 : hpx(2) 
  },
  dateBtnValue: { 
    fontSize: rf(13),
    fontWeight: "700" as any,
    color: colors.textPrimary 
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

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: hpx(40),
  },
  loadingText: {
    fontSize: rf(13),
    color: colors.textSecondary,
    marginTop: spacing.md,
    fontWeight: "500" as any,
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
    marginBottom: spacing.sm,
  },
  htmlContainer: {
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
  attendeeListRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginBottom: hpx(6),
    paddingRight: wpx(20),
  },
  attendeeListText: {
    fontSize: rf(12),
    color: colors.textSecondary,
    fontWeight: "500" as any,
  },

  // Status Row
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginTop: hpx(8),
    marginBottom: hpx(2),
  },
  statusLabelText: {
    fontSize: rf(12),
    color: colors.textMuted,
    fontWeight: "500" as any,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: hpx(2),
    borderRadius: radius.full,
  },
  statusBadgeAccepted: {
    backgroundColor: "#D1FAE5",
  },
  statusBadgePending: {
    backgroundColor: "#FEF3C7",
  },
  statusBadgeDeclined: {
    backgroundColor: "#FEE2E2",
  },
  statusBadgeText: {
    fontSize: rf(10),
    fontWeight: "700" as any,
  },
  statusBadgeTextAccepted: {
    color: "#059669",
  },
  statusBadgeTextPending: {
    color: "#D97706",
  },
  statusBadgeTextDeclined: {
    color: colors.error,
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
