import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useAuth, API_URL } from '../../context/GlobalContext';
import PremiumBackground from '../../components/PremiumBackground';
import SoundButton from '../../components/SoundButton';
import GemButton from '../../components/GemButton';
import GemCutCard from '../../components/GemCutCard';
import MenuDropdown from '../../components/MenuDropdown';
import AnimatedTabBar from '../../components/AnimatedTabBar';
import AutoResizingInput from '../../components/AutoResizingInput';
import { gems } from '../../colour_themes';
import useAutoSave from '../../hooks/useAutoSave';

export default function PartCProblemBasedInquiry() {
  const router = useRouter();
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const { user, profile, activeStudentId, activeStudentProfile, setActiveStudentProfile, setProfile: setAuthProfile } = useAuth();
  const isTeacher = user?.role === 'teacher' || user?.role === 'superadmin';
  const targetUserId = activeStudentId || user?.id;
  const targetProfile = isTeacher ? activeStudentProfile : profile;

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);

  // --- STATE FOR FORM FIELDS ---
  // Tab 0: Initial Setup & Planning
  const [subjects, setSubjects] = useState([]);
  const [newSubject, setNewSubject] = useState('');
  const [goals, setGoals] = useState([]);
  const [newGoal, setNewGoal] = useState('');
  const [competencies, setCompetencies] = useState([]);
  const [newCompetency, setNewCompetency] = useState('');

  const [pedagogies, setPedagogies] = useState({
    art: false, toy: false, skill: false, iks: false, sports: false, tech: false, drama: false, other: false, otherSpecify: ''
  });
  
  const [researchPrompt, setResearchPrompt] = useState('');
  const [hypothesis, setHypothesis] = useState('');
  const [guidingQuestions, setGuidingQuestions] = useState('');

  // 6 Workflow Boxes
  const [workflow, setWorkflow] = useState({
    evidence: '',
    analysis: '',
    know: '',
    findOut: '',
    conclusion: '',
    discussions: ''
  });

  const [schedule, setSchedule] = useState({
    day1: '', day2: '', day3: '', day4: '', day5: '', day6: '', day7: '', day8: '', day9: '', day10: ''
  });

  // Tab 1: Stage 1 Planning (Teacher Dynamic parameters + Learner Reflection)
  const [s1TeacherCustom, setS1TeacherCustom] = useState({
    awrCustom1: '', awrCustom2: '',
    senCustom1: '', senCustom2: '',
    creCustom1: '', creCustom2: ''
  });
  const [s1Teacher, setS1Teacher] = useState({
    awr1: false, awr2: false, awr3: false, awrCustom1: false, awrCustom2: false,
    sen1: false, sen2: false, sen3: false, senCustom1: false, senCustom2: false,
    cre1: false, cre2: false, cre3: false, creCustom1: false, creCustom2: false,
    comments: ''
  });

  const [s1Learner, setS1Learner] = useState({
    awr1: false, awr2: false, awr3: false,
    sen1: false, sen2: false, sen3: false,
    cre1: false, cre2: false, cre3: false,
    problemFace: '',
    problemSolve: ''
  });

  // Tab 2: Stage 2 Execution
  const [s2TeacherCustom, setS2TeacherCustom] = useState({
    awrCustom1: '', awrCustom2: '',
    senCustom1: '', senCustom2: '',
    creCustom1: '', creCustom2: ''
  });
  const [s2Teacher, setS2Teacher] = useState({
    awr1: false, awr2: false, awr3: false, awrCustom1: false, awrCustom2: false,
    sen1: false, sen2: false, sen3: false, senCustom1: false, senCustom2: false,
    cre1: false, cre2: false, cre3: false, creCustom1: false, creCustom2: false,
    comments: ''
  });

  const [s2Learner, setS2Learner] = useState({
    awr1: false, awr2: false, awr3: false,
    sen1: false, sen2: false, sen3: false,
    cre1: false, cre2: false, cre3: false,
    appreciation: ''
  });

  // Tab 3: Stage 3 Peer Review & Finalization
  const [s3TeacherCustom, setS3TeacherCustom] = useState({
    awrCustom1: '', awrCustom2: '',
    senCustom1: '', senCustom2: '',
    creCustom1: '', creCustom2: ''
  });
  const [s3Teacher, setS3Teacher] = useState({
    awr1: false, awr2: false, awr3: false, awr4: false, awrCustom1: false, awrCustom2: false,
    sen1: false, sen2: false, sen3: false, senCustom1: false, senCustom2: false, // Wait: predefined in stage 3 is 3 for Sen, 3 for Cre, 4 for Awr
    cre1: false, cre2: false, cre3: false, creCustom1: false, creCustom2: false,
    comments: ''
  });

  const [s3Peer, setS3Peer] = useState({
    awr1: false, awr2: false, awr3: false,
    sen1: false, sen2: false, sen3: false,
    cre1: false, cre2: false, cre3: false,
    appreciation: ''
  });

  // Tab 4: Overview & Post Reflections
  const [levelOverviewTeacher, setLevelOverviewTeacher] = useState({ awr: '', sen: '', cre: '' });
  const [levelOverviewLearner, setLevelOverviewLearner] = useState({ awr: '', sen: '', cre: '' });
  const [levelOverviewPeer, setLevelOverviewPeer] = useState({ awr: '', sen: '', cre: '' });

  const [postReflectionsTeacher, setPostReflectionsTeacher] = useState({
    finalComments: '',
    workOn: ''
  });
  const [postReflectionsLearner, setPostReflectionsLearner] = useState({
    learnt: '',
    enjoyed: '',
    strengths: '',
    challenges: '',
    improvements: '',
    questions: ''
  });

  // --- AUTO CALCULATIONS ---
  const s1LearnerSums = {
    awr: [s1Learner.awr1, s1Learner.awr2, s1Learner.awr3].filter(Boolean).length,
    sen: [s1Learner.sen1, s1Learner.sen2, s1Learner.sen3].filter(Boolean).length,
    cre: [s1Learner.cre1, s1Learner.cre2, s1Learner.cre3].filter(Boolean).length,
  };
  const s2LearnerSums = {
    awr: [s2Learner.awr1, s2Learner.awr2, s2Learner.awr3].filter(Boolean).length,
    sen: [s2Learner.sen1, s2Learner.sen2, s2Learner.sen3].filter(Boolean).length,
    cre: [s2Learner.cre1, s2Learner.cre2, s2Learner.cre3].filter(Boolean).length,
  };
  const s3PeerSums = {
    awr: [s3Peer.awr1, s3Peer.awr2, s3Peer.awr3].filter(Boolean).length,
    sen: [s3Peer.sen1, s3Peer.sen2, s3Peer.sen3].filter(Boolean).length,
    cre: [s3Peer.cre1, s3Peer.cre2, s3Peer.cre3].filter(Boolean).length,
  };

  // Teacher Ticks calculations
  const getTeacherStageSums = (stageData, isStage3 = false) => {
    // Stage 1 & 2 have 5 fields max: awr1, awr2, awr3, awrCustom1, awrCustom2
    // Stage 3 has 6 fields max for Awr: awr1, awr2, awr3, awr4, awrCustom1, awrCustom2
    const awr = [stageData.awr1, stageData.awr2, stageData.awr3, isStage3 && stageData.awr4, stageData.awrCustom1, stageData.awrCustom2].filter(Boolean).length;
    const sen = [stageData.sen1, stageData.sen2, stageData.sen3, stageData.senCustom1, stageData.senCustom2].filter(Boolean).length;
    const cre = [stageData.cre1, stageData.cre2, stageData.cre3, stageData.creCustom1, stageData.creCustom2].filter(Boolean).length;
    return { awr, sen, cre };
  };

  const s1TeacherSums = getTeacherStageSums(s1Teacher);
  const s2TeacherSums = getTeacherStageSums(s2Teacher);
  const s3TeacherSums = getTeacherStageSums(s3Teacher, true);

  const teacherGrandTotals = {
    awr: s1TeacherSums.awr + s2TeacherSums.awr + s3TeacherSums.awr, // max 16
    sen: s1TeacherSums.sen + s2TeacherSums.sen + s3TeacherSums.sen, // max 15
    cre: s1TeacherSums.cre + s2TeacherSums.cre + s3TeacherSums.cre, // max 15
  };

  const learnerGrandTotals = {
    awr: s1LearnerSums.awr + s2LearnerSums.awr, // max 6
    sen: s1LearnerSums.sen + s2LearnerSums.sen, // max 6
    cre: s1LearnerSums.cre + s2LearnerSums.cre, // max 6
  };

  const peerGrandTotals = {
    awr: s3PeerSums.awr, // max 3
    sen: s3PeerSums.sen,
    cre: s3PeerSums.cre,
  };

  const getSuggestedLevelTeacher = (total) => {
    if (total >= 11) return 'Advanced';
    if (total >= 6) return 'Proficient';
    return 'Beginner';
  };
  const getSuggestedLevelLearner = (total) => {
    if (total >= 5) return 'Advanced';
    if (total >= 3) return 'Proficient';
    return 'Beginner';
  };
  const getSuggestedLevelPeer = (total) => {
    if (total >= 3) return 'Advanced';
    if (total === 2) return 'Proficient';
    return 'Beginner';
  };

  // --- SAVE & LOAD ---
  const getPayload = useCallback(() => {
    const stage4Obj = {
      partC: {
        subjects, goals, competencies, pedagogies, researchPrompt, hypothesis, guidingQuestions,
        workflow, schedule,
        s1TeacherCustom, s1Teacher, s1Learner,
        s2TeacherCustom, s2Teacher, s2Learner,
        s3TeacherCustom, s3Teacher, s3Peer,
        levelOverviewTeacher, levelOverviewLearner, levelOverviewPeer,
        postReflectionsTeacher, postReflectionsLearner
      }
    };

    const currentAssess = typeof targetProfile?.assessments === 'string'
      ? JSON.parse(targetProfile.assessments)
      : (targetProfile?.assessments || {});

    const stage4Merged = { ...(currentAssess.stage4 || {}), ...stage4Obj };

    return {
      assessments: {
        ...currentAssess,
        stage4: stage4Merged
      }
    };
  }, [
    subjects, goals, competencies, pedagogies, researchPrompt, hypothesis, guidingQuestions,
    workflow, schedule,
    s1TeacherCustom, s1Teacher, s1Learner,
    s2TeacherCustom, s2Teacher, s2Learner,
    s3TeacherCustom, s3Teacher, s3Peer,
    levelOverviewTeacher, levelOverviewLearner, levelOverviewPeer,
    postReflectionsTeacher, postReflectionsLearner, targetProfile
  ]);

  const { triggerSave } = useAutoSave(targetUserId, getPayload, [
    subjects, goals, competencies, pedagogies, researchPrompt, hypothesis, guidingQuestions,
    workflow, schedule,
    s1TeacherCustom, s1Teacher, s1Learner,
    s2TeacherCustom, s2Teacher, s2Learner,
    s3TeacherCustom, s3Teacher, s3Peer,
    levelOverviewTeacher, levelOverviewLearner, levelOverviewPeer,
    postReflectionsTeacher, postReflectionsLearner
  ]);

  useEffect(() => {
    if (targetUserId) {
      loadProfileData();
    }
  }, [targetUserId]);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/students/profile/${targetUserId}`);
      const data = await res.json();
      if (data && data.assessments) {
        const assess = typeof data.assessments === 'string' ? JSON.parse(data.assessments) : data.assessments;
        const c = assess.stage4?.partC;
        if (c) {
          if (c.subjects) setSubjects(c.subjects);
          if (c.goals) setGoals(c.goals);
          if (c.competencies) setCompetencies(c.competencies);
          if (c.pedagogies) setPedagogies(c.pedagogies);
          if (c.researchPrompt) setResearchPrompt(c.researchPrompt);
          if (c.hypothesis) setHypothesis(c.hypothesis);
          if (c.guidingQuestions) setGuidingQuestions(c.guidingQuestions);
          if (c.workflow) setWorkflow(prev => ({ ...prev, ...c.workflow }));
          if (c.schedule) setSchedule(prev => ({ ...prev, ...c.schedule }));

          if (c.s1TeacherCustom) setS1TeacherCustom(prev => ({ ...prev, ...c.s1TeacherCustom }));
          if (c.s1Teacher) setS1Teacher(prev => ({ ...prev, ...c.s1Teacher }));
          if (c.s1Learner) setS1Learner(prev => ({ ...prev, ...c.s1Learner }));

          if (c.s2TeacherCustom) setS2TeacherCustom(prev => ({ ...prev, ...c.s2TeacherCustom }));
          if (c.s2Teacher) setS2Teacher(prev => ({ ...prev, ...c.s2Teacher }));
          if (c.s2Learner) setS2Learner(prev => ({ ...prev, ...c.s2Learner }));

          if (c.s3TeacherCustom) setS3TeacherCustom(prev => ({ ...prev, ...c.s3TeacherCustom }));
          if (c.s3Teacher) setS3Teacher(prev => ({ ...prev, ...c.s3Teacher }));
          if (c.s3Peer) setS3Peer(prev => ({ ...prev, ...c.s3Peer }));

          if (c.levelOverviewTeacher) setLevelOverviewTeacher(prev => ({ ...prev, ...c.levelOverviewTeacher }));
          if (c.levelOverviewLearner) setLevelOverviewLearner(prev => ({ ...prev, ...c.levelOverviewLearner }));
          if (c.levelOverviewPeer) setLevelOverviewPeer(prev => ({ ...prev, ...c.levelOverviewPeer }));

          if (c.postReflectionsTeacher) setPostReflectionsTeacher(prev => ({ ...prev, ...c.postReflectionsTeacher }));
          if (c.postReflectionsLearner) setPostReflectionsLearner(prev => ({ ...prev, ...c.postReflectionsLearner }));
        }
      }
    } catch (e) {
      console.warn("Failed to load problem inquiry data", e);
    } finally {
      setLoading(false);
    }
  };

  const handleManualSave = async () => {
    try {
      await triggerSave();
      Alert.alert("Saved Successfully", "Your progress for Problem-Based Inquiry has been saved.");
    } catch (e) {
      Alert.alert("Save Failed", "Could not connect to the database.");
    }
  };

  const toggleCheckbox = (stateObj, stateSetter, key, locked = false) => {
    if (locked) return;
    stateSetter(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const addTag = (list, setter, newItem, setNewItem) => {
    if (!newItem.trim()) return;
    setter([...list, newItem.trim()]);
    setNewItem('');
  };

  const removeTag = (list, setter, index) => {
    setter(list.filter((_, i) => i !== index));
  };

  // --- RENDER SECTIONS ---

  // Tab 0: Setup & Planning
  const renderSetup = () => {
    return (
      <ScrollView style={styles.tabContent} contentContainerStyle={{ paddingBottom: 60 }} nestedScrollEnabled>
        <GemCutCard borderColor={gems.sapphire + '40'} style={styles.card}>
          <Text style={styles.cardHeader}>1. Context Definitions</Text>
          
          {/* Subjects */}
          <Text style={styles.inputLabel}>Subject(s) involved</Text>
          <View style={styles.tagInputRow}>
            <TextInput
              style={[styles.textInput, { flex: 1 }]}
              placeholder="e.g. Science"
              placeholderTextColor="#999"
              value={newSubject}
              onChangeText={setNewSubject}
            />
            <TouchableOpacity style={styles.addTagBtn} onPress={() => addTag(subjects, setSubjects, newSubject, setNewSubject)}>
              <Ionicons name="add" size={20} color="#FFF" />
            </TouchableOpacity>
          </View>
          <View style={styles.tagsContainer}>
            {subjects.map((item, idx) => (
              <View key={idx} style={styles.tag}>
                <Text style={styles.tagText}>{item}</Text>
                <TouchableOpacity onPress={() => removeTag(subjects, setSubjects, idx)}>
                  <Ionicons name="close-circle" size={14} color="#FFF" style={{ marginLeft: 6 }} />
                </TouchableOpacity>
              </View>
            ))}
          </View>

          {/* Curricular Goals */}
          <Text style={[styles.inputLabel, { marginTop: 12 }]}>Curricular Goal(s)</Text>
          <View style={styles.tagInputRow}>
            <TextInput
              style={[styles.textInput, { flex: 1 }]}
              placeholder="e.g. CG-1: Understands History"
              placeholderTextColor="#999"
              value={newGoal}
              onChangeText={setNewGoal}
            />
            <TouchableOpacity style={styles.addTagBtn} onPress={() => addTag(goals, setGoals, newGoal, setNewGoal)}>
              <Ionicons name="add" size={20} color="#FFF" />
            </TouchableOpacity>
          </View>
          <View style={styles.tagsContainer}>
            {goals.map((item, idx) => (
              <View key={idx} style={styles.tag}>
                <Text style={styles.tagText}>{item}</Text>
                <TouchableOpacity onPress={() => removeTag(goals, setGoals, idx)}>
                  <Ionicons name="close-circle" size={14} color="#FFF" style={{ marginLeft: 6 }} />
                </TouchableOpacity>
              </View>
            ))}
          </View>

          {/* Competencies */}
          <Text style={[styles.inputLabel, { marginTop: 12 }]}>Competency(-ies)</Text>
          <View style={styles.tagInputRow}>
            <TextInput
              style={[styles.textInput, { flex: 1 }]}
              placeholder="e.g. C-1.3: Continuity and Change"
              placeholderTextColor="#999"
              value={newCompetency}
              onChangeText={setNewCompetency}
            />
            <TouchableOpacity style={styles.addTagBtn} onPress={() => addTag(competencies, setCompetencies, newCompetency, setNewCompetency)}>
              <Ionicons name="add" size={20} color="#FFF" />
            </TouchableOpacity>
          </View>
          <View style={styles.tagsContainer}>
            {competencies.map((item, idx) => (
              <View key={idx} style={styles.tag}>
                <Text style={styles.tagText}>{item}</Text>
                <TouchableOpacity onPress={() => removeTag(competencies, setCompetencies, idx)}>
                  <Ionicons name="close-circle" size={14} color="#FFF" style={{ marginLeft: 6 }} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </GemCutCard>

        {/* Pedagogies */}
        <GemCutCard borderColor={gems.sapphire + '40'} style={styles.card}>
          <Text style={styles.cardHeader}>2. Pedagogies Utilized (Tick all that apply)</Text>
          <View style={styles.checkboxGrid}>
            {[
              { key: 'art', label: 'Art-integrated' },
              { key: 'toy', label: 'Toy-based' },
              { key: 'skill', label: 'Skill-based learning' },
              { key: 'iks', label: 'Indian Knowledge Systems approaches' },
              { key: 'sports', label: 'Sports-integrated' },
              { key: 'tech', label: 'Technology-integrated' },
              { key: 'drama', label: 'Drama/Theatre-integrated' },
              { key: 'other', label: 'Any other' },
            ].map(item => (
              <TouchableOpacity
                key={item.key}
                style={styles.checkboxRow}
                onPress={() => toggleCheckbox(pedagogies, setPedagogies, item.key)}
              >
                <Ionicons
                  name={pedagogies[item.key] ? "checkbox-outline" : "square-outline"}
                  size={18}
                  color={pedagogies[item.key] ? gems.sapphire : '#666'}
                />
                <Text style={[styles.checkboxLabel, { color: theme.text }]}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {pedagogies.other && (
            <TextInput
              style={[styles.textInput, { marginTop: 12 }]}
              placeholder="Specify other pedagogy..."
              placeholderTextColor="#999"
              value={pedagogies.otherSpecify}
              onChangeText={(v) => setPedagogies(prev => ({ ...prev, otherSpecify: v }))}
            />
          )}
        </GemCutCard>

        {/* Hypothesis and Workflow */}
        <GemCutCard borderColor={gems.sapphire + '40'} style={styles.card}>
          <Text style={styles.cardHeader}>3. Inquiry Setup & Hypothesis</Text>
          
          <Text style={styles.inputLabel}>Research Prompt / Question / Problem / Challenge</Text>
          <AutoResizingInput
            placeholder="Define the main research prompt..."
            value={researchPrompt}
            onChangeText={setResearchPrompt}
            minHeight={60}
            style={styles.underlineInput}
          />

          <Text style={[styles.inputLabel, { marginTop: 12 }]}>Proposed Hypothesis / Planned Final Output</Text>
          <AutoResizingInput
            placeholder="State your proposed solution / hypothesis..."
            value={hypothesis}
            onChangeText={setHypothesis}
            minHeight={60}
            style={styles.underlineInput}
          />

          <Text style={[styles.inputLabel, { marginTop: 12 }]}>Guiding Questions</Text>
          <AutoResizingInput
            placeholder="Unpack the research question..."
            value={guidingQuestions}
            onChangeText={setGuidingQuestions}
            minHeight={50}
            style={styles.underlineInput}
          />
        </GemCutCard>

        {/* 6 Workflow Boxes */}
        <GemCutCard borderColor={gems.sapphire + '40'} style={styles.card}>
          <Text style={styles.cardHeader}>4. Workflow Portfolios</Text>
          
          {/* What do I know? */}
          <Text style={styles.inputLabel}>What do I know?</Text>
          <AutoResizingInput
            placeholder="Initial knowledge points..."
            value={workflow.know}
            onChangeText={(v) => setWorkflow(prev => ({ ...prev, know: v }))}
            minHeight={50}
            style={styles.underlineInput}
          />

          {/* What do I need to find out? */}
          <Text style={[styles.inputLabel, { marginTop: 12 }]}>What do I need to do / find out?</Text>
          <AutoResizingInput
            placeholder="Identified gaps in understanding..."
            value={workflow.findOut}
            onChangeText={(v) => setWorkflow(prev => ({ ...prev, findOut: v }))}
            minHeight={50}
            style={styles.underlineInput}
          />

          {/* Evidence Collection */}
          <Text style={[styles.inputLabel, { marginTop: 12 }]}>Evidence Collection to Support/Negate Hypothesis</Text>
          <AutoResizingInput
            placeholder="Log surveys, interviews, and primary data sources..."
            value={workflow.evidence}
            onChangeText={(v) => setWorkflow(prev => ({ ...prev, evidence: v }))}
            minHeight={60}
            style={styles.underlineInput}
          />

          {/* Analysis and Synthesis */}
          <Text style={[styles.inputLabel, { marginTop: 12 }]}>Analysis and Synthesis of Data</Text>
          <AutoResizingInput
            placeholder="Deductions, graphs, statistics summaries..."
            value={workflow.analysis}
            onChangeText={(v) => setWorkflow(prev => ({ ...prev, analysis: v }))}
            minHeight={60}
            style={styles.underlineInput}
          />

          {/* Conclusion */}
          <Text style={[styles.inputLabel, { marginTop: 12 }]}>Conclusion</Text>
          <AutoResizingInput
            placeholder="Final hypothesis verification / results..."
            value={workflow.conclusion}
            onChangeText={(v) => setWorkflow(prev => ({ ...prev, conclusion: v }))}
            minHeight={50}
            style={styles.underlineInput}
          />

          {/* Discussions */}
          <Text style={[styles.inputLabel, { marginTop: 12 }]}>Discussions</Text>
          <AutoResizingInput
            placeholder="Practical drawbacks, future scope, etc..."
            value={workflow.discussions}
            onChangeText={(v) => setWorkflow(prev => ({ ...prev, discussions: v }))}
            minHeight={50}
            style={styles.underlineInput}
          />
        </GemCutCard>

        {/* Day 1 - 10 Schedule */}
        <GemCutCard borderColor={gems.sapphire + '40'} style={styles.card}>
          <Text style={styles.cardHeader}>5. Task Schedule (Day 1 - Day 10)</Text>
          <View style={styles.scheduleGrid}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(day => (
              <View key={day} style={styles.scheduleRow}>
                <Text style={[styles.scheduleLabel, { color: theme.text }]}>Day {day}</Text>
                <TextInput
                  style={[styles.textInput, { flex: 1 }]}
                  placeholder={`Plan for Day ${day}...`}
                  placeholderTextColor="#999"
                  value={schedule[`day${day}`]}
                  onChangeText={(v) => setSchedule(prev => ({ ...prev, [`day${day}`]: v }))}
                />
              </View>
            ))}
          </View>
        </GemCutCard>
      </ScrollView>
    );
  };

  // Tab 1: Stage 1 Planning
  const renderStage1 = () => {
    return (
      <ScrollView style={styles.tabContent} contentContainerStyle={{ paddingBottom: 60 }} nestedScrollEnabled>
        {/* Teacher checklist with custom fields */}
        <GemCutCard borderColor={gems.sapphire + '40'} style={[styles.card, !isTeacher && styles.disabledCard]}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardHeader}>Teacher Assessment (Stage 1)</Text>
            <View style={[styles.badge, { backgroundColor: gems.sapphire + '20' }]}><Text style={{ color: gems.sapphire, fontWeight: '700', fontSize: 8 }}>TEACHER</Text></View>
          </View>

          {!isTeacher && (
            <View style={styles.lockNotice}>
              <Ionicons name="lock-closed" size={14} color="#eab308" />
              <Text style={styles.lockNoticeText}>Locked for student & peer edits</Text>
            </View>
          )}

          {/* Awareness */}
          <Text style={styles.subHeader}>Awareness (Sum: {s1TeacherSums.awr}/5)</Text>
          <TextInput
            style={[styles.textInput, { marginBottom: 8 }]}
            placeholder="Custom parameter 1..."
            placeholderTextColor="#999"
            value={s1TeacherCustom.awrCustom1}
            onChangeText={(v) => setS1TeacherCustom(prev => ({ ...prev, awrCustom1: v }))}
            editable={isTeacher}
          />
          {s1TeacherCustom.awrCustom1.trim().length > 0 && (
            <TouchableOpacity style={styles.checkboxRow} disabled={!isTeacher} onPress={() => toggleCheckbox(s1Teacher, setS1Teacher, 'awrCustom1', !isTeacher)}>
              <Ionicons name={s1Teacher.awrCustom1 ? "checkbox-outline" : "square-outline"} size={18} color={s1Teacher.awrCustom1 ? gems.sapphire : '#666'} />
              <Text style={[styles.checkboxLabel, { color: theme.text }]}>{s1TeacherCustom.awrCustom1}</Text>
            </TouchableOpacity>
          )}
          <TextInput
            style={[styles.textInput, { marginBottom: 12 }]}
            placeholder="Custom parameter 2..."
            placeholderTextColor="#999"
            value={s1TeacherCustom.awrCustom2}
            onChangeText={(v) => setS1TeacherCustom(prev => ({ ...prev, awrCustom2: v }))}
            editable={isTeacher}
          />
          {s1TeacherCustom.awrCustom2.trim().length > 0 && (
            <TouchableOpacity style={styles.checkboxRow} disabled={!isTeacher} onPress={() => toggleCheckbox(s1Teacher, setS1Teacher, 'awrCustom2', !isTeacher)}>
              <Ionicons name={s1Teacher.awrCustom2 ? "checkbox-outline" : "square-outline"} size={18} color={s1Teacher.awrCustom2 ? gems.sapphire : '#666'} />
              <Text style={[styles.checkboxLabel, { color: theme.text }]}>{s1TeacherCustom.awrCustom2}</Text>
            </TouchableOpacity>
          )}
          {[
            { key: 'awr1', label: 'The learner has conceptual understanding.' },
            { key: 'awr2', label: 'There is alignment between research problem and questionnaire.' },
            { key: 'awr3', label: 'The learner has identified potential challenges.' },
          ].map(item => (
            <TouchableOpacity
              key={item.key}
              style={styles.checkboxRow}
              disabled={!isTeacher}
              onPress={() => toggleCheckbox(s1Teacher, setS1Teacher, item.key, !isTeacher)}
            >
              <Ionicons name={s1Teacher[item.key] ? "checkbox-outline" : "square-outline"} size={18} color={s1Teacher[item.key] ? gems.sapphire : '#666'} />
              <Text style={[styles.checkboxLabel, { color: theme.text }]}>{item.label}</Text>
            </TouchableOpacity>
          ))}

          {/* Sensitivity */}
          <Text style={[styles.subHeader, { marginTop: 16 }]}>Sensitivity (Sum: {s1TeacherSums.sen}/5)</Text>
          <TextInput
            style={[styles.textInput, { marginBottom: 8 }]}
            placeholder="Custom parameter 1..."
            placeholderTextColor="#999"
            value={s1TeacherCustom.senCustom1}
            onChangeText={(v) => setS1TeacherCustom(prev => ({ ...prev, senCustom1: v }))}
            editable={isTeacher}
          />
          {s1TeacherCustom.senCustom1.trim().length > 0 && (
            <TouchableOpacity style={styles.checkboxRow} disabled={!isTeacher} onPress={() => toggleCheckbox(s1Teacher, setS1Teacher, 'senCustom1', !isTeacher)}>
              <Ionicons name={s1Teacher.senCustom1 ? "checkbox-outline" : "square-outline"} size={18} color={s1Teacher.senCustom1 ? gems.sapphire : '#666'} />
              <Text style={[styles.checkboxLabel, { color: theme.text }]}>{s1TeacherCustom.senCustom1}</Text>
            </TouchableOpacity>
          )}
          <TextInput
            style={[styles.textInput, { marginBottom: 12 }]}
            placeholder="Custom parameter 2..."
            placeholderTextColor="#999"
            value={s1TeacherCustom.senCustom2}
            onChangeText={(v) => setS1TeacherCustom(prev => ({ ...prev, senCustom2: v }))}
            editable={isTeacher}
          />
          {s1TeacherCustom.senCustom2.trim().length > 0 && (
            <TouchableOpacity style={styles.checkboxRow} disabled={!isTeacher} onPress={() => toggleCheckbox(s1Teacher, setS1Teacher, 'senCustom2', !isTeacher)}>
              <Ionicons name={s1Teacher.senCustom2 ? "checkbox-outline" : "square-outline"} size={18} color={s1Teacher.senCustom2 ? gems.sapphire : '#666'} />
              <Text style={[styles.checkboxLabel, { color: theme.text }]}>{s1TeacherCustom.senCustom2}</Text>
            </TouchableOpacity>
          )}
          {[
            { key: 'sen1', label: 'The learner understands the larger social purpose of the task.' },
            { key: 'sen2', label: 'The questionnaire has inclusive and accessible wording.' },
            { key: 'sen3', label: 'There is clear understanding of who the stakeholders are.' },
          ].map(item => (
            <TouchableOpacity
              key={item.key}
              style={styles.checkboxRow}
              disabled={!isTeacher}
              onPress={() => toggleCheckbox(s1Teacher, setS1Teacher, item.key, !isTeacher)}
            >
              <Ionicons name={s1Teacher[item.key] ? "checkbox-outline" : "square-outline"} size={18} color={s1Teacher[item.key] ? gems.sapphire : '#666'} />
              <Text style={[styles.checkboxLabel, { color: theme.text }]}>{item.label}</Text>
            </TouchableOpacity>
          ))}

          {/* Creativity */}
          <Text style={[styles.subHeader, { marginTop: 16 }]}>Creativity (Sum: {s1TeacherSums.cre}/5)</Text>
          <TextInput
            style={[styles.textInput, { marginBottom: 8 }]}
            placeholder="Custom parameter 1..."
            placeholderTextColor="#999"
            value={s1TeacherCustom.creCustom1}
            onChangeText={(v) => setS1TeacherCustom(prev => ({ ...prev, creCustom1: v }))}
            editable={isTeacher}
          />
          {s1TeacherCustom.creCustom1.trim().length > 0 && (
            <TouchableOpacity style={styles.checkboxRow} disabled={!isTeacher} onPress={() => toggleCheckbox(s1Teacher, setS1Teacher, 'creCustom1', !isTeacher)}>
              <Ionicons name={s1Teacher.creCustom1 ? "checkbox-outline" : "square-outline"} size={18} color={s1Teacher.creCustom1 ? gems.sapphire : '#666'} />
              <Text style={[styles.checkboxLabel, { color: theme.text }]}>{s1TeacherCustom.creCustom1}</Text>
            </TouchableOpacity>
          )}
          <TextInput
            style={[styles.textInput, { marginBottom: 12 }]}
            placeholder="Custom parameter 2..."
            placeholderTextColor="#999"
            value={s1TeacherCustom.creCustom2}
            onChangeText={(v) => setS1TeacherCustom(prev => ({ ...prev, creCustom2: v }))}
            editable={isTeacher}
          />
          {s1TeacherCustom.creCustom2.trim().length > 0 && (
            <TouchableOpacity style={styles.checkboxRow} disabled={!isTeacher} onPress={() => toggleCheckbox(s1Teacher, setS1Teacher, 'creCustom2', !isTeacher)}>
              <Ionicons name={s1Teacher.creCustom2 ? "checkbox-outline" : "square-outline"} size={18} color={s1Teacher.creCustom2 ? gems.sapphire : '#666'} />
              <Text style={[styles.checkboxLabel, { color: theme.text }]}>{s1TeacherCustom.creCustom2}</Text>
            </TouchableOpacity>
          )}
          {[
            { key: 'cre1', label: 'The learner considers alternative methods of collecting findings.' },
            { key: 'cre2', label: 'The learner considers alternative groups of respondents.' },
            { key: 'cre3', label: 'The learner thinks of different ways to motivate respondents.' },
          ].map(item => (
            <TouchableOpacity
              key={item.key}
              style={styles.checkboxRow}
              disabled={!isTeacher}
              onPress={() => toggleCheckbox(s1Teacher, setS1Teacher, item.key, !isTeacher)}
            >
              <Ionicons name={s1Teacher[item.key] ? "checkbox-outline" : "square-outline"} size={18} color={s1Teacher[item.key] ? gems.sapphire : '#666'} />
              <Text style={[styles.checkboxLabel, { color: theme.text }]}>{item.label}</Text>
            </TouchableOpacity>
          ))}

          {/* Comments */}
          <Text style={[styles.inputLabel, { marginTop: 16 }]}>Pedagogical Comments</Text>
          <AutoResizingInput
            placeholder="Comments and pedagogical interventions..."
            value={s1Teacher.comments}
            onChangeText={(v) => setS1Teacher(prev => ({ ...prev, comments: v }))}
            minHeight={60}
            editable={isTeacher}
            style={styles.underlineInput}
          />
        </GemCutCard>

        {/* Learner Reflection + Problem logs */}
        <GemCutCard borderColor={gems.sapphire + '40'} style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardHeader}>Learner Reflection (Stage 1)</Text>
            <View style={styles.badge}><Text style={styles.badgeText}>Self</Text></View>
          </View>
          
          <Text style={styles.subHeader}>Awareness (Sum: {s1LearnerSums.awr}/3)</Text>
          {[
            { key: 'awr1', label: 'I understood the purpose of the research project.' },
            { key: 'awr2', label: 'I was able to draft a questionnaire that fits the purpose.' },
            { key: 'awr3', label: 'I was able to find out things I did not know.' },
          ].map(item => (
            <TouchableOpacity key={item.key} style={styles.checkboxRow} onPress={() => toggleCheckbox(s1Learner, setS1Learner, item.key)}>
              <Ionicons name={s1Learner[item.key] ? "checkbox-outline" : "square-outline"} size={18} color={s1Learner[item.key] ? gems.sapphire : '#666'} />
              <Text style={[styles.checkboxLabel, { color: theme.text }]}>{item.label}</Text>
            </TouchableOpacity>
          ))}

          <Text style={[styles.subHeader, { marginTop: 12 }]}>Sensitivity (Sum: {s1LearnerSums.sen}/3)</Text>
          {[
            { key: 'sen1', label: 'I understood the larger social purpose of the research.' },
            { key: 'sen2', label: 'I used my knowledge of social relationships to choose respondents.' },
            { key: 'sen3', label: 'I considered possible emotional reactions and needs.' },
          ].map(item => (
            <TouchableOpacity key={item.key} style={styles.checkboxRow} onPress={() => toggleCheckbox(s1Learner, setS1Learner, item.key)}>
              <Ionicons name={s1Learner[item.key] ? "checkbox-outline" : "square-outline"} size={18} color={s1Learner[item.key] ? gems.sapphire : '#666'} />
              <Text style={[styles.checkboxLabel, { color: theme.text }]}>{item.label}</Text>
            </TouchableOpacity>
          ))}

          <Text style={[styles.subHeader, { marginTop: 12 }]}>Creativity (Sum: {s1LearnerSums.cre}/3)</Text>
          {[
            { key: 'cre1', label: 'I was able to consider different groups of respondents.' },
            { key: 'cre2', label: 'I considered various ways to motivate the respondents.' },
            { key: 'cre3', label: 'I was able to consider different methods of collecting data.' },
          ].map(item => (
            <TouchableOpacity key={item.key} style={styles.checkboxRow} onPress={() => toggleCheckbox(s1Learner, setS1Learner, item.key)}>
              <Ionicons name={s1Learner[item.key] ? "checkbox-outline" : "square-outline"} size={18} color={s1Learner[item.key] ? gems.sapphire : '#666'} />
              <Text style={[styles.checkboxLabel, { color: theme.text }]}>{item.label}</Text>
            </TouchableOpacity>
          ))}

          <Text style={[styles.inputLabel, { marginTop: 16 }]}>What problems did I face in Stage 1?</Text>
          <AutoResizingInput
            placeholder="Type challenges faced here..."
            value={s1Learner.problemFace}
            onChangeText={(v) => setS1Learner(prev => ({ ...prev, problemFace: v }))}
            minHeight={50}
            style={styles.underlineInput}
          />

          <Text style={[styles.inputLabel, { marginTop: 12 }]}>How did I solve them? What help do I still need?</Text>
          <AutoResizingInput
            placeholder="Type problem solutions here..."
            value={s1Learner.problemSolve}
            onChangeText={(v) => setS1Learner(prev => ({ ...prev, problemSolve: v }))}
            minHeight={50}
            style={styles.underlineInput}
          />
        </GemCutCard>
      </ScrollView>
    );
  };

  // Tab 2: Stage 2 Execution
  const renderStage2 = () => {
    return (
      <ScrollView style={styles.tabContent} contentContainerStyle={{ paddingBottom: 60 }} nestedScrollEnabled>
        {/* Teacher checklist with custom fields */}
        <GemCutCard borderColor={gems.sapphire + '40'} style={[styles.card, !isTeacher && styles.disabledCard]}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardHeader}>Teacher Assessment (Stage 2)</Text>
            <View style={[styles.badge, { backgroundColor: gems.sapphire + '20' }]}><Text style={{ color: gems.sapphire, fontWeight: '700', fontSize: 8 }}>TEACHER</Text></View>
          </View>

          {!isTeacher && (
            <View style={styles.lockNotice}>
              <Ionicons name="lock-closed" size={14} color="#eab308" />
              <Text style={styles.lockNoticeText}>Locked for student & peer edits</Text>
            </View>
          )}

          {/* Awareness */}
          <Text style={styles.subHeader}>Awareness (Sum: {s2TeacherSums.awr}/5)</Text>
          <TextInput
            style={[styles.textInput, { marginBottom: 8 }]}
            placeholder="Custom parameter 1..."
            placeholderTextColor="#999"
            value={s2TeacherCustom.awrCustom1}
            onChangeText={(v) => setS2TeacherCustom(prev => ({ ...prev, awrCustom1: v }))}
            editable={isTeacher}
          />
          {s2TeacherCustom.awrCustom1.trim().length > 0 && (
            <TouchableOpacity style={styles.checkboxRow} disabled={!isTeacher} onPress={() => toggleCheckbox(s2Teacher, setS2Teacher, 'awrCustom1', !isTeacher)}>
              <Ionicons name={s2Teacher.awrCustom1 ? "checkbox-outline" : "square-outline"} size={18} color={s2Teacher.awrCustom1 ? gems.sapphire : '#666'} />
              <Text style={[styles.checkboxLabel, { color: theme.text }]}>{s2TeacherCustom.awrCustom1}</Text>
            </TouchableOpacity>
          )}
          <TextInput
            style={[styles.textInput, { marginBottom: 12 }]}
            placeholder="Custom parameter 2..."
            placeholderTextColor="#999"
            value={s2TeacherCustom.awrCustom2}
            onChangeText={(v) => setS2TeacherCustom(prev => ({ ...prev, awrCustom2: v }))}
            editable={isTeacher}
          />
          {s2TeacherCustom.awrCustom2.trim().length > 0 && (
            <TouchableOpacity style={styles.checkboxRow} disabled={!isTeacher} onPress={() => toggleCheckbox(s2Teacher, setS2Teacher, 'awrCustom2', !isTeacher)}>
              <Ionicons name={s2Teacher.awrCustom2 ? "checkbox-outline" : "square-outline"} size={18} color={s2Teacher.awrCustom2 ? gems.sapphire : '#666'} />
              <Text style={[styles.checkboxLabel, { color: theme.text }]}>{s2TeacherCustom.awrCustom2}</Text>
            </TouchableOpacity>
          )}
          {[
            { key: 'awr1', label: 'The learner collected data and presented it comprehensively.' },
            { key: 'awr2', label: 'The learner clearly translated data into understandable findings.' },
            { key: 'awr3', label: 'The learner proposed practical recommendations in alignment.' },
          ].map(item => (
            <TouchableOpacity
              key={item.key}
              style={styles.checkboxRow}
              disabled={!isTeacher}
              onPress={() => toggleCheckbox(s2Teacher, setS2Teacher, item.key, !isTeacher)}
            >
              <Ionicons name={s2Teacher[item.key] ? "checkbox-outline" : "square-outline"} size={18} color={s2Teacher[item.key] ? gems.sapphire : '#666'} />
              <Text style={[styles.checkboxLabel, { color: theme.text }]}>{item.label}</Text>
            </TouchableOpacity>
          ))}

          {/* Sensitivity */}
          <Text style={[styles.subHeader, { marginTop: 16 }]}>Sensitivity (Sum: {s2TeacherSums.sen}/5)</Text>
          <TextInput
            style={[styles.textInput, { marginBottom: 8 }]}
            placeholder="Custom parameter 1..."
            placeholderTextColor="#999"
            value={s2TeacherCustom.senCustom1}
            onChangeText={(v) => setS2TeacherCustom(prev => ({ ...prev, senCustom1: v }))}
            editable={isTeacher}
          />
          {s2TeacherCustom.senCustom1.trim().length > 0 && (
            <TouchableOpacity style={styles.checkboxRow} disabled={!isTeacher} onPress={() => toggleCheckbox(s2Teacher, setS2Teacher, 'senCustom1', !isTeacher)}>
              <Ionicons name={s2Teacher.senCustom1 ? "checkbox-outline" : "square-outline"} size={18} color={s2Teacher.senCustom1 ? gems.sapphire : '#666'} />
              <Text style={[styles.checkboxLabel, { color: theme.text }]}>{s2TeacherCustom.senCustom1}</Text>
            </TouchableOpacity>
          )}
          <TextInput
            style={[styles.textInput, { marginBottom: 12 }]}
            placeholder="Custom parameter 2..."
            placeholderTextColor="#999"
            value={s2TeacherCustom.senCustom2}
            onChangeText={(v) => setS2TeacherCustom(prev => ({ ...prev, senCustom2: v }))}
            editable={isTeacher}
          />
          {s2TeacherCustom.senCustom2.trim().length > 0 && (
            <TouchableOpacity style={styles.checkboxRow} disabled={!isTeacher} onPress={() => toggleCheckbox(s2Teacher, setS2Teacher, 'senCustom2', !isTeacher)}>
              <Ionicons name={s2Teacher.senCustom2 ? "checkbox-outline" : "square-outline"} size={18} color={s2Teacher.senCustom2 ? gems.sapphire : '#666'} />
              <Text style={[styles.checkboxLabel, { color: theme.text }]}>{s2TeacherCustom.senCustom2}</Text>
            </TouchableOpacity>
          )}
          {[
            { key: 'sen1', label: 'Data collection and analysis was fair and impartial.' },
            { key: 'sen2', label: 'The learner clearly articulated social impact of recommendations.' },
            { key: 'sen3', label: 'The learner handled discrete info in confidential manner.' },
          ].map(item => (
            <TouchableOpacity
              key={item.key}
              style={styles.checkboxRow}
              disabled={!isTeacher}
              onPress={() => toggleCheckbox(s2Teacher, setS2Teacher, item.key, !isTeacher)}
            >
              <Ionicons name={s2Teacher[item.key] ? "checkbox-outline" : "square-outline"} size={18} color={s2Teacher[item.key] ? gems.sapphire : '#666'} />
              <Text style={[styles.checkboxLabel, { color: theme.text }]}>{item.label}</Text>
            </TouchableOpacity>
          ))}

          {/* Creativity */}
          <Text style={[styles.subHeader, { marginTop: 16 }]}>Creativity (Sum: {s2TeacherSums.cre}/5)</Text>
          <TextInput
            style={[styles.textInput, { marginBottom: 8 }]}
            placeholder="Custom parameter 1..."
            placeholderTextColor="#999"
            value={s2TeacherCustom.creCustom1}
            onChangeText={(v) => setS2TeacherCustom(prev => ({ ...prev, creCustom1: v }))}
            editable={isTeacher}
          />
          {s2TeacherCustom.creCustom1.trim().length > 0 && (
            <TouchableOpacity style={styles.checkboxRow} disabled={!isTeacher} onPress={() => toggleCheckbox(s2Teacher, setS2Teacher, 'creCustom1', !isTeacher)}>
              <Ionicons name={s2Teacher.creCustom1 ? "checkbox-outline" : "square-outline"} size={18} color={s2Teacher.creCustom1 ? gems.sapphire : '#666'} />
              <Text style={[styles.checkboxLabel, { color: theme.text }]}>{s2TeacherCustom.creCustom1}</Text>
            </TouchableOpacity>
          )}
          <TextInput
            style={[styles.textInput, { marginBottom: 12 }]}
            placeholder="Custom parameter 2..."
            placeholderTextColor="#999"
            value={s2TeacherCustom.creCustom2}
            onChangeText={(v) => setS2TeacherCustom(prev => ({ ...prev, creCustom2: v }))}
            editable={isTeacher}
          />
          {s2TeacherCustom.creCustom2.trim().length > 0 && (
            <TouchableOpacity style={styles.checkboxRow} disabled={!isTeacher} onPress={() => toggleCheckbox(s2Teacher, setS2Teacher, 'creCustom2', !isTeacher)}>
              <Ionicons name={s2Teacher.creCustom2 ? "checkbox-outline" : "square-outline"} size={18} color={s2Teacher.creCustom2 ? gems.sapphire : '#666'} />
              <Text style={[styles.checkboxLabel, { color: theme.text }]}>{s2TeacherCustom.creCustom2}</Text>
            </TouchableOpacity>
          )}
          {[
            { key: 'cre1', label: 'Learner considered alternative drawbacks of recommendations.' },
            { key: 'cre2', label: 'The learner presented findings in an engaging format.' },
            { key: 'cre3', label: 'The learner proposed innovative yet realistically grounded tips.' },
          ].map(item => (
            <TouchableOpacity
              key={item.key}
              style={styles.checkboxRow}
              disabled={!isTeacher}
              onPress={() => toggleCheckbox(s2Teacher, setS2Teacher, item.key, !isTeacher)}
            >
              <Ionicons name={s2Teacher[item.key] ? "checkbox-outline" : "square-outline"} size={18} color={s2Teacher[item.key] ? gems.sapphire : '#666'} />
              <Text style={[styles.checkboxLabel, { color: theme.text }]}>{item.label}</Text>
            </TouchableOpacity>
          ))}

          {/* Comments */}
          <Text style={[styles.inputLabel, { marginTop: 16 }]}>Pedagogical Comments</Text>
          <AutoResizingInput
            placeholder="Comments and pedagogical interventions..."
            value={s2Teacher.comments}
            onChangeText={(v) => setS2Teacher(prev => ({ ...prev, comments: v }))}
            minHeight={60}
            editable={isTeacher}
            style={styles.underlineInput}
          />
        </GemCutCard>

        {/* Learner Reflection + Self encouragement */}
        <GemCutCard borderColor={gems.sapphire + '40'} style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardHeader}>Learner Reflection (Stage 2)</Text>
            <View style={styles.badge}><Text style={styles.badgeText}>Self</Text></View>
          </View>

          <Text style={styles.subHeader}>Awareness (Sum: {s2LearnerSums.awr}/3)</Text>
          {[
            { key: 'awr1', label: 'I was able to address the challenges I anticipated.' },
            { key: 'awr2', label: 'I was able to collect data from a sufficient number of respondents.' },
            { key: 'awr3', label: 'I was able to refine the draft through the course.' },
          ].map(item => (
            <TouchableOpacity key={item.key} style={styles.checkboxRow} onPress={() => toggleCheckbox(s2Learner, setS2Learner, item.key)}>
              <Ionicons name={s2Learner[item.key] ? "checkbox-outline" : "square-outline"} size={18} color={s2Learner[item.key] ? gems.sapphire : '#666'} />
              <Text style={[styles.checkboxLabel, { color: theme.text }]}>{item.label}</Text>
            </TouchableOpacity>
          ))}

          <Text style={[styles.subHeader, { marginTop: 12 }]}>Sensitivity (Sum: {s2LearnerSums.sen}/3)</Text>
          {[
            { key: 'sen1', label: 'I was aware of my personal biases while collecting data.' },
            { key: 'sen2', label: 'I used inclusive and accessible terminology.' },
            { key: 'sen3', label: 'I handled discrete information in confidential manner.' },
          ].map(item => (
            <TouchableOpacity key={item.key} style={styles.checkboxRow} onPress={() => toggleCheckbox(s2Learner, setS2Learner, item.key)}>
              <Ionicons name={s2Learner[item.key] ? "checkbox-outline" : "square-outline"} size={18} color={s2Learner[item.key] ? gems.sapphire : '#666'} />
              <Text style={[styles.checkboxLabel, { color: theme.text }]}>{item.label}</Text>
            </TouchableOpacity>
          ))}

          <Text style={[styles.subHeader, { marginTop: 12 }]}>Creativity (Sum: {s2LearnerSums.cre}/3)</Text>
          {[
            { key: 'cre1', label: 'I was able to consider various strategies to collect data.' },
            { key: 'cre2', label: 'I adjusted approach when needed to solve issues.' },
            { key: 'cre3', label: 'I explored various ways to present findings in engaging format.' },
          ].map(item => (
            <TouchableOpacity key={item.key} style={styles.checkboxRow} onPress={() => toggleCheckbox(s2Learner, setS2Learner, item.key)}>
              <Ionicons name={s2Learner[item.key] ? "checkbox-outline" : "square-outline"} size={18} color={s2Learner[item.key] ? gems.sapphire : '#666'} />
              <Text style={[styles.checkboxLabel, { color: theme.text }]}>{item.label}</Text>
            </TouchableOpacity>
          ))}

          <Text style={[styles.inputLabel, { marginTop: 16 }]}>Leave some words of appreciation/encouragement for yourself</Text>
          <AutoResizingInput
            placeholder="Encourage yourself here..."
            value={s2Learner.appreciation}
            onChangeText={(v) => setS2Learner(prev => ({ ...prev, appreciation: v }))}
            minHeight={50}
            style={styles.underlineInput}
          />
        </GemCutCard>
      </ScrollView>
    );
  };

  // Tab 3: Stage 3 Peer Review & Finalization
  const renderStage3 = () => {
    return (
      <ScrollView style={styles.tabContent} contentContainerStyle={{ paddingBottom: 60 }} nestedScrollEnabled>
        {/* Teacher checklist with 4 predefined + 2 custom */}
        <GemCutCard borderColor={gems.sapphire + '40'} style={[styles.card, !isTeacher && styles.disabledCard]}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardHeader}>Teacher Assessment (Stage 3)</Text>
            <View style={[styles.badge, { backgroundColor: gems.sapphire + '20' }]}><Text style={{ color: gems.sapphire, fontWeight: '700', fontSize: 8 }}>TEACHER</Text></View>
          </View>

          {!isTeacher && (
            <View style={styles.lockNotice}>
              <Ionicons name="lock-closed" size={14} color="#eab308" />
              <Text style={styles.lockNoticeText}>Locked for student & peer edits</Text>
            </View>
          )}

          {/* Awareness */}
          <Text style={styles.subHeader}>Awareness (Sum: {s3TeacherSums.awr}/6)</Text>
          <TextInput
            style={[styles.textInput, { marginBottom: 8 }]}
            placeholder="Custom parameter 1..."
            placeholderTextColor="#999"
            value={s3TeacherCustom.awrCustom1}
            onChangeText={(v) => setS3TeacherCustom(prev => ({ ...prev, awrCustom1: v }))}
            editable={isTeacher}
          />
          {s3TeacherCustom.awrCustom1.trim().length > 0 && (
            <TouchableOpacity style={styles.checkboxRow} disabled={!isTeacher} onPress={() => toggleCheckbox(s3Teacher, setS3Teacher, 'awrCustom1', !isTeacher)}>
              <Ionicons name={s3Teacher.awrCustom1 ? "checkbox-outline" : "square-outline"} size={18} color={s3Teacher.awrCustom1 ? gems.sapphire : '#666'} />
              <Text style={[styles.checkboxLabel, { color: theme.text }]}>{s3TeacherCustom.awrCustom1}</Text>
            </TouchableOpacity>
          )}
          <TextInput
            style={[styles.textInput, { marginBottom: 12 }]}
            placeholder="Custom parameter 2..."
            placeholderTextColor="#999"
            value={s3TeacherCustom.awrCustom2}
            onChangeText={(v) => setS3TeacherCustom(prev => ({ ...prev, awrCustom2: v }))}
            editable={isTeacher}
          />
          {s3TeacherCustom.awrCustom2.trim().length > 0 && (
            <TouchableOpacity style={styles.checkboxRow} disabled={!isTeacher} onPress={() => toggleCheckbox(s3Teacher, setS3Teacher, 'awrCustom2', !isTeacher)}>
              <Ionicons name={s3Teacher.awrCustom2 ? "checkbox-outline" : "square-outline"} size={18} color={s3Teacher.awrCustom2 ? gems.sapphire : '#666'} />
              <Text style={[styles.checkboxLabel, { color: theme.text }]}>{s3TeacherCustom.awrCustom2}</Text>
            </TouchableOpacity>
          )}
          {[
            { key: 'awr1', label: 'The learner has refined the discussions.' },
            { key: 'awr2', label: 'Prior knowledge has been revised/augmented in discussions.' },
            { key: 'awr3', label: 'The revised draft is suitable for peer review.' },
            { key: 'awr4', label: 'Evidences have been included in conclusions.' },
          ].map(item => (
            <TouchableOpacity
              key={item.key}
              style={styles.checkboxRow}
              disabled={!isTeacher}
              onPress={() => toggleCheckbox(s3Teacher, setS3Teacher, item.key, !isTeacher)}
            >
              <Ionicons name={s3Teacher[item.key] ? "checkbox-outline" : "square-outline"} size={18} color={s3Teacher[item.key] ? gems.sapphire : '#666'} />
              <Text style={[styles.checkboxLabel, { color: theme.text }]}>{item.label}</Text>
            </TouchableOpacity>
          ))}

          {/* Sensitivity */}
          <Text style={[styles.subHeader, { marginTop: 16 }]}>Sensitivity (Sum: {s3TeacherSums.sen}/5)</Text>
          <TextInput
            style={[styles.textInput, { marginBottom: 8 }]}
            placeholder="Custom parameter 1..."
            placeholderTextColor="#999"
            value={s3TeacherCustom.senCustom1}
            onChangeText={(v) => setS3TeacherCustom(prev => ({ ...prev, senCustom1: v }))}
            editable={isTeacher}
          />
          {s3TeacherCustom.senCustom1.trim().length > 0 && (
            <TouchableOpacity style={styles.checkboxRow} disabled={!isTeacher} onPress={() => toggleCheckbox(s3Teacher, setS3Teacher, 'senCustom1', !isTeacher)}>
              <Ionicons name={s3Teacher.senCustom1 ? "checkbox-outline" : "square-outline"} size={18} color={s3Teacher.senCustom1 ? gems.sapphire : '#666'} />
              <Text style={[styles.checkboxLabel, { color: theme.text }]}>{s3TeacherCustom.senCustom1}</Text>
            </TouchableOpacity>
          )}
          <TextInput
            style={[styles.textInput, { marginBottom: 12 }]}
            placeholder="Custom parameter 2..."
            placeholderTextColor="#999"
            value={s3TeacherCustom.senCustom2}
            onChangeText={(v) => setS3TeacherCustom(prev => ({ ...prev, senCustom2: v }))}
            editable={isTeacher}
          />
          {s3TeacherCustom.senCustom2.trim().length > 0 && (
            <TouchableOpacity style={styles.checkboxRow} disabled={!isTeacher} onPress={() => toggleCheckbox(s3Teacher, setS3Teacher, 'senCustom2', !isTeacher)}>
              <Ionicons name={s3Teacher.senCustom2 ? "checkbox-outline" : "square-outline"} size={18} color={s3Teacher.senCustom2 ? gems.sapphire : '#666'} />
              <Text style={[styles.checkboxLabel, { color: theme.text }]}>{s3TeacherCustom.senCustom2}</Text>
            </TouchableOpacity>
          )}
          {[
            { key: 'sen1', label: 'The learner is able to accept constructive feedback.' },
            { key: 'sen2', label: 'The learner incorporates peer feedback as needed.' },
            { key: 'sen3', label: 'The revised draft is inclusive and respectful.' },
          ].map(item => (
            <TouchableOpacity
              key={item.key}
              style={styles.checkboxRow}
              disabled={!isTeacher}
              onPress={() => toggleCheckbox(s3Teacher, setS3Teacher, item.key, !isTeacher)}
            >
              <Ionicons name={s3Teacher[item.key] ? "checkbox-outline" : "square-outline"} size={18} color={s3Teacher[item.key] ? gems.sapphire : '#666'} />
              <Text style={[styles.checkboxLabel, { color: theme.text }]}>{item.label}</Text>
            </TouchableOpacity>
          ))}

          {/* Creativity */}
          <Text style={[styles.subHeader, { marginTop: 16 }]}>Creativity (Sum: {s3TeacherSums.cre}/5)</Text>
          <TextInput
            style={[styles.textInput, { marginBottom: 8 }]}
            placeholder="Custom parameter 1..."
            placeholderTextColor="#999"
            value={s3TeacherCustom.creCustom1}
            onChangeText={(v) => setS3TeacherCustom(prev => ({ ...prev, creCustom1: v }))}
            editable={isTeacher}
          />
          {s3TeacherCustom.creCustom1.trim().length > 0 && (
            <TouchableOpacity style={styles.checkboxRow} disabled={!isTeacher} onPress={() => toggleCheckbox(s3Teacher, setS3Teacher, 'creCustom1', !isTeacher)}>
              <Ionicons name={s3Teacher.creCustom1 ? "checkbox-outline" : "square-outline"} size={18} color={s3Teacher.creCustom1 ? gems.sapphire : '#666'} />
              <Text style={[styles.checkboxLabel, { color: theme.text }]}>{s3TeacherCustom.creCustom1}</Text>
            </TouchableOpacity>
          )}
          <TextInput
            style={[styles.textInput, { marginBottom: 12 }]}
            placeholder="Custom parameter 2..."
            placeholderTextColor="#999"
            value={s3TeacherCustom.creCustom2}
            onChangeText={(v) => setS3TeacherCustom(prev => ({ ...prev, creCustom2: v }))}
            editable={isTeacher}
          />
          {s3TeacherCustom.creCustom2.trim().length > 0 && (
            <TouchableOpacity style={styles.checkboxRow} disabled={!isTeacher} onPress={() => toggleCheckbox(s3Teacher, setS3Teacher, 'creCustom2', !isTeacher)}>
              <Ionicons name={s3Teacher.creCustom2 ? "checkbox-outline" : "square-outline"} size={18} color={s3Teacher.creCustom2 ? gems.sapphire : '#666'} />
              <Text style={[styles.checkboxLabel, { color: theme.text }]}>{s3TeacherCustom.creCustom2}</Text>
            </TouchableOpacity>
          )}
          {[
            { key: 'cre1', label: 'The learner responds to feedback in innovative ways.' },
            { key: 'cre2', label: 'The revised draft includes novel data collection methods.' },
            { key: 'cre3', label: 'The learner explores engaging presentation layouts.' },
          ].map(item => (
            <TouchableOpacity
              key={item.key}
              style={styles.checkboxRow}
              disabled={!isTeacher}
              onPress={() => toggleCheckbox(s3Teacher, setS3Teacher, item.key, !isTeacher)}
            >
              <Ionicons name={s3Teacher[item.key] ? "checkbox-outline" : "square-outline"} size={18} color={s3Teacher[item.key] ? gems.sapphire : '#666'} />
              <Text style={[styles.checkboxLabel, { color: theme.text }]}>{item.label}</Text>
            </TouchableOpacity>
          ))}

          {/* Comments */}
          <Text style={[styles.inputLabel, { marginTop: 16 }]}>Pedagogical Comments</Text>
          <AutoResizingInput
            placeholder="Comments and pedagogical interventions..."
            value={s3Teacher.comments}
            onChangeText={(v) => setS3Teacher(prev => ({ ...prev, comments: v }))}
            minHeight={60}
            editable={isTeacher}
            style={styles.underlineInput}
          />
        </GemCutCard>

        {/* Peer Feedback checklist */}
        <GemCutCard borderColor={gems.sapphire + '40'} style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardHeader}>Peer Feedback (Stage 3)</Text>
            <View style={[styles.badge, { backgroundColor: gems.silver + '20' }]}><Text style={{ color: gems.silver, fontWeight: '700', fontSize: 8 }}>PEER</Text></View>
          </View>
          
          <Text style={styles.subHeader}>Awareness (Sum: {s3PeerSums.awr}/3)</Text>
          {[
            { key: 'awr1', label: 'My peer presented a revised draft clear enough to review.' },
            { key: 'awr2', label: 'There was a good fit between research problem and approach.' },
            { key: 'awr3', label: 'The revised draft of the interview was easy to understand.' },
          ].map(item => (
            <TouchableOpacity key={item.key} style={styles.checkboxRow} onPress={() => toggleCheckbox(s3Peer, setS3Peer, item.key)}>
              <Ionicons name={s3Peer[item.key] ? "checkbox-outline" : "square-outline"} size={18} color={s3Peer[item.key] ? gems.sapphire : '#666'} />
              <Text style={[styles.checkboxLabel, { color: theme.text }]}>{item.label}</Text>
            </TouchableOpacity>
          ))}

          <Text style={[styles.subHeader, { marginTop: 12 }]}>Sensitivity (Sum: {s3PeerSums.sen}/3)</Text>
          {[
            { key: 'sen1', label: 'My peer was able to receive feedback in a respectful manner.' },
            { key: 'sen2', label: 'My peer was willing to modify the draft based on suggestions.' },
            { key: 'sen3', label: 'The wording of the interview was respectful of respondents’ emotions.' },
          ].map(item => (
            <TouchableOpacity key={item.key} style={styles.checkboxRow} onPress={() => toggleCheckbox(s3Peer, setS3Peer, item.key)}>
              <Ionicons name={s3Peer[item.key] ? "checkbox-outline" : "square-outline"} size={18} color={s3Peer[item.key] ? gems.sapphire : '#666'} />
              <Text style={[styles.checkboxLabel, { color: theme.text }]}>{item.label}</Text>
            </TouchableOpacity>
          ))}

          <Text style={[styles.subHeader, { marginTop: 12 }]}>Creativity (Sum: {s3PeerSums.cre}/3)</Text>
          {[
            { key: 'cre1', label: 'My peer was willing to consider alternate collection methods.' },
            { key: 'cre2', label: 'My peer was willing to consider alternate groups of respondents.' },
            { key: 'cre3', label: 'My peer thought of different ways to motivate respondents.' },
          ].map(item => (
            <TouchableOpacity key={item.key} style={styles.checkboxRow} onPress={() => toggleCheckbox(s3Peer, setS3Peer, item.key)}>
              <Ionicons name={s3Peer[item.key] ? "checkbox-outline" : "square-outline"} size={18} color={s3Peer[item.key] ? gems.sapphire : '#666'} />
              <Text style={[styles.checkboxLabel, { color: theme.text }]}>{item.label}</Text>
            </TouchableOpacity>
          ))}

          <Text style={[styles.inputLabel, { marginTop: 16 }]}>Leave some words of appreciation/encouragement for your peer</Text>
          <AutoResizingInput
            placeholder="Encourage your peer here..."
            value={s3Peer.appreciation}
            onChangeText={(v) => setS3Peer(prev => ({ ...prev, appreciation: v }))}
            minHeight={50}
            style={styles.underlineInput}
          />
        </GemCutCard>
      </ScrollView>
    );
  };

  // Tab 4: Overview Tabulations & Post reflections
  const renderOverview = () => {
    const sugAwrT = getSuggestedLevelTeacher(teacherGrandTotals.awr);
    const sugSenT = getSuggestedLevelTeacher(teacherGrandTotals.sen);
    const sugCreT = getSuggestedLevelTeacher(teacherGrandTotals.cre);

    const sugAwrL = getSuggestedLevelLearner(learnerGrandTotals.awr);
    const sugSenL = getSuggestedLevelLearner(learnerGrandTotals.sen);
    const sugCreL = getSuggestedLevelLearner(learnerGrandTotals.cre);

    const sugAwrP = getSuggestedLevelPeer(peerGrandTotals.awr);
    const sugSenP = getSuggestedLevelPeer(peerGrandTotals.sen);
    const sugCreP = getSuggestedLevelPeer(peerGrandTotals.cre);

    return (
      <ScrollView style={styles.tabContent} contentContainerStyle={{ paddingBottom: 60 }} nestedScrollEnabled>
        {/* Teacher Overview */}
        <GemCutCard borderColor={gems.sapphire + '40'} style={[styles.card, !isTeacher && styles.disabledCard]}>
          <Text style={styles.cardHeader}>1. Teacher Overview & Levels</Text>
          
          {['awr', 'sen', 'cre'].map(key => {
            const nameMap = { awr: 'Awareness', sen: 'Sensitivity', cre: 'Creativity' };
            const selectedLevel = levelOverviewTeacher[key];
            const ticksSum = teacherGrandTotals[key];
            const maxTicks = key === 'awr' ? 16 : 15;
            const sug = getSuggestedLevelTeacher(ticksSum);

            return (
              <View key={key} style={styles.overviewSection}>
                <Text style={styles.subHeader}>{nameMap[key].toUpperCase()} LEVEL</Text>
                <Text style={[styles.calculationHint, { color: theme.secondaryText }]}>
                  Math: Stage 1 ({s1TeacherSums[key]}) + Stage 2 ({s2TeacherSums[key]}) + Stage 3 ({s3TeacherSums[key]}) Ticks = {ticksSum} / {maxTicks}
                </Text>
                <Text style={styles.suggestedText}>Suggested: {sug} (Thresholds: 0-5 B, 6-10 P, 11-16 A)</Text>
                
                <View style={styles.radioRow}>
                  {['Beginner', 'Proficient', 'Advanced'].map(lvl => (
                    <TouchableOpacity
                      key={lvl}
                      style={[
                        styles.radioBtn,
                        selectedLevel === lvl && styles.radioBtnActive,
                        !isTeacher && { opacity: 0.7 }
                      ]}
                      disabled={!isTeacher}
                      onPress={() => setLevelOverviewTeacher(prev => ({ ...prev, [key]: lvl }))}
                    >
                      <Text style={[styles.radioText, selectedLevel === lvl && styles.radioTextActive]}>{lvl}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            );
          })}
        </GemCutCard>

        {/* Learner Overview */}
        <GemCutCard borderColor={gems.sapphire + '40'} style={styles.card}>
          <Text style={styles.cardHeader}>2. Learner Overview & Levels</Text>
          
          {['awr', 'sen', 'cre'].map(key => {
            const nameMap = { awr: 'Awareness', sen: 'Sensitivity', cre: 'Creativity' };
            const selectedLevel = levelOverviewLearner[key];
            const grandTotal = learnerGrandTotals[key];
            const sug = getSuggestedLevelLearner(grandTotal);

            return (
              <View key={key} style={styles.overviewSection}>
                <Text style={styles.subHeader}>{nameMap[key].toUpperCase()} LEVEL</Text>
                <Text style={[styles.calculationHint, { color: theme.secondaryText }]}>
                  Math: Stage 1 Ticks ({s1LearnerSums[key]}/3) + Stage 2 Ticks ({s2LearnerSums[key]}/3) = {grandTotal} / 6
                </Text>
                <Text style={styles.suggestedText}>Suggested: {sug} (Thresholds: 0-2 B, 3-4 P, 5-6 A)</Text>
                
                <View style={styles.radioRow}>
                  {['Beginner', 'Proficient', 'Advanced'].map(lvl => (
                    <TouchableOpacity
                      key={lvl}
                      style={[
                        styles.radioBtn,
                        selectedLevel === lvl && styles.radioBtnActive
                      ]}
                      onPress={() => setLevelOverviewLearner(prev => ({ ...prev, [key]: lvl }))}
                    >
                      <Text style={[styles.radioText, selectedLevel === lvl && styles.radioTextActive]}>{lvl}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            );
          })}
        </GemCutCard>

        {/* Peer Overview */}
        <GemCutCard borderColor={gems.sapphire + '40'} style={styles.card}>
          <Text style={styles.cardHeader}>3. Peer Overview & Levels</Text>
          
          {['awr', 'sen', 'cre'].map(key => {
            const nameMap = { awr: 'Awareness', sen: 'Sensitivity', cre: 'Creativity' };
            const selectedLevel = levelOverviewPeer[key];
            const grandTotal = peerGrandTotals[key];
            const sug = getSuggestedLevelPeer(grandTotal);

            return (
              <View key={key} style={styles.overviewSection}>
                <Text style={styles.subHeader}>{nameMap[key].toUpperCase()} LEVEL</Text>
                <Text style={[styles.calculationHint, { color: theme.secondaryText }]}>
                  Math: Stage 3 Peer Ticks = {grandTotal} / 3
                </Text>
                <Text style={styles.suggestedText}>Suggested: {sug} (Thresholds: 0-1 B, 2 P, 3 A)</Text>
                
                <View style={styles.radioRow}>
                  {['Beginner', 'Proficient', 'Advanced'].map(lvl => (
                    <TouchableOpacity
                      key={lvl}
                      style={[
                        styles.radioBtn,
                        selectedLevel === lvl && styles.radioBtnActive
                      ]}
                      onPress={() => setLevelOverviewPeer(prev => ({ ...prev, [key]: lvl }))}
                    >
                      <Text style={[styles.radioText, selectedLevel === lvl && styles.radioTextActive]}>{lvl}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            );
          })}
        </GemCutCard>

        {/* Reflections */}
        <GemCutCard borderColor={gems.sapphire + '40'} style={[styles.card, !isTeacher && styles.disabledCard]}>
          <Text style={styles.cardHeader}>4. Teacher Post-Inquiry Reflections</Text>
          
          <Text style={styles.inputLabel}>Final comments by the teacher (if any)</Text>
          <AutoResizingInput
            placeholder="Type final comments here..."
            value={postReflectionsTeacher.finalComments}
            onChangeText={(v) => setPostReflectionsTeacher(prev => ({ ...prev, finalComments: v }))}
            minHeight={50}
            editable={isTeacher}
            style={styles.underlineInput}
          />

          <Text style={[styles.inputLabel, { marginTop: 12 }]}>To perform better in future inquiries, the learner should work on...</Text>
          <AutoResizingInput
            placeholder="Recommended areas to work on..."
            value={postReflectionsTeacher.workOn}
            onChangeText={(v) => setPostReflectionsTeacher(prev => ({ ...prev, workOn: v }))}
            minHeight={50}
            editable={isTeacher}
            style={styles.underlineInput}
          />
        </GemCutCard>

        <GemCutCard borderColor={gems.sapphire + '40'} style={styles.card}>
          <Text style={styles.cardHeader}>5. Learner Post-Inquiry Reflections</Text>
          
          <Text style={styles.inputLabel}>What did I learn from this project?</Text>
          <AutoResizingInput
            placeholder="Describe key learnings..."
            value={postReflectionsLearner.learnt}
            onChangeText={(v) => setPostReflectionsLearner(prev => ({ ...prev, learnt: v }))}
            minHeight={50}
            style={styles.underlineInput}
          />

          <Text style={[styles.inputLabel, { marginTop: 12 }]}>What was the most enjoyable part of the project?</Text>
          <AutoResizingInput
            placeholder="Describe the highlight..."
            value={postReflectionsLearner.enjoyed}
            onChangeText={(v) => setPostReflectionsLearner(prev => ({ ...prev, enjoyed: v }))}
            minHeight={50}
            style={styles.underlineInput}
          />

          <Text style={[styles.inputLabel, { marginTop: 12 }]}>Three strengths I demonstrated in this project</Text>
          <AutoResizingInput
            placeholder="1. ..., 2. ..., 3. ..."
            value={postReflectionsLearner.strengths}
            onChangeText={(v) => setPostReflectionsLearner(prev => ({ ...prev, strengths: v }))}
            minHeight={50}
            style={styles.underlineInput}
          />

          <Text style={[styles.inputLabel, { marginTop: 12 }]}>What were the challenges I faced doing the project?</Text>
          <AutoResizingInput
            placeholder="Describe roadblocks..."
            value={postReflectionsLearner.challenges}
            onChangeText={(v) => setPostReflectionsLearner(prev => ({ ...prev, challenges: v }))}
            minHeight={50}
            style={styles.underlineInput}
          />

          <Text style={[styles.inputLabel, { marginTop: 12 }]}>Two areas of improvement I identified in this project</Text>
          <AutoResizingInput
            placeholder="1. ..., 2. ..."
            value={postReflectionsLearner.improvements}
            onChangeText={(v) => setPostReflectionsLearner(prev => ({ ...prev, improvements: v }))}
            minHeight={50}
            style={styles.underlineInput}
          />

          <Text style={[styles.inputLabel, { marginTop: 12 }]}>Some questions I still have...</Text>
          <AutoResizingInput
            placeholder="Unresolved inquiries..."
            value={postReflectionsLearner.questions}
            onChangeText={(v) => setPostReflectionsLearner(prev => ({ ...prev, questions: v }))}
            minHeight={50}
            style={styles.underlineInput}
          />
        </GemCutCard>

        {/* Linear Progression Navigation */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16, gap: 12 }}>
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 10, borderWidth: 1.5, borderColor: gems.sapphire, backgroundColor: 'rgba(46,88,148,0.06)' }}
            onPress={() => router.push('/stage4/PartB_GroupProject')}
          >
            <Ionicons name="arrow-back" size={16} color={gems.sapphire} />
            <Text style={{ fontSize: 12, fontWeight: '700', color: gems.sapphire, fontFamily: 'Outfit_600SemiBold' }}>Back: Part B</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 18, paddingVertical: 12, borderRadius: 10, backgroundColor: gems.sapphire }}
            onPress={() => router.push('/stage4/PartD_ClassroomInteractions')}
          >
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#FFF', fontFamily: 'Outfit_600SemiBold' }}>Next: Part D (Observation Template)</Text>
            <Ionicons name="arrow-forward" size={16} color="#FFF" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case 0: return renderSetup();
      case 1: return renderStage1();
      case 2: return renderStage2();
      case 3: return renderStage3();
      case 4: return renderOverview();
      default: return renderSetup();
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <PremiumBackground gemColor={gems.sapphire} />
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} />

        {/* Header */}
        <View style={styles.header}>
          <MenuDropdown />
          <View style={styles.headerTitleContainer}>
            <Text style={[styles.title, { color: theme.text }]}>PART C: PROBLEM-BASED INQUIRY</Text>
            <Text style={[styles.subtitle, { color: theme.secondaryText }]}>
              {targetProfile?.full_name || 'Loading...'}
            </Text>
          </View>
          <TouchableOpacity onPress={handleManualSave} style={styles.saveBtn}>
            <Ionicons name="cloud-upload-outline" size={20} color={gems.silver} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={gems.sapphire} />
            <Text style={[styles.loadingText, { color: theme.secondaryText }]}>Loading inquiry records...</Text>
          </View>
        ) : (
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
          >
            <AnimatedTabBar
              tabs={['Setup', 'Stage 1', 'Stage 2', 'Stage 3', 'Overview']}
              activeIndex={activeTab}
              onTabChange={setActiveTab}
            />

            <View style={{ flex: 1, paddingHorizontal: 16 }}>
              {renderActiveTab()}
            </View>
          </KeyboardAvoidingView>
        )}
      </SafeAreaView>
    </View>
  );
}

const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    zIndex: 99999,
    elevation: 99999,
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  saveBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 14,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  tabContent: {
    flex: 1,
    marginTop: 16,
  },
  card: {
    marginBottom: 16,
  },
  disabledCard: {
    opacity: 0.9,
  },
  cardHeader: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'Outfit_600SemiBold',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: gems.sapphire,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: 'rgba(46, 88, 148, 0.1)',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(46, 88, 148, 0.2)',
  },
  badgeText: {
    fontSize: 8,
    fontWeight: '700',
    color: gems.sapphire,
    textTransform: 'uppercase',
  },
  lockNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(234, 179, 8, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.2)',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    gap: 8,
  },
  lockNoticeText: {
    fontSize: 10.5,
    color: '#a16207',
    fontFamily: 'Inter_400Regular',
    flex: 1,
  },
  subHeader: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'Outfit_600SemiBold',
    letterSpacing: 1,
    color: theme.text,
    marginTop: 12,
    marginBottom: 6,
  },
  helperText: {
    fontSize: 10,
    color: theme.secondaryText,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: theme.secondaryText,
    marginTop: 8,
    marginBottom: 4,
    fontFamily: 'Outfit_600SemiBold',
  },
  textInput: {
    borderBottomWidth: 1.5,
    borderBottomColor: gems.sapphire,
    height: 40,
    fontSize: 13,
    color: theme.text,
    fontFamily: 'Inter_400Regular',
    paddingHorizontal: 4,
  },
  underlineInput: {
    borderBottomWidth: 1.5,
    borderBottomColor: gems.sapphire,
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    color: theme.text,
    paddingVertical: 6,
  },
  tagInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  addTagBtn: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: gems.sapphire,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginVertical: 4,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: gems.sapphire,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  tagText: {
    fontSize: 10,
    color: '#FFF',
    fontWeight: '600',
    fontFamily: 'Outfit_600SemiBold',
  },
  checkboxGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 10,
    columnGap: 16,
    marginTop: 10,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '45%',
    marginVertical: 4,
    gap: 8,
  },
  checkboxLabel: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    flex: 1,
  },
  scheduleGrid: {
    gap: 10,
    marginTop: 8,
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  scheduleLabel: {
    fontSize: 11,
    fontWeight: '700',
    width: 50,
    fontFamily: 'Outfit_600SemiBold',
  },
  radioRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  radioBtn: {
    flex: 1,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  radioBtnActive: {
    borderColor: gems.sapphire,
    backgroundColor: 'rgba(46, 88, 148, 0.08)',
  },
  radioText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#666',
    fontFamily: 'Outfit_600SemiBold',
  },
  radioTextActive: {
    color: gems.sapphire,
    fontWeight: '700',
  },
  overviewSection: {
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 12,
    marginBottom: 12,
  },
  calculationHint: {
    fontSize: 10,
    marginVertical: 2,
    fontStyle: 'italic',
  },
  suggestedText: {
    fontSize: 10,
    fontWeight: '700',
    color: gems.sapphire,
    marginVertical: 2.5,
  },
});
