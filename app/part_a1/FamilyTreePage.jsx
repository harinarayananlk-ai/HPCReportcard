import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  Image,
  ImageBackground,
  LayoutAnimation,
  Modal,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  UIManager,
  View
} from "react-native";
import AmbientIcon from "../../components/AmbientIcon";
import PaperPlaneAnimation from "../../components/PaperPlaneAnimation";
import SoundButton from "../../components/SoundButton";
import { API_URL, useAuth, useTheme } from "../../context/GlobalContext";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

export default function FamilyTreeScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { user, profile, setProfile: setAuthProfile, activeStudentId, activeStudentProfile, setActiveStudentProfile } = useAuth();
  const isTeacher = user?.role === 'teacher' || user?.role === 'superadmin';
  const targetUserId = (isTeacher && activeStudentId) ? activeStudentId : user?.id;
  const targetProfile = (isTeacher && activeStudentProfile) ? activeStudentProfile : profile;
  const styles = getStyles(theme);

  const SIBLING_TREE_Y_AXIS = SCREEN_H * 0.20;

  const [fatherImage, setFatherImage] = useState(null);
  const [motherImage, setMotherImage] = useState(null);
  const [yourImage, setYourImage] = useState(null);
  const [yourName, setYourName] = useState("");
  const [fatherName, setFatherName] = useState("");
  const [fatherJob, setFatherJob] = useState("");
  const [fatherEducation, setFatherEducation] = useState("");
  const [motherName, setMotherName] = useState("");
  const [motherJob, setMotherJob] = useState("");
  const [motherEducation, setMotherEducation] = useState("");
  const [fatherInfo, setFatherInfo] = useState("");
  const [motherInfo, setMotherInfo] = useState("");

  const [dob, setDob] = useState("");
  const [motherTongue, setMotherTongue] = useState("");
  const [siblings, setSiblings] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [expandedMember, setExpandedMember] = useState(null); // 'father' | 'mother' | null
  const [siblingNames, setSiblingNames] = useState([]);
  const [siblingAges, setSiblingAges] = useState([]);
  const [isSibBoxMin, setIsSibBoxMin] = useState(false);

  const fetchProfile = async () => {
    if (!targetUserId) return;
    try {
      const res = await fetch(`${API_URL}/students/profile/${targetUserId}`);
      const data = await res.json();
      if (data && data.registration_number) {
        applyProfile(data.family_details || {});
        if (isTeacher && activeStudentId) {
          setActiveStudentProfile(data);
        }
      }
    } catch (err) {
      console.warn("FamilyTree fetch failed", err);
    }
  };

  // Auto-Sync Logic
  useEffect(() => {
    if (targetUserId) {
      fetchProfile();
    }
  }, [targetUserId]);

  const applyProfile = (fdArg) => {
    const fd = typeof fdArg === 'string' ? JSON.parse(fdArg) : fdArg;
    if (!fd) return;

    setYourName(fd.studentName || fd.full_name || targetProfile?.full_name || "");
    setFatherName(fd.fatherName || "");
    setMotherName(fd.motherName || "");
    setDob(fd.dob || targetProfile?.dob || "");
    setMotherTongue(fd.motherTongue || "");

    // Load Images
    if (fd.fatherImage) setFatherImage(fd.fatherImage);
    if (fd.motherImage) setMotherImage(fd.motherImage);
    const sPhoto = fd.yourImage || fd.photo || fd.studentPhoto || targetProfile?.photo || "";
    if (sPhoto) setYourImage(sPhoto);

    if (fd.familyTree) {
      const tree = fd.familyTree;
      setFatherJob(tree.fatherJob || "");
      setFatherEducation(tree.fatherEducation || "");
      setMotherJob(tree.motherJob || "");
      setMotherEducation(tree.motherEducation || "");
      setFatherInfo(tree.fatherInfo || "");
      setMotherInfo(tree.motherInfo || "");
      if (tree.siblings) {
        setSiblings(String(tree.siblings.length));
        setSiblingNames(tree.siblings.map(s => s.name));
        setSiblingAges(tree.siblings.map(s => String(s.age)));
      }
    }
  };

  // Auto-Save: Background persistence on change
  useEffect(() => {
    if (!yourName || !targetUserId) return;
    const timer = setTimeout(() => {
      const saveSilently = async () => {
        try {
          const familyDetails = {
            ...targetProfile?.family_details,
            studentName: yourName,
            dob, fatherName, motherName, motherTongue, fatherImage, motherImage, yourImage,
            familyTree: {
              fatherJob, fatherEducation, fatherInfo,
              motherJob, motherEducation, motherInfo,
              siblings: siblingNames.map((n, i) => ({ name: n, age: siblingAges[i] }))
            }
          };
          await fetch(`${API_URL}/students/profile`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: targetUserId,
              registrationNumber: targetProfile?.registration_number,
              familyDetails
            })
          });
        } catch (e) { }
      };
      saveSilently();
    }, 2000);
    return () => clearTimeout(timer);
  }, [yourName, dob, fatherName, fatherJob, fatherEducation, fatherInfo, motherName, motherJob, motherEducation, motherInfo, motherTongue, siblingNames, siblingAges, fatherImage, motherImage, yourImage, targetUserId]);

  const handleManualSave = async () => {
    if (!targetUserId) return;
    try {
      const filteredFamilyTree = {
        fatherJob,
        fatherEducation,
        fatherInfo,
        motherJob,
        motherEducation,
        motherInfo,
        siblings: siblingNames.map((n, i) => ({ name: n, age: siblingAges[i] })).filter(s => s.name || s.age)
      };
      Object.keys(filteredFamilyTree).forEach(k => {
        if (filteredFamilyTree[k] === '' || filteredFamilyTree[k] == null) delete filteredFamilyTree[k];
      });
      const familyDetails = {
        ...targetProfile?.family_details,
        studentName: yourName,
        dob,
        fatherName,
        motherName,
        motherTongue,
        fatherImage,
        motherImage,
        yourImage,
        familyTree: filteredFamilyTree
      };
      // Remove empty fields from familyDetails to avoid overwriting saved data
      Object.keys(familyDetails).forEach(key => {
        if (familyDetails[key] === '' || familyDetails[key] == null) delete familyDetails[key];
      });
      await fetch(`${API_URL}/students/profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: targetUserId, registrationNumber: targetProfile?.registration_number, familyDetails })
      });
      Alert.alert("Success", "Family details saved!");
    } catch (e) {
      Alert.alert("Error", "Failed to save manually.");
    }
  };

  const handleExportAndFinish = async () => {
    if (!user) return router.push("/StudentHomepage");
    if (selectedDesign === 'original') {
      return Alert.alert("Maintenance", "The legacy original design is currently under maintenance. Please use the 'Original Cloned' or 'Premium' options.");
    }

    try {
      setLoading(true);
      const exportData = {
        userId: targetUserId,
        profileData: targetProfile || profile,
        design: selectedDesign,
        timestamp: new Date().toISOString()
      };
      const response = await fetch(`${API_URL}/export/pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(exportData)
      });
      const result = await response.json();
      if (!response.ok || result.status === 'error' || !result.fileName) {
        setLoading(false);
        return Alert.alert("Export Failed", result.message || "An error occurred during rendering.");
      }
      const pdfUrl = `${API_URL.replace('/api', '')}${result.url}`;
      const localUri = FileSystem.cacheDirectory + result.fileName;
      const { uri } = await FileSystem.downloadAsync(pdfUrl, localUri);
      if (Platform.OS === 'android') {
        const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
        if (permissions.granted) {
          const base64Data = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
          const finalFileName = result.fileName.endsWith('.pdf') ? result.fileName : `${result.fileName}.pdf`;
          const newUri = await FileSystem.StorageAccessFramework.createFileAsync(
            permissions.directoryUri,
            finalFileName,
            'application/pdf'
          );
          await FileSystem.writeAsStringAsync(newUri, base64Data, { encoding: FileSystem.EncodingType.Base64 });
          Alert.alert("Success", "Progress Card generated and saved successfully!", [{ text: "Finish", onPress: () => router.push(user?.role === "teacher" || user?.role === "superadmin" ? "/TeacherTracking" : "/StudentHomepage") }]);
        } else {
          await Sharing.shareAsync(uri);
        }
      } else {
        await Sharing.shareAsync(uri);
      }
      setLoading(false);
    } catch (err) {
      setLoading(false);
      Alert.alert("Export Error", err.message || "Failed to generate PDF.");
    }
  };

  const handleSaveAndNext = async () => {
    if (targetUserId) {
      try {
        const filteredSiblings = siblingNames.map((n, i) => ({ name: n, age: siblingAges[i] })).filter(s => s.name || s.age);
        const filteredFamilyTree = {
          fatherJob,
          fatherEducation,
          motherJob,
          motherEducation,
          siblings: filteredSiblings
        };
        // Remove empty entries from familyTree before payload
        Object.keys(filteredFamilyTree).forEach(k => {
          if (filteredFamilyTree[k] === '' || filteredFamilyTree[k] == null) delete filteredFamilyTree[k];
        });
        // Build familyDetails, excluding empty values
        const familyDetails = {
          ...targetProfile?.family_details,
          fatherName,
          motherName,
          dob,
          motherTongue,
          familyTree: filteredFamilyTree
        };
        Object.keys(familyDetails).forEach(key => {
          if (familyDetails[key] === '' || familyDetails[key] == null) delete familyDetails[key];
        });
        const payload = {
          userId: targetUserId,
          registrationNumber: targetProfile?.registration_number,
          familyDetails
        };
        const res = await fetch(`${API_URL}/students/profile`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          if (isTeacher && activeStudentId) {
            setActiveStudentProfile({ ...targetProfile, family_details: familyDetails });
          } else {
            setAuthProfile({ ...profile, family_details: familyDetails });
          }
        }
      } catch (err) {
        console.warn("Save family tree failed", err);
      }
    }
    router.push("/part_a1/CompletePage");
  };
  const pickImage = async (setImage) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.5,
      base64: true,
    });
    if (!result.canceled) {
      const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
      setImage(base64Image);
    }
  };

  const siblingCount = Number(siblings) || 0;

  // Optional logging logic can go here if needed
  const [currentSiblingIndex, setCurrentSiblingIndex] = useState(0);

  // Keep index valid when count changes
  useEffect(() => {
    if (currentSiblingIndex >= siblingCount) {
      setCurrentSiblingIndex(Math.max(0, siblingCount - 1));
    }
  }, [siblingCount, currentSiblingIndex]);

  // Auto-advance logic
  useEffect(() => {
    if (siblingCount > 0 && currentSiblingIndex < siblingCount - 1) {
      const currentName = siblingNames[currentSiblingIndex];
      const currentAge = siblingAges[currentSiblingIndex];
      // simplistic check: if both exist and have some length
      if (currentName?.length > 0 && currentAge?.length > 0) {
        const timer = setTimeout(() => {
          const nextIndex = currentSiblingIndex + 1;
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setCurrentSiblingIndex(nextIndex);
        }, 800);
        return () => clearTimeout(timer);
      }
    }
  }, [siblingNames, currentSiblingIndex, siblingAges, siblingCount]);

  const [siblingLayout, setSiblingLayout] = useState([]);

  // Generate random stable positions for sibling trees
  useEffect(() => {
    if (siblingCount === 0) {
      if (siblingLayout.length > 0) setSiblingLayout([]);
      return;
    }

    setSiblingLayout((prevLayout) => {
      const newLayout = [...prevLayout];
      const treeW = 120;

      // Generate new random positions only for new siblings
      for (let i = prevLayout.length; i < siblingCount; i++) {
        const minX = 10;
        const maxX = SCREEN_W - treeW - 10;
        const randLeft = minX + Math.random() * (maxX - minX);

        newLayout.push({
          left: randLeft,
          width: treeW,
          centerX: randLeft + (treeW / 2)
        });
      }

      // If sibling count decreased, slice the array
      return newLayout.slice(0, siblingCount);
    });
  }, [siblingCount]);

  const renderSiblingTrees = () => {
    if (siblingCount === 0 || siblingLayout.length === 0) return null;
    return (
      <View style={{ position: "absolute", bottom: SIBLING_TREE_Y_AXIS, left: 0, width: SCREEN_W, height: 260 }} pointerEvents="box-none">
        {siblingLayout.map((pos, i) => (
          <SoundButton
            key={i}
            style={{ position: "absolute", left: pos.left, bottom: 0, width: pos.width, height: 220, alignItems: "center" }}
            onPress={() => {
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
              setCurrentSiblingIndex(i);
            }}
            activeOpacity={0.8}
          >
            <Image
              source={require("../../assets/images/tree.png")}
              style={{ width: pos.width, height: 220, resizeMode: "contain", opacity: currentSiblingIndex === i ? 0.7 : 0.4 }}
            />
          </SoundButton>
        ))}
      </View>
    );
  };

  const renderSiblingInputs = () => {
    if (siblingCount === 0 || siblingLayout.length === 0) return null;

    const currentTreePos = siblingLayout[currentSiblingIndex];
    let boxLeft = currentTreePos ? currentTreePos.centerX - 70 : 0; // 70 is half of 140px

    // Keep box within screen bounds
    if (boxLeft < 10) boxLeft = 10;
    if (boxLeft > SCREEN_W - 150) boxLeft = SCREEN_W - 150;

    return (
      <View style={[styles.fixedSiblingInputs, { left: boxLeft, bottom: SIBLING_TREE_Y_AXIS + 170 }]} pointerEvents="box-none">
        <View style={[styles.sibInfoBox, isSibBoxMin && { height: 40, width: 100, padding: 5, borderRadius: 10 }]}>
          <View style={styles.siblingHeaderRow}>
            {!isSibBoxMin && (
              <SoundButton
                disabled={currentSiblingIndex === 0}
                onPress={() => {
                  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                  setCurrentSiblingIndex(currentSiblingIndex - 1);
                }}
              >
                <Text style={[styles.navArrow, currentSiblingIndex === 0 && { opacity: 0.3 }]}>{"<"}</Text>
              </SoundButton>
            )}

            <Text style={[styles.sibTitle, isSibBoxMin && { fontSize: 10 }]}>
              {isSibBoxMin ? `#${currentSiblingIndex + 1}` : `Sibling ${currentSiblingIndex + 1}`}
            </Text>

            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {!isSibBoxMin && (
                <SoundButton
                  disabled={currentSiblingIndex === siblingCount - 1}
                  onPress={() => {
                    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                    setCurrentSiblingIndex(currentSiblingIndex + 1);
                  }}
                >
                  <Text style={[styles.navArrow, currentSiblingIndex === siblingCount - 1 && { opacity: 0.3 }]}>{">"}</Text>
                </SoundButton>
              )}

              <SoundButton
                style={{ marginLeft: 5 }}
                onPress={() => {
                  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                  setIsSibBoxMin(!isSibBoxMin);
                }}
              >
                <Text style={{ fontSize: 14 }}>{isSibBoxMin ? "➕" : "➖"}</Text>
              </SoundButton>
            </View>
          </View>

          {!isSibBoxMin && (
            <>

              <TextInput
                style={styles.sibInput}
                placeholder="Name"
                placeholderTextColor={theme.secondaryText}
                value={siblingNames[currentSiblingIndex] || ""}
                onChangeText={(t) => {
                  const updated = [...siblingNames];
                  updated[currentSiblingIndex] = t;
                  setSiblingNames(updated);
                }}
              />
              <TextInput
                style={styles.sibInput}
                placeholder="Age"
                placeholderTextColor={theme.secondaryText}
                keyboardType="numeric"
                value={siblingAges[currentSiblingIndex] || ""}
                onChangeText={(t) => {
                  const updated = [...siblingAges];
                  updated[currentSiblingIndex] = t;
                  setSiblingAges(updated);
                }}
              />
            </>
          )}
        </View>
        {/* Tooltip Arrow pointing down to the tree */}
        <View style={styles.tooltipArrow} />
      </View>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.background }]} />
      <PaperPlaneAnimation />
      <StatusBar barStyle="light-content" />
      <View style={{ position: 'absolute', top: 50, left: 20, right: 20, flexDirection: 'row', justifyContent: 'space-between', zIndex: 100 }}>
        <SoundButton style={{ backgroundColor: theme.surface + '90', padding: 10, borderRadius: 12, borderWidth: 1, borderColor: theme.border }} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </SoundButton>
        <SoundButton style={{ backgroundColor: theme.primary + '30', padding: 8, borderRadius: 12, borderWidth: 1, borderColor: theme.primary }} onPress={handleManualSave}>
          <AmbientIcon name="save" size={24} color={theme.primary} type="hop" />
        </SoundButton>
      </View>


      {/* Sibling trees render behind (zIndex: -1) */}
      {renderSiblingTrees()}

      {/* Main tree image centered */}
      <ImageBackground
        source={require("../../assets/images/tree.png")}
        style={styles.mainTree}
        resizeMode="contain"
      >
        {/* Father Card */}
        <SoundButton
          style={styles.fatherBox}
          onPress={() => {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setExpandedMember('father');
          }}
        >
          <View style={styles.memberCard}>
            <View style={styles.cardGlow} />
            <Image
              source={fatherImage ? { uri: fatherImage } : require("../../assets/images/icon.png")}
              style={styles.cardAvatar}
            />
            <Text style={styles.cardMemberName}>{fatherName || "Father"}</Text>
            <View style={styles.cardBadge}>
              <Text style={styles.cardBadgeText}>{fatherJob || "Tap to add details"}</Text>
            </View>
          </View>
        </SoundButton>

        {/* Mother Card */}
        <SoundButton
          style={styles.motherBox}
          onPress={() => {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setExpandedMember('mother');
          }}
        >
          <View style={styles.memberCard}>
            <View style={styles.cardGlow} />
            <Image
              source={motherImage ? { uri: motherImage } : require("../../assets/images/icon.png")}
              style={styles.cardAvatar}
            />
            <Text style={styles.cardMemberName}>{motherName || "Mother"}</Text>
            <View style={styles.cardBadge}>
              <Text style={styles.cardBadgeText}>{motherJob || "Tap to add details"}</Text>
            </View>
          </View>
        </SoundButton>

        {/* You — on the trunk */}
        <View style={styles.youBox}>
          <SoundButton
            style={styles.photoBox}
            onPress={() => pickImage(setYourImage)}
          >
            {yourImage ? (
              <Image source={{ uri: yourImage }} style={styles.photo} />
            ) : (
              <Text style={styles.photoPlus}>+</Text>
            )}
          </SoundButton>
          <TextInput
            style={styles.fieldInput}
            placeholder="Your Name"
            placeholderTextColor={theme.secondaryText}
            value={yourName}
            onChangeText={setYourName}
          />
          <TextInput
            style={styles.fieldInput}
            placeholder="Date of Birth (DD/MM/YYYY)"
            placeholderTextColor={theme.secondaryText}
            value={dob}
            onChangeText={setDob}
          />
          <TextInput
            style={styles.fieldInput}
            placeholder="Mother Tongue"
            placeholderTextColor={theme.secondaryText}
            value={motherTongue}
            onChangeText={setMotherTongue}
          />
        </View>
      </ImageBackground>

      {/* Sibling Inputs (Above Main Tree) */}
      {renderSiblingInputs()}

      {/* Siblings button */}
      <SoundButton
        style={styles.siblingsBtn}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.7}
      >
        <Text style={styles.siblingsBtnText}>
          {siblingCount > 0 ? `Siblings (${siblingCount})` : "+ Siblings"}
        </Text>
      </SoundButton>

      {/* Next button */}
      <SoundButton
        style={styles.nextBtn}
        onPress={handleSaveAndNext}
        activeOpacity={0.8}
      >
        <Text style={styles.nextBtnText}>Next →</Text>
      </SoundButton>

      {/* Siblings Modal */}
      <Modal transparent visible={modalVisible} animationType="fade">
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>How many siblings?</Text>
            <TextInput
              style={styles.modalNumInput}
              keyboardType="numeric"
              value={siblings}
              onChangeText={setSiblings}
              placeholder="e.g. 2"
              placeholderTextColor={theme.secondaryText}
              maxLength={2}
            />
            <SoundButton
              style={styles.modalSave}
              onPress={() => setModalVisible(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.modalSaveText}>Done</Text>
            </SoundButton>
          </View>
        </View>
      </Modal>

      {/* Expanded Member Overlay */}
      {expandedMember && (
        <View style={styles.expandedOverlay}>
          <View style={styles.expandedCard}>
            <View style={styles.expandedHeader}>
              <Text style={styles.expandedTitle}>{expandedMember === 'father' ? "Father's Details" : "Mother's Details"}</Text>
              <SoundButton onPress={() => setExpandedMember(null)}>
                <Ionicons name="close-circle" size={32} color={theme.secondaryText} />
              </SoundButton>
            </View>

            <View style={styles.expandedContent}>
              <SoundButton
                style={styles.expandedPhotoBox}
                onPress={() => pickImage(expandedMember === 'father' ? setFatherImage : setMotherImage)}
              >
                <Image
                  source={(expandedMember === 'father' ? fatherImage : motherImage) ? { uri: expandedMember === 'father' ? fatherImage : motherImage } : require("../../assets/images/icon.png")}
                  style={styles.expandedPhoto}
                />
                <View style={styles.photoEditBadge}>
                  <Ionicons name="camera" size={16} color="white" />
                </View>
              </SoundButton>

              <Text style={styles.expandedLabel}>Full Name</Text>
              <TextInput
                style={styles.expandedInput}
                placeholder="Enter name"
                placeholderTextColor={theme.secondaryText}
                value={expandedMember === 'father' ? fatherName : motherName}
                onChangeText={expandedMember === 'father' ? setFatherName : setMotherName}
              />

              <Text style={styles.expandedLabel}>Occupation</Text>
              <TextInput
                style={styles.expandedInput}
                placeholder="e.g. Engineer"
                placeholderTextColor={theme.secondaryText}
                value={expandedMember === 'father' ? fatherJob : motherJob}
                onChangeText={expandedMember === 'father' ? setFatherJob : setMotherJob}
              />

              <Text style={styles.expandedLabel}>Education</Text>
              <View style={styles.expandedPickerWrap}>
                <Picker
                  selectedValue={expandedMember === 'father' ? fatherEducation : motherEducation}
                  style={styles.expandedPicker}
                  onValueChange={(v) => expandedMember === 'father' ? setFatherEducation(v) : setMotherEducation(v)}
                >
                  <Picker.Item label="Select Education" value="" />
                  <Picker.Item label="High School" value="highschool" />
                  <Picker.Item label="Bachelor's" value="bachelors" />
                  <Picker.Item label="Master's" value="masters" />
                  <Picker.Item label="PhD" value="phd" />
                </Picker>
              </View>

              <Text style={styles.expandedLabel}>Additional Information</Text>
              <TextInput
                style={[styles.expandedInput, styles.expandedTextArea]}
                placeholder="Any other details..."
                placeholderTextColor={theme.secondaryText}
                multiline
                numberOfLines={3}
                value={expandedMember === 'father' ? fatherInfo : motherInfo}
                onChangeText={expandedMember === 'father' ? setFatherInfo : setMotherInfo}
              />
            </View>

            <SoundButton
              style={styles.expandedDoneBtn}
              onPress={() => {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setExpandedMember(null);
                handleManualSave(); // Auto-save on close
              }}
            >
              <Text style={styles.expandedDoneText}>Save & Close</Text>
            </SoundButton>
          </View>
        </View>
      )}
    </View>
  );
}

const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },

  /* ── Main tree fills screen ── */
  mainTree: {
    flex: 1,
    width: SCREEN_W,
  },

  /* ── Family member positions on the tree ── */
  fatherBox: {
    position: "absolute",
    alignItems: "center",
    width: 140,
    top: SCREEN_H * 0.25,
    left: SCREEN_W * 0.18,
  },
  motherBox: {
    position: "absolute",
    alignItems: "center",
    width: 140,
    top: SCREEN_H * 0.25,
    right: SCREEN_W * 0.18,
  },
  youBox: {
    position: "absolute",
    alignItems: "center",
    width: 140,
    bottom: SCREEN_H * 0.12,
    left: (SCREEN_W - 140) / 2,
  },

  /* ── Photo picker ── */
  photoBox: {
    width: 70,
    height: 70,
    borderRadius: 10,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  photo: {
    width: "100%",
    height: "100%",
    borderRadius: 10,
  },
  photoPlus: {
    fontSize: 24,
    color: theme.secondaryText,
    fontWeight: "300",
  },

  /* ── Labels ── */
  memberLabel: {
    marginTop: 4,
    fontWeight: "700",
    fontSize: 12,
    color: theme.text,
    backgroundColor: theme.surface,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: "hidden",
  },

  /* ── Input fields on branches ── */
  memberFields: {
    marginTop: 4,
    alignItems: "center",
    width: 120,
  },
  fieldInput: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: theme.border,
    width: '100%',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: theme.inputBackground,
    fontSize: 11,
    color: theme.text,
    textAlign: "center",
  },
  pickerWrap: {
    marginTop: 4,
    width: '100%',
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 6,
    backgroundColor: theme.inputBackground,
    overflow: "hidden",
  },
  picker: {
    color: theme.text,
    height: 48,
    marginLeft: -6,
  },

  /* ── New Card Styles ── */
  memberCard: {
    backgroundColor: theme.surface + 'CC',
    borderRadius: 20,
    padding: 12,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: theme.border,
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
    width: 140,
  },
  cardGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
    backgroundColor: theme.primary + '08',
  },
  cardAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: theme.primary + '40',
    marginBottom: 8,
  },
  cardMemberName: {
    fontSize: 14,
    fontWeight: "800",
    color: theme.text,
    textAlign: "center",
  },
  cardBadge: {
    marginTop: 4,
    backgroundColor: theme.primary + '20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  cardBadgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: theme.primary,
  },

  /* ── Expanded Overlay ── */
  expandedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.85)',
    zIndex: 999,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  expandedCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: theme.surface,
    borderRadius: 30,
    padding: 24,
    borderWidth: 1,
    borderColor: theme.border,
  },
  expandedHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  expandedTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: theme.text,
  },
  expandedContent: {
    alignItems: "center",
  },
  expandedPhotoBox: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 20,
    position: "relative",
  },
  expandedPhoto: {
    width: "100%",
    height: "100%",
    borderRadius: 50,
  },
  photoEditBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: theme.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: theme.surface,
  },
  expandedLabel: {
    alignSelf: "flex-start",
    fontSize: 12,
    fontWeight: "700",
    color: theme.secondaryText,
    marginBottom: 6,
    marginLeft: 4,
    textTransform: "uppercase",
  },
  expandedInput: {
    width: "100%",
    backgroundColor: theme.inputBackground,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: theme.text,
    marginBottom: 16,
  },
  expandedTextArea: {
    height: 80,
    textAlignVertical: "top",
  },
  expandedPickerWrap: {
    width: "100%",
    backgroundColor: theme.inputBackground,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    marginBottom: 16,
    overflow: "hidden",
  },
  expandedPicker: {
    color: theme.text,
  },
  expandedDoneBtn: {
    backgroundColor: theme.primary,
    padding: 16,
    borderRadius: 15,
    alignItems: "center",
    marginTop: 10,
  },
  expandedDoneText: {
    color: theme.buttonText,
    fontSize: 16,
    fontWeight: "900",
  },

  /* ── Sibling fixed input box ── */
  fixedSiblingInputs: {
    position: "absolute",
    zIndex: 10,
    alignItems: "center",
  },
  sibInfoBox: {
    alignItems: "center",
    width: 140,
    backgroundColor: theme.surface,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 8,
  },
  tooltipArrow: {
    width: 0,
    height: 0,
    backgroundColor: "transparent",
    borderStyle: "solid",
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderTopWidth: 12,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: theme.surface === "transparent" ? theme.background : theme.surface,
    alignSelf: "center",
    marginTop: -1,
  },
  siblingHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
    paddingHorizontal: 4,
    paddingVertical: 2,
    marginBottom: 6,
    width: "100%",
    justifyContent: "space-between",
  },
  navArrow: {
    color: theme.text,
    fontSize: 16,
    fontWeight: "800",
    paddingHorizontal: 6,
  },
  sibTitle: {
    fontWeight: "700",
    fontSize: 14,
    color: theme.text,
  },
  sibInput: {
    width: "100%",
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 6,
    backgroundColor: theme.inputBackground,
    textAlign: "center",
    paddingVertical: 6,
    paddingHorizontal: 6,
    fontSize: 14,
    color: theme.text,
    marginBottom: 6,
  },

  /* ── Floating buttons ── */
  siblingsBtn: {
    position: "absolute",
    bottom: 85,
    right: 20,
    backgroundColor: theme.surface,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.border,
  },
  siblingsBtnText: {
    color: theme.text,
    fontWeight: "700",
    fontSize: 15,
  },
  nextBtn: {
    position: "absolute",
    bottom: 24,
    left: 20,
    backgroundColor: theme.primary,
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: 20,
  },
  nextBtnText: {
    color: theme.buttonText,
    fontWeight: "800",
    fontSize: 15,
  },

  /* ── Modal ── */
  modalBg: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.75)",
  },
  modalCard: {
    width: 260,
    backgroundColor: theme.surface,
    padding: 24,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.border,
  },
  modalTitle: {
    fontWeight: "700",
    fontSize: 15,
    color: theme.text,
    marginBottom: 16,
    textAlign: "center",
  },
  modalNumInput: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 8,
    padding: 14,
    marginBottom: 16,
    textAlign: "center",
    backgroundColor: theme.inputBackground,
    color: theme.text,
    fontSize: 20,
    fontWeight: "700",
  },
  modalSave: {
    backgroundColor: theme.primary,
    padding: 13,
    borderRadius: 8,
    alignItems: "center",
  },
  modalSaveText: {
    color: theme.buttonText,
    fontWeight: "800",
    fontSize: 14,
  },
});


