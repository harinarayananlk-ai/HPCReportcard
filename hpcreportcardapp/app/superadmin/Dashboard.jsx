import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Animated, StatusBar, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme, useAuth, API_URL } from '../../context/GlobalContext';
import { gems } from '../../colour_themes';
import SoundButton from '../../components/SoundButton';
import { Ionicons } from '@expo/vector-icons';
import PremiumBackground from '../../components/PremiumBackground';
import GemCutCard from '../../components/GemCutCard';

const { width } = Dimensions.get('window');

export default function SuperadminDashboard() {
  const { theme } = useTheme();
  const { schoolInfo } = useAuth();
  const router = useRouter();
  const accentColor = gems.sapphire;
  const styles = getStyles(theme, accentColor);
  const [fadeAnim] = useState(new Animated.Value(0));

  const [classTeachersCount, setClassTeachersCount] = useState(0);
  const [studentsCount, setStudentsCount] = useState(0);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoadingStats(true);
        const studentsRes = await fetch(`${API_URL}/admin/students`);
        const studentsData = await studentsRes.json();
        
        if (Array.isArray(studentsData)) {
          setStudentsCount(studentsData.length);
          
          // Unique classrooms (grade + section)
          const classrooms = new Set();
          studentsData.forEach(student => {
            if (student.class_name && student.section) {
              classrooms.add(`${student.class_name}-${student.section}`);
            }
          });
          setClassTeachersCount(classrooms.size);
        } else {
          setStudentsCount(0);
          setClassTeachersCount(0);
        }
      } catch (e) {
        console.warn("Failed to fetch superadmin stats", e);
      } finally {
        setLoadingStats(false);
      }
    };
    fetchStats();
  }, [API_URL]);

  const showSchoolInfo = () => {
    const sName = schoolInfo?.name || "Samosa High International School";
    const sUdise = schoolInfo?.udise_code || "09876543210";
    const sBoard = schoolInfo?.board || "CBSE";
    const sPrincipal = schoolInfo?.principal_name || "Dr. Rasgulla Roy";
    const sAddress = schoolInfo ? `${schoolInfo.address_line1 || ''}, ${schoolInfo.address_line2 || ''} (Pin: ${schoolInfo.pincode || ''})` : "42 Samosa Marg, Near Chutney Circle, Delhi - 110001";
    const sPhone = schoolInfo?.contact_phone || "011-23456789";
    const sEmail = schoolInfo?.contact_email || "admin@samosahigh.edu.in";
    const sMedium = "English";

    Alert.alert(
      "School Information",
      `🏫 Name: ${sName}\n` +
      `🔢 UDISE Code: ${sUdise}\n` +
      `📋 Board: ${sBoard}\n` +
      `🎓 Principal: ${sPrincipal}\n` +
      `🗣️ Medium: ${sMedium}\n\n` +
      `📍 Address: ${sAddress}\n` +
      `📞 Contact: ${sPhone} / ${sEmail}`,
      [{ text: "Close", style: "cancel" }]
    );
  };

  const quickActions = [
    { title: 'Identity & Hall', subtitle: 'Global oversight of all nodes', icon: 'people-outline', route: '/superadmin/ManageStudents' },
    { title: 'Attendance Chart (Main)', subtitle: 'Configure school working & leave days', icon: 'calendar-outline', route: '/superadmin/SuperadminCalendar' },
  ];

  return (
    <View style={styles.container}>
      <PremiumBackground gemColor={accentColor} />
      <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} />
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          <View style={styles.header}>
            <View>
              <Text style={styles.welcome}>ADMIN_OVERRIDE_ACTIVE</Text>
              <Text style={styles.title}>GLOBAL PORTAL</Text>
            </View>
            <SoundButton 
              style={styles.profileIcon}
              onPress={() => router.push("/")}
            >
              <Ionicons name="log-out-outline" size={24} color={theme.error} />
            </SoundButton>
          </View>

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            <TouchableOpacity 
              style={styles.statCard} 
              activeOpacity={0.8}
              onPress={showSchoolInfo}
            >
              <GemCutCard style={{ width: '100%' }} contentStyle={{ padding: 16, alignItems: 'center' }}>
                <View style={[styles.iconBox, { backgroundColor: theme.primary + '15' }]}>
                  <Ionicons name="business-outline" size={20} color={theme.primary} />
                </View>
                <Text style={[styles.statValue, { fontSize: 13, textAlign: 'center' }]}>SCHOOL INFO</Text>
                <Text style={styles.statLabel}>VIEW DETAILS</Text>
              </GemCutCard>
            </TouchableOpacity>

            <GemCutCard style={styles.statCard} contentStyle={{ padding: 16, alignItems: 'center' }}>
              <View style={[styles.iconBox, { backgroundColor: accentColor + '15' }]}>
                <Ionicons name="school-outline" size={20} color={accentColor} />
              </View>
              {loadingStats ? (
                <ActivityIndicator size="small" color={accentColor} />
              ) : (
                <Text style={styles.statValue}>{classTeachersCount}</Text>
              )}
              <Text style={styles.statLabel}>CLASS TEACHERS</Text>
            </GemCutCard>

            <GemCutCard style={styles.statCard} contentStyle={{ padding: 16, alignItems: 'center' }}>
              <View style={[styles.iconBox, { backgroundColor: '#B8860B15' }]}>
                <Ionicons name="people-outline" size={20} color="#B8860B" />
              </View>
              {loadingStats ? (
                <ActivityIndicator size="small" color="#B8860B" />
              ) : (
                <Text style={styles.statValue}>{studentsCount}</Text>
              )}
              <Text style={styles.statLabel}>STUDENTS</Text>
            </GemCutCard>
          </View>

          {/* Quick Actions */}
          <Text style={styles.sectionTitle}>System Management</Text>
          <View style={styles.actionsList}>
            {quickActions.map((action, i) => (
              <GemCutCard
                key={i}
                style={styles.actionCard}
                contentStyle={{ padding: 0 }}
              >
                <SoundButton 
                  style={styles.actionInner}
                  onPress={() => {
                    if (action.route) {
                      router.push(action.route);
                    } else {
                      Alert.alert("System Locked", "This partition is under maintenance for UI optimization. Use 'Identity & Hall' for immediate overrides.");
                    }
                  }}
                >
                  <View style={styles.actionLeft}>
                    <View style={[styles.actionIcon, { backgroundColor: theme.accent + '10' }]}>
                      <Ionicons name={action.icon} size={22} color={theme.text} />
                    </View>
                    <View>
                      <Text style={styles.actionTitle}>{action.title}</Text>
                      <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={theme.secondaryText} />
                </SoundButton>
              </GemCutCard>
            ))}
          </View>

          {/* System Status */}
          <View style={styles.statusBox}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>UPLINK_STABLE // CONNECTIVITY_OPTIMAL</Text>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const getStyles = (theme, accentColor) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    padding: 30,
    paddingTop: 80,
    paddingBottom: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 44,
  },
  welcome: {
    fontSize: 9,
    color: accentColor,
    fontFamily: 'Outfit_600SemiBold',
    letterSpacing: 3,
  },
  title: {
    fontSize: 24,
    color: theme.text,
    letterSpacing: 4,
    marginTop: 6,
    fontFamily: 'Inter_400Regular',
  },
  profileIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.surface + '80',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.border + '50',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
    gap: 12,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 20,
    color: theme.text,
    fontFamily: 'Outfit_600SemiBold',
  },
  statLabel: {
    fontSize: 8,
    color: theme.secondaryText,
    textAlign: 'center',
    marginTop: 4,
    fontFamily: 'Outfit_600SemiBold',
    letterSpacing: 1.5,
    opacity: 0.6,
  },
  sectionTitle: {
    fontSize: 10,
    color: theme.secondaryText,
    marginBottom: 20,
    letterSpacing: 2.5,
    fontFamily: 'Outfit_600SemiBold',
    textTransform: 'uppercase',
    opacity: 0.8,
  },
  actionsList: {
    gap: 12,
  },
  actionCard: {
  },
  actionInner: {
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionTitle: {
    fontSize: 15,
    color: theme.text,
    fontFamily: 'Outfit_600SemiBold',
    letterSpacing: 1,
  },
  actionSubtitle: {
    fontSize: 11,
    color: theme.secondaryText,
    marginTop: 2,
    fontFamily: 'Inter_400Regular',
    letterSpacing: 0.5,
  },
  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
    opacity: 0.4,
  },
  statusDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#10b981',
    marginRight: 10,
  },
  statusText: {
    fontSize: 8,
    color: theme.secondaryText,
    fontFamily: 'Outfit_600SemiBold',
    letterSpacing: 1.5,
  },
});
