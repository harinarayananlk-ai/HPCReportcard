import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Animated, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../context/GlobalContext';
import { gems } from '../../colour_themes';
import SoundButton from '../../components/SoundButton';
import { Ionicons } from '@expo/vector-icons';
import { Alert } from 'react-native';
import PremiumBackground from '../../components/PremiumBackground';
import GemCutCard from '../../components/GemCutCard';

const { width } = Dimensions.get('window');

export default function SuperadminDashboard() {
  const { theme } = useTheme();
  const router = useRouter();
  const accentColor = gems.jade;
  const styles = getStyles(theme, accentColor);
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  const stats = [
    { label: 'UPLINKED_STUDENTS', value: '124', icon: 'people-outline', color: theme.primary },
    { label: 'ACTIVE_FACULTY', value: '12', icon: 'school-outline', color: accentColor },
    { label: 'TOTAL_CERTIFICATES', value: '450+', icon: 'document-text-outline', color: '#B8860B' }, // Gold color
  ];

  const quickActions = [
    { title: 'Identity & Hall', subtitle: 'Global oversight of all nodes', icon: 'people-outline', route: '/superadmin/ManageStudents' },
    { title: 'Temporal Advance', subtitle: 'Bulk academic migration', icon: 'calendar-outline', route: null },
    { title: 'System Core', subtitle: 'Configure school architecture', icon: 'settings-outline', route: null },
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
            {stats.map((stat, i) => (
              <GemCutCard key={i} style={styles.statCard} contentStyle={{ padding: 16 }}>
                <View style={[styles.iconBox, { backgroundColor: stat.color + '15' }]}>
                  <Ionicons name={stat.icon} size={20} color={stat.color} />
                </View>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </GemCutCard>
            ))}
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
    fontFamily: 'Jost_600SemiBold',
    letterSpacing: 3,
  },
  title: {
    fontSize: 24,
    color: theme.text,
    letterSpacing: 4,
    marginTop: 6,
    fontFamily: 'Jost_300Light',
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
    fontFamily: 'Jost_600SemiBold',
  },
  statLabel: {
    fontSize: 8,
    color: theme.secondaryText,
    textAlign: 'center',
    marginTop: 4,
    fontFamily: 'Jost_600SemiBold',
    letterSpacing: 1.5,
    opacity: 0.6,
  },
  sectionTitle: {
    fontSize: 10,
    color: theme.secondaryText,
    marginBottom: 20,
    letterSpacing: 2.5,
    fontFamily: 'Jost_600SemiBold',
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
    fontFamily: 'Jost_600SemiBold',
    letterSpacing: 1,
  },
  actionSubtitle: {
    fontSize: 11,
    color: theme.secondaryText,
    marginTop: 2,
    fontFamily: 'Jost_300Light',
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
    fontFamily: 'Jost_600SemiBold',
    letterSpacing: 1.5,
  },
});
