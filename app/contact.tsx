import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDebounce } from "../hooks/useDebounce";
import { contactService } from "../services/contactService";
import {
  colors,
  hpx,
  radius,
  rf,
  shadows,
  sizes,
  spacing,
  wpx,
} from "../src/constants/theme";
import type { Contact } from "../types/contact";
import { showToast } from "../utils/toast";

export default function ContactScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [companies, setCompanies] = useState<Contact[]>([]);
  const [personCounts, setPersonCounts] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  const fetchContacts = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch contacts with param company_type = company, sort_by = created_at, order = desc
      const res = await contactService.list({
        company_type: "company",
        search: debouncedSearchQuery,
        sort_by: "created_at",
        order: "desc",
      });

      const companyList = res.items || [];
      setCompanies(companyList);

      // Fetch linked person count for each company
      const counts: Record<number, number> = {};
      await Promise.all(
        companyList.map(async (comp) => {
          try {
            const persons = await contactService.getPersonsForCompany(comp.id);
            counts[comp.id] = persons.length;
          } catch {
            counts[comp.id] = 0;
          }
        })
      );
      setPersonCounts(counts);
    } catch (err) {
      console.warn("Failed loading company contacts:", err);
      showToast("error", "Gagal Memuat Kontak", "Terjadi kesalahan saat memuat daftar perusahaan.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [debouncedSearchQuery]);

  useFocusEffect(
    useCallback(() => {
      fetchContacts();
    }, [fetchContacts])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchContacts();
  };

  const handleDelete = (company: Contact) => {
    Alert.alert(
      "Arsip Kontak Perusahaan",
      `Apakah Anda yakin ingin mengarsipkan kontak ${company.name}?`,
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Arsip / Hapus",
          style: "destructive",
          onPress: async () => {
            try {
              await contactService.delete(company.id);
              showToast("success", "Kontak Diarsipkan", `${company.name} berhasil diarsipkan.`);
              fetchContacts();
            } catch {
              showToast("error", "Gagal", "Gagal mengarsipkan kontak perusahaan.");
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Header Standard Curved matching Pipeline/Maintenance */}
      <View style={styles.curvedHeader}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => (router.canGoBack() ? router.back() : router.replace("/(tabs)/action"))}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={wpx(24)} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Kontak Perusahaan</Text>
          <Text style={styles.headerSub}>Kelola Partner & Kontak Person</Text>
        </View>

        <TouchableOpacity
          style={styles.addHeaderBtn}
          onPress={() =>
            router.push({
              pathname: "/contact-form",
              params: { company_type: "company" },
            } as any)
          }
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={wpx(26)} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      {loading && !refreshing ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Memuat data perusahaan...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        >
          {/* Search Box outside curved header */}
          <View style={styles.searchBox}>
            <Ionicons name="search" size={wpx(20)} color={colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Cari perusahaan, email, telp, NPWP, kota..."
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
              onSubmitEditing={fetchContacts}
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons name="close-circle" size={wpx(18)} color={colors.textMuted} />
              </TouchableOpacity>
            ) : null}
          </View>

          {companies.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="business-outline" size={wpx(56)} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>Tidak ada kontak perusahaan</Text>
              <Text style={styles.emptySub}>
                {searchQuery
                  ? `Tidak ada hasil pencarian untuk "${searchQuery}"`
                  : "Belum ada data perusahaan tersimpan. Ketuk tombol + untuk membuat kontak perusahaan baru."}
              </Text>
            </View>
          ) : (
            companies.map((company) => {
              const pCount = personCounts[company.id] || 0;
              return (
                <TouchableOpacity
                  key={company.id}
                  style={styles.card}
                  onPress={() =>
                    router.push({
                      pathname: "/contact-detail",
                      params: { id: company.id },
                    } as any)
                  }
                  activeOpacity={0.88}
                >
                  <View style={styles.cardHeader}>
                    <View style={styles.avatarBg}>
                      <Ionicons name="business" size={wpx(22)} color={colors.primary} />
                    </View>
                    <View style={styles.titleArea}>
                      <Text style={styles.companyName} numberOfLines={1}>
                        {company.name}
                      </Text>
                      {company.vat ? (
                        <Text style={styles.vatText} numberOfLines={1}>
                          NPWP: {company.vat}
                        </Text>
                      ) : null}
                    </View>

                    {/* Actions dropdown/buttons */}
                    <View style={styles.actionRow}>
                      <TouchableOpacity
                        style={styles.iconBtn}
                        onPress={() =>
                          router.push({
                            pathname: "/contact-form",
                            params: { id: company.id, company_type: "company" },
                          } as any)
                        }
                      >
                        <Ionicons name="create-outline" size={wpx(18)} color={colors.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.iconBtn, { marginLeft: spacing.xs }]}
                        onPress={() => handleDelete(company)}
                      >
                        <Ionicons name="trash-outline" size={wpx(18)} color={colors.error} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.divider} />

                  <View style={styles.cardBody}>
                    {company.email ? (
                      <View style={styles.infoRow}>
                        <Ionicons name="mail-outline" size={wpx(15)} color={colors.textSecondary} />
                        <Text style={styles.infoText} numberOfLines={1}>
                          {company.email}
                        </Text>
                      </View>
                    ) : null}

                    {company.phone ? (
                      <View style={styles.infoRow}>
                        <Ionicons name="call-outline" size={wpx(15)} color={colors.textSecondary} />
                        <Text style={styles.infoText} numberOfLines={1}>
                          {company.phone}
                        </Text>
                      </View>
                    ) : null}

                    {company.city || company.street ? (
                      <View style={styles.infoRow}>
                        <Ionicons name="location-outline" size={wpx(15)} color={colors.textSecondary} />
                        <Text style={styles.infoText} numberOfLines={1}>
                          {[company.street, company.city].filter(Boolean).join(", ")}
                        </Text>
                      </View>
                    ) : null}
                  </View>

                  {/* Card Footer: Person count badge & Link */}
                  <View style={styles.cardFooter}>
                    <View style={styles.personBadge}>
                      <Ionicons name="people" size={wpx(15)} color="#059669" />
                      <Text style={styles.personBadgeText}>
                        {pCount} Person Terkait
                      </Text>
                    </View>
                    <View style={styles.detailCta}>
                      <Text style={styles.detailCtaText}>Lihat Detail & Person</Text>
                      <Ionicons name="chevron-forward" size={wpx(16)} color={colors.primary} />
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
          <View style={{ height: hpx(80) }} />
        </ScrollView>
      )}

      {/* Floating Action Button */}
      <TouchableOpacity
        style={[styles.fab, { bottom: insets.bottom > 0 ? insets.bottom + hpx(16) : hpx(24) }]}
        onPress={() =>
          router.push({
            pathname: "/contact-form",
            params: { company_type: "company" },
          } as any)
        }
        activeOpacity={0.88}
      >
        <Ionicons name="add" size={wpx(26)} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  curvedHeader: {
    height: hpx(130),
    backgroundColor: colors.primary,
    borderBottomLeftRadius: wpx(30),
    borderBottomRightRadius: wpx(30),
    paddingHorizontal: spacing["2xl"],
    flexDirection: "row",
    alignItems: "flex-end",
    paddingBottom: hpx(16),
    zIndex: 1,
  },
  backBtn: {
    padding: spacing.xs,
  },
  headerContent: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: rf(20),
    fontWeight: "800" as any,
    color: "#FFFFFF",
  },
  headerSub: {
    fontSize: rf(12),
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: hpx(2),
  },
  addHeaderBtn: {
    padding: spacing.xs,
  },
  scrollContent: {
    paddingHorizontal: spacing["2xl"],
    paddingTop: hpx(16),
    paddingBottom: hpx(90),
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: sizes.searchHeight,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: rf(14),
    color: colors.textPrimary,
  },
  centerLoading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: rf(14),
    color: colors.textSecondary,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: hpx(60),
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing["2xl"],
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyTitle: {
    fontSize: rf(16),
    fontWeight: "700" as any,
    color: colors.textPrimary,
    marginTop: spacing.md,
  },
  emptySub: {
    fontSize: rf(13),
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: spacing.xs,
    lineHeight: rf(18),
  },
  card: {
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
    alignItems: "center",
  },
  avatarBg: {
    width: wpx(42),
    height: wpx(42),
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  titleArea: {
    flex: 1,
    marginLeft: spacing.md,
  },
  companyName: {
    fontSize: rf(16),
    fontWeight: "700" as any,
    color: colors.textPrimary,
  },
  vatText: {
    fontSize: rf(12),
    color: colors.textMuted,
    marginTop: hpx(2),
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconBtn: {
    width: wpx(32),
    height: wpx(32),
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  cardBody: {
    gap: hpx(6),
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  infoText: {
    fontSize: rf(13),
    color: colors.textSecondary,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  personBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#D1FAE5",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    gap: spacing.xs,
  },
  personBadgeText: {
    fontSize: rf(12),
    fontWeight: "700" as any,
    color: "#059669",
  },
  detailCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: hpx(2),
  },
  detailCtaText: {
    fontSize: rf(12),
    fontWeight: "600" as any,
    color: colors.primary,
  },
  fab: {
    position: "absolute",
    right: spacing.xl,
    width: sizes.fabSize,
    height: sizes.fabSize,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    ...shadows.elevated,
  },
  fabIcon: {
    color: "#ffffff",
  },
});
