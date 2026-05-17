import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SectionList, TextInput, TouchableOpacity, Modal, Alert, Animated, ActivityIndicator, StatusBar } from 'react-native';
import { useTheme, useAuth, API_URL } from '../../context/GlobalContext';
import { useRouter } from 'expo-router';
import SoundButton from '../../components/SoundButton';
import PremiumBackground from '../../components/PremiumBackground';
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

  const { setProfile } = useAuth();
  const router = useRouter();

  const handleStudentPress = async (student) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/students/profile/${student.user_id}`);
      const data = await res.json();
      
      if (data && data.registration_number) {
        setProfile(data);
        Alert.alert(
          "ACCESS_GRANTED", 
          `Synchronizing with ${student.username}. Redirecting to generator...`,
          [{ text: "PROCEED", onPress: () => router.push("/part_a1/StudentRegistration") }]
        );
      } else {
        Alert.alert("UPLINK_PENDING", "No profile found. Initializing new data segment...");
        setProfile({ user_id: student.user_id, registration_number: student.registration_number, full_name: student.username });
        router.push("/part_a1/StudentRegistration");
      }
    } catch (err) {
      Alert.alert("SYNC_FAILURE", "Could not establish secure data uplink.");
    } finally {
      setLoading(false);
    }
  };

  const renderStudent = ({ item }) => (
    <TouchableOpacity 
      activeOpacity={0.8} 
      onPress={() => handleStudentPress(item)}
      style={[styles.studentCard, { backgroundColor: theme.surface + '60' }]}
    >
      <View style={styles.cardInfo}>
        <Text style={styles.studentName}>{item.username}</Text>
        <Text style={styles.studentMeta}>UID: {item.registration_number || 'NULL_PTR'}</Text>
        
        <View style={styles.badgeRow}>
          <View style={[styles.gradeBadge, { backgroundColor: theme.accent + '10', borderColor: theme.accent + '30' }]}>
            <Text style={[styles.badgeText, { color: theme.accent }]}>{item.class_name} {item.section}</Text>
          </View>
          <View style={[styles.gradeBadge, { backgroundColor: '#B8860B15', borderColor: '#B8860B30' }]}>
            <Text style={[styles.badgeText, { color: '#B8860B' }]}>PASS: {item.plain_password || '---'}</Text>
          </View>
        </View>
      </View>
      <View style={styles.actionRow} pointerEvents="box-none">
        <SoundButton 
          style={[styles.shuffleBtn, { borderColor: '#ec489930', backgroundColor: '#ec489910' }]}
          onPress={async () => {
             setLoading(true);
             try {
                const res = await fetch(`${API_URL}/students/profile/${item.user_id}`);
                const data = await res.json();
                setProfile(data || { user_id: item.user_id, registration_number: item.registration_number });
                router.push("/part_a1/ParentRegistration");
             } catch(e) { Alert.alert("Error", "Tree Sync Failed."); }
             finally { setLoading(false); }
          }}
        >
          <Ionicons name="people-outline" size={18} color="#ec4899" />
        </SoundButton>
        <SoundButton 
          style={[styles.shuffleBtn, { borderColor: theme.primary + '30', backgroundColor: theme.primary + '10', marginLeft: 8 }]}
          onPress={() => {
            setSelectedStudent(item);
            setNewGrade(item.class_name);
            setNewSection(item.section);
            setModalVisible(true);
          }}
        >
          <Ionicons name="shuffle" size={18} color={theme.primary} />
        </SoundButton>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <PremiumBackground />
      <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} />
      
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>IDENTITY_HALL</Text>
          <Text style={styles.subtitle}>Global override of all accounts</Text>
        </View>
        <SoundButton style={styles.masterActionBtn}>
          <Text style={styles.masterActionText}>EXTRACT_CSV</Text>
        </SoundButton>
      </View>

      <View style={[styles.searchBox, { backgroundColor: theme.surface + '60' }]}>
        <Ionicons name="search" size={18} color={theme.secondaryText} style={{ marginRight: 12, opacity: 0.6 }} />
        <TextInput 
          style={styles.input}
          placeholder="SEARCH_BY_NODE..."
          placeholderTextColor={theme.secondaryText + '80'}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={theme.accent} />
        </View>
      ) : (
        <SectionList
          sections={getSections()}
          keyExtractor={(item, index) => item.user_id + index}
          renderItem={renderStudent}
          renderSectionHeader={({ section: { title, teacher } }) => (
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Text style={styles.sectionTitleText}>{title}</Text>
                <View style={[styles.tag, { backgroundColor: theme.accent + '20' }]}>
                  <Text style={[styles.tagText, { color: theme.accent }]}>{teacher}</Text>
                </View>
              </View>
            </View>
          )}
          contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
          stickySectionHeadersEnabled={false}
          ListEmptyComponent={
            <Text style={styles.emptyText}>NO_DATA_MATCHING_QUERY</Text>
          }
        />
      )}

      {/* Shuffle Modal */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <Text style={styles.modalTitle}>NODE_MIGRATION</Text>
            <Text style={styles.modalSub}>{selectedStudent?.username}</Text>
            
            <View style={styles.field}>
              <Text style={styles.label}>TARGET_GRADE</Text>
              <TextInput 
                style={[styles.modalInput, { backgroundColor: theme.surface + '80', borderColor: theme.border + '50' }]}
                value={newGrade}
                onChangeText={setNewGrade}
                placeholder="e.g. 10th"
                placeholderTextColor={theme.secondaryText + '50'}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>TARGET_SECTION</Text>
              <TextInput 
                style={[styles.modalInput, { backgroundColor: theme.surface + '80', borderColor: theme.border + '50' }]}
                value={newSection}
                onChangeText={setNewSection}
                placeholder="e.g. A"
                placeholderTextColor={theme.secondaryText + '50'}
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.cancelBtn}>
                <Text style={[styles.cancelText, { color: theme.secondaryText }]}>ABORT</Text>
              </TouchableOpacity>
              <SoundButton style={styles.saveBtn} onPress={handleShuffle}>
                <Text style={styles.saveText}>CONFIRM_MIGRATION</Text>
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
    backgroundColor: 'transparent',
  },
  header: {
    padding: 30,
    paddingTop: 80,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  masterActionBtn: {
    backgroundColor: theme.accent + '20',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.accent + '30',
  },
  masterActionText: {
    color: theme.accent,
    fontSize: 9,
    fontFamily: 'Jost_600SemiBold',
    letterSpacing: 2,
  },
  title: {
    fontSize: 22,
    color: theme.text,
    fontFamily: 'Jost_300Light',
    letterSpacing: 3,
  },
  subtitle: {
    fontSize: 10,
    color: theme.secondaryText,
    marginTop: 6,
    fontFamily: 'Jost_600SemiBold',
    letterSpacing: 1,
    opacity: 0.6,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 30,
    marginBottom: 20,
    paddingHorizontal: 20,
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.border + '50',
  },
  input: {
    flex: 1,
    color: theme.text,
    fontSize: 13,
    fontFamily: 'Jost_400Regular',
    letterSpacing: 1,
  },
  studentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.border + '30',
    marginBottom: 16,
  },
  cardInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    color: theme.text,
    fontFamily: 'Jost_400Regular',
  },
  studentMeta: {
    fontSize: 9,
    color: theme.secondaryText,
    marginTop: 4,
    fontFamily: 'Jost_600SemiBold',
    letterSpacing: 1,
    opacity: 0.7,
  },
  badgeRow: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  gradeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 8,
    fontFamily: 'Jost_600SemiBold',
    letterSpacing: 1,
  },
  actionRow: {
    flexDirection: 'row',
  },
  shuffleBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  emptyText: {
    textAlign: 'center',
    color: theme.secondaryText,
    marginTop: 60,
    fontSize: 10,
    fontFamily: 'Jost_600SemiBold',
    letterSpacing: 2,
    opacity: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 30,
  },
  modalContent: {
    borderRadius: 30,
    padding: 32,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  modalTitle: {
    fontSize: 18,
    color: theme.text,
    textAlign: 'center',
    fontFamily: 'Jost_600SemiBold',
    letterSpacing: 3,
  },
  modalSub: {
    fontSize: 11,
    color: theme.secondaryText,
    textAlign: 'center',
    marginBottom: 32,
    fontFamily: 'Jost_300Light',
    letterSpacing: 1,
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 9,
    color: theme.secondaryText,
    marginBottom: 10,
    letterSpacing: 2,
    fontFamily: 'Jost_600SemiBold',
    opacity: 0.8,
  },
  modalInput: {
    height: 56,
    borderRadius: 16,
    paddingHorizontal: 20,
    color: theme.text,
    borderWidth: 1,
    fontFamily: 'Jost_400Regular',
  },
  modalButtons: {
    flexDirection: 'row',
    marginTop: 32,
    gap: 16,
    alignItems: 'center',
  },
  cancelBtn: {
    flex: 1,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 11,
    fontFamily: 'Jost_600SemiBold',
    letterSpacing: 2,
  },
  saveBtn: {
    flex: 2,
    backgroundColor: theme.primary,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
  },
  saveText: {
    color: theme.buttonText,
    fontSize: 11,
    textAlign: 'center',
    fontFamily: 'Jost_600SemiBold',
    letterSpacing: 2,
  },
  sectionHeader: {
    paddingVertical: 12,
    marginTop: 10,
    marginBottom: 10,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitleText: {
    color: theme.text,
    fontSize: 12,
    fontFamily: 'Jost_600SemiBold',
    letterSpacing: 2,
    opacity: 0.5,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 9,
    fontFamily: 'Jost_600SemiBold',
    letterSpacing: 1,
  },
});
