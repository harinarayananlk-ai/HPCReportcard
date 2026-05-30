import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  StatusBar,
  Dimensions,
  Platform,
  Modal,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme, useAuth, API_URL } from "../../context/GlobalContext";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import SoundButton from "../../components/SoundButton";
import GemButton from "../../components/GemButton";
import PremiumBackground from "../../components/PremiumBackground";
import { gems } from "../../colour_themes";
import useAutoSave from "../../hooks/useAutoSave";

const { width, height } = Dimensions.get("window");

const parseDate = (val) => {
  if (!val) return new Date();
  const parsed = new Date(val);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
};

const formatISO = (dateVal) => {
  if (!dateVal || isNaN(dateVal.getTime())) {
    return new Date().toISOString().split('T')[0];
  }
  return dateVal.toISOString().split('T')[0];
};

export default function ParentRegistrationPage() {
  const { theme } = useTheme();
  const { user, profile, setProfile: setAuthProfile, schoolInfo, activeStudentId, activeStudentProfile, setActiveStudentProfile } = useAuth();
  const isTeacher = user?.role === 'teacher' || user?.role === 'superadmin';
  const targetUserId = (isTeacher && activeStudentId) ? activeStudentId : user?.id;
  const targetProfile = (isTeacher && activeStudentProfile) ? activeStudentProfile : profile;
  const router = useRouter();

  // Profile Fields
  const [fullName, setFullName] = useState(targetProfile?.full_name || "");
  const [dob, setDob] = useState(() => parseDate(targetProfile?.dob));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showYearPicker, setShowYearPicker] = useState(false);

  const [address1, setAddress1] = useState(targetProfile?.family_details?.address1 || "");
  const [address2, setAddress2] = useState(targetProfile?.family_details?.address2 || "");
  const [phone, setPhone] = useState(targetProfile?.family_details?.phone || "");
  const [motherName, setMotherName] = useState(targetProfile?.family_details?.motherName || "");
  const [motherEducation, setMotherEducation] = useState(targetProfile?.family_details?.motherEducation || "");
  const [motherOccupation, setMotherOccupation] = useState(targetProfile?.family_details?.motherOccupation || "");
  const [fatherName, setFatherName] = useState(targetProfile?.family_details?.fatherName || "");
  const [fatherEducation, setFatherEducation] = useState(targetProfile?.family_details?.fatherEducation || "");
  const [fatherOccupation, setFatherOccupation] = useState(targetProfile?.family_details?.fatherOccupation || "");
  const [siblingsCount, setSiblingsCount] = useState(targetProfile?.family_details?.siblingsCount || "");
  const [siblingsAge, setSiblingsAge] = useState(targetProfile?.family_details?.siblingsAge || "");
  const [motherTongue, setMotherTongue] = useState(targetProfile?.family_details?.motherTongue || "");
  const [mediumOfInstruction, setMediumOfInstruction] = useState(targetProfile?.family_details?.mediumOfInstruction || "");
  const [ruralUrban, setRuralUrban] = useState(targetProfile?.family_details?.ruralUrban || "");

  useEffect(() => {
    if (targetProfile) {
      setFullName(targetProfile.full_name || "");
      if (targetProfile.dob) setDob(parseDate(targetProfile.dob));
      const fd = targetProfile.family_details;
      if (fd) {
        setAddress1(fd.address1 || "");
        setAddress2(fd.address2 || "");
        setPhone(fd.phone || "");
        setMotherName(fd.motherName || "");
        setMotherEducation(fd.motherEducation || "");
        setMotherOccupation(fd.motherOccupation || "");
        setFatherName(fd.fatherName || "");
        setFatherEducation(fd.fatherEducation || "");
        setFatherOccupation(fd.fatherOccupation || "");
        setSiblingsCount(fd.siblingsCount || "");
        setSiblingsAge(fd.siblingsAge || "");
        setMotherTongue(fd.motherTongue || "");
        setMediumOfInstruction(fd.mediumOfInstruction || "");
        setRuralUrban(fd.ruralUrban || "");
      }
    }
  }, [targetProfile]);

  // Fetch full profile if we only have a stub
  useEffect(() => {
    if (targetUserId && (!targetProfile || !targetProfile.full_name)) {
      (async () => {
        try {
          const res = await fetch(`${API_URL}/students/profile/${targetUserId}`);
          const data = await res.json();
          if (data && data.full_name) {
            if (isTeacher && activeStudentId) setActiveStudentProfile(data);
            else setAuthProfile(data);
          }
        } catch (e) { console.warn("Profile fetch failed", e); }
      })();
    }
  }, [targetUserId]);

  // AutoSave on page exit
  const getPayload = useCallback(() => ({
    userId: targetUserId,
    fullName, dob: formatISO(dob),
    familyDetails: {
      address1, address2, phone, motherName, motherEducation, motherOccupation,
      fatherName, fatherEducation, fatherOccupation, siblingsCount, siblingsAge,
      motherTongue, mediumOfInstruction, ruralUrban,
    },
  }), [targetUserId, fullName, dob, address1, address2, phone, motherName,
       motherEducation, motherOccupation, fatherName, fatherEducation,
       fatherOccupation, siblingsCount, siblingsAge, motherTongue,
       mediumOfInstruction, ruralUrban]);

  useAutoSave(targetUserId, getPayload, [motherName, fatherName, phone, motherTongue]);

  // Dynamic Progress Calculation
  const filledFields = [
    fullName, dob ? dob.toString() : "", address1, phone, motherName, motherEducation,
    motherOccupation, fatherName, fatherEducation, fatherOccupation,
    siblingsCount, siblingsAge, motherTongue, mediumOfInstruction, ruralUrban
  ].filter(val => val && String(val).trim() !== "").length;
  const totalFields = 15;
  const progressPercentage = Math.round((filledFields / totalFields) * 100);

  const years = Array.from({ length: new Date().getFullYear() - 2000 + 1 }, (_, i) => 2000 + i).reverse();

  const handleNext = async () => {
    if (targetUserId) {
       try {
         const familyDetails = { 
           ...targetProfile?.family_details,
           address1, address2, phone, motherName, motherEducation, motherOccupation,
           fatherName, fatherEducation, fatherOccupation, siblingsCount, siblingsAge,
           motherTongue, mediumOfInstruction, ruralUrban
         };

         const payload = {
           userId: targetUserId,
           registrationNumber: targetProfile?.registration_number,
           fullName,
           dob: formatISO(dob),
           familyDetails
         };

         const res = await fetch(`${API_URL}/students/profile`, {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify(payload)
         });

         if (res.ok) {
           const updated = {
             ...targetProfile,
             full_name: fullName,
             dob: formatISO(dob),
             family_details: familyDetails
           };
           if (isTeacher && activeStudentId) setActiveStudentProfile(updated);
           else setAuthProfile(updated);
         }
       } catch (err) {}
    }
    router.push("/part_a1/CompletePage");
  };

  const renderField = (label, value, placeholder, setter) => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrapper}>
        <TextInput
          style={[styles.input, { color: theme.text }]}
          placeholder={placeholder}
          placeholderTextColor={theme.secondaryText + '80'}
          value={value}
          onChangeText={setter}
        />
        <View style={styles.inputFocusLine} />
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <PremiumBackground />
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        
        {/* Header */}
        <View style={styles.header}>
          <SoundButton 
            onPress={() => router.back()} 
            style={[
              styles.backBtn, 
              { 
                backgroundColor: theme.isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
                borderColor: theme.isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"
              }
            ]}
          >
            <Ionicons name="chevron-back" size={24} color={theme.text} />
          </SoundButton>
          <View style={styles.headerTitleContainer}>
            <Text style={[styles.title, { color: theme.text }]}>PART A1</Text>
            <Text style={[styles.subtitle, { color: theme.secondaryText }]}>Personal Profile</Text>
          </View>
          <View style={{ width: 44 }} />
        </View>

        {/* Progress Tracker */}
        <View style={styles.progressTracker}>
          <View style={styles.progressLine}>
            <View style={[styles.progressFill, { width: `${progressPercentage}%`, backgroundColor: gems.sapphire }]} />
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* Section: Basic Info */}
          <View style={[styles.card, { borderColor: gems.sapphire }]}>
            <View style={styles.inlaidHeader}>
              <View style={[styles.inlaidIconBox, { borderColor: gems.sapphire }]}>
                <Ionicons name="person-outline" size={18} color={gems.sapphire} />
              </View>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>BASIC INFORMATION</Text>
            </View>
            <View style={[styles.sectionDivider, { backgroundColor: theme.border }]} />

            {renderField("Student Name", fullName, "Full name of student", setFullName)}
            
            <Text style={styles.label}>Date of Birth</Text>
            <View style={styles.dobContainer}>
               <SoundButton 
                 style={[styles.dobButton, { backgroundColor: gems.sapphire }]} 
                 onPress={() => setShowYearPicker(true)}
               >
                 <Text style={styles.dobBtnText}>SELECT YEAR</Text>
               </SoundButton>
               <SoundButton 
                 style={styles.dobDisplay} 
                 onPress={() => setShowDatePicker(true)}
               >
                 <Text style={styles.dobText}>{dob.toDateString()}</Text>
                 <Ionicons name="calendar-outline" size={18} color={gems.sapphire} />
               </SoundButton>
            </View>

            {showDatePicker && (
              <DateTimePicker
                value={dob}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'calendar'}
                minimumDate={new Date(2000, 0, 1)}
                maximumDate={new Date()}
                onChange={(e, date) => {
                  setShowDatePicker(false);
                  if (date) setDob(date);
                }}
              />
            )}
          </View>

          {/* Section: Family */}
          <View style={[styles.card, { borderColor: gems.sapphire }]}>
             <View style={styles.inlaidHeader}>
              <View style={[styles.inlaidIconBox, { borderColor: gems.sapphire }]}>
                <Ionicons name="people-outline" size={18} color={gems.sapphire} />
              </View>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>FAMILY BACKGROUND</Text>
            </View>
            <View style={[styles.sectionDivider, { backgroundColor: theme.border }]} />
            
            {renderField("Mother/Guardian Name", motherName, "Full name", setMotherName)}
            {renderField("Mother/Guardian Education", motherEducation, "e.g. B.A.", setMotherEducation)}
            {renderField("Mother/Guardian Occupation", motherOccupation, "e.g. Teacher", setMotherOccupation)}
            
            {renderField("Father/Guardian Name", fatherName, "Full name", setFatherName)}
            {renderField("Father/Guardian Education", fatherEducation, "e.g. B.Sc.", setFatherEducation)}
            {renderField("Father/Guardian Occupation", fatherOccupation, "e.g. Engineer", setFatherOccupation)}
            
            {renderField("Number of Siblings", siblingsCount, "e.g. 1", setSiblingsCount)}
            {renderField("Sibling's Age", siblingsAge, "e.g. 5", setSiblingsAge)}
            
            {renderField("Mother Tongue", motherTongue, "e.g. Hindi, Tamil", setMotherTongue)}
            {renderField("Medium of Instruction", mediumOfInstruction, "e.g. English", setMediumOfInstruction)}
            
            {renderField("Address - Line 1", address1, "House no, Street", setAddress1)}
            {renderField("Address - Line 2", address2, "Locality, City", setAddress2)}
            {renderField("Rural/Urban", ruralUrban, "Rural or Urban", setRuralUrban)}
            {renderField("Phone Number", phone, "10-digit mobile", setPhone)}
          </View>

          <GemButton 
            onPress={handleNext} 
            gemType="sapphire"
            width={180}
            style={styles.nextBtn}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <Text style={styles.nextBtnText}>CONTINUE</Text>
              <Ionicons name="arrow-forward" size={16} color="#FFF" />
            </View>
          </GemButton>
          
        </ScrollView>

        {/* Custom Year Picker Modal */}
        <Modal visible={showYearPicker} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={[styles.yearPickerCard, { borderColor: theme.primary }]}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>SELECT BIRTH YEAR</Text>
              <FlatList
                data={years}
                keyExtractor={(item) => item.toString()}
                numColumns={3}
                renderItem={({ item }) => (
                  <SoundButton 
                    style={styles.yearItem} 
                    onPress={() => {
                      const newDate = new Date(dob);
                      newDate.setFullYear(item);
                      setDob(newDate);
                      setShowYearPicker(false);
                      setTimeout(() => setShowDatePicker(true), 300);
                    }}
                  >
                    <Text style={styles.yearText}>{item}</Text>
                  </SoundButton>
                )}
              />
              <SoundButton onPress={() => setShowYearPicker(false)} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>CLOSE</Text>
              </SoundButton>
            </View>
          </View>
        </Modal>

      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 15 },
  backBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.05)", justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  headerTitleContainer: { flex: 1, alignItems: "center" },
  title: { fontSize: 18, fontWeight: "300", color: "#FFFFFF", letterSpacing: 4, fontFamily: "Jost_300Light" },
  subtitle: { fontSize: 9, color: "rgba(255,255,255,0.5)", letterSpacing: 1, marginTop: 2, textTransform: "uppercase", fontFamily: "Jost_400Regular" },
  
  progressTracker: { paddingHorizontal: 40, paddingVertical: 20 },
  progressLine: { height: 2, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 1, position: 'relative' },
  progressFill: { position: 'absolute', height: '100%', borderRadius: 1 },
  progressNode: { position: 'absolute', width: 10, height: 10, borderRadius: 5, top: -4, borderWidth: 2 },

  scrollContent: { padding: 20, paddingBottom: 40 },
  card: {
    backgroundColor: "rgba(245, 245, 245, 0.85)", 
    borderRadius: 24, padding: 20, marginBottom: 20, borderWidth: 1.5,
  },
  inlaidHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  inlaidIconBox: { width: 36, height: 36, borderRadius: 10, borderWidth: 1, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  sectionTitle: { fontSize: 13, fontWeight: '700', letterSpacing: 1, fontFamily: 'Jost_600SemiBold' },
  sectionDivider: { height: 1, marginBottom: 20, borderRadius: 1 },

  inputGroup: { marginBottom: 18 },
  label: { fontSize: 10, color: '#666', fontWeight: '700', marginBottom: 8, letterSpacing: 1, textTransform: 'uppercase' },
  inputWrapper: { position: 'relative' },
  input: {
    backgroundColor: 'rgba(46, 88, 148, 0.05)', 
    borderRadius: 12, paddingHorizontal: 15, paddingVertical: 12, fontSize: 14, fontFamily: 'Jost_400Regular',
  },
  inputFocusLine: { position: 'absolute', bottom: 0, left: 15, right: 15, height: 1, backgroundColor: 'rgba(0,0,0,0.05)' },

  dobContainer: { flexDirection: 'row', gap: 10, marginTop: 5 },
  dobButton: { paddingHorizontal: 15, paddingVertical: 12, borderRadius: 12, justifyContent: 'center' },
  dobBtnText: { color: '#FFF', fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  dobDisplay: { flex: 1, backgroundColor: 'rgba(46, 88, 148, 0.05)', borderRadius: 12, paddingHorizontal: 15, paddingVertical: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dobText: { fontSize: 14, color: '#222' },

  nextBtn: {
    marginTop: 25,
    marginBottom: 20,
    alignSelf: 'center',
  },
  nextBtnText: { color: '#FFF', fontSize: 14, fontWeight: '700', letterSpacing: 2, fontFamily: 'Jost_600SemiBold' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  yearPickerCard: { backgroundColor: '#FFF', width: '100%', borderRadius: 24, padding: 20, maxHeight: height * 0.7, borderWidth: 2 },
  modalTitle: { fontSize: 16, fontWeight: '800', textAlign: 'center', marginBottom: 20, letterSpacing: 2 },
  yearItem: { width: '33.33%', padding: 15, alignItems: 'center' },
  yearText: { fontSize: 16, fontWeight: '600', color: '#444' },
  closeBtn: { marginTop: 20, padding: 15, backgroundColor: '#F5F5F5', borderRadius: 12, alignItems: 'center' },
  closeBtnText: { fontWeight: '700', color: '#666' },
});
