import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { colors, hpx, radius, rf, shadows, sizes, spacing, textPresets, wpx } from "../src/constants/theme";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isEmailFocused, setIsEmailFocused] = useState(false);

  const validateEmail = (text: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!text) return "Email tidak boleh kosong";
    if (!emailRegex.test(text)) return "Format email tidak valid";
    return "";
  };

  const handleResetPassword = () => {
    setEmailError("");
    const emailErr = validateEmail(email);
    if (emailErr) { setEmailError(emailErr); return; }
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setIsSubmitted(true);
    }, 1500);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Back */}
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>

          {/* Icon + Heading */}
          <View style={styles.brand}>
            <View style={styles.iconBox}>
              <Ionicons name="key-outline" size={36} color={colors.primary} />
            </View>
            <Text style={styles.title}>Lupa Kata Sandi?</Text>
            <Text style={styles.subtitle}>
              Masukkan email terdaftar untuk menerima tautan pemulihan.
            </Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            {!isSubmitted ? (
              <>
                <View style={styles.field}>
                  <Text style={styles.label}>Alamat Email Karyawan</Text>
                  <View style={[styles.inputBox, emailError ? styles.inputError : isEmailFocused ? styles.inputFocused : null]}>
                    <Ionicons name="mail-outline" size={18} color={isEmailFocused ? colors.primary : colors.textMuted} style={{ marginRight: spacing.md }} />
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

                <TouchableOpacity style={styles.submitBtn} onPress={handleResetPassword} disabled={isLoading} activeOpacity={0.85}>
                  {isLoading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.submitBtnText}>Kirim Link Reset</Text>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.success}>
                <View style={styles.successIconBox}>
                  <Ionicons name="checkmark" size={32} color={colors.success} />
                </View>
                <Text style={styles.successTitle}>Email Terkirim!</Text>
                <Text style={styles.successSub}>
                  Tautan pemulihan telah dikirim ke:
                </Text>
                <Text style={styles.successEmail}>{email}</Text>
                <Text style={styles.successHint}>
                  Periksa kotak masuk atau folder spam untuk instruksi selanjutnya.
                </Text>
                <TouchableOpacity style={styles.backLoginBtn} onPress={() => router.replace("/")}>
                  <Text style={styles.backLoginText}>Kembali ke Login</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {!isSubmitted && (
            <TouchableOpacity style={styles.backLink} onPress={() => router.back()}>
              <Text style={styles.backLinkText}>Batal dan Kembali</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  scroll: { flexGrow: 1, justifyContent: "center", paddingHorizontal: spacing["2xl"], paddingVertical: spacing["4xl"] },
  backBtn: {
    width: sizes.headerBtnWidth,
    height: sizes.headerBtn,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "flex-start",
    ...shadows.card,
    marginBottom: spacing["2xl"],
  },

  // Brand
  brand: { alignItems: "center", marginBottom: spacing["3xl"] },
  iconBox: {
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
  title: { ...textPresets.display, marginBottom: spacing.sm },
  subtitle: { ...textPresets.body, textAlign: "center", lineHeight: rf(20) },

  // Card
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing["2xl"],
    ...shadows.card,
  },
  field: { marginBottom: spacing["2xl"] },
  label: { ...textPresets.label, marginBottom: spacing.sm, color: colors.textSecondary },
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
  input: { flex: 1, color: colors.textPrimary, fontSize: rf(15) },
  errorText: { color: colors.error, fontSize: rf(12), marginTop: spacing.xs },
  submitBtn: {
    height: sizes.buttonMd,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    justifyContent: "center",
    alignItems: "center",
    ...shadows.elevated,
    shadowColor: colors.primary,
  },
  submitBtnText: { color: "#FFFFFF", fontSize: rf(16), fontWeight: "700" as any },

  // Success
  success: { alignItems: "center", paddingVertical: spacing.sm },
  successIconBox: {
    width: wpx(64),
    height: hpx(64),
    borderRadius: radius.full,
    backgroundColor: "#D1FAE5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  successTitle: { ...textPresets.screenTitle, color: colors.success, marginBottom: spacing.sm },
  successSub: { ...textPresets.body, textAlign: "center" },
  successEmail: { ...textPresets.cardTitle, textAlign: "center", marginTop: spacing.xs, marginBottom: spacing.sm },
  successHint: { ...textPresets.body, fontSize: rf(13), textAlign: "center", marginBottom: spacing["2xl"] },
  backLoginBtn: {
    width: "100%",
    height: sizes.buttonMd,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: radius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  backLoginText: { color: colors.primary, fontSize: rf(15), fontWeight: "700" as any },

  // Bottom link
  backLink: { alignItems: "center", marginTop: spacing["2xl"] },
  backLinkText: { fontSize: rf(14), fontWeight: "600" as any, color: colors.primary },
});
