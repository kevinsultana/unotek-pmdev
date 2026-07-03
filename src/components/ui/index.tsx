import { colors, hpx, radius, rf, shadows, spacing, typography, wpx } from "../../constants/theme";

// ── Shared StyleSheet (single source of truth) ─────────────────────────────
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from "react-native";
import React from "react";

// ── Card ───────────────────────────────────────────────────────────────────
type CardProps = {
  children: React.ReactNode;
  style?: ViewStyle;
  padded?: boolean;
};
export function Card({ children, style, padded = true }: CardProps) {
  return (
    <View style={[styles.card, padded && styles.cardPadding, style]}>
      {children}
    </View>
  );
}

// ── Button ─────────────────────────────────────────────────────────────────
type ButtonProps = {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "md" | "sm";
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
};
export function Button({
  title,
  onPress,
  variant = "primary",
  size = "md",
  disabled,
  loading,
  style,
}: ButtonProps) {
  const isMd = size === "md";
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[
        styles.base,
        isMd ? styles.mdSize : styles.smSize,
        variant === "primary" && styles.primary,
        variant === "secondary" && styles.secondary,
        variant === "danger" && styles.danger,
        variant === "ghost" && styles.ghost,
        disabled && styles.disabled,
        style,
      ]}
    >
      <Text
        style={[
          styles.btnText,
          isMd ? styles.btnTextMd : styles.btnTextSm,
          variant === "secondary" && styles.btnSecondaryText,
          variant === "ghost" && styles.btnGhostText,
          variant === "danger" && styles.btnDangerText,
          disabled && styles.disabledText,
        ]}
      >
        {loading ? "Memuat…" : title}
      </Text>
    </TouchableOpacity>
  );
}

// ── Badge ──────────────────────────────────────────────────────────────────
type BadgeVariant = keyof typeof colors.status;
type BadgeProps = {
  label: string;
  variant?: BadgeVariant;
};
export function Badge({ label, variant = "default" }: BadgeProps) {
  const palette = colors.status[variant] ?? colors.status.default;
  return (
    <View style={[styles.badge, { backgroundColor: palette.bg }]}>
      <Text style={[styles.badgeText, { color: palette.text }]}>{label}</Text>
    </View>
  );
}

// ── Input ──────────────────────────────────────────────────────────────────
import {
  TextInput,
  TextInputProps,
} from "react-native";

type InputProps = TextInputProps & {
  error?: string;
};
export function Input({ error, style, ...rest }: InputProps) {
  return (
    <View>
      <TextInput
        placeholderTextColor={colors.textMuted}
        style={[
          styles.input,
          error && styles.inputError,
          style,
        ]}
        {...rest}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

// ── Section Header ─────────────────────────────────────────────────────────
type SectionHeaderProps = {
  title: string;
  action?: { label: string; onPress: () => void };
};
export function SectionHeader({ title, action }: SectionHeaderProps) {
  return (
    <View style={styles.sectionRow}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action && (
        <TouchableOpacity onPress={action.onPress}>
          <Text style={styles.sectionAction}>{action.label}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ── Avatar ─────────────────────────────────────────────────────────────────
type AvatarProps = {
  initials: string;
  size?: number;
};
export function Avatar({ initials, size = 48 }: AvatarProps) {
  return (
    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
      ]}
    >
      <Text style={[styles.avatarText, { fontSize: size * 0.38 }]}>
        {initials}
      </Text>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // Card
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    ...shadows.card,
  },
  cardPadding: {
    padding: spacing.xl,
  },

  // Button
  base: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
  },
  mdSize: { height: hpx(52), paddingHorizontal: spacing["2xl"] },
  smSize: { height: hpx(40), paddingHorizontal: spacing.lg },
  primary: { backgroundColor: colors.primary },
  secondary: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  danger: { backgroundColor: colors.error },
  ghost: { backgroundColor: "transparent" },
  disabled: { opacity: 0.5 },
  btnText: { fontWeight: typography.weight.semibold },
  btnTextMd: { fontSize: typography.size.md, color: "#FFFFFF" },
  btnTextSm: { fontSize: typography.size.base, color: "#FFFFFF" },
  btnSecondaryText: { color: colors.primary },
  btnGhostText: { color: colors.primary },
  btnDangerText: { color: "#FFFFFF" },
  disabledText: { opacity: 0.6 },

  // Badge
  badge: {
    height: hpx(26),
    paddingHorizontal: spacing.sm + 2,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
  },

  // Input
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    height: hpx(50),
    fontSize: typography.size.md,
    color: colors.textPrimary,
  },
  inputError: {
    borderColor: colors.error,
    backgroundColor: "#FEF2F2",
  },
  errorText: {
    fontSize: typography.size.sm,
    color: colors.error,
    marginTop: spacing.xs,
  },

  // Section Header
  sectionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  sectionAction: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.primary,
  },

  // Avatar
  avatar: {
    backgroundColor: colors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: colors.primary,
    fontWeight: typography.weight.extrabold,
  },
});
