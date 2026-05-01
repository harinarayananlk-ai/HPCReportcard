import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Image,
  Dimensions,
  Platform,
  KeyboardAvoidingView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Animated, { 
  FadeInDown, 
  FadeInUp, 
  Layout,
  ZoomIn
} from "react-native-reanimated";
import SoundButton from "../../components/SoundButton";
import { useTheme, useAuth, API_URL } from "../../context/GlobalContext";

const { width: SCREEN_W } = Dimensions.get("window");

export default function LayoutBuilder() {
  const router = useRouter();
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const { user, profile, setProfile: setAuthProfile, activeStudentId, activeStudentProfile } = useAuth();
  const isTeacher = user?.role === 'teacher' || user?.role === 'superadmin';
  const targetUserId = (isTeacher && activeStudentId) ? activeStudentId : user?.id;
  const targetProfile = (isTeacher && activeStudentProfile) ? activeStudentProfile : profile;
  const currentYear = new Date().getFullYear();

  // ── FORM STATE ──
  const [subjectPhoto, setSubjectPhoto] = useState(null);
  const [groupPhoto, setGroupPhoto] = useState(null);
  const [age, setAge] = useState("");
  const [dob, setDob] = useState("");
  const [location, setLocation] = useState("");
  const [connections, setConnections] = useState(["", "", ""]);
  const [targetRole, setTargetRole] = useState("");
  const [preferences, setPreferences] = useState({
    color: "",
    food: "",
    animal: "",
    sport: "",
  });
  const [assessments, setAssessments] = useState({
    rubricLevel: "Developing",
    teacherFeedback: "",
    selfAssessment: ""
  });
  const [isLoaded, setIsLoaded] = useState(false);

  // Autofill Logic
  useEffect(() => {
    if (targetProfile) {
      applyProfile(targetProfile);
    } else if (targetUserId) {
      fetchProfile();
    }
  }, [targetUserId, targetProfile]);

  const fetchProfile = async () => {
    try {
      const res = await fetch(`${API_URL}/students/profile/${targetUserId}`);
      const data = await res.json();
      if (data) {
        applyProfile(data);
      }
    } catch (err) {
      console.error("Layout fetch failed", err);
    } finally {
      setIsLoaded(true);
    }
  };

  const applyProfile = (data) => {
    if (!data) return;
    const profileData = data.registration_number ? data : (data.profile || {});

    let fd = profileData.family_details || {};
    if (typeof fd === 'string') {
      try {
        fd = JSON.parse(fd);
      } catch (e) {
        fd = {};
      }
    }

    setAge(profileData.age || fd.age || "");
    setDob(profileData.dob || fd.dob || "");
    setTargetRole(profileData.target_role || fd.targetRole || "");
    setLocation(profileData.location || fd.location || fd.studentAddress || "");
    
    const subP = fd.subjectPhoto || fd.photo || fd.studentPhoto || profileData.subjectPhoto || profileData.photo || profileData.studentPhoto || "";
    if (subP) setSubjectPhoto(subP);
    
    const grpP = fd.groupPhoto || profileData.groupPhoto || "";
    if (grpP) setGroupPhoto(grpP);
    
    if (fd.connections) setConnections(fd.connections);
    if (profileData.connections) setConnections(profileData.connections);
    
    if (profileData.preferences) {
      try {
        const prefObj = typeof profileData.preferences === 'string' 
          ? JSON.parse(profileData.preferences) 
          : profileData.preferences;
        setPreferences(prefObj);
      } catch (e) {}
    }

    if (profileData.assessments) {
      try {
        const assObj = typeof profileData.assessments === 'string'
          ? JSON.parse(profileData.assessments)
          : profileData.assessments;
        setAssessments(assObj);
      } catch (e) {}
    }
  };

  const pickImage = async (setter) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.5,
      base64: true,
    });
    if (!result.canceled) {
      const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
      setter(base64Image);
    }
  };

  const updateConnection = (index, val) => {
    const newCons = [...connections];
    newCons[index] = val;
    setConnections(newCons);
  };

  const updatePreference = (key, val) => {
    setPreferences((prev) => ({ ...prev, [key]: val }));
  };

  // Auto-Save Logic
  useEffect(() => {
    if (!targetUserId || !isLoaded) return;
    
    const timer = setTimeout(() => {
      const saveSilently = async () => {
        try {
          const payload = {
            userId: targetUserId,
            registrationNumber: targetProfile?.registration_number,
            preferences, assessments,
            familyDetails: {
              ...targetProfile?.family_details,
              targetRole, age, dob, subjectPhoto, groupPhoto, location, connections
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
  }, [targetRole, age, dob, subjectPhoto, groupPhoto, location, connections, preferences, assessments]);

  const handleManualSave = async () => {
    if (!targetUserId) return;
    try {
      const payload = {
        userId: targetUserId,
        registrationNumber: targetProfile?.registration_number,
        preferences, assessments,
        familyDetails: {
          ...targetProfile?.family_details,
          targetRole, age, dob, subjectPhoto, groupPhoto, location, connections
        }
      };
      const res = await fetch(`${API_URL}/students/profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        Alert.alert("SUCCESS", "System memory updated.");
      }
    } catch (e) {
      Alert.alert("ERROR", "Uplink failed.");
    }
  };

  const handleNext = async () => {
    if (targetUserId) {
      try {
        const payload = {
          userId: targetUserId,
          registrationNumber: targetProfile?.registration_number,
          preferences, assessments,
          familyDetails: {
            ...targetProfile?.family_details,
            targetRole, age, dob, subjectPhoto, groupPhoto, location, connections
          }
        };

        const res = await fetch(`${API_URL}/students/profile`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          const updatedData = await res.json();
          setAuthProfile(updatedData.profile || updatedData);
        }
      } catch (err) {
        console.warn("Saving LayoutBuilder data failed", err);
      }
    }
    if (user?.role === 'student') {
      router.push("/part_a1/CompletePage");
    } else {
      router.push("/part_b_entry/SelectionPage");
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <Animated.View entering={FadeInUp.duration(600)} style={[styles.header, { backgroundColor: theme.surface }]}>
          <View style={styles.headerTop}>
            <View style={styles.headerInfo}>
              <View style={[styles.headerIcon, { backgroundColor: theme.accent }]}>
                <Ionicons name="construct-outline" size={16} color={theme.buttonText} />
              </View>
              <View>
                <Text style={[styles.headerTitle, { color: theme.text }]}>LAYOUT_ENGINE_OS</Text>
                <Text style={[styles.headerSubtitle, { color: theme.secondaryText }]}>Visual Configuration System</Text>
              </View>
            </View>
            <View style={styles.headerActions}>
              <SoundButton 
                style={[styles.actionBtn, { backgroundColor: theme.accent + '20' }]} 
                onPress={handleManualSave}
              >
                <Ionicons name="cloud-upload-outline" size={18} color={theme.accent} />
              </SoundButton>
            </View>
          </View>
        </Animated.View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
        >
          {/* VISUALS SECTION */}
          <Animated.View entering={FadeInDown.delay(100)} style={styles.section}>
            <SectionTitle icon="camera-outline" title="Optical_Inputs" theme={theme} styles={styles} />
            <View style={styles.photoGrid}>
              <TouchableOpacity
                style={[styles.photoBox, { backgroundColor: theme.surface, borderColor: theme.border }]}
                onPress={() => pickImage(setSubjectPhoto)}
              >
                {subjectPhoto ? (
                   <Image source={{ uri: subjectPhoto }} style={styles.fullImage} />
                ) : (
                  <>
                    <Ionicons name="person-add-outline" size={24} color={theme.accent} />
                    <Text style={styles.photoLabel}>SUBJECT_SCAN</Text>
                  </>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.photoBox, { backgroundColor: theme.surface, borderColor: theme.border }]}
                onPress={() => pickImage(setGroupPhoto)}
              >
                {groupPhoto ? (
                   <Image source={{ uri: groupPhoto }} style={styles.fullImage} />
                ) : (
                  <>
                    <Ionicons name="people-outline" size={24} color={theme.accent} />
                    <Text style={styles.photoLabel}>GROUP_ARRAY</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* IDENTITY SECTION */}
          <Animated.View entering={FadeInDown.delay(200)} style={styles.section}>
            <SectionTitle icon="finger-print-outline" title="Identity_Markers" theme={theme} styles={styles} />
            <View style={styles.fieldRow}>
              <View style={styles.flex1}>
                <FieldLabel label="AGE_PARAMETER" styles={styles} theme={theme} />
                <TextInput
                  style={[styles.textInput, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text }]}
                  placeholder="00"
                  placeholderTextColor={theme.secondaryText + "50"}
                  keyboardType="numeric"
                  value={age}
                  onChangeText={setAge}
                />
              </View>
              <View style={styles.flex1}>
                <FieldLabel label="TEMPORAL_ID (DOB)" styles={styles} theme={theme} />
                <TextInput
                  style={[styles.textInput, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text }]}
                  placeholder="DD.MM.YYYY"
                  placeholderTextColor={theme.secondaryText + "50"}
                  value={dob}
                  onChangeText={setDob}
                />
              </View>
            </View>
            <View style={styles.fieldMargin}>
              <FieldLabel label="GEOSPATIAL_COORD" styles={styles} theme={theme} />
              <TextInput
                style={[styles.textInput, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text }]}
                placeholder="CITY / SECTOR"
                placeholderTextColor={theme.secondaryText + "50"}
                value={location}
                onChangeText={setLocation}
              />
            </View>
          </Animated.View>

          {/* NETWORK SECTION */}
          <Animated.View entering={FadeInDown.delay(300)} style={styles.section}>
            <SectionTitle icon="git-network-outline" title="Neural_Nodes" theme={theme} styles={styles} />
            <View style={[styles.glassCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              {connections.map((c, i) => (
                <View key={i} style={styles.nodeInputRow}>
                   <Text style={[styles.nodeIndex, { color: theme.accent }]}>0{i+1}</Text>
                   <TextInput
                    style={[styles.nodeInput, { color: theme.text }]}
                    placeholder={`NODE_IDENTIFIER_0${i + 1}`}
                    placeholderTextColor={theme.secondaryText + "40"}
                    value={c}
                    onChangeText={(v) => updateConnection(i, v)}
                  />
                </View>
              ))}
            </View>
          </Animated.View>

          {/* PREVIEW RENDERING */}
          <View style={styles.divider}>
             <View style={styles.dividerLine} />
             <Text style={styles.dividerText}>REALTIME_RENDER_PREVIEW</Text>
             <View style={styles.dividerLine} />
          </View>

          <Animated.View entering={ZoomIn.delay(400)} style={styles.previewContainer}>
             <View style={[styles.miniCard, { backgroundColor: "#fff" }]}>
                <View style={styles.miniCardHeader}>
                   <View>
                      <Text style={styles.miniCardTitle}>IDENTITY_REPORT</Text>
                      <View style={[styles.miniCardAccent, { backgroundColor: theme.accent }]} />
                   </View>
                   <Text style={styles.miniCardYear}>{currentYear}</Text>
                </View>
                
                <View style={styles.miniCardBody}>
                   <View style={styles.miniCardLeft}>
                      <View style={styles.miniAvatarFrame}>
                        {subjectPhoto ? <Image source={{ uri: subjectPhoto }} style={styles.fullImage} /> : <View style={styles.miniPlaceholder}><Text>👤</Text></View>}
                      </View>
                      <View style={styles.miniInfoPill}>
                         <Text style={styles.miniInfoText}>{age || "00"}</Text>
                      </View>
                   </View>
                   <View style={styles.miniCardRight}>
                      <View style={styles.miniGroupFrame}>
                        {groupPhoto ? <Image source={{ uri: groupPhoto }} style={styles.fullImage} /> : <View style={styles.miniPlaceholder}><Text>🖼️</Text></View>}
                      </View>
                      <View style={styles.miniConnections}>
                         {connections.map((_, i) => <View key={i} style={styles.miniDot} />)}
                      </View>
                   </View>
                </View>

                <View style={styles.miniCardFooter}>
                   <Text style={styles.miniFooterText}>{location || "LOCATION_PENDING"}</Text>
                   <Text style={styles.miniFooterText}>{dob || "TEMPORAL_PENDING"}</Text>
                </View>
             </View>
          </Animated.View>

        </ScrollView>

        <Animated.View entering={FadeInUp.delay(500)} style={[styles.bottomBar, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
           <SoundButton
            style={[styles.nextBtn, { backgroundColor: theme.accent }]}
            onPress={handleNext}
          >
            <Text style={[styles.nextBtnText, { color: theme.buttonText }]}>COMMIT_CHANGES →</Text>
          </SoundButton>
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const SectionTitle = ({ icon, title, styles, theme }) => {
  return (
    <View style={styles.sectionHeader}>
      <Ionicons name={icon} size={14} color={theme.accent} />
      <Text style={[styles.sectionText, { color: theme.text }]}>{title.toUpperCase()}</Text>
    </View>
  );
};

const FieldLabel = ({ label, styles, theme }) => {
  return <Text style={[styles.label, { color: theme.secondaryText }]}>{label}</Text>;
};

const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 1,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  headerSubtitle: {
    fontSize: 10,
    fontWeight: "600",
    opacity: 0.7,
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  scroll: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 8,
  },
  sectionText: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 2,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  photoGrid: {
    flexDirection: "row",
    gap: 12,
  },
  photoBox: {
    flex: 1,
    height: 110,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  fullImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  photoLabel: {
    fontSize: 8,
    fontWeight: "900",
    marginTop: 8,
    color: "#71717a",
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  fieldRow: {
    flexDirection: "row",
    gap: 12,
  },
  flex1: {
    flex: 1,
  },
  label: {
    fontSize: 9,
    fontWeight: "900",
    marginBottom: 8,
    letterSpacing: 1,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  textInput: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 13,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  fieldMargin: {
    marginTop: 16,
  },
  glassCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 8,
  },
  nodeInputRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    height: 44,
  },
  nodeIndex: {
    fontSize: 10,
    fontWeight: "900",
    marginRight: 12,
  },
  nodeInput: {
    flex: 1,
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 40,
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  dividerText: {
    fontSize: 8,
    color: "#52525b",
    fontWeight: "900",
    letterSpacing: 2,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  previewContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  miniCard: {
    width: 280,
    padding: 20,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 10,
  },
  miniCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  miniCardTitle: {
    fontSize: 12,
    fontWeight: "900",
    color: "#18181b",
    letterSpacing: 1,
  },
  miniCardAccent: {
    height: 3,
    width: 20,
    marginTop: 4,
    borderRadius: 2,
  },
  miniCardYear: {
    fontSize: 10,
    color: "#d4d4d8",
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  miniCardBody: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  miniCardLeft: {
    width: '45%',
    alignItems: "center",
  },
  miniAvatarFrame: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#f4f4f5",
    overflow: "hidden",
    borderWidth: 3,
    borderColor: "#fff",
  },
  miniPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  miniInfoPill: {
    marginTop: -10,
    backgroundColor: theme.accent,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  miniInfoText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "900",
  },
  miniCardRight: {
    width: '45%',
    gap: 8,
  },
  miniGroupFrame: {
    width: '100%',
    height: 60,
    borderRadius: 12,
    backgroundColor: "#f4f4f5",
    overflow: "hidden",
  },
  miniConnections: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 4,
  },
  miniDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#e4e4e7",
  },
  miniCardFooter: {
    borderTopWidth: 1,
    borderTopColor: "#f4f4f5",
    paddingTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  miniFooterText: {
    fontSize: 7,
    fontWeight: "900",
    color: "#a1a1aa",
    textTransform: "uppercase",
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    borderTopWidth: 1,
  },
  nextBtn: {
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  nextBtnText: {
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 2,
  },
});
