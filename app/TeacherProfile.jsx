import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import SoundButton from "../components/SoundButton";
import PremiumBackground from "../components/PremiumBackground";
import { useTheme, useAuth } from "../context/GlobalContext";
import { gems } from "../colour_themes";

export default function TeacherProfile() {
  const router = useRouter();
  const { theme } = useTheme();
  const { user, schoolInfo, teacherInfo } = useAuth();

  // Profile Detail States — pre-filled from context
  const [name, setName] = useState(teacherInfo?.full_name || user?.full_name || "");
  const [udiseCode, setUdiseCode] = useState(schoolInfo?.udise_code || "");
  const [schoolName, setSchoolName] = useState(schoolInfo?.name || "");
  const [teacherCode, setTeacherCode] = useState(teacherInfo?.teacher_code || "");

  const styles = getStyles(theme);

  const handleSave = () => {
    // For now, simple return. In future, write to server.
    router.back();
  };

  const renderField = (label, value, placeholder, onChange, keyboardType = "default") => (
    <View style={styles.fieldContainer}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={theme.secondaryText + "80"}
        keyboardType={keyboardType}
      />
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      <PremiumBackground gemColor={gems.jade} />
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} />
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <View style={styles.header}>
            <SoundButton onPress={() => router.back()} style={styles.backButton}>
              <Text style={styles.backText}>←</Text>
            </SoundButton>
            <Text style={styles.headerTitle}>TEACHER IDENTITY</Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.avatarSection}>
              <View style={[styles.avatarLarge, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Text style={styles.avatarInitial}>{name ? name[0].toUpperCase() : "T"}</Text>
              </View>
              <Text style={styles.avatarSubtitle}>RECONFIGURE VISUAL UPLINK</Text>
            </View>

            <View style={styles.form}>
              {renderField("Full Name", name, "NAME_STRING", setName)}
              {renderField("UDISE Code", udiseCode, "11_DIGIT_ID", setUdiseCode, "numeric")}
              {renderField("Place of Employment", schoolName, "LOC_NODE", setSchoolName)}
              {renderField("Teacher Code", teacherCode, "ACCESS_KEY", setTeacherCode, "numeric")}
            </View>

            <SoundButton style={styles.saveButton} onPress={handleSave} activeOpacity={0.8}>
              <Text style={styles.saveButtonText}>COMMIT CHANGES</Text>
            </SoundButton>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const getStyles = (theme) => StyleSheet.create({
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
    fontFamily: "Jost_600SemiBold",
  },
  headerTitle: {
    color: theme.text,
    fontSize: 14,
    fontFamily: "Jost_600SemiBold",
    letterSpacing: 3,
  },
  scrollContent: {
    padding: 30,
  },
  avatarSection: {
    alignItems: "center",
    marginBottom: 40,
  },
  avatarLarge: {
    width: 110,
    height: 110,
    borderRadius: 55,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 5,
    marginBottom: 16,
  },
  avatarInitial: {
    color: theme.text,
    fontSize: 44,
    fontFamily: "Jost_300Light",
  },
  avatarSubtitle: {
    color: theme.secondaryText,
    fontSize: 10,
    fontFamily: "Jost_600SemiBold",
    letterSpacing: 2,
    opacity: 0.7,
  },
  form: {
    marginBottom: 40,
    gap: 24,
  },
  fieldContainer: {
    marginBottom: 0,
  },
  label: {
    color: theme.secondaryText,
    fontSize: 10,
    fontFamily: "Jost_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 2,
    marginBottom: 10,
    opacity: 0.8,
  },
  input: {
    backgroundColor: theme.surface + '50',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    color: theme.text,
    fontSize: 15,
    fontFamily: "Jost_400Regular",
    borderWidth: 1,
    borderColor: theme.border + '50',
  },
  saveButton: {
    backgroundColor: theme.primary,
    borderRadius: 30,
    paddingVertical: 18,
    alignItems: "center",
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  saveButtonText: {
    color: theme.buttonText,
    fontSize: 14,
    fontFamily: "Jost_600SemiBold",
    letterSpacing: 3,
  },
});
