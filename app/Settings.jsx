import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import SoundButton from "../components/SoundButton";
import { useTheme, useAuth } from "../context/GlobalContext";
import { themes as availableThemes } from "../colour_themes";

export default function Settings() {
  const router = useRouter();
  const { theme, setThemeName } = useTheme();
  const { user, profile, soundEnabled, setSoundEnabled } = useAuth();
  const [showThemePicker, setShowThemePicker] = useState(false);

  const styles = getStyles(theme);

  const settingsItems = [
    { id: "security", label: "Account Security", icon: "🛡️" },
    { id: "sound", label: "Sound Effects", icon: soundEnabled ? "🔊" : "🔇", detail: soundEnabled ? "On" : "Off" },
    { id: "notifications", label: "Push Notifications", icon: "🔔" },
    { id: "theme", label: "App Theme", icon: "🌙", detail: theme.name },
    { id: "help", label: "Help & Support", icon: "💬" },
    { id: "about", label: "About Application", icon: "ℹ️" },
  ];

  const handlePress = (id) => {
    if (id === "theme") setShowThemePicker(!showThemePicker);
    if (id === "sound") setSoundEnabled(!soundEnabled);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} />
      <View style={styles.header}>
        <SoundButton onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </SoundButton>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {settingsItems.map((item, i) => (
          <View key={i}>
            <SoundButton 
              style={styles.settingRow} 
              activeOpacity={0.7}
              onPress={() => handlePress(item.id)}
            >
              <View style={styles.rowLeft}>
                <Text style={styles.settingIcon}>{item.icon}</Text>
                <Text style={styles.settingLabel}>{item.label}</Text>
              </View>
              <View style={styles.rowRight}>
                {item.detail && <Text style={styles.detailText}>{item.detail}</Text>}
                <Text style={[styles.chevron, item.id === "theme" && showThemePicker && styles.chevronActive]}>›</Text>
              </View>
            </SoundButton>

            {/* Theme Picker Sub-menu */}
            {item.id === "theme" && showThemePicker && (
              <View style={styles.pickerContainer}>
                {Object.keys(availableThemes).map((key) => (
                  <SoundButton 
                    key={key} 
                    style={[
                      styles.pickerButton,
                      theme.name === availableThemes[key].name && styles.pickerButtonActive
                    ]}
                    onPress={() => setThemeName(key)}
                  >
                    <View style={[styles.colorSquare, { backgroundColor: availableThemes[key].background, borderColor: availableThemes[key].border }]} />
                    <Text style={[
                      styles.pickerButtonText,
                      theme.name === availableThemes[key].name && styles.pickerButtonTextActive
                    ]}>
                      {availableThemes[key].name}
                    </Text>
                  </SoundButton>
                ))}
              </View>
            )}
          </View>
        ))}

        <SoundButton 
          style={styles.logoutButton}
          onPress={() => router.push("/")}
        >
          <Text style={styles.logoutText}>Log Out from All Devices</Text>
        </SoundButton>
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  backButton: {
    padding: 8,
  },
  backText: {
    color: theme.text,
    fontSize: 24,
    fontWeight: "bold",
  },
  headerTitle: {
    color: theme.text,
    fontSize: 18,
    fontWeight: "800",
  },
  scrollContent: {
    paddingTop: 16,
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: theme.secondaryText + "20", // Very faint border
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  settingIcon: {
    fontSize: 20,
    marginRight: 16,
  },
  settingLabel: {
    color: theme.text,
    fontSize: 16,
    fontWeight: "600",
  },
  rowRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  detailText: {
    color: theme.secondaryText,
    fontSize: 14,
    marginRight: 8,
    fontWeight: "600",
  },
  chevron: {
    color: theme.secondaryText,
    fontSize: 22,
    fontWeight: "300",
    transform: [{ rotate: "0deg" }],
  },
  chevronActive: {
    transform: [{ rotate: "90deg" }],
  },
  pickerContainer: {
    backgroundColor: theme.surface,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  pickerButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 4,
  },
  pickerButtonActive: {
    backgroundColor: theme.background,
    borderWidth: 1,
    borderColor: theme.border,
  },
  colorSquare: {
    width: 20,
    height: 20,
    borderRadius: 4,
    marginRight: 12,
    borderWidth: 1,
  },
  pickerButtonText: {
    color: theme.secondaryText,
    fontSize: 14,
    fontWeight: "600",
  },
  pickerButtonTextActive: {
    color: theme.text,
    fontWeight: "800",
  },
  logoutButton: {
    margin: 24,
    marginTop: 40,
    paddingVertical: 16,
    alignItems: "center",
  },
  logoutText: {
    color: theme.error,
    fontSize: 14,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
});
