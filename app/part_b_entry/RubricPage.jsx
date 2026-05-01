import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView, TextInput, StatusBar, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme, useAuth, API_URL } from '../../context/GlobalContext';
import InfoModal from './InfoModal';
import Animated, { FadeInDown, useSharedValue, useAnimatedStyle, withTiming, withSequence, withRepeat } from 'react-native-reanimated';
import { Waves, Mountain, Cloud, Eye, Feather, Wand2, CloudUpload } from 'lucide-react-native';
import { ActivityIndicator } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import SoundButton from '../../components/SoundButton';

// ── Theme-aware Icons ──────────────────────────────────────────────────

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

// ... Row components here or use inline
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

export default function RubricPage() {
    const { user, profile, activeStudentId, activeStudentProfile, setActiveStudentProfile } = useAuth();
    const { theme } = useTheme();
    const router = useRouter();
    const styles = getStyles(theme);

    const targetUserId = activeStudentId || user?.id;
    const targetProfile = activeStudentProfile || profile;
    const isStudent = user?.role === 'student';

    const [matrix, setMatrix] = useState({
        "0-0": "", "0-1": "", "0-2": "",
        "1-0": "", "1-1": "", "1-2": "",
        "2-0": "", "2-1": "", "2-2": ""
    });

    const [teacherFeedback, setTeacherFeedback] = useState("");
    const [selfAssessment, setSelfAssessment] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);
    const player = useVideoPlayer(require('../../assets/images/Background_animation_forest.mp4'), (p) => {
        p.loop = true;
        p.play();
        p.muted = true;
    });

    useEffect(() => {
        if (user?.role === 'student') {
            router.replace("/StudentHomepage");
            return;
        }
        if (targetUserId) {
            const fetchProfile = async () => {
                try {
                    setIsLoading(true);
                    // User suggested waiting a bit for backend consistency
                    await new Promise(resolve => setTimeout(resolve, 500));

                    const res = await fetch(`${API_URL}/students/profile/${targetUserId}`);
                    const data = await res.json();
                    console.log(`[RubricPage] Fetched data for ${targetUserId}:`, data);

                    if (data && (data.assessments || data.backupAssessments)) {
                        const assess = typeof data.assessments === 'string' ? JSON.parse(data.assessments) : (data.assessments || {});
                        
                        // Plan 3: Support legacy cellTexts and backupRubric
                        const rubricData = assess.rubricTable || 
                                          (data.backupRubric ? (typeof data.backupRubric === 'string' ? JSON.parse(data.backupRubric) : data.backupRubric) : null) ||
                                          (assess.cellTexts) || null;

                        if (rubricData) setMatrix(prev => ({ ...prev, ...rubricData }));
                        if (assess.teacherFeedback) setTeacherFeedback(assess.teacherFeedback);
                        if (assess.selfAssessment) setSelfAssessment(assess.selfAssessment);
                    } else if (data && data.cellTexts) {
                        // Legacy seed data autofill
                        const seeded = typeof data.cellTexts === 'string' ? JSON.parse(data.cellTexts) : data.cellTexts;
                        const newMatrix = { ...matrix };
                        if (seeded["1"]) newMatrix["0-0"] = seeded["1"];
                        if (seeded["2"]) newMatrix["0-1"] = seeded["2"];
                        if (seeded["3"]) newMatrix["0-2"] = seeded["3"];
                        if (seeded["11"]) newMatrix["1-0"] = seeded["11"];
                        if (seeded["12"]) newMatrix["1-1"] = seeded["12"];
                        if (seeded["13"]) newMatrix["1-2"] = seeded["13"];
                        setMatrix(newMatrix);
                    } else {
                        console.log("[RubricPage] No existing rubric data found.");
                    }
                } catch (err) {
                    console.warn("[RubricPage] Fetch failed:", err);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchProfile();
        }
    }, [targetUserId]);

    const handleFinish = async () => {
        // Plan 1: Critical Guard
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
                    ? JSON.parse(targetProfile.assessments) : (targetProfile?.assessments || {});

                // Extra protection: if current matrix is empty but DB has data, block overwrite
                const matrixIsEmpty = Object.values(matrix).every(v => !v);
                if (matrixIsEmpty && currentAssess.rubricTable) {
                    console.warn("[RubricPage] Blocked empty grid overwrite.");
                }

                const updatedAssess = { 
                    ...currentAssess, 
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
                Alert.alert("Success", "Assessment complete!");
            } catch (err) {
                console.error("[RubricPage] Finish error:", err);
            } finally {
                setIsSyncing(false);
            }
        }
        router.push('/part_b/transition');
    };

    const handleBackup = async () => {
        if (!targetUserId) return;
        setIsSyncing(true);
        try {
            const currentRubric = { rubricTable: matrix, teacherFeedback, selfAssessment };
            await fetch(`${API_URL}/students/profile`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: targetUserId,
                    registrationNumber: targetProfile?.registration_number,
                    role: user?.role || 'student',
                    backupRubric: currentRubric
                })
            });
            Alert.alert("Archive Sync", "A secondary copy of this rubric has been archived.");
        } catch (err) {
            Alert.alert("Sync Error", "Failed to archive rubric.");
        } finally {
            setIsSyncing(false);
        }
    };

    const updateCell = (row, col, text) => {
        setMatrix(prev => ({ ...prev, [`${row}-${col}`]: text }));
    };

    return (
        <View style={{ flex: 1, backgroundColor: theme.background }}>
            {/* Cinematic Video Background */}
            <VideoView
                player={player}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                nativeControls={false}
            />
            {/* Dark overlay */}
            <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.4)' }]} />

            <SafeAreaView style={{ flex: 1 }}>
            <StatusBar translucent barStyle={theme.isDark ? "light-content" : "dark-content"} backgroundColor="transparent" />

            <View style={styles.header}>
                <SoundButton onPress={() => router.back()} style={styles.backBtn}>
                    <Text style={{color: theme.text, fontSize: 24, fontWeight: '800'}}>←</Text>
                </SoundButton>
                <View style={{ flex: 1 }}>
                    <Text style={styles.title}>Part B2: Rubric</Text>
                    <TouchableOpacity onPress={handleBackup} disabled={isSyncing} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={{ fontSize: 10, color: theme.muted, fontWeight: '700' }}>CLOUD ARCHIVE</Text>
                        {isSyncing ? <ActivityIndicator size="small" color={theme.primary} /> : <CloudUpload color={theme.primary} size={14} />}
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
                <Animated.Text entering={FadeInDown.delay(100)} style={styles.note}>
                    NOTE: THIS IS AN ASSESSMENT RUBRIC. PLEASE ENSURE THAT YOU COMPLETE THE ASSESSMENT BY WRITING THE REASON AGAINST EACH CORRESPONDING ABILITY AND PERFORMANCE LEVEL.
                </Animated.Text>

                <Animated.View entering={FadeInDown.delay(200)} style={styles.table}>
                    {/* Header Row */}
                    <View style={styles.row}>
                        <View style={[styles.headerCellBase, { width: '28%' }]}>
                            <Text style={styles.headerTitles}>MASTERY OF COGNITIVE ABILITIES</Text>
                        </View>
                        <View style={[styles.headerCellBase, { width: '24%' }]}><AnimatedWaves color={theme.text} styles={styles} /></View>
                        <View style={[styles.headerCellBase, { width: '24%' }]}><AnimatedMountain color={theme.text} styles={styles} /></View>
                        <View style={[styles.headerCellBase, { width: '24%', borderRightWidth: 0 }]}><AnimatedSky color={theme.text} styles={styles} /></View>
                    </View>

                    {/* Row 1: Awareness */}
                    <View style={styles.row}>
                        <View style={[styles.headerCellBase, { width: '28%' }]}>
                             <View style={styles.sideHeader}>
                                 <Eye color={theme.text} size={24} />
                                 <Text style={[styles.sideIconText, { color: theme.text }]}>AWARENESS</Text>
                                 <InfoModal title="Awareness" items={[{id: 'I', text: 'Being attentive, perceptive, cognizant...'}]} />
                             </View>
                        </View>
                        <View style={[styles.cellBase, { width: '24%' }]} pointerEvents={isStudent ? "none" : "auto"}><TableInput value={matrix["0-0"]} onChange={(t) => updateCell(0, 0, t)} editable={!isStudent} theme={theme} styles={styles} /></View>
                        <View style={[styles.cellBase, { width: '24%' }]} pointerEvents={isStudent ? "none" : "auto"}><TableInput value={matrix["0-1"]} onChange={(t) => updateCell(0, 1, t)} editable={!isStudent} theme={theme} styles={styles} /></View>
                        <View style={[styles.cellBase, { width: '24%', borderRightWidth: 0 }]} pointerEvents={isStudent ? "none" : "auto"}><TableInput value={matrix["0-2"]} onChange={(t) => updateCell(0, 2, t)} editable={!isStudent} theme={theme} styles={styles} /></View>
                    </View>

                    {/* Row 2: Sensitivity */}
                    <View style={styles.row}>
                        <View style={[styles.headerCellBase, { width: '28%' }]}>
                            <View style={styles.sideHeader}>
                                <Feather color={theme.text} size={24} />
                                <Text style={[styles.sideIconText, { color: theme.text }]}>SENSITIVITY</Text>
                                <InfoModal title="Sensitivity" items={[{id: 'I', text: 'Managing and expressing emotions...'}]} />
                            </View>
                        </View>
                        <View style={[styles.cellBase, { width: '24%' }]} pointerEvents={isStudent ? "none" : "auto"}><TableInput value={matrix["1-0"]} onChange={(t) => updateCell(1, 0, t)} editable={!isStudent} theme={theme} styles={styles} /></View>
                        <View style={[styles.cellBase, { width: '24%' }]} pointerEvents={isStudent ? "none" : "auto"}><TableInput value={matrix["1-1"]} onChange={(t) => updateCell(1, 1, t)} editable={!isStudent} theme={theme} styles={styles} /></View>
                        <View style={[styles.cellBase, { width: '24%', borderRightWidth: 0 }]} pointerEvents={isStudent ? "none" : "auto"}><TableInput value={matrix["1-2"]} onChange={(t) => updateCell(1, 2, t)} editable={!isStudent} theme={theme} styles={styles} /></View>
                    </View>

                    {/* Row 3: Creativity */}
                    <View style={[styles.row, { borderBottomWidth: 0 }]}>
                        <View style={[styles.headerCellBase, { width: '28%' }]}>
                            <View style={styles.sideHeader}>
                                <Wand2 color={theme.text} size={24} />
                                <Text style={[styles.sideIconText, { color: theme.text }]}>CREATIVITY</Text>
                                <InfoModal title="Creativity" items={[{id: 'I', text: 'Generating innovative solutions...'}]} />
                            </View>
                        </View>
                        <View style={[styles.cellBase, { width: '24%' }]} pointerEvents={isStudent ? "none" : "auto"}><TableInput value={matrix["2-0"]} onChange={(t) => updateCell(2, 0, t)} editable={!isStudent} theme={theme} styles={styles} /></View>
                        <View style={[styles.cellBase, { width: '24%' }]} pointerEvents={isStudent ? "none" : "auto"}><TableInput value={matrix["2-1"]} onChange={(t) => updateCell(2, 1, t)} editable={!isStudent} theme={theme} styles={styles} /></View>
                        <View style={[styles.cellBase, { width: '24%', borderRightWidth: 0 }]} pointerEvents={isStudent ? "none" : "auto"}><TableInput value={matrix["2-2"]} onChange={(t) => updateCell(2, 2, t)} editable={!isStudent} theme={theme} styles={styles} /></View>
                    </View>
                </Animated.View>

                {/* Feedback Sections */}
                <View style={{ marginTop: 20 }}>
                    <Text style={styles.feedbackLabel}>TEACHER FEEDBACK</Text>
                    <TextInput
                        style={styles.feedbackArea}
                        multiline
                        placeholder="Write feedback here..."
                        placeholderTextColor={theme.muted}
                        value={teacherFeedback}
                        onChangeText={setTeacherFeedback}
                        textAlignVertical="top"
                    />
                </View>

                <View style={{ marginTop: 15 }}>
                    <Text style={styles.feedbackLabel}>SELF ASSESSMENT</Text>
                    <TextInput
                        style={styles.feedbackArea}
                        multiline
                        placeholder="Write self assessment here..."
                        placeholderTextColor={theme.muted}
                        value={selfAssessment}
                        onChangeText={setSelfAssessment}
                        textAlignVertical="top"
                    />
                </View>

                <TouchableOpacity 
                    style={[styles.finishBtn, isLoading && { opacity: 0.5 }]} 
                    onPress={handleFinish}
                    disabled={isLoading}
                >
                    {isLoading ? <ActivityIndicator color={theme.buttonText} /> : <Text style={styles.finishBtnText}>Finish Assessment & View Report →</Text>}
                </TouchableOpacity>
                <View style={{ height: 40 }} />
            </ScrollView>
            </SafeAreaView>
        </View>
    );
}

const getStyles = (theme) => StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 40 },
    backBtn: { padding: 10, marginRight: 10 },
    title: { fontSize: 20, fontWeight: '800', color: theme.text },
    scrollContent: { padding: 15 },
    note: { fontSize: 9, fontWeight: '800', marginBottom: 20, textTransform: 'uppercase', letterSpacing: 0.5, lineHeight: 14, color: theme.primary, backgroundColor: 'rgba(0,0,0,0.3)', padding: 8, borderRadius: 6 },
    table: { borderWidth: 1, borderRadius: 12, overflow: 'hidden', borderColor: theme.border, backgroundColor: theme.card },
    row: { flexDirection: 'row', minHeight: 110, borderBottomWidth: 1, borderBottomColor: theme.border },
    headerCellBase: { padding: 5, justifyContent: 'center', alignItems: 'center', borderRightWidth: 1, borderRightColor: theme.border, backgroundColor: 'rgba(0,0,0,0.1)' },
    cellBase: { padding: 4, justifyContent: 'center', borderRightWidth: 1, borderRightColor: theme.border },
    headerTitles: { fontSize: 9, fontWeight: '800', textAlign: 'center', color: theme.muted },
    iconContainer: { alignItems: 'center', justifyContent: 'center', gap: 4 },
    iconText: { fontSize: 8, fontWeight: '800', marginTop: 4 },
    sideHeader: { alignItems: 'center', gap: 4 },
    sideIconText: { fontSize: 8, fontWeight: '800', textAlign: 'center' },
    inputCell: { flex: 1, fontSize: 11, textAlignVertical: 'top', textAlign: 'center', padding: 5 },
    feedbackLabel: { fontSize: 12, fontWeight: '800', marginBottom: 8, letterSpacing: 1, color: theme.primary },
    feedbackArea: { minHeight: 100, borderWidth: 1, borderRadius: 12, padding: 16, fontSize: 13, borderColor: theme.border, backgroundColor: theme.card, color: theme.text },
    finishBtn: { marginTop: 30, paddingVertical: 18, borderRadius: 16, alignItems: 'center', backgroundColor: theme.primary },
    finishBtnText: { color: theme.buttonText, fontWeight: '800', fontSize: 16 }
});
