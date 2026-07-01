import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const validateEmail = (text: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!text) {
      return "Email tidak boleh kosong";
    } else if (!emailRegex.test(text)) {
      return "Format email tidak valid";
    }
    return "";
  };

  const handleResetPassword = () => {
    setEmailError("");
    const emailErr = validateEmail(email);

    if (emailErr) {
      setEmailError(emailErr);
      return;
    }

    setIsLoading(true);

    // Simulate sending recovery email API call
    setTimeout(() => {
      setIsLoading(false);
      setIsSubmitted(true);
    }, 1500);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          {/* Back Button */}
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>

        {/* Header Section */}
        <View style={styles.headerSection}>
          <View style={styles.iconBadge}>
            <Ionicons name="key-outline" size={40} color="#2E5BFF" />
          </View>
          <Text style={styles.title}>Lupa Kata Sandi?</Text>
          <Text style={styles.subtitle}>
            Jangan khawatir! Masukkan email terdaftar Anda untuk menerima tautan pemulihan kata sandi.
          </Text>
        </View>

        {/* Main Content Card */}
        <View style={styles.formCard}>
          {!isSubmitted ? (
            <>
              {/* Email Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Alamat Email Karyawan</Text>
                <View style={[styles.inputWrapper, emailError ? styles.inputErrorBorder : null]}>
                  <Ionicons name="mail-outline" size={20} color="#8F9BB3" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="nama@unotek.com"
                    placeholderTextColor="#A9B5C9"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text);
                      if (emailError) setEmailError(validateEmail(text));
                    }}
                  />
                </View>
                {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleResetPassword}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.submitButtonText}>Kirim Link Reset</Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            /* Success State */
            <View style={styles.successContainer}>
              <View style={styles.successIconBadge}>
                <Ionicons name="checkmark-circle" size={48} color="#10B981" />
              </View>
              <Text style={styles.successTitle}>Email Terkirim!</Text>
              <Text style={styles.successSubtitle}>
                Tautan pemulihan kata sandi telah dikirim ke:{"\n"}
                <Text style={styles.highlightEmail}>{email}</Text>
              </Text>
              <Text style={styles.successInstructions}>
                Silakan periksa kotak masuk atau folder spam email Anda untuk instruksi selanjutnya.
              </Text>

              <TouchableOpacity
                style={styles.backToLoginButton}
                onPress={() => router.replace("/")}
              >
                <Text style={styles.backToLoginButtonText}>Kembali ke Login</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Back Link bottom if not submitted */}
        {!isSubmitted && (
          <TouchableOpacity style={styles.bottomBackLink} onPress={() => router.back()}>
            <Text style={styles.bottomBackLinkText}>Batal dan Kembali</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F9FC",
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  backButton: {
    position: "absolute",
    top: 10,
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    zIndex: 10,
  },
  headerSection: {
    alignItems: "center",
    marginBottom: 32,
    marginTop: 40,
  },
  iconBadge: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#2E5BFF",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1F2937",
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 8,
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  formCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.04,
    shadowRadius: 20,
    elevation: 3,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#4B5563",
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 14,
    backgroundColor: "#F9FAFB",
    paddingHorizontal: 16,
    height: 52,
  },
  inputErrorBorder: {
    borderColor: "#FF3B30",
    backgroundColor: "#FFF5F5",
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    color: "#1F2937",
    fontSize: 15,
    fontWeight: "500",
  },
  errorText: {
    color: "#FF3B30",
    fontSize: 12,
    marginTop: 6,
    fontWeight: "500",
  },
  submitButton: {
    height: 52,
    backgroundColor: "#2E5BFF",
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#2E5BFF",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  bottomBackLink: {
    alignItems: "center",
    marginTop: 24,
  },
  bottomBackLinkText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
  },
  successContainer: {
    alignItems: "center",
    paddingVertical: 12,
  },
  successIconBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#E6F4EA",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#10B981",
    marginBottom: 12,
  },
  successSubtitle: {
    fontSize: 14,
    color: "#4B5563",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 8,
  },
  highlightEmail: {
    fontWeight: "700",
    color: "#1F2937",
  },
  successInstructions: {
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  backToLoginButton: {
    width: "100%",
    height: 50,
    borderWidth: 1.5,
    borderColor: "#2E5BFF",
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  backToLoginButtonText: {
    color: "#2E5BFF",
    fontSize: 15,
    fontWeight: "700",
  },
});
