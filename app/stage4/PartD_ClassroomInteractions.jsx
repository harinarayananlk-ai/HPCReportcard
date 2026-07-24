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

export default function PartDClassroomInteractions() {
  const router = useRouter();
  const { theme } = useTheme();
  const { user, profile, activeStudentId, activeStudentProfile, setActiveStudentProfile, setProfile: setAuthProfile } = useAuth();
  const isTeacher = user?.role === 'teacher' || user?.role === 'superadmin';
  const targetUserId = activeStudentId || user?.id;
  const targetProfile = isTeacher ? activeStudentProfile : profile;

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);

  // --- STATE FOR FORM FIELDS ---
  // Tab 0: Setup & Details
  const [interactionType, setInteractionType] = useState({
    discussion: false, debate: false, roleplay: false, experiment: false, digital: false, other: false, otherSpecify: ''
  });
  const [pedagogies, setPedagogies] = useState({
    art: false, toy: false, skill: false, iks: false, sports: false, tech: false, drama: false, other: false, otherSpecify: ''
  });

  const [subjects, setSubjects] = useState([]);
  const [newSubject, setNewSubject] = useState('');
  const [goals, setGoals] = useState([]);
  const [newGoal, setNewGoal] = useState('');
  const [competencies, setCompetencies] = useState([]);
  const [newCompetency, setNewCompetency] = useState('');

  const [topic, setTopic] = useState('');
  const [duration, setDuration] = useState('');

  // Tab 1: Teacher Assessments (15 custom parameters - 5 per ability with checkboxes)
  const [teacherCustomParams, setTeacherCustomParams] = useState({
    awr1: 'Communicates clearly on the topic',
    awr2: 'Applies concepts correctly',
    awr3: 'Contributes factual examples',
    awr4: '', awr5: '',
    sen1: 'Listens respectfully to other views',
    sen2: 'Values diverse perspectives',
    sen3: 'Handles feedback non-defensively',
    sen4: '', sen5: '',
    cre1: 'Asks insightful questions',
    cre2: 'Connects ideas creatively',
    cre3: 'Suggests alternative solutions',
    cre4: '', cre5: ''
  });

  const [teacherAssessments, setTeacherAssessments] = useState({
    awr1: false, awr2: false, awr3: false, awr4: false, awr5: false,
    sen1: false, sen2: false, sen3: false, sen4: false, sen5: false,
    cre1: false, cre2: false, cre3: false, cre4: false, cre5: false,
    comments: ''
  });

  const [levelOverviewTeacher, setLevelOverviewTeacher] = useState({ awr: '', sen: '', cre: '' });

  // Tab 2: Self & Peer Reflections
  const [learnerReflection, setLearnerReflection] = useState({
    awr1: false, awr2: false, awr3: false,
    sen1: false, sen2: false, sen3: false,
    cre1: false, cre2: false, cre3: false,
    comments: ''
  });
  const [levelOverviewLearner, setLevelOverviewLearner] = useState({ awr: '', sen: '', cre: '' });

  const [peerReflection, setPeerReflection] = useState({
    awr1: false, awr2: false, awr3: false,
    sen1: false, sen2: false, sen3: false,
    cre1: false, cre2: false, cre3: false,
    appreciation: ''
  });
  const [levelOverviewPeer, setLevelOverviewPeer] = useState({ awr: '', sen: '', cre: '' });

  // --- AUTO CALCULATIONS ---
  const teacherSums = {
    awr: [teacherAssessments.awr1, teacherAssessments.awr2, teacherAssessments.awr3, teacherAssessments.awr4, teacherAssessments.awr5].filter(Boolean).length,
    sen: [teacherAssessments.sen1, teacherAssessments.sen2, teacherAssessments.sen3, teacherAssessments.sen4, teacherAssessments.sen5].filter(Boolean).length,
    cre: [teacherAssessments.cre1, teacherAssessments.cre2, teacherAssessments.cre3, teacherAssessments.cre4, teacherAssessments.cre5].filter(Boolean).length,
  };

  const learnerSums = {
    awr: [learnerReflection.awr1, learnerReflection.awr2, learnerReflection.awr3].filter(Boolean).length,
    sen: [learnerReflection.sen1, learnerReflection.sen2, learnerReflection.sen3].filter(Boolean).length,
    cre: [learnerReflection.cre1, learnerReflection.cre2, learnerReflection.cre3].filter(Boolean).length,
  };

  const peerSums = {
    awr: [peerReflection.awr1, peerReflection.awr2, peerReflection.awr3].filter(Boolean).length,
    sen: [peerReflection.sen1, peerReflection.sen2, peerReflection.sen3].filter(Boolean).length,
    cre: [peerReflection.cre1, peerReflection.cre2, peerReflection.cre3].filter(Boolean).length,
  };

  const getSuggestedLevelTeacher = (total) => {
    if (total >= 4) return 'Advanced';
    if (total >= 2) return 'Proficient';
    return 'Beginner';
  };
  const getSuggestedLevelLearner = (total) => {
    if (total >= 3) return 'Advanced';
    if (total === 2) return 'Proficient';
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
      partD: {
        interactionType, pedagogies, subjects, goals, competencies, topic, duration,
        teacherCustomParams, teacherAssessments, levelOverviewTeacher,
        learnerReflection, levelOverviewLearner,
        peerReflection, levelOverviewPeer
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
    interactionType, pedagogies, subjects, goals, competencies, topic, duration,
    teacherCustomParams, teacherAssessments, levelOverviewTeacher,
    learnerReflection, levelOverviewLearner,
    peerReflection, levelOverviewPeer, targetProfile
  ]);

  const { triggerSave } = useAutoSave(targetUserId, getPayload, [
    interactionType, pedagogies, subjects, goals, competencies, topic, duration,
    teacherCustomParams, teacherAssessments, levelOverviewTeacher,
    learnerReflection, levelOverviewLearner,
    peerReflection, levelOverviewPeer
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
        const d = assess.stage4?.partD;
        if (d) {
          if (d.interactionType) setInteractionType(prev => ({ ...prev, ...d.interactionType }));
          if (d.pedagogies) setPedagogies(prev => ({ ...prev, ...d.pedagogies }));
          if (d.subjects) setSubjects(d.subjects);
          if (d.goals) setGoals(d.goals);
          if (d.competencies) setCompetencies(d.competencies);
          if (d.topic) setTopic(d.topic);
          if (d.duration) setDuration(d.duration);

          if (d.teacherCustomParams) setTeacherCustomParams(prev => ({ ...prev, ...d.teacherCustomParams }));
          if (d.teacherAssessments) setTeacherAssessments(prev => ({ ...prev, ...d.teacherAssessments }));
          if (d.levelOverviewTeacher) setLevelOverviewTeacher(prev => ({ ...prev, ...d.levelOverviewTeacher }));

          if (d.learnerReflection) setLearnerReflection(prev => ({ ...prev, ...d.learnerReflection }));
          if (d.levelOverviewLearner) setLevelOverviewLearner(prev => ({ ...prev, ...d.levelOverviewLearner }));

          if (d.peerReflection) setPeerReflection(prev => ({ ...prev, ...d.peerReflection }));
          if (d.levelOverviewPeer) setLevelOverviewPeer(prev => ({ ...prev, ...d.levelOverviewPeer }));
        }
      }
    } catch (e) {
      console.warn("Failed to load classroom interactions data", e);
    } finally {
      setLoading(false);
    }
  };

  const handleManualSave = async () => {
    try {
      await triggerSave();
      Alert.alert("Saved Successfully", "Your progress for Classroom Interactions has been saved.");
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

  // Tab 0: Setup
  const renderSetup = () => {
    return (
      <View style={styles.tabContent}>
        {/* Interaction Type Checklist */}
        <GemCutCard borderColor={gems.sapphire + '40'} style={styles.card}>
          <Text style={styles.cardHeader}>1. Interaction Type (Tick exactly one)</Text>
          <View style={styles.checkboxGrid}>
            {[
              { key: 'discussion', label: 'Classroom discussion' },
              { key: 'debate', label: 'Organised debate' },
              { key: 'roleplay', label: 'Simulation/role play' },
              { key: 'experiment', label: 'Lab experiment' },
              { key: 'digital', label: 'Digital learning' },
              { key: 'other', label: 'Other interaction' },
            ].map(item => (
              <TouchableOpacity
                key={item.key}
                style={styles.checkboxRow}
                onPress={() => {
                  // Single select mock
                  setInteractionType(prev => {
                    const clear = { discussion: false, debate: false, roleplay: false, experiment: false, digital: false, other: false, otherSpecify: prev.otherSpecify };
                    clear[item.key] = !prev[item.key];
                    return clear;
                  });
                }}
              >
                <Ionicons
                  name={interactionType[item.key] ? "radio-button-on" : "radio-button-off"}
                  size={18}
                  color={interactionType[item.key] ? gems.sapphire : '#666'}
                />
                <Text style={[styles.checkboxLabel, { color: theme.text }]}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {interactionType.other && (
            <TextInput
              style={[styles.textInput, { marginTop: 12 }]}
              placeholder="Specify interaction type..."
              placeholderTextColor="#999"
              value={interactionType.otherSpecify}
              onChangeText={(v) => setInteractionType(prev => ({ ...prev, otherSpecify: v }))}
            />
          )}
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

        {/* Topic details */}
        <GemCutCard borderColor={gems.sapphire + '40'} style={styles.card}>
          <Text style={styles.cardHeader}>3. Activity Details</Text>
          
          {/* Subjects */}
          <Text style={styles.inputLabel}>Subject(s) involved</Text>
          <View style={styles.tagInputRow}>
            <TextInput
              style={[styles.textInput, { flex: 1 }]}
              placeholder="e.g. Science"
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

          {/* Goals */}
          <Text style={[styles.inputLabel, { marginTop: 12 }]}>Curricular Goal(s)</Text>
          <View style={styles.tagInputRow}>
            <TextInput
              style={[styles.textInput, { flex: 1 }]}
              placeholder="e.g. CG-5: Democracy"
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

          <Text style={[styles.inputLabel, { marginTop: 12 }]}>Topic / Theme / Prompt</Text>
          <AutoResizingInput
            placeholder="What is the debate or experiment prompt?"
            value={topic}
            onChangeText={setTopic}
            minHeight={50}
            style={styles.underlineInput}
          />

          <Text style={[styles.inputLabel, { marginTop: 12 }]}>Duration of Interaction</Text>
          <TextInput
            style={styles.textInput}
            placeholder="e.g. 40 minutes"
            value={duration}
            onChangeText={setDuration}
          />

          {/* Competencies */}
          <Text style={[styles.inputLabel, { marginTop: 12 }]}>Competency(-ies)</Text>
          <View style={styles.tagInputRow}>
            <TextInput
              style={[styles.textInput, { flex: 1 }]}
              placeholder="e.g. C-5.2: Constitutional Values"
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
      </View>
    );
  };

  // Tab 1: Teacher Assessments (15 custom parameters)
  const renderAssessment = () => {
    return (
      <ScrollView style={styles.tabContent} contentContainerStyle={{ paddingBottom: 60 }} nestedScrollEnabled>
        <GemCutCard borderColor={gems.sapphire + '40'} style={[styles.card, !isTeacher && styles.disabledCard]}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardHeader}>Teacher Assessments (15 parameters)</Text>
            <View style={[styles.badge, { backgroundColor: gems.sapphire + '20' }]}><Text style={{ color: gems.sapphire, fontWeight: '700', fontSize: 8 }}>TEACHER</Text></View>
          </View>
          
          {!isTeacher && (
            <View style={styles.lockNotice}>
              <Ionicons name="lock-closed" size={14} color="#eab308" />
              <Text style={styles.lockNoticeText}>Locked for student & peer edits</Text>
            </View>
          )}

          {/* Awareness */}
          <Text style={styles.subHeader}>AWARENESS PARAMETERS (Sum: {teacherSums.awr}/5)</Text>
          {[1, 2, 3, 4, 5].map(num => (
            <View key={`awr${num}`} style={styles.parameterFieldRow}>
              <TextInput
                style={[styles.textInput, { flex: 1, borderBottomColor: '#ddd' }]}
                placeholder={`Awareness Parameter ${num}...`}
                placeholderTextColor="#bbb"
                value={teacherCustomParams[`awr${num}`]}
                onChangeText={(v) => setTeacherCustomParams(prev => ({ ...prev, [`awr${num}`]: v }))}
                editable={isTeacher}
              />
              <TouchableOpacity
                disabled={!isTeacher || !teacherCustomParams[`awr${num}`].trim()}
                onPress={() => toggleCheckbox(teacherAssessments, setTeacherAssessments, `awr${num}`, !isTeacher)}
                style={{ padding: 6 }}
              >
                <Ionicons
                  name={teacherAssessments[`awr${num}`] ? "checkbox" : "square-outline"}
                  size={20}
                  color={teacherAssessments[`awr${num}`] ? gems.sapphire : '#bbb'}
                />
              </TouchableOpacity>
            </View>
          ))}

          {/* Sensitivity */}
          <Text style={[styles.subHeader, { marginTop: 16 }]}>SENSITIVITY PARAMETERS (Sum: {teacherSums.sen}/5)</Text>
          {[1, 2, 3, 4, 5].map(num => (
            <View key={`sen${num}`} style={styles.parameterFieldRow}>
              <TextInput
                style={[styles.textInput, { flex: 1, borderBottomColor: '#ddd' }]}
                placeholder={`Sensitivity Parameter ${num}...`}
                placeholderTextColor="#bbb"
                value={teacherCustomParams[`sen${num}`]}
                onChangeText={(v) => setTeacherCustomParams(prev => ({ ...prev, [`sen${num}`]: v }))}
                editable={isTeacher}
              />
              <TouchableOpacity
                disabled={!isTeacher || !teacherCustomParams[`sen${num}`].trim()}
                onPress={() => toggleCheckbox(teacherAssessments, setTeacherAssessments, `sen${num}`, !isTeacher)}
                style={{ padding: 6 }}
              >
                <Ionicons
                  name={teacherAssessments[`sen${num}`] ? "checkbox" : "square-outline"}
                  size={20}
                  color={teacherAssessments[`sen${num}`] ? gems.sapphire : '#bbb'}
                />
              </TouchableOpacity>
            </View>
          ))}

          {/* Creativity */}
          <Text style={[styles.subHeader, { marginTop: 16 }]}>CREATIVITY PARAMETERS (Sum: {teacherSums.cre}/5)</Text>
          {[1, 2, 3, 4, 5].map(num => (
            <View key={`cre${num}`} style={styles.parameterFieldRow}>
              <TextInput
                style={[styles.textInput, { flex: 1, borderBottomColor: '#ddd' }]}
                placeholder={`Creativity Parameter ${num}...`}
                placeholderTextColor="#bbb"
                value={teacherCustomParams[`cre${num}`]}
                onChangeText={(v) => setTeacherCustomParams(prev => ({ ...prev, [`cre${num}`]: v }))}
                editable={isTeacher}
              />
              <TouchableOpacity
                disabled={!isTeacher || !teacherCustomParams[`cre${num}`].trim()}
                onPress={() => toggleCheckbox(teacherAssessments, setTeacherAssessments, `cre${num}`, !isTeacher)}
                style={{ padding: 6 }}
              >
                <Ionicons
                  name={teacherAssessments[`cre${num}`] ? "checkbox" : "square-outline"}
                  size={20}
                  color={teacherAssessments[`cre${num}`] ? gems.sapphire : '#bbb'}
                />
              </TouchableOpacity>
            </View>
          ))}

          {/* Overview levels teacher */}
          <View style={{ borderTopWidth: 1, borderTopColor: '#eee', marginTop: 20, paddingTop: 12 }}>
            <Text style={styles.cardHeader}>Teacher Final Levels</Text>
            {['awr', 'sen', 'cre'].map(key => {
              const nameMap = { awr: 'Awareness', sen: 'Sensitivity', cre: 'Creativity' };
              const sug = getSuggestedLevelTeacher(teacherSums[key]);
              return (
                <View key={key} style={styles.overviewSection}>
                  <Text style={styles.subHeader}>{nameMap[key].toUpperCase()} LEVEL</Text>
                  <Text style={styles.suggestedText}>Suggested: {sug} (Ticks: {teacherSums[key]}/5)</Text>
                  <View style={styles.radioRow}>
                    {['Beginner', 'Proficient', 'Advanced'].map(lvl => (
                      <TouchableOpacity
                        key={lvl}
                        style={[styles.radioBtn, levelOverviewTeacher[key] === lvl && styles.radioBtnActive]}
                        disabled={!isTeacher}
                        onPress={() => setLevelOverviewTeacher(prev => ({ ...prev, [key]: lvl }))}
                      >
                        <Text style={[styles.radioText, levelOverviewTeacher[key] === lvl && styles.radioTextActive]}>{lvl}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              );
            })}
          </View>

          <Text style={[styles.inputLabel, { marginTop: 16 }]}>Teacher Pedagogical Comments</Text>
          <AutoResizingInput
            placeholder="Type feedback comment..."
            value={teacherAssessments.comments}
            onChangeText={(v) => setTeacherAssessments(prev => ({ ...prev, comments: v }))}
            minHeight={50}
            editable={isTeacher}
            style={styles.underlineInput}
          />
        </GemCutCard>
      </ScrollView>
    );
  };

  // Tab 2: Reflections
  const renderReflections = () => {
    const sugAwrL = getSuggestedLevelLearner(learnerSums.awr);
    const sugSenL = getSuggestedLevelLearner(learnerSums.sen);
    const sugCreL = getSuggestedLevelLearner(learnerSums.cre);

    const sugAwrP = getSuggestedLevelPeer(peerSums.awr);
    const sugSenP = getSuggestedLevelPeer(peerSums.sen);
    const sugCreP = getSuggestedLevelPeer(peerSums.cre);

    return (
      <ScrollView style={styles.tabContent} contentContainerStyle={{ paddingBottom: 60 }} nestedScrollEnabled>
        {/* Learner Self-Reflection */}
        <GemCutCard borderColor={gems.sapphire + '40'} style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardHeader}>Learner Self-Reflection</Text>
            <View style={styles.badge}><Text style={styles.badgeText}>Self</Text></View>
          </View>

          {/* Awareness */}
          <Text style={styles.subHeader}>Awareness Ticks ({learnerSums.awr}/3)</Text>
          {[
            { key: 'awr1', label: 'I was prepared for the classroom activity.' },
            { key: 'awr2', label: 'I actively contributed comments and data to the debate/discussion.' },
            { key: 'awr3', label: 'I learned key conceptual items through the activity.' },
          ].map(item => (
            <TouchableOpacity key={item.key} style={styles.checkboxRow} onPress={() => toggleCheckbox(learnerReflection, setLearnerReflection, item.key)}>
              <Ionicons name={learnerReflection[item.key] ? "checkbox" : "square-outline"} size={18} color={learnerReflection[item.key] ? gems.sapphire : '#666'} />
              <Text style={[styles.checkboxLabel, { color: theme.text }]}>{item.label}</Text>
            </TouchableOpacity>
          ))}

          {/* Sensitivity */}
          <Text style={[styles.subHeader, { marginTop: 12 }]}>Sensitivity Ticks ({learnerSums.sen}/3)</Text>
          {[
            { key: 'sen1', label: 'I was respectful of differing feedback and comments from peers.' },
            { key: 'sen2', label: 'I helped maintain an inclusive atmosphere during activity.' },
            { key: 'sen3', label: 'I was willing to adjust my own viewpoint based on data.' },
          ].map(item => (
            <TouchableOpacity key={item.key} style={styles.checkboxRow} onPress={() => toggleCheckbox(learnerReflection, setLearnerReflection, item.key)}>
              <Ionicons name={learnerReflection[item.key] ? "checkbox" : "square-outline"} size={18} color={learnerReflection[item.key] ? gems.sapphire : '#666'} />
              <Text style={[styles.checkboxLabel, { color: theme.text }]}>{item.label}</Text>
            </TouchableOpacity>
          ))}

          {/* Creativity */}
          <Text style={[styles.subHeader, { marginTop: 12 }]}>Creativity Ticks ({learnerSums.cre}/3)</Text>
          {[
            { key: 'cre1', label: 'I was able to connect different ideas creatively.' },
            { key: 'cre2', label: 'I suggested alternative answers and ideas.' },
            { key: 'cre3', label: 'I asked deep, insightful questions.' },
          ].map(item => (
            <TouchableOpacity key={item.key} style={styles.checkboxRow} onPress={() => toggleCheckbox(learnerReflection, setLearnerReflection, item.key)}>
              <Ionicons name={learnerReflection[item.key] ? "checkbox" : "square-outline"} size={18} color={learnerReflection[item.key] ? gems.sapphire : '#666'} />
              <Text style={[styles.checkboxLabel, { color: theme.text }]}>{item.label}</Text>
            </TouchableOpacity>
          ))}

          {/* Learner Level Selection */}
          <View style={{ marginTop: 16 }}>
            <Text style={styles.inputLabel}>Learner Suggested Levels</Text>
            {['awr', 'sen', 'cre'].map(key => {
              const nameMap = { awr: 'Awareness', sen: 'Sensitivity', cre: 'Creativity' };
              const sug = getSuggestedLevelLearner(learnerSums[key]);
              return (
                <View key={key} style={styles.overviewSection}>
                  <Text style={styles.subHeader}>{nameMap[key].toUpperCase()}</Text>
                  <Text style={styles.suggestedText}>Suggested: {sug}</Text>
                  <View style={styles.radioRow}>
                    {['Beginner', 'Proficient', 'Advanced'].map(lvl => (
                      <TouchableOpacity
                        key={lvl}
                        style={[styles.radioBtn, levelOverviewLearner[key] === lvl && styles.radioBtnActive]}
                        onPress={() => setLevelOverviewLearner(prev => ({ ...prev, [key]: lvl }))}
                      >
                        <Text style={[styles.radioText, levelOverviewLearner[key] === lvl && styles.radioTextActive]}>{lvl}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              );
            })}
          </View>

          <Text style={[styles.inputLabel, { marginTop: 16 }]}>Learner Self-Reflection comments</Text>
          <AutoResizingInput
            placeholder="Type self thoughts..."
            value={learnerReflection.comments}
            onChangeText={(v) => setLearnerReflection(prev => ({ ...prev, comments: v }))}
            minHeight={50}
            style={styles.underlineInput}
          />
        </GemCutCard>

        {/* Peer Reflection */}
        <GemCutCard borderColor={gems.sapphire + '40'} style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardHeader}>Peer Feedback</Text>
            <View style={[styles.badge, { backgroundColor: gems.silver + '20' }]}><Text style={{ color: gems.silver, fontWeight: '700', fontSize: 8 }}>PEER</Text></View>
          </View>

          {/* Awareness */}
          <Text style={styles.subHeader}>Awareness (Total selections: {peerSums.awr}/3)</Text>
          {[
            { key: 'awr1', label: 'My peer was sufficiently prepared for the activity.' },
            { key: 'awr2', label: 'My peer demonstrated a clear understanding of the key concepts covered.' },
            { key: 'awr3', label: 'My peer changed her/his approach as per the changing dynamics of the activity.' },
          ].map(item => (
            <TouchableOpacity key={item.key} style={styles.checkboxRow} onPress={() => toggleCheckbox(peerReflection, setPeerReflection, item.key)}>
              <Ionicons name={peerReflection[item.key] ? "checkbox" : "square-outline"} size={18} color={peerReflection[item.key] ? gems.sapphire : '#666'} />
              <Text style={[styles.checkboxLabel, { color: theme.text }]}>{item.label}</Text>
            </TouchableOpacity>
          ))}

          {/* Sensitivity */}
          <Text style={[styles.subHeader, { marginTop: 12 }]}>Sensitivity (Total selections: {peerSums.sen}/3)</Text>
          {[
            { key: 'sen1', label: 'My peer actively considered different perspectives during the activity.' },
            { key: 'sen2', label: 'My peer acknowledged the feelings and opinions of her/his peers.' },
            { key: 'sen3', label: 'My peer gave constructive feedback in a considerate manner.' },
          ].map(item => (
            <TouchableOpacity key={item.key} style={styles.checkboxRow} onPress={() => toggleCheckbox(peerReflection, setPeerReflection, item.key)}>
              <Ionicons name={peerReflection[item.key] ? "checkbox" : "square-outline"} size={18} color={peerReflection[item.key] ? gems.sapphire : '#666'} />
              <Text style={[styles.checkboxLabel, { color: theme.text }]}>{item.label}</Text>
            </TouchableOpacity>
          ))}

          {/* Creativity */}
          <Text style={[styles.subHeader, { marginTop: 12 }]}>Creativity (Total selections: {peerSums.cre}/3)</Text>
          {[
            { key: 'cre1', label: 'My peer approached challenges with a willingness to explore unique solutions.' },
            { key: 'cre2', label: 'My peer demonstrated flexibility in her/his thinking.' },
            { key: 'cre3', label: 'My peer actively sought inspiration from different sources to improve her/his contribution.' },
          ].map(item => (
            <TouchableOpacity key={item.key} style={styles.checkboxRow} onPress={() => toggleCheckbox(peerReflection, setPeerReflection, item.key)}>
              <Ionicons name={peerReflection[item.key] ? "checkbox" : "square-outline"} size={18} color={peerReflection[item.key] ? gems.sapphire : '#666'} />
              <Text style={[styles.checkboxLabel, { color: theme.text }]}>{item.label}</Text>
            </TouchableOpacity>
          ))}

          {/* Peer Level Selection */}
          <View style={{ marginTop: 16 }}>
            <Text style={styles.inputLabel}>Peer Performance Level</Text>
            {['awr', 'sen', 'cre'].map(key => {
              const nameMap = { awr: 'Awareness', sen: 'Sensitivity', cre: 'Creativity' };
              const sug = getSuggestedLevelPeer(peerSums[key]);
              return (
                <View key={key} style={styles.overviewSection}>
                  <Text style={styles.subHeader}>{nameMap[key].toUpperCase()}</Text>
                  <Text style={styles.suggestedText}>Suggested: {sug}</Text>
                  <View style={styles.radioRow}>
                    {['Beginner', 'Proficient', 'Advanced'].map(lvl => (
                      <TouchableOpacity
                        key={lvl}
                        style={[styles.radioBtn, levelOverviewPeer[key] === lvl && styles.radioBtnActive]}
                        onPress={() => setLevelOverviewPeer(prev => ({ ...prev, [key]: lvl }))}
                      >
                        <Text style={[styles.radioText, levelOverviewPeer[key] === lvl && styles.radioTextActive]}>{lvl}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              );
            })}
          </View>

          <Text style={[styles.inputLabel, { marginTop: 16 }]}>Leave some words of appreciation/ encouragement for yourself.</Text>
          <AutoResizingInput
            placeholder="Write here..."
            value={peerReflection.appreciation}
            onChangeText={(v) => setPeerReflection(prev => ({ ...prev, appreciation: v }))}
            minHeight={50}
            style={styles.underlineInput}
          />
        </GemCutCard>
      </ScrollView>
    );
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case 0: return renderSetup();
      case 1: return renderAssessment();
      case 2: return renderReflections();
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
          <TouchableOpacity onPress={() => router.push('/stage4/Dashboard')} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color={theme.text} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={[styles.title, { color: theme.text }]}>OBSERVATION TEMPLATE</Text>
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
            <Text style={[styles.loadingText, { color: theme.secondaryText }]}>Loading interaction records...</Text>
          </View>
        ) : (
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
          >
            <AnimatedTabBar
              tabs={['Setup', 'Assessment', 'Reflections']}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
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
    color: '#555',
    marginTop: 12,
    marginBottom: 6,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: '#444',
    marginTop: 8,
    marginBottom: 4,
    fontFamily: 'Outfit_600SemiBold',
  },
  textInput: {
    borderBottomWidth: 1.5,
    borderBottomColor: gems.sapphire,
    height: 40,
    fontSize: 13,
    color: '#222',
    fontFamily: 'Inter_400Regular',
    paddingHorizontal: 4,
  },
  underlineInput: {
    borderBottomWidth: 1.5,
    borderBottomColor: gems.sapphire,
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    color: '#222',
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
  suggestedText: {
    fontSize: 10,
    fontWeight: '700',
    color: gems.sapphire,
    marginVertical: 2.5,
  },
  parameterFieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 4,
  },
});
