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
import AnimatedTabBar from "../../components/AnimatedTabBar";
import { gems } from "../../colour_themes";
import useAutoSave from "../../hooks/useAutoSave";
import { getPartBRoute } from "../../utils/stageRouter";

// Categorized Online & College Courses List (Page 16)
const CATEGORIZED_COURSES = [
  {
    category: "💻 Technology & Computing",
    courses: [
      { name: "Coding & Software Engineering", icon: "code-slash-outline" },
      { name: "Computational Thinking & Algorithms", icon: "hardware-chip-outline" },
      { name: "Data Science & Artificial Intelligence", icon: "analytics-outline" },
      { name: "Cybersecurity Fundamentals", icon: "shield-checkmark-outline" },
      { name: "Web & Mobile App Development", icon: "phone-portrait-outline" },
    ],
  },
  {
    category: "💼 Business, Finance & Management",
    courses: [
      { name: "Entrepreneurship & Startup Management", icon: "trending-up-outline" },
      { name: "Digital Marketing & E-Commerce", icon: "megaphone-outline" },
      { name: "Financial Literacy & Investment Basics", icon: "cash-outline" },
      { name: "Business Economics & Analytics", icon: "pie-chart-outline" },
      { name: "Accounting & Commerce", icon: "calculator-outline" },
    ],
  },
  {
    category: "🔬 Science, Engineering & Healthcare",
    courses: [
      { name: "Fundamentals of Neuroscience", icon: "bulb-outline" },
      { name: "Health & Nutrition Literacy", icon: "fitness-outline" },
      { name: "Biotechnology & Bio-Sciences", icon: "flask-outline" },
      { name: "Environmental Science & Sustainability", icon: "leaf-outline" },
      { name: "Physics, Chemistry & Mathematics (PCM)", icon: "telescope-outline" },
      { name: "Physics, Chemistry & Biology (PCB)", icon: "medical-outline" },
    ],
  },
  {
    category: "🗣️ Humanities, Communication & Social Sciences",
    courses: [
      { name: "Public Speaking & Storytelling", icon: "mic-outline" },
      { name: "Formal, Technical & Creative Writing", icon: "create-outline" },
      { name: "Citizen Politics & Political Science", icon: "newspaper-outline" },
      { name: "Psychology & Human Behavior", icon: "headset-outline" },
      { name: "Ethics, Logic & Critical Reasoning", icon: "help-circle-outline" },
      { name: "History, Civics & Geography", icon: "earth-outline" },
      { name: "Languages & Literature", icon: "language-outline" },
    ],
  },
  {
    category: "🎨 Arts, Design & Media",
    courses: [
      { name: "Artistic Literacy & Fine Arts", icon: "color-palette-outline" },
      { name: "Graphic Design & UI/UX", icon: "brush-outline" },
      { name: "Film Production & Digital Media", icon: "videocam-outline" },
      { name: "Music & Performing Arts", icon: "musical-notes-outline" },
    ],
  },
  {
    category: "🏛️ Values, Governance & Society",
    courses: [
      { name: "Values, Ethics & Fundamental Duties", icon: "hand-left-outline" },
      { name: "Citizenship Values & Constitutional Studies", icon: "ribbon-outline" },
      { name: "Gender Sensitivity & Inclusivity", icon: "people-outline" },
      { name: "Mental Wellness & Self-Care", icon: "heart-outline" },
    ],
  },
  {
    category: "🛠️ Vocational & Skill Courses",
    courses: [
      { name: "Agriculture & Food Science", icon: "leaf-outline" },
      { name: "Hospitality & Tourism Management", icon: "bed-outline" },
      { name: "Automobile Technology", icon: "car-outline" },
      { name: "Beauty & Wellness", icon: "sparkles-outline" },
      { name: "Construction & Engineering Drawing", icon: "construct-outline" },
      { name: "Fashion Design & Textile Technology", icon: "shirt-outline" },
    ],
  },
];

export default function TeacherRemarks() {
  const { theme } = useTheme();
  const { user, profile, setProfile: setAuthProfile, activeStudentId, activeStudentProfile, setActiveStudentProfile } = useAuth();
  const router = useRouter();

  const isTeacher = user?.role === 'teacher' || user?.role === 'superadmin';
  const targetUserId = activeStudentId || user?.id;
  const targetProfile = activeStudentProfile || profile;

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0); // 0: Skills for Life, 1: Online Courses Plan

  // --- TAB 0: SKILLS FOR LIFE (PDF Page 15) ---
  const [lifeSkillLearned, setLifeSkillLearned] = useState("");
  const [lifeSkillExperiences, setLifeSkillExperiences] = useState("");
  const [whySkillImportant, setWhySkillImportant] = useState("");
  const [anotherSkillToDevelop, setAnotherSkillToDevelop] = useState("");

  // --- TAB 1: ONLINE COURSES PLAN (PDF Page 16) ---
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [teacherConsultNotes, setTeacherConsultNotes] = useState("");
  const [customPlannedCourse, setCustomPlannedCourse] = useState("");

  // Load Saved Data
  useEffect(() => {
    if (targetProfile) {
      let assess = {};
      try {
        assess = typeof targetProfile.assessments === 'string'
          ? JSON.parse(targetProfile.assessments || '{}')
          : (targetProfile.assessments || {});
      } catch (e) {
        console.warn('[SkillsForLife S4] assessments parse error:', e);
      }
      const a6 = assess.a6_s4 || {};

      setLifeSkillLearned(a6.lifeSkillLearned || "");
      setLifeSkillExperiences(a6.lifeSkillExperiences || "");
      setWhySkillImportant(a6.whySkillImportant || "");
      setAnotherSkillToDevelop(a6.anotherSkillToDevelop || "");

      setSelectedCourses(a6.selectedCourses || []);
      setTeacherConsultNotes(a6.teacherConsultNotes || "");
      setCustomPlannedCourse(a6.customPlannedCourse || "");
    }
  }, [targetProfile]);

  // AutoSave Payload
  const getSavePayload = useCallback(() => {
    return {
      userId: targetUserId,
      registrationNumber: targetProfile?.registration_number,
      role: user?.role || 'student',
      assessments: {
        a6_s4: {
          lifeSkillLearned, lifeSkillExperiences, whySkillImportant, anotherSkillToDevelop,
          selectedCourses, teacherConsultNotes, customPlannedCourse,
        }
      }
    };
  }, [
    targetUserId, targetProfile, user,
    lifeSkillLearned, lifeSkillExperiences, whySkillImportant, anotherSkillToDevelop,
    selectedCourses, teacherConsultNotes, customPlannedCourse,
  ]);

  const { triggerSave } = useAutoSave(targetUserId, getSavePayload, [
    targetUserId, targetProfile, user,
    lifeSkillLearned, lifeSkillExperiences, whySkillImportant, anotherSkillToDevelop,
    selectedCourses, teacherConsultNotes, customPlannedCourse,
  ]);

  const handleSave = async () => {
    setLoading(true);
    try {
      await triggerSave();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = async () => {
    setLoading(true);
    try {
      await triggerSave();
      router.push('/part_b_s4/SelectionPage');
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Could not save. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleCourse = (courseName) => {
    setSelectedCourses((prev) =>
      prev.includes(courseName) ? prev.filter((c) => c !== courseName) : [...prev, courseName]
    );
  };

  const renderTabContent = () => {
    if (activeTab === 0) {
      // SKILLS FOR LIFE (Page 15)
      return (
        <View style={styles.tabContentContainer}>
          <Text style={[styles.sectionDesc, { color: theme.secondaryText }]}>
            We develop lots of important skills in our school years. Some of them are useful in school, but some of them are "life skills" that will be important to us in the future, no matter what we do. Think about one important life skill that you have gained and fill out the boxes below.
          </Text>

          <GemCutCard style={{ marginBottom: 14 }} contentStyle={{ padding: 14, gap: 12 }}>
            <Text style={[styles.cardLabel, { color: gems.sapphire }]}>1. One important life skill you have learned at home, school or in the community:</Text>
            <AutoResizingInput
              placeholder="Name of the life skill..."
              value={lifeSkillLearned}
              onChangeText={setLifeSkillLearned}
              minHeight={45}
              style={[styles.blueUnderline, { color: theme.text }]}
            />

            <Text style={[styles.cardLabel, { color: gems.sapphire, marginTop: 8 }]}>2. Experiences at home, school or in the community that helped you develop the skill:</Text>
            <AutoResizingInput
              placeholder="Describe experiences..."
              value={lifeSkillExperiences}
              onChangeText={setLifeSkillExperiences}
              minHeight={60}
              style={[styles.blueUnderline, { color: theme.text }]}
            />

            <Text style={[styles.cardLabel, { color: gems.sapphire, marginTop: 8 }]}>3. Why is this skill important to you?</Text>
            <AutoResizingInput
              placeholder="Explain why it matters..."
              value={whySkillImportant}
              onChangeText={setWhySkillImportant}
              minHeight={60}
              style={[styles.blueUnderline, { color: theme.text }]}
            />

            <Text style={[styles.cardLabel, { color: gems.sapphire, marginTop: 8 }]}>4. What is another life skill you would like to develop and why do you think it will be important to you?</Text>
            <AutoResizingInput
              placeholder="Describe another skill to develop..."
              value={anotherSkillToDevelop}
              onChangeText={setAnotherSkillToDevelop}
              minHeight={70}
              style={[styles.blueUnderline, { color: theme.text }]}
            />
          </GemCutCard>
        </View>
      );
    }

    // ONLINE COURSES PLAN (Page 16)
    return (
      <View style={styles.tabContentContainer}>
        <GemCutCard style={{ marginBottom: 14 }} contentStyle={{ padding: 12, gap: 6 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, padding: 10, borderRadius: 8, backgroundColor: gems.sapphire + '15' }}>
            <Ionicons name="information-circle-outline" size={18} color={gems.sapphire} />
            <Text style={[styles.alertText, { color: gems.sapphire }]}>
              In consultation with your teacher/counsellor, select the online courses or subjects you plan to pursue after school. Tap to select/deselect.
            </Text>
          </View>
        </GemCutCard>

        {CATEGORIZED_COURSES.map((cat, catIdx) => (
          <GemCutCard key={catIdx} style={{ marginBottom: 14 }} contentStyle={{ padding: 14 }}>
            <Text style={[styles.categoryTitle, { color: gems.sapphire }]}>{cat.category}</Text>
            <View style={styles.coursesGrid}>
              {cat.courses.map((course, idx) => {
                const selected = selectedCourses.includes(course.name);
                return (
                  <TouchableOpacity
                    key={idx}
                    style={[
                      styles.courseCard,
                      {
                        borderColor: selected ? gems.sapphire : theme.border,
                        backgroundColor: selected ? gems.sapphire + '12' : 'transparent',
                      },
                    ]}
                    onPress={() => toggleCourse(course.name)}
                  >
                    <Ionicons name={course.icon} size={18} color={selected ? gems.sapphire : theme.secondaryText} />
                    <Text style={[styles.courseText, { color: selected ? gems.sapphire : theme.text }]}>{course.name}</Text>
                    {selected && <Ionicons name="checkmark-circle" size={14} color={gems.sapphire} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </GemCutCard>
        ))}

        {/* Custom Course Input */}
        <GemCutCard style={{ marginBottom: 14 }} contentStyle={{ padding: 14 }}>
          <Text style={[styles.cardLabel, { color: gems.sapphire }]}>Any other course / subject I want to pursue:</Text>
          <AutoResizingInput
            placeholder="Type any other course..."
            value={customPlannedCourse}
            onChangeText={setCustomPlannedCourse}
            minHeight={45}
            style={[styles.blueUnderline, { color: theme.text }]}
          />
        </GemCutCard>

        {/* Teacher Consultation Notes */}
        <GemCutCard style={{ marginBottom: 14 }} contentStyle={{ padding: 14 }}>
          <Text style={[styles.cardLabel, { color: gems.sapphire }]}>Teacher / Counsellor Consultation Notes:</Text>
          <AutoResizingInput
            placeholder="Notes from the teacher/counsellor regarding course selection..."
            value={teacherConsultNotes}
            onChangeText={setTeacherConsultNotes}
            minHeight={80}
            style={[styles.blueUnderline, { color: theme.text }]}
          />
        </GemCutCard>

        {/* Summary of selected courses */}
        {selectedCourses.length > 0 && (
          <GemCutCard style={{ marginBottom: 14 }} contentStyle={{ padding: 14 }}>
            <Text style={[styles.cardLabel, { color: gems.sapphire, marginBottom: 8 }]}>
              ✅ Selected Courses ({selectedCourses.length})
            </Text>
            {selectedCourses.map((c, idx) => (
              <Text key={idx} style={[styles.selectedCourseItem, { color: theme.text }]}>• {c}</Text>
            ))}
          </GemCutCard>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} />
      <PremiumBackground gemColor={gems.sapphire} />

      <View style={styles.headerNav}>
        <MenuDropdown />
        <View style={styles.titleContainer}>
          <Text style={[styles.headerTitle, { color: gems.sapphire }]}>PART A (6)</Text>
          <Text style={[styles.headerSub, { color: theme.secondaryText }]}>SKILLS FOR LIFE & ONLINE COURSES</Text>
        </View>
        <View style={styles.iconBtn} />
      </View>

      {/* Tab Bar */}
      <AnimatedTabBar
        tabs={["SKILLS FOR LIFE", "COURSES PLAN"]}
        activeIndex={activeTab}
        onTabChange={setActiveTab}
      />

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {renderTabContent()}

        {/* FINISH / SAVE BUTTON */}
        <View style={styles.buttonCol}>
          {activeTab === 0 ? (
            <GemButton
              onPress={() => { handleSave(); setActiveTab(1); }}
              gemType="sapphire"
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.btnText}>NEXT: COURSES PLAN{"\n"}➔</Text>
              )}
            </GemButton>
          ) : (
            <GemButton
              onPress={handleFinish}
              gemType="sapphire"
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.btnText}>PROCEED TO PART B{"\n"}➔</Text>
              )}
            </GemButton>
          )}
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
    textTransform: 'uppercase',
  },
  container: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 60,
  },
  tabContentContainer: {
    marginTop: 10,
  },
  sectionDesc: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    lineHeight: 16,
    marginBottom: 12,
  },
  alertText: {
    fontSize: 11,
    fontFamily: 'Outfit_600SemiBold',
    flex: 1,
  },
  categoryTitle: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'Outfit_600SemiBold',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  cardLabel: {
    fontSize: 11,
    fontFamily: 'Outfit_600SemiBold',
    lineHeight: 16,
  },
  blueUnderline: {
    borderBottomColor: gems.sapphire,
    borderBottomWidth: 1.5,
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
  },
  coursesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  courseCard: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderRadius: 10,
    padding: 10,
  },
  courseText: {
    fontSize: 10,
    fontFamily: 'Outfit_600SemiBold',
    flex: 1,
  },
  selectedCourseItem: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    marginBottom: 4,
    lineHeight: 16,
  },
  buttonCol: {
    marginTop: 24,
    alignItems: 'center',
    width: '100%',
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
