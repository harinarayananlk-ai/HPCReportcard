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

export default function PartEFTimeInventories() {
  const router = useRouter();
  const { theme } = useTheme();
  const { user, profile, activeStudentId, activeStudentProfile, setActiveStudentProfile, setProfile: setAuthProfile } = useAuth();
  const isTeacher = user?.role === 'teacher' || user?.role === 'superadmin';
  const targetUserId = activeStudentId || user?.id;
  const targetProfile = isTeacher ? activeStudentProfile : profile;

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);

  // --- STATE ---
  // Part E: Online Courses (10 rows, a to j)
  const [courses, setCourses] = useState(
    Array.from({ length: 10 }, (_, i) => ({
      id: String.fromCharCode(97 + i), // a, b, c... j
      courseName: '',
      hours: '',
      completed: false
    }))
  );

  // Part F: Category Hours Spent
  const [hoursSpent, setHoursSpent] = useState({
    groupProject: '',
    problemInquiry: '',
    classroomInteractions: ''
  });

  // Part F.4: Skill training (4 rows, a to d)
  const [vocationalSkills, setVocationalSkills] = useState([
    { id: 'a', skillName: '', hours: '', status: '' },
    { id: 'b', skillName: '', hours: '', status: '' },
    { id: 'c', skillName: '', hours: '', status: '' },
    { id: 'd', skillName: '', hours: '', status: '' }
  ]);

  // --- AUTO CALCULATIONS ---
  // Sum online course hours
  const totalOnlineHours = courses.reduce((sum, item) => {
    const val = parseFloat(item.hours) || 0;
    return sum + val;
  }, 0);

  // Sum vocational training hours
  const totalVocationalHours = vocationalSkills.reduce((sum, item) => {
    const val = parseFloat(item.hours) || 0;
    return sum + val;
  }, 0);

  // Sum overall hours spent
  const totalOverallHours = (parseFloat(hoursSpent.groupProject) || 0) +
                            (parseFloat(hoursSpent.problemInquiry) || 0) +
                            (parseFloat(hoursSpent.classroomInteractions) || 0) +
                            totalVocationalHours;

  // --- SAVE & LOAD ---
  const getPayload = useCallback(() => {
    const stage4Obj = {
      timeInventories: {
        courses,
        hoursSpent,
        vocationalSkills
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
  }, [courses, hoursSpent, vocationalSkills, targetProfile]);

  const { triggerSave } = useAutoSave(targetUserId, getPayload, [
    courses, hoursSpent, vocationalSkills
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
          if (ti.courses) setCourses(ti.courses);
          if (ti.hoursSpent) setHoursSpent(prev => ({ ...prev, ...ti.hoursSpent }));
          if (ti.vocationalSkills) setVocationalSkills(ti.vocationalSkills);
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
      Alert.alert("Saved Successfully", "Your progress for Time Inventories has been saved.");
    } catch (e) {
      Alert.alert("Save Failed", "Could not connect to the database.");
    }
  };

  // Row update helpers
  const updateCourseRow = (idx, field, val) => {
    setCourses(prev => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: val };
      return updated;
    });
  };

  const updateVocationalRow = (idx, field, val) => {
    setVocationalSkills(prev => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: val };
      return updated;
    });
  };

  const renderPartE = () => {
    return (
      <ScrollView style={styles.tabContent} contentContainerStyle={{ paddingBottom: 60 }} nestedScrollEnabled>
        <GemCutCard borderColor={gems.sapphire + '40'} style={styles.card}>
          <Text style={styles.cardHeader}>Learning Through Online Courses (a to j)</Text>
          <Text style={styles.helperText}>Enter course title, hours spent, and check if completed.</Text>
          
          <View style={styles.tableHeader}>
            <Text style={[styles.headerCell, { flex: 0.1, textAlign: 'center' }]}>#</Text>
            <Text style={[styles.headerCell, { flex: 0.5 }]}>Course Title</Text>
            <Text style={[styles.headerCell, { flex: 0.2, textAlign: 'center' }]}>Hours</Text>
            <Text style={[styles.headerCell, { flex: 0.2, textAlign: 'center' }]}>Done</Text>
          </View>

          {courses.map((item, idx) => (
            <View key={item.id} style={styles.tableRow}>
              <Text style={[styles.cellText, { flex: 0.1, textAlign: 'center', fontWeight: 'bold' }]}>
                {item.id.toUpperCase()}
              </Text>
              <TextInput
                style={[styles.rowInput, { flex: 0.5 }]}
                placeholder="e.g. Intro to AI"
                placeholderTextColor="#ccc"
                value={item.courseName}
                onChangeText={(v) => updateCourseRow(idx, 'courseName', v)}
              />
              <TextInput
                style={[styles.rowInput, { flex: 0.2, textAlign: 'center' }]}
                placeholder="0"
                keyboardType="numeric"
                placeholderTextColor="#ccc"
                value={item.hours}
                onChangeText={(v) => updateCourseRow(idx, 'hours', v)}
              />
              <TouchableOpacity
                style={{ flex: 0.2, alignItems: 'center', justifyContent: 'center' }}
                onPress={() => updateCourseRow(idx, 'completed', !item.completed)}
              >
                <Ionicons
                  name={item.completed ? "checkbox-outline" : "square-outline"}
                  size={18}
                  color={item.completed ? gems.sapphire : '#888'}
                />
              </TouchableOpacity>
            </View>
          ))}

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>TOTAL ONLINE COURSE HOURS</Text>
            <View style={styles.totalBadge}>
              <Text style={styles.totalBadgeText}>{totalOnlineHours} hrs</Text>
            </View>
          </View>
        </GemCutCard>
      </ScrollView>
    );
  };

  const renderPartF = () => {
    return (
      <ScrollView style={styles.tabContent} contentContainerStyle={{ paddingBottom: 60 }} nestedScrollEnabled>
        {/* Core Parts hours */}
        <GemCutCard borderColor={gems.sapphire + '40'} style={styles.card}>
          <Text style={styles.cardHeader}>1. Standard Academic Activities</Text>
          <Text style={styles.helperText}>Enter estimated hours spent on each main module.</Text>
          
          <View style={styles.fieldRow}>
            <Text style={[styles.fieldLabel, { color: theme.text }]}>Part B: Group Project Work</Text>
            <TextInput
              style={styles.numericInput}
              placeholder="0"
              keyboardType="numeric"
              placeholderTextColor="#ccc"
              value={hoursSpent.groupProject}
              onChangeText={(v) => setHoursSpent(prev => ({ ...prev, groupProject: v }))}
            />
          </View>

          <View style={styles.fieldRow}>
            <Text style={[styles.fieldLabel, { color: theme.text }]}>Part C: Problem-Based Inquiry</Text>
            <TextInput
              style={styles.numericInput}
              placeholder="0"
              keyboardType="numeric"
              placeholderTextColor="#ccc"
              value={hoursSpent.problemInquiry}
              onChangeText={(v) => setHoursSpent(prev => ({ ...prev, problemInquiry: v }))}
            />
          </View>

          <View style={styles.fieldRow}>
            <Text style={[styles.fieldLabel, { color: theme.text }]}>Part D: Classroom Interactions</Text>
            <TextInput
              style={styles.numericInput}
              placeholder="0"
              keyboardType="numeric"
              placeholderTextColor="#ccc"
              value={hoursSpent.classroomInteractions}
              onChangeText={(v) => setHoursSpent(prev => ({ ...prev, classroomInteractions: v }))}
            />
          </View>
        </GemCutCard>

        {/* Vocational training */}
        <GemCutCard borderColor={gems.sapphire + '40'} style={styles.card}>
          <Text style={styles.cardHeader}>2. Outside Classroom (Skill Training) (a to d)</Text>
          <Text style={styles.helperText}>Enter skill training course, hours spent, and status.</Text>
          
          <View style={styles.tableHeader}>
            <Text style={[styles.headerCell, { flex: 0.1, textAlign: 'center' }]}>#</Text>
            <Text style={[styles.headerCell, { flex: 0.5 }]}>Skill Description</Text>
            <Text style={[styles.headerCell, { flex: 0.2, textAlign: 'center' }]}>Hours</Text>
            <Text style={[styles.headerCell, { flex: 0.2, textAlign: 'center' }]}>Status</Text>
          </View>

          {vocationalSkills.map((item, idx) => (
            <View key={item.id} style={styles.tableRow}>
              <Text style={[styles.cellText, { flex: 0.1, textAlign: 'center', fontWeight: 'bold' }]}>
                {item.id.toUpperCase()}
              </Text>
              <TextInput
                style={[styles.rowInput, { flex: 0.5 }]}
                placeholder="e.g. Carpentry"
                placeholderTextColor="#ccc"
                value={item.skillName}
                onChangeText={(v) => updateVocationalRow(idx, 'skillName', v)}
              />
              <TextInput
                style={[styles.rowInput, { flex: 0.2, textAlign: 'center' }]}
                placeholder="0"
                keyboardType="numeric"
                placeholderTextColor="#ccc"
                value={item.hours}
                onChangeText={(v) => updateVocationalRow(idx, 'hours', v)}
              />
              <TextInput
                style={[styles.rowInput, { flex: 0.2, textAlign: 'center' }]}
                placeholder="Completed"
                placeholderTextColor="#ccc"
                value={item.status}
                onChangeText={(v) => updateVocationalRow(idx, 'status', v)}
              />
            </View>
          ))}

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>TOTAL SKILL TRAINING HOURS</Text>
            <View style={styles.totalBadge}>
              <Text style={styles.totalBadgeText}>{totalVocationalHours} hrs</Text>
            </View>
          </View>
        </GemCutCard>

        {/* Grand Total Part F */}
        <GemCutCard borderColor={gems.silver + '40'} style={styles.card}>
          <View style={styles.grandTotalRow}>
            <View>
              <Text style={styles.grandTotalHeader}>GRAND TOTAL TIME SPENT</Text>
              <Text style={styles.grandTotalSub}>Sums Part B, C, D, and Vocational training</Text>
            </View>
            <View style={[styles.totalBadge, { backgroundColor: gems.sapphire }]}>
              <Text style={[styles.totalBadgeText, { color: '#FFF' }]}>{totalOverallHours} hrs</Text>
            </View>
          </View>
        </GemCutCard>
      </ScrollView>
    );
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case 0: return renderPartE();
      case 1: return renderPartF();
      default: return renderPartE();
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
            <Text style={[styles.title, { color: theme.text }]}>TIME INVENTORIES</Text>
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
            <Text style={[styles.loadingText, { color: theme.secondaryText }]}>Loading inventories...</Text>
          </View>
        ) : (
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
          >
            <AnimatedTabBar
              tabs={['Part E: Online', 'Part F: Hours Spent']}
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
  cardHeader: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'Outfit_600SemiBold',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: gems.sapphire,
  },
  helperText: {
    fontSize: 10,
    color: '#888',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1.5,
    borderBottomColor: '#ccc',
    paddingBottom: 4,
    marginBottom: 8,
  },
  headerCell: {
    fontSize: 10.5,
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
    paddingVertical: 4,
  },
  cellText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  rowInput: {
    height: 32,
    fontSize: 12,
    color: '#222',
    fontFamily: 'Inter_400Regular',
    paddingHorizontal: 4,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1.5,
    borderTopColor: '#ccc',
  },
  totalLabel: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'Outfit_600SemiBold',
    color: '#444',
  },
  totalBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(46, 88, 148, 0.1)',
  },
  totalBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: gems.sapphire,
    fontFamily: 'Outfit_600SemiBold',
  },
  fieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f3f3',
  },
  fieldLabel: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  numericInput: {
    width: 60,
    height: 32,
    borderBottomWidth: 1,
    borderBottomColor: gems.sapphire,
    textAlign: 'center',
    fontSize: 13,
    color: '#222',
    fontFamily: 'Inter_400Regular',
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  grandTotalHeader: {
    fontSize: 12.5,
    fontWeight: '700',
    fontFamily: 'Outfit_600SemiBold',
    color: '#222',
  },
  grandTotalSub: {
    fontSize: 9.5,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 2,
  },
});
