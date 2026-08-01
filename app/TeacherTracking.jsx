import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  StatusBar,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import SoundButton from "../components/SoundButton";
import GemButton from "../components/GemButton";
import PremiumBackground from "../components/PremiumBackground";
import { useTheme, useAuth, API_URL } from "../context/GlobalContext";
import { gems } from "../colour_themes";
import GemCutCard from "../components/GemCutCard";
import { getAfterRegistrationRoute } from "../utils/stageRouter";

export default function TeacherTracking() {
  const router = useRouter();
  const { theme } = useTheme();
  const { user, setActiveStudentId, setActiveStudentProfile, logout } = useAuth();
  const accentColor = gems.sapphire;
  const styles = getStyles(theme, accentColor);
  const [students, setStudents] = useState([]);
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [className, setClassName] = useState("");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  // Grouping Logic: Grade + Section
  const getSections = () => {
    const sectionsObj = {};
    students.forEach(student => {
      const sectionKey = `${student.class_name} - ${student.section || 'Unassigned'}`;
      if (!sectionsObj[sectionKey]) {
        sectionsObj[sectionKey] = {
          title: sectionKey,
          teacher: student.teacher_name || 'Registry Access',
          data: []
        };
      }
      sectionsObj[sectionKey].data.push(student);
    });

    return Object.values(sectionsObj).sort((a, b) => a.title.localeCompare(b.title));
  };

  const [expandedSections, setExpandedSections] = useState({});
  const [expandedStudents, setExpandedStudents] = useState({});

  const toggleSection = (sectionTitle) => {
    setExpandedSections(prev => ({ ...prev, [sectionTitle]: !prev[sectionTitle] }));
  };

  const toggleStudent = (studentId) => {
    setExpandedStudents(prev => ({ ...prev, [studentId]: !prev[studentId] }));
  };

  // Fetch initial list of students — filtered by role
  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      // Teachers see only their class; superadmins see all
      const endpoint = user?.role === 'teacher'
        ? `${API_URL}/teacher/students/${user.id}`
        : `${API_URL}/admin/students`;
      const res = await fetch(endpoint);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setStudents(data);
    } catch (error) {
      console.warn("Server connection error:", error);
      Alert.alert(
        "Connection Error",
        "Could not connect to the backend server. Make sure the backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAddStudent = async () => {
    if (!registrationNumber.trim() || !className.trim()) {
      Alert.alert("Invalid Input", "Please enter both a Registration Number and a Class Name.");
      return;
    }

    setAdding(true);
    try {
      const res = await fetch(`${API_URL}/admin/create-student`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          username: registrationNumber.trim(), // Use registration number as username for simplicity in this view
          password: 'pass123',
          registrationNumber: registrationNumber.trim(),
          className: className.trim(),
          section: 'A',
          school: 'Samosa High International'
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        Alert.alert("Error", data.error || "Failed to add student");
      } else {
        Alert.alert("Success", `Student added!\nUsername: ${data.username}\nPassword: ${data.password}`);
        setRegistrationNumber("");
        fetchStudents(); // Refresh the list
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Could not connect to server to add student.");
    } finally {
      setAdding(false);
    }
  };

  return (
    <View style={styles.container}>
      <PremiumBackground gemColor={accentColor} />
      <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} />
      
      {/* Header */}
      <View style={styles.header}>
        <SoundButton 
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.push('/Teacher');
            }
          }} 
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={16} color={theme.text} />
          <Text style={styles.backText}>Back</Text>
        </SoundButton>
        <Text style={styles.headerTitle}>Class Registry</Text>
        <SoundButton
          onPress={() => {
            logout();
            router.replace('/');
          }}
          style={{
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 20,
            backgroundColor: 'rgba(239, 68, 68, 0.12)',
            borderWidth: 1,
            borderColor: 'rgba(239, 68, 68, 0.3)',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <Ionicons name="log-out-outline" size={14} color="#ef4444" />
          <Text style={{ fontSize: 11, fontWeight: '700', color: '#ef4444', fontFamily: 'Outfit_600SemiBold' }}>
            LOGOUT
          </Text>
        </SoundButton>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
        {/* Input Section */}
        <GemCutCard borderColor={accentColor + '60'} style={{ margin: 20 }} contentStyle={{ padding: 20 }}>
          <Text style={styles.sectionTitle}>Add New Student</Text>
          <TextInput
            style={styles.input}
            placeholder="Class Name (e.g., Grade 10-A)"
            placeholderTextColor={theme.secondaryText}
            value={className}
            onChangeText={setClassName}
          />
          <TextInput
            style={styles.input}
            placeholder="Registration Number (e.g., REG101)"
            placeholderTextColor={theme.secondaryText}
            value={registrationNumber}
            onChangeText={setRegistrationNumber}
          />
          <GemButton
            gemType="silver"
            onPress={handleAddStudent}
            disabled={adding}
          >
            {adding ? (
              <ActivityIndicator color={theme.buttonText} />
            ) : (
              <Text style={styles.addBtnText}>ADD STUDENT</Text>
            )}
          </GemButton>
        </GemCutCard>

        <View style={styles.divider} />

        {/* List Section */}
        <View style={styles.listSection}>
          <Text style={styles.sectionTitle}>
            Registered Students ({students.length})
          </Text>
          
          {loading ? (
            <ActivityIndicator size="large" color={accentColor} style={{ marginTop: 20 }} />
          ) : (
            getSections().map((section) => (
              <View key={section.title} style={styles.sectionWrapper}>
                <SoundButton 
                  onPress={() => toggleSection(section.title)}
                  style={[styles.sectionHeaderAccordion, { backgroundColor: theme.surface }]}
                >
                  <View style={styles.sectionHeaderInfo}>
                    <Text style={styles.sectionTitleText}>{section.title}</Text>
                    <Text style={styles.studentCount}>({section.data.length} Students)</Text>
                  </View>
                  <Text style={[styles.chevronIcon, { color: accentColor }]}>
                    {expandedSections[section.title] ? "▲" : "▼"}
                  </Text>
                </SoundButton>

                {expandedSections[section.title] && (
                  <View style={styles.studentList}>
                    {section.data.map((student) => (
                      <View key={student.user_id} style={styles.studentItemWrapper}>
                        <SoundButton 
                          onPress={() => toggleStudent(student.user_id)}
                          style={[styles.studentRow, { backgroundColor: theme.card }]}
                        >
                          <Text style={styles.studentNameText}>{student.full_name || student.username}</Text>
                          <Text style={styles.studentIdLabel}>UID: {student.registration_number}</Text>
                        </SoundButton>

                        {expandedStudents[student.user_id] && (
                          <GemCutCard
                            borderColor={theme.border}
                            style={{ marginTop: 4 }}
                            contentStyle={{ padding: 16 }}
                          >
                            <View style={styles.detailRow}>
                              <Text style={styles.detailLabel}>USERNAME:</Text>
                              <Text style={[styles.detailValue, { color: accentColor }]} selectable>{student.username}</Text>
                            </View>
                            <View style={styles.detailRow}>
                              <Text style={styles.detailLabel}>PASSWORD:</Text>
                              <Text style={[styles.detailValue, { color: accentColor }]} selectable>{student.plain_password || 'pass123'}</Text>
                            </View>

                            <View style={{ marginTop: 16, gap: 10, alignItems: 'center' }}>
                              <GemButton 
                                gemType="sapphire"
                                width={240}
                                onPress={async () => {
                                    setActiveStudentId(student.user_id);
                                    // Fetch full profile before navigating
                                    try {
                                      const res = await fetch(`${API_URL}/students/profile/${student.user_id}`);
                                      const data = await res.json();
                                      setActiveStudentProfile(data || { registration_number: student.registration_number });
                                    } catch (e) {
                                      setActiveStudentProfile({ registration_number: student.registration_number });
                                    }
                                    router.push("/part_a1/StudentRegistration");
                                }}
                              >
                                <Text style={{color: theme.buttonText, fontWeight: '700', fontSize: 10, letterSpacing: 1.2, textAlign: 'center'}}>GENERATE HPC REPORT CARD</Text>
                              </GemButton>

                              <GemButton 
                                gemType="sapphire"
                                width={240}
                                onPress={() => {
                                  Alert.alert("Normal Report Card", "This feature is currently under development and will be worked on later.");
                                }}
                              >
                                <Text style={{color: theme.buttonText, fontWeight: '700', fontSize: 10, letterSpacing: 1.2, textAlign: 'center'}}>GENERATE NORMAL REPORT CARD</Text>
                              </GemButton>
                            </View>
                          </GemCutCard>
                        )}
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))
          )}
          {students.length === 0 && !loading && (
            <Text style={styles.emptyText}>No students registered yet.</Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const getStyles = (theme, accentColor) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: Platform.OS === 'ios' ? 54 : 40,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    zIndex: 999,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: theme.surface + '80',
    borderWidth: 1,
    borderColor: theme.border,
  },
  backText: {
    color: theme.text,
    fontSize: 12,
    fontWeight: "600",
    fontFamily: "Outfit_600SemiBold",
  },
  headerTitle: {
    color: theme.text,
    fontSize: 18,
    fontWeight: "600",
    fontFamily: "Outfit_600SemiBold",
  },
  inputSection: {
    padding: 20,
  },
  sectionTitle: {
    color: theme.text,
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
    fontFamily: "Outfit_600SemiBold",
  },
  input: {
    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.6)',
    borderBottomWidth: 1.5,
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    borderColor: accentColor,
    color: theme.text,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    marginBottom: 20,
    fontFamily: "Inter_400Regular",
    borderRadius: 8,
  },
  addBtn: {
    backgroundColor: theme.primary,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
  },
  addBtnText: {
    color: theme.buttonText,
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 2,
    fontFamily: "Outfit_600SemiBold",
  },
  divider: {
    height: 1,
    backgroundColor: theme.border,
    marginHorizontal: 20,
  },
  listSection: {
    flex: 1,
    padding: 20,
  },
  listContent: {
    paddingBottom: 40,
  },
  sectionWrapper: {
    marginBottom: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  sectionHeaderAccordion: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  sectionHeaderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  studentCount: {
    fontSize: 10,
    color: theme.secondaryText,
    fontFamily: 'Inter_400Regular',
  },
  chevronIcon: {
    fontSize: 10,
  },
  studentList: {
    paddingLeft: 12,
    paddingRight: 12,
    paddingTop: 8,
    paddingBottom: 8,
  },
  studentItemWrapper: {
    marginBottom: 4,
  },
  studentRow: {
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  studentNameText: {
    fontSize: 14,
    color: theme.text,
    fontFamily: 'Inter_400Regular',
  },
  studentIdLabel: {
    fontSize: 10,
    color: theme.secondaryText,
    fontFamily: 'Inter_400Regular',
  },
  studentDetailCard: {
    marginTop: 4,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: theme.border,
    backgroundColor: theme.isDark ? "rgba(30, 30, 30, 0.55)" : "rgba(255, 255, 255, 0.45)", // Frosted glass translucency
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 10,
    color: theme.secondaryText,
    letterSpacing: 1,
    fontFamily: 'Outfit_600SemiBold',
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'Outfit_600SemiBold',
  },
  plainButton: {
    backgroundColor: accentColor + '15', // Sleek tinted background
    borderColor: accentColor + '40',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    width: 150, // Matches the size of the View/Edit Card button
    alignSelf: 'center',
  },
  plainButtonText: {
    color: accentColor,
    fontWeight: '700',
    fontSize: 11,
    letterSpacing: 1.5,
    fontFamily: 'Outfit_600SemiBold',
  },
});
