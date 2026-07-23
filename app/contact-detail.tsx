import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { contactService } from "../services/contactService";
import {
  colors,
  hpx,
  radius,
  rf,
  shadows,
  spacing,
  wpx,
} from "../src/constants/theme";
import type { Contact } from "../types/contact";
import { showToast } from "../utils/toast";

export default function ContactDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const companyId = id ? parseInt(id, 10) : 0;

  const [company, setCompany] = useState<Contact | null>(null);
  const [persons, setPersons] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDetail = useCallback(async () => {
    if (!companyId) return;
    try {
      setLoading(true);
      const data = await contactService.getById(companyId);
      setCompany(data);

      // Fetch persons linked to this company
      const linkedPersons = await contactService.getPersonsForCompany(companyId);
      setPersons(linkedPersons);
    } catch (err) {
      console.warn("Error fetching contact detail:", err);
      showToast("error", "Gagal", "Tidak dapat memuat detail kontak perusahaan.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [companyId]);

  useFocusEffect(
    useCallback(() => {
      fetchDetail();
    }, [fetchDetail])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDetail();
  };

  const handleDeleteCompany = () => {
    if (!company) return;
    Alert.alert(
      "Arsip Perusahaan",
      `Apakah Anda yakin ingin mengarsipkan kontak perusahaan ${company.name}?`,
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Arsip",
          style: "destructive",
          onPress: async () => {
            try {
              await contactService.delete(company.id);
              showToast("success", "Perusahaan Diarsipkan", `${company.name} telah diarsipkan.`);
              router.back();
            } catch {
              showToast("error", "Gagal", "Gagal mengarsipkan perusahaan.");
            }
          },
        },
      ]
    );
  };

  const handleDeletePerson = (person: Contact) => {
    Alert.alert(
      "Hapus Kontak Person",
      `Apakah Anda yakin ingin mengarsipkan kontak person ${person.name}?`,
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus / Arsip",
          style: "destructive",
          onPress: async () => {
            try {
              await contactService.delete(person.id);
              showToast("success", "Person Diarsipkan", `${person.name} telah diarsipkan.`);
              fetchDetail();
            } catch {
              showToast("error", "Gagal", "Gagal mengarsipkan kontak person.");
            }
          },
        },
      ]
    );
  };

  const openUrl = (url?: string) => {
    if (!url) return;
    const formatted = url.startsWith("http") ? url : `https://${url}`;
    Linking.openURL(formatted).catch(() =>
      showToast("error", "Gagal Buka Link", "Format URL tidak valid.")
    );
  };

  const openPhone = (phone?: string) => {
    if (!phone) return;
    Linking.openURL(`tel:${phone}`).catch(() =>
      showToast("error", "Gagal", "Tidak dapat membuat panggilan.")
    );
  };

  const openEmail = (email?: string) => {
    if (!email) return;
    Linking.openURL(`mailto:${email}`).catch(() =>
      showToast("error", "Gagal", "Tidak dapat membuka aplikasi email.")
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.centerLoading}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Memuat detail perusahaan...</Text>
      </View>
    );
  }

  if (!company) {
    return (
      <View style={styles.centerLoading}>
        <Ionicons name="alert-circle-outline" size={wpx(48)} color={colors.error} />
        <Text style={styles.errorTitle}>Data tidak ditemukan</Text>
        <TouchableOpacity style={styles.backBtnSimple} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Kembali ke Daftar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Header Standard Curved matching Pipeline/Maintenance */}
      <View style={styles.curvedHeader}>
        <TouchableOpacity
          style={styles.headerBackBtn}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={wpx(24)} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.headerTitleBox}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            Detail Perusahaan
          </Text>
          <Text style={styles.headerSub}>Informasi Kontak & Pejabat</Text>
        </View>

        <View style={styles.headerRightActions}>
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() =>
              router.push({
                pathname: "/contact-form",
                params: { id: company.id, company_type: "company" },
              } as any)
            }
          >
            <Ionicons name="create-outline" size={wpx(22)} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIconBtn} onPress={handleDeleteCompany}>
            <Ionicons name="trash-outline" size={wpx(22)} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Body */}
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
        {/* Banner Hero Card */}
        <View style={styles.bannerCard}>
          <View style={styles.companyIconBg}>
            <Ionicons name="business" size={wpx(28)} color={colors.primary} />
          </View>
          <View style={styles.bannerInfo}>
            <Text style={styles.bannerName}>{company.name}</Text>
            {company.vat ? (
              <Text style={styles.bannerVat}>NPWP: {company.vat}</Text>
            ) : (
              <Text style={styles.bannerVat}>Kontak Perusahaan (Company)</Text>
            )}
          </View>
        </View>

        {/* Section 1: Detail Informasi */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Informasi Perusahaan</Text>
          <View style={styles.divider} />

          {company.email ? (
            <TouchableOpacity
              style={styles.detailRow}
              onPress={() => openEmail(company.email)}
            >
              <View style={styles.iconCircle}>
                <Ionicons name="mail-outline" size={wpx(18)} color={colors.primary} />
              </View>
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>Email</Text>
                <Text style={[styles.detailVal, { color: colors.primary }]}>
                  {company.email}
                </Text>
              </View>
            </TouchableOpacity>
          ) : null}

          {company.phone ? (
            <TouchableOpacity
              style={styles.detailRow}
              onPress={() => openPhone(company.phone)}
            >
              <View style={styles.iconCircle}>
                <Ionicons name="call-outline" size={wpx(18)} color={colors.primary} />
              </View>
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>Telepon Perusahaan</Text>
                <Text style={[styles.detailVal, { color: colors.primary }]}>
                  {company.phone}
                </Text>
              </View>
            </TouchableOpacity>
          ) : null}

          {company.website ? (
            <TouchableOpacity
              style={styles.detailRow}
              onPress={() => openUrl(company.website)}
            >
              <View style={styles.iconCircle}>
                <Ionicons name="globe-outline" size={wpx(18)} color={colors.primary} />
              </View>
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>Website</Text>
                <Text style={[styles.detailVal, { color: colors.primary }]}>
                  {company.website}
                </Text>
              </View>
            </TouchableOpacity>
          ) : null}

          {company.street || company.city || company.zip ? (
            <View style={styles.detailRow}>
              <View style={styles.iconCircle}>
                <Ionicons name="location-outline" size={wpx(18)} color={colors.primary} />
              </View>
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>Alamat</Text>
                <Text style={styles.detailVal}>
                  {[company.street, company.street2, company.city, company.zip]
                    .filter(Boolean)
                    .join(", ")}
                </Text>
              </View>
            </View>
          ) : null}

          {company.comment ? (
            <View style={styles.detailRow}>
              <View style={styles.iconCircle}>
                <Ionicons name="document-text-outline" size={wpx(18)} color={colors.primary} />
              </View>
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>Catatan / Keterangan</Text>
                <Text style={styles.detailVal}>{company.comment}</Text>
              </View>
            </View>
          ) : null}
        </View>

        {/* Section 2: Person Terkait (Child Contacts linked to Company) */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <View style={{ flex: 1, marginRight: spacing.sm }}>
              <Text style={styles.sectionTitle}>Kontak Person Terkait</Text>
              <Text style={styles.sectionSub}>
                List person yang terhubung dengan {company.name}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.addPersonBtn}
              onPress={() =>
                router.push({
                  pathname: "/contact-form",
                  params: {
                    company_type: "person",
                    parent_id: company.id,
                    parent_name: company.name,
                  },
                } as any)
              }
            >
              <Ionicons name="person-add-outline" size={wpx(16)} color="#FFFFFF" />
              <Text style={styles.addPersonBtnText}>Tambah Person</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          {persons.length === 0 ? (
            <View style={styles.emptyPersonBox}>
              <Ionicons name="person-outline" size={wpx(36)} color={colors.textMuted} />
              <Text style={styles.emptyPersonTitle}>Belum ada Person terhubung</Text>
              <Text style={styles.emptyPersonSub}>
                Ketuk tombol "Tambah Person" di atas untuk menambahkan kontak PIC / pejabat di perusahaan ini.
              </Text>
            </View>
          ) : (
            persons.map((person) => (
              <View key={person.id} style={styles.personCard}>
                <View style={styles.personHeader}>
                  <View style={styles.personAvatar}>
                    <Text style={styles.personInitials}>
                      {person.name.substring(0, 2).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.personMainInfo}>
                    <Text style={styles.personName}>{person.name}</Text>
                    {person.function ? (
                      <Text style={styles.personJob}>{person.function}</Text>
                    ) : (
                      <Text style={styles.personJobMuted}>Jabatan belum diisi</Text>
                    )}
                  </View>

                  <View style={styles.personActions}>
                    <TouchableOpacity
                      style={styles.miniIconBtn}
                      onPress={() =>
                        router.push({
                          pathname: "/contact-form",
                          params: {
                            id: person.id,
                            company_type: "person",
                            parent_id: company.id,
                            parent_name: company.name,
                          },
                        } as any)
                      }
                    >
                      <Ionicons name="create-outline" size={wpx(16)} color={colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.miniIconBtn, { marginLeft: spacing.xs }]}
                      onPress={() => handleDeletePerson(person)}
                    >
                      <Ionicons name="trash-outline" size={wpx(16)} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Person details */}
                <View style={styles.personBody}>
                  {person.mobile || person.phone ? (
                    <TouchableOpacity
                      style={styles.personContactRow}
                      onPress={() => openPhone(person.mobile || person.phone)}
                    >
                      <Ionicons name="call-outline" size={wpx(14)} color={colors.primary} />
                      <Text style={[styles.personContactText, { color: colors.primary }]}>
                        {person.mobile || person.phone}
                      </Text>
                    </TouchableOpacity>
                  ) : null}

                  {person.email ? (
                    <TouchableOpacity
                      style={styles.personContactRow}
                      onPress={() => openEmail(person.email)}
                    >
                      <Ionicons name="mail-outline" size={wpx(14)} color={colors.primary} />
                      <Text style={[styles.personContactText, { color: colors.primary }]}>
                        {person.email}
                      </Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
            ))
          )}
        </View>

        <View style={{ height: hpx(40) }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  centerLoading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.surface,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: rf(14),
    color: colors.textSecondary,
  },
  errorTitle: {
    marginTop: spacing.md,
    fontSize: rf(16),
    fontWeight: "700" as any,
    color: colors.textPrimary,
  },
  backBtnSimple: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: hpx(10),
    backgroundColor: colors.primary,
    borderRadius: radius.md,
  },
  backBtnText: {
    color: "#FFFFFF",
    fontSize: rf(13),
    fontWeight: "700" as any,
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
  headerBackBtn: {
    padding: spacing.xs,
  },
  headerTitleBox: {
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
  headerRightActions: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  headerIconBtn: {
    padding: spacing.xs,
  },
  scrollContent: {
    paddingHorizontal: spacing["2xl"],
    paddingTop: hpx(16),
    paddingBottom: hpx(40),
  },
  bannerCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  companyIconBg: {
    width: wpx(48),
    height: wpx(48),
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  bannerInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  bannerName: {
    fontSize: rf(17),
    fontWeight: "800" as any,
    color: colors.textPrimary,
  },
  bannerVat: {
    fontSize: rf(12),
    color: colors.textSecondary,
    marginTop: hpx(2),
  },
  sectionCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontSize: rf(15),
    fontWeight: "800" as any,
    color: colors.textPrimary,
  },
  sectionSub: {
    fontSize: rf(11),
    color: colors.textMuted,
    marginTop: hpx(2),
  },
  addPersonBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: hpx(8),
    borderRadius: radius.md,
    gap: spacing.xs,
  },
  addPersonBtnText: {
    fontSize: rf(12),
    fontWeight: "700" as any,
    color: "#FFFFFF",
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: spacing.md,
  },
  iconCircle: {
    width: wpx(32),
    height: wpx(32),
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  detailTextContainer: {
    flex: 1,
  },
  detailLabel: {
    fontSize: rf(11),
    fontWeight: "600" as any,
    color: colors.textMuted,
  },
  detailVal: {
    fontSize: rf(14),
    fontWeight: "600" as any,
    color: colors.textPrimary,
    marginTop: hpx(2),
  },
  emptyPersonBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xl,
  },
  emptyPersonTitle: {
    fontSize: rf(14),
    fontWeight: "700" as any,
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
  emptyPersonSub: {
    fontSize: rf(12),
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  personCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  personHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  personAvatar: {
    width: wpx(36),
    height: wpx(36),
    borderRadius: radius.full,
    backgroundColor: "#7C3AED",
    alignItems: "center",
    justifyContent: "center",
  },
  personInitials: {
    fontSize: rf(13),
    fontWeight: "700" as any,
    color: "#FFFFFF",
  },
  personMainInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  personName: {
    fontSize: rf(14),
    fontWeight: "700" as any,
    color: colors.textPrimary,
  },
  personJob: {
    fontSize: rf(12),
    fontWeight: "600" as any,
    color: "#7C3AED",
    marginTop: hpx(1),
  },
  personJobMuted: {
    fontSize: rf(11),
    color: colors.textMuted,
    fontStyle: "italic",
  },
  personActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  miniIconBtn: {
    width: wpx(28),
    height: wpx(28),
    borderRadius: radius.sm,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  personBody: {
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
    gap: hpx(4),
  },
  personContactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  personContactText: {
    fontSize: rf(12),
    fontWeight: "500" as any,
  },
});
