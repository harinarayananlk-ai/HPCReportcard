import React, { useEffect, useState } from "react";
import { View, StyleSheet, ActivityIndicator, TouchableOpacity, Text, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import { useVideoPlayer, VideoView } from "expo-video";
import { useRouter } from "expo-router";
import { useTheme, useAuth, API_URL } from "../../context/GlobalContext";
import { Ionicons } from "@expo/vector-icons";

export default function ViewCardScreen() {
  const router = useRouter();
  const { user, profile, setProfile } = useAuth();
  const [htmlUri, setHtmlUri] = useState(null);
  const [loading, setLoading] = useState(true);
  const player = useVideoPlayer(require("../../assets/images/Background_animation_forest.mp4"), (p) => {
    p.loop = true;
    p.play();
    p.muted = true;
  });

  const fetchProfile = async () => {
    const targetId = profile?.user_id || user?.id;
    if (!targetId) return;
    try {
      const res = await fetch(`${API_URL}/students/profile/${targetId}`);
      const data = await res.json();
      if (data && data.registration_number) {
        setProfile(data); // Refresh context with latest DB state
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
      {/* Premium Video Background */}
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        nativeControls={false}
      />
      {/* Dark tint overlay for readability */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.65)' }]} />

      <SafeAreaView style={{ flex: 1 }}>
        <StatusBar barStyle="light-content" />
        
        {/* Transparent Modern Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
            <Text style={[styles.backText, { color: "#fff" }]}> Back</Text>
          </TouchableOpacity>
          
          <Text style={[styles.headerTitle, { color: "#fff" }]}>Holistic Progress Card</Text>

          <TouchableOpacity onPress={() => router.push("/part_b/transition")} style={styles.nextBtn}>
            <Text style={{ color: "#fff", fontWeight: 'bold' }}>Next </Text>
            <Ionicons name="chevron-forward" size={18} color="#fff" />
          </TouchableOpacity>
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
              <ActivityIndicator size="large" color="#fff" />
            </View>
          )}

          {loading && (
            <View style={[StyleSheet.absoluteFill, styles.loadingOverlay]}>
              <ActivityIndicator size="large" color="#fff" />
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
    backgroundColor: '#000',
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 10,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
  },
  backText: {
    fontSize: 16,
    fontWeight: "700",
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  nextBtn: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
  },
  webviewContainer: {
    flex: 1,
  },
  webview: {
    flex: 1,
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
  },
});
