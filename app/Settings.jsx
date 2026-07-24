import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  Linking,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import SoundButton from "../components/SoundButton";
import PremiumBackground from "../components/PremiumBackground";
import { useTheme, useAuth } from "../context/GlobalContext";
import { themes as availableThemes, gems } from "../colour_themes";
import GemCutCard from "../components/GemCutCard";

export default function Settings() {
  const router = useRouter();
  const { theme, setThemeName } = useTheme();
  const { soundEnabled, setSoundEnabled, user } = useAuth();
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [showSecurity, setShowSecurity] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [passwordRevealed, setPasswordRevealed] = useState(false);

  const accentColor = gems.sapphire;
  const styles = getStyles(theme, accentColor);

  const settingsItems = [
    { id: "security", label: "Account Security", icon: "🛡️" },
    { id: "sound", label: "Sound Effects", icon: soundEnabled ? "🔊" : "🔇", detail: soundEnabled ? "On" : "Off" },
    { id: "notifications", label: "Push Notifications", icon: "🔔" },
    { id: "theme", label: "App Theme", icon: "🌙", detail: theme.name },
    { id: "help", label: "Help & Support", icon: "💬" },
    { id: "about", label: "About Application", icon: "ℹ️" },
  ];

  const handlePress = (id) => {
    if (id === "security") setShowSecurity(!showSecurity);
    if (id === "theme") setShowThemePicker(!showThemePicker);
    if (id === "sound") setSoundEnabled(!soundEnabled);
    if (id === "help") setShowHelp(!showHelp);
    if (id === "about") router.push("/credits");
  };

  return (
    <View style={{ flex: 1 }}>
      <PremiumBackground />
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} />
        <View style={styles.header}>
          <SoundButton onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backText}>←</Text>
          </SoundButton>
          <Text style={styles.headerTitle}>SYSTEM SETTINGS</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <GemCutCard borderColor={gems.sapphire + '60'} contentStyle={{ padding: 0 }}>
            <View style={styles.sectionContainer}>
              {settingsItems.map((item, i) => {
                const isExpanded = (item.id === "security" && showSecurity) ||
                                   (item.id === "theme" && showThemePicker) ||
                                   (item.id === "help" && showHelp);
                return (
                  <View key={i}>
                    <SoundButton 
                      style={[styles.settingRow, { borderBottomColor: theme.border + '30' }]} 
                      activeOpacity={0.7}
                      onPress={() => handlePress(item.id)}
                    >
                      <View style={styles.rowLeft}>
                        <Text style={styles.settingIcon}>{item.icon}</Text>
                        <Text style={styles.settingLabel}>{item.label}</Text>
                      </View>
                      <View style={styles.rowRight}>
                        {item.detail && <Text style={styles.detailText}>{item.detail.toUpperCase()}</Text>}
                        <Text style={[styles.chevron, isExpanded && styles.chevronActive]}>›</Text>
                      </View>
                    </SoundButton>

                    {/* Account Security Sub-menu */}
                    {item.id === "security" && showSecurity && (
                      <View style={[styles.pickerContainer, { backgroundColor: theme.surface + '40', borderColor: theme.border + '50' }]}>
                        <View style={styles.infoRow}>
                          <Text style={styles.infoLabel}>USERNAME:</Text>
                          <Text style={[styles.infoValue, { color: accentColor }]}>{user?.username || 'Guest User'}</Text>
                        </View>
                        <View style={[styles.infoRow, { marginTop: 10 }]}>
                          <Text style={styles.infoLabel}>PASSWORD:</Text>
                          <Text style={[styles.infoValue, { color: accentColor }]}>
                            {passwordRevealed ? (user?.plain_password || user?.password || 'pass123') : '••••••••'}
                          </Text>
                          <TouchableOpacity 
                            style={styles.revealBtn}
                            onPress={() => setPasswordRevealed(!passwordRevealed)}
                          >
                            <Ionicons name={passwordRevealed ? "eye-off-outline" : "eye-outline"} size={13} color="#FFF" />
                            <Text style={styles.revealBtnText}>{passwordRevealed ? "HIDE" : "REVEAL"}</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}

                    {/* Theme Picker Sub-menu */}
                    {item.id === "theme" && showThemePicker && (
                      <View style={[styles.pickerContainer, { backgroundColor: theme.surface + '40', borderColor: theme.border + '50' }]}>
                        {Object.keys(availableThemes).map((key) => (
                          <SoundButton 
                            key={key} 
                            style={[
                              styles.pickerButton,
                              theme.name === availableThemes[key].name && { backgroundColor: theme.surface + '80' }
                            ]}
                            onPress={() => setThemeName(key)}
                          >
                            <View style={[styles.colorSquare, { backgroundColor: availableThemes[key].background, borderColor: availableThemes[key].border }]} />
                            <Text style={[
                              styles.pickerButtonText,
                              theme.name === availableThemes[key].name && { color: accentColor, fontFamily: "Outfit_600SemiBold" }
                            ]}>
                              {availableThemes[key].name.toUpperCase()}
                            </Text>
                          </SoundButton>
                        ))}
                      </View>
                    )}

                    {/* Help & Support Sub-menu */}
                    {item.id === "help" && showHelp && (
                      <View style={[styles.pickerContainer, { backgroundColor: theme.surface + '40', borderColor: theme.border + '50' }]}>
                        <Text style={[styles.helpText, { color: theme.text }]}>
                          WhatsApp message this number:
                        </Text>
                        <TouchableOpacity
                          style={styles.whatsappBtn}
                          onPress={() => Linking.openURL('https://wa.me/919731412325')}
                        >
                          <Ionicons name="logo-whatsapp" size={16} color="#25D366" />
                          <Text style={styles.whatsappBtnText}>+91 9731412325</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </GemCutCard>

          <SoundButton 
            style={styles.logoutButton}
            onPress={() => router.push("/")}
          >
            <Text style={styles.logoutText}>TERMINATE_SESSION</Text>
          </SoundButton>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const getStyles = (theme, accentColor) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.surface + '80',
  },
  backText: {
    color: theme.text,
    fontSize: 20,
    fontFamily: "Outfit_600SemiBold",
  },
  headerTitle: {
    color: theme.text,
    fontSize: 14,
    fontFamily: "Outfit_600SemiBold",
    letterSpacing: 3,
  },
  scrollContent: {
    padding: 30,
    paddingTop: 10,
  },
  sectionContainer: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  settingIcon: {
    fontSize: 18,
    marginRight: 16,
  },
  settingLabel: {
    color: theme.text,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    letterSpacing: 1,
  },
  rowRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  detailText: {
    color: theme.secondaryText,
    fontSize: 10,
    marginRight: 8,
    fontFamily: "Outfit_600SemiBold",
    letterSpacing: 1,
    opacity: 0.6,
  },
  chevron: {
    color: theme.secondaryText,
    fontSize: 20,
    fontFamily: "Inter_400Regular",
    transform: [{ rotate: "0deg" }],
    opacity: 0.5,
  },
  chevronActive: {
    transform: [{ rotate: "90deg" }],
  },
  pickerContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  pickerButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  colorSquare: {
    width: 16,
    height: 16,
    borderRadius: 4,
    marginRight: 12,
    borderWidth: 1,
  },
  pickerButtonText: {
    color: theme.secondaryText,
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    letterSpacing: 1,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  infoLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: theme.secondaryText,
    fontFamily: "Outfit_600SemiBold",
    letterSpacing: 1,
  },
  infoValue: {
    fontSize: 12,
    fontWeight: "600",
    fontFamily: "Outfit_600SemiBold",
    letterSpacing: 1,
  },
  revealBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: accentColor,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 8,
  },
  revealBtnText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#FFF",
    fontFamily: "Outfit_600SemiBold",
    letterSpacing: 1,
  },
  helpText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginBottom: 8,
  },
  whatsappBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(37, 211, 102, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(37, 211, 102, 0.3)",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignSelf: "flex-start",
  },
  whatsappBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#25D366",
    fontFamily: "Outfit_600SemiBold",
    letterSpacing: 1,
  },
  logoutButton: {
    marginTop: 40,
    paddingVertical: 18,
    alignItems: "center",
    borderRadius: 30,
    backgroundColor: theme.error + '10',
    borderWidth: 1,
    borderColor: theme.error + '30',
  },
  logoutText: {
    color: theme.error,
    fontSize: 11,
    fontFamily: "Outfit_600SemiBold",
    letterSpacing: 3,
  },
});
