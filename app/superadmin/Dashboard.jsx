import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../context/GlobalContext';
import SoundButton from '../../components/SoundButton';
import { Ionicons } from '@expo/vector-icons';
import { Alert } from 'react-native';

const { width } = Dimensions.get('window');

export default function SuperadminDashboard() {
  const { theme } = useTheme();
  const router = useRouter();
  const styles = getStyles(theme);
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  const stats = [
    { label: 'Registered Students', value: '124', icon: 'people-outline', color: theme.primary },
    { label: 'Active Teachers', value: '12', icon: 'school-outline', color: theme.accent },
    { label: 'Reports Issued', value: '450+', icon: 'document-text-outline', color: '#10b981' },
  ];

  const quickActions = [
    { title: 'Student & Class Hall', subtitle: 'Global oversight of all accounts', icon: 'people-outline', route: '/superadmin/ManageStudents' },
    { title: 'Academic Year', subtitle: 'Bulk advance students', icon: 'calendar-outline', route: null },
    { title: 'System Settings', subtitle: 'Configure school profile', icon: 'settings-outline', route: null },
  ];

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Animated.View style={{ opacity: fadeAnim }}>
          <View style={styles.header}>
            <View>
              <Text style={styles.welcome}>Welcome Admin</Text>
              <Text style={styles.title}>School Portal</Text>
            </View>
            <TouchableOpacity 
              style={styles.profileIcon}
              onPress={() => router.push("/")}
            >
              <Ionicons name="log-out-outline" size={32} color={theme.error} />
            </TouchableOpacity>
          </View>

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            {stats.map((stat, i) => (
              <View key={i} style={styles.statCard}>
                <View style={[styles.iconBox, { backgroundColor: stat.color + '20' }]}>
                  <Ionicons name={stat.icon} size={24} color={stat.color} />
                </View>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>

          {/* Quick Actions */}
          <Text style={styles.sectionTitle}>Quick Management</Text>
          {quickActions.map((action, i) => (
            <SoundButton 
              key={i} 
              style={styles.actionCard}
              onPress={() => {
                if (action.route) {
                  router.push(action.route);
                } else {
                  Alert.alert("Authorized Access Only", "This partition is under maintenance for current optimization. Use 'Student & Class Hall' for immediate overrides.");
                }
              }}
            >
              <View style={styles.actionLeft}>
                <View style={styles.actionIcon}>
                  <Ionicons name={action.icon} size={24} color={theme.text} />
                </View>
                <View>
                  <Text style={styles.actionTitle}>{action.title}</Text>
                  <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.secondaryText} />
            </SoundButton>
          ))}

          {/* System Status */}
          <View style={styles.statusBox}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>System Online - Connectivity Active</Text>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  welcome: {
    fontSize: 14,
    color: theme.secondaryText,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: theme.text,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  statCard: {
    backgroundColor: theme.card,
    width: (width - 64) / 3,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: 'center',
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.text,
  },
  statLabel: {
    fontSize: 9,
    color: theme.secondaryText,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 4,
    textTransform: 'uppercase',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.text,
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  actionCard: {
    backgroundColor: theme.card,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIcon: {
    marginRight: 16,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.text,
  },
  actionSubtitle: {
    fontSize: 12,
    color: theme.secondaryText,
    marginTop: 2,
  },
  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    opacity: 0.6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
    marginRight: 8,
  },
  statusText: {
    fontSize: 10,
    color: theme.secondaryText,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
