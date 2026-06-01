import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    View, StyleSheet, TextInput, Text, ScrollView,
    StatusBar, TouchableOpacity, Dimensions, Platform, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme, useAuth, API_URL } from '../../context/GlobalContext';
import SleekDropdown from './SleekDropdown';
import InfoModal from './InfoModal';
import { domains, curricularGoals, competencies } from '../../constants/SelectionData_s2';
import { useVideoPlayer, VideoView } from 'expo-video';
import Animated, { FadeInDown, useSharedValue, useAnimatedStyle, withTiming, withSequence, withRepeat } from 'react-native-reanimated';
import { Waves, Mountain, Cloud, Eye, Feather, Wand2, CloudUpload } from 'lucide-react-native';
import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator } from 'react-native';
import SoundButton from '../../components/SoundButton';
import GemButton from '../../components/GemButton';
import MenuDropdown from '../../components/MenuDropdown';
import { gems } from '../../colour_themes';
import { Image } from 'react-native';
import PremiumBackground from '../../components/PremiumBackground';

const { width: W, height: H } = Dimensions.get('window');

// ── Sub-components ──────────────────────────────────────────────────

const AnimatedWaves = ({ color, styles }) => {
    const offset = useSharedValue(0);
    useEffect(() => {
        offset.value = withRepeat(
            withSequence(
                withTiming(4, { duration: 1500 }),
                withTiming(-4, { duration: 1500 })
            ),
            -1,
            true
        );
    }, []);
    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: offset.value }]
    }));
    return (
        <View style={styles.iconContainer}>
            <Animated.View style={animatedStyle}><Waves color={color} size={28} /></Animated.View>
            <Text style={[styles.iconText, { color }]}>STREAM</Text>
        </View>
    );
};

const AnimatedMountain = ({ color, styles }) => {
    const scale = useSharedValue(1);
    useEffect(() => {
        scale.value = withRepeat(
            withTiming(1.15, { duration: 2000 }),
            -1,
            true
        );
    }, []);
    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
        opacity: withTiming(scale.value > 1.1 ? 0.9 : 1)
    }));
    return (
        <View style={styles.iconContainer}>
            <Animated.View style={animatedStyle}><Mountain color={color} size={28} /></Animated.View>
            <Text style={[styles.iconText, { color }]}>MOUNTAIN</Text>
        </View>
    );
};

const AnimatedSky = ({ color, styles }) => {
    const translateY = useSharedValue(0);
    useEffect(() => {
        translateY.value = withRepeat(
            withTiming(-6, { duration: 2500 }),
            -1,
            true
        );
    }, []);
    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }]
    }));
    return (
        <View style={styles.iconContainer}>
            <Animated.View style={animatedStyle}><Cloud color={color} size={28} /></Animated.View>
            <Text style={[styles.iconText, { color }]}>SKY</Text>
        </View>
    );
};

const TableInput = ({ value, onChange, editable = true, theme, styles }) => (
    <TextInput
        style={[styles.inputCell, { color: theme.text }]}
        placeholder="..."
        placeholderTextColor={theme.muted}
        multiline
        value={value}
        onChangeText={onChange}
        editable={editable}
    />
);

// ── Main Component ──────────────────────────────────────────────────

export default function UnifiedRubric() {
    const router = useRouter();
    const { theme } = useTheme();
    const { user, profile, activeStudentId, activeStudentProfile, setActiveStudentProfile } = useAuth();
    const accentColor = gems.citrine;
    const styles = getStyles(theme, accentColor);

    const targetUserId = activeStudentId || user?.id;
    const targetProfile = activeStudentProfile || profile;
    const isStudent = user?.role === 'student';

    // ── STEP 1 STATE (Selection) ────────────────────────────
    const [domain, setDomain] = useState('');
    const [goal, setGoal] = useState([]);
    const [competency, setCompetency] = useState([]);
    const [activities, setActivities] = useState('');

    // ── STEP 2 STATE (Rubric) ──────────────────────────────
    const [matrix, setMatrix] = useState({
        "0-0": "", "0-1": "", "0-2": "",
        "1-0": "", "1-1": "", "1-2": "",
        "2-0": "", "2-1": "", "2-2": ""
    });
    const [teacherFeedback, setTeacherFeedback] = useState("");
    const [selfAssessment, setSelfAssessment] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);

    // ── LOAD DATA ──────────────────────────────────────────
    useEffect(() => {
        if (user?.role === 'student') {
            router.replace("/StudentHomepage");
            return;
        }
        if (!targetUserId) return;

        const fetchProfile = async () => {
            try {
                setIsLoading(true);
                // Artificial delay for backend sync stability
                await new Promise(resolve => setTimeout(resolve, 500));

                const res = await fetch(`${API_URL}/students/profile/${targetUserId}`);
                const data = await res.json();
                console.log(`[UnifiedRubric] Fetched data for ${targetUserId}:`, data);

                if (data && (data.assessments || data.backupUnified)) {
                    const source = typeof data.assessments === 'string'
                        ? JSON.parse(data.assessments) : (data.assessments || data.backupUnified || {});

                    // Step 1 data: Map IDs to Text for dropdowns
                    if (source.domain) setDomain(source.domain);
                    if (source.goal) {
                        const gList = Array.isArray(source.goal) ? source.goal : [source.goal];
                        const gTexts = gList.map(id => {
                            const found = curricularGoals.find(cg => cg.id === id);
                            return found ? found.text : id;
                        });
                        setGoal(gTexts);
                    }
                    if (source.competency) {
                        const cList = Array.isArray(source.competency) ? source.competency : [source.competency];
                        const cTexts = cList.map(id => {
                            const found = competencies.find(c => c.id === id);
                            return found ? found.text : id;
                        });
                        setCompetency(cTexts);
                    }
                    if (source.activities) setActivities(source.activities);

                    // Step 2 data: Matrix
                    if (source.rubricTable) {
                        setMatrix(source.rubricTable);
                    } else if (source.cellTexts) {
                        const seeded = source.cellTexts;
                        const newMatrix = { ...matrix };
                        if (seeded["1"]) newMatrix["0-0"] = seeded["1"];
                        if (seeded["2"]) newMatrix["0-1"] = seeded["2"];
                        if (seeded["3"]) newMatrix["0-2"] = seeded["3"];
                        if (seeded["11"]) newMatrix["1-0"] = seeded["11"];
                        if (seeded["12"]) newMatrix["1-1"] = seeded["12"];
                        if (seeded["13"]) newMatrix["1-2"] = seeded["13"];
                        setMatrix(newMatrix);
                    }

                    // Step 3: Feedback
                    if (source.teacherFeedback) setTeacherFeedback(source.teacherFeedback);
                    if (source.selfAssessment) setSelfAssessment(source.selfAssessment);
                } else {
                    console.log("[UnifiedRubric] No existing data found.");
                }
            } catch (err) {
                console.warn("[UnifiedRubric] Fetch failed:", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchProfile();
    }, [targetUserId]);

    const goalOptions = useMemo(() => curricularGoals.map(g => g.text), []);
    const competencyOptions = useMemo(() => competencies.map(c => c.text), []);

    const updateCell = (row, col, text) => {
        setMatrix(prev => ({ ...prev, [`${row}-${col}`]: text }));
    };

    // Auto-Save Logic
    useEffect(() => {
        if (!targetUserId || isLoading || !isSyncing) {
            if (!isLoading) setIsSyncing(true); // First load finish
            return;
        }

        const timer = setTimeout(() => {
            const saveSilently = async () => {
                try {
                    const currentAssess = typeof targetProfile?.assessments === 'string'
                        ? JSON.parse(targetProfile.assessments) : (targetProfile?.assessments || {});

                    const updatedAssess = { 
                        ...currentAssess, 
                        domain, goal, competency, activities,
                        rubricTable: matrix,
                        teacherFeedback,
                        selfAssessment
                    };

                    await fetch(`${API_URL}/students/profile`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            userId: targetUserId,
                            registrationNumber: targetProfile?.registration_number,
                            role: user?.role || 'student',
                            assessments: updatedAssess
                        })
                    });
                } catch (e) {}
            };
            saveSilently();
        }, 2000);

        return () => clearTimeout(timer);
    }, [domain, goal, competency, activities, matrix, teacherFeedback, selfAssessment]);

    const handleFinish = async () => {
        if (isLoading) {
            Alert.alert("Please Wait", "Still loading assessment data...");
            return;
        }

        if (user?.role !== 'student' && !activeStudentId) {
            Alert.alert("No Student Selected", "Please select a student first.");
            router.replace("/TeacherTracking");
            return;
        }

        setIsSyncing(true);
        if (targetUserId) {
            try {
                const currentAssess = typeof targetProfile?.assessments === 'string'
                    ? JSON.parse(targetProfile.assessments || '{}')
                    : (targetProfile?.assessments || {});

                const matrixIsEmpty = Object.values(matrix).every(v => !v);
                if (matrixIsEmpty && currentAssess.rubricTable) {
                    console.warn("[UnifiedRubric] Blocked empty grid overwrite.");
                }

                const updatedAssess = { 
                    ...currentAssess, 
                    domain, goal, competency, activities,
                    rubricTable: matrix,
                    teacherFeedback,
                    selfAssessment
                };

                const res = await fetch(`${API_URL}/students/profile`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId: targetUserId,
                        registrationNumber: targetProfile?.registration_number,
                        role: user?.role || 'student',
                        assessments: updatedAssess
                    })
                });

                if (res.ok && activeStudentId) {
                    setActiveStudentProfile({ ...targetProfile, assessments: updatedAssess });
                }
            } catch (err) {
                Alert.alert("Error", "Failed to sync assessment data.");
            }
        }
    };

    const handleBackup = async () => {
        if (!targetUserId) return;
        setIsSyncing(true);
        try {
            const currentAssess = { domain, goal, competency, activities, rubricTable: matrix, teacherFeedback, selfAssessment };
            await fetch(`${API_URL}/students/profile`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: targetUserId,
                    registrationNumber: targetProfile?.registration_number,
                    role: user?.role || 'student',
                    backupUnified: currentAssess
                })
            });
            Alert.alert("Archive Sync", "A full snapshot has been archived.");
        } catch (err) {
            Alert.alert("Sync Error", "Failed to archive data.");
        } finally {
            setIsSyncing(false);
        }
    };

    return (
        <View style={{ flex: 1 }}>
            <StatusBar translucent barStyle="light-content" />
            <PremiumBackground gemColor={accentColor} />

            <SafeAreaView style={{ flex: 1 }}>
                <View style={styles.header}>
                    <MenuDropdown />
                    <View style={{ flex: 1, alignItems: 'center' }}>
                        <Text style={styles.headerTitle}>Part B: Holistic Progress</Text>
                        <TouchableOpacity onPress={handleBackup} disabled={isSyncing} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={styles.headerSub}>Rubric & Selection Engine</Text>
                            {isSyncing ? <ActivityIndicator size="small" color={accentColor} /> : <CloudUpload color={accentColor} size={14} />}
                        </TouchableOpacity>
                    </View>
                    <View style={{ width: 44 }} />
                </View>

                <ScrollView 
                    style={styles.scroll} 
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* SECTION 1: DOMAIN & GOALS */}
                    <Animated.View entering={FadeInDown.delay(100)} style={styles.card}>
                        <Text style={styles.sectionLabel}>🌿 SELECTION PARAMETERS</Text>
                        
                        <View style={styles.fieldBlock}>
                            <Text style={styles.fieldLabel}>DEVELOPMENTAL DOMAIN</Text>
                            <SleekDropdown
                                options={domains}
                                selectedValue={domain}
                                onSelect={setDomain}
                            />
                        </View>

                        <View style={styles.fieldBlock}>
                            <View style={styles.labelRow}>
                                <Text style={styles.fieldLabel}>CURRICULAR GOALS</Text>
                                <InfoModal title="Curricular Goals" items={curricularGoals} />
                            </View>
                            <SleekDropdown
                                options={goalOptions}
                                selectedValue={goal}
                                onSelect={setGoal}
                                multiple
                            />
                        </View>

                        <View style={styles.fieldBlock}>
                            <View style={styles.labelRow}>
                                <Text style={styles.fieldLabel}>COMPETENCIES</Text>
                                <InfoModal title="Competencies" items={competencies} />
                            </View>
                            <SleekDropdown
                                options={competencyOptions}
                                selectedValue={competency}
                                onSelect={setCompetency}
                                multiple
                            />
                        </View>

                        <View style={styles.fieldBlock}>
                            <Text style={styles.fieldLabel}>SUPPORTING ACTIVITIES</Text>
                            <TextInput
                                style={styles.textArea}
                                placeholder="List activities used for assessment..."
                                placeholderTextColor={theme.muted + '80'}
                                multiline
                                value={activities}
                                onChangeText={setActivities}
                            />
                        </View>
                    </Animated.View>

                    {/* SECTION 2: RUBRIC GRID */}
                    <Animated.View entering={FadeInDown.delay(200)} style={[styles.card, { marginTop: 20 }]}>
                        <Text style={styles.sectionLabel}>📊 ASSESSMENT RUBRIC</Text>
                        <Text style={styles.note}>Provide reasons for performance levels against abilities.</Text>
                        
                        <View style={styles.table}>
                            <View style={styles.row}>
                                <View style={[styles.headerCellBase, { width: '28%' }]}>
                                    <Text style={styles.headerTitles}>ABILITY</Text>
                                </View>
                                <View style={[styles.headerCellBase, { width: '24%' }]}><AnimatedWaves color={theme.text} styles={styles} /></View>
                                <View style={[styles.headerCellBase, { width: '24%' }]}><AnimatedMountain color={theme.text} styles={styles} /></View>
                                <View style={[styles.headerCellBase, { width: '24%', borderRightWidth: 0 }]}><AnimatedSky color={theme.text} styles={styles} /></View>
                            </View>

                            {/* Row: Awareness */}
                            <View style={styles.row}>
                                <View style={[styles.headerCellBase, { width: '28%' }]}>
                                     <View style={styles.sideHeader}>
                                         <Eye color={theme.text} size={20} />
                                         <Text style={styles.sideIconText}>AWARENESS</Text>
                                     </View>
                                </View>
                                <View style={[styles.cellBase, { width: '24%' }]}><TableInput value={matrix["0-0"]} onChange={(t) => updateCell(0, 0, t)} theme={theme} styles={styles} /></View>
                                <View style={[styles.cellBase, { width: '24%' }]}><TableInput value={matrix["0-1"]} onChange={(t) => updateCell(0, 1, t)} theme={theme} styles={styles} /></View>
                                <View style={[styles.cellBase, { width: '24%', borderRightWidth: 0 }]}><TableInput value={matrix["0-2"]} onChange={(t) => updateCell(0, 2, t)} theme={theme} styles={styles} /></View>
                            </View>

                            {/* Row: Sensitivity */}
                            <View style={styles.row}>
                                <View style={[styles.headerCellBase, { width: '28%' }]}>
                                    <View style={styles.sideHeader}>
                                        <Feather color={theme.text} size={20} />
                                        <Text style={styles.sideIconText}>SENSITIVITY</Text>
                                    </View>
                                </View>
                                <View style={[styles.cellBase, { width: '24%' }]}><TableInput value={matrix["1-0"]} onChange={(t) => updateCell(1, 0, t)} theme={theme} styles={styles} /></View>
                                <View style={[styles.cellBase, { width: '24%' }]}><TableInput value={matrix["1-1"]} onChange={(t) => updateCell(1, 1, t)} theme={theme} styles={styles} /></View>
                                <View style={[styles.cellBase, { width: '24%', borderRightWidth: 0 }]}><TableInput value={matrix["1-2"]} onChange={(t) => updateCell(1, 2, t)} theme={theme} styles={styles} /></View>
                            </View>

                            {/* Row: Creativity */}
                            <View style={[styles.row, { borderBottomWidth: 0 }]}>
                                <View style={[styles.headerCellBase, { width: '28%' }]}>
                                    <View style={styles.sideHeader}>
                                        <Wand2 color={theme.text} size={20} />
                                        <Text style={styles.sideIconText}>CREATIVITY</Text>
                                    </View>
                                </View>
                                <View style={[styles.cellBase, { width: '24%' }]}><TableInput value={matrix["2-0"]} onChange={(t) => updateCell(2, 0, t)} theme={theme} styles={styles} /></View>
                                <View style={[styles.cellBase, { width: '24%' }]}><TableInput value={matrix["2-1"]} onChange={(t) => updateCell(2, 1, t)} theme={theme} styles={styles} /></View>
                                <View style={[styles.cellBase, { width: '24%', borderRightWidth: 0 }]}><TableInput value={matrix["2-2"]} onChange={(t) => updateCell(2, 2, t)} theme={theme} styles={styles} /></View>
                            </View>
                        </View>
                    </Animated.View>

                    {/* SECTION 3: FEEDBACK */}
                    <Animated.View entering={FadeInDown.delay(300)} style={[styles.card, { marginTop: 20 }]}>
                        <Text style={styles.sectionLabel}>✍️ QUALITATIVE FEEDBACK</Text>
                        
                        <View style={styles.fieldBlock}>
                            <Text style={styles.fieldLabel}>TEACHER FEEDBACK</Text>
                            <TextInput
                                style={styles.textArea}
                                placeholder="Enter specific observations..."
                                placeholderTextColor={theme.muted + '80'}
                                multiline
                                value={teacherFeedback}
                                onChangeText={setTeacherFeedback}
                            />
                        </View>

                        <View style={styles.fieldBlock}>
                            <Text style={styles.fieldLabel}>SELF ASSESSMENT</Text>
                            <TextInput
                                style={styles.textArea}
                                placeholder="Student's own reflections..."
                                placeholderTextColor={theme.muted + '80'}
                                multiline
                                value={selfAssessment}
                                onChangeText={setSelfAssessment}
                            />
                        </View>
                    </Animated.View>

                    <GemButton 
                        gemType="citrine"
                        style={{marginTop: 30}}
                        onPress={handleFinish}
                        disabled={isLoading}
                    >
                        {isLoading ? <ActivityIndicator color={theme.buttonText} /> : <Text style={styles.finishBtnText}>FINALIZE ASSESSMENT</Text>}
                    </GemButton>
                    
                    <View style={{ height: 100 }} />
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

const getStyles = (theme, accentColor) => StyleSheet.create({
    scroll: { flex: 1 },
    scrollContent: { padding: 20 },
    header: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15 },
    backBtn: { width: 44, height: 44, justifyContent: 'center' },
    headerTitle: { color: theme.text, fontSize: 18, fontWeight: '300', letterSpacing: 2, textTransform: 'uppercase', fontFamily: "Jost_300Light" },
    headerSub: { color: accentColor, fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, fontFamily: "Jost_600SemiBold" },
    card: { backgroundColor: theme.surface + 'E6', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: theme.border },
    sectionLabel: { color: accentColor, fontSize: 11, fontWeight: '600', letterSpacing: 1, marginBottom: 15, fontFamily: "Jost_600SemiBold" },
    fieldBlock: { marginBottom: 20 },
    fieldLabel: { color: theme.secondaryText, fontSize: 10, fontWeight: '300', marginBottom: 10, letterSpacing: 0.5, fontFamily: "Jost_300Light" },
    labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    textArea: { backgroundColor: 'transparent', color: theme.text, fontSize: 13, minHeight: 80, textAlignVertical: 'top', borderBottomWidth: StyleSheet.hairlineWidth, borderColor: accentColor + '80', fontFamily: "Jost_400Regular" },
    note: { fontSize: 10, color: theme.muted, marginBottom: 15, fontStyle: 'italic', fontFamily: "Jost_300Light" },
    table: { borderWidth: 1, borderRadius: 16, overflow: 'hidden', borderColor: theme.border },
    row: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: theme.border, minHeight: 80 },
    headerCellBase: { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center', borderRightWidth: 1, borderRightColor: theme.border, padding: 5 },
    cellBase: { justifyContent: 'center', borderRightWidth: 1, borderRightColor: theme.border, backgroundColor: theme.surface },
    headerTitles: { fontSize: 8, fontWeight: '600', color: theme.secondaryText, textAlign: 'center', fontFamily: "Jost_600SemiBold" },
    iconContainer: { alignItems: 'center', gap: 2 },
    iconText: { fontSize: 7, fontWeight: '300', fontFamily: "Jost_300Light" },
    sideHeader: { alignItems: 'center', gap: 4 },
    sideIconText: { fontSize: 7, fontWeight: '300', color: theme.secondaryText, fontFamily: "Jost_300Light" },
    inputCell: { flex: 1, fontSize: 11, textAlign: 'center', padding: 4, fontFamily: "Jost_400Regular" },
    finishBtnText: { color: theme.buttonText, fontWeight: '600', letterSpacing: 2, fontSize: 12, fontFamily: "Jost_600SemiBold" }
});
