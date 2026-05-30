import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme, useAuth, API_URL } from "../../context/GlobalContext";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import SoundButton from "../../components/SoundButton";
import GemButton from "../../components/GemButton";
import PremiumBackground from "../../components/PremiumBackground";
import { gems } from "../../colour_themes";
import useAutoSave from "../../hooks/useAutoSave";

const { width } = Dimensions.get('window');

const baseMonths = [
    { name: "Apr", days: 30 },
    { name: "May", days: 31 },
    { name: "Jun", days: 30 },
    { name: "Jul", days: 31 },
    { name: "Aug", days: 31 },
    { name: "Sep", days: 30 },
    { name: "Oct", days: 31 },
    { name: "Nov", days: 30 },
    { name: "Dec", days: 31 },
    { name: "Jan", days: 31 },
    { name: "Feb", days: 28 }, // Simplified, ignore leap year for now
    { name: "Mar", days: 31 }
];

const DAYS_OF_WEEK = ["M", "T", "W", "T", "F", "S", "S"];

export default function CompletePage() {
  const { theme } = useTheme();
  const { user, profile, setProfile: setAuthProfile, activeStudentId, activeStudentProfile, setActiveStudentProfile } = useAuth();
  const isTeacher = user?.role === 'teacher' || user?.role === 'superadmin';
  const targetUserId = (isTeacher && activeStudentId) ? activeStudentId : user?.id;
  const targetProfile = (isTeacher && activeStudentProfile) ? activeStudentProfile : profile;
  const router = useRouter();

  const [schoolCalendar, setSchoolCalendar] = useState({ startMonthIdx: 0, workingDaysMap: {} });
  const [activeMonthIdx, setActiveMonthIdx] = useState(0);
  
  // Compute MONTHS after we have the start index
  const MONTHS = useMemo(() => {
    const start = schoolCalendar.startMonthIdx ?? 0;
    return [...baseMonths.slice(start), ...baseMonths.slice(0, start)];
  }, [schoolCalendar.startMonthIdx]);

  // State maps month index (0-11) to array of absent day numbers (1-31)
  const [absentDaysByMonth, setAbsentDaysByMonth] = useState({});
  const [lowAttendanceReason, setLowAttendanceReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const annualStats = useMemo(() => {
    let totalWorking = 0;
    let totalAbsent = 0;
    
    for (let idx = 0; idx < 12; idx++) {
      const monthInfo = MONTHS[idx];
      if (!monthInfo) continue;
      
      // Calculate working days
      let workingDays = 0;
      const startOffset = (idx * 2) % 7;
      for (let d = 1; d <= monthInfo.days; d++) {
        const col = (startOffset + d - 1) % 7;
        if (col !== 6) workingDays++;
      }
      totalWorking += workingDays;
      
      // Calculate absent days
      const absent = (absentDaysByMonth[idx] || []).length;
      totalAbsent += absent;
    }
    
    const totalPresent = Math.max(0, totalWorking - totalAbsent);
    const percentage = totalWorking > 0 ? Math.round((totalPresent / totalWorking) * 100) : 0;
    
    return {
      working: totalWorking,
      absent: totalAbsent,
      present: totalPresent,
      percentage: percentage
    };
  }, [MONTHS, absentDaysByMonth]);

  useEffect(() => {
    if (targetUserId) {
      fetchAttendance();
      fetchGlobalCalendar();
    }
  }, [targetUserId]);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/students/profile/${targetUserId}`);
      const data = await res.json();
      if (data && data.family_details) {
        const fd = typeof data.family_details === 'string' ? JSON.parse(data.family_details) : data.family_details;
        if (fd.attendanceCal) setAbsentDaysByMonth(fd.attendanceCal);
        if (fd.lowAttendanceReason) setLowAttendanceReason(fd.lowAttendanceReason);
      }
    } catch (err) {
      console.warn("[CompletePage] Fetch failed:", err);
    } finally {
      setLoading(false);
      setIsLoaded(true);
    }
  };

  const fetchGlobalCalendar = async () => {
    try {
      const res = await fetch(`${API_URL}/students/profile/${'global_school_settings'}`);
      const data = await res.json();
      const sd = data?.schoolCalendar || {};
      setSchoolCalendar({ startMonthIdx: sd.startMonthIdx ?? 0, workingDaysMap: sd.workingDaysMap ?? {} });
    } catch (e) {
      console.warn('Failed to load global school settings', e);
    }
  };


  const getMonthStats = (monthIdx) => {
    const monthInfo = MONTHS[monthIdx];
    let workingDays = 0;
    
    // Calculate working days (Total days - Sundays)
    // For simplicity, let's assume month starts on a Wednesday (offset = 2) for rendering, 
    // but Sundays are offset + day % 7 == 6.
    const startOffset = (monthIdx * 2) % 7; // Pseudo random start day for visual variation
    for (let d = 1; d <= monthInfo.days; d++) {
        const col = (startOffset + d - 1) % 7;
        if (col !== 6) workingDays++; // Not Sunday
    }

    const absent = (absentDaysByMonth[monthIdx] || []).length;
    const attended = Math.max(0, workingDays - absent);
    const pct = workingDays > 0 ? Math.round((attended / workingDays) * 100) : 0;
    
    return { working: workingDays, attended, pct };
  };

  const saveAttendance = async () => {
    if (!isTeacher || !targetUserId) return;
    setLoading(true);
    try {
      // Build summary for legacy compatibility
      const attendanceSummary = MONTHS.map((m, idx) => {
        const stats = getMonthStats(idx);
        return { 
          month: m.name, 
          working: stats.working.toString(), 
          attended: stats.attended.toString() 
        };
      });

      const familyDetails = { 
        ...targetProfile?.family_details, 
        attendance: attendanceSummary, 
        attendanceCal: absentDaysByMonth,
        lowAttendanceReason 
      };
      const payload = { userId: targetUserId, registrationNumber: targetProfile?.registration_number, familyDetails };
      const res = await fetch(`${API_URL}/students/profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const updated = { ...targetProfile, family_details: familyDetails };
        if (isTeacher && activeStudentId) setActiveStudentProfile(updated);
        else setAuthProfile(updated);
        Alert.alert("Success", "Attendance records updated.");
      }
    } catch (e) {
      Alert.alert("Error", "Could not save records.");
    } finally {
      setLoading(false);
    }
  };

  const getPayload = useCallback(() => {
    // Build summary for legacy compatibility
    const attendanceSummary = MONTHS.map((m, idx) => {
      const stats = getMonthStats(idx);
      return { 
        month: m.name, 
        working: stats.working.toString(), 
        attended: stats.attended.toString() 
      };
    });

    return {
      userId: targetUserId,
      registrationNumber: targetProfile?.registration_number,
      familyDetails: { 
        ...targetProfile?.family_details, 
        attendance: attendanceSummary, 
        attendanceCal: absentDaysByMonth,
        lowAttendanceReason 
      }
    };
  }, [targetUserId, targetProfile, MONTHS, absentDaysByMonth, lowAttendanceReason]);

  const { triggerSave } = useAutoSave(targetUserId, getPayload, [absentDaysByMonth, lowAttendanceReason]);

  const toggleAbsent = (monthIdx, day) => {
    if (!isTeacher) return;
    setAbsentDaysByMonth(prev => {
        const current = prev[monthIdx] || [];
        if (current.includes(day)) {
            return { ...prev, [monthIdx]: current.filter(d => d !== day) };
        } else {
            return { ...prev, [monthIdx]: [...current, day] };
        }
    });
  };

  const renderCalendar = (monthIdx) => {
      const monthInfo = MONTHS[monthIdx];
      const startOffset = (monthIdx * 2) % 7;
      
      const grid = [];
      let currentWeek = [];
      
      // Empty cells for offset
      for(let i = 0; i < startOffset; i++) {
          currentWeek.push(<View key={`empty-${i}`} style={styles.calCell} />);
      }

      for (let d = 1; d <= monthInfo.days; d++) {
          const col = (startOffset + d - 1) % 7;
          const isSunday = col === 6;
          const isAbsent = (absentDaysByMonth[monthIdx] || []).includes(d);

          currentWeek.push(
              <TouchableOpacity 
                key={`day-${d}`} 
                style={[
                    styles.calCell, 
                    isSunday ? styles.calCellSunday : null,
                    isAbsent ? styles.calCellAbsent : null
                ]}
                disabled={isSunday || !isTeacher}
                onPress={() => toggleAbsent(monthIdx, d)}
              >
                  <Text style={[
                      styles.calDayText,
                      isSunday ? styles.calDayTextSunday : null,
                      isAbsent ? styles.calDayTextAbsent : null,
                      { color: isAbsent ? '#FFF' : theme.text }
                  ]}>
                      {d}
                  </Text>
                  {isAbsent && <View style={styles.absentDot} />}
              </TouchableOpacity>
          );

          if (currentWeek.length === 7) {
              grid.push(<View key={`week-${d}`} style={styles.calRow}>{currentWeek}</View>);
              currentWeek = [];
          }
      }

      if (currentWeek.length > 0) {
          while(currentWeek.length < 7) {
              currentWeek.push(<View key={`empty-end-${currentWeek.length}`} style={styles.calCell} />);
          }
          grid.push(<View key="week-last" style={styles.calRow}>{currentWeek}</View>);
      }

      const stats = getMonthStats(monthIdx);

      return (
          <View style={styles.calendarContainer}>
              <View style={styles.calHeaderRow}>
                  {DAYS_OF_WEEK.map((d, i) => (
                      <View key={i} style={styles.calHeaderCell}>
                          <Text style={[styles.calHeaderText, i===6 && {color: 'rgba(255,0,0,0.5)'}]}>{d}</Text>
                      </View>
                  ))}
              </View>
              {grid}

              <View style={styles.statsContainer}>
                  <View style={styles.statBox}>
                      <Text style={styles.statVal}>{stats.working}</Text>
                      <Text style={styles.statLbl}>WORKING</Text>
                  </View>
                  <View style={[styles.statBox, { borderLeftWidth: 1, borderRightWidth: 1, borderColor: theme.border }]}>
                      <Text style={styles.statVal}>{stats.attended}</Text>
                      <Text style={styles.statLbl}>ATTENDED</Text>
                  </View>
                  <View style={styles.statBox}>
                      <Text style={[styles.statVal, { color: gems.sapphire }]}>{stats.pct}%</Text>
                      <Text style={styles.statLbl}>ATTENDANCE</Text>
                  </View>
              </View>
          </View>
      );
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <PremiumBackground />
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.header}>
          <SoundButton 
            onPress={() => router.back()} 
            style={[
              styles.backBtn, 
              { 
                backgroundColor: theme.isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
                borderColor: theme.isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"
              }
            ]}
          >
            <Ionicons name="chevron-back" size={24} color={theme.text} />
          </SoundButton>
          <View style={styles.headerTitleContainer}>
            <Text style={[styles.title, { color: theme.text }]}>ATTENDANCE</Text>
            <Text style={[styles.subtitle, { color: theme.secondaryText }]}>Monthly Calendar</Text>
          </View>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          
          <View style={styles.monthSelector}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {MONTHS.map((m, idx) => (
                    <TouchableOpacity 
                        key={m.name} 
                        onPress={() => setActiveMonthIdx(idx)}
                        style={[
                            styles.monthPill, 
                            activeMonthIdx === idx ? { backgroundColor: gems.sapphire } : { backgroundColor: 'rgba(245,245,245,0.8)' }
                        ]}
                    >
                        <Text style={[
                            styles.monthPillText,
                            activeMonthIdx === idx ? { color: '#FFF' } : { color: theme.text }
                        ]}>{m.name}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
          </View>

          {/* Overall Annual Attendance Summary Bar */}
          <View style={[styles.annualSummaryCard, { backgroundColor: theme.card, borderColor: gems.sapphire }]}>
            <Text style={[styles.annualTitle, { color: theme.text }]}>ANNUAL SUMMARY</Text>
            <View style={styles.annualStatsRow}>
              <View style={styles.annualStatBox}>
                <Text style={[styles.annualStatVal, { color: gems.sapphire }]}>{annualStats.percentage}%</Text>
                <Text style={styles.annualStatLbl}>PERCENTAGE</Text>
              </View>
              <View style={[styles.annualStatBox, { borderLeftWidth: 1, borderRightWidth: 1, borderColor: theme.border }]}>
                <Text style={styles.annualStatVal}>{annualStats.working}</Text>
                <Text style={styles.annualStatLbl}>WORKING DAYS</Text>
              </View>
              <View style={[styles.annualStatBox, { borderRightWidth: 1, borderColor: theme.border }]}>
                <Text style={[styles.annualStatVal, { color: '#ef4444' }]}>{annualStats.absent}</Text>
                <Text style={styles.annualStatLbl}>ABSENT DAYS</Text>
              </View>
              <View style={styles.annualStatBox}>
                <Text style={[styles.annualStatVal, { color: '#22c55e' }]}>{annualStats.present}</Text>
                <Text style={styles.annualStatLbl}>PRESENT DAYS</Text>
              </View>
            </View>
          </View>

          <View style={[styles.card, { borderColor: gems.sapphire }]}>
            <View style={styles.inlaidHeader}>
              <View style={[styles.inlaidIconBox, { borderColor: gems.sapphire }]}>
                <Ionicons name="calendar-outline" size={18} color={gems.sapphire} />
              </View>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>{MONTHS[activeMonthIdx].name.toUpperCase()} CALENDAR</Text>
            </View>
            <View style={[styles.sectionDivider, { backgroundColor: theme.border }]} />
            
            {renderCalendar(activeMonthIdx)}
            
            <Text style={styles.helperText}>* Tap on a day to mark as absent. Sundays are disabled.</Text>
          </View>

          <View style={[styles.card, { borderColor: theme.border }]}>
            <View style={styles.inlaidHeader}>
              <View style={[styles.inlaidIconBox, { borderColor: theme.border }]}>
                <Ionicons name="alert-circle-outline" size={18} color={gems.sapphire} />
              </View>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>REASONS</Text>
            </View>
            <View style={[styles.sectionDivider, { backgroundColor: theme.border }]} />
            
            <Text style={styles.label}>If attendance is low then reasons there of</Text>
            <TextInput
              style={[styles.reasonInput, { color: theme.text, borderColor: theme.border }]}
              placeholder="Enter reason here..."
              placeholderTextColor={theme.secondaryText + '80'}
              value={lowAttendanceReason}
              onChangeText={setLowAttendanceReason}
              multiline
              editable={isTeacher}
            />
          </View>

          <View style={styles.buttonCol}>
            <GemButton
              onPress={async () => {
                if (isTeacher) {
                  await triggerSave();
                }
                const cls = (targetProfile?.class_name || '').toLowerCase().trim();
                let route = '/part_a2_s34/LayoutBuilder'; // fallback
                if (cls.includes('bal vatika') || cls === 'kg' || cls === 'kindergarten' || cls === 'grade 1' || cls === 'grade 2') {
                  route = '/part_a2_s1/AboutMe';
                } else if (cls === 'grade 3' || cls === 'grade 4' || cls === 'grade 5') {
                  route = '/part_a2_s2/AboutMe';
                }
                console.log("[CompletePage] Routing student", targetProfile?.full_name, "with class:", cls, "to:", route);
                router.push(route);
              }}
              gemType="sapphire"
            >
              <Text style={styles.btnText}>{"PROCEED TO\nPART A2\n➔"}</Text>
            </GemButton>
          </View>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 15 },
  backBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.05)", justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  saveHeaderBtn: { width: 44, height: 44, borderRadius: 12, justifyContent: "center", alignItems: "center", borderWidth: 1, backgroundColor: 'rgba(255,255,255,0.05)' },
  headerTitleContainer: { flex: 1, alignItems: "center" },
  title: { fontSize: 18, fontWeight: "300", color: "#FFFFFF", letterSpacing: 4, fontFamily: "Jost_300Light" },
  subtitle: { fontSize: 9, color: "rgba(255,255,255,0.5)", letterSpacing: 1, marginTop: 2, textTransform: "uppercase", fontFamily: "Jost_400Regular" },
  
  monthSelector: { paddingHorizontal: 20, marginBottom: 20 },
  monthPill: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, marginRight: 10, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  monthPillText: { fontSize: 12, fontWeight: '700', fontFamily: 'Jost_600SemiBold', letterSpacing: 1 },

  scrollContent: { padding: 20, paddingBottom: 60, paddingTop: 0 },
  card: { backgroundColor: "rgba(245, 245, 245, 0.85)", borderRadius: 24, padding: 20, marginBottom: 20, borderWidth: 1.5 },
  inlaidHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  inlaidIconBox: { width: 36, height: 36, borderRadius: 10, borderWidth: 1, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  sectionTitle: { fontSize: 13, fontWeight: '700', letterSpacing: 1, fontFamily: 'Jost_600SemiBold' },
  sectionDivider: { height: 1, marginBottom: 20, borderRadius: 1 },

  calendarContainer: { width: '100%' },
  calHeaderRow: { flexDirection: 'row', marginBottom: 10 },
  calHeaderCell: { flex: 1, alignItems: 'center' },
  calHeaderText: { fontSize: 11, fontWeight: '700', color: '#666', fontFamily: 'Jost_600SemiBold' },
  calRow: { flexDirection: 'row', marginBottom: 10 },
  calCell: { flex: 1, height: 40, justifyContent: 'center', alignItems: 'center', borderRadius: 8 },
  calCellSunday: { backgroundColor: 'rgba(0,0,0,0.03)', opacity: 0.5 },
  calCellAbsent: { backgroundColor: '#ef4444' },
  calCellNotWorking: { backgroundColor: '#9ca3af', opacity: 0.5 },
  calDayText: { fontSize: 14, fontFamily: 'Jost_400Regular' },
  calDayTextSunday: { color: 'rgba(0,0,0,0.3)' },
  calDayTextAbsent: { fontWeight: '700' },
  absentDot: { position: 'absolute', bottom: 4, width: 4, height: 4, borderRadius: 2, backgroundColor: '#FFF' },

  statsContainer: { flexDirection: 'row', marginTop: 20, borderTopWidth: 1, paddingTop: 20, borderColor: 'rgba(0,0,0,0.1)' },
  statBox: { flex: 1, alignItems: 'center' },
  statVal: { fontSize: 18, fontWeight: '700', fontFamily: 'Jost_600SemiBold', marginBottom: 4 },
  statLbl: { fontSize: 9, color: '#666', letterSpacing: 1, fontFamily: 'Jost_300Light' },

  helperText: { fontSize: 10, color: '#888', marginTop: 15, fontStyle: 'italic', textAlign: 'center' },

  label: { fontSize: 10, color: '#666', fontWeight: '700', marginBottom: 8, letterSpacing: 1, textTransform: 'uppercase' },
  reasonInput: { backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 12, padding: 15, minHeight: 80, textAlignVertical: 'top', fontSize: 14, fontFamily: 'Jost_400Regular', marginTop: 10, borderWidth: 1 },

  saveBtnText: { color: '#FFF', fontSize: 14, fontWeight: '700', letterSpacing: 2, fontFamily: 'Jost_600SemiBold', paddingVertical: 18 },

  buttonCol: {
    flexDirection: 'column',
    gap: 12,
    marginTop: 20,
    alignItems: 'center',
    width: '100%',
  },
  btnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
    fontFamily: 'Jost_600SemiBold',
    textAlign: 'center',
  },
  annualSummaryCard: {
    backgroundColor: "rgba(245, 245, 245, 0.9)",
    borderRadius: 18,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1.5,
  },
  annualTitle: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    textAlign: 'center',
    marginBottom: 12,
    fontFamily: 'Jost_600SemiBold',
  },
  annualStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  annualStatBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  annualStatVal: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Jost_600SemiBold',
    marginBottom: 2,
  },
  annualStatLbl: {
    fontSize: 8,
    color: '#666',
    letterSpacing: 0.5,
    textAlign: 'center',
    fontFamily: 'Jost_300Light',
  },
});
