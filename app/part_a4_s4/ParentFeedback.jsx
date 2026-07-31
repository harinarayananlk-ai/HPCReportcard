import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  TextInput,
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

export default function ParentFeedback() {
  const { theme } = useTheme();
  const { user, profile, setProfile: setAuthProfile, activeStudentId, activeStudentProfile, setActiveStudentProfile } = useAuth();
  const router = useRouter();

  const isTeacher = user?.role === 'teacher' || user?.role === 'superadmin';
  const targetUserId = activeStudentId || user?.id;
  const targetProfile = activeStudentProfile || profile;

  const [loading, setLoading] = useState(false);

  // --- PDF PAGE 12: AFTER SCHOOL PLANS ---
  const [selectedPlanOption, setSelectedPlanOption] = useState("college"); // 'college' | 'skill_training' | 'prep_admission' | 'other'
  const [otherPlanText, setOtherPlanText] = useState("");

  // Institute / College Route
  const [instituteName, setInstituteName] = useState("");
  const [courseName, setCourseName] = useState("");
  const [courseType, setCourseType] = useState("Degree"); // 'Certificate' | 'Diploma' | 'Degree'

  // Work Preferences Route
  const [workPreference, setWorkPreference] = useState("private"); // 'private' | 'own_business' | 'family_business' | 'government' | 'other'
  const [otherWorkText, setOtherWorkText] = useState("");

  // 3 Discussion Points
  const [strengthsHelpful, setStrengthsHelpful] = useState("");
  const [needToImprove, setNeedToImprove] = useState("");
  const [challengesFaced, setChallengesFaced] = useState("");

  // --- PDF PAGE 13: FUTURE SELF & FEELINGS ---
  const [futureImproveSelf, setFutureImproveSelf] = useState("");
  const [futureSupportFamily, setFutureSupportFamily] = useState("");
  const [futureImproveSociety, setFutureImproveSociety] = useState("");

  // Ratings for feelings about future
  const [feelPrepared, setFeelPrepared] = useState(4); // 1-5
  const [feelExcited, setFeelExcited] = useState(4);
  const [feelConfident, setFeelConfident] = useState(4);
  const [feelCurious, setFeelCurious] = useState(4);

  const [whyFeelSo, setWhyFeelSo] = useState("");
  const [parentsFeedbackText, setParentsFeedbackText] = useState("");

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

      const a4 = assess.a4_s4 || {};
      setSelectedPlanOption(a4.selectedPlanOption || "college");
      setOtherPlanText(a4.otherPlanText || "");
      setInstituteName(a4.instituteName || "");
      setCourseName(a4.courseName || "");
      setCourseType(a4.courseType || "Degree");
      setWorkPreference(a4.workPreference || "private");
      setOtherWorkText(a4.otherWorkText || "");

      setStrengthsHelpful(a4.strengthsHelpful || "");
      setNeedToImprove(a4.needToImprove || "");
      setChallengesFaced(a4.challengesFaced || "");

      setFutureImproveSelf(a4.futureImproveSelf || "");
      setFutureSupportFamily(a4.futureSupportFamily || "");
      setFutureImproveSociety(a4.futureImproveSociety || "");

      setFeelPrepared(a4.feelPrepared || 4);
      setFeelExcited(a4.feelExcited || 4);
      setFeelConfident(a4.feelConfident || 4);
      setFeelCurious(a4.feelCurious || 4);

      setWhyFeelSo(a4.whyFeelSo || "");
      setParentsFeedbackText(a4.parentsFeedbackText || "");
    }
  }, [targetProfile]);

  // AutoSave Payload
  const getSavePayload = useCallback(() => {
    return {
      userId: targetUserId,
      registrationNumber: targetProfile?.registration_number,
      assessments: {
        a4_s4: {
          selectedPlanOption, otherPlanText, instituteName, courseName, courseType,
          workPreference, otherWorkText, strengthsHelpful, needToImprove, challengesFaced,
          futureImproveSelf, futureSupportFamily, futureImproveSociety,
          feelPrepared, feelExcited, feelConfident, feelCurious, whyFeelSo, parentsFeedbackText
        }
      }
    };
  }, [
    targetUserId, targetProfile, selectedPlanOption, otherPlanText, instituteName, courseName, courseType,
    workPreference, otherWorkText, strengthsHelpful, needToImprove, challengesFaced,
    futureImproveSelf, futureSupportFamily, futureImproveSociety,
    feelPrepared, feelExcited, feelConfident, feelCurious, whyFeelSo, parentsFeedbackText
  ]);

  const { triggerSave } = useAutoSave(targetUserId, getSavePayload, [
    targetUserId, targetProfile, selectedPlanOption, otherPlanText, instituteName, courseName, courseType,
    workPreference, otherWorkText, strengthsHelpful, needToImprove, challengesFaced,
    futureImproveSelf, futureSupportFamily, futureImproveSociety,
    feelPrepared, feelExcited, feelConfident, feelCurious, whyFeelSo, parentsFeedbackText
  ]);

  const handleSaveAndProceed = async () => {
    setLoading(true);
    try {
      await triggerSave();
      router.push("/part_a5_s4/CoCurricular");
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

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
          <Text style={[styles.headerTitle, { color: gems.sapphire }]}>PART A (4)</Text>
          <Text style={[styles.headerSub, { color: theme.secondaryText }]}>PLANS AFTER SCHOOL & PARENT FEEDBACK</Text>
        </View>
        <View style={styles.iconBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* SECTION 1: PLANS AFTER SCHOOL (Page 12) */}
        <GemCutCard style={{ marginBottom: 16 }} contentStyle={{ padding: 16 }}>
          <View style={styles.cardHeader}>
            <Ionicons name="rocket-outline" size={20} color={gems.sapphire} />
            <Text style={[styles.sectionHeading, { color: gems.sapphire }]}>THE NEXT BIG STEP OF MY LIFE</Text>
          </View>
          <Text style={[styles.inputLabel, { color: theme.secondaryText }]}>After I finish school, I want to…</Text>

          <View style={styles.optionList}>
            {[
              { id: "college", label: "Go to college for a general education" },
              { id: "skill_training", label: "Take up a skill training full time/part time" },
              { id: "prep_admission", label: "Prepare for my next step for admission in a professional institute/college" },
              { id: "other", label: "Any other, please specify" },
            ].map((opt) => (
              <TouchableOpacity
                key={opt.id}
                style={[
                  styles.optionRadio,
                  selectedPlanOption === opt.id && { borderColor: gems.sapphire, backgroundColor: gems.sapphire + '10' },
                ]}
                onPress={() => setSelectedPlanOption(opt.id)}
              >
                <Ionicons
                  name={selectedPlanOption === opt.id ? "radio-button-on" : "radio-button-off"}
                  size={18}
                  color={gems.sapphire}
                />
                <Text style={[styles.radioLabel, { color: theme.text }]}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {selectedPlanOption === "other" && (
            <AutoResizingInput
              placeholder="Specify other plan..."
              value={otherPlanText}
              onChangeText={setOtherPlanText}
              style={[styles.blueUnderline, { color: theme.text, marginTop: 6 }]}
            />
          )}

          {/* College / Institute Form */}
          <Text style={[styles.subSectionTitle, { color: gems.sapphire }]}>I plan to go to college / Skill institute / professional institute</Text>
          
          <Text style={[styles.inputLabel, { color: theme.secondaryText }]}>College / Skill Institute / Professional Institute:</Text>
          <TextInput style={[styles.input, { color: theme.text, borderColor: theme.border }]} value={instituteName} onChangeText={setInstituteName} />

          <Text style={[styles.inputLabel, { color: theme.secondaryText }]}>Course / Skill Training:</Text>
          <TextInput style={[styles.input, { color: theme.text, borderColor: theme.border }]} value={courseName} onChangeText={setCourseName} />

          <Text style={[styles.inputLabel, { color: theme.secondaryText }]}>Type of Course:</Text>
          <View style={styles.chipRow}>
            {["Certificate", "Diploma", "Degree"].map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.gradeChip, courseType === t && { backgroundColor: gems.sapphire, borderColor: gems.sapphire }]}
                onPress={() => setCourseType(t)}
              >
                <Text style={[styles.chipText, courseType === t && { color: "#FFF" }]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Skill-Based Work Preferences */}
          <Text style={[styles.subSectionTitle, { color: gems.sapphire }]}>I plan to pursue a skill-based course. I would like to work…</Text>
          <View style={styles.optionList}>
            {[
              { id: "private", label: "In a corporation or private business" },
              { id: "own_business", label: "In my own business" },
              { id: "family_business", label: "In my family business" },
              { id: "government", label: "In government" },
              { id: "other", label: "Any other" },
            ].map((opt) => (
              <TouchableOpacity
                key={opt.id}
                style={[
                  styles.optionRadio,
                  workPreference === opt.id && { borderColor: gems.sapphire, backgroundColor: gems.sapphire + '10' },
                ]}
                onPress={() => setWorkPreference(opt.id)}
              >
                <Ionicons
                  name={workPreference === opt.id ? "checkbox" : "square-outline"}
                  size={18}
                  color={gems.sapphire}
                />
                <Text style={[styles.radioLabel, { color: theme.text }]}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {workPreference === "other" && (
            <TextInput style={[styles.input, { color: theme.text, borderColor: theme.border, marginTop: 4 }]} value={otherWorkText} onChangeText={setOtherWorkText} placeholder="Specify other work preference..." />
          )}

          {/* 3 Discussion Points */}
          <Text style={[styles.subSectionTitle, { color: gems.sapphire }]}>Plan Discussion Points</Text>
          <Text style={[styles.inputLabel, { color: theme.secondaryText }]}>What strengths or abilities will be most helpful for you in fulfilling this plan?</Text>
          <AutoResizingInput placeholder="Strengths..." value={strengthsHelpful} onChangeText={setStrengthsHelpful} style={[styles.blueUnderline, { color: theme.text }]} />

          <Text style={[styles.inputLabel, { color: theme.secondaryText, marginTop: 8 }]}>What will you need to improve in order to achieve this plan?</Text>
          <AutoResizingInput placeholder="Areas to improve..." value={needToImprove} onChangeText={setNeedToImprove} style={[styles.blueUnderline, { color: theme.text }]} />

          <Text style={[styles.inputLabel, { color: theme.secondaryText, marginTop: 8 }]}>What challenges do you think you will face in fulfilling this plan?</Text>
          <AutoResizingInput placeholder="Anticipated challenges..." value={challengesFaced} onChangeText={setChallengesFaced} style={[styles.blueUnderline, { color: theme.text }]} />
        </GemCutCard>

        {/* SECTION 2: FUTURE SELF & FEELINGS (Page 13) */}
        <GemCutCard style={{ marginBottom: 16 }} contentStyle={{ padding: 16 }}>
          <View style={styles.cardHeader}>
            <Ionicons name="time-outline" size={20} color={gems.sapphire} />
            <Text style={[styles.sectionHeading, { color: gems.sapphire }]}>LET'S IMAGINE YOUR 'FUTURE SELF', 10 YEARS FROM NOW...</Text>
          </View>

          <Text style={[styles.inputLabel, { color: theme.secondaryText }]}>What will you be doing to improve yourself?</Text>
          <AutoResizingInput placeholder="Self improvement goals..." value={futureImproveSelf} onChangeText={setFutureImproveSelf} style={[styles.blueUnderline, { color: theme.text }]} />

          <Text style={[styles.inputLabel, { color: theme.secondaryText, marginTop: 8 }]}>What will you be doing to support your friends and family?</Text>
          <AutoResizingInput placeholder="Supporting friends & family..." value={futureSupportFamily} onChangeText={setFutureSupportFamily} style={[styles.blueUnderline, { color: theme.text }]} />

          <Text style={[styles.inputLabel, { color: theme.secondaryText, marginTop: 8 }]}>What will you be doing to improve society?</Text>
          <AutoResizingInput placeholder="Contributing to society..." value={futureImproveSociety} onChangeText={setFutureImproveSociety} style={[styles.blueUnderline, { color: theme.text }]} />

          <Text style={[styles.subSectionTitle, { color: gems.sapphire }]}>How do I feel about my future?</Text>
          <Text style={[styles.inputLabel, { color: theme.secondaryText }]}>Prepared:</Text>
          {renderRatingBar(feelPrepared, setFeelPrepared)}

          <Text style={[styles.inputLabel, { color: theme.secondaryText }]}>Excited:</Text>
          {renderRatingBar(feelExcited, setFeelExcited)}

          <Text style={[styles.inputLabel, { color: theme.secondaryText }]}>Confident:</Text>
          {renderRatingBar(feelConfident, setFeelConfident)}

          <Text style={[styles.inputLabel, { color: theme.secondaryText }]}>Curious:</Text>
          {renderRatingBar(feelCurious, setFeelCurious)}

          <Text style={[styles.inputLabel, { color: theme.secondaryText, marginTop: 10 }]}>Why do you think so?</Text>
          <AutoResizingInput placeholder="Explain your feelings..." value={whyFeelSo} onChangeText={setWhyFeelSo} style={[styles.blueUnderline, { color: theme.text }]} />
        </GemCutCard>

        {/* SECTION 3: PARENTS' FEEDBACK (Page 13) */}
        <GemCutCard style={{ marginBottom: 24 }} contentStyle={{ padding: 16 }}>
          <View style={styles.cardHeader}>
            <Ionicons name="heart-outline" size={20} color={gems.sapphire} />
            <Text style={[styles.sectionHeading, { color: gems.sapphire }]}>PARENTS' FEEDBACK</Text>
          </View>
          <Text style={[styles.inputLabel, { color: theme.secondaryText }]}>Parent's / Guardian's comments & guidance on student's future plans:</Text>
          <AutoResizingInput
            placeholder="Parent feedback, observations, and encouraging words..."
            value={parentsFeedbackText}
            onChangeText={setParentsFeedbackText}
            minHeight={90}
            style={[styles.blueUnderline, { color: theme.text }]}
          />
        </GemCutCard>

        {/* PROCEED BUTTON */}
        <View style={styles.buttonCol}>
          <GemButton onPress={handleSaveAndProceed} gemType="sapphire" disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.btnText}>PROCEED TO PART A5{"\n"}➔</Text>
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
  headerTitle: { fontSize: 20, fontWeight: '300', fontFamily: 'Inter_400Regular', letterSpacing: 2, textAlign: 'center' },
  headerSub: { fontSize: 9, fontFamily: 'Inter_400Regular', letterSpacing: 1, marginTop: 2, textAlign: 'center' },
  scrollContainer: { paddingHorizontal: 16, paddingTop: 10 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  sectionHeading: { fontSize: 13, fontWeight: '700', fontFamily: 'Outfit_600SemiBold', letterSpacing: 0.5 },
  subSectionTitle: { fontSize: 11, fontWeight: '700', fontFamily: 'Outfit_600SemiBold', marginTop: 14, marginBottom: 6, textTransform: 'uppercase' },
  inputLabel: { fontSize: 11, fontFamily: 'Outfit_600SemiBold', marginTop: 8, marginBottom: 2 },
  input: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, fontSize: 12, fontFamily: 'Inter_400Regular', marginBottom: 4 },
  blueUnderline: { borderBottomColor: gems.sapphire, borderBottomWidth: 1.5, borderTopWidth: 0, borderLeftWidth: 0, borderRightWidth: 0, fontSize: 12 },
  optionList: { gap: 6, marginVertical: 4 },
  optionRadio: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 8, borderWidth: 1, borderColor: '#DDD', borderRadius: 8 },
  radioLabel: { fontSize: 11, fontFamily: 'Outfit_600SemiBold' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4, marginBottom: 6 },
  gradeChip: { borderWidth: 1, borderColor: '#CCC', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 5 },
  chipText: { fontSize: 11, fontFamily: 'Outfit_600SemiBold', color: '#555' },
  ratingBarContainer: { marginVertical: 4, paddingHorizontal: 4 },
  gradientLine: { height: 4, borderRadius: 2, backgroundColor: gems.sapphire + '40' },
  ratingDotsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: -10 },
  ratingDot: { width: 16, height: 16, borderRadius: 8, backgroundColor: '#DDD' },
  ratingLabelsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
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
