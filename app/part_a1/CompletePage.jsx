import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme, useAuth, API_URL } from "../../context/GlobalContext";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import SoundButton from "../../components/SoundButton";
import PremiumBackground from "../../components/PremiumBackground";

const MONTHS = ["Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec","Jan","Feb","Mar"];

const ACCENT = "#D4AF37"; // Premium Gold
const SILVER = "#C0C0C0"; 

export default function AttendancePage() {
  const { theme } = useTheme();
  const { user, profile, setProfile: setAuthProfile, activeStudentId, activeStudentProfile } = useAuth();
  const isTeacher = user?.role === 'teacher' || user?.role === 'superadmin';
  const targetUserId = (isTeacher && activeStudentId) ? activeStudentId : user?.id;
  const targetProfile = (isTeacher && activeStudentProfile) ? activeStudentProfile : profile;
  const router = useRouter();
  const styles = getStyles(theme);

  // Each month stores { working: "", attended: "" }
  const [rows, setRows] = useState(
    MONTHS.map(() => ({ working: "", attended: "" }))
  );
  const [isLoaded, setIsLoaded] = useState(false);

  const fetchProfile = async () => {
    if (!targetUserId) return;
    
    try {
      const resp = await fetch(`${API_URL}/students/profile/${targetUserId}`);
      const data = await resp.json();
      
      let tableToSet = null;

      // 1. Check assessments
      if (data.assessments) {
        const assess = typeof data.assessments === 'string' ? JSON.parse(data.assessments) : data.assessments;
        if (assess?.attendanceTable && Array.isArray(assess.attendanceTable) && assess.attendanceTable.length === 12) {
          tableToSet = assess.attendanceTable;
        }
      }

      // 2. Check family_details
      if (!tableToSet && data.family_details) {
        const fd = typeof data.family_details === 'string' ? JSON.parse(data.family_details) : data.family_details;
        if (fd?.attendance && Array.isArray(fd.attendance) && fd.attendance.length === 12) {
          tableToSet = fd.attendance;
        }
      }

      if (tableToSet) {
        setRows(tableToSet);
      } else {
        setRows(MONTHS.map(() => ({ working: "", attended: "" })));
      }
    } catch (e) {
      console.warn("Attendance fetch failed", e);
    } finally {
      setIsLoaded(true);
    }
  };

  // Auto-Sync Logic
  useEffect(() => {
    if (targetUserId) {
       fetchProfile();
    }
  }, [targetUserId]);

  // Auto-Save Behavior for Attendance (Teacher Only)
  useEffect(() => {
    if (!isLoaded || rows.length === 0 || !isTeacher) return;
    const timer = setTimeout(() => {
      const saveSilently = async () => {
         try {
          const payload = {
            userId: targetUserId,
            registrationNumber: targetProfile?.registration_number,
            assessments: { 
              ...targetProfile?.assessments,
              attendanceTable: rows 
            }
          };
          await fetch(`${API_URL}/students/profile`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          });
         } catch (e) {}
      };
      saveSilently();
    }, 2000);
    return () => clearTimeout(timer);
  }, [rows]);

  const handleSaveAndNext = async () => {
    if (isTeacher && user?.id) {
       // Save to student profile
       try {
         const familyDetails = { 
           ...profile?.family_details,
           attendance: rows 
         };

         const payload = {
           userId: user.id, // Current student being edited
           registrationNumber: profile?.registration_number,
           familyDetails
         };

         const res = await fetch(`${API_URL}/students/profile`, {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify(payload)
         });

         if (res.ok) {
           setAuthProfile({
             ...targetProfile,
             family_details: familyDetails
           });
         }
       } catch (err) {
         console.warn("Save attendance failed", err);
       }
    }
    router.push("/part_a2/LayoutBuilder");
  };

  const updateRow = (index, field, value) => {
    const updated = [...rows];
    updated[index] = { ...updated[index], [field]: value };
    setRows(updated);
  };

  const getPercent = (row) => {
    const w = parseFloat(row.working);
    const a = parseFloat(row.attended);
    if (!w || w <= 0) return "—";
    const p = ((a / w) * 100).toFixed(1);
    return `${p}%`;
  };

  const getPercentColor = (row) => {
    const w = parseFloat(row.working);
    const a = parseFloat(row.attended);
    if (!w || w <= 0) return theme.secondaryText;
    const p = (a / w) * 100;
    if (p >= 75) return "#00ffcc";
    if (p >= 50) return "#ffb347";
    return theme.error;
  };

  return (
    <View style={{ flex: 1 }}>
      <PremiumBackground />
      <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <SoundButton onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </SoundButton>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={styles.title}>Attendance Register</Text>
        </View>
        <SoundButton 
          style={{ backgroundColor: theme.primary + '30', padding: 8, borderRadius: 10, borderWidth: 1, borderColor: theme.primary }} 
          onPress={handleSaveAndNext}
        >
          <Ionicons name="save-outline" size={22} color={theme.primary} />
        </SoundButton>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          {/* Table Header */}
          <View style={styles.tableRow}>
            <Text style={[styles.th, { flex: 1 }]}>Month</Text>
            <Text style={[styles.th, { flex: 1.4 }]}>Working Days</Text>
            <Text style={[styles.th, { flex: 1.4 }]}>Days Attended</Text>
            <Text style={[styles.th, { flex: 1 }]}>% Att.</Text>
          </View>

          {/* Table Body */}
          {rows.map((row, i) => (
            <View
              key={i}
              style={[styles.tableRow, i % 2 === 0 ? styles.rowEven : styles.rowOdd]}
            >
              <Text style={[styles.td, { flex: 1, fontWeight: "700", color: ACCENT }]}>
                {MONTHS[i]}
              </Text>

              <View style={{ flex: 1.4, alignItems: "center" }}>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={theme.secondaryText}
                  value={row.working}
                  onChangeText={(v) => updateRow(i, "working", v)}
                  maxLength={2}
                  editable={isTeacher}
                />
              </View>

              <View style={{ flex: 1.4, alignItems: "center" }}>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={theme.secondaryText}
                  value={row.attended}
                  onChangeText={(v) => updateRow(i, "attended", v)}
                  maxLength={2}
                  editable={isTeacher}
                />
              </View>

              <Text style={[styles.td, { flex: 1, fontWeight: "800", color: getPercentColor(row) }]}>
                {getPercent(row)}
              </Text>
            </View>
          ))}

          {/* Summary Row */}
          {(() => {
            const totalWorking = rows.reduce((s, r) => s + (parseFloat(r.working) || 0), 0);
            const totalAttended = rows.reduce((s, r) => s + (parseFloat(r.attended) || 0), 0);
            const overall = totalWorking > 0
              ? `${((totalAttended / totalWorking) * 100).toFixed(1)}%`
              : "—";
            const overallColor = totalWorking > 0
              ? ((totalAttended / totalWorking) * 100) >= 75 ? "#00ffcc"
              : ((totalAttended / totalWorking) * 100) >= 50 ? "#ffb347"
              : theme.error
              : theme.secondaryText;

            return (
              <View style={styles.summaryRow}>
                <Text style={[styles.th, { flex: 1 }]}>Total</Text>
                <Text style={[styles.th, { flex: 1.4, color: theme.text }]}>{totalWorking}</Text>
                <Text style={[styles.th, { flex: 1.4, color: theme.text }]}>{totalAttended}</Text>
                <Text style={[styles.th, { flex: 1, color: overallColor }]}>{overall}</Text>
              </View>
            );
          })()}
        </View>

        <SoundButton
          style={[styles.nextSectionBtn, !isTeacher && { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1 }]}
          onPress={handleSaveAndNext}
          activeOpacity={0.8}
        >
          <Text style={[styles.nextSectionBtnText, !isTeacher && { color: theme.secondaryText }]}>
             {isTeacher ? "Save & Go to Part A2 →" : "View Part A2 →"}
          </Text>
        </SoundButton>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
    </View>
  );
}

const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background, // Respect the selected theme
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#222",
  },
  backBtn: {
    padding: 4,
    width: 40,
  },
  backText: {
    color: "#ffb347",
    fontSize: 24,
    fontWeight: "bold",
  },
  title: {
    color: theme.text,
    fontSize: 20,
    fontWeight: "300",
    fontFamily: "Jost_300Light",
    letterSpacing: 4,
    textTransform: "uppercase",
  },
  scrollContent: {
    padding: 16,
  },
  card: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#222",
  },
  rowEven: {
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  rowOdd: {
    backgroundColor: "transparent",
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: "#1a1a1a",
    borderTopWidth: 1,
    borderTopColor: "#333",
  },
  th: {
    color: ACCENT,
    fontWeight: "700",
    fontSize: 12,
    textAlign: "center",
    paddingVertical: 4,
  },
  td: {
    color: "#fff",
    fontSize: 13,
    textAlign: "center",
  },
  input: {
    width: 60,
    paddingVertical: 6,
    paddingHorizontal: 4,
    backgroundColor: "#000",
    color: "#fff",
    borderWidth: 1,
    borderColor: "#555",
    borderRadius: 6,
    textAlign: "center",
    fontSize: 14,
    fontWeight: "600",
  },
  nextSectionBtn: {
    backgroundColor: theme.primary,
    marginHorizontal: 16,
    marginTop: 32,
    paddingVertical: 18,
    borderRadius: 30, // Pill shape
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  nextSectionBtnText: {
    color: theme.buttonText,
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 2,
    fontFamily: "Jost_600SemiBold",
    textTransform: "uppercase",
  },
});
