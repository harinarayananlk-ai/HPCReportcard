import React, { useState } from "react";
import { View, Text, StyleSheet, StatusBar, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import SoundButton from "../../components/SoundButton";
import AmbientIcon from "../../components/AmbientIcon";
import { useTheme, useAuth, API_URL } from "../../context/GlobalContext";

import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { Asset } from 'expo-asset';
import { Platform } from 'react-native';

export default function TransitionScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedDesign, setSelectedDesign] = useState('original');

  const DESIGNS = [
    { id: 'cloned', name: 'Original Cloned (15 Page)', status: 'Ready', icon: 'copy' },
    { id: 'premium', name: 'Premium Design', status: 'Ready', icon: 'star' },
    { id: 'comprehensive', name: 'Full Mastery Report', status: 'Ready', icon: 'document-text' },
    { id: 'original', name: 'Legacy Original', status: 'Under Maintenance', icon: 'alert-circle' },
  ];

  const handleExportAndFinish = async () => {
    if (!user) return router.push("/StudentHomepage");
    if (selectedDesign === 'original') {
      return Alert.alert("Maintenance", "The legacy original design is currently under maintenance. Please use the 'Original Cloned' or 'Premium' options.");
    }

    try {
      setLoading(true);
      
      const exportData = {
        userId: user.id || profile?.user_id,
        profileData: profile,
        design: selectedDesign,
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
          Alert.alert("Success", "Original 15-page Progress Card generated and saved successfully!", [
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
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} />
      
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Finalize & Export</Text>
        <Text style={[styles.subtitle, { color: theme.secondaryText }]}>
          Choose your design and generate your progress card
        </Text>
      </View>

      <View style={styles.designChoice}>
        <Text style={[styles.label, { color: theme.secondaryText }]}>SELECT DESIGN</Text>
        <View style={styles.designRow}>
          {DESIGNS.map((design) => (
            <TouchableOpacity 
              key={design.id}
              disabled={design.status === 'Under Maintenance'}
              style={[
                styles.designBtn, 
                { borderColor: theme.border },
                selectedDesign === design.id && { borderColor: theme.primary, backgroundColor: theme.primary + '10' },
                design.status === 'Under Maintenance' && { opacity: 0.5, backgroundColor: theme.isDark ? '#222' : '#f5f5f5' }
              ]}
              onPress={() => setSelectedDesign(design.id)}
            >
              <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                <AmbientIcon 
                  name={selectedDesign === design.id ? "radio-button-on" : "radio-button-off"} 
                  size={20} 
                  color={selectedDesign === design.id ? theme.primary : theme.secondaryText} 
                  type={selectedDesign === design.id ? "circle" : "none"}
                />
                <View style={{ marginLeft: 15 }}>
                  <Text style={[
                    styles.designName, 
                    { color: theme.text },
                    selectedDesign === design.id && { color: theme.primary, fontWeight: '700' }
                  ]}>
                    {design.name}
                  </Text>
                  {design.status === 'Under Maintenance' && (
                    <Text style={{ fontSize: 10, color: '#ef4444', fontWeight: 'bold' }}>UNDER MAINTENANCE</Text>
                  )}
                </View>
              </View>
              <AmbientIcon name={design.icon} size={22} color={theme.secondaryText} type={selectedDesign === design.id ? "hop" : "none"} />
            </TouchableOpacity>
          ))}
        </View>
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
              <Text style={[styles.exportText, { color: theme.buttonText }]}>GENERATE CARD</Text>
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 30,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 8,
    lineHeight: 20,
  },
  designChoice: {
    paddingHorizontal: 30,
    marginTop: 20,
  },
  label: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 2,
    marginBottom: 20,
  },
  designRow: {
    gap: 12,
  },
  designBtn: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
  },
  designName: {
    marginLeft: 15,
    fontSize: 15,
    fontWeight: "500",
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
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  exportText: {
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 1,
  },
  backBtn: {
    marginTop: 20,
    padding: 10,
  }
});
