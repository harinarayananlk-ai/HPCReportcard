import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  Dimensions,
  ActivityIndicator,
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

const { width } = Dimensions.get('window');

export default function Stage4Dashboard() {
  const router = useRouter();
  const { theme } = useTheme();
  const { user, profile, activeStudentId, activeStudentProfile } = useAuth();
  const isTeacher = user?.role === 'teacher' || user?.role === 'superadmin';
  const targetUserId = activeStudentId || user?.id;
  const targetProfile = isTeacher ? activeStudentProfile : profile;

  // Derive stage4Data synchronously from targetProfile
  const stage4Data = (() => {
    if (targetProfile && targetProfile.assessments) {
      let assess = targetProfile.assessments;
      if (typeof assess === 'string') {
        try { assess = JSON.parse(assess); } catch (e) {}
      }
      return assess?.stage4 || null;
    }
    return null;
  })();

  const loading = false; // Synchronous data parsing, no loading state needed

  const getStatus = (sectionKey) => {
    if (!stage4Data || !stage4Data[sectionKey]) return 'Not Started';
    const sec = stage4Data[sectionKey];
    // Simple completion heuristic based on key fields
    if (sectionKey === 'partB' && sec.subjects && sec.subjects.length > 0) {
      return sec.levelOverviewTeacher ? 'Completed' : 'In Progress';
    }
    if (sectionKey === 'partC' && sec.hypothesis) {
      return sec.levelOverviewTeacher ? 'Completed' : 'In Progress';
    }
    if (sectionKey === 'partD' && sec.topic) {
      return sec.teacherAssessments ? 'Completed' : 'In Progress';
    }
    if (sectionKey === 'timeInventories' && (sec.courses || sec.hoursSpent)) {
      return 'Completed';
    }
    if (sectionKey === 'competencyProfile' && Object.keys(sec).length > 0) {
      return 'Completed';
    }
    return 'In Progress';
  };

  const getStatusColor = (status) => {
    if (status === 'Completed') return '#22c55e'; // green
    if (status === 'In Progress') return '#eab308'; // yellow
    return theme.secondaryText;
  };

  const sections = [
    {
      id: 'partB',
      title: 'Part B: Group Project Work',
      desc: 'Collaborative sprint. Fill out project prompts, schedules, dynamic checklists, and teacher rubrics.',
      path: '/stage4/PartB_GroupProject',
      icon: 'people-outline',
      accent: gems.sapphire
    },
    {
      id: 'partC',
      title: 'Part C: Problem-Based Inquiry',
      desc: 'Solo mission research report. Map data, checklists, dynamic parameters, and self logs.',
      path: '/stage4/PartC_ProblemBasedInquiry',
      icon: 'search-outline',
      accent: gems.sapphire
    },
    {
      id: 'partD',
      title: 'Part D: Classroom Interactions',
      desc: 'Short-burst activities. Tracks classroom discussions, debates, lab experiments, and peer reviews.',
      path: '/stage4/PartD_ClassroomInteractions',
      icon: 'chatbubbles-outline',
      accent: gems.sapphire
    },
    {
      id: 'timeInventories',
      title: 'Part E & F: Time Inventories',
      desc: 'Log hours for online courses and spent on different stages of your curriculum.',
      path: '/stage4/PartEF_TimeInventories',
      icon: 'time-outline',
      accent: gems.sapphire
    },
    {
      id: 'competencyProfile',
      title: 'Student’s Competency Profile',
      desc: 'Massive multiannual tracking matrix mapping Grade 9-12 performance descriptors.',
      path: '/stage4/CompetencyProfile',
      icon: 'ribbon-outline',
      accent: gems.silver
    }
  ];

  return (
    <View style={styles.container}>
      <PremiumBackground gemColor={gems.sapphire} />
      <SafeAreaView style={{ flex: 1 }}>
        <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} />

        {/* Header */}
        <View style={styles.header}>
          <MenuDropdown />
          <View style={styles.headerTitleContainer}>
            <Text style={[styles.title, { color: theme.text }]}>STAGE 4 DOSSIER</Text>
            <Text style={[styles.subtitle, { color: theme.secondaryText }]}>
              Secondary Stage: {targetProfile?.class_name || 'Grades 9-12'}
            </Text>
          </View>
          <SoundButton onPress={() => router.push(isTeacher ? '/TeacherTracking' : '/StudentHomepage')} style={styles.backBtn}>
            <Ionicons name="home-outline" size={20} color={theme.text} />
          </SoundButton>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={gems.sapphire} />
            <Text style={[styles.loadingText, { color: theme.secondaryText }]}>Loading student records...</Text>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Overview / Student Info */}
            <GemCutCard borderColor={gems.sapphire + '40'} style={styles.infoCard}>
              <View style={styles.infoRow}>
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarText}>
                    {(targetProfile?.full_name || user?.username || 'S')[0].toUpperCase()}
                  </Text>
                </View>
                <View style={styles.studentInfo}>
                  <Text style={[styles.studentName, { color: theme.text }]}>
                    {targetProfile?.full_name || 'Loading Student...'}
                  </Text>
                  <Text style={[styles.studentDetail, { color: theme.secondaryText }]}>
                    Reg No: {targetProfile?.registration_number || '---'} | Roll: {targetProfile?.roll_number || '---'}
                  </Text>
                </View>
              </View>
            </GemCutCard>

            <Text style={styles.sectionHeader}>HPC Parts Breakdown</Text>

            {/* Sections List */}
            <View style={styles.sectionsList}>
              {sections.map((sec) => {
                const status = getStatus(sec.id);
                return (
                  <AnimatedCard
                    key={sec.id}
                    section={sec}
                    status={status}
                    statusColor={getStatusColor(status)}
                    theme={theme}
                    onPress={() => router.push(sec.path)}
                  />
                );
              })}
            </View>

            {/* Preview & Export */}
            <View style={styles.buttonContainer}>
              <GemButton
                gemType="sapphire"
                onPress={() => router.push('/part_b/viewer')}
              >
                <Text style={styles.btnText}>PREVIEW & EXPORT PDF REPORT</Text>
              </GemButton>
            </View>
            
            <View style={{ height: 40 }} />
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}

function AnimatedCard({ section, status, statusColor, theme, onPress }) {
  return (
    <GemCutCard
      borderColor={section.accent + '50'}
      style={styles.cardWrapper}
      contentStyle={{ padding: 0 }}
    >
      <SoundButton style={styles.cardBtn} onPress={onPress}>
        <View style={[styles.cardIconBox, { backgroundColor: section.accent + '15' }]}>
          <Ionicons name={section.icon} size={22} color={section.accent} />
        </View>
        <View style={styles.cardContent}>
          <View style={styles.cardTitleRow}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>{section.title}</Text>
            <View style={[styles.statusBadge, { borderColor: statusColor + '40', backgroundColor: statusColor + '10' }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>{status.toUpperCase()}</Text>
            </View>
          </View>
          <Text style={[styles.cardDesc, { color: theme.secondaryText }]}>{section.desc}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={theme.secondaryText} style={styles.arrow} />
      </SoundButton>
    </GemCutCard>
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
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '300',
    letterSpacing: 3,
    fontFamily: 'Inter_400Regular',
  },
  subtitle: {
    fontSize: 9,
    letterSpacing: 1,
    marginTop: 2,
    textTransform: 'uppercase',
    fontFamily: 'Inter_400Regular',
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
    padding: 20,
  },
  infoCard: {
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 8,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: gems.sapphire + '20',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: gems.sapphire + '40',
  },
  avatarText: {
    color: gems.sapphire,
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'Outfit_600SemiBold',
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Outfit_600SemiBold',
  },
  studentDetail: {
    fontSize: 11,
    marginTop: 2,
    fontFamily: 'Inter_400Regular',
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: '#666',
    textTransform: 'uppercase',
    marginBottom: 16,
    fontFamily: 'Outfit_600SemiBold',
  },
  sectionsList: {
    gap: 12,
    marginBottom: 24,
  },
  cardWrapper: {
    width: '100%',
  },
  cardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  cardIconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
    gap: 8,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'Outfit_600SemiBold',
    flex: 1,
  },
  statusBadge: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusText: {
    fontSize: 8,
    fontWeight: '800',
    fontFamily: 'Outfit_600SemiBold',
  },
  cardDesc: {
    fontSize: 11,
    lineHeight: 15,
    fontFamily: 'Inter_400Regular',
  },
  arrow: {
    marginLeft: 8,
  },
  buttonContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  btnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
    fontFamily: 'Outfit_600SemiBold',
    textAlign: 'center',
    paddingHorizontal: 12,
  },
});
