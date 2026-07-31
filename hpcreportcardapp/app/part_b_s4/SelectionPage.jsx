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
  Image,
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

const IMAGE_SOURCES = {
  none: require('../../assets/images/visily-image-removebg-preview.png'),
  stream: require('../../assets/images/river.png'),
  mountain: require('../../assets/images/mountain+river.png'),
  sky: require('../../assets/images/ChatGPT_Image_May_11__2026__02_55_58_PM-removebg-preview.png'),
};

export default function PartBGroupProject() {
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
  // Tab 0: Initial Setup
  const [subjects, setSubjects] = useState([]);
  const [newSubject, setNewSubject] = useState('');
  const [goals, setGoals] = useState([]);
  const [newGoal, setNewGoal] = useState('');
  const [competencies, setCompetencies] = useState([]);
  const [newCompetency, setNewCompetency] = useState('');

  const [pedagogies, setPedagogies] = useState({
    art: false, toy: false, skill: false, iks: false, sports: false, tech: false, drama: false, other: false, otherSpecify: ''
  });
  const [projectPrompt, setProjectPrompt] = useState('');
  const [guidingQuestions, setGuidingQuestions] = useState('');
  const [whatIKnow, setWhatIKnow] = useState('');
  const [whatINeedToFind, setWhatINeedToFind] = useState('');
  
  const [schedule, setSchedule] = useState({
    day1: '', day2: '', day3: '', day4: '', day5: '', day6: '', day7: '', day8: '', day9: '', day10: ''
  });

  const [resourcesNeeded, setResourcesNeeded] = useState('');
  const [rolesMembers, setRolesMembers] = useState('');
  const [barriersProject, setBarriersProject] = useState('');

  // Tab 1: Stage 1 Brainstorming
  const [s1Learner, setS1Learner] = useState({
    awr1: false, awr2: false, awr3: false, awr4: false, awr5: false,
    sen1: false, sen2: false, sen3: false, sen4: false, sen5: false,
    cre1: false, cre2: false, cre3: false, cre4: false, cre5: false
  });
  const [s1Teacher, setS1Teacher] = useState({
    awr1: false, awr2: false, awr3: false, awr4: false, awr5: false,
    sen1: false, sen2: false, sen3: false, sen4: false, sen5: false,
    cre1: false, cre2: false, cre3: false, cre4: false, cre5: false,
    comments: ''
  });

  // Tab 2: Stage 2 Drafting
  const [s2Teacher, setS2Teacher] = useState({
    awr1: false, awr2: false, awr3: false, awr4: false, awr5: false, awr6: false,
    sen1: false, sen2: false, sen3: false, sen4: false, sen5: false, sen6: false,
    cre1: false, cre2: false, cre3: false, cre4: false, cre5: false, cre6: false,
    comments: ''
  });

  // Tab 3: Stage 3 Final Submission
  const [s3RubricGrid, setS3RubricGrid] = useState({
    awrBeg: '', awrProf: '', awrAdv: '',
    senBeg: '', senProf: '', senAdv: '',
    creBeg: '', creProf: '', creAdv: ''
  });
  const [s3TeacherSelection, setS3TeacherSelection] = useState({
    awr: '', sen: '', cre: '' // 'Beginner' (5), 'Proficient' (10), 'Advanced' (15)
  });
  const [s3Learner, setS3Learner] = useState({
    awr1: false, awr2: false, awr3: false,
    sen1: false, sen2: false, sen3: false,
    cre1: false, cre2: false, cre3: false
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
    questions: '',
    teacherModify: ''
  });

  const calculatedAverageValleyLevel = () => {
    const getLvlNum = (lvl) => {
      if (lvl === 'Beginner') return 1;
      if (lvl === 'Proficient') return 2;
      if (lvl === 'Advanced') return 3;
      return 0;
    };
    const vals = [
      getLvlNum(s3TeacherSelection.awr),
      getLvlNum(s3TeacherSelection.sen),
      getLvlNum(s3TeacherSelection.cre)
    ].filter(v => v > 0);
    
    if (vals.length > 0) {
      const sum = vals.reduce((a, b) => a + b, 0);
      const avg = Math.round(sum / vals.length);
      if (avg === 1) return 'stream';
      if (avg === 2) return 'mountain';
      if (avg === 3) return 'sky';
    }
    return 'none';
  };

  const renderGridCell = (abilityKey, lvl, cellKey, value, onChange, width) => {
    const isSelected = s3TeacherSelection[abilityKey] === lvl;
    return (
      <View style={[
        styles.tableCell,
        { width },
        isSelected && { borderColor: gems.sapphire, borderWidth: 1.5, backgroundColor: gems.sapphire + '08' }
      ]}>
        <TouchableOpacity
          style={styles.cellSelectionHeader}
          disabled={!isTeacher}
          onPress={() => setS3TeacherSelection(prev => ({ ...prev, [abilityKey]: lvl }))}
        >
          <Ionicons
            name={isSelected ? "radio-button-on" : "radio-button-off"}
            size={12}
            color={isSelected ? gems.sapphire : '#666'}
          />
          <Text style={[styles.cellSelectionText, isSelected && { color: gems.sapphire, fontWeight: '700' }]}>
            {lvl}
          </Text>
        </TouchableOpacity>
        <TextInput
          style={styles.cellTextInput}
          multiline
          placeholder="..."
          placeholderTextColor="#999"
          value={value}
          onChangeText={onChange}
          editable={isTeacher}
        />
      </View>
    );
  };

  // --- AUTO CALCULATIONS ---
  const s1LearnerSums = {
    awr: Object.values(s1Learner).slice(0, 5).filter(Boolean).length,
    sen: Object.values(s1Learner).slice(5, 10).filter(Boolean).length,
    cre: Object.values(s1Learner).slice(10, 15).filter(Boolean).length,
  };
  const s1TeacherSums = {
    awr: Object.values(s1Teacher).slice(0, 5).filter(Boolean).length,
    sen: Object.values(s1Teacher).slice(5, 10).filter(Boolean).length,
    cre: Object.values(s1Teacher).slice(10, 15).filter(Boolean).length,
  };
  const s2TeacherSums = {
    awr: Object.values(s2Teacher).slice(0, 6).filter(Boolean).length,
    sen: Object.values(s2Teacher).slice(6, 12).filter(Boolean).length,
    cre: Object.values(s2Teacher).slice(12, 18).filter(Boolean).length,
  };
  const s3LearnerSums = {
    awr: Object.values(s3Learner).slice(0, 3).filter(Boolean).length,
    sen: Object.values(s3Learner).slice(3, 6).filter(Boolean).length,
    cre: Object.values(s3Learner).slice(6, 9).filter(Boolean).length,
  };
  const s3PeerSums = {
    awr: Object.values(s3Peer).slice(0, 3).filter(Boolean).length,
    sen: Object.values(s3Peer).slice(3, 6).filter(Boolean).length,
    cre: Object.values(s3Peer).slice(6, 9).filter(Boolean).length,
  };

  // Sum of Teacher Stage 1 Ticks (0-5) + Stage 2 Ticks (0-6)
  const teacherTotalTicks = {
    awr: s1TeacherSums.awr + s2TeacherSums.awr, // max 11
    sen: s1TeacherSums.sen + s2TeacherSums.sen, // max 11
    cre: s1TeacherSums.cre + s2TeacherSums.cre, // max 11
  };

  const getRubricScoreVal = (level) => {
    if (level === 'Beginner') return 5;
    if (level === 'Proficient') return 10;
    if (level === 'Advanced') return 15;
    return 0;
  };

  // Grand totals: ticks sum (up to 11) + Stage 3 Rubric selection (5, 10, or 15)
  const teacherGrandTotals = {
    awr: teacherTotalTicks.awr + getRubricScoreVal(s3TeacherSelection.awr), // max 26
    sen: teacherTotalTicks.sen + getRubricScoreVal(s3TeacherSelection.sen),
    cre: teacherTotalTicks.cre + getRubricScoreVal(s3TeacherSelection.cre),
  };

  // Learner Grand totals: Stage 1 ticks (0-5) + Stage 3 ticks (0-3)
  const learnerGrandTotals = {
    awr: s1LearnerSums.awr + s3LearnerSums.awr, // max 8
    sen: s1LearnerSums.sen + s3LearnerSums.sen,
    cre: s1LearnerSums.cre + s3LearnerSums.cre,
  };

  // Peer Grand totals: Stage 3 ticks (0-3)
  const peerGrandTotals = {
    awr: s3PeerSums.awr,
    sen: s3PeerSums.sen,
    cre: s3PeerSums.cre,
  };

  // Helper to get suggested level based on math thresholds
  const getSuggestedLevelTeacher = (total) => {
    if (total >= 19) return 'Advanced';
    if (total >= 12) return 'Proficient';
    if (total >= 5) return 'Beginner';
    return '';
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
      partB: {
        subjects, goals, competencies, pedagogies, projectPrompt, guidingQuestions,
        whatIKnow, whatINeedToFind, schedule, resourcesNeeded, rolesMembers, barriersProject,
        s1Learner, s1Teacher, s2Teacher, s3RubricGrid, s3TeacherSelection, s3Learner, s3Peer,
        levelOverviewTeacher, levelOverviewLearner, levelOverviewPeer,
        postReflectionsTeacher, postReflectionsLearner
      }
    };

    const currentAssess = typeof targetProfile?.assessments === 'string'
      ? JSON.parse(targetProfile.assessments)
      : (targetProfile?.assessments || {});

    // Merge stage4 data
    const stage4Merged = { ...(currentAssess.stage4 || {}), ...stage4Obj };

    return {
      assessments: {
        ...currentAssess,
        stage4: stage4Merged
      }
    };
  }, [
    subjects, goals, competencies, pedagogies, projectPrompt, guidingQuestions,
    whatIKnow, whatINeedToFind, schedule, resourcesNeeded, rolesMembers, barriersProject,
    s1Learner, s1Teacher, s2Teacher, s3RubricGrid, s3TeacherSelection, s3Learner, s3Peer,
    levelOverviewTeacher, levelOverviewLearner, levelOverviewPeer,
    postReflectionsTeacher, postReflectionsLearner, targetProfile
  ]);

  const { triggerSave } = useAutoSave(targetUserId, getPayload, [
    subjects, goals, competencies, pedagogies, projectPrompt, guidingQuestions,
    whatIKnow, whatINeedToFind, schedule, resourcesNeeded, rolesMembers, barriersProject,
    s1Learner, s1Teacher, s2Teacher, s3RubricGrid, s3TeacherSelection, s3Learner, s3Peer,
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
        const b = assess.stage4?.partB;
        if (b) {
          if (b.subjects) setSubjects(b.subjects);
          if (b.goals) setGoals(b.goals);
          if (b.competencies) setCompetencies(b.competencies);
          if (b.pedagogies) setPedagogies(b.pedagogies);
          if (b.projectPrompt) setProjectPrompt(b.projectPrompt);
          if (b.guidingQuestions) setGuidingQuestions(b.guidingQuestions);
          if (b.whatIKnow) setWhatIKnow(b.whatIKnow);
          if (b.whatINeedToFind) setWhatINeedToFind(b.whatINeedToFind);
          if (b.schedule) setSchedule(prev => ({ ...prev, ...b.schedule }));
          if (b.resourcesNeeded) setResourcesNeeded(b.resourcesNeeded);
          if (b.rolesMembers) setRolesMembers(b.rolesMembers);
          if (b.barriersProject) setBarriersProject(b.barriersProject);

          if (b.s1Learner) setS1Learner(prev => ({ ...prev, ...b.s1Learner }));
          if (b.s1Teacher) setS1Teacher(prev => ({ ...prev, ...b.s1Teacher }));
          if (b.s2Teacher) setS2Teacher(prev => ({ ...prev, ...b.s2Teacher }));

          if (b.s3RubricGrid) setS3RubricGrid(prev => ({ ...prev, ...b.s3RubricGrid }));
          if (b.s3TeacherSelection) setS3TeacherSelection(prev => ({ ...prev, ...b.s3TeacherSelection }));
          if (b.s3Learner) setS3Learner(prev => ({ ...prev, ...b.s3Learner }));
          if (b.s3Peer) setS3Peer(prev => ({ ...prev, ...b.s3Peer }));

          if (b.levelOverviewTeacher) setLevelOverviewTeacher(prev => ({ ...prev, ...b.levelOverviewTeacher }));
          if (b.levelOverviewLearner) setLevelOverviewLearner(prev => ({ ...prev, ...b.levelOverviewLearner }));
          if (b.levelOverviewPeer) setLevelOverviewPeer(prev => ({ ...prev, ...b.levelOverviewPeer }));

          if (b.postReflectionsTeacher) setPostReflectionsTeacher(prev => ({ ...prev, ...b.postReflectionsTeacher }));
          if (b.postReflectionsLearner) setPostReflectionsLearner(prev => ({ ...prev, ...b.postReflectionsLearner }));
        }
      }
    } catch (e) {
      console.warn("Failed to load project work data", e);
    } finally {
      setLoading(false);
    }
  };

  const handleManualSave = async () => {
    try {
      await triggerSave();
      Alert.alert("Saved Successfully", "Your progress for Group Project Work has been saved.");
    } catch (e) {
      Alert.alert("Save Failed", "Could not connect to the database.");
    }
  };

  // Helper toggle checkboxes
  const toggleCheckbox = (stateObj, stateSetter, key, locked = false) => {
    if (locked) return;
    stateSetter(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Tag inputs helper
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
        {/* Dynamic Lists: Subjects, Goals, Competencies */}
        <GemCutCard borderColor={gems.sapphire + '40'} style={styles.card}>
          <Text style={styles.cardHeader}>1. Context Definitions</Text>
          
          {/* Subjects */}
          <Text style={styles.inputLabel}>Subject(s) involved in the project</Text>
          <View style={styles.tagInputRow}>
            <TextInput
              style={[styles.textInput, { flex: 1 }]}
              placeholder="e.g. Social Science"
              placeholderTextColor="#999"
              value={newSubject}
              onChangeText={setNewSubject}
            />
            <TouchableOpacity
              style={styles.addTagBtn}
              onPress={() => addTag(subjects, setSubjects, newSubject, setNewSubject)}
            >
              <Text style={styles.addTagBtnText}>Add</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.tagsContainer}>
            {subjects.map((sub, idx) => (
              <View key={idx} style={styles.tagBadge}>
                <Text style={styles.tagText}>{sub}</Text>
                <TouchableOpacity onPress={() => removeTag(subjects, setSubjects, idx)}>
                  <Ionicons name="close-circle" size={14} color="#666" style={{ marginLeft: 4 }} />
                </TouchableOpacity>
              </View>
            ))}
          </View>

          {/* Goals */}
          <Text style={[styles.inputLabel, { marginTop: 12 }]}>Curricular Goal(s)</Text>
          <View style={styles.tagInputRow}>
            <TextInput
              style={[styles.textInput, { flex: 1 }]}
              placeholder="e.g. CG-1"
              placeholderTextColor="#999"
              value={newGoal}
              onChangeText={setNewGoal}
            />
            <TouchableOpacity
              style={styles.addTagBtn}
              onPress={() => addTag(goals, setGoals, newGoal, setNewGoal)}
            >
              <Text style={styles.addTagBtnText}>Add</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.tagsContainer}>
            {goals.map((g, idx) => (
              <View key={idx} style={styles.tagBadge}>
                <Text style={styles.tagText}>{g}</Text>
                <TouchableOpacity onPress={() => removeTag(goals, setGoals, idx)}>
                  <Ionicons name="close-circle" size={14} color="#666" style={{ marginLeft: 4 }} />
                </TouchableOpacity>
              </View>
            ))}
          </View>

          {/* Competencies */}
          <Text style={[styles.inputLabel, { marginTop: 12 }]}>Competency(-ies)</Text>
          <View style={styles.tagInputRow}>
            <TextInput
              style={[styles.textInput, { flex: 1 }]}
              placeholder="e.g. C-1.1"
              placeholderTextColor="#999"
              value={newCompetency}
              onChangeText={setNewCompetency}
            />
            <TouchableOpacity
              style={styles.addTagBtn}
              onPress={() => addTag(competencies, setCompetencies, newCompetency, setNewCompetency)}
            >
              <Text style={styles.addTagBtnText}>Add</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.tagsContainer}>
            {competencies.map((c, idx) => (
              <View key={idx} style={styles.tagBadge}>
                <Text style={styles.tagText}>{c}</Text>
                <TouchableOpacity onPress={() => removeTag(competencies, setCompetencies, idx)}>
                  <Ionicons name="close-circle" size={14} color="#666" style={{ marginLeft: 4 }} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </GemCutCard>

        {/* Pedagogies */}
        <GemCutCard borderColor={gems.sapphire + '40'} style={styles.card}>
          <Text style={styles.cardHeader}>2. Pedagogies (Tick all that apply)</Text>
          <View style={styles.checkboxGrid}>
            {[
              { key: 'art', label: 'Art-integrated' },
              { key: 'toy', label: 'Toy-based' },
              { key: 'skill', label: 'Skill-based learning' },
              { key: 'iks', label: 'Indian Knowledge Systems approaches' },
              { key: 'sports', label: 'Sports-integrated' },
              { key: 'tech', label: 'Technology-integrated' },
              { key: 'drama', label: 'Drama/Theatre-integrated' },
            ].map((item) => (
              <TouchableOpacity
                key={item.key}
                style={styles.checkboxRow}
                onPress={() => setPedagogies(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
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

          <TouchableOpacity
            style={[styles.checkboxRow, { marginTop: 8 }]}
            onPress={() => setPedagogies(prev => ({ ...prev, other: !prev.other }))}
          >
            <Ionicons
              name={pedagogies.other ? "checkbox-outline" : "square-outline"}
              size={18}
              color={pedagogies.other ? gems.sapphire : '#666'}
            />
            <Text style={[styles.checkboxLabel, { color: theme.text, fontWeight: '700' }]}>Any other (Specify below)</Text>
          </TouchableOpacity>

          {pedagogies.other && (
            <TextInput
              style={[styles.textInput, { marginTop: 6 }]}
              placeholder="Specify other pedagogy..."
              placeholderTextColor="#999"
              value={pedagogies.otherSpecify}
              onChangeText={(v) => setPedagogies(prev => ({ ...prev, otherSpecify: v }))}
            />
          )}
        </GemCutCard>

        {/* Project Prompt & Guiding Questions */}
        <GemCutCard borderColor={gems.sapphire + '40'} style={styles.card}>
          <Text style={styles.cardHeader}>3. Prompt & Challenge</Text>

          <Text style={styles.inputLabel}>Project Prompt / Question / Problem / Challenge / Planned Final Output</Text>
          <AutoResizingInput
            placeholder="Describe the main project assignment..."
            value={projectPrompt}
            onChangeText={setProjectPrompt}
            minHeight={60}
            style={styles.underlineInput}
          />

          <Text style={[styles.inputLabel, { marginTop: 12 }]}>Guiding Questions</Text>
          <AutoResizingInput
            placeholder="Unpack the prompt with questions..."
            value={guidingQuestions}
            onChangeText={setGuidingQuestions}
            minHeight={60}
            style={styles.underlineInput}
          />

          <Text style={[styles.inputLabel, { marginTop: 12 }]}>What do I know?</Text>
          <AutoResizingInput
            placeholder="Initial ideation: What I currently know..."
            value={whatIKnow}
            onChangeText={setWhatIKnow}
            minHeight={60}
            style={styles.underlineInput}
          />

          <Text style={[styles.inputLabel, { marginTop: 12 }]}>What do I need to find out?</Text>
          <AutoResizingInput
            placeholder="Initial ideation: What I need to discover..."
            value={whatINeedToFind}
            onChangeText={setWhatINeedToFind}
            minHeight={60}
            style={styles.underlineInput}
          />
        </GemCutCard>

        <View style={{ marginTop: 24, marginBottom: 20, alignItems: 'center' }}>
          <GemButton
            onPress={async () => { await handleManualSave(); setActiveTab(1); }}
            gemType="sapphire"
          >
            <Text style={styles.btnText}>PROCEED TO STAGE 1{"\n"}➔</Text>
          </GemButton>
        </View>
      </ScrollView>
    );
  };

    // Tab 1: Stage 1 Brainstorming & Ideation
  const renderStage1 = () => {
    return (
      <ScrollView style={styles.tabContent} contentContainerStyle={{ paddingBottom: 60 }} nestedScrollEnabled>
        {/* Learner Reflection */}
        <GemCutCard borderColor={gems.sapphire + '40'} style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardHeader}>Learner Reflection (Stage 1)</Text>
            <View style={styles.badge}><Text style={styles.badgeText}>Self</Text></View>
          </View>

          {/* Awareness */}
          <Text style={styles.subHeader}>Awareness (Sum: {s1LearnerSums.awr}/5)</Text>
          {[
            { key: 'awr1', label: 'I understand the purpose of the project.' },
            { key: 'awr2', label: 'I could read and understand the resource material.' },
            { key: 'awr3', label: 'I talk about things I know that are needed for the project.' },
            { key: 'awr4', label: 'I identify challenges my group might face during the project.' },
            { key: 'awr5', label: 'I could enumerate and describe the steps (start to finish) required.' },
          ].map(item => (
            <TouchableOpacity
              key={item.key}
              style={styles.checkboxRow}
              onPress={() => toggleCheckbox(s1Learner, setS1Learner, item.key)}
            >
              <Ionicons
                name={s1Learner[item.key] ? "checkbox-outline" : "square-outline"}
                size={18}
                color={s1Learner[item.key] ? gems.sapphire : '#666'}
              />
              <Text style={[styles.checkboxLabel, { color: theme.text }]}>{item.label}</Text>
            </TouchableOpacity>
          ))}

          {/* Sensitivity */}
          <Text style={[styles.subHeader, { marginTop: 16 }]}>Sensitivity (Sum: {s1LearnerSums.sen}/5)</Text>
          {[
            { key: 'sen1', label: "I listen to my group's ideas and respect them." },
            { key: 'sen2', label: 'I try to make sure group decisions are taken collectively.' },
            { key: 'sen3', label: 'I try to make sure that my peers understand all aspects.' },
            { key: 'sen4', label: 'I can meaningfully relate to the objectives of the project.' },
            { key: 'sen5', label: 'I feel joyous in contributing to the project.' },
          ].map(item => (
            <TouchableOpacity
              key={item.key}
              style={styles.checkboxRow}
              onPress={() => toggleCheckbox(s1Learner, setS1Learner, item.key)}
            >
              <Ionicons
                name={s1Learner[item.key] ? "checkbox-outline" : "square-outline"}
                size={18}
                color={s1Learner[item.key] ? gems.sapphire : '#666'}
              />
              <Text style={[styles.checkboxLabel, { color: theme.text }]}>{item.label}</Text>
            </TouchableOpacity>
          ))}

          {/* Creativity */}
          <Text style={[styles.subHeader, { marginTop: 16 }]}>Creativity (Sum: {s1LearnerSums.cre}/5)</Text>
          {[
            { key: 'cre1', label: 'I actively take part in brainstorming ideas.' },
            { key: 'cre2', label: 'I suggest tools or resources we can use.' },
            { key: 'cre3', label: 'I identify alternative approaches when something fails.' },
            { key: 'cre4', label: 'I suggest design styles or templates for final display.' },
            { key: 'cre5', label: 'I propose realistic solutions to our roadblocks.' },
          ].map(item => (
            <TouchableOpacity
              key={item.key}
              style={styles.checkboxRow}
              onPress={() => toggleCheckbox(s1Learner, setS1Learner, item.key)}
            >
              <Ionicons
                name={s1Learner[item.key] ? "checkbox-outline" : "square-outline"}
                size={18}
                color={s1Learner[item.key] ? gems.sapphire : '#666'}
              />
              <Text style={[styles.checkboxLabel, { color: theme.text }]}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </GemCutCard>

        {/* Teacher Observation */}
        <GemCutCard borderColor={gems.sapphire + '40'} style={[styles.card, !isTeacher && styles.disabledCard]}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardHeader}>Teacher Observation (Stage 1)</Text>
            <View style={[styles.badge, { backgroundColor: gems.sapphire + '20' }]}>
              <Text style={{ color: gems.sapphire, fontWeight: '700', fontSize: 8 }}>TEACHER ONLY</Text>
            </View>
          </View>

          {!isTeacher && (
            <View style={styles.lockNotice}>
              <Ionicons name="lock-closed" size={14} color="#eab308" />
              <Text style={styles.lockNoticeText}>Locked for student & peer edits</Text>
            </View>
          )}

          {/* Awareness */}
          <Text style={styles.subHeader}>Awareness (Sum: {s1TeacherSums.awr}/5)</Text>
          {[
            { key: 'awr1', label: 'The learner explains the project outline clearly.' },
            { key: 'awr2', label: 'The learner references materials and relevant facts.' },
            { key: 'awr3', label: 'The learner clarifies key challenges during startup.' },
            { key: 'awr4', label: 'The learner outlines sequence steps logically.' },
            { key: 'awr5', label: 'The learner identifies the needed logistical setup.' },
          ].map(item => (
            <TouchableOpacity
              key={item.key}
              style={styles.checkboxRow}
              disabled={!isTeacher}
              onPress={() => toggleCheckbox(s1Teacher, setS1Teacher, item.key, !isTeacher)}
            >
              <Ionicons
                name={s1Teacher[item.key] ? "checkbox-outline" : "square-outline"}
                size={18}
                color={s1Teacher[item.key] ? gems.sapphire : '#666'}
              />
              <Text style={[styles.checkboxLabel, { color: theme.text }]}>{item.label}</Text>
            </TouchableOpacity>
          ))}

          {/* Sensitivity */}
          <Text style={[styles.subHeader, { marginTop: 16 }]}>Sensitivity (Sum: {s1TeacherSums.sen}/5)</Text>
          {[
            { key: 'sen1', label: 'The learner respects peer views during brainstorming.' },
            { key: 'sen2', label: 'The learner takes input from quiet members.' },
            { key: 'sen3', label: 'The learner helps peers understand setup details.' },
            { key: 'sen4', label: 'The learner connects tasks to target curricular goals.' },
            { key: 'sen5', label: 'The learner displays enthusiasm and interest.' },
          ].map(item => (
            <TouchableOpacity
              key={item.key}
              style={styles.checkboxRow}
              disabled={!isTeacher}
              onPress={() => toggleCheckbox(s1Teacher, setS1Teacher, item.key, !isTeacher)}
            >
              <Ionicons
                name={s1Teacher[item.key] ? "checkbox-outline" : "square-outline"}
                size={18}
                color={s1Teacher[item.key] ? gems.sapphire : '#666'}
              />
              <Text style={[styles.checkboxLabel, { color: theme.text }]}>{item.label}</Text>
            </TouchableOpacity>
          ))}

          {/* Creativity */}
          <Text style={[styles.subHeader, { marginTop: 16 }]}>Creativity (Sum: {s1TeacherSums.cre}/5)</Text>
          {[
            { key: 'cre1', label: 'The learner brainstorms about execution/presentation.' },
            { key: 'cre2', label: 'The learner proposes materials beyond conventional resources.' },
            { key: 'cre3', label: 'The learner proposes solutions to possible barriers.' },
            { key: 'cre4', label: 'The learner provides creative input for group roles.' },
            { key: 'cre5', label: 'The learner goes beyond the prompt and adds a unique element.' },
          ].map(item => (
            <TouchableOpacity
              key={item.key}
              style={styles.checkboxRow}
              disabled={!isTeacher}
              onPress={() => toggleCheckbox(s1Teacher, setS1Teacher, item.key, !isTeacher)}
            >
              <Ionicons
                name={s1Teacher[item.key] ? "checkbox-outline" : "square-outline"}
                size={18}
                color={s1Teacher[item.key] ? gems.sapphire : '#666'}
              />
              <Text style={[styles.checkboxLabel, { color: theme.text }]}>{item.label}</Text>
            </TouchableOpacity>
          ))}

          {/* Pedagogical comments */}
          <Text style={[styles.inputLabel, { marginTop: 16 }]}>Brief comments and pedagogical interventions recommended</Text>
          <AutoResizingInput
            placeholder="Enter pedagogical comments..."
            value={s1Teacher.comments}
            onChangeText={(v) => setS1Teacher(prev => ({ ...prev, comments: v }))}
            minHeight={60}
            editable={isTeacher}
            style={styles.underlineInput}
          />
        </GemCutCard>

        {/* Schedule Day 1 - Day 10 */}
        <GemCutCard borderColor={gems.sapphire + '40'} style={styles.card}>
          <Text style={styles.cardHeader}>Project Schedule (Day 1 - Day 10)</Text>
          <View style={styles.scheduleGrid}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(day => (
              <View key={day} style={styles.scheduleRow}>
                <Text style={[styles.scheduleLabel, { color: theme.text }]}>Day {day}</Text>
                <TextInput
                  style={[styles.textInput, { flex: 1, color: theme.text }]}
                  placeholder={`Plan for Day ${day}...`}
                  placeholderTextColor="#999"
                  value={schedule[`day${day}`]}
                  onChangeText={(v) => setSchedule(prev => ({ ...prev, [`day${day}`]: v }))}
                />
              </View>
            ))}
          </View>
        </GemCutCard>

        {/* Logistics */}
        <GemCutCard borderColor={gems.sapphire + '40'} style={styles.card}>
          <Text style={styles.cardHeader}>Logistics Planning</Text>
          
          <Text style={styles.inputLabel}>Resources Needed</Text>
          <AutoResizingInput
            placeholder="Materials, books, web links, etc..."
            value={resourcesNeeded}
            onChangeText={setResourcesNeeded}
            minHeight={50}
            style={styles.underlineInput}
          />

          <Text style={[styles.inputLabel, { marginTop: 12 }]}>Roles of Group Members</Text>
          <AutoResizingInput
            placeholder="Assign roles to your group peers..."
            value={rolesMembers}
            onChangeText={setRolesMembers}
            minHeight={50}
            style={styles.underlineInput}
          />

          <Text style={[styles.inputLabel, { marginTop: 12 }]}>Possible Barriers to Doing the Project</Text>
          <AutoResizingInput
            placeholder="Describe any risks, time limits, or roadblocks..."
            value={barriersProject}
            style={styles.underlineInput}
          />
        </GemCutCard>

        <View style={{ marginTop: 24, marginBottom: 20, alignItems: 'center' }}>
          <GemButton
            onPress={async () => { await handleManualSave(); setActiveTab(2); }}
            gemType="sapphire"
          >
            <Text style={styles.btnText}>PROCEED TO STAGE 2{"\n"}➔</Text>
          </GemButton>
        </View>
      </ScrollView>
    );
  };
    const renderStage2 = () => {
    return (
      <ScrollView style={styles.tabContent} contentContainerStyle={{ paddingBottom: 60 }} nestedScrollEnabled>
        <GemCutCard borderColor={gems.sapphire + '40'} style={[styles.card, !isTeacher && styles.disabledCard]}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardHeader}>Teacher Assessment (Stage 2)</Text>
            <View style={[styles.badge, { backgroundColor: gems.sapphire + '20' }]}>
              <Text style={{ color: gems.sapphire, fontWeight: '700', fontSize: 8 }}>TEACHER ONLY</Text>
            </View>
          </View>

          {!isTeacher && (
            <View style={styles.lockNotice}>
              <Ionicons name="lock-closed" size={14} color="#eab308" />
              <Text style={styles.lockNoticeText}>Locked: This is the Teacher's solo round. Student and peer are locked out.</Text>
            </View>
          )}

          {/* Awareness */}
          <Text style={styles.subHeader}>Awareness (Sum: {s2TeacherSums.awr}/6)</Text>
          {[
            { key: 'awr1', label: 'Learner shows evidence of engagement in the project process.' },
            { key: 'awr2', label: 'Learner is able to present a draft of work done as per schedule.' },
            { key: 'awr3', label: 'Learner demonstrates thorough research skills on the topic.' },
            { key: 'awr4', label: 'Learner is able to identify possible draft improvements.' },
            { key: 'awr5', label: 'Learner is aware of different team members’ contributions.' },
            { key: 'awr6', label: 'Product created demonstrates application of knowledge gained.' },
          ].map(item => (
            <TouchableOpacity
              key={item.key}
              style={styles.checkboxRow}
              disabled={!isTeacher}
              onPress={() => toggleCheckbox(s2Teacher, setS2Teacher, item.key, !isTeacher)}
            >
              <Ionicons
                name={s2Teacher[item.key] ? "checkbox-outline" : "square-outline"}
                size={18}
                color={s2Teacher[item.key] ? gems.sapphire : '#666'}
              />
              <Text style={[styles.checkboxLabel, { color: theme.text }]}>{item.label}</Text>
            </TouchableOpacity>
          ))}

          {/* Sensitivity */}
          <Text style={[styles.subHeader, { marginTop: 16 }]}>Sensitivity (Sum: {s2TeacherSums.sen}/6)</Text>
          {[
            { key: 'sen1', label: 'Learner participates in group discussions respectfully.' },
            { key: 'sen2', label: 'Learner responds appropriately to other members’ emotions.' },
            { key: 'sen3', label: 'Learner attempts to build positive emotional atmosphere.' },
            { key: 'sen4', label: 'Learner demonstrates some understanding of social relevance.' },
            { key: 'sen5', label: 'Learner refrains from expressing negative emotions.' },
            { key: 'sen6', label: 'Learner participates enthusiastically and diligently.' },
          ].map(item => (
            <TouchableOpacity
              key={item.key}
              style={styles.checkboxRow}
              disabled={!isTeacher}
              onPress={() => toggleCheckbox(s2Teacher, setS2Teacher, item.key, !isTeacher)}
            >
              <Ionicons
                name={s2Teacher[item.key] ? "checkbox-outline" : "square-outline"}
                size={18}
                color={s2Teacher[item.key] ? gems.sapphire : '#666'}
              />
              <Text style={[styles.checkboxLabel, { color: theme.text }]}>{item.label}</Text>
            </TouchableOpacity>
          ))}

          {/* Creativity */}
          <Text style={[styles.subHeader, { marginTop: 16 }]}>Creativity (Sum: {s2TeacherSums.cre}/6)</Text>
          {[
            { key: 'cre1', label: 'Learner demonstrates flexibility with respect to project roles.' },
            { key: 'cre2', label: 'Learner displays willingness to consider alternative sources/tools.' },
            { key: 'cre3', label: 'Learner takes initiative to complete project tasks.' },
            { key: 'cre4', label: 'Learner builds on unique elements or incorporates them here.' },
            { key: 'cre5', label: 'Learner shows evidence of selecting ideas from brainstorming.' },
            { key: 'cre6', label: 'Product created is innovative and useful to the community.' },
          ].map(item => (
            <TouchableOpacity
              key={item.key}
              style={styles.checkboxRow}
              disabled={!isTeacher}
              onPress={() => toggleCheckbox(s2Teacher, setS2Teacher, item.key, !isTeacher)}
            >
              <Ionicons
                name={s2Teacher[item.key] ? "checkbox-outline" : "square-outline"}
                size={18}
                color={s2Teacher[item.key] ? gems.sapphire : '#666'}
              />
              <Text style={[styles.checkboxLabel, { color: theme.text }]}>{item.label}</Text>
            </TouchableOpacity>
          ))}

          {/* Comments */}
          <Text style={[styles.inputLabel, { marginTop: 16 }]}>Brief comments and pedagogical interventions recommended</Text>
          <AutoResizingInput
            placeholder="Enter pedagogical comments..."
            value={s2Teacher.comments}
            onChangeText={(v) => setS2Teacher(prev => ({ ...prev, comments: v }))}
            minHeight={60}
            editable={isTeacher}
            style={styles.underlineInput}
          />
        </GemCutCard>

        <View style={{ marginTop: 24, marginBottom: 20, alignItems: 'center' }}>
          <GemButton
            onPress={async () => { await handleManualSave(); setActiveTab(3); }}
            gemType="sapphire"
          >
            <Text style={styles.btnText}>PROCEED TO STAGE 3{"\n"}➔</Text>
          </GemButton>
        </View>
      </ScrollView>
    );
  };

  // Tab 3: Stage 3 Final Submission
  const renderStage3 = () => {
    return (
      <ScrollView style={styles.tabContent} contentContainerStyle={{ paddingBottom: 60 }} nestedScrollEnabled>
        {/* Rubric Valley View */}
        <GemCutCard borderColor={gems.sapphire + '40'} style={styles.card}>
          <Text style={styles.cardHeader}>Rubric Valley View</Text>
          <View style={styles.imageFrame}>
            <Image source={IMAGE_SOURCES[calculatedAverageValleyLevel()] || IMAGE_SOURCES.none} style={styles.valleyImage} resizeMode="contain" />
            <View style={styles.captionBadge}>
              <Text style={styles.imageCaption}>
                {calculatedAverageValleyLevel() === 'none' ? 'Select levels to color valley' : calculatedAverageValleyLevel() === 'stream' ? '◈ Stream Level' : calculatedAverageValleyLevel() === 'mountain' ? '◈ Mountain Level' : '◈ Sky Level'}
              </Text>
            </View>
          </View>
        </GemCutCard>

        {/* Unified Rubric Matrix Grid */}
        <GemCutCard borderColor={gems.sapphire + '40'} style={[styles.card, !isTeacher && styles.disabledCard]}>
          <Text style={styles.cardHeader}>1. Teacher Rubric Matrix Grid</Text>
          {!isTeacher && (
            <View style={styles.lockNotice}>
              <Ionicons name="lock-closed" size={14} color="#eab308" />
              <Text style={styles.lockNoticeText}>Locked for student & peer edits</Text>
            </View>
          )}
          <Text style={styles.helperText}>Type description criteria and select the assessed level (radio circle) for each ability:</Text>

          <View style={styles.table}>
            {/* Table Header */}
            <View style={styles.tableHeaderRow}>
              <View style={[styles.headerCell, { width: '28%' }]}>
                <Text style={styles.headerCellText}>ABILITY</Text>
              </View>
              <View style={[styles.headerCell, { width: '24%' }]}>
                <Text style={styles.headerCellText}>Stream</Text>
              </View>
              <View style={[styles.headerCell, { width: '24%' }]}>
                <Text style={styles.headerCellText}>Mountain</Text>
              </View>
              <View style={[styles.headerCell, { width: '24%', borderRightWidth: 0 }]}>
                <Text style={styles.headerCellText}>Sky</Text>
              </View>
            </View>

            {/* Table Rows */}
            {[
              { key: 'awr', label: 'Awareness', begKey: 'awrBeg', profKey: 'awrProf', advKey: 'awrAdv' },
              { key: 'sen', label: 'Sensitivity', begKey: 'senBeg', profKey: 'senProf', advKey: 'senAdv' },
              { key: 'cre', label: 'Creativity', begKey: 'creBeg', profKey: 'creProf', advKey: 'creAdv' }
            ].map(row => {
              return (
                <View key={row.key} style={styles.tableRow}>
                  {/* Side Title */}
                  <View style={[styles.sideHeaderCell, { width: '28%' }]}>
                    <Text style={styles.sideHeaderCellText}>{row.label}</Text>
                  </View>

                  {/* Beginner */}
                  {renderGridCell(row.key, 'Beginner', row.begKey, s3RubricGrid[row.begKey], (v) => setS3RubricGrid(prev => ({ ...prev, [row.begKey]: v })), '24%')}

                  {/* Proficient */}
                  {renderGridCell(row.key, 'Proficient', row.profKey, s3RubricGrid[row.profKey], (v) => setS3RubricGrid(prev => ({ ...prev, [row.profKey]: v })), '24%')}

                  {/* Advanced */}
                  {renderGridCell(row.key, 'Advanced', row.advKey, s3RubricGrid[row.advKey], (v) => setS3RubricGrid(prev => ({ ...prev, [row.advKey]: v })), '24%')}
                </View>
              );
            })}
          </View>
        </GemCutCard>

        {/* Learner Reflection Stage 3 */}
        <GemCutCard borderColor={gems.sapphire + '40'} style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardHeader}>3. Learner Reflection (Stage 3)</Text>
            <View style={styles.badge}><Text style={styles.badgeText}>Self</Text></View>
          </View>
          
          <Text style={styles.subHeader}>Awareness (Sum: {s3LearnerSums.awr}/3)</Text>
          {[
            { key: 'awr1', label: 'I could identify areas where my understanding has improved.' },
            { key: 'awr2', label: 'I could explain how my work contributed to the overall project.' },
            { key: 'awr3', label: 'I was able to improve the project based on reviews.' },
          ].map(item => (
            <TouchableOpacity
              key={item.key}
              style={styles.checkboxRow}
              onPress={() => toggleCheckbox(s3Learner, setS3Learner, item.key)}
            >
              <Ionicons
                name={s3Learner[item.key] ? "checkbox-outline" : "square-outline"}
                size={18}
                color={s3Learner[item.key] ? gems.sapphire : '#666'}
              />
              <Text style={[styles.checkboxLabel, { color: theme.text }]}>{item.label}</Text>
            </TouchableOpacity>
          ))}

          <Text style={[styles.subHeader, { marginTop: 12 }]}>Sensitivity (Sum: {s3LearnerSums.sen}/3)</Text>
          {[
            { key: 'sen1', label: 'I was able to build a positive emotional atmosphere within the group.' },
            { key: 'sen2', label: 'I could reflect on my strengths and areas for improvement.' },
            { key: 'sen3', label: 'I could understand the social relevance of the project.' },
          ].map(item => (
            <TouchableOpacity
              key={item.key}
              style={styles.checkboxRow}
              onPress={() => toggleCheckbox(s3Learner, setS3Learner, item.key)}
            >
              <Ionicons
                name={s3Learner[item.key] ? "checkbox-outline" : "square-outline"}
                size={18}
                color={s3Learner[item.key] ? gems.sapphire : '#666'}
              />
              <Text style={[styles.checkboxLabel, { color: theme.text }]}>{item.label}</Text>
            </TouchableOpacity>
          ))}

          <Text style={[styles.subHeader, { marginTop: 12 }]}>Creativity (Sum: {s3LearnerSums.cre}/3)</Text>
          {[
            { key: 'cre1', label: 'I was able to make creative contributions to the project.' },
            { key: 'cre2', label: 'I was able to take initiative to complete the project.' },
            { key: 'cre3', label: 'I was able to use different materials, tools, and resources.' },
          ].map(item => (
            <TouchableOpacity
              key={item.key}
              style={styles.checkboxRow}
              onPress={() => toggleCheckbox(s3Learner, setS3Learner, item.key)}
            >
              <Ionicons
                name={s3Learner[item.key] ? "checkbox-outline" : "square-outline"}
                size={18}
                color={s3Learner[item.key] ? gems.sapphire : '#666'}
              />
              <Text style={[styles.checkboxLabel, { color: theme.text }]}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </GemCutCard>

        {/* Peer Feedback Stage 3 */}
        <GemCutCard borderColor={gems.sapphire + '40'} style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardHeader}>4. Peer Feedback (Stage 3)</Text>
            <View style={[styles.badge, { backgroundColor: gems.silver + '20' }]}><Text style={{ color: gems.silver, fontWeight: '700', fontSize: 8 }}>PEER</Text></View>
          </View>
          
          <Text style={styles.subHeader}>Awareness (Sum: {s3PeerSums.awr}/3)</Text>
          {[
            { key: 'awr1', label: 'My peer showed improved understanding of the project.' },
            { key: 'awr2', label: 'My peer could explain how her/his work contributed.' },
            { key: 'awr3', label: 'My peer was able to improve the project based on reviews.' },
          ].map(item => (
            <TouchableOpacity
              key={item.key}
              style={styles.checkboxRow}
              onPress={() => toggleCheckbox(s3Peer, setS3Peer, item.key)}
            >
              <Ionicons
                name={s3Peer[item.key] ? "checkbox-outline" : "square-outline"}
                size={18}
                color={s3Peer[item.key] ? gems.sapphire : '#666'}
              />
              <Text style={[styles.checkboxLabel, { color: theme.text }]}>{item.label}</Text>
            </TouchableOpacity>
          ))}

          <Text style={[styles.subHeader, { marginTop: 12 }]}>Sensitivity (Sum: {s3PeerSums.sen}/3)</Text>
          {[
            { key: 'sen1', label: 'My peer helped build positive emotional atmosphere by valuing all opinions.' },
            { key: 'sen2', label: 'My peer could reflect on strengths and improvement areas.' },
            { key: 'sen3', label: 'My peer could understand the social relevance of the project.' },
          ].map(item => (
            <TouchableOpacity
              key={item.key}
              style={styles.checkboxRow}
              onPress={() => toggleCheckbox(s3Peer, setS3Peer, item.key)}
            >
              <Ionicons
                name={s3Peer[item.key] ? "checkbox-outline" : "square-outline"}
                size={18}
                color={s3Peer[item.key] ? gems.sapphire : '#666'}
              />
              <Text style={[styles.checkboxLabel, { color: theme.text }]}>{item.label}</Text>
            </TouchableOpacity>
          ))}

          <Text style={[styles.subHeader, { marginTop: 12 }]}>Creativity (Sum: {s3PeerSums.cre}/3)</Text>
          {[
            { key: 'cre1', label: 'My peer was able to make creative contributions.' },
            { key: 'cre2', label: 'My peer was able to take the initiative to help complete.' },
            { key: 'cre3', label: 'My peer was able to use different materials, tools, and resources.' },
          ].map(item => (
            <TouchableOpacity
              key={item.key}
              style={styles.checkboxRow}
              onPress={() => toggleCheckbox(s3Peer, setS3Peer, item.key)}
            >
              <Ionicons
                name={s3Peer[item.key] ? "checkbox-outline" : "square-outline"}
                size={18}
                color={s3Peer[item.key] ? gems.sapphire : '#666'}
              />
              <Text style={[styles.checkboxLabel, { color: theme.text }]}>{item.label}</Text>
            </TouchableOpacity>
          ))}

          <Text style={[styles.inputLabel, { marginTop: 16 }]}>Leave some words of appreciation/encouragement for your peer</Text>
          <AutoResizingInput
            placeholder="Type your encouraging comments here..."
            value={s3Peer.appreciation}
            onChangeText={(v) => setS3Peer(prev => ({ ...prev, appreciation: v }))}
            minHeight={50}
            style={styles.underlineInput}
          />
        </GemCutCard>

        <View style={{ marginTop: 24, marginBottom: 20, alignItems: 'center' }}>
          <GemButton
            onPress={async () => { await handleManualSave(); setActiveTab(4); }}
            gemType="sapphire"
          >
            <Text style={styles.btnText}>PROCEED TO OVERVIEW{"\n"}➔</Text>
          </GemButton>
        </View>
      </ScrollView>
    );
  };

  // Tab 4: Overview Tabulations & Post reflections
  const renderOverview = () => {
    // Automatically trigger suggestion recommendations
    const suggestedAwrT = getSuggestedLevelTeacher(teacherGrandTotals.awr);
    const suggestedSenT = getSuggestedLevelTeacher(teacherGrandTotals.sen);
    const suggestedCreT = getSuggestedLevelTeacher(teacherGrandTotals.cre);

    const suggestedAwrL = getSuggestedLevelLearner(learnerGrandTotals.awr);
    const suggestedSenL = getSuggestedLevelLearner(learnerGrandTotals.sen);
    const suggestedCreL = getSuggestedLevelLearner(learnerGrandTotals.cre);

    const suggestedAwrP = getSuggestedLevelPeer(peerGrandTotals.awr);
    const suggestedSenP = getSuggestedLevelPeer(peerGrandTotals.sen);
    const suggestedCreP = getSuggestedLevelPeer(peerGrandTotals.cre);

    return (
      <ScrollView style={styles.tabContent} contentContainerStyle={{ paddingBottom: 60 }} nestedScrollEnabled>
        {/* Teacher Overview Tabulations */}
        <GemCutCard borderColor={gems.sapphire + '40'} style={[styles.card, !isTeacher && styles.disabledCard]}>
          <Text style={styles.cardHeader}>1. Teacher Overview & Levels</Text>
          
          {['awr', 'sen', 'cre'].map(key => {
            const nameMap = { awr: 'Awareness', sen: 'Sensitivity', cre: 'Creativity' };
            const selectedLevel = levelOverviewTeacher[key];
            const ticksSum = teacherTotalTicks[key];
            const rubricScore = getRubricScoreVal(s3TeacherSelection[key]);
            const grandTotal = teacherGrandTotals[key];
            const sug = getSuggestedLevelTeacher(grandTotal);

            return (
              <View key={key} style={styles.overviewSection}>
                <Text style={styles.subHeader}>{nameMap[key].toUpperCase()} LEVEL</Text>
                <Text style={[styles.calculationHint, { color: theme.secondaryText }]}>
                  Math: Stage 1 & 2 Ticks ({ticksSum}/11) + Stage 3 Rubric ({rubricScore} pts) = {grandTotal} / 26
                </Text>
                <Text style={styles.suggestedText}>Suggested: {sug ? sug : 'None'}</Text>
                
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

        {/* Learner Overview Tabulations */}
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
                  Math: Stage 1 Ticks ({s1LearnerSums[key]}/5) + Stage 3 Ticks ({s3LearnerSums[key]}/3) = {grandTotal} / 8
                </Text>
                <Text style={styles.suggestedText}>Suggested: {sug}</Text>
                
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

        {/* Peer Overview Tabulations */}
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
                  Math: Stage 3 Ticks ({grandTotal} / 3)
                </Text>
                <Text style={styles.suggestedText}>Suggested: {sug}</Text>
                
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

        {/* Teacher reflections */}
        <GemCutCard borderColor={gems.sapphire + '40'} style={[styles.card, !isTeacher && styles.disabledCard]}>
          <Text style={styles.cardHeader}>4. Teacher Post-Project Reflections</Text>
          
          <Text style={styles.inputLabel}>Final comments by the teacher (if any)</Text>
          <AutoResizingInput
            placeholder="Type final comments here..."
            value={postReflectionsTeacher.finalComments}
            onChangeText={(v) => setPostReflectionsTeacher(prev => ({ ...prev, finalComments: v }))}
            minHeight={50}
            editable={isTeacher}
            style={styles.underlineInput}
          />

          <Text style={[styles.inputLabel, { marginTop: 12 }]}>To perform better in future projects, the learner should work on...</Text>
          <AutoResizingInput
            placeholder="Recommended areas to work on..."
            value={postReflectionsTeacher.workOn}
            onChangeText={(v) => setPostReflectionsTeacher(prev => ({ ...prev, workOn: v }))}
            minHeight={50}
            editable={isTeacher}
            style={styles.underlineInput}
          />
        </GemCutCard>

        {/* Learner reflections - 7 fields */}
        <GemCutCard borderColor={gems.sapphire + '40'} style={styles.card}>
          <Text style={styles.cardHeader}>5. Learner Post-Project Reflections</Text>
          
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

          <Text style={[styles.inputLabel, { marginTop: 12 }]}>How could your teacher modify this project to make it more interesting?</Text>
          <AutoResizingInput
            placeholder="Suggestions for teacher..."
            value={postReflectionsLearner.teacherModify}
            onChangeText={(v) => setPostReflectionsLearner(prev => ({ ...prev, teacherModify: v }))}
            minHeight={50}
            style={styles.underlineInput}
          />
        </GemCutCard>

        {/* Rubric Valley View Badge */}
        <GemCutCard borderColor={gems.sapphire + '40'} style={styles.card}>
          <Text style={styles.cardHeader}>Rubric Valley Level View</Text>
          <View style={styles.imageFrame}>
            <Image source={IMAGE_SOURCES[calculatedAverageValleyLevel()] || IMAGE_SOURCES.none} style={styles.valleyImage} resizeMode="contain" />
            <View style={styles.captionBadge}>
              <Text style={styles.imageCaption}>
                {calculatedAverageValleyLevel() === 'none' ? 'Select levels to color valley' : calculatedAverageValleyLevel() === 'stream' ? '◈ Stream Level' : calculatedAverageValleyLevel() === 'mountain' ? '◈ Mountain Level' : '◈ Sky Level'}
              </Text>
            </View>
          </View>
        </GemCutCard>

        {/* Single Scrolling Progression Button */}
        <View style={{ marginTop: 24, marginBottom: 20, alignItems: 'center' }}>
          <GemButton
            onPress={async () => {
              await handleManualSave();
              Alert.alert("Complete!", "Secondary Stage HPC (Part A & Part B) is fully recorded!", [
                { text: "Go to Homepage", onPress: () => router.push("/StudentHomepage") }
              ]);
            }}
            gemType="sapphire"
          >
            <Text style={styles.btnText}>COMPLETE SECONDARY STAGE HPC{"\n"}➔</Text>
          </GemButton>
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
            <Text style={[styles.title, { color: theme.text }]}>PART B: GROUP PROJECT WORK</Text>
            <Text style={[styles.subtitle, { color: theme.secondaryText }]}>
              SECONDARY STAGE HPC
            </Text>
          </View>
          <View style={{ width: 44, height: 44 }} />
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={gems.sapphire} />
            <Text style={[styles.loadingText, { color: theme.secondaryText }]}>Loading project records...</Text>
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
    paddingHorizontal: 16,
    paddingVertical: 10,
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
    fontSize: 20,
    fontWeight: '300',
    letterSpacing: 2,
    textAlign: 'center',
    fontFamily: 'Inter_400Regular',
  },
  subtitle: {
    fontSize: 9,
    letterSpacing: 1,
    marginTop: 2,
    textAlign: 'center',
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

  table: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 12,
    marginBottom: 12,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  headerCell: {
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#ddd',
  },
  headerCellText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#555',
    fontFamily: 'Outfit_600SemiBold',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  sideHeaderCell: {
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#ddd',
    backgroundColor: 'rgba(0,0,0,0.01)',
  },
  sideHeaderCellText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#333',
    fontFamily: 'Outfit_600SemiBold',
  },
  tableCell: {
    padding: 4,
    borderRightWidth: 1,
    borderRightColor: '#ddd',
    minHeight: 110,
  },
  cellSelectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
    paddingBottom: 2,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  cellSelectionText: {
    fontSize: 8.5,
    color: '#666',
    fontFamily: 'Outfit_600SemiBold',
  },
  cellTextInput: {
    fontSize: 9,
    flex: 1,
    textAlignVertical: 'top',
    padding: 2,
    fontFamily: 'Inter_400Regular',
  },
  imageFrame: {
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 20,
    paddingVertical: 15,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  valleyImage: {
    width: 170,
    height: 170,
  },
  captionBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 10,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  imageCaption: {
    fontSize: 9,
    fontWeight: '700',
    color: '#555',
    fontFamily: 'Outfit_600SemiBold',
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
