import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function CustomTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bottomTabBar, { paddingBottom: insets.bottom > 0 ? insets.bottom : 4 }]}>
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

        if (route.name === "kehadiran") {
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
                  isFocused ? styles.raisedTabActiveContainer : styles.raisedTabInactiveContainer,
                ]}
              >
                <Ionicons
                  name={isFocused ? "calendar" : "calendar-outline"}
                  size={24}
                  color="#FFFFFF"
                />
              </View>
              <Text style={[styles.raisedTabLabel, isFocused && styles.activeTabLabel]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        }

        let iconName = "home-outline";
        if (route.name === "home") iconName = isFocused ? "home" : "home-outline";
        else if (route.name === "timeline") iconName = isFocused ? "time" : "time-outline";
        else if (route.name === "perusahaan") iconName = isFocused ? "briefcase" : "briefcase-outline";
        else if (route.name === "profile") iconName = isFocused ? "person" : "person-outline";

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
              color={isFocused ? "#2E5BFF" : "#8F9BB3"}
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
      <Tabs.Screen name="timeline" options={{ title: "Timeline" }} />
      <Tabs.Screen name="kehadiran" options={{ title: "Kehadiran" }} />
      <Tabs.Screen name="perusahaan" options={{ title: "Perusahaan" }} />
      <Tabs.Screen name="profile" options={{ title: "Profil" }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bottomTabBar: {
    flexDirection: "row",
    backgroundColor: "#ffffffff",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    justifyContent: "space-around",
    alignItems: "center",
    paddingTop: 4
  },
  tabButton: {
    alignItems: "center",
    justifyContent: "center",
    width: 60,
  },
  raisedTabButton: {
    alignItems: "center",
    justifyContent: "center",
    width: 76,
    top: -15,
  },
  raisedTabIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
    marginBottom: 4,
  },
  raisedTabActiveContainer: {
    backgroundColor: "#2E5BFF",
    shadowColor: "#2E5BFF",
  },
  raisedTabInactiveContainer: {
    backgroundColor: "#8F9BB3",
    shadowColor: "#8F9BB3",
  },
  tabLabel: {
    fontSize: 10,
    color: "#8F9BB3",
    marginTop: 4,
    fontWeight: "500",
  },
  raisedTabLabel: {
    fontSize: 11,
    color: "#8F9BB3",
    fontWeight: "500",
  },
  activeTabLabel: {
    color: "#2E5BFF",
    fontWeight: "700",
  },
});
