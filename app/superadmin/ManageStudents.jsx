import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SectionList, TextInput, TouchableOpacity, Modal, Alert, Animated, ActivityIndicator } from 'react-native';
import { useTheme, useAuth, API_URL } from '../../context/GlobalContext';
import { useRouter } from 'expo-router';
import SoundButton from '../../components/SoundButton';
import { Ionicons } from '@expo/vector-icons';

export default function ManageStudents() {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  
  // Shuffle Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [newGrade, setNewGrade] = useState("");
  const [newSection, setNewSection] = useState("");

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/students`);
      const data = await res.json();
      setStudents(data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleShuffle = async () => {
    if (!newGrade) return Alert.alert("Required", "Please enter new grade");
    
    try {
      const res = await fetch(`${API_URL}/admin/shuffle-student`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: selectedStudent.student_id,
          newClassName: newGrade,
          newSection: newSection
        })
      });
      
      const data = await res.json();
      if (res.ok) {
        Alert.alert("Success", data.message);
        setModalVisible(false);
        fetchStudents();
      } else {
        Alert.alert("Error", data.message);
      }
    } catch (err) {
      Alert.alert("Error", "Migration failed");
    }
  };

  const filteredStudents = students.filter(s => 
    s.username.toLowerCase().includes(search.toLowerCase()) ||
    s.registration_number?.toLowerCase().includes(search.toLowerCase())
  );

  // Grouping Logic: Grade + Section
  const getSections = () => {
    const sectionsObj = {};
    filteredStudents.forEach(student => {
      const sectionKey = `${student.class_name} - ${student.section || 'Unassigned'}`;
      if (!sectionsObj[sectionKey]) {
        sectionsObj[sectionKey] = {
          title: sectionKey,
          teacher: student.teacher_name || 'No Teacher Assigned',
          data: []
        };
      }
      sectionsObj[sectionKey].data.push(student);
    });

    return Object.values(sectionsObj).sort((a, b) => a.title.localeCompare(b.title));
  };

  const { user, setProfile } = useAuth();
  const router = useRouter();

  const handleStudentPress = async (student) => {
    setLoading(true);
    try {
      // Fetch the full profile of the selected student
      const res = await fetch(`${API_URL}/students/profile/${student.user_id}`);
      const data = await res.json();
      
      if (data && data.registration_number) {
        // Update context to impersonate this student's data space
        setProfile(data);
        Alert.alert(
          "Student Selected", 
          `Now managing ${student.username}. Redirecting to Holistic Generator...`,
          [{ text: "Proceed", onPress: () => router.push("/part_a1/StudentRegistration") }]
        );
      } else {
        Alert.alert("Profile Missing", "No profile found for this student. Redirecting to start...");
        setProfile({ user_id: student.user_id, registration_number: student.registration_number, full_name: student.username });
        router.push("/part_a1/StudentRegistration");
      }
    } catch (err) {
      Alert.alert("Sync Error", "Could not synchronize student data.");
    } finally {
      setLoading(false);
    }
  };

  const renderStudent = ({ item, index }) => (
    <TouchableOpacity 
      activeOpacity={0.7} 
      onPress={() => handleStudentPress(item)}
      style={styles.studentCard}
    >
      <View style={styles.cardInfo}>
        <Text style={styles.studentName}>{item.username}</Text>
        <Text style={styles.studentMeta}>Reg: {item.registration_number || 'N/A'}</Text>
        
        <View style={styles.badgeRow}>
          <View style={styles.gradeBadge}>
            <Text style={styles.badgeText}>{item.class_name} {item.section}</Text>
          </View>
          <View style={[styles.gradeBadge, { marginLeft: 8, borderColor: '#f59e0b50' }]}>
            <Text style={[styles.badgeText, { color: '#f59e0b' }]}>🔑 {item.plain_password || '---'}</Text>
          </View>
          {item.teacher_name && (
            <View style={[styles.gradeBadge, { marginLeft: 8, borderColor: theme.accent + '40' }]}>
              <Text style={[styles.badgeText, { color: theme.accent }]}>👨‍🏫 {item.teacher_name}</Text>
            </View>
          )}
        </View>
      </View>
      <View style={styles.actionRow} pointerEvents="box-none">
        <TouchableOpacity 
          style={[styles.shuffleBtn, { marginRight: 8, borderColor: '#ec489950' }]}
          onPress={async () => {
             // Impersonate student and go to Family Tree
             setLoading(true);
             try {
                const res = await fetch(`${API_URL}/students/profile/${item.user_id}`);
                const data = await res.json();
                setProfile(data || { user_id: item.user_id, registration_number: item.registration_number });
                router.push("/part_a1/FamilyTreePage");
             } catch(e) { Alert.alert("Error", "Could not sync family tree."); }
             finally { setLoading(false); }
          }}
        >
          <Ionicons name="people-outline" size={20} color="#ec4899" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.shuffleBtn}
          onPress={() => {
            setSelectedStudent(item);
            setNewGrade(item.class_name);
            setNewSection(item.section);
            setModalVisible(true);
          }}
        >
          <Ionicons name="shuffle" size={20} color={theme.primary} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Manage Students</Text>
          <Text style={styles.subtitle}>Manage all student accounts</Text>
        </View>
        <SoundButton style={styles.masterActionBtn}>
          <Text style={styles.masterActionText}>EXPORT ALL</Text>
        </SoundButton>
      </View>

      <View style={styles.searchBox}>
        <Ionicons name="search" size={20} color={theme.secondaryText} style={{ marginRight: 10 }} />
        <TextInput 
          style={styles.input}
          placeholder="Search by name or reg number..."
          placeholderTextColor={theme.secondaryText}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 20 }} />
      ) : (
        <SectionList
          sections={getSections()}
          keyExtractor={(item, index) => item.user_id + index}
          renderItem={renderStudent}
          renderSectionHeader={({ section: { title, teacher } }) => (
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitleText}>{title}</Text>
                <Text style={styles.sectionTeacherText}>Class Teacher: {teacher}</Text>
              </View>
              <View style={styles.sectionDivider} />
            </View>
          )}
          contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
          stickySectionHeadersEnabled={true}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No students found matching your search.</Text>
          }
        />
      )}

      {/* Shuffle Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Shuffle Student</Text>
            <Text style={styles.modalSub}>{selectedStudent?.username}</Text>
            
            <View style={styles.field}>
              <Text style={styles.label}>NEW GRADE</Text>
              <TextInput 
                style={styles.modalInput}
                value={newGrade}
                onChangeText={setNewGrade}
                placeholder="e.g. 10th Standard"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>NEW SECTION</Text>
              <TextInput 
                style={styles.modalInput}
                value={newSection}
                onChangeText={setNewSection}
                placeholder="e.g. Section A"
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <SoundButton style={styles.saveBtn} onPress={handleShuffle}>
                <Text style={styles.saveText}>Save Changes</Text>
              </SoundButton>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    padding: 24,
    paddingTop: 60,
    backgroundColor: theme.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  masterActionBtn: {
    backgroundColor: theme.accent,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  masterActionText: {
    color: theme.buttonText,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: theme.text,
  },
  subtitle: {
    fontSize: 12,
    color: theme.secondaryText,
    marginTop: 4,
    fontWeight: '600',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.card,
    margin: 24,
    marginBottom: 0,
    paddingHorizontal: 16,
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
  },
  input: {
    flex: 1,
    color: theme.text,
    fontSize: 14,
  },
  studentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.card,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.border,
    marginBottom: 12,
  },
  cardInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.text,
  },
  studentMeta: {
    fontSize: 10,
    color: theme.secondaryText,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  gradeBadge: {
    backgroundColor: theme.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme.border,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: theme.primary,
  },
  actionRow: {
    flexDirection: 'row',
  },
  shuffleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.border,
  },
  emptyText: {
    textAlign: 'center',
    color: theme.secondaryText,
    marginTop: 40,
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.card,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 32,
    paddingBottom: 50,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: theme.text,
    textAlign: 'center',
  },
  modalSub: {
    fontSize: 12,
    color: theme.secondaryText,
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: '600',
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.secondaryText,
    marginBottom: 8,
    letterSpacing: 1,
  },
  modalInput: {
    height: 50,
    backgroundColor: theme.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    color: theme.text,
    borderWidth: 1,
    borderColor: theme.border,
  },
  modalButtons: {
    flexDirection: 'row',
    marginTop: 24,
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelText: {
    color: theme.secondaryText,
    fontWeight: '700',
  },
  saveBtn: {
    flex: 2,
    backgroundColor: theme.primary,
    height: 50,
    borderRadius: 12,
  },
  saveText: {
    color: theme.buttonText,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 50,
  },

  sectionHeader: {
    backgroundColor: theme.background,
    paddingVertical: 12,
    marginTop: 8,
  },
  sectionTitleText: {
    color: theme.primary,
    fontSize: 14,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sectionTeacherText: {
    color: theme.secondaryText,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: theme.border,
    marginTop: 12,
  },
});
