import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  ScrollView,
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

const STATEMENTS = [
  "1. I like following a schedule.",
  "2. I get distracted and do not start my tasks on time.",
  "3. I do things at the last minute.",
  "4. I can figure out how much time assignments and projects will take.",
  "5. I am good at deciding which tasks to do first.",
];

const RATING_OPTIONS = ["Rarely", "Sometimes", "Usually", "Almost Always"];

export default function AmbitionCard() {
  const { theme } = useTheme();
  const { user, profile, setProfile: setAuthProfile, activeStudentId, activeStudentProfile, setActiveStudentProfile } = useAuth();
  const router = useRouter();

  const isTeacher = user?.role === 'teacher' || user?.role === 'superadmin';
  const targetUserId = activeStudentId || user?.id;
  const targetProfile = activeStudentProfile || profile;

  const [loading, setLoading] = useState(false);

  // --- PDF PAGE 10: RATING TABLE ---
  const [statementRatings, setStatementRatings] = useState({
    0: "Usually",
    1: "Sometimes",
    2: "Rarely",
    3: "Usually",
    4: "Almost Always",
  });

  // --- MY TIME HABITS ---
  const [bestTimeStudy, setBestTimeStudy] = useState("");
  const [bestTimePlay, setBestTimePlay] = useState("");
  const [bestTimeRelax, setBestTimeRelax] = useState("");
  const [bestTimeFamily, setBestTimeFamily] = useState("");
  const [schoolworkTime, setSchoolworkTime] = useState("");
  const [fitnessTime, setFitnessTime] = useState("");
  const [wellbeingTime, setWellbeingTime] = useState("");
  const [fitnessActivities, setFitnessActivities] = useState("");
  const [otherTime, setOtherTime] = useState("");
  const [todoListUsage, setTodoListUsage] = useState("");

  // --- PDF PAGE 11: TIME MAP & TIME ADJUSTMENT ---
  const [spendMoreTimeOn, setSpendMoreTimeOn] = useState("");
  const [spendLessTimeOn, setSpendLessTimeOn] = useState("");
  const [amSchedule, setAmSchedule] = useState("");
  const [pmSchedule, setPmSchedule] = useState("");
  const [peerScheduleComments, setPeerScheduleComments] = useState("");

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

      const a3 = assess.a3_s4 || {};
      if (a3.statementRatings) setStatementRatings(a3.statementRatings);
      setBestTimeStudy(a3.bestTimeStudy || "");
      setBestTimePlay(a3.bestTimePlay || "");
      setBestTimeRelax(a3.bestTimeRelax || "");
      setBestTimeFamily(a3.bestTimeFamily || "");
      setSchoolworkTime(a3.schoolworkTime || "");
      setFitnessTime(a3.fitnessTime || "");
      setWellbeingTime(a3.wellbeingTime || "");
      setFitnessActivities(a3.fitnessActivities || "");
      setOtherTime(a3.otherTime || "");
      setTodoListUsage(a3.todoListUsage || "");

      setSpendMoreTimeOn(a3.spendMoreTimeOn || "");
      setSpendLessTimeOn(a3.spendLessTimeOn || "");
      setAmSchedule(a3.amSchedule || "");
      setPmSchedule(a3.pmSchedule || "");
      setPeerScheduleComments(a3.peerScheduleComments || "");
    }
  }, [targetProfile]);

  const handleRatingChange = (stmtIdx, option) => {
    setStatementRatings((prev) => ({ ...prev, [stmtIdx]: option }));
  };

  // AutoSave Payload
  const getSavePayload = () => {
    return {
      userId: targetUserId,
      registrationNumber: targetProfile?.registration_number,
      assessments: {
        a3_s4: {
          statementRatings, bestTimeStudy, bestTimePlay, bestTimeRelax, bestTimeFamily,
          schoolworkTime, fitnessTime, wellbeingTime, fitnessActivities, otherTime, todoListUsage,
          spendMoreTimeOn, spendLessTimeOn, amSchedule, pmSchedule, peerScheduleComments
        }
      }
    };
  };

  const { triggerSave } = useAutoSave(targetUserId, getSavePayload, [
    targetUserId, targetProfile, statementRatings, bestTimeStudy, bestTimePlay, bestTimeRelax, bestTimeFamily,
    schoolworkTime, fitnessTime, wellbeingTime, fitnessActivities, otherTime, todoListUsage,
    spendMoreTimeOn, spendLessTimeOn, amSchedule, pmSchedule, peerScheduleComments
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
      Alert.alert("Saved", "Part A(3) Time Management saved!");
      router.push("/part_a4_s4/ParentFeedback");
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Server error while saving.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} />
      <PremiumBackground gemColor={gems.sapphire} />

      <View style={styles.headerNav}>
        <MenuDropdown />
        <View style={styles.titleContainer}>
          <Text style={[styles.headerTitle, { color: gems.sapphire }]}>PART A (3)</Text>
          <Text style={[styles.headerSub, { color: theme.secondaryText }]}>TIME MANAGEMENT</Text>
        </View>
        <View style={styles.iconBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* SECTION 1: TIME MANAGEMENT STATEMENTS (Page 10) */}
        <GemCutCard style={{ marginBottom: 16 }} contentStyle={{ padding: 16 }}>
          <View style={styles.cardHeader}>
            <Ionicons name="time-outline" size={20} color={gems.sapphire} />
            <Text style={[styles.sectionHeading, { color: gems.sapphire }]}>TIME MANAGEMENT REFLECTION</Text>
          </View>
          <Text style={styles.subtitleNotice}>Tick (✓) the most appropriate option.</Text>

          {STATEMENTS.map((stmt, idx) => (
            <View key={idx} style={styles.statementBox}>
              <Text style={[styles.statementText, { color: theme.text }]}>{stmt}</Text>
              <View style={styles.ratingOptionsRow}>
                {RATING_OPTIONS.map((opt) => {
                  const selected = statementRatings[idx] === opt;
                  return (
                    <TouchableOpacity
                      key={opt}
                      style={[
                        styles.optionChip,
                        selected && { backgroundColor: gems.sapphire, borderColor: gems.sapphire },
                      ]}
                      onPress={() => handleRatingChange(idx, opt)}
                    >
                      <Text style={[styles.optionText, selected && { color: "#FFF" }]}>{opt}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))}
        </GemCutCard>

        {/* SECTION 2: MY TIME HABITS (Page 10) */}
        <GemCutCard style={{ marginBottom: 16 }} contentStyle={{ padding: 16 }}>
          <View style={styles.cardHeader}>
            <Ionicons name="body-outline" size={20} color={gems.sapphire} />
            <Text style={[styles.sectionHeading, { color: gems.sapphire }]}>MY TIME HABITS</Text>
          </View>

          <Text style={[styles.subSectionTitle, { color: gems.sapphire }]}>What time of the day is best for you…</Text>
          <View style={styles.rowTwoCol}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.inputLabel, { color: theme.secondaryText }]}>… to study?</Text>
              <TextInput style={[styles.input, { color: theme.text, borderColor: theme.border }]} value={bestTimeStudy} onChangeText={setBestTimeStudy} placeholder="e.g. 6:00 AM - 8:00 AM" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.inputLabel, { color: theme.secondaryText }]}>… to play/exercise?</Text>
              <TextInput style={[styles.input, { color: theme.text, borderColor: theme.border }]} value={bestTimePlay} onChangeText={setBestTimePlay} placeholder="e.g. 5:00 PM - 6:30 PM" />
            </View>
          </View>

          <View style={styles.rowTwoCol}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.inputLabel, { color: theme.secondaryText }]}>… to relax?</Text>
              <TextInput style={[styles.input, { color: theme.text, borderColor: theme.border }]} value={bestTimeRelax} onChangeText={setBestTimeRelax} placeholder="e.g. 8:00 PM - 9:00 PM" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.inputLabel, { color: theme.secondaryText }]}>… to spend with friends/family?</Text>
              <TextInput style={[styles.input, { color: theme.text, borderColor: theme.border }]} value={bestTimeFamily} onChangeText={setBestTimeFamily} placeholder="e.g. Evening" />
            </View>
          </View>

          <Text style={[styles.inputLabel, { color: theme.secondaryText, marginTop: 10 }]}>How much time do you spend on schoolwork after school?</Text>
          <AutoResizingInput placeholder="Time spent..." value={schoolworkTime} onChangeText={setSchoolworkTime} style={[styles.blueUnderline, { color: theme.text }]} />

          <Text style={[styles.inputLabel, { color: theme.secondaryText, marginTop: 10 }]}>How much time do you spend on physical fitness?</Text>
          <AutoResizingInput placeholder="Fitness time..." value={fitnessTime} onChangeText={setFitnessTime} style={[styles.blueUnderline, { color: theme.text }]} />

          <Text style={[styles.inputLabel, { color: theme.secondaryText, marginTop: 10 }]}>How much time do you spend taking care of your emotional wellbeing?</Text>
          <AutoResizingInput placeholder="Wellbeing time..." value={wellbeingTime} onChangeText={setWellbeingTime} style={[styles.blueUnderline, { color: theme.text }]} />

          <Text style={[styles.inputLabel, { color: theme.secondaryText, marginTop: 10 }]}>What do you do to improve your physical and mental fitness?</Text>
          <AutoResizingInput placeholder="Activities done..." value={fitnessActivities} onChangeText={setFitnessActivities} style={[styles.blueUnderline, { color: theme.text }]} />

          <Text style={[styles.inputLabel, { color: theme.secondaryText, marginTop: 10 }]}>How much time do you spend on other things? (With friends, on phone, etc.)</Text>
          <AutoResizingInput placeholder="Other time..." value={otherTime} onChangeText={setOtherTime} style={[styles.blueUnderline, { color: theme.text }]} />

          <Text style={[styles.inputLabel, { color: theme.secondaryText, marginTop: 10 }]}>Do you make to-do lists for your daily tasks? Why / Why not?</Text>
          <AutoResizingInput placeholder="Explain to-do list habits..." value={todoListUsage} onChangeText={setTodoListUsage} style={[styles.blueUnderline, { color: theme.text }]} />
        </GemCutCard>

        {/* SECTION 3: TIME MAP & PEER COMMENTS (Page 11) */}
        <GemCutCard style={{ marginBottom: 24 }} contentStyle={{ padding: 16 }}>
          <View style={styles.cardHeader}>
            <Ionicons name="map-outline" size={20} color={gems.sapphire} />
            <Text style={[styles.sectionHeading, { color: gems.sapphire }]}>TIME MAP & ADJUSTMENT</Text>
          </View>

          <View style={styles.rowTwoCol}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.inputLabel, { color: gems.sapphire }]}>Spend MORE time on:</Text>
              <AutoResizingInput placeholder="More time on..." value={spendMoreTimeOn} onChangeText={setSpendMoreTimeOn} style={[styles.blueUnderline, { color: theme.text }]} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.inputLabel, { color: gems.sapphire }]}>Spend LESS time on:</Text>
              <AutoResizingInput placeholder="Less time on..." value={spendLessTimeOn} onChangeText={setSpendLessTimeOn} style={[styles.blueUnderline, { color: theme.text }]} />
            </View>
          </View>

          <Text style={[styles.subSectionTitle, { color: gems.sapphire }]}>Daily Schedule Map</Text>
          <Text style={[styles.inputLabel, { color: theme.secondaryText }]}>AM Schedule (Morning Activities):</Text>
          <AutoResizingInput placeholder="e.g. 6AM Wake up, 7AM Study, 8AM School..." value={amSchedule} onChangeText={setAmSchedule} minHeight={60} style={[styles.blueUnderline, { color: theme.text }]} />

          <Text style={[styles.inputLabel, { color: theme.secondaryText, marginTop: 10 }]}>PM Schedule (Afternoon / Evening Activities):</Text>
          <AutoResizingInput placeholder="e.g. 4PM Sports, 6PM Homework, 8PM Dinner..." value={pmSchedule} onChangeText={setPmSchedule} minHeight={60} style={[styles.blueUnderline, { color: theme.text }]} />

          <Text style={[styles.inputLabel, { color: theme.secondaryText, marginTop: 14 }]}>Peer Comments on your Schedule:</Text>
          <AutoResizingInput placeholder="Ask any peer to comment on your schedule..." value={peerScheduleComments} minHeight={50} style={[styles.blueUnderline, { color: theme.text }]} />
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
              <Text style={styles.btnText}>PROCEED TO PART A4{"\n"}➔</Text>
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
  sectionHeading: { fontSize: 14, fontWeight: '700', fontFamily: 'Outfit_600SemiBold', letterSpacing: 0.5 },
  subtitleNotice: { fontSize: 11, fontStyle: 'italic', color: '#888', marginBottom: 10 },
  subSectionTitle: { fontSize: 12, fontWeight: '700', fontFamily: 'Outfit_600SemiBold', marginTop: 14, marginBottom: 6, textTransform: 'uppercase' },
  inputLabel: { fontSize: 11, fontFamily: 'Outfit_600SemiBold', marginTop: 8, marginBottom: 2 },
  input: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, fontSize: 12, fontFamily: 'Inter_400Regular', marginBottom: 4 },
  blueUnderline: { borderBottomColor: gems.sapphire, borderBottomWidth: 1.5, borderTopWidth: 0, borderLeftWidth: 0, borderRightWidth: 0, fontSize: 12 },
  statementBox: { marginBottom: 12, paddingBottom: 8, borderBottomWidth: 0.5, borderBottomColor: '#EEE' },
  statementText: { fontSize: 11, fontFamily: 'Outfit_600SemiBold', marginBottom: 6 },
  ratingOptionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  optionChip: { borderWidth: 1, borderColor: '#CCC', borderRadius: 14, paddingHorizontal: 10, paddingVertical: 4 },
  optionText: { fontSize: 10, fontFamily: 'Outfit_600SemiBold', color: '#555' },
  rowTwoCol: { flexDirection: 'row', gap: 10 },
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
