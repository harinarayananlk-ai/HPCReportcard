import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme, useAuth, API_URL } from '../../context/GlobalContext';
import PremiumBackground from '../../components/PremiumBackground';
import SoundButton from '../../components/SoundButton';
import GemCutCard from '../../components/GemCutCard';

// Fixed ID for global school settings
const GLOBAL_SETTINGS_ID = 'global_school_settings';

export default function SuperadminCalendar() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const styles = getStyles(theme);

  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  
  // Start Date States
  const [startDay, setStartDay] = useState("1");
  const [startMonth, setStartMonth] = useState("4"); // April (4) by default
  const [startYear, setStartYear] = useState("2026");
  
  const [workingDaysMap, setWorkingDaysMap] = useState({}); // Stores list of toggled/inverted days per month

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
        setWorkingDaysMap(sd.workingDaysMap ?? {});
        
        if (sd.startDate && typeof sd.startDate === 'string') {
          const parts = sd.startDate.split('-');
          if (parts.length === 3) {
            setStartYear(parts[0]);
            setStartMonth(parseInt(parts[1]).toString());
            setStartDay(parseInt(parts[2]).toString());
          }
        } else {
          setStartDay("1");
          setStartMonth("4");
          setStartYear("2026");
        }
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

  const getRealDate = (monthIdx, day) => {
    const yearNum = parseInt(startYear) || 2026;
    const year = monthIdx < 9 ? yearNum : yearNum + 1;
    const month = (monthIdx + 3) % 12; // JS month
    return new Date(year, month, day);
  };

  const isDaySunday = (monthIdx, day) => {
    return getRealDate(monthIdx, day).getDay() === 0;
  };

  const saveSettings = async () => {
    if (user?.role !== 'superadmin') {
      Alert.alert('Access Denied', 'Only superadmin can modify the school calendar.');
      return;
    }

    const d = parseInt(startDay);
    const m = parseInt(startMonth);
    const y = parseInt(startYear);
    if (isNaN(d) || d < 1 || d > 31 || isNaN(m) || m < 1 || m > 12 || isNaN(y) || y < 2000) {
      Alert.alert("Invalid Date", "Please enter a valid start date.");
      return;
    }
    
    const dateObj = new Date(y, m - 1, d);
    if (dateObj.getDate() !== d || dateObj.getMonth() !== m - 1 || dateObj.getFullYear() !== y) {
      Alert.alert("Invalid Date", "Please enter a correct calendar date.");
      return;
    }

    const calculatedStartMonthIdx = (m - 1 - 3 + 12) % 12; // Relative to April

    setLoading(true);
    try {
      const payload = {
        userId: GLOBAL_SETTINGS_ID,
        schoolCalendar: {
          startDate: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
          startMonthIdx: calculatedStartMonthIdx,
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
    const toggledDays = workingDaysMap[idx] ?? [];
    
    const firstDay = getRealDate(idx, 1);
    const startOffset = (firstDay.getDay() + 6) % 7; // Monday = 0, Sunday = 6
    
    const grid = [];
    let currentWeek = [];
    
    // Pushing empty cells for offset
    for (let i = 0; i < startOffset; i++) {
      currentWeek.push(<View key={`empty-${i}`} style={styles.emptyCell} />);
    }
    
    for (let d = 1; d <= month.days; d++) {
      const isSunday = isDaySunday(idx, d);
      const isToggled = toggledDays.includes(d);
      const isWorking = isSunday ? isToggled : !isToggled;
      
      currentWeek.push(
        <TouchableOpacity
          key={`day-${d}`}
          style={[styles.dayCell, isWorking ? styles.working : styles.notWorking]}
          onPress={() => toggleWorkingDay(idx, d)}
        >
          <Text style={styles.dayText}>{d}</Text>
        </TouchableOpacity>
      );
      
      if (currentWeek.length === 7) {
        grid.push(<View key={`week-${d}`} style={styles.calRow}>{currentWeek}</View>);
        currentWeek = [];
      }
    }
    
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(<View key={`empty-end-${currentWeek.length}`} style={styles.emptyCell} />);
      }
      grid.push(<View key="week-last" style={styles.calRow}>{currentWeek}</View>);
    }
    
    const DAYS = ["M", "T", "W", "T", "F", "S", "S"];
    
    return (
      <View key={month.name} style={styles.monthContainer}>
        <Text style={styles.monthTitle}>{month.name}</Text>
        <View style={styles.weekdayHeader}>
          {DAYS.map((d, i) => (
            <Text key={i} style={[styles.weekdayText, i === 6 && { color: '#f87171' }]}>{d}</Text>
          ))}
        </View>
        <View style={styles.daysGrid}>{grid}</View>
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
          
          <GemCutCard style={styles.section} contentStyle={{ padding: 16 }}>
            <Text style={styles.label}>Precise School Year Start Date</Text>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 9, color: theme.secondaryText, marginBottom: 4 }}>DAY (DD)</Text>
                <TextInput
                  style={styles.dateInput}
                  keyboardType="number-pad"
                  value={startDay}
                  onChangeText={setStartDay}
                  placeholder="e.g. 1"
                />
              </View>
              <View style={{ flex: 1.5 }}>
                <Text style={{ fontSize: 9, color: theme.secondaryText, marginBottom: 4 }}>MONTH (MM)</Text>
                <TextInput
                  style={styles.dateInput}
                  keyboardType="number-pad"
                  value={startMonth}
                  onChangeText={setStartMonth}
                  placeholder="e.g. 4"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 9, color: theme.secondaryText, marginBottom: 4 }}>YEAR (YYYY)</Text>
                <TextInput
                  style={styles.dateInput}
                  keyboardType="number-pad"
                  value={startYear}
                  onChangeText={setStartYear}
                  placeholder="e.g. 2026"
                />
              </View>
            </View>
          </GemCutCard>

          <GemCutCard style={styles.section} contentStyle={{ padding: 16 }}>
            <Text style={styles.label}>Working / Leave Days (Toggle to set leaves)</Text>
            <Text style={{ fontSize: 10, color: theme.secondaryText, marginBottom: 12 }}>
              Note: Sundays are leave (red) and all other days are working (green) by default. Toggle any day to flip its working status.
            </Text>
            {MONTHS.map((m, i) => renderMonth(m, i))}
          </GemCutCard>
          
          <SoundButton onPress={saveSettings} style={styles.saveBtn} disabled={loading}>
            <Text style={styles.saveBtnText}>Save Calendar</Text>
          </SoundButton>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const getStyles = (theme) => StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20 },
  backBtn: { padding: 10, marginRight: 10 },
  backText: { color: theme.text, fontSize: 22 },
  title: { fontSize: 18, color: theme.text, fontWeight: '800' },
  scroll: { padding: 20 },
  section: { marginBottom: 30 },
  label: { fontSize: 13, color: theme.text, fontWeight: '700', marginBottom: 4, letterSpacing: 0.5 },
  monthContainer: { marginBottom: 20 },
  monthTitle: { fontSize: 15, color: theme.text, fontWeight: '700', marginBottom: 8 },
  daysGrid: { flexDirection: 'column' },
  calRow: { flexDirection: 'row', justifyContent: 'flex-start', marginHorizontal: -2 },
  weekdayHeader: { flexDirection: 'row', justifyContent: 'flex-start', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)', paddingBottom: 6, marginBottom: 6, marginHorizontal: -2 },
  weekdayText: { width: 30, textAlign: 'center', color: theme.secondaryText, fontSize: 10, fontWeight: '700', margin: 2 },
  emptyCell: { width: 30, height: 30, margin: 2 },
  dayCell: { width: 30, height: 30, justifyContent: 'center', alignItems: 'center', margin: 2, borderRadius: 4 },
  working: { backgroundColor: '#34d399' },
  notWorking: { backgroundColor: '#f87171' },
  dayText: { color: '#FFF', fontSize: 12, fontWeight: '700' },
  saveBtn: { backgroundColor: '#2563eb', paddingVertical: 14, borderRadius: 8, alignItems: 'center', marginBottom: 40 },
  saveBtnText: { color: '#FFF', fontWeight: '700', letterSpacing: 1 },
  dateInput: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    padding: 10,
    color: theme.text,
    textAlign: 'center',
    fontSize: 14,
    fontFamily: 'Outfit_600SemiBold',
  }
});
