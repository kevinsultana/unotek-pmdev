import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../hooks/useAuth";
import { useProfile } from "../../hooks/useProfile";
import { useTasks } from "../../hooks/useTasks";
import {
  colors,
  hpx,
  radius,
  rf,
  shadows,
  spacing,
  wpx,
} from "../../src/constants/theme";

const MENU_GRID = [
  {
    route: "/timeline",
    icon: "checkbox-outline",
    label: "Task",
    color: colors.primary,
    bg: colors.primaryLight,
  },
  {
    route: "/kehadiran",
    icon: "finger-print",
    label: "Absensi",
    color: "#F59E0B",
    bg: "#FEF3C7",
  },
  {
    route: "/perusahaan",
    icon: "business-outline",
    label: "Company",
    color: "#059669",
    bg: "#D1FAE5",
  },
  {
    route: "/profile",
    icon: "person-outline",
    label: "Profil",
    color: "#7C3AED",
    bg: "#EDE9FE",
  },
] as const;

function stripHtml(html?: string | null) {
  if (!html) return "";
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .trim();
}

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { refreshUser } = useAuth();
  const { profile, isLoading } = useProfile();
  const { tasks, isLoading: tasksLoading, refresh: refreshTasks } = useTasks();

  const [clock, setClock] = useState({ time: "", date: "" });
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setClock({
        time: now.toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
        date: now.toLocaleDateString("id-ID", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        }),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useFocusEffect(
    useCallback(() => {
      refreshUser();
      refreshTasks();
    }, [refreshUser, refreshTasks]),
  );

  const userName = profile?.employee?.name || "User";
  const initials = userName.charAt(0).toUpperCase();
  const hour = new Date().getHours();
  const greeting =
    hour < 11
      ? "Selamat Pagi"
      : hour < 15
        ? "Selamat Siang"
        : hour < 18
          ? "Selamat Sore"
          : "Selamat Malam";
  const recentTasks = tasks.slice(0, 5);

  if (isLoading) {
    return (
      <View style={[styles.center, { paddingTop: insets.top + hpx(48) }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* ── Curved Header Background ────────────────────────────────── */}
      <View style={[styles.curvedHeader, { paddingTop: insets.top }]}>
        <View style={styles.headerRow}>
          <View style={styles.headerTextCol}>
            <Text style={styles.greeting}>{greeting},</Text>
            <Text style={styles.userName} numberOfLines={1}>
              {userName}
            </Text>
          </View>
          <View style={styles.avatarWrap}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
        </View>
      </View>

      {/* ── Scrollable Content ──────────────────────────────────────── */}
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Floating Menu Card ────────────────────────────────────── */}
        <View style={styles.menuCard}>
          <Text style={styles.menuCardTitle}>Menu</Text>
          <View style={styles.menuGrid}>
            {MENU_GRID.map((item) => (
              <TouchableOpacity
                key={item.route}
                style={styles.menuItem}
                onPress={() => router.push(item.route)}
                activeOpacity={0.7}
              >
                <View style={[styles.menuIcon, { backgroundColor: item.bg }]}>
                  <Ionicons
                    name={item.icon as any}
                    size={wpx(22)}
                    color={item.color}
                  />
                </View>
                <Text style={styles.menuLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Attendance Hero Card ──────────────────────────────────── */}
        <View style={styles.heroCard}>
          <Text style={styles.heroDate}>{clock.date}</Text>
          <Text style={styles.heroTime}>{clock.time}</Text>
          <View style={styles.pulseDot} />
          <View style={styles.heroActions}>
            <TouchableOpacity
              style={[styles.heroBtn, styles.heroBtnIn]}
              onPress={() => router.push("/kehadiran")}
              activeOpacity={0.85}
            >
              <Ionicons name="finger-print" size={wpx(18)} color="#FFFFFF" />
              <Text style={styles.heroBtnText}>Check In</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.heroBtn, styles.heroBtnOut]}
              onPress={() => router.push("/kehadiran")}
              activeOpacity={0.85}
            >
              <Ionicons
                name="exit-outline"
                size={wpx(18)}
                color={colors.error}
              />
              <Text style={[styles.heroBtnText, { color: colors.error }]}>
                Check Out
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Task Feed ─────────────────────────────────────────────── */}
        <View style={styles.feedHeader}>
          <Text style={styles.feedTitle}>Tugas Hari Ini</Text>
          <TouchableOpacity onPress={() => router.push("/timeline")}>
            <Text style={styles.feedSeeAll}>Lihat Semua</Text>
          </TouchableOpacity>
        </View>

        {tasksLoading ? (
          <ActivityIndicator
            size="small"
            color={colors.primary}
            style={{ marginVertical: hpx(24) }}
          />
        ) : recentTasks.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons
              name="documents-outline"
              size={wpx(32)}
              color={colors.textMuted}
            />
            <Text style={styles.emptyText}>Belum ada tugas hari ini</Text>
          </View>
        ) : (
          recentTasks.map((task) => (
            <TouchableOpacity
              key={task.id}
              style={styles.taskCard}
              activeOpacity={0.7}
              onPress={() => router.push(`/task-detail?id=${task.id}`)}
            >
              <View style={styles.taskCardTop}>
                <Text style={styles.taskName} numberOfLines={1}>
                  {task.name}
                </Text>
                {task.stage && (
                  <View
                    style={[styles.taskBadge, { backgroundColor: "#DBEAFE" }]}
                  >
                    <Text
                      style={[styles.taskBadgeText, { color: colors.primary }]}
                    >
                      {task.stage.name}
                    </Text>
                  </View>
                )}
              </View>
              {task.description && (
                <Text style={styles.taskDesc} numberOfLines={2}>
                  {stripHtml(task.description)}
                </Text>
              )}
              <View style={styles.taskCardBottom}>
                {task.date_deadline && (
                  <View style={styles.taskMeta}>
                    <Ionicons
                      name="calendar-outline"
                      size={wpx(12)}
                      color={colors.textMuted}
                    />
                    <Text style={styles.taskMetaText}>
                      {task.date_deadline.substring(0, 10)}
                    </Text>
                  </View>
                )}
                {task.project?.name && (
                  <View style={styles.taskMeta}>
                    <Ionicons
                      name="folder-outline"
                      size={wpx(12)}
                      color={colors.textMuted}
                    />
                    <Text style={styles.taskMetaText} numberOfLines={1}>
                      {task.project.name}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))
        )}

        <View style={{ height: hpx(24) }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  // ── Curved Header ──────────────────────────────────────────────────
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
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTextCol: { flex: 1, marginRight: spacing.md },
  greeting: {
    fontSize: rf(15),
    fontWeight: "500" as any,
    color: "rgba(255,255,255,0.7)",
    marginBottom: hpx(2),
  },
  userName: {
    fontSize: rf(22),
    fontWeight: "800" as any,
    color: "#FFFFFF",
  },
  avatarWrap: {
    width: wpx(48),
    height: wpx(48),
    borderRadius: radius.full,
    backgroundColor: "rgba(255,255,255,0.25)",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: rf(18),
    fontWeight: "800" as any,
    color: "#FFFFFF",
  },

  // ── Scroll container ───────────────────────────────────────────────
  scroll: {
    paddingHorizontal: spacing["2xl"],
    paddingBottom: hpx(40),
    paddingTop: hpx(45),
  },

  // ── Floating Menu Card ─────────────────────────────────────────────
  menuCard: {
    marginTop: -hpx(36),
    backgroundColor: colors.card,
    borderRadius: wpx(20),
    padding: spacing["2xl"],
    ...shadows.elevated,
    marginBottom: hpx(20),
    zIndex: 10,
  },
  menuCardTitle: {
    fontSize: rf(13),
    fontWeight: "700" as any,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: wpx(0.8),
    marginBottom: spacing.lg,
  },
  menuGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  menuItem: {
    alignItems: "center",
    width: wpx(68),
    gap: hpx(6),
  },
  menuIcon: {
    width: wpx(48),
    height: wpx(48),
    borderRadius: radius.full,
    justifyContent: "center",
    alignItems: "center",
  },
  menuLabel: {
    fontSize: rf(11),
    fontWeight: "600" as any,
    color: colors.textSecondary,
    textAlign: "center",
  },

  // ── Attendance Hero Card ───────────────────────────────────────────
  heroCard: {
    backgroundColor: colors.card,
    borderRadius: wpx(20),
    padding: spacing["2xl"],
    alignItems: "center",
    marginBottom: hpx(24),
    ...shadows.card,
  },
  heroDate: {
    fontSize: rf(13),
    fontWeight: "500" as any,
    color: colors.textSecondary,
    marginBottom: hpx(8),
  },
  heroTime: {
    fontSize: rf(42),
    fontWeight: "800" as any,
    color: colors.textPrimary,
    letterSpacing: wpx(1),
    marginBottom: hpx(4),
  },
  pulseDot: {
    width: wpx(8),
    height: wpx(8),
    borderRadius: radius.full,
    backgroundColor: colors.success,
    marginBottom: hpx(20),
  },
  heroActions: {
    flexDirection: "row",
    gap: spacing.md,
    width: "100%",
  },
  heroBtn: {
    flex: 1,
    height: hpx(48),
    borderRadius: radius.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  heroBtnIn: { backgroundColor: colors.primary },
  heroBtnOut: {
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.error,
  },
  heroBtnText: { fontSize: rf(14), fontWeight: "700" as any, color: "#FFFFFF" },

  // ── Task Feed ──────────────────────────────────────────────────────
  feedHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  feedTitle: {
    fontSize: rf(16),
    fontWeight: "700" as any,
    color: colors.textPrimary,
  },
  feedSeeAll: {
    fontSize: rf(13),
    fontWeight: "600" as any,
    color: colors.primary,
  },
  emptyBox: {
    alignItems: "center",
    paddingVertical: hpx(32),
    gap: hpx(8),
  },
  emptyText: { fontSize: rf(13), color: colors.textMuted },
  taskCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.card,
  },
  taskCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  taskName: {
    fontSize: rf(15),
    fontWeight: "700" as any,
    color: colors.textPrimary,
    flex: 1,
    marginRight: spacing.sm,
  },
  taskBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: hpx(3),
    borderRadius: radius.sm,
  },
  taskBadgeText: { fontSize: rf(10), fontWeight: "700" as any },
  taskDesc: {
    fontSize: rf(13),
    color: colors.textSecondary,
    lineHeight: rf(18),
    marginBottom: spacing.md,
  },
  taskCardBottom: {
    flexDirection: "row",
    gap: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  taskMeta: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  taskMetaText: { fontSize: rf(11), color: colors.textMuted },
});
