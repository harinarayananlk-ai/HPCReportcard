import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Image,
  Dimensions,
  Platform,
  KeyboardAvoidingView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";

import { useTheme, useAuth, API_URL } from "../../context/GlobalContext";
import PremiumBackground from "../../components/PremiumBackground";
import SoundButton from "../../components/SoundButton";
import MenuDropdown from "../../components/MenuDropdown";
import GemButton from "../../components/GemButton";
import AutoResizingInput from "../../components/AutoResizingInput";
import { gems } from "../../colour_themes";
import useAutoSave from "../../hooks/useAutoSave";

import GemCutCard from "../../components/GemCutCard";

// Helper components
const SectionCard = ({ title, icon, children, theme }) => (
  <GemCutCard
    style={{ marginBottom: 16 }}
    contentStyle={{ padding: 16 }}
  >
    <View style={styles.cardHeader}>
      <Ionicons name={icon} size={18} color={gems.sapphire} />
      <Text style={[styles.cardTitle, { color: theme.text }]}>{title}</Text>
    </View>
    <View style={styles.divider} />
    {children}
  </GemCutCard>
);

const CustomDropdown = ({ label, options, selectedValue, onSelect, theme }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <View style={styles.dropdownContainer}>
      <Text style={[styles.label, { color: '#000000' }]}>{label}</Text>
      <TouchableOpacity
        style={[
          styles.dropdownHeader,
          {
            borderColor: gems.sapphire,
            backgroundColor: 'rgba(46, 88, 148, 0.08)', // Tinted blue
          }
        ]}
        onPress={() => setIsOpen(!isOpen)}
      >
        <Text style={{ color: '#000000' }}>
          {selectedValue || 'Select option...'}
        </Text>
        <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={16} color="#000000" />
      </TouchableOpacity>
      {isOpen && (
        <View style={[styles.dropdownOptions, { backgroundColor: '#FFFFFF', borderColor: gems.sapphire }]}>
          {options.map((opt) => (
            <TouchableOpacity
              key={opt}
              style={styles.dropdownOption}
              onPress={() => {
                onSelect(opt);
                setIsOpen(false);
              }}
            >
              <Text style={{ color: '#000000' }}>{opt}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

export default function LayoutBuilder() {
  const router = useRouter();
  const { theme } = useTheme();
  const { user, profile, setProfile: setAuthProfile, activeStudentId, activeStudentProfile, setActiveStudentProfile } = useAuth();
  const isTeacher = user?.role === 'teacher' || user?.role === 'superadmin';
  const targetUserId = (isTeacher && activeStudentId) ? activeStudentId : user?.id;
  const targetProfile = (isTeacher && activeStudentProfile) ? activeStudentProfile : profile;

  // Local States
  const [loading, setLoading] = useState(false);

  // Section 1: Identity
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [className, setClassName] = useState('');
  const [subjectPhoto, setSubjectPhoto] = useState(null);

  // Section 2: About Me (7 Sentence Completion prompts)
  const [liveWith, setLiveWith] = useState('');
  const [stayAt, setStayAt] = useState('');
  const [freeTime, setFreeTime] = useState('');
  const [doWell, setDoWell] = useState('');
  const [responsible, setResponsible] = useState(''); // sometimes, most times, all the time
  const [doBetter, setDoBetter] = useState('');
  const [careOthers, setCareOthers] = useState('');
  const [proudOf, setProudOf] = useState('');

  // Section 3: My Academic Goal
  const [academicGoal, setAcademicGoal] = useState({ goal: '', why: '', step1: '', step2: '' });

  // Section 4: My Personal Goal
  const [personalGoal, setPersonalGoal] = useState({ goal: '', why: '', step1: '', step2: '' });

  // Section 5: My Learnings
  const [schoolLearnings, setSchoolLearnings] = useState(['', '', '']);
  const [outsideLearnings, setOutsideLearnings] = useState(['', '', '']);

  // Section 6: For My Teacher
  const [teacherHelp, setTeacherHelp] = useState('');
  const [teacherKnow, setTeacherKnow] = useState('');

  // Load Initial Profile
  useEffect(() => {
    if (targetProfile) {
      setName(prev => prev || targetProfile.full_name || '');
      setAge(prev => prev || targetProfile.age || '');
      setClassName(prev => prev || targetProfile.class_name || '');

      let fd = targetProfile.family_details || {};
      if (typeof fd === 'string') {
        try { fd = JSON.parse(fd); } catch (e) { fd = {}; }
      }

      const a2 = fd.a2_middle || {};
      setSubjectPhoto(a2.photo || fd.subjectPhoto || targetProfile.photo || '');
      setLiveWith(a2.liveWith || '');
      setStayAt(a2.stayAt || '');
      setFreeTime(a2.freeTime || '');
      setDoWell(a2.doWell || '');
      setResponsible(a2.responsible || '');
      setDoBetter(a2.doBetter || '');
      setCareOthers(a2.careOthers || '');
      setProudOf(a2.proudOf || '');
      
      if (a2.academicGoal) setAcademicGoal(a2.academicGoal);
      if (a2.personalGoal) setPersonalGoal(a2.personalGoal);
      if (a2.schoolLearnings) setSchoolLearnings(a2.schoolLearnings);
      if (a2.outsideLearnings) setOutsideLearnings(a2.outsideLearnings);
      if (a2.teacherHelp) setTeacherHelp(a2.teacherHelp);
      if (a2.teacherKnow) setTeacherKnow(a2.teacherKnow);
    }
  }, [targetProfile]);

  // Debounced auto-save payload
  const getPayload = useCallback(() => ({
    userId: targetUserId,
    fullName: name,
    a2Data: {
      photo: subjectPhoto, name, age, class_name: className,
      liveWith, stayAt, freeTime, doWell, responsible, doBetter, careOthers, proudOf,
      academicGoal, personalGoal, schoolLearnings, outsideLearnings, teacherHelp, teacherKnow
    }
  }), [targetUserId, subjectPhoto, name, age, className, liveWith, stayAt, freeTime, doWell, responsible, doBetter, careOthers, proudOf, academicGoal, personalGoal, schoolLearnings, outsideLearnings, teacherHelp, teacherKnow]);

  useAutoSave(targetUserId, getPayload, [name, age, className, liveWith, stayAt, freeTime, doWell, responsible, doBetter, careOthers, proudOf, academicGoal, personalGoal, schoolLearnings, outsideLearnings, teacherHelp, teacherKnow]);

  const pickImage = async (setter) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.5,
      base64: true,
    });
    if (!result.canceled) {
      setter(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  const handleSave = async () => {
    if (!targetUserId) return;
    setLoading(true);
    try {
      const fd = typeof targetProfile?.family_details === 'string'
        ? JSON.parse(targetProfile.family_details || '{}')
        : (targetProfile?.family_details || {});
      const a2Data = {
        photo: subjectPhoto, name, age, class_name: className,
        liveWith, stayAt, freeTime, doWell, responsible, doBetter, careOthers, proudOf,
        academicGoal, personalGoal, schoolLearnings, outsideLearnings, teacherHelp, teacherKnow
      };
      const familyDetails = { ...fd, a2_middle: a2Data };

      const res = await fetch(`${API_URL}/students/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: targetUserId,
          registrationNumber: targetProfile?.registration_number,
          familyDetails,
        }),
      });

      if (res.ok) {
        const updated = { ...targetProfile, family_details: familyDetails };
        if (isTeacher && activeStudentId) setActiveStudentProfile(updated);
        else setAuthProfile(updated);
        Alert.alert('Saved', 'Profile updated!');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async () => {
    await handleSave();
    if (isSecondary) {
      router.push('/stage4/Dashboard');
    } else {
      router.push('/part_a3_s3/AmbitionCard');
    }
  };

  const updateLearningList = (list, setter, idx, val) => {
    const updated = [...list];
    updated[idx] = val;
    setter(updated);
  };

  // Determine stage based on class name
  const cls = (targetProfile?.class_name || '').toLowerCase().trim();
  const isSecondary = cls.includes('grade 9') || cls.includes('grade 10') || cls.includes('grade 11') || cls.includes('grade 12') ||
                      cls.includes('class 9') || cls.includes('class 10') || cls.includes('class 11') || cls.includes('class 12') ||
                      cls.includes('9th') || cls.includes('10th') || cls.includes('11th') || cls.includes('12th');

  return (
    <View style={{ flex: 1 }}>
      <PremiumBackground gemColor={gems.sapphire} />
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} />
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          {/* Header */}
          <View style={styles.header}>
            <MenuDropdown />
            <View style={{ flex: 1, alignItems: "center" }}>
              <Text style={[styles.headerTitle, { color: theme.text }]}>ME AND MY SURROUNDINGS</Text>
              <Text style={[styles.headerSubtitle, { color: theme.secondaryText }]}>✨ Middle & Secondary ✨</Text>
            </View>
            <SoundButton onPress={handleSave} style={[styles.backBtn, { borderColor: gems.silver + '80' }]}>
              <Ionicons name="cloud-upload-outline" size={20} color={gems.silver} />
            </SoundButton>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={{ paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Section 1: Identity */}
            <SectionCard title="1. Identity" icon="person-outline" theme={theme}>
              <View style={styles.avatarRow}>
                <TouchableOpacity onPress={() => pickImage(setSubjectPhoto)} style={[styles.avatarFrame, { borderColor: gems.sapphire }]}>
                  {subjectPhoto ? (
                    <Image source={{ uri: subjectPhoto }} style={styles.avatarImage} />
                  ) : (
                    <Ionicons name="camera-outline" size={28} color="#000000" />
                  )}
                </TouchableOpacity>
                <View style={{ flex: 1, gap: 10 }}>
                  <AutoResizingInput placeholder="Full Name" value={name} onChangeText={setName} minHeight={40} style={styles.blueUnderline} />
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <View style={{ flex: 1 }}>
                      <AutoResizingInput placeholder="Age" value={age} onChangeText={setAge} keyboardType="numeric" minHeight={40} style={styles.blueUnderline} />
                    </View>
                    <View style={{ flex: 1.5 }}>
                      <AutoResizingInput placeholder="Class" value={className} onChangeText={setClassName} minHeight={40} style={styles.blueUnderline} />
                    </View>
                  </View>
                </View>
              </View>
            </SectionCard>

            {/* Section 2: About Me */}
            <SectionCard title="2. About Me" icon="finger-print-outline" theme={theme}>
              <View style={styles.sentenceRow}>
                <Text style={[styles.sentenceText, { color: '#000000' }]}>I live with my</Text>
                <AutoResizingInput placeholder="family, mother, etc." value={liveWith} onChangeText={setLiveWith} minHeight={36} style={[styles.inlineInput, styles.blueUnderline]} />
              </View>

              <View style={styles.sentenceRow}>
                <Text style={[styles.sentenceText, { color: '#000000' }]}>I stay at</Text>
                <AutoResizingInput placeholder="my house, hostel, town, etc." value={stayAt} onChangeText={setStayAt} minHeight={36} style={[styles.inlineInput, styles.blueUnderline]} />
              </View>

              <View style={styles.sentenceRow}>
                <Text style={[styles.sentenceText, { color: '#000000' }]}>I spend my free time doing</Text>
                <AutoResizingInput placeholder="reading, sports, etc." value={freeTime} onChangeText={setFreeTime} minHeight={36} style={[styles.inlineInput, styles.blueUnderline]} />
              </View>

              <View style={styles.sentenceRow}>
                <Text style={[styles.sentenceText, { color: '#000000' }]}>I</Text>
                <AutoResizingInput placeholder="play music, learn maths, etc." value={doWell} onChangeText={setDoWell} minHeight={36} style={[styles.inlineInput, styles.blueUnderline]} />
                <Text style={[styles.sentenceText, { color: '#000000' }]}>very well</Text>
              </View>

              <CustomDropdown
                label="I am responsible..."
                options={['Sometimes', 'Most times', 'All the time']}
                selectedValue={responsible}
                onSelect={setResponsible}
                theme={theme}
              />

              <View style={[styles.sentenceRow, { marginTop: 12 }]}>
                <Text style={[styles.sentenceText, { color: '#000000' }]}>I could do better when it comes to</Text>
                <AutoResizingInput placeholder="focus, studies, waking up, etc." value={doBetter} onChangeText={setDoBetter} minHeight={36} style={[styles.inlineInput, styles.blueUnderline]} />
              </View>

              <View style={styles.sentenceRow}>
                <Text style={[styles.sentenceText, { color: '#000000' }]}>I care about others. I show it by</Text>
                <AutoResizingInput placeholder="helping them, listening, etc." value={careOthers} onChangeText={setCareOthers} minHeight={36} style={[styles.inlineInput, styles.blueUnderline]} />
              </View>

              <View style={styles.sentenceRow}>
                <Text style={[styles.sentenceText, { color: '#000000' }]}>I feel proud of myself when</Text>
                <AutoResizingInput placeholder="I complete goals, help friends, etc." value={proudOf} onChangeText={setProudOf} minHeight={36} style={[styles.inlineInput, styles.blueUnderline]} />
              </View>
            </SectionCard>

            {/* Section 3: Academic Goal */}
            <SectionCard title="3. My Academic Goal" icon="school-outline" theme={theme}>
              <AutoResizingInput placeholder="Enter your academic goal..." value={academicGoal.goal} onChangeText={(v) => setAcademicGoal({...academicGoal, goal: v})} minHeight={60} style={styles.blueUnderline} />
              <View style={{ marginTop: 12 }}>
                <AutoResizingInput placeholder="This goal is important because..." value={academicGoal.why} onChangeText={(v) => setAcademicGoal({...academicGoal, why: v})} minHeight={60} style={styles.blueUnderline} />
              </View>
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
                <View style={{ flex: 1 }}>
                  <AutoResizingInput placeholder="Step 1" value={academicGoal.step1} onChangeText={(v) => setAcademicGoal({...academicGoal, step1: v})} minHeight={40} style={styles.blueUnderline} />
                </View>
                <View style={{ flex: 1 }}>
                  <AutoResizingInput placeholder="Step 2" value={academicGoal.step2} onChangeText={(v) => setAcademicGoal({...academicGoal, step2: v})} minHeight={40} style={styles.blueUnderline} />
                </View>
              </View>
            </SectionCard>

            {/* Section 4: Personal Goal */}
            <SectionCard title="4. My Personal Goal" icon="leaf-outline" theme={theme}>
              <AutoResizingInput placeholder="Enter your personal goal..." value={personalGoal.goal} onChangeText={(v) => setPersonalGoal({...personalGoal, goal: v})} minHeight={60} style={styles.blueUnderline} />
              <View style={{ marginTop: 12 }}>
                <AutoResizingInput placeholder="This goal is important because..." value={personalGoal.why} onChangeText={(v) => setPersonalGoal({...personalGoal, why: v})} minHeight={60} style={styles.blueUnderline} />
              </View>
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
                <View style={{ flex: 1 }}>
                  <AutoResizingInput placeholder="Step 1" value={personalGoal.step1} onChangeText={(v) => setPersonalGoal({...personalGoal, step1: v})} minHeight={40} style={styles.blueUnderline} />
                </View>
                <View style={{ flex: 1 }}>
                  <AutoResizingInput placeholder="Step 2" value={personalGoal.step2} onChangeText={(v) => setPersonalGoal({...personalGoal, step2: v})} minHeight={40} style={styles.blueUnderline} />
                </View>
              </View>
            </SectionCard>

            {/* Section 5: My Learnings */}
            <SectionCard title="5. My Learnings" icon="book-outline" theme={theme}>
              <View style={{ flexDirection: 'row', gap: 16 }}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.subLabel, { color: gems.sapphire }]}>At School</Text>
                  {schoolLearnings.map((item, i) => (
                    <TextInput
                      key={`school-${i}`}
                      style={[styles.learningInput, { color: '#000000', borderBottomColor: gems.sapphire }]}
                      placeholder={`Learning #${i + 1}`}
                      placeholderTextColor="rgba(0,0,0,0.3)"
                      value={item}
                      onChangeText={(v) => updateLearningList(schoolLearnings, setSchoolLearnings, i, v)}
                    />
                  ))}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.subLabel, { color: gems.sapphire }]}>Outside School</Text>
                  {outsideLearnings.map((item, i) => (
                    <TextInput
                      key={`outside-${i}`}
                      style={[styles.learningInput, { color: '#000000', borderBottomColor: gems.sapphire }]}
                      placeholder={`Learning #${i + 1}`}
                      placeholderTextColor="rgba(0,0,0,0.3)"
                      value={item}
                      onChangeText={(v) => updateLearningList(outsideLearnings, setOutsideLearnings, i, v)}
                    />
                  ))}
                </View>
              </View>
            </SectionCard>

            {/* Section 6: For My Teacher */}
            <SectionCard title="6. For My Teacher" icon="chatbox-outline" theme={theme}>
              <AutoResizingInput
                placeholder="I would like my teacher to help me with..."
                value={teacherHelp}
                onChangeText={setTeacherHelp}
                minHeight={80}
                style={styles.blueUnderline}
              />
              <View style={{ marginTop: 12 }}>
                <AutoResizingInput
                  placeholder="I would like my teacher to know..."
                  value={teacherKnow}
                  onChangeText={setTeacherKnow}
                  minHeight={80}
                  style={styles.blueUnderline}
                />
              </View>
            </SectionCard>

             {/* Proceed button */}
             <View style={styles.buttonCol}>
               <GemButton
                 onPress={handleNext}
                 disabled={loading}
                 style={styles.actionBtn}
                 gemType="sapphire"
               >
                 {loading ? (
                   <ActivityIndicator color="#FFF" />
                 ) : (
                   <Text style={styles.btnText}>{"PROCEED TO\nPART A3\n➔"}</Text>
                 )}
               </GemButton>
             </View>

          </ScrollView>
        </KeyboardAvoidingView>

        {/* BLUR OVERLAY FOR SECONDARY STAGE REMOVED */}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "300",
    letterSpacing: 2,
    fontFamily: "Inter_400Regular",
  },
  headerSubtitle: {
    fontSize: 10,
    fontWeight: "300",
    opacity: 0.8,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  scroll: {
    flex: 1,
    paddingHorizontal: 12,
    marginTop: 10,
  },
  card: {
    borderRadius: 20,
    borderWidth: 0,
    padding: 16,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
    fontFamily: 'Outfit_600SemiBold',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
    marginBottom: 16,
  },
  avatarRow: {
    flexDirection: 'row',
    gap: 16,
  },
  avatarFrame: {
    width: 90,
    height: 90,
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  sentenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 16,
    gap: 6,
  },
  sentenceText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  inlineInput: {
    flex: 1,
    minWidth: 120,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 6,
    fontFamily: 'Outfit_600SemiBold',
  },
  dropdownContainer: {
    marginBottom: 12,
    width: '100%',
  },
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 48,
  },
  dropdownOptions: {
    borderWidth: 1.5,
    borderRadius: 12,
    marginTop: 4,
    overflow: 'hidden',
    zIndex: 10,
  },
  dropdownOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.03)',
  },
  subLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 10,
    fontFamily: 'Outfit_600SemiBold',
  },
  learningInput: {
    borderBottomWidth: 1.5,
    paddingVertical: 6,
    paddingHorizontal: 4,
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    marginBottom: 12,
  },
  blueUnderline: {
    borderBottomColor: gems.sapphire,
    borderBottomWidth: 1.5,
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    color: '#000000',
  },
  buttonCol: {
    flexDirection: 'column',
    gap: 12,
    marginTop: 10,
    marginBottom: 40,
    alignItems: 'center',
    width: '100%',
  },
  actionBtn: {
    borderRadius: 16,
  },
  btnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
    fontFamily: 'Outfit_600SemiBold',
    textAlign: 'center',
  },
  maintenanceOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  maintenanceCard: {
    borderRadius: 24,
    borderWidth: 2,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 5,
    width: '100%',
  },
  maintenanceTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 2,
    marginTop: 16,
    marginBottom: 10,
    fontFamily: 'Outfit_600SemiBold',
  },
  maintenanceText: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    fontFamily: 'Inter_400Regular',
  },
});
