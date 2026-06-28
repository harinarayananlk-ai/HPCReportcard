import React, { useState, useEffect, useCallback } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useTheme, useAuth, API_URL } from '../../context/GlobalContext';
import PremiumBackground from '../../components/PremiumBackground';
import SoundButton from '../../components/SoundButton';
import MenuDropdown from '../../components/MenuDropdown';
import GemButton from '../../components/GemButton';
import TimelineNode from '../../components/TimelineNode';
import AutoResizingInput from '../../components/AutoResizingInput';
import { gems } from '../../colour_themes';
import useAutoSave from '../../hooks/useAutoSave';

export default function AmbitionCard() {
  const { theme } = useTheme();
  const { user, profile, setProfile: setAuthProfile, activeStudentId, activeStudentProfile, setActiveStudentProfile } = useAuth();
  const router = useRouter();

  const isTeacher = user?.role === 'teacher' || user?.role === 'superadmin';
  const targetUserId = activeStudentId || user?.id;
  const targetProfile = activeStudentProfile || profile;

  // Local States
  const [loading, setLoading] = useState(false);
  const [expandedNode, setExpandedNode] = useState(0); // Index of expanded node

  // Form Fields State
  const [ambition, setAmbition] = useState('');
  const [achieveAmbition, setAchieveAmbition] = useState('');
  const [skills, setSkills] = useState(['', '', '', '', '']); // 5 skills
  const [subjects, setSubjects] = useState(['']); // Dynamic list (starts with 1, cap 3)
  const [habits, setHabits] = useState(['']); // Dynamic list (starts with 1, cap 3)
  const [guidance, setGuidance] = useState('');
  const [guidanceHelp, setGuidanceHelp] = useState('');
  const [guidanceLearn, setGuidanceLearn] = useState('');
  const [feelingsAchieve, setFeelingsAchieve] = useState('');
  const [feelingsParents, setFeelingsParents] = useState('');

  // Load Saved Data
  useEffect(() => {
    if (targetProfile) {
      const assess = typeof targetProfile.assessments === 'string'
        ? JSON.parse(targetProfile.assessments || '{}')
        : (targetProfile.assessments || {});
      const a3 = assess.a3_s3 || {};

      setAmbition(a3.ambition || '');
      setAchieveAmbition(a3.achieveAmbition || '');
      
      if (a3.skills && Array.isArray(a3.skills)) {
        // Pads skills to length 5 if loaded length is less
        const padded = [...a3.skills];
        while (padded.length < 5) padded.push('');
        setSkills(padded.slice(0, 5));
      } else {
        setSkills(['', '', '', '', '']);
      }
      
      if (a3.subjects && Array.isArray(a3.subjects)) {
        setSubjects(a3.subjects.length > 0 ? a3.subjects : ['']);
      } else {
        setSubjects(['']);
      }

      if (a3.habits && Array.isArray(a3.habits)) {
        setHabits(a3.habits.length > 0 ? a3.habits : ['']);
      } else {
        setHabits(['']);
      }

      setGuidance(a3.guidance || '');
      setGuidanceHelp(a3.guidanceHelp || '');
      setGuidanceLearn(a3.guidanceLearn || '');
      setFeelingsAchieve(a3.feelingsAchieve || '');
      setFeelingsParents(a3.feelingsParents || '');
    }
  }, [targetProfile]);

  const getPayload = useCallback(() => {
    const currentAssess = typeof targetProfile?.assessments === 'string'
      ? JSON.parse(targetProfile.assessments || '{}')
      : (targetProfile?.assessments || {});
    return {
      assessments: {
        ...currentAssess,
        a3_s3: {
          ambition,
          achieveAmbition,
          skills,
          subjects,
          habits,
          guidance,
          guidanceHelp,
          guidanceLearn,
          feelingsAchieve,
          feelingsParents,
        }
      }
    };
  }, [targetProfile, ambition, achieveAmbition, skills, subjects, habits, guidance, guidanceHelp, guidanceLearn, feelingsAchieve, feelingsParents]);

  const { triggerSave } = useAutoSave(targetUserId, getPayload, [
    ambition,
    achieveAmbition,
    skills,
    subjects,
    habits,
    guidance,
    guidanceHelp,
    guidanceLearn,
    feelingsAchieve,
    feelingsParents
  ]);

  const handleSave = async () => {
    if (!targetUserId) return;
    setLoading(true);
    try {
      await triggerSave();
      Alert.alert('Saved', 'Ambition timeline progress saved!');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async () => {
    await handleSave();
    router.push('/part_a4_s3/ParentFeedback');
  };

  const updateItemInArray = (list, setter, idx, val) => {
    const updated = [...list];
    updated[idx] = val;
    setter(updated);
  };

  // Dynamic list builders
  const addSubject = () => {
    if (subjects.length < 3) {
      setSubjects([...subjects, '']);
    }
  };
  const removeSubject = (idx) => {
    if (subjects.length > 1) {
      setSubjects(subjects.filter((_, i) => i !== idx));
    } else {
      setSubjects(['']);
    }
  };

  const addHabit = () => {
    if (habits.length < 3) {
      setHabits([...habits, '']);
    }
  };
  const removeHabit = (idx) => {
    if (habits.length > 1) {
      setHabits(habits.filter((_, i) => i !== idx));
    } else {
      setHabits(['']);
    }
  };

  // Completion statuses
  const isNodeComplete = (idx) => {
    switch (idx) {
      case 0: return !!ambition.trim() && !!achieveAmbition.trim();
      case 1: return skills.some(s => s.trim());
      case 2: return subjects.some(s => s.trim());
      case 3: return habits.some(h => h.trim());
      case 4: return !!guidance.trim() && !!guidanceHelp.trim() && !!guidanceLearn.trim();
      case 5: return !!feelingsAchieve.trim() && !!feelingsParents.trim();
      default: return false;
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
            <Text style={[styles.title, { color: theme.text }]}>MY AMBITION CARD</Text>
            <Text style={[styles.subtitle, { color: theme.secondaryText }]}>✨ Part A3 Timeline ✨</Text>
          </View>
          <SoundButton onPress={() => handleSave()} style={[styles.backBtn, { borderColor: gems.silver + '80' }]}>
            <Ionicons name="cloud-upload-outline" size={20} color={gems.silver} />
          </SoundButton>
        </View>

        {/* Timeline Scroll */}
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* Node 1: Ambition */}
          <TimelineNode
            title="🎯 Ambition"
            icon="target"
            isExpanded={expandedNode === 0}
            isComplete={isNodeComplete(0)}
            onToggle={() => setExpandedNode(expandedNode === 0 ? -1 : 0)}
          >
            <Text style={[styles.nodeHint, { color: theme.secondaryText }]}>My ambition is...</Text>
            <AutoResizingInput
              placeholder="Your dream profession..."
              value={ambition}
              onChangeText={setAmbition}
              minHeight={40}
              style={styles.blueUnderline}
            />

            <Text style={[styles.nodeHint, { color: theme.secondaryText, marginTop: 12 }]}>I will achieve my ambition by...</Text>
            <AutoResizingInput
              placeholder="How you plan to reach this goal..."
              value={achieveAmbition}
              onChangeText={setAchieveAmbition}
              minHeight={60}
              style={styles.blueUnderline}
            />
          </TimelineNode>

          {/* Node 2: Skills */}
          <TimelineNode
            title="💪 Skills"
            icon="flash"
            isExpanded={expandedNode === 1}
            isComplete={isNodeComplete(1)}
            onToggle={() => setExpandedNode(expandedNode === 1 ? -1 : 1)}
          >
            <Text style={[styles.nodeHint, { color: theme.secondaryText }]}>5 Skills I need to develop:</Text>
            {skills.map((skill, i) => (
              <TextInput
                key={`skill-${i}`}
                style={[styles.timelineInput, { color: '#000000', borderBottomColor: gems.sapphire }]}
                placeholder={`Skill #${i + 1}`}
                placeholderTextColor="rgba(0,0,0,0.3)"
                value={skill}
                onChangeText={(v) => updateItemInArray(skills, setSkills, i, v)}
              />
            ))}
          </TimelineNode>

          {/* Node 3: Subjects */}
          <TimelineNode
            title="📚 Subjects"
            icon="book"
            isExpanded={expandedNode === 2}
            isComplete={isNodeComplete(2)}
            onToggle={() => setExpandedNode(expandedNode === 2 ? -1 : 2)}
          >
            <View style={styles.listHeaderRow}>
              <Text style={[styles.nodeHint, { color: theme.secondaryText }]}>Subjects I need to focus on (Max 3):</Text>
              {subjects.length < 3 && (
                <TouchableOpacity onPress={addSubject}>
                  <Ionicons name="add-circle" size={20} color={gems.silver} />
                </TouchableOpacity>
              )}
            </View>
            
            {subjects.map((sub, i) => (
              <View key={`subject-${i}`} style={styles.dynamicRow}>
                <TextInput
                  style={[styles.timelineInput, { flex: 1, color: '#000000', borderBottomColor: gems.sapphire }]}
                  placeholder={`Subject #${i + 1}`}
                  placeholderTextColor="rgba(0,0,0,0.3)"
                  value={sub}
                  onChangeText={(v) => updateItemInArray(subjects, setSubjects, i, v)}
                />
                <TouchableOpacity onPress={() => removeSubject(i)}>
                  <Ionicons name="trash-outline" size={18} color={gems.sapphire} />
                </TouchableOpacity>
              </View>
            ))}
          </TimelineNode>

          {/* Node 4: Habits */}
          <TimelineNode
            title="🔄 Habits"
            icon="repeat"
            isExpanded={expandedNode === 3}
            isComplete={isNodeComplete(3)}
            onToggle={() => setExpandedNode(expandedNode === 3 ? -1 : 3)}
          >
            <View style={styles.listHeaderRow}>
              <Text style={[styles.nodeHint, { color: theme.secondaryText }]}>Habits I need to build (Max 3):</Text>
              {habits.length < 3 && (
                <TouchableOpacity onPress={addHabit}>
                  <Ionicons name="add-circle" size={20} color={gems.silver} />
                </TouchableOpacity>
              )}
            </View>
            
            {habits.map((hab, i) => (
              <View key={`habit-${i}`} style={styles.dynamicRow}>
                <TextInput
                  style={[styles.timelineInput, { flex: 1, color: '#000000', borderBottomColor: gems.sapphire }]}
                  placeholder={`Habit #${i + 1}`}
                  placeholderTextColor="rgba(0,0,0,0.3)"
                  value={hab}
                  onChangeText={(v) => updateItemInArray(habits, setHabits, i, v)}
                />
                <TouchableOpacity onPress={() => removeHabit(i)}>
                  <Ionicons name="trash-outline" size={18} color={gems.sapphire} />
                </TouchableOpacity>
              </View>
            ))}
          </TimelineNode>

          {/* Node 5: Guidance */}
          <TimelineNode
            title="🧭 Guidance"
            icon="compass"
            isExpanded={expandedNode === 4}
            isComplete={isNodeComplete(4)}
            onToggle={() => setExpandedNode(expandedNode === 4 ? -1 : 4)}
          >
            <Text style={[styles.nodeHint, { color: theme.secondaryText }]}>I need guidance from...</Text>
            <AutoResizingInput
              placeholder="Teachers, Parents, Mentors..."
              value={guidance}
              onChangeText={setGuidance}
              minHeight={40}
              style={styles.blueUnderline}
            />

            <Text style={[styles.nodeHint, { color: theme.secondaryText, marginTop: 12 }]}>I think this person will help me by...</Text>
            <AutoResizingInput
              placeholder="Describe how they can support you..."
              value={guidanceHelp}
              onChangeText={(v) => setGuidanceHelp(v)}
              minHeight={40}
              style={styles.blueUnderline}
            />

            <Text style={[styles.nodeHint, { color: theme.secondaryText, marginTop: 12 }]}>I will learn new...</Text>
            <AutoResizingInput
              placeholder="Skills or wisdom you will gain..."
              value={guidanceLearn}
              onChangeText={(v) => setGuidanceLearn(v)}
              minHeight={40}
              style={styles.blueUnderline}
            />
          </TimelineNode>

          {/* Node 6: Feelings */}
          <TimelineNode
            title="💭 Feelings"
            icon="happy"
            isExpanded={expandedNode === 5}
            isComplete={isNodeComplete(5)}
            onToggle={() => setExpandedNode(expandedNode === 5 ? -1 : 5)}
          >
            <Text style={[styles.nodeHint, { color: theme.secondaryText }]}>I will feel _____ when I achieve my ambition</Text>
            <AutoResizingInput
              placeholder="Excited, Proud, Accomplished..."
              value={feelingsAchieve}
              onChangeText={setFeelingsAchieve}
              minHeight={40}
              style={styles.blueUnderline}
            />

            <Text style={[styles.nodeHint, { color: theme.secondaryText, marginTop: 12 }]}>My parents will feel _____ when I achieve my ambition</Text>
            <AutoResizingInput
              placeholder="Happy, Elated, Content..."
              value={feelingsParents}
              onChangeText={setFeelingsParents}
              minHeight={40}
              style={styles.blueUnderline}
            />
          </TimelineNode>

          {/* Action buttons */}
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
                <Text style={styles.btnText}>{"PROCEED TO\nPART A4\n➔"}</Text>
              )}
            </GemButton>
          </View>

        </ScrollView>
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
    fontFamily: 'Inter_400Regular',
  },
  subtitle: {
    fontSize: 9,
    letterSpacing: 1,
    marginTop: 2,
    textTransform: 'uppercase',
    fontFamily: 'Inter_400Regular',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 60,
  },
  nodeHint: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 8,
    fontFamily: 'Outfit_600SemiBold',
  },
  timelineInput: {
    borderBottomWidth: 1.5,
    paddingVertical: 6,
    paddingHorizontal: 4,
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    marginBottom: 10,
  },
  blueUnderline: {
    borderBottomColor: gems.sapphire,
    borderBottomWidth: 1.5,
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    color: '#000000',
  },
  listHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  dynamicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '100%',
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
    fontFamily: 'Outfit_600SemiBold',
    textAlign: 'center',
  },
});
