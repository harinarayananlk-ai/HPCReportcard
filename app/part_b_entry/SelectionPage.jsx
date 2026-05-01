import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    View, StyleSheet, TextInput, Text, ScrollView,
    StatusBar, TouchableOpacity, Dimensions, Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme, useAuth, API_URL } from '../../context/GlobalContext';
import SleekDropdown from './SleekDropdown';
import InfoModal from './InfoModal';
import { domains, curricularGoals, competencies } from '../../constants/SelectionData';
import { useVideoPlayer, VideoView } from 'expo-video';
import Animated, { FadeInDown, useSharedValue, useAnimatedStyle, withTiming, withRepeat, withSequence } from 'react-native-reanimated';
import { Waves, Mountain, Cloud, CloudUpload } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActivityIndicator } from 'react-native';
import PaperPlaneAnimation from '../../components/PaperPlaneAnimation';

const { width: W, height: H } = Dimensions.get('window');

// ── Ambient Animation Components ──────────────────────────────────────────

const AnimatedWaves = ({ color, styles }) => {
    const offset = useSharedValue(0);
    useEffect(() => {
        offset.value = withRepeat(withSequence(withTiming(4, { duration: 1500 }), withTiming(-4, { duration: 1500 })), -1, true);
    }, []);
    const animatedStyle = useAnimatedStyle(() => ({ transform: [{ translateX: offset.value }] }));
    return (
        <View style={styles.iconContainer}>
            <Animated.View style={animatedStyle}><Waves color={color} size={24} /></Animated.View>
            <Text style={[styles.iconText, { color }]}>STREAM</Text>
        </View>
    );
};

const AnimatedMountain = ({ color, styles }) => {
    const scale = useSharedValue(1);
    useEffect(() => {
        scale.value = withRepeat(withTiming(1.15, { duration: 2000 }), -1, true);
    }, []);
    const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }], opacity: withTiming(scale.value > 1.1 ? 0.9 : 1) }));
    return (
        <View style={styles.iconContainer}>
            <Animated.View style={animatedStyle}><Mountain color={color} size={24} /></Animated.View>
            <Text style={[styles.iconText, { color }]}>MOUNTAIN</Text>
        </View>
    );
};

const AnimatedSky = ({ color, styles }) => {
    const translateY = useSharedValue(0);
    useEffect(() => {
        translateY.value = withRepeat(withTiming(-6, { duration: 2500 }), -1, true);
    }, []);
    const animatedStyle = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }));
    return (
        <View style={styles.iconContainer}>
            <Animated.View style={animatedStyle}><Cloud color={color} size={24} /></Animated.View>
            <Text style={[styles.iconText, { color }]}>SKY</Text>
        </View>
    );
};

export default function SelectionPage() {
    const router = useRouter();
    const { theme } = useTheme();
    const { user, profile, activeStudentId, activeStudentProfile, setActiveStudentProfile } = useAuth();

    // TARGET ASSIGNMENT
    // Teachers use activeStudentId. Students use their own user.id.
    const targetUserId = activeStudentId || user?.id;
    const targetProfile = activeStudentProfile || profile;

    const [domain, setDomain] = useState('');
    const [goal, setGoal] = useState([]);
    const [competency, setCompetency] = useState([]);
    const [activities, setActivities] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);
    const player = useVideoPlayer(require('../../assets/images/Background_animation_forest.mp4'), (p) => {
        p.loop = true;
        p.play();
        p.muted = true;
    });

    // ── Autofill on mount ────────────────────────────────────────────────────
    useEffect(() => {
        if (user?.role === 'student') {
            router.replace("/StudentHomepage");
            return;
        }
        if (!targetUserId) return;
        const fetchProfile = async () => {
            try {
                setIsLoading(true);
                const res = await fetch(`${API_URL}/students/profile/${targetUserId}`);
                const data = await res.json();
                console.log(`[SelectionPage] Fetched data for ${targetUserId}:`, data);

                if (data?.assessments) {
                    const assess = typeof data.assessments === 'string'
                        ? JSON.parse(data.assessments) : data.assessments;
                    
                    // Plan 3: Check primary assessments, then backupAssessments
                    const source = assess.domain ? assess : (data.backupAssessments ? (typeof data.backupAssessments === 'string' ? JSON.parse(data.backupAssessments) : data.backupAssessments) : assess);

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
                } else {
                    console.log("[SelectionPage] No assessments found in profile.");
                }
            } catch (err) {
                console.warn('SelectionPage autofill failed', err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchProfile();
    }, [targetUserId]);

    // ── Memoize dropdown options (expensive maps) ────────────────────────────
    const goalOptions       = useMemo(() => curricularGoals.map(g => g.text), []);
    const competencyOptions = useMemo(() => competencies.map(c => c.text), []);

    // ── Save + navigate ──────────────────────────────────────────────────────
    const handleNext = async () => {
        // Plan 1: Critical Guard - Don't save if we are still loading
        if (isLoading) {
            Alert.alert("Please Wait", "Still loading student profile. Try again in a second.");
            return;
        }

        // If teacher is logged in but no student is active, warn
        if (user?.role !== 'student' && !activeStudentId) {
            Alert.alert("No Student Selected", "Please select a student from the Class Registry first.");
            router.replace("/TeacherTracking");
            return;
        }

        setIsSyncing(true);
        if (targetUserId) {
            try {
                const currentAssess = typeof targetProfile?.assessments === 'string'
                    ? JSON.parse(targetProfile.assessments) : (targetProfile?.assessments || {});
                
                // Extra protection: if we somehow have no domain selected but DB has data, verify
                if (!domain && currentAssess.domain) {
                    console.warn("[SelectionPage] Blocked possible empty overwrite.");
                    // Optionally alert user or try to re-fetch
                }

                const updatedAssess = { ...currentAssess, domain, goal, competency, activities };

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
                console.error("[SelectionPage] Save error:", err);
            } finally {
                setIsSyncing(false);
            }
        }
        router.push('/part_b_entry/RubricPage');
    };

    const handleBackup = async () => {
        if (!targetUserId) return;
        setIsSyncing(true);
        try {
            const currentAssess = { domain, goal, competency, activities };
            // Save to a "backup" field
            await fetch(`${API_URL}/students/profile`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: targetUserId,
                    registrationNumber: targetProfile?.registration_number,
                    role: user?.role || 'student',
                    backupAssessments: currentAssess // New field for redundancy
                })
            });
            Alert.alert("Archive Sync", "A secondary copy of this selection has been archived.");
        } catch (err) {
            Alert.alert("Sync Error", "Failed to archive data.");
        } finally {
            setIsSyncing(false);
        }
    };

    const isStudent = user?.role === 'student';
    const styles = getStyles(theme);

    return (
        <View style={{ flex: 1 }}>
            <StatusBar translucent barStyle="light-content" backgroundColor="transparent" />
            <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.background }]} />
            <PaperPlaneAnimation />

            {/* ── Dark green overlay ──────────────────────────────────────── */}
            <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)' }]} />

            {/* ── Content ────────────────────────────────────────────────── */}
            <SafeAreaView style={{ flex: 1 }}>
                <ScrollView
                    style={styles.scroll}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                            <Text style={styles.backText}>←</Text>
                        </TouchableOpacity>
                        <View style={{ flex: 1, alignItems: 'center' }}>
                            <Text style={styles.headerTitle}>🌿 Part B1</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <Text style={styles.headerSub}>Domain Selection</Text>
                                <TouchableOpacity onPress={handleBackup} disabled={isSyncing}>
                                    {isSyncing ? <ActivityIndicator size="small" color={theme.primary} /> : <CloudUpload color={theme.primary} size={14} />}
                                </TouchableOpacity>
                            </View>
                        </View>
                        <View style={styles.headerIcons}>
                            <AnimatedWaves color={theme.primary} styles={styles} />
                            <AnimatedMountain color={theme.primary} styles={styles} />
                            <AnimatedSky color={theme.primary} styles={styles} />
                        </View>
                    </View>

                {/* Decorative divider */}
                <Text style={styles.divider}>─ ◈ ─</Text>

                {/* Card */}
                <View style={styles.card}>

                    {/* Domain */}
                    <View style={[styles.fieldBlock, isStudent && { opacity: 0.6 }]}>
                        <Text style={styles.fieldLabel}>🌳 Developmental Domain</Text>
                        <View pointerEvents={isStudent ? "none" : "auto"}>
                            <SleekDropdown
                                label=""
                                options={domains}
                                selectedValue={domain}
                                onSelect={setDomain}
                            />
                        </View>
                    </View>

                    {/* Curricular Goals */}
                    <View style={[styles.fieldBlock, isStudent && { opacity: 0.6 }]}>
                        <View style={styles.labelRow}>
                            <Text style={styles.fieldLabel}>🎯 Curricular Goals</Text>
                            <InfoModal title="Curricular Goals" items={curricularGoals} />
                        </View>
                        <View pointerEvents={isStudent ? "none" : "auto"}>
                            <SleekDropdown
                                options={goalOptions}
                                selectedValue={goal}
                                onSelect={setGoal}
                                multiple
                            />
                        </View>
                    </View>

                    {/* Competencies */}
                    <View style={[styles.fieldBlock, isStudent && { opacity: 0.6 }]}>
                        <View style={styles.labelRow}>
                            <Text style={styles.fieldLabel}>⚡ Competencies</Text>
                            <InfoModal title="Competencies" items={competencies} />
                        </View>
                        <View pointerEvents={isStudent ? "none" : "auto"}>
                            <SleekDropdown
                                options={competencyOptions}
                                selectedValue={competency}
                                onSelect={setCompetency}
                                multiple
                            />
                        </View>
                    </View>

                    {/* Activities */}
                    <View style={[styles.fieldBlock, isStudent && { opacity: 0.6 }]}>
                        <Text style={styles.fieldLabel}>
                            🌱 ACTIVITIES
                        </Text>
                        <TextInput
                            style={styles.textArea}
                            multiline
                            numberOfLines={5}
                            placeholder="Describe the activities performed..."
                            placeholderTextColor={theme.muted}
                            value={activities}
                            onChangeText={setActivities}
                            textAlignVertical="top"
                            editable={!isStudent}
                        />
                    </View>
                </View>

                {/* Next button */}
                <TouchableOpacity 
                    style={[styles.nextBtn, isLoading && { opacity: 0.5 }]} 
                    onPress={handleNext} 
                    activeOpacity={0.85}
                    disabled={isLoading}
                >
                    {isLoading ? <ActivityIndicator color={theme.buttonText} /> : <Text style={styles.nextBtnText}>Proceed to Rubric  →</Text>}
                </TouchableOpacity>

                <View style={{ height: 40 }} />
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

const getStyles = (theme) => StyleSheet.create({
    root: { flex: 1, backgroundColor: theme.background },
    overlay: { backgroundColor: 'rgba(0,0,0,0.4)' },
    scroll: { flex: 1 },
    scrollContent: { paddingHorizontal: 18, paddingBottom: 30 },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: Platform.OS === 'android' ? 52 : 58,
        paddingBottom: 8,
        paddingHorizontal: 4,
    },
    backBtn: {
        width: 44, height: 44,
        borderRadius: 22,
        backgroundColor: theme.card,
        borderWidth: 1, borderColor: theme.border,
        justifyContent: 'center', alignItems: 'center',
    },
    backText: { color: theme.primary, fontSize: 22, fontWeight: '800' },
    headerTitle: { color: theme.primary, fontSize: 22, fontWeight: '800', letterSpacing: 1 },
    headerSub: { color: theme.muted, fontSize: 12, letterSpacing: 2, marginTop: 2 },
    headerIcons: { flexDirection: 'row', gap: 12, alignItems: 'center' },
    iconContainer: { alignItems: 'center', justifyContent: 'center' },
    iconText: { fontSize: 6, fontWeight: '900', marginTop: 2 },
    divider: { color: theme.muted, textAlign: 'center', fontSize: 14, marginVertical: 12, opacity: 0.6 },

    // Card
    card: {
        backgroundColor: theme.card,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: theme.border,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 10,
    },

    // Fields
    fieldBlock: { marginBottom: 20 },
    labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
    fieldLabel: {
        color: theme.text,
        fontSize: 13,
        fontWeight: '700',
        marginBottom: 8,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    textArea: {
        backgroundColor: 'rgba(0,0,0,0.1)',
        borderWidth: 1,
        borderColor: theme.border,
        borderRadius: 12,
        padding: 14,
        color: theme.text,
        fontSize: 14,
        minHeight: 120,
    },

    // Next button
    nextBtn: {
        backgroundColor: theme.primary,
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: 'center',
        marginTop: 10,
    },
    nextBtnText: { color: theme.buttonText, fontSize: 16, fontWeight: 'bold', textTransform: 'uppercase' },
});
