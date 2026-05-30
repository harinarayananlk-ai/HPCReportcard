import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView, TextInput, StatusBar, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme, useAuth, API_URL } from '../../context/GlobalContext';
import PremiumBackground from '../../components/PremiumBackground';
import SoundButton from '../../components/SoundButton';
import Animated, { FadeInDown, useSharedValue, useAnimatedStyle, withTiming, withSequence, withRepeat, runOnJS } from 'react-native-reanimated';
import { Waves, Mountain, Cloud, Eye, Feather, Wand2, CloudUpload } from 'lucide-react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import InfoModal from './InfoModal';
import GemButton from '../../components/GemButton';
import { gems } from '../../colour_themes';

// ── Theme-aware Animated Icons ──────────────────────────────────────────

const AnimatedWaves = ({ color, styles, active }) => {
    const offset = useSharedValue(0);
    useEffect(() => {
        offset.value = withRepeat(
            withSequence(withTiming(4, { duration: 1500 }), withTiming(-4, { duration: 1500 })),
            -1, true
        );
    }, []);
    const animatedStyle = useAnimatedStyle(() => ({ transform: [{ translateX: offset.value }] }));
    return (
        <View style={[styles.iconContainer, active && styles.activeIconContainer]}>
            <Animated.View style={animatedStyle}><Waves color={color} size={24} /></Animated.View>
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
            <Animated.View style={animatedStyle}><Mountain color={color} size={24} /></Animated.View>
            <Text style={[styles.iconText, { color }]}>MOUNTAIN</Text>
        </View>
    );
};

const AnimatedSky = ({ color, styles, active }) => {
    const translateY = useSharedValue(0);
    useEffect(() => {
        translateY.value = withRepeat(withTiming(-6, { duration: 2500 }), -1, true);
    }, []);
    const animatedStyle = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }));
    return (
        <View style={[styles.iconContainer, active && styles.activeIconContainer]}>
            <Animated.View style={animatedStyle}><Cloud color={color} size={24} /></Animated.View>
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

const IMAGE_SOURCES = {
    none: require('../../assets/images/visily-image-removebg-preview.png'),
    river: require('../../assets/images/river.png'),
    mountain: require('../../assets/images/mountain+river.png'),
    sky: require('../../assets/images/ChatGPT_Image_May_11__2026__02_55_58_PM-removebg-preview.png'),
};

export default function TeacherFeedbackPage() {
    const { user, profile, activeStudentId, activeStudentProfile, setActiveStudentProfile } = useAuth();
    const { theme } = useTheme();
    const router = useRouter();
    const styles = getStyles(theme);

    const targetUserId = activeStudentId || user?.id;
    const targetProfile = activeStudentProfile || profile;
    const isStudent = user?.role === 'student';

    const [isLoading, setIsLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);
    const [teacherFeedback, setTeacherFeedback] = useState("");

    const [activeLevel, setActiveLevel] = useState('none');
    const columnLevels = ['river', 'mountain', 'sky'];
    const [matrix, setMatrix] = useState({
        "0-0": "", "0-1": "", "0-2": "",
        "1-0": "", "1-1": "", "1-2": "",
        "2-0": "", "2-1": "", "2-2": ""
    });

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

    const animatedImageStyle = useAnimatedStyle(() => ({ opacity: imageOpacity.value }));

    useEffect(() => {
        if (targetUserId) {
            const fetchProfile = async () => {
                try {
                    setIsLoading(true);
                    const res = await fetch(`${API_URL}/students/profile/${targetUserId}`);
                    const data = await res.json();
                    
                    if (data && data.assessments) {
                        const assess = typeof data.assessments === 'string' ? JSON.parse(data.assessments) : data.assessments;
                        if (assess.teacherFeedback) setTeacherFeedback(assess.teacherFeedback);
                        if (assess.rubricTable) setMatrix(prev => ({ ...prev, ...assess.rubricTable }));
                    }
                } catch (err) {
                    console.warn("[TeacherFeedbackPage] Fetch failed:", err);
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
        if (isLoading) return;
        setIsSyncing(true);
        if (targetUserId) {
            try {
                const currentAssess = typeof targetProfile?.assessments === 'string'
                    ? JSON.parse(targetProfile.assessments) : (targetProfile?.assessments || {});

                const updatedAssess = { ...currentAssess, teacherFeedback, rubricTable: matrix };

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
                console.error("[TeacherFeedbackPage] Save error:", err);
            } finally {
                setIsSyncing(false);
            }
        }
        router.push('/part_b_s1/SelfPeerAssessmentPage');
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
                <SoundButton onPress={() => router.back()} style={styles.backBtn}>
                    <Text style={{color: theme.text, fontSize: 24, fontWeight: '800'}}>←</Text>
                </SoundButton>
                <View style={{ flex: 1 }}>
                    <Text style={styles.title}>{"Part B3: Teacher's Feedback"}</Text>
                </View>
            </View>

            <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
                
                {/* Rubric Review Matrix */}
                <Animated.View entering={FadeInDown.delay(100)} style={styles.rubricSection}>
                    <Text style={styles.sectionLabel}>RUBRIC REVIEW & SYNC</Text>
                    
                    {/* ── Prominent RMS Valley Image ─────────────────────────── */}
                    <View style={styles.imageFrame}>
                        <Animated.View style={[styles.imageInner, animatedImageStyle]}>
                            <Image source={currentSource} style={styles.valleyImage} contentFit="contain" transition={200} />
                        </Animated.View>
                        <Text style={styles.imageCaption}>
                            {activeLevel === 'none' ? 'Tap a column to illuminate' : activeLevel === 'river' ? '◈ Stream Level' : activeLevel === 'mountain' ? '◈ Mountain Level' : '◈ Sky Level'}
                        </Text>
                    </View>

                    <View style={styles.table}>
                        {/* Header Row */}
                        <View style={styles.row}>
                            <View style={[styles.headerCellBase, { width: '28%' }]}>
                                <Text style={styles.headerTitles}>MASTERY{'\n'}LEVEL</Text>
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
                                <Eye color={theme.text} size={18} />
                                <Text style={styles.sideIconText}>AWARE</Text>
                            </View>
                            <View style={[styles.cellBase, { width: '24%' }]}>
                                <TableInput value={matrix["0-0"]} onChange={(t) => updateCell(0,0,t)} theme={theme} styles={styles} onFocus={() => setActiveLevel('river')} />
                            </View>
                            <View style={[styles.cellBase, { width: '24%' }]}>
                                <TableInput value={matrix["0-1"]} onChange={(t) => updateCell(0,1,t)} theme={theme} styles={styles} onFocus={() => setActiveLevel('mountain')} />
                            </View>
                            <View style={[styles.cellBase, { width: '24%', borderRightWidth: 0 }]}>
                                <TableInput value={matrix["0-2"]} onChange={(t) => updateCell(0,2,t)} theme={theme} styles={styles} onFocus={() => setActiveLevel('sky')} />
                            </View>
                        </View>

                        {/* Row 2: Sensitivity */}
                        <View style={styles.row}>
                            <View style={[styles.headerCellBase, { width: '28%' }]}>
                                <Feather color={theme.text} size={18} />
                                <Text style={styles.sideIconText}>SENSITIVE</Text>
                            </View>
                            <View style={[styles.cellBase, { width: '24%' }]}>
                                <TableInput value={matrix["1-0"]} onChange={(t) => updateCell(1,0,t)} theme={theme} styles={styles} onFocus={() => setActiveLevel('river')} />
                            </View>
                            <View style={[styles.cellBase, { width: '24%' }]}>
                                <TableInput value={matrix["1-1"]} onChange={(t) => updateCell(1,1,t)} theme={theme} styles={styles} onFocus={() => setActiveLevel('mountain')} />
                            </View>
                            <View style={[styles.cellBase, { width: '24%', borderRightWidth: 0 }]}>
                                <TableInput value={matrix["1-2"]} onChange={(t) => updateCell(1,2,t)} theme={theme} styles={styles} onFocus={() => setActiveLevel('sky')} />
                            </View>
                        </View>

                        {/* Row 3: Creativity */}
                        <View style={[styles.row, { borderBottomWidth: 0 }]}>
                            <View style={[styles.headerCellBase, { width: '28%' }]}>
                                <Wand2 color={theme.text} size={18} />
                                <Text style={styles.sideIconText}>CREATIVE</Text>
                            </View>
                            <View style={[styles.cellBase, { width: '24%' }]}>
                                <TableInput value={matrix["2-0"]} onChange={(t) => updateCell(2,0,t)} theme={theme} styles={styles} onFocus={() => setActiveLevel('river')} />
                            </View>
                            <View style={[styles.cellBase, { width: '24%' }]}>
                                <TableInput value={matrix["2-1"]} onChange={(t) => updateCell(2,1,t)} theme={theme} styles={styles} onFocus={() => setActiveLevel('mountain')} />
                            </View>
                            <View style={[styles.cellBase, { width: '24%', borderRightWidth: 0 }]}>
                                <TableInput value={matrix["2-2"]} onChange={(t) => updateCell(2,2,t)} theme={theme} styles={styles} onFocus={() => setActiveLevel('sky')} />
                            </View>
                        </View>
                    </View>
                </Animated.View>

                {/* Feedback Input */}
                <Animated.View entering={FadeInDown.delay(200)} style={styles.feedbackSection}>
                    <Text style={styles.sectionLabel}>{"TEACHER'S CONSOLIDATED REMARKS"}</Text>
                    <TextInput
                        style={styles.textArea}
                        multiline
                        numberOfLines={8}
                        placeholder="Provide detailed feedback on student progress..."
                        placeholderTextColor={theme.secondaryText}
                        value={teacherFeedback}
                        onChangeText={setTeacherFeedback}
                        textAlignVertical="top"
                        editable={!isStudent}
                    />
                </Animated.View>

                <GemButton
                    gemType="silver"
                    onPress={handleNext}
                    disabled={isSyncing}
                    width={180}
                    style={styles.finishBtn}
                >
                    {isSyncing ? (
                        <ActivityIndicator color={theme.buttonText} />
                    ) : (
                        <View style={{ alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                            <Text style={[styles.finishBtnText, { textAlign: 'center' }]}>Proceed to{"\n"}Self/Peer{"\n"}Assessment</Text>
                            <Ionicons name="arrow-forward" size={16} color="#FFF" />
                        </View>
                    )}
                </GemButton>

                <View style={{ height: 60 }} />
            </ScrollView>
            </SafeAreaView>
        </View>
    );
}

const getStyles = (theme) => StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 40 },
    backBtn: { padding: 10, marginRight: 10 },
    title: { fontSize: 18, fontWeight: '800', color: theme.text, fontFamily: 'Jost_600SemiBold', letterSpacing: 1 },
    scrollContent: { padding: 15 },
    sectionLabel: { 
        fontSize: 10, fontWeight: '800', color: theme.primary, 
        letterSpacing: 2, marginBottom: 12, textTransform: 'uppercase' 
    },
    rubricSection: { marginBottom: 30 },

    // ── RMS Image Frame ─────────────────────────────────────────────────
    imageFrame: {
        alignItems: 'center',
        marginBottom: 16,
        backgroundColor: theme.card,
        borderRadius: 16,
        paddingVertical: 16,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: theme.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
        elevation: 4,
    },
    imageInner: {
        width: '100%',
        alignItems: 'center',
    },
    valleyImage: { 
        width: 180, 
        height: 180,
    },
    imageCaption: {
        marginTop: 8,
        fontSize: 9,
        fontWeight: '700',
        letterSpacing: 2,
        color: theme.secondaryText,
        textTransform: 'uppercase',
    },

    // ── Table ───────────────────────────────────────────────────────────
    table: { 
        borderWidth: 1, borderRadius: 14, overflow: 'hidden', 
        borderColor: theme.border, backgroundColor: theme.card,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
        elevation: 3,
    },
    row: { flexDirection: 'row', minHeight: 70, borderBottomWidth: 1, borderBottomColor: theme.border },
    headerCellBase: { 
        padding: 4, justifyContent: 'center', alignItems: 'center', 
        borderRightWidth: 1, borderRightColor: theme.border, 
        backgroundColor: theme.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' 
    },
    headerTouchable: { 
        flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 6 
    },
    cellBase: { padding: 4, justifyContent: 'center', borderRightWidth: 1, borderRightColor: theme.border },
    headerTitles: { fontSize: 8, fontWeight: '800', textAlign: 'center', color: theme.secondaryText },
    iconContainer: { 
        alignItems: 'center', justifyContent: 'center', gap: 3, 
        paddingVertical: 3, paddingHorizontal: 5, borderRadius: 8,
    },
    activeIconContainer: {
        backgroundColor: theme.isDark ? 'rgba(140,115,62,0.15)' : 'rgba(46,88,148,0.08)',
    },
    iconText: { fontSize: 6, fontWeight: '800', marginTop: 2, letterSpacing: 0.5 },
    sideIconText: { fontSize: 7, fontWeight: '800', textAlign: 'center', color: theme.text },
    inputCell: { flex: 1, fontSize: 10, textAlignVertical: 'top', textAlign: 'center' },

    // ── Feedback ────────────────────────────────────────────────────────
    feedbackSection: { marginBottom: 20 },
    textArea: { 
        backgroundColor: theme.card, 
        borderWidth: 1, 
        borderColor: theme.border, 
        borderRadius: 16, 
        padding: 16, 
        color: theme.text, 
        fontSize: 14, 
        minHeight: 180,
        fontFamily: "Jost_400Regular"
    },

    // ── Button ──────────────────────────────────────────────────────────
    finishBtn: { 
        marginTop: 10,
        alignSelf: 'center',
    },
    finishBtnText: { color: theme.buttonText, fontWeight: '800', fontSize: 11, letterSpacing: 1, textAlign: 'center' }
});
