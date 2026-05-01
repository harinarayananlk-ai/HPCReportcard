import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  Platform,
  StatusBar,
  Modal,
  KeyboardAvoidingView,
  Alert,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Picker } from "@react-native-picker/picker";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import DigitBoxes from "../../components/DigitBoxes";
import SoundButton from "../../components/SoundButton";
import ShootingStars from "../../components/ShootingStars";
import { useTheme, useAuth, API_URL } from "../../context/GlobalContext";

export default function SchoolScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { user, profile, setProfile: setAuthProfile, activeStudentId, activeStudentProfile } = useAuth();
  const isTeacher = user?.role === 'teacher' || user?.role === 'superadmin';
  const targetUserId = (isTeacher && activeStudentId) ? activeStudentId : user?.id;
  const styles = getStyles(theme);

  // Tooltip & DatePicker States
  const [infoTooltip, setInfoTooltip] = useState({ visible: false, title: "", content: "" });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dobDate, setDobDate] = useState(new Date());

  // School Info
  const [schoolName, setSchoolName] = useState("");
  const [schoolAddress, setSchoolAddress] = useState("");
  const [pinCode, setPinCode] = useState("");
  const [udiseCode, setUdiseCode] = useState("");
  const [teacherCode, setTeacherCode] = useState("");

  // Student Info
  const [studentName, setStudentName] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [studentClass, setStudentClass] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [studentAddress, setStudentAddress] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [rollNumber, setRollNumber] = useState("");

  // Preferences
  const [ruralUrban, setRuralUrban] = useState("");
  const [motherTongue, setMotherTongue] = useState("");
  const [mediumOfInstruction, setMediumOfInstruction] = useState("");


  // Autofill Logic
  // Auto-Sync Logic: Always fetch fresh profile on mount to prevent stale data issues
  useEffect(() => {
    if (targetUserId) {
      fetchProfile();
    }
  }, [targetUserId]);

  const fetchProfile = async () => {
    try {
      const res = await fetch(`${API_URL}/students/profile/${targetUserId}`);
      const data = await res.json();
      
      if (data && data.registration_number) {
        applyProfile(data);
      } else {
        // Row not found, silent return
      }
    } catch (err) {
      console.warn("Autofill fetch failed", err);
    }
  };

  const applyProfile = (data) => {
    if (!data) return;
    
    // Safety: ensure we are working with the raw row if it was wrapped or nested
    const profileData = data.registration_number ? data : (data.profile || {});

    setRegistrationNumber(profileData.registration_number || "");
    setStudentClass(profileData.class_name || "");
    setSchoolName(profileData.school || "");
    setDateOfBirth(profileData.dob || "");
    setStudentName(profileData.full_name || ""); 

    if (profileData.family_details) {
      try {
        const fd = typeof profileData.family_details === "string" 
           ? JSON.parse(profileData.family_details) 
           : profileData.family_details;
        
        setStudentName(fd.studentName || fd.full_name || profileData.full_name || "");
        setDateOfBirth(fd.dob || profileData.dob || "");
        setSchoolAddress(fd.schoolAddress || "");
        setPinCode(fd.pinCode || "");
        setUdiseCode(fd.udiseCode || "");
        setTeacherCode(fd.teacherCode || "");
        setStudentAddress(fd.studentAddress || "");
        setPhoneNumber(fd.phoneNumber || "");
        setRollNumber(fd.rollNumber || "");
        setRuralUrban(fd.ruralUrban || "");
        setMotherTongue(fd.motherTongue || "");
        setMediumOfInstruction(fd.mediumOfInstruction || "");
      } catch (e) {
        console.warn("JSON Parse Error in applyProfile", e);
      }
    }
  };

  // Auto-Save Logic: Silently persist data after 2 seconds of inactivity
  useEffect(() => {
    if (!registrationNumber || !studentName) return; // Don't auto-save empty partials
    
    const timer = setTimeout(() => {
      // Internal silent save
      const saveSilently = async () => {
        try {
          const payload = {
            userId: targetUserId,
            registrationNumber,
            fullName: studentName,
            className: studentClass,
            school: schoolName,
            dob: dateOfBirth,
            familyDetails: {
              ...profile?.family_details,
              studentName, schoolAddress, pinCode, udiseCode, teacherCode,
              studentAddress, phoneNumber, rollNumber, ruralUrban,
              motherTongue, mediumOfInstruction
            }
          };
          await fetch(`${API_URL}/students/profile`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          });
        } catch (e) {}
      };
      saveSilently();
    }, 2000);

    return () => clearTimeout(timer);
  }, [studentName, studentClass, schoolName, dateOfBirth, schoolAddress, pinCode, udiseCode, teacherCode, studentAddress, phoneNumber, rollNumber, ruralUrban, motherTongue, mediumOfInstruction]);

  const handleManualSave = async () => {
    if (!targetUserId) return;
    try {
      const payload = {
        userId: targetUserId,
        registrationNumber,
        fullName: studentName,
        className: studentClass,
        school: schoolName,
        dob: dateOfBirth,
        familyDetails: {
          ...profile?.family_details,
          studentName, schoolAddress, pinCode, udiseCode, teacherCode,
          studentAddress, phoneNumber, rollNumber, ruralUrban,
          motherTongue, mediumOfInstruction
        }
      };
      const res = await fetch(`${API_URL}/students/profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        Alert.alert("Saved", "Data persisted successfully!");
      }
    } catch (e) {
      Alert.alert("Error", "Could not save manual entry.");
    }
  };

  const handleNext = async () => {
    // Save to persistence layer
    if (targetUserId) {
      const payload = {
        userId: targetUserId,
        registrationNumber,
        className: studentClass,
        dob: dateOfBirth,
        school: schoolName,
        familyDetails: {
          ...profile?.family_details,
          studentName, schoolAddress, pinCode, udiseCode, teacherCode,
          studentAddress, phoneNumber, rollNumber, ruralUrban,
          motherTongue, mediumOfInstruction
        }
      };

      try {
        const res = await fetch(`${API_URL}/students/profile`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        
        if (res.ok) {
          // Update global context so changes reflect immediately
          setAuthProfile({
             ...profile,
             registration_number: registrationNumber,
             class_name: studentClass,
             dob: dateOfBirth,
             school: schoolName,
             family_details: payload.familyDetails
          });
        }
      } catch (err) {
        console.warn("Saving profile failed", err);
      }
    }

    router.push("/part_a1/FamilyTreePage");
  };

  // ── Handlers ──
  const onChangeDate = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDobDate(selectedDate);
      const day = selectedDate.getDate().toString().padStart(2, "0");
      const month = (selectedDate.getMonth() + 1).toString().padStart(2, "0");
      const year = selectedDate.getFullYear();
      setDateOfBirth(`${day} / ${month} / ${year}`);
    }
  };

  const renderLabel = (title, infoContent) => (
    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6, marginTop: 14 }}>
      <Text style={[styles.label, { marginTop: 0, marginBottom: 0 }]}>{title}</Text>
      {infoContent && (
        <SoundButton 
          style={styles.infoIcon}
          onPress={() => setInfoTooltip({ visible: true, title, content: infoContent })}
          activeOpacity={0.6}
        >
          <Text style={[styles.infoIconText, { color: theme.isDark ? "#00FF9D" : "#008a5c" }]}>?</Text>
        </SoundButton>
      )}
    </View>
  );

  const renderTrigger = (label, value, placeholder, onSave, config = {}) => (
    <View>
      {renderLabel(label, config.info)}
      <TextInput
        style={[styles.input, config.multiline && styles.multilineInput, !isTeacher && config.teacherOnly && { backgroundColor: theme.border + '20', opacity: 0.8 }]}
        placeholder={placeholder}
        placeholderTextColor={theme.secondaryText}
        value={value}
        onChangeText={onSave}
        keyboardType={config.keyboardType || "default"}
        maxLength={config.maxLength}
        multiline={config.multiline}
        selectionColor={theme.text}
        color={theme.text}
        editable={!(config.teacherOnly && !isTeacher)}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Background Animation */}
      <ShootingStars theme={theme} />
      
      <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} />

      {/* Header */}
      <View style={styles.headerBar}>
        <View style={styles.headerAccent} />
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {profile?.photo && (
              <Image 
                source={{ uri: profile.photo }} 
                style={{ width: 45, height: 45, borderRadius: 23, borderWidth: 2, borderColor: theme.accent, marginRight: 12 }} 
              />
            )}
            <View>
              <Text style={styles.headerTitle}>Student Registration</Text>
              <Text style={styles.headerSubtitle}>Fill out all details below</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <SoundButton 
              style={[styles.syncBtn, { backgroundColor: theme.primary + '30' }]} 
              onPress={handleManualSave}
            >
              <Ionicons name="save-outline" size={18} color={theme.primary} />
            </SoundButton>
            <SoundButton 
              style={[styles.syncBtn, { backgroundColor: theme.surface + '80' }]} 
              onPress={fetchProfile}
            >
              <Ionicons name="sync-outline" size={18} color={theme.text} />
            </SoundButton>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Section: School Information ── */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>SCHOOL INFORMATION</Text>
          <View style={styles.sectionDivider} />

          {renderTrigger("Name of School", schoolName, "Enter school name", setSchoolName, { multiline: true })}
          
          {renderTrigger("Address", schoolAddress, "Enter school address", setSchoolAddress, { multiline: true })}

          <View style={styles.row}>
            <View style={styles.halfField}>
              {renderTrigger("Pin Code", pinCode, "6-digit pin", setPinCode, { keyboardType: "numeric", maxLength: 6 })}
            </View>
            <View style={styles.halfField}>
              {renderTrigger("UDISE Code", udiseCode, "11-digit code", setUdiseCode, { keyboardType: "numeric", maxLength: 11, teacherOnly: true, info: "The Unified District Information System for Education code is a unique 11-digit school identifier." })}
            </View>
          </View>

          {renderLabel("Teacher Code", "Your 3-digit assigned faculty registration code.")}
          <View pointerEvents={isTeacher ? "auto" : "none"} style={!isTeacher && { opacity: 0.5 }}>
            <DigitBoxes length={3} value={teacherCode} onValueChange={setTeacherCode} />
          </View>
        </View>

        {/* ── Section: Student Information ── */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>STUDENT INFORMATION</Text>
          <View style={styles.sectionDivider} />

          {renderTrigger("Student Name", studentName, "Enter full name", setStudentName, { multiline: true })}

          <View style={styles.row}>
            <View style={styles.halfField}>
              {renderTrigger("Registration No.", registrationNumber, "Reg. number", setRegistrationNumber, { teacherOnly: true })}
            </View>
            <View style={styles.halfField}>
              <Text style={styles.label}>Class</Text>
              <View style={[styles.pickerWrapper, { height: 48, justifyContent: 'center' }]}>
                <Picker
                  selectedValue={studentClass}
                  style={styles.picker}
                  dropdownIconColor={theme.secondaryText}
                  onValueChange={setStudentClass}
                >
                  <Picker.Item label="— Select Class —" value="" color={theme.secondaryText} />
                  <Picker.Item label="Bal Vatika 1" value="Bal Vatika 1" color={Platform.OS === "android" ? "#000" : theme.text} />
                  <Picker.Item label="Bal Vatika 2" value="Bal Vatika 2" color={Platform.OS === "android" ? "#000" : theme.text} />
                  <Picker.Item label="Bal Vatika 3" value="Bal Vatika 3" color={Platform.OS === "android" ? "#000" : theme.text} />
                  <Picker.Item label="Kindergarten" value="kg" color={Platform.OS === "android" ? "#000" : theme.text} />
                  {Array.from({ length: 12 }, (_, i) => (
                    <Picker.Item key={i} label={`Grade ${i + 1}`} value={`Grade ${i + 1}`} color={Platform.OS === "android" ? "#000" : theme.text} />
                  ))}
                </Picker>
              </View>
            </View>
          </View>

          {registrationNumber ? (
            <Text style={{ fontSize: 10, color: theme.accent, textAlign: 'center', marginTop: 10 }}>
              Linked to ID: {registrationNumber}
            </Text>
          ) : null}

          <View>
            <Text style={styles.label}>Date of Birth</Text>
            <SoundButton
              style={[styles.input, { justifyContent: "center" }]}
              activeOpacity={0.7}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={{ color: dateOfBirth ? theme.text : theme.secondaryText }}>
                {dateOfBirth || "DD / MM / YYYY"}
              </Text>
            </SoundButton>
            {showDatePicker && (
              <DateTimePicker
                value={dobDate}
                mode="date"
                display="default"
                onChange={onChangeDate}
                maximumDate={new Date()}
              />
            )}
          </View>

          {renderTrigger("Address", studentAddress, "Enter student address", setStudentAddress, { multiline: true })}

          <View style={styles.row}>
            <View style={styles.halfField}>
              {renderTrigger("Phone Number", phoneNumber, "10-digit number", setPhoneNumber, { keyboardType: "phone-pad", maxLength: 10 })}
            </View>
            <View style={styles.halfField}>
              {renderTrigger("Roll Number", rollNumber, "Roll no.", setRollNumber)}
            </View>
          </View>
        </View>

        {/* ── Section: Preferences ── */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>PREFERENCES</Text>
          <View style={styles.sectionDivider} />

          <Text style={styles.label}>Rural / Urban</Text>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={ruralUrban}
              style={styles.picker}
              dropdownIconColor={theme.secondaryText}
              onValueChange={setRuralUrban}
            >
              <Picker.Item label="— Select Area Type —" value="" color={theme.secondaryText} />
              <Picker.Item label="Rural" value="rural" color={Platform.OS === "android" ? "#000" : theme.text} />
              <Picker.Item label="Urban" value="urban" color={Platform.OS === "android" ? "#000" : theme.text} />
            </Picker>
          </View>

          {renderTrigger("Mother Tongue", motherTongue, "e.g. Tamil, Hindi, English", setMotherTongue)}

          <Text style={styles.label}>Medium of Instruction</Text>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={mediumOfInstruction}
              style={styles.picker}
              dropdownIconColor={theme.secondaryText}
              onValueChange={setMediumOfInstruction}
            >
              <Picker.Item label="— Select Medium —" value="" color={theme.secondaryText} />
              <Picker.Item label="English" value="english" color={Platform.OS === "android" ? "#000" : theme.text} />
              <Picker.Item label="Hindi" value="hindi" color={Platform.OS === "android" ? "#000" : theme.text} />
              <Picker.Item label="Tamil" value="tamil" color={Platform.OS === "android" ? "#000" : theme.text} />
              <Picker.Item label="Telugu" value="telugu" color={Platform.OS === "android" ? "#000" : theme.text} />
              <Picker.Item label="Kannada" value="kannada" color={Platform.OS === "android" ? "#000" : theme.text} />
              <Picker.Item label="Malayalam" value="malayalam" color={Platform.OS === "android" ? "#000" : theme.text} />
              <Picker.Item label="Bengali" value="bengali" color={Platform.OS === "android" ? "#000" : theme.text} />
              <Picker.Item label="Marathi" value="marathi" color={Platform.OS === "android" ? "#000" : theme.text} />
              <Picker.Item label="Other" value="other" color={Platform.OS === "android" ? "#000" : theme.text} />
            </Picker>
          </View>
        </View>

        {/* ── Submit Button ── */}
        <SoundButton
          style={styles.nextButton}
          onPress={handleNext}
          activeOpacity={0.8}
        >
          <Text style={styles.nextButtonText}>Next →</Text>
        </SoundButton>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── INFO TOOLTIP MODAL ── */}
      <Modal
        visible={infoTooltip.visible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setInfoTooltip({ visible: false, title: "", content: "" })}
      >
        <View style={styles.tooltipOverlay}>
          <View style={styles.tooltipContent}>
            <Text style={styles.tooltipTitle}>{infoTooltip.title}</Text>
            <Text style={styles.tooltipText}>{infoTooltip.content}</Text>
            <SoundButton 
              style={styles.tooltipButton} 
              onPress={() => setInfoTooltip({ visible: false, title: "", content: "" })}
            >
              <Text style={styles.tooltipButtonText}>Got it</Text>
            </SoundButton>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },

  /* ── Header ── */
  headerBar: {
    backgroundColor: theme.surface + "E6", // 90% opacity for glass effect
    paddingTop: 56,
    paddingBottom: 20,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  headerAccent: {
    height: 3,
    width: 50,
    backgroundColor: theme.accent,
    borderRadius: 2,
    marginBottom: 14,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: theme.text,
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    color: theme.secondaryText,
    fontWeight: "600",
    marginTop: 2,
  },
  syncBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.border + "10",
  },

  /* ── ScrollView ── */
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },

  /* ── Card ── */
  card: {
    backgroundColor: theme.card + "CC", // 80% opacity for glass effect
    borderRadius: 14,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.border,
  },

  /* ── Section Headers ── */
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: theme.secondaryText,
    letterSpacing: 2,
    marginBottom: 6,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: theme.border,
    marginBottom: 16,
  },

  /* ── Labels & Triggers ── */
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.secondaryText,
    marginBottom: 6,
    marginTop: 14,
  },
  input: {
    backgroundColor: theme.inputBackground,
    borderWidth: 1,
    borderColor: theme.inputBorder,
    borderRadius: 10,
    paddingHorizontal: 14,
    minHeight: 50,
  },
  multilineInput: {
    minHeight: 60,
    paddingTop: 14,
  },

  /* ── Row Layout ── */
  row: {
    flexDirection: "row",
    gap: 12,
  },
  halfField: {
    flex: 1,
  },

  /* ── Picker ── */
  pickerWrapper: {
    backgroundColor: theme.inputBackground,
    borderWidth: 1,
    borderColor: theme.inputBorder,
    borderRadius: 10,
    overflow: "hidden",
    marginTop: 6,
  },
  picker: {
    color: theme.text,
    height: 55,
  },

  /* ── Next Button ── */
  nextButton: {
    backgroundColor: theme.primary,
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 8,
  },
  nextButtonText: {
    color: theme.buttonText,
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0.5,
  },

  /* ── Tooltips ── */
  infoIcon: {
    marginLeft: 8,
    backgroundColor: theme.border,
    borderRadius: 12,
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  infoIconText: {
    color: theme.accent,
    fontSize: 12,
    fontWeight: "bold",
  },
  tooltipOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  tooltipContent: {
    backgroundColor: theme.surface,
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 340,
    borderWidth: 1,
    borderColor: theme.border,
  },
  tooltipTitle: {
    color: theme.accent,
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  tooltipText: {
    color: theme.text,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 24,
  },
  tooltipButton: {
    backgroundColor: theme.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  tooltipButtonText: {
    color: theme.buttonText,
    fontSize: 15,
    fontWeight: "bold",
  },
});
