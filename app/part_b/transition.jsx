import React, { useState } from "react";
import { View, Text, StyleSheet, StatusBar, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import SoundButton from "../../components/SoundButton";
import { useTheme, useAuth, API_URL } from "../../context/GlobalContext";
import PremiumBackground from "../../components/PremiumBackground";
import GemCutCard from "../../components/GemCutCard";

import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

export default function TransitionScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleExportAndFinish = async () => {
    const targetId = user?.id || profile?.user_id;
    if (!targetId) {
      return Alert.alert("Error", "Student identifier not found.");
    }

    try {
      setLoading(true);
      
      const exportData = {
        userId: targetId,
        profileData: profile,
        timestamp: new Date().toISOString()
      };

      // Request a high-fidelity, dynamic render from the backend
      const response = await fetch(`${API_URL}/export/pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(exportData)
      });

      const result = await response.json();
      
      if (!response.ok || result.status === 'error') {
         setLoading(false);
         return Alert.alert("Export Failed", result.message || "An error occurred during rendering.");
      }

      const pdfUrl = `${API_URL.replace('/api', '')}${result.url}`;
      
      // Download the rendered PDF from the backend into local app cache
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
          Alert.alert("Success", "HPC Progress Card generated and saved successfully!", [
            { text: "Finish", onPress: () => router.push(user?.role === "teacher" || user?.role === "superadmin" ? "/TeacherTracking" : "/StudentHomepage") }
          ]);
        } else {
          await Sharing.shareAsync(uri);
        }
      } else {
        await Sharing.shareAsync(uri);
      }
      
      setLoading(false);
    } catch (err) {
      setLoading(false);
      Alert.alert("Export Error", err.message || "Failed to generate PDF.");
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <PremiumBackground />
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} />
        
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Finalize & Export</Text>
          <Text style={[styles.subtitle, { color: theme.secondaryText }]}>
            Generate and download your official Holistic Progress Card
          </Text>
        </View>

        <View style={styles.cardContainer}>
          <GemCutCard borderColor="rgba(184, 151, 46, 0.4)">
            <View style={styles.infoCard}>
              <View style={styles.iconCircle}>
                <Ionicons name="document-text-outline" size={32} color={theme.primary} />
              </View>
              <Text style={[styles.cardTitle, { color: theme.text }]}>Holistic Progress Card (HPC)</Text>
              <Text style={[styles.cardDesc, { color: theme.secondaryText }]}>
                This official A4 multiline document compiles administrative details, personal portraits, term-wise developmental rubrics, self/peer reflections, and teacher remarks.
              </Text>
              <View style={styles.badges}>
                <View style={[styles.badge, { backgroundColor: 'rgba(46, 88, 148, 0.08)' }]}>
                  <Text style={[styles.badgeText, { color: '#2E5894' }]}>High Fidelity</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: 'rgba(184, 151, 46, 0.08)' }]}>
                  <Text style={[styles.badgeText, { color: '#8C733E' }]}>Official A4</Text>
                </View>
              </View>
            </View>
          </GemCutCard>
        </View>

        <View style={styles.footer}>
          <SoundButton 
            style={[styles.exportBtn, { backgroundColor: theme.primary }]}
            onPress={handleExportAndFinish}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={theme.buttonText} />
            ) : (
              <>
                <Text style={[styles.exportText, { color: theme.buttonText }]}>GENERATE & DOWNLOAD</Text>
                <Ionicons name="arrow-forward" size={20} color={theme.buttonText} />
              </>
            )}
          </SoundButton>
          
          <TouchableOpacity 
            style={styles.backBtn}
            onPress={() => router.back()}
          >
            <Text style={{ color: theme.secondaryText }}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  header: {
    padding: 30,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: "300",
    letterSpacing: 2,
    fontFamily: "Inter_400Regular",
  },
  subtitle: {
    fontSize: 12,
    marginTop: 8,
    lineHeight: 20,
    fontFamily: "Inter_400Regular",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  cardContainer: {
    paddingHorizontal: 30,
    marginTop: 40,
  },
  infoCard: {
    padding: 24,
    alignItems: "center",
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(46, 88, 148, 0.05)',
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    fontFamily: "Outfit_600SemiBold",
    marginBottom: 12,
    textAlign: "center",
  },
  cardDesc: {
    fontSize: 13,
    lineHeight: 22,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    marginBottom: 20,
  },
  badges: {
    flexDirection: "row",
    gap: 10,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "600",
    fontFamily: "Outfit_600SemiBold",
  },
  footer: {
    position: "absolute",
    bottom: 50,
    left: 30,
    right: 30,
    alignItems: "center",
  },
  exportBtn: {
    flexDirection: "row",
    height: 60,
    width: "100%",
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  exportText: {
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 3,
    fontFamily: "Outfit_600SemiBold",
  },
  backBtn: {
    marginTop: 24,
    padding: 10,
  }
});
