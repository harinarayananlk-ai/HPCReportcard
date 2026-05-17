import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme, useAuth, API_URL } from '../../context/GlobalContext';
import PremiumBackground from '../../components/PremiumBackground';
import SoundButton from '../../components/SoundButton';

// Fixed ID for global school settings
const GLOBAL_SETTINGS_ID = 'global_school_settings';

export default function SuperadminCalendar() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [startMonthIdx, setStartMonthIdx] = useState(0); // 0 = Apr (as default)
  const [workingDaysMap, setWorkingDaysMap] = useState({}); // { monthIdx: [1,2,...] } for working days (true = working)

  const MONTHS = [
    { name: 'Apr', days: 30 },
    { name: 'May', days: 31 },
    { name: 'Jun', days: 30 },
    { name: 'Jul', days: 31 },
    { name: 'Aug', days: 31 },
    { name: 'Sep', days: 30 },
    { name: 'Oct', days: 31 },
    { name: 'Nov', days: 30 },
    { name: 'Dec', days: 31 },
    { name: 'Jan', days: 31 },
    { name: 'Feb', days: 28 },
    { name: 'Mar', days: 31 },
  ];

  // Load existing settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/students/profile/${GLOBAL_SETTINGS_ID}`);
        const data = await res.json();
        const sd = data?.schoolCalendar || {};
        setStartMonthIdx(sd.startMonthIdx ?? 0);
        setWorkingDaysMap(sd.workingDaysMap ?? {});
      } catch (e) {
        console.warn('Failed to load global school settings', e);
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, []);

  const toggleWorkingDay = (monthIdx, day) => {
    setWorkingDaysMap(prev => {
      const monthDays = prev[monthIdx] ?? [];
      if (monthDays.includes(day)) {
        return { ...prev, [monthIdx]: monthDays.filter(d => d !== day) };
      } else {
        return { ...prev, [monthIdx]: [...monthDays, day] };
      }
    });
  };

  const saveSettings = async () => {
    if (user?.role !== 'superadmin') {
      Alert.alert('Access Denied', 'Only superadmin can modify the school calendar.');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        userId: GLOBAL_SETTINGS_ID,
        schoolCalendar: {
          startMonthIdx,
          workingDaysMap,
        },
      };
      const res = await fetch(`${API_URL}/students/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setSaved(true);
        Alert.alert('Success', 'School calendar saved.');
      } else {
        Alert.alert('Error', 'Could not save calendar.');
      }
    } catch (e) {
      console.warn(e);
      Alert.alert('Error', 'Unexpected error while saving.');
    } finally {
      setLoading(false);
    }
  };

  const renderMonth = (month, idx) => {
    const workingDays = workingDaysMap[idx] ?? [];
    const cells = [];
    for (let d = 1; d <= month.days; d++) {
      const isWorking = workingDays.includes(d);
      cells.push(
        <TouchableOpacity
          key={d}
          style={[styles.dayCell, isWorking ? styles.working : styles.notWorking]}
          onPress={() => toggleWorkingDay(idx, d)}
        >
          <Text style={styles.dayText}>{d}</Text>
        </TouchableOpacity>
      );
    }
    return (
      <View key={month.name} style={styles.monthContainer}>
        <Text style={styles.monthTitle}>{month.name}</Text>
        <View style={styles.daysGrid}>{cells}</View>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <PremiumBackground />
      <SafeAreaView style={styles.safe}> 
        <View style={styles.header}>
          <SoundButton onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>←</Text>
          </SoundButton>
          <Text style={styles.title}>Superadmin: School Calendar</Text>
        </View>
        {loading && <ActivityIndicator size="large" color={theme.primary} />}
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.section}>
            <Text style={styles.label}>Start Month (School Year begins)</Text>
            <View style={styles.pillContainer}>
              {MONTHS.map((m, i) => (
                <TouchableOpacity
                  key={m.name}
                  onPress={() => setStartMonthIdx(i)}
                  style={[styles.monthPill, startMonthIdx === i && { backgroundColor: theme.primary }]}
                >
                  <Text style={[styles.monthPillText, startMonthIdx === i && { color: '#FFF' }]}>{m.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={styles.section}>
            <Text style={styles.label}>Working / Leave Days (Toggle each day)</Text>
            {MONTHS.map((m, i) => renderMonth(m, i))}
          </View>
          <SoundButton onPress={saveSettings} style={styles.saveBtn} disabled={loading}>
            <Text style={styles.saveBtnText}>Save Calendar</Text>
          </SoundButton>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20 },
  backBtn: { padding: 10, marginRight: 10 },
  backText: { color: '#FFF', fontSize: 22 },
  title: { fontSize: 20, color: '#FFF', fontWeight: '800' },
  scroll: { padding: 20 },
  section: { marginBottom: 30 },
  label: { fontSize: 14, color: '#FFF', marginBottom: 8 },
  pillContainer: { flexDirection: 'row', flexWrap: 'wrap' },
  monthPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.1)', marginRight: 8, marginBottom: 8 },
  monthPillText: { color: '#FFF' },
  monthContainer: { marginBottom: 20 },
  monthTitle: { fontSize: 16, color: '#FFF', marginBottom: 6 },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: { width: 30, height: 30, justifyContent: 'center', alignItems: 'center', margin: 2, borderRadius: 4 },
  working: { backgroundColor: '#34d399' },
  notWorking: { backgroundColor: '#f87171' },
  dayText: { color: '#FFF', fontSize: 12 },
  saveBtn: { backgroundColor: '#2563eb', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  saveBtnText: { color: '#FFF', fontWeight: '600' },
});
