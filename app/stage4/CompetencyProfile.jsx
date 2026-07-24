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

export default function CompetencyProfile() {
  const router = useRouter();
  const { theme } = useTheme();
  const { user, profile, activeStudentId, activeStudentProfile } = useAuth();
  const isTeacher = user?.role === 'teacher' || user?.role === 'superadmin';
  const targetUserId = activeStudentId || user?.id;
  const targetProfile = isTeacher ? activeStudentProfile : profile;

  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState({});

  const skillsData = {
    awareness: [
      { id: 'awr_a', label: 'Proficiency in language R1, R2, R3' },
      { id: 'awr_b', label: 'Oral Communication' },
      { id: 'awr_c', label: 'Written communication' },
      { id: 'awr_d', label: 'Health and nutrition literacy' },
      { id: 'awr_e', label: 'Physical education, fitness, wellness, and sports' },
      { id: 'awr_f', label: 'Digital literacy' },
      { id: 'awr_g', label: 'Knowledge of India' },
      { id: 'awr_h', label: 'Environmental literacy (including awareness of water and resource, conservation, sanitation and hygiene)' },
      { id: 'awr_i', label: 'Knowledge of critical issues (including current affairs and facing local communities, States, the country and the world, etc.)' },
    ],
    sensitivity: [
      { id: 'sen_a', label: 'Collaboration and teamwork' },
      { id: 'sen_b', label: 'Ethical and moral reasoning' },
      { id: 'sen_c', label: 'Knowledge and practice of human and Constitutional values' },
      { id: 'sen_d', label: 'Gender sensitivity' },
      { id: 'sen_e', label: 'Citizenship skills and values' },
      { id: 'sen_f', label: 'Fundamental duties' },
    ],
    creativity: [
      { id: 'cre_a', label: 'Scientific temper and evidence-based thinking' },
      { id: 'cre_b', label: 'Creativity and innovativeness' },
      { id: 'cre_c', label: 'Sense of aesthetics and art' },
      { id: 'cre_d', label: 'Critical thinking' },
      { id: 'cre_e', label: 'Problem-solving' },
      { id: 'cre_f', label: 'Skills training' },
      { id: 'cre_g', label: 'Coding and computational thinking' },
    ]
  };

  const grades = [9, 10, 11, 12];
  const levels = ['B', 'P', 'A']; // Beginner, Proficient, Advanced

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
    return profileData[`${skillId}_g${grade}_level`] || '';
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

  const renderSection = (title, skillsList) => {
    return (
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionHeader}>{title}</Text>
        
        {skillsList.map(skill => (
          <GemCutCard key={skill.id} borderColor={gems.sapphire + '25'} style={styles.skillCard}>
            <Text style={[styles.skillLabel, { color: theme.text }]}>{skill.label}</Text>
            
            <View style={styles.gradesGrid}>
              {grades.map(grade => {
                const currentVal = getLevelValue(skill.id, grade);
                const descText = getDescriptorText(skill.id, grade);
                return (
                  <View key={grade} style={styles.gradeCol}>
                    <View style={styles.gradeHeaderRow}>
                      <Text style={[styles.gradeText, { color: theme.secondaryText }]}>GRADE - {grade}</Text>
                      <View style={styles.badgeRow}>
                        {levels.map(lvl => (
                          <TouchableOpacity
                            key={lvl}
                            disabled={!isTeacher}
                            onPress={() => setLevelValue(skill.id, grade, lvl)}
                            style={[
                              styles.badgeBtn,
                              currentVal === lvl && styles.badgeBtnActive,
                              !isTeacher && { opacity: 0.8 }
                            ]}
                          >
                            <Text style={[styles.badgeText, currentVal === lvl && styles.badgeTextActive]}>
                              {lvl}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>

                    <TextInput
                      style={[styles.descriptorInput, { color: theme.text }]}
                      placeholder="Write here..."
                      placeholderTextColor="#999"
                      multiline
                      value={descText}
                      editable={isTeacher}
                      onChangeText={(v) => setDescriptorText(skill.id, grade, v)}
                    />
                  </View>
                );
              })}
            </View>
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
          <TouchableOpacity onPress={() => router.push('/stage4/Dashboard')} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color={theme.text} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={[styles.title, { color: theme.text }]}>STUDENT COMPETENCY PROFILE</Text>
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
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {!isTeacher && (
              <View style={styles.lockNotice}>
                <Ionicons name="lock-closed" size={16} color="#eab308" />
                <Text style={styles.lockNoticeText}>
                  Locked: Only teachers can assess and update the Competency Profile. Students can view their progress card in read-only mode.
                </Text>
              </View>
            )}

            <View style={styles.infoCard}>
              <Text style={[styles.infoTitle, { color: theme.text }]}>PERFORMANCE LEVEL DESCRIPTORS (GRADES 9-12)</Text>
              <Text style={[styles.infoText, { color: theme.secondaryText }]}>
                <Text style={{ fontWeight: 'bold', color: theme.text }}>B</Text> = Beginner | <Text style={{ fontWeight: 'bold', color: theme.text }}>P</Text> = Proficient | <Text style={{ fontWeight: 'bold', color: theme.text }}>A</Text> = Advanced
              </Text>
            </View>

            {renderSection('AWARENESS SKILLS', skillsData.awareness)}
            {renderSection('SENSITIVITY SKILLS', skillsData.sensitivity)}
            {renderSection('CREATIVITY SKILLS', skillsData.creativity)}

            <View style={{ height: 40 }} />
          </ScrollView>
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
    fontSize: 13,
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
  scrollContent: {
    padding: 16,
  },
  lockNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(234, 179, 8, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.2)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    gap: 10,
  },
  lockNoticeText: {
    fontSize: 11,
    color: '#a16207',
    fontFamily: 'Inter_400Regular',
    flex: 1,
  },
  infoCard: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: 16,
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
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: gems.sapphire,
    textTransform: 'uppercase',
    marginBottom: 10,
    fontFamily: 'Outfit_600SemiBold',
  },
  skillCard: {
    marginBottom: 12,
    padding: 12,
  },
  skillLabel: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'Outfit_600SemiBold',
    marginBottom: 12,
  },
  gradesGrid: {
    gap: 10,
  },
  gradeCol: {
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  gradeHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  gradeText: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'Outfit_600SemiBold',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 4,
  },
  badgeBtn: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeBtnActive: {
    borderColor: gems.sapphire,
    backgroundColor: gems.sapphire,
  },
  badgeText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#666',
    fontFamily: 'Outfit_600SemiBold',
  },
  badgeTextActive: {
    color: '#FFF',
  },
  descriptorInput: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 6,
    minHeight: 40,
    textAlignVertical: 'top',
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
});
