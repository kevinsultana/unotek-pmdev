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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../hooks/useAuth";
import { colors, hpx, radius, rf, shadows, sizes, spacing, textPresets, wpx } from "../src/constants/theme";

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [generalError, setGeneralError] = useState("");
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.replace("/(tabs)/home");
    }
  }, [authLoading, isAuthenticated]);

  const validateEmail = (text: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!text) return "Email tidak boleh kosong";
    if (!emailRegex.test(text)) return "Format email tidak valid";
    return "";
  };

  const handleLogin = async () => {
    setEmailError("");
    setPasswordError("");
    setGeneralError("");
    const emailErr = validateEmail(email);
    if (emailErr) { setEmailError(emailErr); return; }
    setIsLoading(true);
    try {
      await login(email, password, rememberMe);
      router.replace("/(tabs)/home");
    } catch (error: any) {
      setGeneralError(
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Email atau password salah.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <View style={[styles.container, styles.center, { paddingTop: insets.top }]}>
        <View style={styles.appIcon}>
          <Ionicons name="finger-print" size={36} color={colors.primary} />
        </View>
        <Text style={styles.appName}>UNOTEK PMDEV</Text>
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: spacing["2xl"] }} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Branding */}
          <View style={styles.brand}>
            <View style={styles.appIcon}>
              <Ionicons name="finger-print" size={36} color={colors.primary} />
            </View>
            <Text style={styles.appName}>UNOTEK PMDEV</Text>
            <Text style={styles.appSub}>Sistem Presensi & Kelola Karyawan</Text>
          </View>

          {/* Form Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Masuk ke Akun Anda</Text>

            {generalError ? (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={18} color={colors.error} />
                <Text style={styles.errorBannerText}>{generalError}</Text>
              </View>
            ) : null}

            {/* Email */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Alamat Email</Text>
              <View style={[styles.inputBox, emailError ? styles.inputError : isEmailFocused ? styles.inputFocused : null]}>
                <Ionicons name="mail-outline" size={18} color={isEmailFocused ? colors.primary : colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="nama@unotek.com"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onFocus={() => setIsEmailFocused(true)}
                  onBlur={() => setIsEmailFocused(false)}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (emailError) setEmailError(validateEmail(text));
                  }}
                />
              </View>
              {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
            </View>

            {/* Password */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Kata Sandi</Text>
              <View style={[styles.inputBox, passwordError ? styles.inputError : isPasswordFocused ? styles.inputFocused : null]}>
                <Ionicons name="lock-closed-outline" size={18} color={isPasswordFocused ? colors.primary : colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Masukkan kata sandi"
                  placeholderTextColor={colors.textMuted}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  value={password}
                  onFocus={() => setIsPasswordFocused(true)}
                  onBlur={() => setIsPasswordFocused(false)}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (passwordError) setPasswordError(text.length < 6 ? "Password minimal 6 karakter" : "");
                  }}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={18} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Remember & Forgot */}
            <View style={styles.row}>
              <View style={styles.rememberRow}>
                <Switch
                  value={rememberMe}
                  onValueChange={setRememberMe}
                  trackColor={{ false: colors.border, true: colors.primaryLight }}
                  thumbColor={rememberMe ? colors.primary : "#F4F3F4"}
                  style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                />
                <Text style={styles.rememberText}>Ingat Saya</Text>
              </View>
              <TouchableOpacity onPress={() => router.push("/forgot-password")}>
                <Text style={styles.forgotText}>Lupa Password?</Text>
              </TouchableOpacity>
            </View>

            {/* Submit */}
            <TouchableOpacity style={styles.loginBtn} onPress={handleLogin} disabled={isLoading} activeOpacity={0.85}>
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.loginBtnText}>Masuk Sekarang</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Butuh bantuan login? Hubungi HRD</Text>
            <Text style={styles.versionText}>unotek-pmdev v1.1.0</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  center: { justifyContent: "center", alignItems: "center" },
  scroll: { flexGrow: 1, justifyContent: "center", paddingHorizontal: spacing["2xl"], paddingVertical: spacing["4xl"] },

  // Brand
  brand: { alignItems: "center", marginBottom: spacing["3xl"] },
  appIcon: {
    width: wpx(72),
    height: hpx(72),
    borderRadius: radius.xl,
    backgroundColor: colors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    ...shadows.elevated,
    shadowColor: colors.primary,
    marginBottom: spacing.lg,
  },
  appName: { ...textPresets.display, marginBottom: spacing.xs },
  appSub: { ...textPresets.body, textAlign: "center" },

  // Card
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing["2xl"],
    ...shadows.card,
  },
  cardTitle: { ...textPresets.screenTitle, marginBottom: spacing.xl },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  errorBannerText: { color: colors.error, fontSize: rf(13), flex: 1 },

  // Field
  field: { marginBottom: spacing.xl },
  fieldLabel: { ...textPresets.label, marginBottom: spacing.sm, color: colors.textSecondary },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    height: sizes.inputHeight,
  },
  inputFocused: { borderColor: colors.primary, backgroundColor: colors.card },
  inputError: { borderColor: colors.error, backgroundColor: "#FEF2F2" },
  inputIcon: { marginRight: spacing.md },
  input: { flex: 1, color: colors.textPrimary, fontSize: rf(15) },
  errorText: { color: colors.error, fontSize: rf(12), marginTop: spacing.xs },

  // Row
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing["2xl"] },
  rememberRow: { flexDirection: "row", alignItems: "center" },
  rememberText: { fontSize: rf(13), color: colors.textSecondary, marginLeft: spacing.xs },
  forgotText: { fontSize: rf(13), fontWeight: "600" as any, color: colors.primary },

  // Button
  loginBtn: {
    height: sizes.buttonMd,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    justifyContent: "center",
    alignItems: "center",
    ...shadows.elevated,
    shadowColor: colors.primary,
  },
  loginBtnText: { color: "#FFFFFF", fontSize: rf(16), fontWeight: "700" as any },

  // Footer
  footer: { alignItems: "center", marginTop: spacing["3xl"] },
  footerText: { ...textPresets.body, fontSize: rf(13) },
  versionText: { ...textPresets.label, marginTop: spacing.sm },
});
