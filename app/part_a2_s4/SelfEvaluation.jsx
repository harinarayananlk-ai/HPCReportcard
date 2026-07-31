import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
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

export default function SelfEvaluation() {
  const { theme } = useTheme();
  const { user, profile, setProfile: setAuthProfile, activeStudentId, activeStudentProfile, setActiveStudentProfile } = useAuth();
  const router = useRouter();

  const isTeacher = user?.role === 'teacher' || user?.role === 'superadmin';
  const targetUserId = activeStudentId || user?.id;
  const targetProfile = activeStudentProfile || profile;

  const [loading, setLoading] = useState(false);

  // --- PDF PAGE 8: REFLECTION SLIDERS & GOALS ---
  const [lastYearPerf, setLastYearPerf] = useState(3); // 1-5 rating
  const [teachersThoughtEffort, setTeachersThoughtEffort] = useState(3); // 1-5 rating

  const [tryNewThings, setTryNewThings] = useState("");
  const [workHarderOn, setWorkHarderOn] = useState("");

  // 4 Career Aspirations & 4 Requirements
  const [aspirations, setAspirations] = useState(["", "", "", ""]);
  const [requirements, setRequirements] = useState(["", "", "", ""]);

  // --- IN-SCHOOL GOAL (Page 8) ---
  const [schoolGoalLastYear, setSchoolGoalLastYear] = useState("");
  const [schoolGoalStatus, setSchoolGoalStatus] = useState("Still working"); // 'Accomplished' | 'Still working'
  const [schoolGoalWhyImportant, setSchoolGoalWhyImportant] = useState("");
  const [schoolGoalThisYear, setSchoolGoalThisYear] = useState("");
  const [schoolGoalHowKnowAchieved, setSchoolGoalHowKnowAchieved] = useState("");
  const [schoolTimelineWeek, setSchoolTimelineWeek] = useState("");
  const [schoolTimelineSixWeeks, setSchoolTimelineSixWeeks] = useState("");
  const [schoolTimelineSixMonths, setSchoolTimelineSixMonths] = useState("");

  // In-School Support 3 Columns
  const [schoolStrengths, setSchoolStrengths] = useState(["", "", ""]);
  const [schoolHomeSupport, setSchoolHomeSupport] = useState(["", "", ""]);
  const [schoolSchoolSupport, setSchoolSchoolSupport] = useState(["", "", ""]);

  // --- OUT-OF-SCHOOL GOAL (Page 9) ---
  const [outGoalLastYear, setOutGoalLastYear] = useState("");
  const [outGoalStatus, setOutGoalStatus] = useState("Still working"); // 'Accomplished' | 'Still working'
  const [outGoalThisYear, setOutGoalThisYear] = useState("");
  const [outGoalHowKnowAchieved, setOutGoalHowKnowAchieved] = useState("");
  const [outTimelineWeek, setOutTimelineWeek] = useState("");
  const [outTimelineSixWeeks, setOutTimelineSixWeeks] = useState("");
  const [outTimelineSixMonths, setOutTimelineSixMonths] = useState("");

  // Out-of-School Support 3 Columns
  const [outStrengths, setOutStrengths] = useState(["", "", ""]);
  const [outHomeSupport, setOutHomeSupport] = useState(["", "", ""]);
  const [outSchoolSupport, setOutSchoolSupport] = useState(["", "", ""]);

  const [outGoalWhyMatter, setOutGoalWhyMatter] = useState("");
  const [goalsAchievedProud, setGoalsAchievedProud] = useState("");

  // Load Saved Data
  useEffect(() => {
    if (targetProfile) {
      let assess = {};
      try {
        assess = typeof targetProfile.assessments === 'string'
          ? JSON.parse(targetProfile.assessments || '{}')
          : (targetProfile.assessments || {});
      } catch (e) {
        console.warn('Assessments parse error', e);
      }

      const a2 = assess.a2_s4 || {};
      setLastYearPerf(a2.lastYearPerf || 3);
      setTeachersThoughtEffort(a2.teachersThoughtEffort || 3);
      setTryNewThings(a2.tryNewThings || "");
      setWorkHarderOn(a2.workHarderOn || "");
      
      if (Array.isArray(a2.aspirations)) setAspirations(a2.aspirations);
      if (Array.isArray(a2.requirements)) setRequirements(a2.requirements);

      // In-School Goal
      setSchoolGoalLastYear(a2.schoolGoalLastYear || "");
      setSchoolGoalStatus(a2.schoolGoalStatus || "Still working");
      setSchoolGoalWhyImportant(a2.schoolGoalWhyImportant || "");
      setSchoolGoalThisYear(a2.schoolGoalThisYear || "");
      setSchoolGoalHowKnowAchieved(a2.schoolGoalHowKnowAchieved || "");
      setSchoolTimelineWeek(a2.schoolTimelineWeek || "");
      setSchoolTimelineSixWeeks(a2.schoolTimelineSixWeeks || "");
      setSchoolTimelineSixMonths(a2.schoolTimelineSixMonths || "");

      if (Array.isArray(a2.schoolStrengths)) setSchoolStrengths(a2.schoolStrengths);
      if (Array.isArray(a2.schoolHomeSupport)) setSchoolHomeSupport(a2.schoolHomeSupport);
      if (Array.isArray(a2.schoolSchoolSupport)) setSchoolSchoolSupport(a2.schoolSchoolSupport);

      // Out-of-School Goal
      setOutGoalLastYear(a2.outGoalLastYear || "");
      setOutGoalStatus(a2.outGoalStatus || "Still working");
      setOutGoalThisYear(a2.outGoalThisYear || "");
      setOutGoalHowKnowAchieved(a2.outGoalHowKnowAchieved || "");
      setOutTimelineWeek(a2.outTimelineWeek || "");
      setOutTimelineSixWeeks(a2.outTimelineSixWeeks || "");
      setOutTimelineSixMonths(a2.outTimelineSixMonths || "");

      if (Array.isArray(a2.outStrengths)) setOutStrengths(a2.outStrengths);
      if (Array.isArray(a2.outHomeSupport)) setOutHomeSupport(a2.outHomeSupport);
      if (Array.isArray(a2.outSchoolSupport)) setOutSchoolSupport(a2.outSchoolSupport);

      setOutGoalWhyMatter(a2.outGoalWhyMatter || "");
      setGoalsAchievedProud(a2.goalsAchievedProud || "");
    }
  }, [targetProfile]);

  // Array Helper Updates
  const updateArrayItem = (setter, index, value) => {
    setter((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  // AutoSave Payload
  const getSavePayload = () => {
    return {
      userId: targetUserId,
      registrationNumber: targetProfile?.registration_number,
      assessments: {
        a2_s4: {
          lastYearPerf, teachersThoughtEffort, tryNewThings, workHarderOn,
          aspirations, requirements,
          schoolGoalLastYear, schoolGoalStatus, schoolGoalWhyImportant, schoolGoalThisYear, schoolGoalHowKnowAchieved,
          schoolTimelineWeek, schoolTimelineSixWeeks, schoolTimelineSixMonths,
          schoolStrengths, schoolHomeSupport, schoolSchoolSupport,
          outGoalLastYear, outGoalStatus, outGoalThisYear, outGoalHowKnowAchieved,
          outTimelineWeek, outTimelineSixWeeks, outTimelineSixMonths,
          outStrengths, outHomeSupport, outSchoolSupport,
          outGoalWhyMatter, goalsAchievedProud
        }
      }
    };
  };

  const { triggerSave } = useAutoSave(targetUserId, getSavePayload, [
    targetUserId, targetProfile, lastYearPerf, teachersThoughtEffort, tryNewThings, workHarderOn,
    aspirations, requirements, schoolGoalLastYear, schoolGoalStatus, schoolGoalWhyImportant, schoolGoalThisYear,
    schoolGoalHowKnowAchieved, schoolTimelineWeek, schoolTimelineSixWeeks, schoolTimelineSixMonths,
    schoolStrengths, schoolHomeSupport, schoolSchoolSupport, outGoalLastYear, outGoalStatus, outGoalThisYear,
    outGoalHowKnowAchieved, outTimelineWeek, outTimelineSixWeeks, outTimelineSixMonths,
    outStrengths, outHomeSupport, outSchoolSupport, outGoalWhyMatter, goalsAchievedProud
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
          Alert.alert("Error", "Failed to save.");
          return;
        }
      }
      Alert.alert("Saved", "Part A(2) Self-Evaluation saved!");
      router.push("/part_a3_s4/AmbitionCard");
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Server error while saving.");
    } finally {
      setLoading(false);
    }
  };

  // Render Gradient Slider Rating Bar
  const renderRatingBar = (val, setVal) => (
    <View style={styles.ratingBarContainer}>
      <View style={styles.gradientLine} />
      <View style={styles.ratingDotsRow}>
        {[1, 2, 3, 4, 5].map((lvl) => (
          <TouchableOpacity
            key={lvl}
            style={[
              styles.ratingDot,
              val === lvl && { backgroundColor: gems.sapphire, transform: [{ scale: 1.3 }] },
            ]}
            onPress={() => setVal(lvl)}
          />
        ))}
      </View>
      <View style={styles.ratingLabelsRow}>
        <Text style={{ color: '#E74C3C', fontWeight: '800' }}>-</Text>
        <Text style={{ color: '#2ECC71', fontWeight: '800' }}>+</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} />
      <PremiumBackground gemColor={gems.sapphire} />

      <View style={styles.headerNav}>
        <MenuDropdown />
        <View style={styles.titleContainer}>
          <Text style={[styles.headerTitle, { color: gems.sapphire }]}>PART A (2)</Text>
          <Text style={[styles.headerSub, { color: theme.secondaryText }]}>SELF-EVALUATION & GOALS</Text>
        </View>
        <View style={styles.iconBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* SECTION 1: REFLECTION SLIDERS (Page 8) */}
        <GemCutCard style={{ marginBottom: 16 }} contentStyle={{ padding: 16 }}>
          <View style={styles.cardHeader}>
            <Ionicons name="compass-outline" size={20} color={gems.sapphire} />
            <Text style={[styles.sectionHeading, { color: gems.sapphire }]}>PERFORMANCE REFLECTION</Text>
          </View>
          <Text style={styles.subtitleNotice}>Circle the most appropriate option.</Text>

          <Text style={[styles.inputLabel, { color: theme.secondaryText }]}>Last year, my performance at school was…</Text>
          {renderRatingBar(lastYearPerf, setLastYearPerf)}

          <Text style={[styles.inputLabel, { color: theme.secondaryText, marginTop: 14 }]}>My teachers thought my efforts last year were…</Text>
          {renderRatingBar(teachersThoughtEffort, setTeachersThoughtEffort)}

          <Text style={[styles.inputLabel, { color: theme.secondaryText, marginTop: 14 }]}>This year, I will try new things like…</Text>
          <AutoResizingInput placeholder="New activities/skills to try..." value={tryNewThings} onChangeText={setTryNewThings} style={[styles.blueUnderline, { color: theme.text }]} />

          <Text style={[styles.inputLabel, { color: theme.secondaryText, marginTop: 10 }]}>I will work harder on things like…</Text>
          <AutoResizingInput placeholder="Areas for improvement..." value={workHarderOn} onChangeText={setWorkHarderOn} style={[styles.blueUnderline, { color: theme.text }]} />
        </GemCutCard>

        {/* SECTION 2: CAREER ASPIRATIONS (Page 8) */}
        <GemCutCard style={{ marginBottom: 16 }} contentStyle={{ padding: 16 }}>
          <View style={styles.cardHeader}>
            <Ionicons name="briefcase-outline" size={20} color={gems.sapphire} />
            <Text style={[styles.sectionHeading, { color: gems.sapphire }]}>CAREER ASPIRATIONS & REQUIREMENTS</Text>
          </View>

          <View style={styles.twoColumnTable}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.colHeader, { color: gems.sapphire }]}>My career aspirations is/are</Text>
              {[0, 1, 2, 3].map((idx) => (
                <TextInput
                  key={idx}
                  style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                  placeholder={`${idx + 1}. Aspiration...`}
                  value={aspirations[idx]}
                  onChangeText={(val) => updateArrayItem(setAspirations, idx, val)}
                />
              ))}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.colHeader, { color: gems.sapphire }]}>To fulfill my aspirations, I need to</Text>
              {[0, 1, 2, 3].map((idx) => (
                <TextInput
                  key={idx}
                  style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                  placeholder={`${idx + 1}. Action required...`}
                  value={requirements[idx]}
                  onChangeText={(val) => updateArrayItem(setRequirements, idx, val)}
                />
              ))}
            </View>
          </View>
        </GemCutCard>

        {/* SECTION 3: IN-SCHOOL GOALS! (Page 8) */}
        <GemCutCard style={{ marginBottom: 16 }} contentStyle={{ padding: 16 }}>
          <View style={styles.cardHeader}>
            <Ionicons name="trophy-outline" size={20} color={gems.sapphire} />
            <Text style={[styles.sectionHeading, { color: gems.sapphire }]}>GOALS! (IN SCHOOL)</Text>
          </View>

          <Text style={[styles.inputLabel, { color: theme.secondaryText }]}>My goal in school last year was…</Text>
          <AutoResizingInput placeholder="Goal from last year..." value={schoolGoalLastYear} onChangeText={setSchoolGoalLastYear} style={[styles.blueUnderline, { color: theme.text }]} />

          <Text style={[styles.inputLabel, { color: theme.secondaryText, marginTop: 10 }]}>What's the status of the goal?</Text>
          <View style={styles.chipRow}>
            {["Accomplished", "Still working"].map((st) => (
              <TouchableOpacity
                key={st}
                style={[styles.gradeChip, schoolGoalStatus === st && { backgroundColor: gems.sapphire, borderColor: gems.sapphire }]}
                onPress={() => setSchoolGoalStatus(st)}
              >
                <Text style={[styles.chipText, schoolGoalStatus === st && { color: "#FFF" }]}>{st}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.inputLabel, { color: theme.secondaryText, marginTop: 10 }]}>Why was the goal important to you?</Text>
          <AutoResizingInput placeholder="Explain importance..." value={schoolGoalWhyImportant} onChangeText={setSchoolGoalWhyImportant} style={[styles.blueUnderline, { color: theme.text }]} />

          <Text style={[styles.inputLabel, { color: theme.secondaryText, marginTop: 10 }]}>One specific goal I would like to achieve in school by the end of this year:</Text>
          <AutoResizingInput placeholder="Goal for this year..." value={schoolGoalThisYear} onChangeText={setSchoolGoalThisYear} style={[styles.blueUnderline, { color: theme.text }]} />

          <Text style={[styles.inputLabel, { color: theme.secondaryText, marginTop: 10 }]}>How will I know I have achieved this goal?</Text>
          <AutoResizingInput placeholder="Indicators of success..." value={schoolGoalHowKnowAchieved} onChangeText={setSchoolGoalHowKnowAchieved} style={[styles.blueUnderline, { color: theme.text }]} />

          <Text style={[styles.subSectionTitle, { color: gems.sapphire }]}>To achieve this goal, things I need to do:</Text>
          <Text style={[styles.inputLabel, { color: theme.secondaryText }]}>A week from now:</Text>
          <TextInput style={[styles.input, { color: theme.text, borderColor: theme.border }]} value={schoolTimelineWeek} onChangeText={setSchoolTimelineWeek} />

          <Text style={[styles.inputLabel, { color: theme.secondaryText }]}>6 weeks from now:</Text>
          <TextInput style={[styles.input, { color: theme.text, borderColor: theme.border }]} value={schoolTimelineSixWeeks} onChangeText={setSchoolTimelineSixWeeks} />

          <Text style={[styles.inputLabel, { color: theme.secondaryText }]}>6 months from now:</Text>
          <TextInput style={[styles.input, { color: theme.text, borderColor: theme.border }]} value={schoolTimelineSixMonths} onChangeText={setSchoolTimelineSixMonths} />

          {/* Support 3 Columns */}
          <Text style={[styles.subSectionTitle, { color: gems.sapphire }]}>Things that will help me achieve this goal</Text>
          <View style={styles.threeColRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.colHeaderSmall}>My strengths</Text>
              {[0, 1, 2].map((idx) => (
                <TextInput key={idx} style={[styles.inputSmall, { color: theme.text }]} placeholder={`${idx + 1}...`} value={schoolStrengths[idx]} onChangeText={(v) => updateArrayItem(setSchoolStrengths, idx, v)} />
              ))}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.colHeaderSmall}>Home/Community</Text>
              {[0, 1, 2].map((idx) => (
                <TextInput key={idx} style={[styles.inputSmall, { color: theme.text }]} placeholder={`${idx + 1}...`} value={schoolHomeSupport[idx]} onChangeText={(v) => updateArrayItem(setSchoolHomeSupport, idx, v)} />
              ))}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.colHeaderSmall}>School Support</Text>
              {[0, 1, 2].map((idx) => (
                <TextInput key={idx} style={[styles.inputSmall, { color: theme.text }]} placeholder={`${idx + 1}...`} value={schoolSchoolSupport[idx]} onChangeText={(v) => updateArrayItem(setSchoolSchoolSupport, idx, v)} />
              ))}
            </View>
          </View>
        </GemCutCard>

        {/* SECTION 4: OUT-OF-SCHOOL GOALS! (Page 9) */}
        <GemCutCard style={{ marginBottom: 24 }} contentStyle={{ padding: 16 }}>
          <View style={styles.cardHeader}>
            <Ionicons name="globe-outline" size={20} color={gems.sapphire} />
            <Text style={[styles.sectionHeading, { color: gems.sapphire }]}>GOALS! (OUTSIDE OF SCHOOL)</Text>
          </View>

          <Text style={[styles.inputLabel, { color: theme.secondaryText }]}>My goal outside of school last year was…</Text>
          <AutoResizingInput placeholder="Outside goal from last year..." value={outGoalLastYear} onChangeText={setOutGoalLastYear} style={[styles.blueUnderline, { color: theme.text }]} />

          <Text style={[styles.inputLabel, { color: theme.secondaryText, marginTop: 10 }]}>What's the status of the goal?</Text>
          <View style={styles.chipRow}>
            {["Accomplished", "Still working"].map((st) => (
              <TouchableOpacity
                key={st}
                style={[styles.gradeChip, outGoalStatus === st && { backgroundColor: gems.sapphire, borderColor: gems.sapphire }]}
                onPress={() => setOutGoalStatus(st)}
              >
                <Text style={[styles.chipText, outGoalStatus === st && { color: "#FFF" }]}>{st}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.inputLabel, { color: theme.secondaryText, marginTop: 10 }]}>One specific goal I would like to achieve outside of school by the end of this year:</Text>
          <AutoResizingInput placeholder="Outside goal for this year..." value={outGoalThisYear} onChangeText={setOutGoalThisYear} style={[styles.blueUnderline, { color: theme.text }]} />

          <Text style={[styles.inputLabel, { color: theme.secondaryText, marginTop: 10 }]}>How will I know I have achieved this goal?</Text>
          <AutoResizingInput placeholder="Indicators of success..." value={outGoalHowKnowAchieved} onChangeText={setOutGoalHowKnowAchieved} style={[styles.blueUnderline, { color: theme.text }]} />

          <Text style={[styles.subSectionTitle, { color: gems.sapphire }]}>To achieve this goal, things I need to do:</Text>
          <Text style={[styles.inputLabel, { color: theme.secondaryText }]}>A week from now:</Text>
          <TextInput style={[styles.input, { color: theme.text, borderColor: theme.border }]} value={outTimelineWeek} onChangeText={setOutTimelineWeek} />

          <Text style={[styles.inputLabel, { color: theme.secondaryText }]}>6 weeks from now:</Text>
          <TextInput style={[styles.input, { color: theme.text, borderColor: theme.border }]} value={outTimelineSixWeeks} onChangeText={setOutTimelineSixWeeks} />

          <Text style={[styles.inputLabel, { color: theme.secondaryText }]}>6 months from now:</Text>
          <TextInput style={[styles.input, { color: theme.text, borderColor: theme.border }]} value={outTimelineSixMonths} onChangeText={setOutTimelineSixMonths} />

          {/* Support 3 Columns */}
          <Text style={[styles.subSectionTitle, { color: gems.sapphire }]}>Things that will help me achieve this goal</Text>
          <View style={styles.threeColRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.colHeaderSmall}>My strengths</Text>
              {[0, 1, 2].map((idx) => (
                <TextInput key={idx} style={[styles.inputSmall, { color: theme.text }]} placeholder={`${idx + 1}...`} value={outStrengths[idx]} onChangeText={(v) => updateArrayItem(setOutStrengths, idx, v)} />
              ))}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.colHeaderSmall}>Home/Community</Text>
              {[0, 1, 2].map((idx) => (
                <TextInput key={idx} style={[styles.inputSmall, { color: theme.text }]} placeholder={`${idx + 1}...`} value={outHomeSupport[idx]} onChangeText={(v) => updateArrayItem(setOutHomeSupport, idx, v)} />
              ))}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.colHeaderSmall}>School Support</Text>
              {[0, 1, 2].map((idx) => (
                <TextInput key={idx} style={[styles.inputSmall, { color: theme.text }]} placeholder={`${idx + 1}...`} value={outSchoolSupport[idx]} onChangeText={(v) => updateArrayItem(setOutSchoolSupport, idx, v)} />
              ))}
            </View>
          </View>

          <Text style={[styles.inputLabel, { color: theme.secondaryText, marginTop: 14 }]}>Why does this goal matter to you?</Text>
          <AutoResizingInput placeholder="Personal importance..." value={outGoalWhyMatter} onChangeText={setOutGoalWhyMatter} style={[styles.blueUnderline, { color: theme.text }]} />

          <Text style={[styles.inputLabel, { color: theme.secondaryText, marginTop: 10 }]}>Some goals I have achieved till date and I am proud of/happy with…</Text>
          <AutoResizingInput placeholder="List achievements you are proud of..." value={goalsAchievedProud} onChangeText={setGoalsAchievedProud} style={[styles.blueUnderline, { color: theme.text }]} />
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
              <Text style={styles.btnText}>PROCEED TO PART A3{"\n"}➔</Text>
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
  scrollContainer: { paddingHorizontal: 16, paddingTop: 10 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  sectionHeading: { fontSize: 14, fontWeight: '700', fontFamily: 'Outfit_600SemiBold', letterSpacing: 0.5 },
  subtitleNotice: { fontSize: 11, fontStyle: 'italic', color: '#888', marginBottom: 10 },
  subSectionTitle: { fontSize: 12, fontWeight: '700', fontFamily: 'Outfit_600SemiBold', marginTop: 14, marginBottom: 6, textTransform: 'uppercase' },
  inputLabel: { fontSize: 11, fontFamily: 'Outfit_600SemiBold', marginTop: 8, marginBottom: 2 },
  input: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, fontSize: 12, fontFamily: 'Inter_400Regular', marginBottom: 4 },
  blueUnderline: { borderBottomColor: gems.sapphire, borderBottomWidth: 1.5, borderTopWidth: 0, borderLeftWidth: 0, borderRightWidth: 0, fontSize: 12 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4, marginBottom: 6 },
  gradeChip: { borderWidth: 1, borderColor: '#CCC', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 5 },
  chipText: { fontSize: 11, fontFamily: 'Outfit_600SemiBold', color: '#555' },
  ratingBarContainer: { marginVertical: 6, paddingHorizontal: 4 },
  gradientLine: { height: 4, borderRadius: 2, backgroundColor: gems.sapphire + '40' },
  ratingDotsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: -10 },
  ratingDot: { width: 16, height: 16, borderRadius: 8, backgroundColor: '#DDD' },
  ratingLabelsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  twoColumnTable: { flexDirection: 'row', gap: 10 },
  colHeader: { fontSize: 11, fontWeight: '700', fontFamily: 'Outfit_600SemiBold', marginBottom: 6, textAlign: 'center' },
  threeColRow: { flexDirection: 'row', gap: 6 },
  colHeaderSmall: { fontSize: 10, fontWeight: '700', fontFamily: 'Outfit_600SemiBold', textAlign: 'center', marginBottom: 4 },
  inputSmall: { borderWidth: 1, borderColor: '#DDD', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 4, fontSize: 10, marginBottom: 4 },
  buttonCol: { alignItems: 'center', marginTop: 10 },
  btnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'Outfit_600SemiBold',
    letterSpacing: 1.5,
    textAlign: 'center',
  },
});
