import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  Dimensions,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { useTheme, useAuth, API_URL } from "../../context/GlobalContext";
import PremiumBackground from "../../components/PremiumBackground";
import SoundButton from "../../components/SoundButton";
import MenuDropdown from "../../components/MenuDropdown";
import GemButton from "../../components/GemButton";
import AutoResizingInput from "../../components/AutoResizingInput";
import GemCutCard from "../../components/GemCutCard";
import { gems } from "../../colour_themes";
import useAutoSave from "../../hooks/useAutoSave";

const { width } = Dimensions.get("window");

const MONTHS_LIST = [
  "Apr", "May", "June", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"
];

const INTEREST_OPTIONS = [
  { id: "reading", label: "Reading", icon: "book-outline" },
  { id: "music", label: "Dancing or Singing or Playing a musical instrument", icon: "musical-notes-outline" },
  { id: "sports", label: "Sport or Games", icon: "football-outline" },
  { id: "writing", label: "Creative writing", icon: "create-outline" },
  { id: "gardening", label: "Gardening", icon: "leaf-outline" },
  { id: "yoga", label: "Yoga", icon: "body-outline" },
  { id: "art", label: "Art", icon: "color-palette-outline" },
  { id: "craft", label: "Craft", icon: "cut-outline" },
  { id: "cooking", label: "Cooking", icon: "restaurant-outline" },
  { id: "home_part", label: "Participation at home", icon: "home-outline" },
];

export default function GeneralInformation() {
  const { theme } = useTheme();
  const { user, profile, setProfile: setAuthProfile, schoolInfo, teacherInfo, activeStudentId, activeStudentProfile, setActiveStudentProfile } = useAuth();
  const router = useRouter();

  const isTeacher = user?.role === 'teacher' || user?.role === 'superadmin';
  const targetUserId = activeStudentId || user?.id;
  const targetProfile = activeStudentProfile || profile;

  const [loading, setLoading] = useState(false);

  // --- PDF PAGE 7: SCHOOL & ADMIN HEADER ---
  const [schoolName, setSchoolName] = useState("");
  const [village, setVillage] = useState("");
  const [brc, setBrc] = useState("");
  const [crc, setCrc] = useState("");
  const [stateName, setStateName] = useState("");
  const [pinCode, setPinCode] = useState("");
  const [udiseCode, setUdiseCode] = useState("");
  const [teacherCode, setTeacherCode] = useState("");

  // --- GENERAL INFORMATION ---
  const [studentName, setStudentName] = useState("");
  const [apaarId, setApaarId] = useState("");
  const [udid, setUdid] = useState("");
  const [rollNo, setRollNo] = useState("");
  const [registrationNo, setRegistrationNo] = useState("");
  const [selectedGrade, setSelectedGrade] = useState("Grade 9"); // Grade 9, 10, 11, 12
  const [section, setSection] = useState("");
  const [dob, setDob] = useState("");
  const [age, setAge] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [motherName, setMotherName] = useState("");
  const [motherEdu, setMotherEdu] = useState("");
  const [motherOcc, setMotherOcc] = useState("");
  const [fatherName, setFatherName] = useState("");
  const [fatherEdu, setFatherEdu] = useState("");
  const [fatherOcc, setFatherOcc] = useState("");
  const [numSiblings, setNumSiblings] = useState("");
  const [siblingsAge, setSiblingsAge] = useState("");
  const [motherTongue, setMotherTongue] = useState("");
  const [mediumInstruction, setMediumInstruction] = useState("");
  const [ruralUrban, setRuralUrban] = useState("Urban");
  const [timesAbsent, setTimesAbsent] = useState("");

  // --- ATTENDANCE TABLE (12 Months) ---
  const [attendance, setAttendance] = useState(
    MONTHS_LIST.map((m) => ({ month: m, working: "", present: "", pct: "0", reasons: "" }))
  );

  // --- INTERESTS ---
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [otherInterest, setOtherInterest] = useState("");

  // Load Saved Profile & Assessments Data
  useEffect(() => {
    if (schoolInfo) {
      setSchoolName(schoolInfo.name || "");
      setUdiseCode(schoolInfo.udise_code || "");
    }
    if (teacherInfo) {
      setTeacherCode(teacherInfo.teacher_code || "");
    }

    if (targetProfile) {
      setStudentName(targetProfile.full_name || targetProfile.student_name || "");
      setRegistrationNo(targetProfile.registration_number || "");
      setRollNo(targetProfile.roll_number ? String(targetProfile.roll_number) : "");
      setSelectedGrade(targetProfile.class_name || "Grade 9");
      setSection(targetProfile.section || "A");
      setDob(targetProfile.dob || "");
      setAddress(targetProfile.address || "");
      setPhone(targetProfile.phone || "");
      setMotherTongue(targetProfile.mother_tongue || "");
      setMediumInstruction(targetProfile.medium_of_instruction || "");
      setRuralUrban(targetProfile.rural_urban || "Urban");

      let fd = {};
      try {
        fd = typeof targetProfile.family_details === 'string'
          ? JSON.parse(targetProfile.family_details || '{}')
          : (targetProfile.family_details || {});
      } catch (e) {
        console.warn('Family details parse error', e);
      }

      setMotherName(fd.mother_name || "");
      setMotherEdu(fd.mother_edu || "");
      setMotherOcc(fd.mother_occ || "");
      setFatherName(fd.father_name || "");
      setFatherEdu(fd.father_edu || "");
      setFatherOcc(fd.father_occ || "");
      setNumSiblings(fd.num_siblings || "");
      setSiblingsAge(fd.siblings_age || "");

      let assess = {};
      try {
        assess = typeof targetProfile.assessments === 'string'
          ? JSON.parse(targetProfile.assessments || '{}')
          : (targetProfile.assessments || {});
      } catch (e) {
        console.warn('Assessments parse error', e);
      }

      const a1 = assess.a1_s4 || {};
      setVillage(a1.village || "");
      setBrc(a1.brc || "");
      setCrc(a1.crc || "");
      setStateName(a1.stateName || "");
      setPinCode(a1.pinCode || "");
      setApaarId(a1.apaarId || "");
      setUdid(a1.udid || "");
      setAge(a1.age || "");
      setTimesAbsent(a1.timesAbsent || "");

      if (Array.isArray(a1.attendance) && a1.attendance.length === 12) {
        setAttendance(a1.attendance);
      }
      setSelectedInterests(a1.selectedInterests || []);
      setOtherInterest(a1.otherInterest || "");
    }
  }, [targetProfile, schoolInfo, teacherInfo]);

  // Handle Attendance Change
  const updateAttendanceRow = (index, field, value) => {
    setAttendance((prev) => {
      const next = [...prev];
      const row = { ...next[index], [field]: value };
      const w = parseFloat(row.working) || 0;
      const p = parseFloat(row.present) || 0;
      row.pct = w > 0 ? ((p / w) * 100).toFixed(1) : "0";
      next[index] = row;
      return next;
    });
  };

  // Toggle Interest
  const toggleInterest = (id) => {
    setSelectedInterests((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Auto-Save Hook Data
  const getSavePayload = () => {
    return {
      userId: targetUserId,
      registrationNumber: registrationNo,
      fullName: studentName,
      dob,
      address,
      phone,
      motherTongue,
      medium: mediumInstruction,
      ruralUrban,
      familyDetails: {
        mother_name: motherName,
        mother_edu: motherEdu,
        mother_occ: motherOcc,
        father_name: fatherName,
        father_edu: fatherEdu,
        father_occ: fatherOcc,
        num_siblings: numSiblings,
        siblings_age: siblingsAge,
      },
      assessments: {
        a1_s4: {
          village, brc, crc, stateName, pinCode, apaarId, udid, age, timesAbsent,
          attendance, selectedInterests, otherInterest
        }
      }
    };
  };

  const { triggerSave } = useAutoSave(targetUserId, getSavePayload, [
    targetUserId, registrationNo, studentName, dob, address, phone, motherTongue, mediumInstruction, ruralUrban,
    motherName, motherEdu, motherOcc, fatherName, fatherEdu, fatherOcc, numSiblings, siblingsAge,
    village, brc, crc, stateName, pinCode, apaarId, udid, age, timesAbsent, attendance, selectedInterests, otherInterest
  ]);

  const handleSaveAndProceed = async () => {
    if (!targetUserId) return;
    setLoading(true);
    try {
      if (triggerSave) {
        await triggerSave();
      } else {
        const payload = getSavePayload();
        const res = await fetch(`${API_URL}/students/profile`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          Alert.alert("Error", "Failed to save profile.");
          return;
        }
      }
      Alert.alert("Saved", "Part A(1) General Information saved successfully!");
      router.push("/part_a2_s4/SelfEvaluation");
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Server error while saving.");
    } finally {
      setLoading(false);
    }
  };

  // Calculate totals
  const totalWorking = attendance.reduce((sum, r) => sum + (parseFloat(r.working) || 0), 0);
  const totalPresent = attendance.reduce((sum, r) => sum + (parseFloat(r.present) || 0), 0);
  const overallPct = totalWorking > 0 ? ((totalPresent / totalWorking) * 100).toFixed(1) : "0";

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} />
      <PremiumBackground gemColor={gems.sapphire} />

      <View style={styles.headerNav}>
        <MenuDropdown />
        <View style={styles.titleContainer}>
          <Text style={[styles.headerTitle, { color: gems.sapphire }]}>PART-A (1)</Text>
          <Text style={[styles.headerSub, { color: theme.secondaryText }]}>SECONDARY STAGE HPC</Text>
        </View>
        <View style={styles.iconBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* SECTION 1: SCHOOL & ADMINISTRATIVE INFORMATION */}
        <GemCutCard style={{ marginBottom: 16 }} contentStyle={{ padding: 16 }}>
          <View style={styles.cardHeader}>
            <Ionicons name="school-outline" size={20} color={gems.sapphire} />
            <Text style={[styles.sectionHeading, { color: gems.sapphire }]}>SCHOOL INFORMATION</Text>
          </View>

          <Text style={[styles.inputLabel, { color: theme.secondaryText }]}>Name and Address of the School:</Text>
          <AutoResizingInput
            placeholder="School Name & Address..."
            value={schoolName}
            onChangeText={setSchoolName}
            style={[styles.blueUnderline, { color: theme.text }]}
          />

          <View style={styles.rowTwoCol}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.inputLabel, { color: theme.secondaryText }]}>Village:</Text>
              <TextInput style={[styles.input, { color: theme.text, borderColor: theme.border }]} value={village} onChangeText={setVillage} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.inputLabel, { color: theme.secondaryText }]}>BRC:</Text>
              <TextInput style={[styles.input, { color: theme.text, borderColor: theme.border }]} value={brc} onChangeText={setBrc} />
            </View>
          </View>

          <View style={styles.rowTwoCol}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.inputLabel, { color: theme.secondaryText }]}>CRC:</Text>
              <TextInput style={[styles.input, { color: theme.text, borderColor: theme.border }]} value={crc} onChangeText={setCrc} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.inputLabel, { color: theme.secondaryText }]}>State:</Text>
              <TextInput style={[styles.input, { color: theme.text, borderColor: theme.border }]} value={stateName} onChangeText={setStateName} />
            </View>
          </View>

          <View style={styles.rowTwoCol}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.inputLabel, { color: theme.secondaryText }]}>Pin Code:</Text>
              <TextInput style={[styles.input, { color: theme.text, borderColor: theme.border }]} value={pinCode} onChangeText={setPinCode} keyboardType="numeric" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.inputLabel, { color: theme.secondaryText }]}>UDISE Code:</Text>
              <TextInput style={[styles.input, { color: theme.text, borderColor: theme.border }]} value={udiseCode} onChangeText={setUdiseCode} />
            </View>
          </View>

          <Text style={[styles.inputLabel, { color: theme.secondaryText, marginTop: 8 }]}>Teacher Code:</Text>
          <TextInput style={[styles.input, { color: theme.text, borderColor: theme.border }]} value={teacherCode} onChangeText={setTeacherCode} />
        </GemCutCard>

        {/* SECTION 2: GENERAL INFORMATION */}
        <GemCutCard style={{ marginBottom: 16 }} contentStyle={{ padding: 16 }}>
          <View style={styles.cardHeader}>
            <Ionicons name="person-outline" size={20} color={gems.sapphire} />
            <Text style={[styles.sectionHeading, { color: gems.sapphire }]}>GENERAL INFORMATION</Text>
          </View>
          <Text style={styles.subtitleNotice}>(To be filled by the teacher in consultation with caregiver/parent)</Text>

          <Text style={[styles.inputLabel, { color: theme.secondaryText }]}>Student Name:</Text>
          <TextInput style={[styles.input, { color: theme.text, borderColor: theme.border }]} value={studentName} onChangeText={setStudentName} />

          <View style={styles.rowTwoCol}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.inputLabel, { color: theme.secondaryText }]}>APAAR ID:</Text>
              <TextInput style={[styles.input, { color: theme.text, borderColor: theme.border }]} value={apaarId} onChangeText={setApaarId} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.inputLabel, { color: theme.secondaryText }]}>UDID (if any):</Text>
              <TextInput style={[styles.input, { color: theme.text, borderColor: theme.border }]} value={udid} onChangeText={setUdid} />
            </View>
          </View>

          <View style={styles.rowTwoCol}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.inputLabel, { color: theme.secondaryText }]}>Roll No.:</Text>
              <TextInput style={[styles.input, { color: theme.text, borderColor: theme.border }]} value={rollNo} onChangeText={setRollNo} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.inputLabel, { color: theme.secondaryText }]}>Registration No.:</Text>
              <TextInput style={[styles.input, { color: theme.text, borderColor: theme.border }]} value={registrationNo} onChangeText={setRegistrationNo} />
            </View>
          </View>

          {/* Grade Chips */}
          <Text style={[styles.inputLabel, { color: theme.secondaryText, marginTop: 8 }]}>Grade:</Text>
          <View style={styles.chipRow}>
            {["Grade 9", "Grade 10", "Grade 11", "Grade 12"].map((g) => (
              <TouchableOpacity
                key={g}
                style={[
                  styles.gradeChip,
                  selectedGrade === g && { backgroundColor: gems.sapphire, borderColor: gems.sapphire },
                ]}
                onPress={() => setSelectedGrade(g)}
              >
                <Text style={[styles.chipText, selectedGrade === g && { color: "#FFF" }]}>{g}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.rowTwoCol}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.inputLabel, { color: theme.secondaryText }]}>Section:</Text>
              <TextInput style={[styles.input, { color: theme.text, borderColor: theme.border }]} value={section} onChangeText={setSection} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.inputLabel, { color: theme.secondaryText }]}>Date of Birth:</Text>
              <TextInput style={[styles.input, { color: theme.text, borderColor: theme.border }]} value={dob} onChangeText={setDob} placeholder="DD/MM/YYYY" />
            </View>
            <View style={{ flex: 0.6 }}>
              <Text style={[styles.inputLabel, { color: theme.secondaryText }]}>Age:</Text>
              <TextInput style={[styles.input, { color: theme.text, borderColor: theme.border }]} value={age} onChangeText={setAge} keyboardType="numeric" />
            </View>
          </View>

          <Text style={[styles.inputLabel, { color: theme.secondaryText }]}>Address:</Text>
          <AutoResizingInput placeholder="Full Address..." value={address} onChangeText={setAddress} style={[styles.blueUnderline, { color: theme.text }]} />

          <Text style={[styles.inputLabel, { color: theme.secondaryText, marginTop: 8 }]}>Phone:</Text>
          <TextInput style={[styles.input, { color: theme.text, borderColor: theme.border }]} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />

          {/* Family Details */}
          <Text style={[styles.subSectionTitle, { color: gems.sapphire }]}>Parents / Guardians Details</Text>
          
          <Text style={[styles.inputLabel, { color: theme.secondaryText }]}>Mother/Guardian Name:</Text>
          <TextInput style={[styles.input, { color: theme.text, borderColor: theme.border }]} value={motherName} onChangeText={setMotherName} />

          <View style={styles.rowTwoCol}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.inputLabel, { color: theme.secondaryText }]}>Mother Education:</Text>
              <TextInput style={[styles.input, { color: theme.text, borderColor: theme.border }]} value={motherEdu} onChangeText={setMotherEdu} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.inputLabel, { color: theme.secondaryText }]}>Mother Occupation:</Text>
              <TextInput style={[styles.input, { color: theme.text, borderColor: theme.border }]} value={motherOcc} onChangeText={setMotherOcc} />
            </View>
          </View>

          <Text style={[styles.inputLabel, { color: theme.secondaryText, marginTop: 8 }]}>Father/Guardian Name:</Text>
          <TextInput style={[styles.input, { color: theme.text, borderColor: theme.border }]} value={fatherName} onChangeText={setFatherName} />

          <View style={styles.rowTwoCol}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.inputLabel, { color: theme.secondaryText }]}>Father Education:</Text>
              <TextInput style={[styles.input, { color: theme.text, borderColor: theme.border }]} value={fatherEdu} onChangeText={setFatherEdu} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.inputLabel, { color: theme.secondaryText }]}>Father Occupation:</Text>
              <TextInput style={[styles.input, { color: theme.text, borderColor: theme.border }]} value={fatherOcc} onChangeText={setFatherOcc} />
            </View>
          </View>

          <View style={styles.rowTwoCol}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.inputLabel, { color: theme.secondaryText }]}>Number of siblings:</Text>
              <TextInput style={[styles.input, { color: theme.text, borderColor: theme.border }]} value={numSiblings} onChangeText={setNumSiblings} keyboardType="numeric" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.inputLabel, { color: theme.secondaryText }]}>Siblings' age:</Text>
              <TextInput style={[styles.input, { color: theme.text, borderColor: theme.border }]} value={siblingsAge} onChangeText={setSiblingsAge} />
            </View>
          </View>

          <View style={styles.rowTwoCol}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.inputLabel, { color: theme.secondaryText }]}>Mother Tongue:</Text>
              <TextInput style={[styles.input, { color: theme.text, borderColor: theme.border }]} value={motherTongue} onChangeText={setMotherTongue} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.inputLabel, { color: theme.secondaryText }]}>Medium of Instruction:</Text>
              <TextInput style={[styles.input, { color: theme.text, borderColor: theme.border }]} value={mediumInstruction} onChangeText={setMediumInstruction} />
            </View>
          </View>

          <Text style={[styles.inputLabel, { color: theme.secondaryText, marginTop: 8 }]}>Rural/Urban:</Text>
          <View style={styles.chipRow}>
            {["Rural", "Urban"].map((ru) => (
              <TouchableOpacity
                key={ru}
                style={[
                  styles.gradeChip,
                  ruralUrban === ru && { backgroundColor: gems.sapphire, borderColor: gems.sapphire },
                ]}
                onPress={() => setRuralUrban(ru)}
              >
                <Text style={[styles.chipText, ruralUrban === ru && { color: "#FFF" }]}>{ru}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.inputLabel, { color: theme.secondaryText, marginTop: 10 }]}>How many times the student has remained absent? :</Text>
          <TextInput style={[styles.input, { color: theme.text, borderColor: theme.border }]} value={timesAbsent} onChangeText={setTimesAbsent} keyboardType="numeric" placeholder="Number of absent instances..." />
        </GemCutCard>

        {/* SECTION 3: 12-MONTH ATTENDANCE TABLE */}
        <GemCutCard style={{ marginBottom: 16 }} contentStyle={{ padding: 14 }}>
          <View style={styles.cardHeader}>
            <Ionicons name="calendar-outline" size={20} color={gems.sapphire} />
            <Text style={[styles.sectionHeading, { color: gems.sapphire }]}>ATTENDANCE TABLE</Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={true}>
            <View style={{ gap: 6 }}>
              {/* Header Row */}
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.tableCellHead, { width: 90 }]}>Months</Text>
                {MONTHS_LIST.map((m) => (
                  <Text key={m} style={[styles.tableCellHead, { width: 55, textAlign: 'center' }]}>{m}</Text>
                ))}
              </View>

              {/* Working Days Row */}
              <View style={styles.tableBodyRow}>
                <Text style={[styles.tableCellLabel, { width: 90 }]}>Working Days</Text>
                {attendance.map((r, idx) => (
                  <TextInput
                    key={idx}
                    style={[styles.tableInput, { width: 55, color: theme.text }]}
                    value={r.working}
                    onChangeText={(val) => updateAttendanceRow(idx, "working", val)}
                    keyboardType="numeric"
                    placeholder="0"
                  />
                ))}
              </View>

              {/* Days Present Row */}
              <View style={styles.tableBodyRow}>
                <Text style={[styles.tableCellLabel, { width: 90 }]}>Days Present</Text>
                {attendance.map((r, idx) => (
                  <TextInput
                    key={idx}
                    style={[styles.tableInput, { width: 55, color: theme.text }]}
                    value={r.present}
                    onChangeText={(val) => updateAttendanceRow(idx, "present", val)}
                    keyboardType="numeric"
                    placeholder="0"
                  />
                ))}
              </View>

              {/* % Attendance Row */}
              <View style={styles.tableBodyRow}>
                <Text style={[styles.tableCellLabel, { width: 90 }]}>% Attendance</Text>
                {attendance.map((r, idx) => (
                  <Text key={idx} style={[styles.tableCellVal, { width: 55, textAlign: 'center' }]}>{r.pct}%</Text>
                ))}
              </View>
            </View>
          </ScrollView>

          {/* Live Summary */}
          <View style={styles.summaryBox}>
            <Text style={styles.summaryText}>Total Working: <Text style={{ fontWeight: '700' }}>{totalWorking}</Text> | Total Present: <Text style={{ fontWeight: '700' }}>{totalPresent}</Text> | Overall: <Text style={{ color: gems.sapphire, fontWeight: '700' }}>{overallPct}%</Text></Text>
          </View>
        </GemCutCard>

        {/* SECTION 4: INTEREST (I am interested in)* */}
        <GemCutCard style={{ marginBottom: 24 }} contentStyle={{ padding: 16 }}>
          <View style={styles.cardHeader}>
            <Ionicons name="sparkles-outline" size={20} color={gems.sapphire} />
            <Text style={[styles.sectionHeading, { color: gems.sapphire }]}>INTEREST (I am interested in)*</Text>
          </View>
          <Text style={[styles.subtitleNotice, { marginBottom: 12 }]}>* May choose more than one option</Text>

          <View style={styles.interestsGrid}>
            {INTEREST_OPTIONS.map((opt) => {
              const active = selectedInterests.includes(opt.id);
              return (
                <TouchableOpacity
                  key={opt.id}
                  style={[
                    styles.interestChip,
                    active && { backgroundColor: gems.sapphire, borderColor: gems.sapphire },
                  ]}
                  onPress={() => toggleInterest(opt.id)}
                >
                  <Ionicons name={opt.icon} size={16} color={active ? "#FFF" : gems.sapphire} />
                  <Text style={[styles.interestText, active && { color: "#FFF" }]}>{opt.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={[styles.inputLabel, { color: theme.secondaryText, marginTop: 14 }]}>Other (Please specify):</Text>
          <AutoResizingInput
            placeholder="Specify other interests..."
            value={otherInterest}
            onChangeText={setOtherInterest}
            style={[styles.blueUnderline, { color: theme.text }]}
          />
        </GemCutCard>

        {/* PROCEED BUTTON */}
        <View style={styles.buttonCol}>
          <GemButton
            onPress={handleSaveAndProceed}
            gemType="sapphire"
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.btnText}>PROCEED TO PART A2{"\n"}➔</Text>
            )}
          </GemButton>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  headerNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  iconBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  titleContainer: { flex: 1, alignItems: 'center' },
  headerTitle: {
    fontSize: 20,
    fontWeight: '300',
    fontFamily: 'Inter_400Regular',
    letterSpacing: 2,
    textAlign: 'center',
  },
  headerSub: {
    fontSize: 9,
    fontFamily: 'Inter_400Regular',
    letterSpacing: 1,
    marginTop: 2,
    textAlign: 'center',
  },
  scrollContainer: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'Outfit_600SemiBold',
    letterSpacing: 0.5,
  },
  subtitleNotice: {
    fontSize: 11,
    fontStyle: 'italic',
    color: '#888',
    marginBottom: 10,
  },
  subSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'Outfit_600SemiBold',
    marginTop: 14,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  inputLabel: {
    fontSize: 11,
    fontFamily: 'Outfit_600SemiBold',
    marginTop: 8,
    marginBottom: 2,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginBottom: 4,
  },
  blueUnderline: {
    borderBottomColor: gems.sapphire,
    borderBottomWidth: 1.5,
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    fontSize: 12,
  },
  rowTwoCol: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
    marginBottom: 6,
  },
  gradeChip: {
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  chipText: {
    fontSize: 11,
    fontFamily: 'Outfit_600SemiBold',
    color: '#555',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: gems.sapphire + '15',
    paddingVertical: 6,
    borderRadius: 4,
  },
  tableCellHead: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'Outfit_600SemiBold',
    color: gems.sapphire,
  },
  tableBodyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: '#EEE',
  },
  tableCellLabel: {
    fontSize: 10,
    fontFamily: 'Outfit_600SemiBold',
  },
  tableCellVal: {
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
  },
  tableInput: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 4,
    paddingVertical: 2,
    paddingHorizontal: 4,
    fontSize: 10,
    textAlign: 'center',
  },
  summaryBox: {
    marginTop: 10,
    padding: 8,
    borderRadius: 6,
    backgroundColor: gems.sapphire + '10',
    alignItems: 'center',
  },
  summaryText: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
  },
  interestsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  interestChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: gems.sapphire + '60',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  interestText: {
    fontSize: 11,
    fontFamily: 'Outfit_600SemiBold',
    color: gems.sapphire,
  },
  buttonCol: {
    alignItems: 'center',
    marginTop: 10,
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'Outfit_600SemiBold',
    letterSpacing: 1.5,
    textAlign: 'center',
  },
});
