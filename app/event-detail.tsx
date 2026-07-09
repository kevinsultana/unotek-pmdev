import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState, useCallback } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import RenderHTML from "react-native-render-html";
import * as ImagePicker from "expo-image-picker";
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
import { calendarEventService } from "../services/calendarEventService";
import type { CalendarEvent, CalendarEventAttachment } from "../types/calendarEvent";
import { showToast } from "../utils/toast";

const getEventCategory = (event: CalendarEvent): "internal" | "webinar" | "gathering" | "libur" => {
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
};

const CATEGORY_MAP = {
  internal: { label: "Internal", c: "#7C3AED", b: "#EDE9FE", icon: "people-outline" },
  webinar: { label: "Webinar", c: "#0284C7", b: "#E0F2FE", icon: "videocam-outline" },
  gathering: { label: "Gathering", c: "#D97706", b: "#FEF3C7", icon: "sparkles-outline" },
  libur: { label: "Libur", c: colors.error, b: "#FEE2E2", icon: "calendar-outline" },
} as const;

function catConfigColor(cat: string) {
  if (cat === "internal") return "#7C3AED";
  if (cat === "webinar") return "#0284C7";
  if (cat === "gathering") return "#D97706";
  if (cat === "libur") return colors.error;
  return colors.primary;
}

const getAttachmentUrl = (url: string) => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  const baseUrl = "https://pmdev.unotek.co.id";
  return `${baseUrl}${url.startsWith("/") ? "" : "/"}${url}`;
};

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width } = useWindowDimensions();

  const [event, setEvent] = useState<CalendarEvent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [previewImageUri, setPreviewImageUri] = useState<string | null>(null);

  const fetchEventDetails = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const response = await calendarEventService.getById(Number(id));
      if (response.data?.success && response.data.data) {
        setEvent(response.data.data);
      } else {
        showToast("error", "Gagal memuat detail event");
        router.back();
      }
    } catch (error) {
      console.error("Error fetching event details:", error);
      showToast("error", "Terjadi kesalahan koneksi");
      router.back();
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      fetchEventDetails();
    }, [fetchEventDetails])
  );

  const handleDeleteEvent = () => {
    if (!event) return;
    Alert.alert(
      "Hapus Event",
      "Apakah Anda yakin ingin menghapus event ini secara permanen?",
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: async () => {
            try {
              const res = await calendarEventService.delete(event.id);
              if (res.data?.success) {
                showToast("success", "Event berhasil dihapus");
                router.back();
              } else {
                showToast("error", "Gagal menghapus event");
              }
            } catch (err) {
              console.error("Error deleting event:", err);
              showToast("error", "Terjadi kesalahan koneksi");
            }
          },
        },
      ]
    );
  };

  const pickImage = async (useCamera: boolean) => {
    if (!event) return;
    try {
      let result;
      if (useCamera) {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          showToast("error", "Izin kamera diperlukan untuk mengambil foto");
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          quality: 0.8,
        });
      } else {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          showToast("error", "Izin galeri diperlukan untuk memilih foto");
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          quality: 0.8,
        });
      }

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        uploadPhoto(uri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      showToast("error", "Gagal memilih foto");
    }
  };

  const uploadPhoto = async (uri: string) => {
    if (!event) return;
    setIsUploading(true);
    try {
      const res = await calendarEventService.uploadAttachment(uri, event.id);
      if (res.data?.success) {
        showToast("success", "Foto berhasil diunggah!");
        // Refresh event details to see the new attachment
        fetchEventDetails();
      } else {
        showToast("error", "Gagal mengunggah foto");
      }
    } catch (err) {
      console.error("Error uploading attachment:", err);
      showToast("error", "Gagal mengunggah foto ke server");
    } finally {
      setIsUploading(false);
    }
  };

  const showPhotoOptions = () => {
    Alert.alert(
      "Unggah Foto Event",
      "Pilih sumber foto:",
      [
        { text: "Kamera", onPress: () => pickImage(true) },
        { text: "Galeri", onPress: () => pickImage(false) },
        { text: "Batal", style: "cancel" }
      ]
    );
  };

  const formatEventDate = (startStr?: string) => {
    if (!startStr) return "";
    try {
      const datePart = startStr.replace("T", " ").split(" ")[0];
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

  const getEventDatePart = (startStr?: string) => {
    if (!startStr) return "";
    return startStr.replace("T", " ").split(" ")[0];
  };

  const formatEventDateTime = (dateTimeStr?: string) => {
    if (!dateTimeStr) return "";
    try {
      const datePart = formatEventDate(dateTimeStr);
      const parts = dateTimeStr.replace("T", " ").split(" ");
      if (parts.length < 2) return datePart;
      const timePart = parts[1].substring(0, 5);
      return `${datePart}, ${timePart} WIB`;
    } catch {
      return dateTimeStr;
    }
  };

  const formatEventTime = (ev?: CalendarEvent | null) => {
    if (!ev) return "";
    if (ev.allday) return "Allday (Hari Libur)";
    try {
      if (!ev.start || !ev.stop) return "";
      const startParts = ev.start.replace("T", " ").split(" ");
      const stopParts = ev.stop.replace("T", " ").split(" ");
      
      if (startParts.length < 2 || stopParts.length < 2) return "";
      
      const startTime = startParts[1].substring(0, 5);
      const stopTime = stopParts[1].substring(0, 5);
      
      return `${startTime} - ${stopTime} WIB`;
    } catch (e) {
      return "";
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Memuat detail event...</Text>
      </View>
    );
  }

  if (!event) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Event tidak ditemukan</Text>
      </View>
    );
  }

  const category = getEventCategory(event);
  const catConfig = CATEGORY_MAP[category];
  
  const startDatePart = getEventDatePart(event.start);
  const stopDatePart = getEventDatePart(event.stop);
  const isDifferentDay = !!(startDatePart && stopDatePart && startDatePart !== stopDatePart);

  // Filter attachments to find images
  const imageAttachments = (event.attachments || []).filter(att => {
    const mime = (att.mimetype || "").toLowerCase();
    const name = (att.name || "").toLowerCase();
    return mime.includes("image/") || name.endsWith(".jpg") || name.endsWith(".jpeg") || name.endsWith(".png") || name.endsWith(".gif");
  });

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
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header with back, title, and action icons */}
      <View style={[styles.curvedHeader, { paddingTop: insets.top }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={wpx(22)} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Detail Event</Text>
          
          <View style={styles.backBtn} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Main Details Card */}
        <View style={styles.detailsCard}>
          <View style={styles.cardHeader}>
            <View style={[styles.badge, { backgroundColor: catConfig.b }]}>
              <Ionicons name={catConfig.icon} size={12} color={catConfigColor(category)} style={{ marginRight: 4 }} />
              <Text style={[styles.badgeText, { color: catConfigColor(category) }]}>
                {catConfig.label}
              </Text>
            </View>
            {event.number && <Text style={styles.eventNumberText}>{event.number}</Text>}
          </View>

          <Text style={styles.eventTitle}>{event.name}</Text>

          {/* Date & Time Row */}
          {!isDifferentDay ? (
            <>
              <View style={styles.metaRow}>
                <Ionicons name="calendar-outline" size={18} color={colors.primary} />
                <View style={styles.metaTextCol}>
                  <Text style={styles.metaLabel}>Tanggal</Text>
                  <Text style={styles.metaValue}>{formatEventDate(event.start)}</Text>
                </View>
              </View>

              <View style={styles.metaRow}>
                <Ionicons name="time-outline" size={18} color={colors.primary} />
                <View style={styles.metaTextCol}>
                  <Text style={styles.metaLabel}>Waktu</Text>
                  <Text style={styles.metaValue}>{formatEventTime(event)}</Text>
                </View>
              </View>
            </>
          ) : (
            <>
              <View style={styles.metaRow}>
                <Ionicons name="calendar-outline" size={18} color={colors.primary} />
                <View style={styles.metaTextCol}>
                  <Text style={styles.metaLabel}>Tanggal Mulai</Text>
                  <Text style={styles.metaValue}>{formatEventDateTime(event.start)}</Text>
                </View>
              </View>
              <View style={styles.metaRow}>
                <Ionicons name="calendar-outline" size={18} color={colors.primary} />
                <View style={styles.metaTextCol}>
                  <Text style={styles.metaLabel}>Tanggal Selesai</Text>
                  <Text style={styles.metaValue}>{formatEventDateTime(event.stop)}</Text>
                </View>
              </View>
            </>
          )}

          {event.location && (
            <View style={styles.metaRow}>
              <Ionicons name="location-outline" size={18} color={colors.primary} />
              <View style={styles.metaTextCol}>
                <Text style={styles.metaLabel}>Lokasi</Text>
                <Text style={styles.metaValue}>{event.location}</Text>
              </View>
            </View>
          )}

          {event.user && (
            <View style={styles.metaRow}>
              <Ionicons name="person-circle-outline" size={18} color={colors.primary} />
              <View style={styles.metaTextCol}>
                <Text style={styles.metaLabel}>Penyelenggara</Text>
                <Text style={styles.metaValue}>{event.user.name}</Text>
              </View>
            </View>
          )}

          {event.privacy && (
            <View style={styles.metaRow}>
              <Ionicons name="lock-closed-outline" size={18} color={colors.primary} />
              <View style={styles.metaTextCol}>
                <Text style={styles.metaLabel}>Privasi</Text>
                <Text style={[styles.metaValue, { textTransform: "capitalize" }]}>{event.privacy}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Video / Zoom Webinar Button */}
        {category === "webinar" && (
          <TouchableOpacity
            style={styles.webinarBtn}
            activeOpacity={0.8}
            onPress={() => {
              const url = event.videocall_location || "https://zoom.us";
              Linking.openURL(url).catch(() => {
                showToast("error", "Tidak dapat membuka tautan webinar");
              });
            }}
          >
            <Ionicons name="videocam" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.webinarBtnText}>
              {event.videocall_location ? "Gabung Zoom/Google Meet" : "Buka Zoom"}
            </Text>
          </TouchableOpacity>
        )}

        {/* Description Section */}
        {event.description ? (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Deskripsi</Text>
            <RenderHTML
              contentWidth={width - wpx(72)}
              source={{ html: event.description }}
              tagsStyles={htmlTagsStyles}
            />
          </View>
        ) : null}

        {/* Photo Gallery Section */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Galeri Foto</Text>
          </View>

          {imageAttachments.length === 0 ? (
            <View style={styles.emptyGalleryContainer}>
              <Ionicons name="image-outline" size={32} color={colors.textMuted} />
              <Text style={styles.emptyGalleryText}>Belum ada foto terunggah untuk event ini.</Text>
            </View>
          ) : (
            <View style={styles.galleryGrid}>
              {imageAttachments.map((img) => (
                <TouchableOpacity
                  key={img.id}
                  style={styles.galleryItem}
                  activeOpacity={0.85}
                  onPress={() => {
                    setPreviewImageUri(getAttachmentUrl(img.url));
                  }}
                >
                  <Image
                    source={{ uri: getAttachmentUrl(img.url) }}
                    style={styles.galleryImage}
                    resizeMode="cover"
                  />
                  <Text style={styles.galleryImageName} numberOfLines={1}>
                    {img.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Invited Attendees Section */}
        {event.attendee_ids && event.attendee_ids.length > 0 && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Peserta Undangan ({event.attendee_ids.length})</Text>
            {event.attendee_ids.map((attendee) => {
              const state = attendee.state;
              return (
                <View key={attendee.id} style={styles.attendeeRow}>
                  <View style={styles.attendeeAvatar}>
                    <Text style={styles.avatarText}>
                      {(attendee.partner?.name || "P").substring(0, 1).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.attendeeInfo}>
                    <Text style={styles.attendeeName}>{attendee.partner?.name}</Text>
                    <Text style={styles.attendeeEmail}>{attendee.partner?.email}</Text>
                  </View>
                  <View style={[
                    styles.statusBadge,
                    state === "accepted" && styles.statusBadgeAccepted,
                    state === "needsAction" && styles.statusBadgePending,
                    state === "declined" && styles.statusBadgeDeclined,
                  ]}>
                    <Text style={[
                      styles.statusBadgeText,
                      state === "accepted" && styles.statusBadgeTextAccepted,
                      state === "needsAction" && styles.statusBadgeTextPending,
                      state === "declined" && styles.statusBadgeTextDeclined,
                    ]}>
                      {state === "accepted" ? "Hadir" : state === "declined" ? "Absen" : "Undangan"}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      <Modal
        visible={!!previewImageUri}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setPreviewImageUri(null)}
      >
        <View style={styles.modalBg}>
          <TouchableOpacity
            style={[styles.modalCloseIcon, { top: insets.top || spacing.md }]}
            onPress={() => setPreviewImageUri(null)}
            activeOpacity={0.8}
          >
            <Ionicons name="close" size={28} color="#FFFFFF" />
          </TouchableOpacity>
          {previewImageUri && (
            <Image
              source={{ uri: previewImageUri }}
              style={styles.modalImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
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
  headerActions: {
    flexDirection: "row",
    gap: wpx(6),
  },
  actionHeaderBtn: {
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

  // Details Card
  detailsCard: {
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
  eventNumberText: {
    fontSize: rf(11),
    fontWeight: "700" as any,
    color: colors.textMuted,
  },
  eventTitle: {
    fontSize: rf(18),
    fontWeight: "800" as any,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  metaTextCol: {
    flex: 1,
  },
  metaLabel: {
    fontSize: rf(10),
    color: colors.textMuted,
    fontWeight: "500" as any,
  },
  metaValue: {
    fontSize: rf(13),
    color: colors.textPrimary,
    fontWeight: "600" as any,
    marginTop: hpx(1),
  },

  webinarBtn: {
    height: sizes.buttonMd,
    backgroundColor: "#0284C7",
    borderRadius: radius.md,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.md,
    ...shadows.elevated,
    shadowColor: "#0284C7",
  },
  webinarBtnText: {
    color: "#FFFFFF",
    fontSize: rf(14),
    fontWeight: "700" as any,
  },

  // Sections
  sectionCard: {
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
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  addPhotoBtn: {
    flexDirection: "row",
    alignItems: "center",
    borderColor: colors.primary,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: hpx(4),
    borderRadius: radius.full,
  },
  addPhotoBtnText: {
    color: colors.primary,
    fontSize: rf(12),
    fontWeight: "700" as any,
  },

  htmlContainer: {
    marginTop: hpx(4),
  },

  // Photo Gallery
  emptyGalleryContainer: {
    alignItems: "center",
    paddingVertical: spacing.xl,
  },
  emptyGalleryText: {
    fontSize: rf(12),
    color: colors.textMuted,
    marginTop: spacing.sm,
    textAlign: "center",
  },
  galleryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  galleryItem: {
    width: (wpx(300) - spacing.lg) / 2, // dynamic calculation roughly splitting width
    marginBottom: spacing.sm,
  },
  galleryImage: {
    width: "100%",
    height: hpx(110),
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  galleryImageName: {
    fontSize: rf(10),
    color: colors.textSecondary,
    marginTop: hpx(4),
    textAlign: "center",
  },

  // Attendees
  attendeeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: spacing.sm,
  },
  attendeeAvatar: {
    width: wpx(36),
    height: wpx(36),
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
  },
  avatarText: {
    color: colors.primary,
    fontWeight: "700" as any,
    fontSize: rf(14),
  },
  attendeeInfo: {
    flex: 1,
  },
  attendeeName: {
    fontSize: rf(13),
    fontWeight: "700" as any,
    color: colors.textPrimary,
  },
  attendeeEmail: {
    fontSize: rf(11),
    color: colors.textSecondary,
    marginTop: hpx(1),
  },

  // Status Badges
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: hpx(4),
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

  // Modal styles for photo preview
  modalBg: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalImage: {
    width: "100%",
    height: "80%",
  },
  modalCloseIcon: {
    position: "absolute",
    right: spacing.xl,
    zIndex: 10,
    padding: 10,
  },
});
