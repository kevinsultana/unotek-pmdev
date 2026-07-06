import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  colors,
  radius,
  rf,
  shadows,
  sizes,
  spacing,
  typography,
  wpx,
} from "../../src/constants/theme";

function CustomTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.bottomTabBar,
        { paddingBottom: insets.bottom > 0 ? insets.bottom : spacing.xs },
      ]}
    >
      {state.routes.map((route: any, index: number) => {
        const { options } = descriptors[route.key];
        const label = options.title !== undefined ? options.title : route.name;
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        if (route.name === "event") {
          return (
            <TouchableOpacity
              key={route.key}
              style={styles.raisedTabButton}
              onPress={onPress}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.raisedTabIconContainer,
                  isFocused
                    ? styles.raisedTabActiveContainer
                    : styles.raisedTabInactiveContainer,
                ]}
              >
                <Ionicons
                  name={isFocused ? "calendar" : "calendar-outline"}
                  size={26}
                  color="#FFFFFF"
                />
              </View>
              <Text
                style={[
                  styles.raisedTabLabel,
                  isFocused && styles.activeTabLabel,
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        }

        let iconName = "home-outline";
        if (route.name === "home")
          iconName = isFocused ? "home" : "home-outline";
        else if (route.name === "timeline")
          iconName = isFocused ? "checkbox" : "checkbox-outline";
        else if (route.name === "pengajuan")
          iconName = isFocused ? "document-text" : "document-text-outline";
        else if (route.name === "profile")
          iconName = isFocused ? "person" : "person-outline";

        return (
          <TouchableOpacity
            key={route.key}
            style={styles.tabButton}
            onPress={onPress}
            activeOpacity={0.7}
          >
            <Ionicons
              name={iconName as any}
              size={22}
              color={isFocused ? colors.primary : colors.textMuted}
            />
            <Text style={[styles.tabLabel, isFocused && styles.activeTabLabel]}>
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="home" options={{ title: "Home" }} />
      <Tabs.Screen name="timeline" options={{ title: "Task" }} />
      <Tabs.Screen name="event" options={{ title: "Event" }} />
      <Tabs.Screen name="pengajuan" options={{ title: "Pengajuan" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bottomTabBar: {
    flexDirection: "row",
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    justifyContent: "space-around",
    alignItems: "center",
    paddingTop: spacing.xs,
  },
  tabButton: {
    alignItems: "center",
    justifyContent: "center",
    width: wpx(60),
    paddingTop: spacing.xs,
  },
  raisedTabButton: {
    alignItems: "center",
    justifyContent: "center",
    width: wpx(76),
    top: -spacing.md,
  },
  raisedTabIconContainer: {
    width: sizes.iconLg,
    height: sizes.iconLg,
    borderRadius: radius.full,
    justifyContent: "center",
    alignItems: "center",
    ...shadows.elevated,
    marginBottom: spacing.xs,
  },
  raisedTabActiveContainer: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
  },
  raisedTabInactiveContainer: {
    backgroundColor: colors.textMuted,
    shadowColor: colors.textMuted,
  },
  tabLabel: {
    fontSize: rf(10),
    color: colors.textMuted,
    marginTop: spacing.xs,
    fontWeight: typography.weight.medium,
  },
  raisedTabLabel: {
    fontSize: rf(11),
    color: colors.textMuted,
    fontWeight: typography.weight.medium,
  },
  activeTabLabel: {
    color: colors.primary,
    fontWeight: typography.weight.bold,
  },
});
