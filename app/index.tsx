import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../hooks/useAuth";

export default function LoginScreen() {
  const router = useRouter();
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Validation and UI states
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [generalError, setGeneralError] = useState("");

  // ── Auto-redirect if already authenticated (session restored from storage) ──
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.replace("/(tabs)/home");
    }
  }, [authLoading, isAuthenticated]);

  const validateEmail = (text: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!text) {
      return "Email tidak boleh kosong";
    } else if (!emailRegex.test(text)) {
      return "Format email tidak valid";
    }
    return "";
  };

  const handleLogin = async () => {
    // Reset errors
    setEmailError("");
    setPasswordError("");
    setGeneralError("");

    const emailErr = validateEmail(email);

    if (emailErr) {
      setEmailError(emailErr);
      return;
    }

    setIsLoading(true);

    try {
      // Remember Me controls whether tokens persist after app close
      await login(email, password, rememberMe);
      router.replace("/(tabs)/home");
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Email atau password salah. Silakan coba lagi.";
      setGeneralError(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Show a loading splash while AuthContext checks stored tokens on app start
  if (authLoading) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <View style={{ alignItems: "center" }}>
          <View style={styles.logoBadge}>
            <Ionicons name="finger-print" size={40} color="#2E5BFF" />
          </View>
          <Text style={styles.title}>UNOTEK PMDEV</Text>
          <ActivityIndicator
            size="large"
            color="#2E5BFF"
            style={{ marginTop: 24 }}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header Branding */}
          <View style={styles.headerSection}>
            <View style={styles.logoBadge}>
              <Ionicons name="finger-print" size={40} color="#2E5BFF" />
            </View>
            <Text style={styles.title}>UNOTEK PMDEV</Text>
            <Text style={styles.subtitle}>
              Sistem Presensi & Kelola Karyawan
            </Text>
          </View>

          {/* Login Form Card */}
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Masuk ke Akun Anda</Text>

            {generalError ? (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={20} color="#FF3B30" />
                <Text style={styles.errorBannerText}>{generalError}</Text>
              </View>
            ) : null}

            {/* Email Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Alamat Email</Text>
              <View
                style={[
                  styles.inputWrapper,
                  emailError ? styles.inputErrorBorder : null,
                ]}
              >
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color="#8F9BB3"
                  style={styles.inputIcon}
                />
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
              {emailError ? (
                <Text style={styles.errorText}>{emailError}</Text>
              ) : null}
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Kata Sandi</Text>
              <View
                style={[
                  styles.inputWrapper,
                  passwordError ? styles.inputErrorBorder : null,
                ]}
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color="#8F9BB3"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.textInput}
                  placeholder="Masukkan kata sandi"
                  placeholderTextColor="#A9B5C9"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (passwordError)
                      setPasswordError(
                        text.length < 6 ? "Password minimal 6 karakter" : "",
                      );
                  }}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                >
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color="#8F9BB3"
                  />
                </TouchableOpacity>
              </View>
              {passwordError ? (
                <Text style={styles.errorText}>{passwordError}</Text>
              ) : null}
            </View>

            {/* Remember Me & Forgot Password Row */}
            <View style={styles.rowContainer}>
              <View style={styles.rememberMeContainer}>
                <Switch
                  value={rememberMe}
                  onValueChange={setRememberMe}
                  trackColor={{ false: "#D1D5DB", true: "#93ACFF" }}
                  thumbColor={rememberMe ? "#2E5BFF" : "#F4F3F4"}
                  style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                />
                <Text style={styles.rememberMeText}>Ingat Saya</Text>
              </View>
              <TouchableOpacity onPress={() => router.push("/forgot-password")}>
                <Text style={styles.forgotPasswordText}>Lupa Password?</Text>
              </TouchableOpacity>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={styles.loginButton}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.loginButtonText}>Masuk Sekarang</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Footer Notes */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Butuh bantuan login? Hubungi HRD
            </Text>
            <Text style={styles.versionText}>unotek-pmdev v1.0.0</Text>
          </View>
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
  headerSection: {
    alignItems: "center",
    marginBottom: 32,
  },
  logoBadge: {
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
    fontSize: 26,
    fontWeight: "800",
    color: "#1F2937",
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 4,
    textAlign: "center",
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
  formTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 20,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFEBEE",
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  errorBannerText: {
    color: "#FF3B30",
    fontSize: 13,
    fontWeight: "500",
    marginLeft: 8,
    flex: 1,
  },
  inputContainer: {
    marginBottom: 20,
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
  eyeIcon: {
    padding: 4,
  },
  errorText: {
    color: "#FF3B30",
    fontSize: 12,
    marginTop: 6,
    fontWeight: "500",
  },
  rowContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  rememberMeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  rememberMeText: {
    fontSize: 13,
    color: "#4B5563",
    marginLeft: 4,
    fontWeight: "500",
  },
  forgotPasswordText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#2E5BFF",
  },
  loginButton: {
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
  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  footer: {
    alignItems: "center",
    marginTop: 32,
  },
  footerText: {
    fontSize: 13,
    color: "#9CA3AF",
  },
  versionText: {
    fontSize: 11,
    color: "#D1D5DB",
    marginTop: 8,
  },
});
