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
import { useTheme } from "../context/GlobalContext";

export default function TeacherProfile() {
  const router = useRouter();
  const { theme } = useTheme();

  // Profile Detail States
  const [name, setName] = useState("");
  const [udiseCode, setUdiseCode] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [teacherCode, setTeacherCode] = useState("");

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
        placeholderTextColor={theme.secondaryText}
        keyboardType={keyboardType}
      />
    </View>
  );

  return (
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
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.avatarSection}>
            <View style={styles.avatarLarge}>
              <Text style={styles.avatarInitial}>{name ? name[0].toUpperCase() : "T"}</Text>
            </View>
            <Text style={styles.avatarSubtitle}>Tap to change photo</Text>
          </View>

          <View style={styles.form}>
            {renderField("Full Name", name, "Enter your full name", setName)}
            {renderField("UDISE Code", udiseCode, "11-digit school code", setUdiseCode, "numeric")}
            {renderField("Place of Employment", schoolName, "School name", setSchoolName)}
            {renderField("Teacher Code", teacherCode, "3-digit code", setTeacherCode, "numeric")}
          </View>

          <SoundButton style={styles.saveButton} onPress={handleSave} activeOpacity={0.8}>
            <Text style={styles.saveButtonText}>Save Profile</Text>
          </SoundButton>
        </ScrollView>
      </KeyboardAvoidingView>
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
    padding: 24,
  },
  avatarSection: {
    alignItems: "center",
    marginBottom: 32,
  },
  avatarLarge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.surface,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: theme.border,
    marginBottom: 12,
  },
  avatarInitial: {
    color: theme.text,
    fontSize: 40,
    fontWeight: "800",
  },
  avatarSubtitle: {
    color: theme.secondaryText,
    fontSize: 13,
    fontWeight: "600",
  },
  form: {
    marginBottom: 40,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  label: {
    color: theme.secondaryText,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  input: {
    backgroundColor: theme.card,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    color: theme.text,
    fontSize: 16,
    borderWidth: 1,
    borderColor: theme.border,
  },
  saveButton: {
    backgroundColor: theme.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  saveButtonText: {
    color: theme.buttonText,
    fontSize: 16,
    fontWeight: "800",
  },
});
