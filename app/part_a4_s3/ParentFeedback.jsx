import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useTheme, useAuth, API_URL } from '../../context/GlobalContext';
import PremiumBackground from '../../components/PremiumBackground';
import SoundButton from '../../components/SoundButton';
import MenuDropdown from '../../components/MenuDropdown';
import GemButton from '../../components/GemButton';
import AnimatedTabBar from '../../components/AnimatedTabBar';
import ActionChip from '../../components/ActionChip';
import AutoResizingInput from '../../components/AutoResizingInput';
import { gems } from '../../colour_themes';

const UNDERSTANDING_RESOURCES = [
  { id: 'books', label: 'Books / Magazine' },
  { id: 'phone', label: 'Phone / Computer' },
  { id: 'newspaper', label: 'Newspaper' },
  { id: 'internet', label: 'Internet' },
  { id: 'toys', label: 'Toys / Games / Sports' },
];

const SUPPORTING_FOCUS_AREAS = [
  { id: 'languages', label: 'Languages(R1, R2, R3)' },
  { id: 'math', label: 'Mathematics' },
  { id: 'science', label: 'Science' },
  { id: 'social_science', label: 'Social Science' },
  { id: 'self_reliance', label: 'Building self- belief & self- reliance' },
  { id: 'emotions', label: 'Managing difficult emotions like anger' },
  { id: 'conflict_res', label: 'Developing social skills & conflict resolution' },
  { id: 'study_skills', label: 'Developing effective study skills like time management' },
  { id: 'vocational', label: 'Vocational Guidance/ Digital Literacy' },
  { id: 'other', label: 'Other' },
];

const PARENT_QUESTIONS = [
  { id: 'q1', text: 'My child seems motivated to learn and engage with new concepts learned at school.' },
  { id: 'q2', text: 'My child follows a schedule at home that includes curricular & extra-curricular activities, social connectivity, and screen time.' },
  { id: 'q3', text: 'My child finds the grade-level curriculum difficult and needs additional support.' },
  { id: 'q4', text: 'My child is making good progress as per his/her grade.' },
];

const OPTIONS = [
  { value: 'Yes', emoji: '😊' },
  { value: 'Sometimes', emoji: '🤔' },
  { value: 'No', emoji: '😟' },
  { value: 'Not Sure', emoji: '❓' },
];

export default function ParentFeedback() {
  const { theme } = useTheme();
  const { user, profile, activeStudentId, activeStudentProfile, setActiveStudentProfile } = useAuth();
  const router = useRouter();

  const isTeacher = user?.role === 'teacher' || user?.role === 'superadmin';
  const targetUserId = activeStudentId || user?.id;
  const targetProfile = activeStudentProfile || profile;

  // Local States
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  // Form Fields State
  // Tab 1: Understanding
  const [resources, setResources] = useState([]);
  const [surveyAnswers, setSurveyAnswers] = useState({});

  // Tab 2: Supporting
  const [focusAreas, setFocusAreas] = useState([]);
  const [otherSupportText, setOtherSupportText] = useState('');
  const [supportText, setSupportText] = useState('');

  // Load Saved Data
  useEffect(() => {
    if (targetProfile) {
      const assess = typeof targetProfile.assessments === 'string'
        ? JSON.parse(targetProfile.assessments || '{}')
        : (targetProfile.assessments || {});
      const a4 = assess.a4_s3 || {};

      if (a4.resources) setResources(a4.resources);
      if (a4.surveyAnswers) setSurveyAnswers(a4.surveyAnswers);
      if (a4.focusAreas) setFocusAreas(a4.focusAreas);
      setOtherSupportText(a4.otherSupportText || '');
      setSupportText(a4.supportText || '');
    }
  }, [targetProfile]);

  const handleSave = async (finalAssess = null) => {
    if (!targetUserId) return;
    setLoading(true);
    try {
      const currentAssess = typeof targetProfile?.assessments === 'string'
        ? JSON.parse(targetProfile.assessments || '{}')
        : (targetProfile?.assessments || {});

      const a4_s3 = finalAssess || {
        resources,
        surveyAnswers,
        focusAreas,
        otherSupportText,
        supportText,
      };

      const updatedAssess = { ...currentAssess, a4_s3 };

      const res = await fetch(`${API_URL}/students/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: targetUserId,
          registrationNumber: targetProfile?.registration_number,
          assessments: updatedAssess,
        }),
      });

      if (res.ok) {
        const updated = { ...targetProfile, assessments: updatedAssess };
        if (isTeacher && activeStudentId) setActiveStudentProfile(updated);
        else setActiveStudentProfile(updated);
        Alert.alert('Saved', 'Parent feedback responses saved!');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = async () => {
    const data = { resources, surveyAnswers, focusAreas, otherSupportText, supportText };
    await handleSave(data);
    Alert.alert('Completed', 'Parent feedback recorded successfully!', [
      { text: 'OK', onPress: () => router.push('/part_b_s3/SelectionPage') }
    ]);
  };

  const toggleResource = (id) => {
    if (resources.includes(id)) {
      setResources(resources.filter(item => item !== id));
    } else {
      setResources([...resources, id]);
    }
  };

  const toggleFocusArea = (id) => {
    if (focusAreas.includes(id)) {
      setFocusAreas(focusAreas.filter(item => item !== id));
    } else {
      setFocusAreas([...focusAreas, id]);
    }
  };

  const handleSelectOption = (qId, option) => {
    setSurveyAnswers(prev => ({ ...prev, [qId]: option }));
  };

  const renderTabContent = () => {
    if (activeTab === 0) {
      // Tab 1: Understanding
      return (
        <View style={styles.tabContentContainer}>
          <Text style={[styles.sectionTitle, { color: '#000000' }]}>Home Resources</Text>
          <Text style={[styles.sectionDesc, { color: theme.secondaryText }]}>
            Select the learning and developmental resources available to your child at home:
          </Text>

          <View style={styles.chipsContainer}>
            {UNDERSTANDING_RESOURCES.map(res => {
              const isActive = resources.includes(res.id);
              return (
                <ActionChip
                  key={res.id}
                  label={res.label}
                  isActive={isActive}
                  onToggle={() => toggleResource(res.id)}
                />
              );
            })}
          </View>

          <View style={styles.spacer} />

          <Text style={[styles.sectionTitle, { color: '#000000' }]}>Parent Survey</Text>
          <Text style={[styles.sectionDesc, { color: theme.secondaryText }]}>
            Select the most appropriate option for your child:
          </Text>

          {PARENT_QUESTIONS.map((q, idx) => {
            const selected = surveyAnswers[q.id];
            return (
              <View key={q.id} style={[styles.questionCard, { borderColor: gems.sapphire, backgroundColor: 'rgba(255,255,255,0.06)' }]}>
                <Text style={[styles.questionText, { color: '#000000' }]}>
                  {idx + 1}. {q.text}
                </Text>
                <View style={styles.optionsRow}>
                  {OPTIONS.map(opt => {
                    const isSelected = selected === opt.value;
                    return (
                      <TouchableOpacity
                        key={opt.value}
                        onPress={() => handleSelectOption(q.id, opt.value)}
                        style={[
                          styles.optionButton,
                          {
                            borderColor: isSelected ? gems.sapphire : theme.border,
                            backgroundColor: isSelected ? 'rgba(46, 88, 148, 0.15)' : 'transparent',
                          },
                        ]}
                      >
                        <Text style={styles.optionEmoji}>{opt.emoji}</Text>
                        <Text style={[styles.optionText, { color: isSelected ? gems.sapphire : theme.secondaryText }]}>
                          {opt.value}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            );
          })}

          <View style={styles.buttonCol}>
            <GemButton
              gemType="sapphire"
              onPress={() => setActiveTab(1)}
            >
              <Text style={styles.btnText}>{"PROCEED TO\nSUPPORTING\n➔"}</Text>
            </GemButton>
          </View>
        </View>
      );
    } else {
      // Tab 2: Supporting
      const isOtherChecked = focusAreas.includes('other');
      return (
        <View style={styles.tabContentContainer}>
          <Text style={[styles.sectionTitle, { color: '#000000' }]}>Focus Areas</Text>
          <Text style={[styles.sectionDesc, { color: theme.secondaryText }]}>
            {"Select the key focus areas where your child needs support with:"}
          </Text>

          <View style={styles.chipsContainer}>
            {SUPPORTING_FOCUS_AREAS.map(area => {
              const isActive = focusAreas.includes(area.id);
              return (
                <ActionChip
                  key={area.id}
                  label={area.label}
                  isActive={isActive}
                  onToggle={() => toggleFocusArea(area.id)}
                />
              );
            })}
          </View>

          {isOtherChecked && (
            <View style={{ marginTop: 16 }}>
              <Text style={[styles.label, { color: '#000000' }]}>Other support areas Specify:</Text>
              <TextInput
                style={styles.otherInput}
                placeholder="Specify other focus areas..."
                placeholderTextColor="rgba(0,0,0,0.35)"
                value={otherSupportText}
                onChangeText={setOtherSupportText}
              />
            </View>
          )}

          <View style={styles.spacer} />

          <Text style={[styles.sectionTitle, { color: '#000000' }]}>Home Support Details</Text>
          <Text style={[styles.sectionDesc, { color: theme.secondaryText }]}>
            {"Briefly describe how you support your child's learning and co-curricular development at home:"}
          </Text>

          <AutoResizingInput
            placeholder="Type your notes here..."
            value={supportText}
            onChangeText={setSupportText}
            minHeight={120}
            style={styles.blueUnderline}
          />

          <View style={styles.buttonCol}>
            <GemButton
              onPress={handleFinish}
              disabled={loading}
              gemType="sapphire"
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.btnText}>{"COMPLETE &\nFINISH\n➔"}</Text>
              )}
            </GemButton>
          </View>
        </View>
      );
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <PremiumBackground />
      <SafeAreaView style={{ flex: 1 }}>
        <StatusBar translucent barStyle={theme.isDark ? 'light-content' : 'dark-content'} backgroundColor="transparent" />

        {/* Header */}
        <View style={styles.header}>
          <MenuDropdown />
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={[styles.title, { color: theme.text }]}>PARENT FEEDBACK</Text>
            <Text style={[styles.subtitle, { color: theme.secondaryText }]}>✨ Part A4 Support ✨</Text>
          </View>
          <SoundButton onPress={() => handleSave()} style={[styles.backBtn, { borderColor: gems.topaz + '80' }]}>
            <Ionicons name="cloud-upload-outline" size={20} color={gems.topaz} />
          </SoundButton>
        </View>

        <View style={styles.container}>
          {/* Animated Tab Bar */}
          <AnimatedTabBar
            tabs={['Understanding', 'Supporting']}
            activeIndex={activeTab}
            onTabChange={setActiveTab}
          />

          {/* Scrollable Form Content */}
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
            {renderTabContent()}
          </ScrollView>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
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
  title: {
    fontSize: 16,
    fontWeight: '300',
    letterSpacing: 2,
    fontFamily: 'Jost_300Light',
  },
  subtitle: {
    fontSize: 9,
    letterSpacing: 1,
    marginTop: 2,
    textTransform: 'uppercase',
    fontFamily: 'Jost_400Regular',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    marginTop: 10,
  },
  tabContentContainer: {
    flex: 1,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'Jost_600SemiBold',
    letterSpacing: 0.5,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  sectionDesc: {
    fontSize: 12,
    fontFamily: 'Jost_400Regular',
    lineHeight: 16,
    marginBottom: 16,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
  },
  spacer: {
    height: 24,
  },
  questionCard: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
    marginBottom: 16,
    gap: 12,
  },
  questionText: {
    fontSize: 13,
    fontFamily: 'Jost_400Regular',
    lineHeight: 18,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
  },
  optionButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  optionEmoji: {
    fontSize: 18,
  },
  optionText: {
    fontSize: 8,
    fontWeight: '700',
    fontFamily: 'Jost_600SemiBold',
  },
  buttonCol: {
    flexDirection: 'column',
    gap: 12,
    marginTop: 20,
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
    fontFamily: 'Jost_600SemiBold',
    textAlign: 'center',
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
    fontFamily: 'Jost_600SemiBold',
  },
  otherInput: {
    borderBottomColor: gems.sapphire,
    borderBottomWidth: 1.5,
    paddingVertical: 8,
    paddingHorizontal: 8,
    fontSize: 14,
    fontFamily: 'Jost_400Regular',
    color: '#000000',
  },
  blueUnderline: {
    borderBottomColor: gems.sapphire,
    borderBottomWidth: 1.5,
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    color: '#000000',
  },
});
