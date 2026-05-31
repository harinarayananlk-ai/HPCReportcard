import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView, TextInput, StatusBar, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme, useAuth, API_URL } from '../../context/GlobalContext';
import { Ionicons } from '@expo/vector-icons';

import Animated, { FadeInDown, useSharedValue, useAnimatedStyle, withTiming, withSequence, withRepeat, runOnJS } from 'react-native-reanimated';
import { Waves, Mountain, Cloud, Eye, Feather, Wand2, CloudUpload } from 'lucide-react-native';
import { ActivityIndicator } from 'react-native';
import PremiumBackground from '../../components/PremiumBackground';
import SoundButton from '../../components/SoundButton';
import { Image } from 'expo-image';
import InfoModal from './InfoModal';
import { gems } from '../../colour_themes';
import GemButton from '../../components/GemButton';
import MenuDropdown from '../../components/MenuDropdown';

// ── Theme-aware Animated Icons ──────────────────────────────────────────

const AnimatedWaves = ({ color, styles, active }) => {
    const offset = useSharedValue(0);
    useEffect(() => {
        offset.value = withRepeat(
            withSequence(
                withTiming(4, { duration: 1500 }),
                withTiming(-4, { duration: 1500 })
            ), -1, true
        );
    }, []);
    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: offset.value }]
    }));
    return (
        <View style={[styles.iconContainer, active && styles.activeIconContainer]}>
            <Animated.View style={animatedStyle}><Waves color={color} size={26} /></Animated.View>
            <Text style={[styles.iconText, { color }]}>STREAM</Text>
        </View>
    );
};

const AnimatedMountain = ({ color, styles, active }) => {
    const scale = useSharedValue(1);
    useEffect(() => {
        scale.value = withRepeat(withTiming(1.15, { duration: 2000 }), -1, true);
    }, []);
    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
        opacity: withTiming(scale.value > 1.1 ? 0.9 : 1)
    }));
    return (
        <View style={[styles.iconContainer, active && styles.activeIconContainer]}>
            <Animated.View style={animatedStyle}><Mountain color={color} size={26} /></Animated.View>
            <Text style={[styles.iconText, { color }]}>MOUNTAIN</Text>
        </View>
    );
};

const AnimatedSky = ({ color, styles, active }) => {
    const translateY = useSharedValue(0);
    useEffect(() => {
        translateY.value = withRepeat(withTiming(-6, { duration: 2500 }), -1, true);
    }, []);
    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }]
    }));
    return (
        <View style={[styles.iconContainer, active && styles.activeIconContainer]}>
            <Animated.View style={animatedStyle}><Cloud color={color} size={26} /></Animated.View>
            <Text style={[styles.iconText, { color }]}>SKY</Text>
        </View>
    );
};

const TableInput = ({ value, onChange, editable = true, theme, styles, onFocus }) => (
    <TextInput
        style={[styles.inputCell, { color: theme.text }]}
        placeholder="..."
        placeholderTextColor={theme.secondaryText + '60'}
        multiline
        value={value}
        onChangeText={onChange}
        onFocus={onFocus}
        editable={editable}
    />
);

// ── Image Sources (preloaded) ───────────────────────────────────────────
const IMAGE_SOURCES = {
    none: require('../../assets/images/visily-image-removebg-preview.png'),
    river: require('../../assets/images/river.png'),
    mountain: require('../../assets/images/mountain+river.png'),
    sky: require('../../assets/images/ChatGPT_Image_May_11__2026__02_55_58_PM-removebg-preview.png'),
};

export default function RubricPage() {
    const { user, profile, activeStudentId, activeStudentProfile, setActiveStudentProfile } = useAuth();
    const { theme } = useTheme();
    const router = useRouter();
    const styles = getStyles(theme);

    useEffect(() => {
        router.replace('/part_b_s1/SelectionPage');
    }, []);

    const targetUserId = activeStudentId || user?.id;
    const targetProfile = activeStudentProfile || profile;
    const isStudent = user?.role === 'student';

    const [activeLevel, setActiveLevel] = useState('none');
    const columnLevels = ['river', 'mountain', 'sky'];
    const [matrix, setMatrix] = useState({
        "0-0": "", "0-1": "", "0-2": "",
        "1-0": "", "1-1": "", "1-2": "",
        "2-0": "", "2-1": "", "2-2": ""
    });

    const [isLoading, setIsLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);

    // Crossfade animation for RMS image
    const imageOpacity = useSharedValue(1);
    const [currentSource, setCurrentSource] = useState(IMAGE_SOURCES.none);

    const updateSource = () => {
        setCurrentSource(IMAGE_SOURCES[activeLevel] || IMAGE_SOURCES.none);
        imageOpacity.value = withTiming(1, { duration: 400 });
    };

    useEffect(() => {
        imageOpacity.value = withTiming(0, { duration: 250 }, (finished) => {
            if (finished) runOnJS(updateSource)();
        });
    }, [activeLevel]);

    const animatedImageStyle = useAnimatedStyle(() => ({
        opacity: imageOpacity.value
    }));

    useEffect(() => {
        if (targetUserId) {
            const fetchProfile = async () => {
                try {
                    setIsLoading(true);
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
        } else {
            setIsLoading(false);
        }
    }, [targetUserId]);

    const handleNext = async () => {
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
                    rubricTable: matrix
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
                Alert.alert("Saved", "Rubric data saved.");
            } catch (err) {
                console.error("[RubricPage] Finish error:", err);
            } finally {
                setIsSyncing(false);
            }
        }
        router.push('/part_b_s1/TeacherFeedbackPage');
    };

    const handleBackup = async () => {
        if (!targetUserId) return;
        setIsSyncing(true);
        try {
            const currentRubric = { rubricTable: matrix };
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
            <PremiumBackground />

            <SafeAreaView style={{ flex: 1 }}>
            <StatusBar translucent barStyle={theme.isDark ? "light-content" : "dark-content"} backgroundColor="transparent" />

            <View style={styles.header}>
                <MenuDropdown />
                <View style={{ flex: 1, marginLeft: 16 }}>
                    <Text style={styles.title}>Part B2: Rubric</Text>
                    <TouchableOpacity onPress={handleBackup} disabled={isSyncing} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={{ fontSize: 10, color: theme.secondaryText, fontWeight: '700', letterSpacing: 1 }}>CLOUD ARCHIVE</Text>
                        {isSyncing ? <ActivityIndicator size="small" color={theme.primary} /> : <CloudUpload color={theme.primary} size={14} />}
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
                <Animated.Text entering={FadeInDown.delay(100)} style={styles.note}>
                    NOTE: THIS IS AN ASSESSMENT RUBRIC. PLEASE ENSURE THAT YOU COMPLETE THE ASSESSMENT BY WRITING THE REASON AGAINST EACH CORRESPONDING ABILITY AND PERFORMANCE LEVEL.
                </Animated.Text>

                {/* ── Prominent RMS Valley Image ─────────────────────────── */}
                <Animated.View entering={FadeInDown.delay(150)} style={styles.imageFrame}>
                    <Animated.View style={[styles.imageInner, animatedImageStyle]}>
                        <Image 
                            source={currentSource} 
                            style={styles.valleyImage} 
                            contentFit="contain"
                            transition={200}
                        />
                    </Animated.View>
                    <Text style={styles.imageCaption}>
                        {activeLevel === 'none' ? 'Tap a column to illuminate' : activeLevel === 'river' ? '◈ Stream Level' : activeLevel === 'mountain' ? '◈ Mountain Level' : '◈ Sky Level'}
                    </Text>
                </Animated.View>

                {/* ── Rubric Matrix ───────────────────────────────────────── */}
                <Animated.View entering={FadeInDown.delay(200)} style={styles.table}>

                    {/* Header Row */}
                    <View style={styles.row}>
                        <View style={[styles.headerCellBase, { width: '28%' }]}>
                            <Text style={styles.headerTitles}>MASTERY OF{'\n'}COGNITIVE{'\n'}ABILITIES</Text>
                        </View>
                        <View style={[styles.headerCellBase, { width: '24%' }]}>
                          <TouchableOpacity onPress={() => setActiveLevel('river')} style={styles.headerTouchable}>
                            <AnimatedWaves color={activeLevel === 'river' ? gems.sapphire : theme.text} styles={styles} active={activeLevel === 'river'} />
                          </TouchableOpacity>
                        </View>
                        <View style={[styles.headerCellBase, { width: '24%' }]}>
                          <TouchableOpacity onPress={() => setActiveLevel('mountain')} style={styles.headerTouchable}>
                            <AnimatedMountain color={activeLevel === 'mountain' ? gems.emerald : theme.text} styles={styles} active={activeLevel === 'mountain'} />
                          </TouchableOpacity>
                        </View>
                        <View style={[styles.headerCellBase, { width: '24%', borderRightWidth: 0 }]}>
                          <TouchableOpacity onPress={() => setActiveLevel('sky')} style={styles.headerTouchable}>
                            <AnimatedSky color={activeLevel === 'sky' ? gems.topaz : theme.text} styles={styles} active={activeLevel === 'sky'} />
                          </TouchableOpacity>
                        </View>
                    </View>

                    {/* Row 1: Awareness */}
                    <View style={styles.row}>
                        <View style={[styles.headerCellBase, { width: '28%' }]}>
                             <View style={styles.sideHeader}>
                                 <Eye color={theme.text} size={22} />
                                 <Text style={[styles.sideIconText, { color: theme.text }]}>AWARENESS</Text>
                                 <InfoModal title="Awareness" items={[{id: 'I', text: 'Being attentive, perceptive, cognizant...'}]} />
                             </View>
                        </View>
                        <View style={[styles.cellBase, { width: '24%' }]} pointerEvents={isStudent ? "none" : "auto"}>
                            <TableInput value={matrix["0-0"]} onChange={(t) => updateCell(0, 0, t)} editable={!isStudent} theme={theme} styles={styles} onFocus={() => setActiveLevel(columnLevels[0])} />
                        </View>
                        <View style={[styles.cellBase, { width: '24%' }]} pointerEvents={isStudent ? "none" : "auto"}>
                            <TableInput value={matrix["0-1"]} onChange={(t) => updateCell(0, 1, t)} editable={!isStudent} theme={theme} styles={styles} onFocus={() => setActiveLevel(columnLevels[1])} />
                        </View>
                        <View style={[styles.cellBase, { width: '24%', borderRightWidth: 0 }]} pointerEvents={isStudent ? "none" : "auto"}>
                            <TableInput value={matrix["0-2"]} onChange={(t) => updateCell(0, 2, t)} editable={!isStudent} theme={theme} styles={styles} onFocus={() => setActiveLevel(columnLevels[2])} />
                        </View>
                    </View>

                    {/* Row 2: Sensitivity */}
                    <View style={styles.row}>
                        <View style={[styles.headerCellBase, { width: '28%' }]}>
                            <View style={styles.sideHeader}>
                                <Feather color={theme.text} size={22} />
                                <Text style={[styles.sideIconText, { color: theme.text }]}>SENSITIVITY</Text>
                                <InfoModal title="Sensitivity" items={[{id: 'I', text: 'Managing and expressing emotions...'}]} />
                            </View>
                        </View>
                        <View style={[styles.cellBase, { width: '24%' }]} pointerEvents={isStudent ? "none" : "auto"}>
                            <TableInput value={matrix["1-0"]} onChange={(t) => updateCell(1, 0, t)} editable={!isStudent} theme={theme} styles={styles} onFocus={() => setActiveLevel(columnLevels[0])} />
                        </View>
                        <View style={[styles.cellBase, { width: '24%' }]} pointerEvents={isStudent ? "none" : "auto"}>
                            <TableInput value={matrix["1-1"]} onChange={(t) => updateCell(1, 1, t)} editable={!isStudent} theme={theme} styles={styles} onFocus={() => setActiveLevel(columnLevels[1])} />
                        </View>
                        <View style={[styles.cellBase, { width: '24%', borderRightWidth: 0 }]} pointerEvents={isStudent ? "none" : "auto"}>
                            <TableInput value={matrix["1-2"]} onChange={(t) => updateCell(1, 2, t)} editable={!isStudent} theme={theme} styles={styles} onFocus={() => setActiveLevel(columnLevels[2])} />
                        </View>
                    </View>

                    {/* Row 3: Creativity */}
                    <View style={[styles.row, { borderBottomWidth: 0 }]}>
                        <View style={[styles.headerCellBase, { width: '28%' }]}>
                            <View style={styles.sideHeader}>
                                <Wand2 color={theme.text} size={22} />
                                <Text style={[styles.sideIconText, { color: theme.text }]}>CREATIVITY</Text>
                                <InfoModal title="Creativity" items={[{id: 'I', text: 'Generating innovative solutions...'}]} />
                            </View>
                        </View>
                        <View style={[styles.cellBase, { width: '24%' }]} pointerEvents={isStudent ? "none" : "auto"}>
                            <TableInput value={matrix["2-0"]} onChange={(t) => updateCell(2, 0, t)} editable={!isStudent} theme={theme} styles={styles} onFocus={() => setActiveLevel(columnLevels[0])} />
                        </View>
                        <View style={[styles.cellBase, { width: '24%' }]} pointerEvents={isStudent ? "none" : "auto"}>
                            <TableInput value={matrix["2-1"]} onChange={(t) => updateCell(2, 1, t)} editable={!isStudent} theme={theme} styles={styles} onFocus={() => setActiveLevel(columnLevels[1])} />
                        </View>
                        <View style={[styles.cellBase, { width: '24%', borderRightWidth: 0 }]} pointerEvents={isStudent ? "none" : "auto"}>
                            <TableInput value={matrix["2-2"]} onChange={(t) => updateCell(2, 2, t)} editable={!isStudent} theme={theme} styles={styles} onFocus={() => setActiveLevel(columnLevels[2])} />
                        </View>
                    </View>
                </Animated.View>

                <GemButton
                    gemType="silver"
                    onPress={handleNext}
                    disabled={isLoading}
                    width={180}
                    style={styles.finishBtn}
                >
                    {isLoading ? (
                        <ActivityIndicator color={theme.buttonText} />
                    ) : (
                        <View style={{ alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                            <Text style={[styles.finishBtnText, { textAlign: 'center' }]}>{"Proceed to\nTeacher's\nFeedback"}</Text>
                            <Ionicons name="arrow-forward" size={16} color="#FFF" />
                        </View>
                    )}
                </GemButton>
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
    title: { fontSize: 20, fontWeight: '800', color: theme.text, fontFamily: 'Jost_600SemiBold', letterSpacing: 1 },
    scrollContent: { padding: 15 },
    note: { 
        fontSize: 9, fontWeight: '800', marginBottom: 20, textTransform: 'uppercase', 
        letterSpacing: 0.5, lineHeight: 14, color: theme.primary, 
        backgroundColor: theme.isDark ? 'rgba(140,115,62,0.12)' : 'rgba(46,88,148,0.08)', 
        padding: 10, borderRadius: 10, borderWidth: 1, borderColor: theme.primary + '25'
    },

    // ── RMS Image Frame ─────────────────────────────────────────────────
    imageFrame: {
        alignItems: 'center',
        marginBottom: 20,
        backgroundColor: theme.card,
        borderRadius: 20,
        paddingVertical: 20,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: theme.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 6,
    },
    imageInner: {
        width: '100%',
        alignItems: 'center',
    },
    valleyImage: { 
        width: 220, 
        height: 220,
    },
    imageCaption: {
        marginTop: 10,
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 2,
        color: theme.secondaryText,
        textTransform: 'uppercase',
        fontFamily: 'Jost_600SemiBold',
    },

    // ── Table ───────────────────────────────────────────────────────────
    table: { 
        borderWidth: 1, borderRadius: 16, overflow: 'hidden', 
        borderColor: theme.border, backgroundColor: theme.card,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    row: { flexDirection: 'row', minHeight: 110, borderBottomWidth: 1, borderBottomColor: theme.border },
    headerCellBase: { 
        padding: 5, justifyContent: 'center', alignItems: 'center', 
        borderRightWidth: 1, borderRightColor: theme.border, 
        backgroundColor: theme.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' 
    },
    headerTouchable: { 
        flex: 1, justifyContent: 'center', alignItems: 'center', 
        paddingVertical: 8,
    },
    cellBase: { padding: 4, justifyContent: 'center', borderRightWidth: 1, borderRightColor: theme.border },
    headerTitles: { fontSize: 8, fontWeight: '800', textAlign: 'center', color: theme.secondaryText, letterSpacing: 0.5 },
    iconContainer: { 
        alignItems: 'center', justifyContent: 'center', gap: 4, 
        paddingVertical: 4, paddingHorizontal: 6, borderRadius: 10,
    },
    activeIconContainer: {
        backgroundColor: theme.isDark ? 'rgba(140,115,62,0.15)' : 'rgba(46,88,148,0.08)',
    },
    iconText: { fontSize: 7, fontWeight: '800', marginTop: 3, letterSpacing: 1 },
    sideHeader: { alignItems: 'center', gap: 4 },
    sideIconText: { fontSize: 8, fontWeight: '800', textAlign: 'center', letterSpacing: 0.5 },
    inputCell: { flex: 1, fontSize: 11, textAlignVertical: 'top', textAlign: 'center', padding: 5 },

    // ── Bottom Button ───────────────────────────────────────────────────
    finishBtn: { 
        marginTop: 30,
        alignSelf: 'center',
    },
    finishBtnText: { color: theme.buttonText, fontWeight: '800', fontSize: 12, letterSpacing: 1, textAlign: 'center' }
});
