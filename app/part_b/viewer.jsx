import React, { useEffect, useState } from "react";
import { View, StyleSheet, ActivityIndicator, Text, StatusBar, Dimensions, TouchableOpacity, Alert, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import PremiumBackground from "../../components/PremiumBackground";
import { useRouter } from "expo-router";
import { useTheme, useAuth, API_URL } from "../../context/GlobalContext";
import { Ionicons } from "@expo/vector-icons";
import SoundButton from "../../components/SoundButton";
import MenuDropdown from "../../components/MenuDropdown";

import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';

export default function ViewCardScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { user, profile, setProfile } = useAuth();
  const [htmlUri, setHtmlUri] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

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
    }
    init();
  }, []);

  // Set HTML URI once we have the student ID (from profile or user)
  useEffect(() => {
    const targetId = profile?.user_id || user?.id;
    if (targetId) {
      setHtmlUri(`${API_URL}/render/part_b/${targetId}?t=${Date.now()}`);
    }
  }, [profile?.user_id, user?.id, API_URL]);

  const handleDownload = async () => {
    const targetId = profile?.user_id || user?.id;
    if (!targetId) {
      return Alert.alert("Error", "Student identifier not found.");
    }

    try {
      setDownloading(true);
      
      const exportData = {
        userId: targetId,
        profileData: profile,
        timestamp: new Date().toISOString()
      };

      // Request high-fidelity PDF from backend
      const response = await fetch(`${API_URL}/export/pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(exportData)
      });

      const result = await response.json();
      
      if (!response.ok || result.status === 'error') {
         setDownloading(false);
         return Alert.alert("Export Failed", result.message || "An error occurred during rendering.");
      }

      const pdfUrl = `${API_URL.replace('/api', '')}${result.url}`;
      
      // Download PDF into local app cache
      const localUri = FileSystem.cacheDirectory + result.fileName;
      const { uri } = await FileSystem.downloadAsync(pdfUrl, localUri);
      
      if (Platform.OS === 'android') {
        const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
        if (permissions.granted) {
          const base64Data = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
          const finalFileName = result.fileName.endsWith('.pdf') ? result.fileName : result.fileName + '.pdf';
          const newUri = await FileSystem.StorageAccessFramework.createFileAsync(
            permissions.directoryUri, 
            finalFileName, 
            'application/pdf'
          );
          await FileSystem.writeAsStringAsync(newUri, base64Data, { encoding: FileSystem.EncodingType.Base64 });
          Alert.alert("Success", "HPC Report Card downloaded successfully!");
        } else {
          await Sharing.shareAsync(uri);
        }
      } else {
        await Sharing.shareAsync(uri);
      }
      
      setDownloading(false);
    } catch (err) {
      setDownloading(false);
      Alert.alert("Download Error", err.message || "Failed to download PDF.");
    }
  };

  return (
    <View style={styles.container}>
      <PremiumBackground />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.05)' }]} />

      <SafeAreaView style={{ flex: 1 }}>
        <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} />
        
        <View style={styles.header}>
          <MenuDropdown />
          
          <Text style={[styles.headerTitle, { color: theme.text }]}>HPC CARD PREVIEW</Text>

          <SoundButton onPress={() => router.push("/part_b/transition")} style={styles.nextBtn}>
            <Ionicons name="chevron-forward" size={20} color={theme.text} />
          </SoundButton>
        </View>

        <View style={styles.webviewContainer}>
          {htmlUri ? (
            <WebView
              source={{ uri: htmlUri }}
              style={{ flex: 1, backgroundColor: 'transparent' }}
              originWhitelist={["*"]}
              javaScriptEnabled
              domStorageEnabled
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

        <View style={styles.footer}>
          <SoundButton 
            style={[styles.downloadBtn, { backgroundColor: theme.primary }]}
            onPress={handleDownload}
            disabled={downloading}
          >
            {downloading ? (
              <ActivityIndicator color={theme.buttonText} />
            ) : (
              <>
                <Ionicons name="cloud-download-outline" size={20} color={theme.buttonText} />
                <Text style={[styles.downloadText, { color: theme.buttonText }]}>DOWNLOAD PDF</Text>
              </>
            )}
          </SoundButton>
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
    marginBottom: 10,
    borderRadius: 12,
    overflow: 'hidden',
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
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 20,
    paddingTop: 10,
    alignItems: "center",
  },
  downloadBtn: {
    flexDirection: "row",
    height: 54,
    width: "100%",
    borderRadius: 27,
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  downloadText: {
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 2,
    fontFamily: "Jost_600SemiBold",
  },
});
