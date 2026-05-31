import React, { useEffect, useState } from "react";
import { View, StyleSheet, ActivityIndicator, Text, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import PremiumBackground from "../../components/PremiumBackground";
import { useRouter } from "expo-router";
import { useTheme, useAuth, API_URL } from "../../context/GlobalContext";
import { Ionicons } from "@expo/vector-icons";
import SoundButton from "../../components/SoundButton";
import MenuDropdown from "../../components/MenuDropdown";

export default function ViewCardScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { user, profile, setProfile } = useAuth();
  const [htmlUri, setHtmlUri] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    const targetId = profile?.user_id || user?.id;
    if (!targetId) return;
    try {
      const res = await fetch(`${API_URL}/students/profile/${targetId}`);
      const data = await res.json();
      if (data && data.registration_number) {
        setProfile(data);
      }
    } catch (e) {}
  };

  useEffect(() => {
    async function init() {
      await fetchProfile();
      const targetId = profile?.user_id || user?.id;
      setHtmlUri(`${API_URL}/render/part_b/${targetId}?t=${Date.now()}`);
    }
    init();
  }, [API_URL, user?.id]);

  return (
    <View style={styles.container}>
      <PremiumBackground />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.05)' }]} />

      <SafeAreaView style={{ flex: 1 }}>
        <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} />
        
        <View style={styles.header}>
          <MenuDropdown />
          
          <Text style={[styles.headerTitle, { color: theme.text }]}>REALTIME_PREVIEW</Text>

          <SoundButton onPress={() => router.push("/part_b/transition")} style={styles.nextBtn}>
            <Ionicons name="chevron-forward" size={20} color={theme.text} />
          </SoundButton>
        </View>

        <View style={styles.webviewContainer}>
          {htmlUri ? (
            <WebView
              source={{ uri: htmlUri }}
              style={{ backgroundColor: 'transparent' }}
              originWhitelist={["*"]}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              onLoadEnd={() => setLoading(false)}
            />
          ) : (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.accent} />
            </View>
          )}

          {loading && (
            <View style={[StyleSheet.absoluteFill, styles.loadingOverlay]}>
              <ActivityIndicator size="large" color={theme.accent} />
            </View>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  headerTitle: {
    fontSize: 12,
    fontFamily: "Jost_600SemiBold",
    letterSpacing: 4,
    opacity: 0.6,
  },
  nextBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  webviewContainer: {
    flex: 1,
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingOverlay: {
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
});
