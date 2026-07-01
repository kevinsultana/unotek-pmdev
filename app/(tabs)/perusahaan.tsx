import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type SubTab = "events" | "employees";

interface OfficeEvent {
  id: string;
  title: string;
  category: "HR" | "Gathering" | "Training";
  description: string;
  date: string;
  time: string;
  location: string;
}

interface Employee {
  id: string;
  name: string;
  role: string;
  department: string;
  email: string;
  phone: string;
  initials: string;
}

export default function PerusahaanScreen() {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>("events");
  const [searchQuery, setSearchQuery] = useState("");

  // Mock data representing GET Event API
  const officeEvents: OfficeEvent[] = [
    {
      id: "E-01",
      title: "Kebijakan Cuti Bersama Idul Adha",
      category: "HR",
      description: "Diberitahukan kepada seluruh karyawan bahwa kantor akan diliburkan dari tanggal 16 s/d 18 Juni menyambut Idul Adha.",
      date: "16 Juni 2026",
      time: "08:00 - Selesai",
      location: "Kantor Pusat & WFH",
    },
    {
      id: "E-02",
      title: "Gathering Tahunan UNOTEK 2026",
      category: "Gathering",
      description: "Jangan lewatkan acara kebersamaan tahunan UNOTEK yang akan diadakan di Bali. Mohon konfirmasi kehadiran.",
      date: "25 Juli 2026",
      time: "09:00 - Selesai",
      location: "Seminyak, Bali",
    },
    {
      id: "E-03",
      title: "Pelatihan Pengembangan React Native v0.80+",
      category: "Training",
      description: "Sesi training internal untuk memperdalam materi tentang React Compiler baru dan Reanimated v4.",
      date: "5 Juli 2026",
      time: "13:30 - 16:30",
      location: "Ruang Rapat Utama / Zoom",
    },
  ];

  // Mock data representing GET Employee API
  const employees: Employee[] = [
    {
      id: "EMP-001",
      name: "Kevin Sultana",
      role: "Lead Mobile Developer",
      department: "Tech Department",
      email: "kevin.s@unotek.com",
      phone: "+62 812-3456-7890",
      initials: "KS",
    },
    {
      id: "EMP-002",
      name: "Amelia Putri",
      role: "HR Specialist",
      department: "Human Resources",
      email: "amelia.p@unotek.com",
      phone: "+62 812-9876-5432",
      initials: "AP",
    },
    {
      id: "EMP-003",
      name: "Rian Hidayat",
      role: "Backend Engineer",
      department: "Tech Department",
      email: "rian.h@unotek.com",
      phone: "+62 813-1111-2222",
      initials: "RH",
    },
    {
      id: "EMP-004",
      name: "Siti Rahma",
      role: "Product Owner",
      department: "Product Management",
      email: "siti.r@unotek.com",
      phone: "+62 813-4444-5555",
      initials: "SR",
    },
  ];

  const filteredEmployees = employees.filter((emp) =>
    emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "HR":
        return "#2E5BFF";
      case "Gathering":
        return "#10B981";
      case "Training":
        return "#FFB020";
      default:
        return "#8F9BB3";
    }
  };

  const getCategoryBg = (category: string) => {
    switch (category) {
      case "HR":
        return "#E0E7FF";
      case "Gathering":
        return "#E6F4EA";
      case "Training":
        return "#FFF4E5";
      default:
        return "#F3F4F6";
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.headerContainer}>
        <Text style={styles.sectionTitle}>Perusahaan</Text>
        <Text style={styles.sectionSubtitle}>Informasi internal & daftar kolega kerja</Text>
      </View>

      {/* Sub Tabs Toggle */}
      <View style={styles.subTabRow}>
        <TouchableOpacity
          style={[styles.subTabButton, activeSubTab === "events" ? styles.subTabActiveButton : null]}
          onPress={() => setActiveSubTab("events")}
        >
          <Text style={[styles.subTabButtonText, activeSubTab === "events" ? styles.subTabActiveButtonText : null]}>
            Acara & Pengumuman
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.subTabButton, activeSubTab === "employees" ? styles.subTabActiveButton : null]}
          onPress={() => setActiveSubTab("employees")}
        >
          <Text style={[styles.subTabButtonText, activeSubTab === "employees" ? styles.subTabActiveButtonText : null]}>
            Direktori Karyawan
          </Text>
        </TouchableOpacity>
      </View>

      {/* Scrollable Content */}
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {activeSubTab === "events" ? (
          /* EVENT LIST VIEW */
          <View>
            {officeEvents.map((event) => (
              <View key={event.id} style={styles.eventCard}>
                <View style={styles.eventHeader}>
                  <View style={[styles.categoryBadge, { backgroundColor: getCategoryBg(event.category) }]}>
                    <Text style={[styles.categoryBadgeText, { color: getCategoryColor(event.category) }]}>
                      {event.category}
                    </Text>
                  </View>
                  <Text style={styles.eventId}>{event.id}</Text>
                </View>

                <Text style={styles.eventTitle}>{event.title}</Text>
                <Text style={styles.eventDesc}>{event.description}</Text>

                <View style={styles.eventInfoBox}>
                  <View style={styles.infoRow}>
                    <Ionicons name="calendar-outline" size={16} color="#6B7280" />
                    <Text style={styles.infoText}>{event.date}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Ionicons name="time-outline" size={16} color="#6B7280" />
                    <Text style={styles.infoText}>{event.time}</Text>
                  </View>
                  <View style={[styles.infoRow, { marginBottom: 0 }]}>
                    <Ionicons name="location-outline" size={16} color="#6B7280" />
                    <Text style={styles.infoText}>{event.location}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        ) : (
          /* EMPLOYEE DIRECTORY VIEW */
          <View>
            {/* Search Bar */}
            <View style={styles.searchWrapper}>
              <Ionicons name="search-outline" size={20} color="#8F9BB3" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Cari nama, jabatan, divisi..."
                placeholderTextColor="#A9B5C9"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            {filteredEmployees.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="people-outline" size={48} color="#9CA3AF" />
                <Text style={styles.emptyText}>Karyawan tidak ditemukan.</Text>
              </View>
            ) : (
              filteredEmployees.map((emp) => (
                <View key={emp.id} style={styles.employeeCard}>
                  <View style={styles.employeeHeaderRow}>
                    <View style={styles.empAvatar}>
                      <Text style={styles.empAvatarText}>{emp.initials}</Text>
                    </View>
                    <View style={styles.empMainDetails}>
                      <Text style={styles.empName}>{emp.name}</Text>
                      <Text style={styles.empRole}>{emp.role}</Text>
                      <Text style={styles.empDept}>{emp.department}</Text>
                    </View>
                  </View>

                  <View style={styles.empContactRow}>
                    <View style={styles.contactItem}>
                      <Ionicons name="mail-outline" size={14} color="#6B7280" />
                      <Text style={styles.contactText}>{emp.email}</Text>
                    </View>
                    <View style={styles.contactItem}>
                      <Ionicons name="call-outline" size={14} color="#6B7280" />
                      <Text style={styles.contactText}>{emp.phone}</Text>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#eeeeefff",
    paddingBottom: -30,
  },
  headerContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1F2937",
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 4,
  },
  subTabRow: {
    flexDirection: "row",
    paddingHorizontal: 24,
    marginTop: 12,
    marginBottom: 8,
  },
  subTabButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: "#E5E7EB",
    marginRight: 12,
  },
  subTabActiveButton: {
    backgroundColor: "#2E5BFF",
  },
  subTabButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#4B5563",
  },
  subTabActiveButtonText: {
    color: "#FFFFFF",
  },
  scrollContainer: {
    padding: 24,
    paddingBottom: 40,
  },
  eventCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 2,
  },
  eventHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  eventId: {
    fontSize: 12,
    color: "#9CA3AF",
    fontWeight: "700",
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1F2937",
    marginBottom: 6,
  },
  eventDesc: {
    fontSize: 13,
    color: "#4B5563",
    lineHeight: 18,
    marginBottom: 16,
  },
  eventInfoBox: {
    backgroundColor: "#F9FAFB",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  infoText: {
    fontSize: 12,
    color: "#4B5563",
    marginLeft: 10,
    fontWeight: "500",
  },
  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 50,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: "#1F2937",
    fontSize: 14,
    fontWeight: "500",
  },
  employeeCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 2,
  },
  employeeHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    paddingBottom: 12,
    marginBottom: 12,
  },
  empAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#E0E7FF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#2E5BFF",
  },
  empAvatarText: {
    color: "#2E5BFF",
    fontSize: 16,
    fontWeight: "700",
  },
  empMainDetails: {
    marginLeft: 14,
    flex: 1,
  },
  empName: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1F2937",
  },
  empRole: {
    fontSize: 12,
    color: "#4B5563",
    fontWeight: "600",
    marginTop: 2,
  },
  empDept: {
    fontSize: 11,
    color: "#9CA3AF",
    marginTop: 1,
  },
  empContactRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  contactText: {
    fontSize: 11,
    color: "#6B7280",
    marginLeft: 6,
    fontWeight: "500",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: "#9CA3AF",
    marginTop: 12,
  },
});
