import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  SectionList,
  StyleSheet,
  StatusBar,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import Constants from "expo-constants";
import SoundButton from "../components/SoundButton";
import { useTheme, useAuth, API_URL } from "../context/GlobalContext";

export default function TeacherTracking() {
  const router = useRouter();
  const { theme } = useTheme();
  const { setActiveStudentId, setActiveStudentProfile } = useAuth();
  const styles = getStyles(theme);
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

  // Fetch initial list of students
  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/admin/students`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setStudents(data);
    } catch (error) {
      console.warn("Server connection error:", error);
      Alert.alert(
        "Connection Error",
        "Could not connect to the backend server. Make sure 'node server.js' is running."
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

  const renderStudentItem = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Reg. No: {item.registration_number} ({item.class_name})</Text>
      <View style={styles.cardRow}>
        <Text style={styles.cardLabel}>Username:</Text>
        <Text style={styles.cardValue} selectable>{item.username}</Text>
      </View>
      <View style={styles.cardRow}>
        <Text style={styles.cardLabel}>Password:</Text>
        <Text style={styles.cardValue} selectable>{item.password || '******'}</Text>
      </View>

      <SoundButton 
          style={{marginTop: 12, padding: 12, backgroundColor: theme.primary, borderRadius: 8, alignItems: 'center'}}
          onPress={() => {
              setActiveStudentId(item.user_id);
              setActiveStudentProfile({ registration_number: item.registration_number });
              router.push("/part_a1/StudentRegistration");
          }}
      >
          <Text style={{color: theme.buttonText, fontWeight: 'bold'}}>View/Edit Student's Card</Text>
      </SoundButton>

    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} />
      
      {/* Header */}
      <View style={styles.header}>
        <SoundButton onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>{"< Back"}</Text>
        </SoundButton>
        <Text style={styles.headerTitle}>Class Registry</Text>
      </View>

      {/* Input Section */}
      <View style={styles.inputSection}>
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
        <SoundButton
          style={styles.addBtn}
          onPress={handleAddStudent}
          disabled={adding}
        >
          {adding ? (
            <ActivityIndicator color={theme.buttonText} />
          ) : (
            <Text style={styles.addBtnText}>Add Student & Generate Login</Text>
          )}
        </SoundButton>
      </View>

      <View style={styles.divider} />

      {/* List Section */}
      <View style={styles.listSection}>
        <Text style={styles.sectionTitle}>
          Registered Students ({students.length})
        </Text>
        
        {loading ? (
          <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 20 }} />
        ) : (
          <SectionList
            sections={getSections()}
            keyExtractor={(item, index) => item.username + index}
            renderItem={renderStudentItem}
            renderSectionHeader={({ section: { title, teacher } }) => (
              <View style={styles.sectionHeader}>
                <View>
                  <Text style={styles.sectionTitleText}>{title}</Text>
                  <Text style={styles.sectionTeacherText}>Oversight: {teacher}</Text>
                </View>
                <View style={styles.sectionDivider} />
              </View>
            )}
            contentContainerStyle={styles.listContent}
            stickySectionHeadersEnabled={true}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No students registered yet.</Text>
            }
          />
        )}
      </View>
    </View>
  );
}

const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  backBtn: {
    paddingRight: 20,
  },
  backText: {
    color: theme.secondaryText,
    fontSize: 14,
    fontWeight: "bold",
  },
  headerTitle: {
    color: theme.text,
    fontSize: 20,
    fontWeight: "800",
  },
  inputSection: {
    padding: 20,
  },
  sectionTitle: {
    color: theme.text,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  input: {
    backgroundColor: theme.inputBackground,
    borderWidth: 1,
    borderColor: theme.inputBorder,
    borderRadius: 8,
    color: theme.text,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    marginBottom: 12,
  },
  addBtn: {
    backgroundColor: theme.primary,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
  },
  addBtnText: {
    color: theme.buttonText,
    fontSize: 15,
    fontWeight: "bold",
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
  card: {
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
  },
  cardTitle: {
    color: theme.text,
    fontSize: 15,
    fontWeight: "bold",
    marginBottom: 12,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  cardLabel: {
    color: theme.secondaryText,
    width: 80,
    fontSize: 13,
  },
  cardValue: {
    color: theme.accent, // A sleek color to emphasize credentials
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  emptyText: {
    color: theme.secondaryText,
    textAlign: "center",
    marginTop: 40,
    fontSize: 14,
  },
  sectionHeader: {
    backgroundColor: theme.background,
    paddingVertical: 12,
  },
  sectionTitleText: {
    color: theme.primary,
    fontSize: 14,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  sectionTeacherText: {
    color: theme.secondaryText,
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: theme.border,
    marginTop: 12,
  },
});
