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
import { gems } from '../../colour_themes';
import useAutoSave from '../../hooks/useAutoSave';

export default function CompetencyProfile() {
  const router = useRouter();
  const { theme } = useTheme();
  const { user, profile, activeStudentId, activeStudentProfile } = useAuth();
  const isTeacher = user?.role === 'teacher' || user?.role === 'superadmin';
  const targetUserId = activeStudentId || user?.id;
  const targetProfile = isTeacher ? activeStudentProfile : profile;

  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState({});
  const [activeGradeTab, setActiveGradeTab] = useState(0); // 0: Grade 9, 1: Grade 10, 2: Grade 11, 3: Grade 12

  const skillsData = {
    awareness: [
      { id: 'awr_a', label: 'a. Proficiency in language R1, R2, R3' },
      { id: 'awr_b', label: 'b. Oral Communication' },
      { id: 'awr_c', label: 'c. Written communication' },
      { id: 'awr_d', label: 'd. Health and nutrition literacy' },
      { id: 'awr_e', label: 'e. Physical education, fitness, wellness, and sports' },
      { id: 'awr_f', label: 'f. Digital literacy' },
      { id: 'awr_g', label: 'g. Knowledge of India' },
      { id: 'awr_h', label: 'h. Environmental literacy (conservation, sanitation, hygiene)' },
      { id: 'awr_i', label: 'i. Knowledge of critical issues (current affairs, local, state, global)' },
    ],
    sensitivity: [
      { id: 'sen_a', label: 'a. Collaboration and teamwork' },
      { id: 'sen_b', label: 'b. Ethical and moral reasoning' },
      { id: 'sen_c', label: 'c. Practice of human and Constitutional values' },
      { id: 'sen_d', label: 'd. Gender sensitivity' },
      { id: 'sen_e', label: 'e. Citizenship skills and values' },
      { id: 'sen_f', label: 'f. Fundamental duties' },
    ],
    creativity: [
      { id: 'cre_a', label: 'a. Scientific temper and evidence-based thinking' },
      { id: 'cre_b', label: 'b. Creativity and innovativeness' },
      { id: 'cre_c', label: 'c. Sense of aesthetics and art' },
      { id: 'cre_d', label: 'd. Critical thinking' },
      { id: 'cre_e', label: 'e. Problem-solving' },
      { id: 'cre_f', label: 'f. Skills training (Vocational)' },
      { id: 'cre_g', label: 'g. Coding and computational thinking' },
    ]
  };

  const grades = [9, 10, 11, 12];
  const levels = ['B', 'P', 'A'];

  // --- SAVE & LOAD ---
  const getPayload = useCallback(() => {
    const stage4Obj = {
      competencyProfile: profileData
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
  }, [profileData, targetProfile]);

  const { triggerSave } = useAutoSave(targetUserId, getPayload, [profileData]);

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
        const cp = assess.stage4?.competencyProfile;
        if (cp) {
          setProfileData(cp);
        }
      }
    } catch (e) {
      console.warn("Failed to load competency profile data", e);
    } finally {
      setLoading(false);
    }
  };

  const handleManualSave = async () => {
    try {
      await triggerSave();
      Alert.alert("Saved Successfully", "Competency Profile records updated.");
    } catch (e) {
      Alert.alert("Save Failed", "Could not connect to the database.");
    }
  };

  const setLevelValue = (skillId, grade, lvl) => {
    if (!isTeacher) return;
    const key = `${skillId}_g${grade}_level`;
    setProfileData(prev => ({
      ...prev,
      [key]: prev[key] === lvl ? '' : lvl
    }));
  };

  const getLevelValue = (skillId, grade) => {
    return profileData[`${skillId}_g${grade}_level`] || profileData[`${skillId}_g${grade}`] || '';
  };

  const setDescriptorText = (skillId, grade, text) => {
    if (!isTeacher) return;
    const key = `${skillId}_g${grade}_desc`;
    setProfileData(prev => ({
      ...prev,
      [key]: text
    }));
  };

  const getDescriptorText = (skillId, grade) => {
    return profileData[`${skillId}_g${grade}_desc`] || '';
  };

  const renderGradeTable = (grade) => {
    return (
      <View style={{ marginBottom: 20 }}>
        <Text style={styles.tableTitle}>GRADE - {grade} COMPETENCY PROFILE TABLE</Text>

        {[
          { title: '1. AWARENESS SKILLS', data: skillsData.awareness },
          { title: '2. SENSITIVITY SKILLS', data: skillsData.sensitivity },
          { title: '3. CREATIVITY SKILLS', data: skillsData.creativity }
        ].map(cat => (
          <GemCutCard key={cat.title} borderColor={gems.sapphire + '40'} style={styles.card}>
            <Text style={styles.categoryHeader}>{cat.title}</Text>
            
            <View style={styles.tableHeader}>
              <Text style={[styles.headerCell, { flex: 0.45 }]}>Abilities</Text>
              <Text style={[styles.headerCell, { flex: 0.25, textAlign: 'center' }]}>Level (B/P/A)</Text>
              <Text style={[styles.headerCell, { flex: 0.3, textAlign: 'center' }]}>Descriptors</Text>
            </View>

            {cat.data.map(skill => {
              const currentLvl = getLevelValue(skill.id, grade);
              const descText = getDescriptorText(skill.id, grade);
              return (
                <View key={skill.id} style={styles.tableRow}>
                  <Text style={[styles.skillLabelText, { flex: 0.45, color: theme.text }]}>
                    {skill.label}
                  </Text>
                  
                  <View style={{ flex: 0.25, flexDirection: 'row', justifyContent: 'center', gap: 4 }}>
                    {levels.map(lvl => (
                      <TouchableOpacity
                        key={lvl}
                        disabled={!isTeacher}
                        onPress={() => setLevelValue(skill.id, grade, lvl)}
                        style={[
                          styles.levelBtn,
                          currentLvl === lvl && styles.levelBtnActive,
                          !isTeacher && { opacity: 0.8 }
                        ]}
                      >
                        <Text style={[styles.levelBtnText, currentLvl === lvl && styles.levelBtnTextActive]}>
                          {lvl}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <View style={{ flex: 0.3 }}>
                    <TextInput
                      style={[styles.descriptorInput, { color: theme.text }]}
                      placeholder="Write here..."
                      placeholderTextColor="#999"
                      selectionColor="#0055FF"
                      multiline
                      value={descText}
                      editable={isTeacher}
                      onChangeText={(v) => setDescriptorText(skill.id, grade, v)}
                    />
                  </View>
                </View>
              );
            })}
          </GemCutCard>
        ))}
      </View>
    );
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
            <Text style={[styles.title, { color: theme.text }]}>PART F: COMPETENCY PROFILE</Text>
            <Text style={[styles.subtitle, { color: theme.secondaryText }]}>
              {targetProfile?.full_name || 'Loading...'}
            </Text>
          </View>
          <TouchableOpacity onPress={handleManualSave} disabled={!isTeacher} style={[styles.saveBtn, !isTeacher && { opacity: 0.5 }]}>
            <Ionicons name="cloud-upload-outline" size={20} color={gems.silver} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={gems.sapphire} />
            <Text style={[styles.loadingText, { color: theme.secondaryText }]}>Loading profile...</Text>
          </View>
        ) : (
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
            {/* 4 Grade Tabs */}
            <AnimatedTabBar
              tabs={['Grade 9', 'Grade 10', 'Grade 11', 'Grade 12']}
              activeIndex={activeGradeTab}
              onTabChange={setActiveGradeTab}
            />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
              {!isTeacher && (
                <View style={styles.lockNotice}>
                  <Ionicons name="lock-closed" size={16} color="#eab308" />
                  <Text style={styles.lockNoticeText}>
                    Locked: Only teachers can assess and update the Competency Profile. Students can view in read-only mode.
                  </Text>
                </View>
              )}

              <View style={styles.infoCard}>
                <Text style={[styles.infoTitle, { color: theme.text }]}>PERFORMANCE LEVEL DESCRIPTORS GRID</Text>
                <Text style={[styles.infoText, { color: theme.secondaryText }]}>
                  <Text style={{ fontWeight: 'bold', color: theme.text }}>B</Text> = Beginner | <Text style={{ fontWeight: 'bold', color: theme.text }}>P</Text> = Proficient | <Text style={{ fontWeight: 'bold', color: theme.text }}>A</Text> = Advanced
                </Text>
              </View>

              {renderGradeTable(grades[activeGradeTab])}

              {/* Linear Progression Bottom Navigation */}
              <View style={styles.linearNavRow}>
                <TouchableOpacity
                  style={styles.navBtnBack}
                  onPress={() => router.push('/stage4/PartEF_TimeInventories')}
                >
                  <Ionicons name="arrow-back" size={16} color={gems.sapphire} />
                  <Text style={styles.navBtnBackText}>Back: Part E</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.navBtnNext}
                  onPress={() => router.push('/stage4/Dashboard')}
                >
                  <Text style={styles.navBtnNextText}>Finish & View Summary</Text>
                  <Ionicons name="arrow-forward" size={16} color="#FFF" />
                </TouchableOpacity>
              </View>

              <View style={{ height: 40 }} />
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
    padding: 16,
    paddingBottom: 60,
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
    fontSize: 11,
    color: '#a16207',
    fontFamily: 'Inter_400Regular',
    flex: 1,
  },
  infoCard: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: 14,
    alignItems: 'center',
  },
  infoTitle: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'Outfit_600SemiBold',
    marginBottom: 4,
    letterSpacing: 1,
  },
  infoText: {
    fontSize: 10.5,
    fontFamily: 'Inter_400Regular',
  },
  tableTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: gems.sapphire,
    textTransform: 'uppercase',
    marginBottom: 10,
    fontFamily: 'Outfit_600SemiBold',
  },
  card: {
    marginBottom: 16,
  },
  categoryHeader: {
    fontSize: 11.5,
    fontWeight: '700',
    color: gems.sapphire,
    fontFamily: 'Outfit_600SemiBold',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1.5,
    borderBottomColor: '#ccc',
    paddingBottom: 6,
    marginBottom: 6,
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
    gap: 6,
  },
  skillLabelText: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
  },
  levelBtn: {
    width: 22,
    height: 22,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelBtnActive: {
    borderColor: gems.sapphire,
    backgroundColor: gems.sapphire,
  },
  levelBtnText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#666',
    fontFamily: 'Outfit_600SemiBold',
  },
  levelBtnTextActive: {
    color: '#FFF',
  },
  descriptorInput: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 4,
    minHeight: 34,
    textAlignVertical: 'top',
    backgroundColor: 'rgba(255,255,255,0.7)',
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
