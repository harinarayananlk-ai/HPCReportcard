import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  Dimensions,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme, useAuth, API_URL } from "../../context/GlobalContext";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import SoundButton from "../../components/SoundButton";
import GemButton from "../../components/GemButton";
import PremiumBackground from "../../components/PremiumBackground";
import { gems } from "../../colour_themes";
import useAutoSave from "../../hooks/useAutoSave";

const { width } = Dimensions.get("window");

export default function TeacherRegistrationPage() {
  const { theme } = useTheme();
  const { user, profile, setProfile: setAuthProfile, schoolInfo, teacherInfo,
          activeStudentId, activeStudentProfile, setActiveStudentProfile } = useAuth();
  const isTeacher = user?.role === 'teacher' || user?.role === 'superadmin';
  const targetUserId = (isTeacher && activeStudentId) ? activeStudentId : user?.id;
  const targetProfile = (isTeacher && activeStudentProfile) ? activeStudentProfile : profile;
  const router = useRouter();

  // School fields — pull from schoolInfo (owned by superadmin), NOT student
  const [schoolName, setSchoolName] = useState("");
  const [schoolAddress1, setSchoolAddress1] = useState("");
  const [schoolAddress2, setSchoolAddress2] = useState("");
  const [pincode, setPincode] = useState("");
  const [udiseCode, setUdiseCode] = useState("");

  // Teacher code — pull from teacherInfo (owned by teacher), NOT student
  const [teacherCode, setTeacherCode] = useState("");
  
  // Student Identity Fields — pull from student profile
  const [fullName, setFullName] = useState("");
  const [dob, setDob] = useState("");
  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");
  const [phone, setPhone] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [studentClass, setStudentClass] = useState("");
  const [section, setSection] = useState("");

  // Load data from correct sources
  useEffect(() => {
    // School info from school table (via context)
    if (schoolInfo) {
      setSchoolName(prev => prev || schoolInfo.name || "");
      setSchoolAddress1(prev => prev || schoolInfo.address_line1 || "");
      setSchoolAddress2(prev => prev || schoolInfo.address_line2 || "");
      setPincode(prev => prev || schoolInfo.pincode || "");
      setUdiseCode(prev => prev || schoolInfo.udise_code || "");
    }
    // Teacher code from teacher table (via context)
    if (teacherInfo) {
      setTeacherCode(prev => prev || teacherInfo.teacher_code || "");
    }
  }, [schoolInfo, teacherInfo]);

  useEffect(() => {
    if (targetProfile) {
      setFullName(prev => prev || targetProfile.full_name || "");
      setDob(prev => prev || targetProfile.dob || "");
      setRegistrationNumber(prev => prev || targetProfile.registration_number || "");
      setStudentClass(prev => prev || targetProfile.class_name || "");
      setSection(prev => prev || targetProfile.section || "");
      setAddress1(prev => prev || targetProfile.address || "");
      setPhone(prev => prev || targetProfile.phone || "");
      setRollNumber(prev => prev || targetProfile.roll_number || "");

      // Fallback: check family_details for legacy fields
      const fd = typeof targetProfile.family_details === 'string'
        ? JSON.parse(targetProfile.family_details || '{}')
        : (targetProfile.family_details || {});
      setAddress1(prev => prev || fd.address1 || targetProfile.address || "");
      setAddress2(prev => prev || fd.address2 || "");
      setPhone(prev => prev || fd.phone || targetProfile.phone || "");
      setRollNumber(prev => prev || fd.rollNumber || targetProfile.roll_number || "");

      // Legacy school info from student's family_details (if no schoolInfo context)
      if (!schoolInfo) {
        setSchoolName(prev => prev || targetProfile.school || fd.schoolName || "");
        setSchoolAddress1(prev => prev || fd.schoolAddress1 || "");
        setSchoolAddress2(prev => prev || fd.schoolAddress2 || "");
        setPincode(prev => prev || fd.pincode || "");
        setUdiseCode(prev => prev || fd.udiseCode || targetProfile.udise_code || "");
      }
      if (!teacherInfo) {
        setTeacherCode(prev => prev || fd.teacherCode || targetProfile.teacher_code || "");
      }
    }
  }, [targetProfile, schoolInfo, teacherInfo]);

  // Fetch full profile if we only have a stub (e.g. from TeacherTracking)
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
    fullName, dob, address: address1, phone,
    registrationNumber, school: schoolName,
    className: studentClass, section,
    familyDetails: {
      address1, address2, phone, rollNumber,
      schoolAddress1, schoolAddress2, pincode,
      udiseCode, teacherCode,
    },
  }), [targetUserId, fullName, dob, address1, address2, phone,
       registrationNumber, rollNumber, studentClass, section,
       schoolName, schoolAddress1, schoolAddress2, pincode, udiseCode, teacherCode]);

  useAutoSave(targetUserId, getPayload, [fullName, dob, address1, phone, registrationNumber]);

  // Dynamic Progress Calculation
  const filledFields = [
    schoolName, schoolAddress1, pincode, udiseCode, teacherCode, 
    registrationNumber, rollNumber, studentClass, section,
    fullName, dob, address1, phone
  ].filter(val => val && (typeof val === 'string' ? val.trim() !== "" : !!val)).length;
  const totalFields = 13;
  const progressPercentage = Math.round((filledFields / totalFields) * 100);

  const handleNext = async () => {
    if (isTeacher && targetUserId) {
       try {
         const familyDetails = { 
           ...targetProfile?.family_details,
           schoolAddress1, schoolAddress2, pincode, udiseCode, teacherCode, rollNumber,
           address1, address2, phone
         };

         const payload = {
           userId: targetUserId,
           registrationNumber,
           fullName,
           dob,
           className: studentClass,
           section,
           school: schoolName,
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
             registration_number: registrationNumber,
             class_name: studentClass,
             section,
             school: schoolName,
             family_details: familyDetails
           };
           if (isTeacher && activeStudentId) {
              setActiveStudentProfile(updated);
           } else {
              setAuthProfile(updated);
           }
         }
       } catch (err) {
         console.warn("Save failed", err);
       }
    }
    router.push("/part_a1/ParentRegistration");
  };

  const renderTrigger = (label, value, placeholder, setter, options = {}) => {
    const isLocked = options.teacherOnly && !isTeacher;
    return (
      <View style={[styles.inputGroup, isLocked && { opacity: 0.6 }]}>
        <Text style={styles.label}>{label}</Text>
        <View style={styles.inputWrapper}>
          <TextInput
            style={[styles.input, { color: theme.text }]}
            placeholder={placeholder}
            placeholderTextColor={theme.secondaryText + '80'}
            value={value}
            onChangeText={setter}
            editable={!isLocked}
          />
          <View style={styles.inputFocusLine} />
        </View>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <PremiumBackground />
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        
        {/* Header */}
        <View style={styles.header}>
          <SoundButton onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={theme.text} />
          </SoundButton>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.title}>PART A1</Text>
            <Text style={styles.subtitle}>Institutional Records</Text>
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
          
          {/* Section: Official Student Record */}
          <View style={[styles.card, { borderColor: gems.emerald }]}>
            <View style={styles.inlaidHeader}>
              <View style={[styles.inlaidIconBox, { borderColor: gems.emerald }]}>
                <Ionicons name="person-circle-outline" size={18} color={gems.emerald} />
              </View>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>OFFICIAL STUDENT RECORD</Text>
            </View>
            <View style={[styles.sectionDivider, { backgroundColor: theme.border }]} />

            {renderTrigger("Student Name", fullName, "Full name", setFullName, { teacherOnly: true })}
            {renderTrigger("Date of Birth", dob, "YYYY-MM-DD", setDob, { teacherOnly: true })}
            
            <View style={styles.row}>
              <View style={styles.halfField}>
                {renderTrigger("Registration Number", registrationNumber, "REG-101", setRegistrationNumber, { teacherOnly: true })}
              </View>
              <View style={styles.halfField}>
                {renderTrigger("Roll Number", rollNumber, "e.g. 42", setRollNumber, { teacherOnly: true })}
              </View>
            </View>

            <View style={styles.row}>
               <View style={styles.halfField}>
                 <Text style={styles.label}>Class</Text>
                 <View style={styles.pickerWrapper}>
                   <Picker
                     selectedValue={studentClass}
                     style={styles.picker}
                     dropdownIconColor={theme.secondaryText}
                     onValueChange={setStudentClass}
                     enabled={isTeacher}
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
               <View style={styles.halfField}>
                 {renderTrigger("Section", section, "e.g. A", setSection, { teacherOnly: true })}
               </View>
            </View>
          </View>

          {/* Section: Residence & Contact */}
          <View style={[styles.card, { borderColor: gems.sapphire }]}>
            <View style={styles.inlaidHeader}>
              <View style={[styles.inlaidIconBox, { borderColor: gems.sapphire }]}>
                <Ionicons name="home-outline" size={18} color={gems.sapphire} />
              </View>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>RESIDENCE & CONTACT</Text>
            </View>
            <View style={[styles.sectionDivider, { backgroundColor: theme.border }]} />

            {renderTrigger("Address Line 1", address1, "House no, Street", setAddress1, { teacherOnly: true })}
            {renderTrigger("Address Line 2", address2, "Locality, City", setAddress2, { teacherOnly: true })}
            {renderTrigger("Phone Number", phone, "10-digit mobile", setPhone, { teacherOnly: true })}
          </View>

          {/* Section: School Details */}
          <View style={[styles.card, { borderColor: gems.topaz }]}>
            <View style={styles.inlaidHeader}>
              <View style={[styles.inlaidIconBox, { borderColor: gems.topaz }]}>
                <Ionicons name="business-outline" size={18} color={gems.topaz} />
              </View>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>SCHOOL INFORMATION</Text>
            </View>
            <View style={[styles.sectionDivider, { backgroundColor: theme.border }]} />

            {renderTrigger("Name of School", schoolName, "Enter school name", setSchoolName, { teacherOnly: true })}
            {renderTrigger("School Address 1", schoolAddress1, "School location", setSchoolAddress1, { teacherOnly: true })}
            {renderTrigger("School Address 2", schoolAddress2, "Locality, District", setSchoolAddress2, { teacherOnly: true })}
            
            <View style={styles.row}>
               <View style={styles.halfField}>
                 {renderTrigger("Pincode", pincode, "6 digits", setPincode, { teacherOnly: true })}
               </View>
               <View style={styles.halfField}>
                 {renderTrigger("UDISE Code", udiseCode, "School code", setUdiseCode, { teacherOnly: true })}
               </View>
            </View>
            {renderTrigger("Teacher Code", teacherCode, "Official ID", setTeacherCode, { teacherOnly: true })}
          </View>

          <GemButton 
            onPress={handleNext} 
            colors={[gems.sapphire, gems.moonstone]}
            style={styles.nextBtn}
          >
            <Text style={styles.nextBtnText}>CONTINUE TO PROFILE</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFF" />
          </GemButton>
          
        </ScrollView>
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

  scrollContent: { padding: 20, paddingBottom: 40 },
  card: {
    backgroundColor: "rgba(245, 245, 245, 0.85)", 
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 5,
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
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: 'Jost_400Regular',
  },
  inputFocusLine: { position: 'absolute', bottom: 0, left: 15, right: 15, height: 1, backgroundColor: 'rgba(0,0,0,0.05)' },
  
  row: { flexDirection: 'row', gap: 15 },
  halfField: { flex: 1 },

  pickerWrapper: {
    backgroundColor: 'rgba(46, 88, 148, 0.05)', 
    borderRadius: 12,
    marginTop: 5,
    overflow: 'hidden',
  },
  picker: { height: 50, color: '#222' },

  nextBtn: {
    flexDirection: 'row',
    height: 60,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    marginTop: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  nextBtnText: { color: '#FFF', fontSize: 14, fontWeight: '700', letterSpacing: 2, fontFamily: 'Jost_600SemiBold' },
});
