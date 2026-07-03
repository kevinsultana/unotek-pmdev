import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { projectService } from "../../services/projectService";
import {
  colors,
  radius,
  rf,
  shadows,
  sizes,
  spacing,
  textPresets,
} from "../../src/constants/theme";
import type { Project } from "../../types/project";

const STAGE_STYLES: Record<string, { c: string; b: string }> = {
  Initiation: { c: "#F59E0B", b: "#FEF3C7" },
  "Requirement Gathering": { c: "#F59E0B", b: "#FEF3C7" },
  Implementation: { c: colors.primary, b: colors.primaryLight },
  "Blueprint Approval": { c: colors.primary, b: colors.primaryLight },
  UAT: { c: "#7C3AED", b: "#EDE9FE" },
  "Go-Live Preparation": { c: "#059669", b: "#D1FAE5" },
  "Hypercare Support": { c: "#059669", b: "#D1FAE5" },
};

function stageStyle(name?: string) {
  return STAGE_STYLES[name ?? ""] ?? { c: colors.textMuted, b: "#F1F5F9" };
}

export default function PerusahaanScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchProjects = useCallback(async () => {
    try {
      setError(null);
      const res = await projectService.list({ active: true });
      setProjects(res.data.data || []);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Gagal memuat daftar project");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchProjects();
    }, [fetchProjects]),
  );

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchProjects();
  };

  const filteredProjects = projects.filter((p) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.partner?.name?.toLowerCase().includes(q) ||
      p.user?.name?.toLowerCase().includes(q) ||
      p.stage_id?.name?.toLowerCase().includes(q)
    );
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />

      {/* ── Heading ──────────────────────────────────────────────── */}
      <View style={styles.heading}>
        <Text style={styles.pageTitle}>Perusahaan</Text>
        <Text style={styles.pageSub}>Daftar project & informasi internal</Text>
      </View>

      {/* ── Search ────────────────────────────────────────────────── */}
      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={18} color={colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Cari project, klien, PIC..."
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* ── List ──────────────────────────────────────────────────── */}
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
          />
        }
      >
        {isLoading ? (
          <ActivityIndicator
            size="large"
            color={colors.primary}
            style={{ marginVertical: spacing["4xl"] }}
          />
        ) : error ? (
          <View style={styles.center}>
            <Ionicons
              name="alert-circle-outline"
              size={40}
              color={colors.error}
            />
            <Text style={styles.emptyText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={fetchProjects}>
              <Text style={styles.retryText}>Coba Lagi</Text>
            </TouchableOpacity>
          </View>
        ) : filteredProjects.length === 0 ? (
          <View style={styles.center}>
            <Ionicons
              name="folder-open-outline"
              size={40}
              color={colors.textMuted}
            />
            <Text style={styles.emptyText}>
              {searchQuery ? "Project tidak ditemukan." : "Belum ada project."}
            </Text>
          </View>
        ) : (
          filteredProjects.map((project) => {
            const st = stageStyle(project.stage_id?.name);
            return (
              <TouchableOpacity
                key={project.id}
                style={styles.projectCard}
                activeOpacity={0.7}
                onPress={() => router.push(`/project-detail?id=${project.id}`)}
              >
                {/* Top row */}
                <View style={styles.cardTop}>
                  <View style={styles.idBadge}>
                    <Text style={styles.idText}>#{project.id}</Text>
                  </View>
                  {project.stage_id ? (
                    <View
                      style={[styles.stageBadge, { backgroundColor: st.b }]}
                    >
                      <Text style={[styles.stageBadgeText, { color: st.c }]}>
                        {project.stage_id.name}
                      </Text>
                    </View>
                  ) : null}
                </View>

                <Text style={styles.projectName}>{project.name}</Text>
                {project.description ? (
                  <Text style={styles.projectDesc} numberOfLines={2}>
                    {project.description}
                  </Text>
                ) : null}

                {/* Detail chips */}
                <View style={styles.chips}>
                  {project.partner && (
                    <View style={styles.chip}>
                      <Ionicons
                        name="business-outline"
                        size={12}
                        color={colors.textSecondary}
                      />
                      <Text style={styles.chipText}>
                        {project.partner.name}
                      </Text>
                    </View>
                  )}
                  {project.user && (
                    <View style={styles.chip}>
                      <Ionicons
                        name="person-outline"
                        size={12}
                        color={colors.textSecondary}
                      />
                      <Text style={styles.chipText}>{project.user.name}</Text>
                    </View>
                  )}
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                  <View style={styles.footerItem}>
                    <Ionicons
                      name="checkbox-outline"
                      size={14}
                      color={colors.primary}
                    />
                    <Text style={styles.footerText}>
                      {project.task_count} tugas
                    </Text>
                  </View>
                  {(project.date_start || project.date) && (
                    <View style={styles.footerItem}>
                      <Ionicons
                        name="calendar-outline"
                        size={13}
                        color={colors.textMuted}
                      />
                      <Text style={styles.footerDate}>
                        {project.date_start || "—"} → {project.date || "—"}
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })
        )}
        <View style={{ height: spacing["3xl"] }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface, paddingBottom: -30 },
  scroll: {
    paddingHorizontal: spacing["2xl"],
    paddingTop: 0,
    paddingBottom: spacing["4xl"],
  },
  center: { alignItems: "center", paddingVertical: spacing["4xl"] },
  emptyText: { ...textPresets.body, marginTop: spacing.md },

  // Heading
  heading: { paddingTop: spacing["2xl"], paddingBottom: spacing.sm },
  pageTitle: { ...textPresets.display, paddingHorizontal: spacing["2xl"] },
  pageSub: {
    ...textPresets.body,
    marginTop: spacing.xs,
    paddingHorizontal: spacing["2xl"],
  },

  // Search
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    marginHorizontal: rf(20),
    height: sizes.searchHeight,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  searchInput: { flex: 1, color: colors.textPrimary, fontSize: rf(14) },

  // Card
  projectCard: {
    marginHorizontal: 0,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.card,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  idBadge: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs - 1,
    borderRadius: radius.sm,
  },
  idText: {
    fontSize: rf(10),
    fontWeight: "700" as any,
    color: colors.textMuted,
  },
  stageBadge: {
    paddingHorizontal: spacing.sm + 1,
    paddingVertical: spacing.xs - 1,
    borderRadius: radius.sm,
  },
  stageBadgeText: { fontSize: rf(10), fontWeight: "700" as any },
  projectName: { ...textPresets.cardTitle, marginBottom: spacing.xs },
  projectDesc: {
    ...textPresets.body,
    fontSize: rf(13),
    lineHeight: rf(18),
    marginBottom: spacing.md,
  },

  // Chips
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm + 1,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  chipText: {
    fontSize: rf(11),
    color: colors.textSecondary,
    fontWeight: "500" as any,
  },

  // Footer
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  footerItem: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  footerText: {
    fontSize: rf(12),
    fontWeight: "600" as any,
    color: colors.primary,
  },
  footerDate: { fontSize: rf(10), color: colors.textMuted },

  // Retry
  retryBtn: {
    marginTop: spacing.lg,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
  },
  retryText: { color: "#FFFFFF", fontSize: rf(14), fontWeight: "700" as any },
});
