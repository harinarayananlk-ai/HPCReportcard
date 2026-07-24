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
import { gems } from '../../colour_themes';
import useAutoSave from '../../hooks/useAutoSave';

export default function PartEFTimeInventories() {
  const router = useRouter();
  const { theme } = useTheme();
  const { user, profile, activeStudentId, activeStudentProfile } = useAuth();
  const isTeacher = user?.role === 'teacher' || user?.role === 'superadmin';
  const targetUserId = activeStudentId || user?.id;
  const targetProfile = isTeacher ? activeStudentProfile : profile;

  const [loading, setLoading] = useState(true);

  // 1. Group Project Work (5 steps)
  const [groupProjectHours, setGroupProjectHours] = useState({
    step1: { hh: '00', mm: '00' },
    step2: { hh: '00', mm: '00' },
    step3: { hh: '00', mm: '00' },
    step4: { hh: '00', mm: '00' },
    step5: { hh: '00', mm: '00' },
  });

  // 2. Problem-Based Inquiry (7 steps)
  const [problemInquiryHours, setProblemInquiryHours] = useState({
    step1: { hh: '00', mm: '00' },
    step2: { hh: '00', mm: '00' },
    step3: { hh: '00', mm: '00' },
    step4: { hh: '00', mm: '00' },
    step5: { hh: '00', mm: '00' },
    step6: { hh: '00', mm: '00' },
    step7: { hh: '00', mm: '00' },
  });

  // 3. Classroom Interactions (5 steps)
  const [classroomHours, setClassroomHours] = useState({
    step1: { hh: '00', mm: '00' },
    step2: { hh: '00', mm: '00' },
    step3: { hh: '00', mm: '00' },
    step4: { hh: '00', mm: '00' },
    step5: { hh: '00', mm: '00' },
  });

  // 4. Skill Training (5 rows)
  const [skillTraining, setSkillTraining] = useState([
    { id: 1, name: '', hh: '00', mm: '00', status: 'Pursuing' },
    { id: 2, name: '', hh: '00', mm: '00', status: 'Pursuing' },
    { id: 3, name: '', hh: '00', mm: '00', status: 'Pursuing' },
    { id: 4, name: '', hh: '00', mm: '00', status: 'Pursuing' },
    { id: 5, name: '', hh: '00', mm: '00', status: 'Pursuing' },
  ]);

  // 5. Online Course (5 rows)
  const [onlineCourses, setOnlineCourses] = useState([
    { id: 1, name: '', hh: '00', mm: '00', status: 'Pursuing' },
    { id: 2, name: '', hh: '00', mm: '00', status: 'Pursuing' },
    { id: 3, name: '', hh: '00', mm: '00', status: 'Pursuing' },
    { id: 4, name: '', hh: '00', mm: '00', status: 'Pursuing' },
    { id: 5, name: '', hh: '00', mm: '00', status: 'Pursuing' },
  ]);

  const sumTimeObj = (obj) => {
    let totalMinutes = 0;
    Object.values(obj).forEach(time => {
      const h = parseInt(time.hh, 10) || 0;
      const m = parseInt(time.mm, 10) || 0;
      totalMinutes += h * 60 + m;
    });
    const hh = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
    const mm = String(totalMinutes % 60).padStart(2, '0');
    return `${hh}:${mm}`;
  };

  const sumTimeArray = (arr) => {
    let totalMinutes = 0;
    arr.forEach(item => {
      const h = parseInt(item.hh, 10) || 0;
      const m = parseInt(item.mm, 10) || 0;
      totalMinutes += h * 60 + m;
    });
    const hh = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
    const mm = String(totalMinutes % 60).padStart(2, '0');
    return `${hh}:${mm}`;
  };

  const getPayload = useCallback(() => {
    const stage4Obj = {
      timeInventories: {
        groupProjectHours,
        problemInquiryHours,
        classroomHours,
        skillTraining,
        onlineCourses
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
  }, [groupProjectHours, problemInquiryHours, classroomHours, skillTraining, onlineCourses, targetProfile]);

  const { triggerSave } = useAutoSave(targetUserId, getPayload, [
    groupProjectHours, problemInquiryHours, classroomHours, skillTraining, onlineCourses
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
        const ti = assess.stage4?.timeInventories;
        if (ti) {
          if (ti.groupProjectHours) setGroupProjectHours(prev => ({ ...prev, ...ti.groupProjectHours }));
          if (ti.problemInquiryHours) setProblemInquiryHours(prev => ({ ...prev, ...ti.problemInquiryHours }));
          if (ti.classroomHours) setClassroomHours(prev => ({ ...prev, ...ti.classroomHours }));
          if (ti.skillTraining) setSkillTraining(ti.skillTraining);
          if (ti.onlineCourses) setOnlineCourses(ti.onlineCourses);
        }
      }
    } catch (e) {
      console.warn("Failed to load time inventories", e);
    } finally {
      setLoading(false);
    }
  };

  const handleManualSave = async () => {
    try {
      await triggerSave();
      Alert.alert("Saved Successfully", "Your progress for Part E: Time Inventories has been saved.");
    } catch (e) {
      Alert.alert("Save Failed", "Could not connect to the database.");
    }
  };

  const renderTimeInput = (timeVal, onChange) => (
    <View style={styles.timeInputBox}>
      <TextInput
        style={styles.timeInputText}
        keyboardType="numeric"
        maxLength={2}
        selectionColor="#0055FF"
        placeholder="00"
        placeholderTextColor="#999"
        value={timeVal.hh}
        onChangeText={(v) => onChange({ ...timeVal, hh: v })}
      />
      <Text style={styles.timeColon}>:</Text>
      <TextInput
        style={styles.timeInputText}
        keyboardType="numeric"
        maxLength={2}
        selectionColor="#0055FF"
        placeholder="00"
        placeholderTextColor="#999"
        value={timeVal.mm}
        onChangeText={(v) => onChange({ ...timeVal, mm: v })}
      />
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      <PremiumBackground gemColor={gems.sapphire} />
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} />

        {/* Header */}
        <View style={styles.header}>
          <MenuDropdown />
          <View style={styles.headerTitleContainer}>
            <Text style={[styles.title, { color: theme.text }]}>PART E: TIME INVENTORIES</Text>
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
            <Text style={[styles.loadingText, { color: theme.secondaryText }]}>Loading time inventories...</Text>
          </View>
        ) : (
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
          >
            <ScrollView style={styles.scrollContent} contentContainerStyle={{ paddingBottom: 60 }} nestedScrollEnabled>
              <Text style={styles.mainSectionTitle}>Number of Hours Spent by the Learner on the Following Activities:</Text>

              {/* 1. Group Project Work */}
              <GemCutCard borderColor={gems.sapphire + '40'} style={styles.card}>
                <Text style={styles.cardHeader}>1. Group Project Work</Text>
                <View style={styles.tableHeader}>
                  <Text style={[styles.headerCell, { flex: 0.7 }]}>Steps</Text>
                  <Text style={[styles.headerCell, { flex: 0.3, textAlign: 'center' }]}>Hours Spent (HH:MM)</Text>
                </View>

                {[
                  { key: 'step1', label: '1. Research prompt/question/ problem/challenge/ planned final output' },
                  { key: 'step2', label: '2. Guiding questions' },
                  { key: 'step3', label: '3. Stage 1 (Brainstorming and ideation)' },
                  { key: 'step4', label: '4. Stage 2 (Drafting, feedback, and revision)' },
                  { key: 'step5', label: '5. Stage 3 (Final submission)' },
                ].map(step => (
                  <View key={step.key} style={styles.tableRow}>
                    <Text style={[styles.stepLabel, { flex: 0.7, color: theme.text }]}>{step.label}</Text>
                    <View style={{ flex: 0.3, alignItems: 'center' }}>
                      {renderTimeInput(groupProjectHours[step.key], (v) => setGroupProjectHours(prev => ({ ...prev, [step.key]: v })))}
                    </View>
                  </View>
                ))}

                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalValText}>{sumTimeObj(groupProjectHours)}</Text>
                </View>
              </GemCutCard>

              {/* 2. Problem-Based Inquiry */}
              <GemCutCard borderColor={gems.sapphire + '40'} style={styles.card}>
                <Text style={styles.cardHeader}>2. Problem-Based Inquiry (Individual Work)</Text>
                <View style={styles.tableHeader}>
                  <Text style={[styles.headerCell, { flex: 0.7 }]}>Steps</Text>
                  <Text style={[styles.headerCell, { flex: 0.3, textAlign: 'center' }]}>Hours Spent (HH:MM)</Text>
                </View>

                {[
                  { key: 'step1', label: '1. Project prompt/question/problem/challenge/planned final output' },
                  { key: 'step2', label: '2. Hypothesis' },
                  { key: 'step3', label: '3. Guiding questions' },
                  { key: 'step4', label: '4. Evidence collection to support/negate hypothesis' },
                  { key: 'step5', label: '5. Analysis and synthesis' },
                  { key: 'step6', label: '6. Discussions' },
                  { key: 'step7', label: '7. Conclusion' },
                ].map(step => (
                  <View key={step.key} style={styles.tableRow}>
                    <Text style={[styles.stepLabel, { flex: 0.7, color: theme.text }]}>{step.label}</Text>
                    <View style={{ flex: 0.3, alignItems: 'center' }}>
                      {renderTimeInput(problemInquiryHours[step.key], (v) => setProblemInquiryHours(prev => ({ ...prev, [step.key]: v })))}
                    </View>
                  </View>
                ))}

                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalValText}>{sumTimeObj(problemInquiryHours)}</Text>
                </View>
              </GemCutCard>

              {/* 3. Classroom Interactions */}
              <GemCutCard borderColor={gems.sapphire + '40'} style={styles.card}>
                <Text style={styles.cardHeader}>3. Classroom Interactions</Text>
                <View style={styles.tableHeader}>
                  <Text style={[styles.headerCell, { flex: 0.7 }]}>Steps</Text>
                  <Text style={[styles.headerCell, { flex: 0.3, textAlign: 'center' }]}>Hours Spent (HH:MM)</Text>
                </View>

                {[
                  { key: 'step1', label: '1. Classroom discussion' },
                  { key: 'step2', label: '2. Organised debate' },
                  { key: 'step3', label: '3. Simulation/roleplay' },
                  { key: 'step4', label: '4. Lab experiment' },
                  { key: 'step5', label: '5. Digital Learning' },
                ].map(step => (
                  <View key={step.key} style={styles.tableRow}>
                    <Text style={[styles.stepLabel, { flex: 0.7, color: theme.text }]}>{step.label}</Text>
                    <View style={{ flex: 0.3, alignItems: 'center' }}>
                      {renderTimeInput(classroomHours[step.key], (v) => setClassroomHours(prev => ({ ...prev, [step.key]: v })))}
                    </View>
                  </View>
                ))}

                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalValText}>{sumTimeObj(classroomHours)}</Text>
                </View>
              </GemCutCard>

              {/* 4. Skill Training */}
              <GemCutCard borderColor={gems.sapphire + '40'} style={styles.card}>
                <Text style={styles.cardHeader}>4. Skill Training</Text>
                <View style={styles.tableHeader}>
                  <Text style={[styles.headerCell, { flex: 0.4 }]}>Steps</Text>
                  <Text style={[styles.headerCell, { flex: 0.3, textAlign: 'center' }]}>Hours Spent</Text>
                  <Text style={[styles.headerCell, { flex: 0.3, textAlign: 'center' }]}>Status</Text>
                </View>

                {skillTraining.map((item, idx) => (
                  <View key={item.id} style={styles.tableRow}>
                    <TextInput
                      style={[styles.textInputCell, { flex: 0.4, color: theme.text }]}
                      placeholder="Write here..."
                      placeholderTextColor="#999"
                      selectionColor="#0055FF"
                      value={item.name}
                      onChangeText={(v) => {
                        const updated = [...skillTraining];
                        updated[idx].name = v;
                        setSkillTraining(updated);
                      }}
                    />
                    <View style={{ flex: 0.3, alignItems: 'center' }}>
                      {renderTimeInput({ hh: item.hh, mm: item.mm }, (newT) => {
                        const updated = [...skillTraining];
                        updated[idx].hh = newT.hh;
                        updated[idx].mm = newT.mm;
                        setSkillTraining(updated);
                      })}
                    </View>
                    <View style={{ flex: 0.3, flexDirection: 'row', justifyContent: 'center', gap: 4 }}>
                      {['Pursuing', 'Completed'].map(st => (
                        <TouchableOpacity
                          key={st}
                          style={[styles.statusBtn, item.status === st && styles.statusBtnActive]}
                          onPress={() => {
                            const updated = [...skillTraining];
                            updated[idx].status = st;
                            setSkillTraining(updated);
                          }}
                        >
                          <Text style={[styles.statusBtnText, item.status === st && styles.statusBtnTextActive]}>{st[0]}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                ))}

                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalValText}>{sumTimeArray(skillTraining)}</Text>
                </View>
              </GemCutCard>

              {/* 5. Online Course */}
              <GemCutCard borderColor={gems.sapphire + '40'} style={styles.card}>
                <Text style={styles.cardHeader}>5. Online Course</Text>
                <View style={styles.tableHeader}>
                  <Text style={[styles.headerCell, { flex: 0.4 }]}>Steps</Text>
                  <Text style={[styles.headerCell, { flex: 0.3, textAlign: 'center' }]}>Hours Spent</Text>
                  <Text style={[styles.headerCell, { flex: 0.3, textAlign: 'center' }]}>Status</Text>
                </View>

                {onlineCourses.map((item, idx) => (
                  <View key={item.id} style={styles.tableRow}>
                    <TextInput
                      style={[styles.textInputCell, { flex: 0.4, color: theme.text }]}
                      placeholder="Write here..."
                      placeholderTextColor="#999"
                      selectionColor="#0055FF"
                      value={item.name}
                      onChangeText={(v) => {
                        const updated = [...onlineCourses];
                        updated[idx].name = v;
                        setOnlineCourses(updated);
                      }}
                    />
                    <View style={{ flex: 0.3, alignItems: 'center' }}>
                      {renderTimeInput({ hh: item.hh, mm: item.mm }, (newT) => {
                        const updated = [...onlineCourses];
                        updated[idx].hh = newT.hh;
                        updated[idx].mm = newT.mm;
                        setOnlineCourses(updated);
                      })}
                    </View>
                    <View style={{ flex: 0.3, flexDirection: 'row', justifyContent: 'center', gap: 4 }}>
                      {['Pursuing', 'Completed'].map(st => (
                        <TouchableOpacity
                          key={st}
                          style={[styles.statusBtn, item.status === st && styles.statusBtnActive]}
                          onPress={() => {
                            const updated = [...onlineCourses];
                            updated[idx].status = st;
                            setOnlineCourses(updated);
                          }}
                        >
                          <Text style={[styles.statusBtnText, item.status === st && styles.statusBtnTextActive]}>{st[0]}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                ))}

                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalValText}>{sumTimeArray(onlineCourses)}</Text>
                </View>
              </GemCutCard>

              {/* Linear Progression Navigation */}
              <View style={styles.linearNavRow}>
                <TouchableOpacity
                  style={styles.navBtnBack}
                  onPress={() => router.push('/stage4/PartD_ClassroomInteractions')}
                >
                  <Ionicons name="arrow-back" size={16} color={gems.sapphire} />
                  <Text style={styles.navBtnBackText}>Back: Part D</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.navBtnNext}
                  onPress={() => router.push('/stage4/CompetencyProfile')}
                >
                  <Text style={styles.navBtnNextText}>Next: Part F (Competency Profile)</Text>
                  <Ionicons name="arrow-forward" size={16} color="#FFF" />
                </TouchableOpacity>
              </View>
            </ScrollView>
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
  saveBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
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
    fontSize: 12.5,
    fontWeight: '700',
    letterSpacing: 1.5,
    fontFamily: 'Outfit_600SemiBold',
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
  scrollContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  mainSectionTitle: {
    fontSize: 11.5,
    fontWeight: '700',
    color: gems.sapphire,
    fontFamily: 'Outfit_600SemiBold',
    marginBottom: 14,
    textTransform: 'uppercase',
  },
  card: {
    marginBottom: 18,
  },
  cardHeader: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'Outfit_600SemiBold',
    textTransform: 'uppercase',
    color: gems.sapphire,
    marginBottom: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1.5,
    borderBottomColor: '#ccc',
    paddingBottom: 6,
    marginBottom: 8,
  },
  headerCell: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'Outfit_600SemiBold',
    textTransform: 'uppercase',
    color: '#555',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: 8,
    gap: 8,
  },
  stepLabel: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
  },
  textInputCell: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    paddingVertical: 2,
  },
  timeInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  timeInputText: {
    fontSize: 11,
    fontWeight: '700',
    width: 20,
    textAlign: 'center',
    padding: 0,
    fontFamily: 'Outfit_600SemiBold',
  },
  timeColon: {
    fontSize: 11,
    fontWeight: '700',
    marginHorizontal: 2,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1.5,
    borderTopColor: '#ccc',
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'Outfit_600SemiBold',
    color: '#333',
  },
  totalValText: {
    fontSize: 13,
    fontWeight: '800',
    color: gems.sapphire,
    fontFamily: 'Outfit_600SemiBold',
  },
  statusBtn: {
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
  },
  statusBtnActive: {
    borderColor: gems.sapphire,
    backgroundColor: gems.sapphire + '15',
  },
  statusBtnText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#666',
  },
  statusBtnTextActive: {
    color: gems.sapphire,
  },
  linearNavRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 12,
  },
  navBtnBack: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: gems.sapphire,
    backgroundColor: 'rgba(46,88,148,0.06)',
  },
  navBtnBackText: {
    fontSize: 12,
    fontWeight: '700',
    color: gems.sapphire,
    fontFamily: 'Outfit_600SemiBold',
  },
  navBtnNext: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: gems.sapphire,
  },
  navBtnNextText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFF',
    fontFamily: 'Outfit_600SemiBold',
  },
});
