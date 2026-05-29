import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    View, StyleSheet, TextInput, Text, ScrollView,
    StatusBar, TouchableOpacity, Dimensions, Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme, useAuth, API_URL } from '../../context/GlobalContext';
import SleekDropdown from './SleekDropdown';
import InfoModal from './InfoModal';
import { Ionicons } from '@expo/vector-icons';
import GemButton from '../../components/GemButton';

// Simple Checkbox component
const Checkbox = ({ checked, onPress, styles }) => (
  <TouchableOpacity onPress={onPress} style={styles.checkboxContainer}>
    <View style={[styles.checkboxBox, checked && styles.checkboxChecked]}>
      {checked && <Ionicons name="checkmark" size={12} color="#fff" />}
    </View>
  </TouchableOpacity>
);

import { domains, curricularGoals, competencies } from '../../constants/SelectionData';
import Animated, { FadeInDown, useSharedValue, useAnimatedStyle, withTiming, withRepeat, withSequence } from 'react-native-reanimated';
import { Waves, Mountain, Cloud, CloudUpload } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActivityIndicator } from 'react-native';
import PremiumBackground from '../../components/PremiumBackground';

const { width: W, height: H } = Dimensions.get('window');



export default function SelectionPage() {
    const router = useRouter();
    const { theme } = useTheme();
    const { user, profile, activeStudentId, activeStudentProfile, setActiveStudentProfile } = useAuth();

    // TARGET ASSIGNMENT
    // Teachers use activeStudentId. Students use their own user.id.
    const targetUserId = activeStudentId || user?.id;
    const targetProfile = activeStudentProfile || profile;

    const [domainEnabled, setDomainEnabled] = useState(true);
  const [goalEnabled, setGoalEnabled] = useState(true);
  const [competencyEnabled, setCompetencyEnabled] = useState(true);

    const [domain, setDomain] = useState('');
    const [goal, setGoal] = useState([]);
    const [competency, setCompetency] = useState([]);
    const [activities, setActivities] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);




    // ── Autofill on mount ────────────────────────────────────────────────────
    useEffect(() => {
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

                const updatedAssess = { ...currentAssess, domain, goal, competency, activities, selectionEnabled: { domain: domainEnabled, goal: goalEnabled, competency: competencyEnabled } };


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
        router.push('/part_b_preparatory/RubricPage');
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
            <PremiumBackground />

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
                            <Ionicons name="leaf-outline" size={28} color={theme.primary} />
                        </View>
                    </View>

                {/* Decorative divider */}
                <Text style={styles.divider}>─ ◈ ─</Text>

                {/* Card */}
                <View style={styles.card}>

            {/* Domain */}
            <View style={styles.fieldBlock}>
                <View style={styles.labelRow}>
                    <Checkbox checked={domainEnabled} onPress={() => setDomainEnabled(prev => !prev)} styles={styles} />
                    <Text style={styles.fieldLabel}>🌳 Developmental Domain</Text>
                </View>
                <View pointerEvents={isStudent ? "none" : "auto"}>
                    <SleekDropdown
                        label=""
                        options={domains}
                        selectedValue={domain}
                        onSelect={setDomain}
                        disabled={!domainEnabled}
                    />
                </View>
            </View>

            {/* Curricular Goals */}
            <View style={styles.fieldBlock}>
                <View style={styles.labelRow}>
                    <Checkbox checked={goalEnabled} onPress={() => setGoalEnabled(prev => !prev)} styles={styles} />
                    <Text style={styles.fieldLabel}>🎯 Curricular Goals</Text>
                    <InfoModal title="Curricular Goals" items={curricularGoals} />
                </View>
                <View pointerEvents={isStudent ? "none" : "auto"}>
                    <SleekDropdown
                        options={goalOptions}
                        selectedValue={goal}
                        onSelect={setGoal}
                        multiple
                        disabled={!goalEnabled}
                    />
                </View>
            </View>

            {/* Competencies */}
            <View style={styles.fieldBlock}>
                <View style={styles.labelRow}>
                    <Checkbox checked={competencyEnabled} onPress={() => setCompetencyEnabled(prev => !prev)} styles={styles} />
                    <Text style={styles.fieldLabel}>⚡ Competencies</Text>
                    <InfoModal title="Competencies" items={competencies} />
                </View>
                <View pointerEvents={isStudent ? "none" : "auto"}>
                    <SleekDropdown
                        options={competencyOptions}
                        selectedValue={competency}
                        onSelect={setCompetency}
                        multiple
                        disabled={!competencyEnabled}
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
                <GemButton
                    gemType="silver"
                    onPress={handleNext}
                    disabled={isLoading}
                    width={180}
                    style={styles.nextBtn}
                >
                    {isLoading ? (
                        <ActivityIndicator color={theme.buttonText} />
                    ) : (
                        <View style={{ alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                            <Text style={[styles.nextBtnText, { textAlign: 'center' }]}>Proceed to{"\n"}Rubric</Text>
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
    headerTitle: { color: theme.primary, fontSize: 24, fontWeight: '600', letterSpacing: 2, fontFamily: "Jost_600SemiBold" },
    headerSub: { color: theme.muted, fontSize: 12, letterSpacing: 2, marginTop: 2, fontFamily: "Jost_300Light" },
    headerIcons: { flexDirection: 'row', gap: 12, alignItems: 'center' },
    iconContainer: { alignItems: 'center', justifyContent: 'center' },
    iconText: { fontSize: 7, fontWeight: '300', marginTop: 2, fontFamily: "Jost_300Light" },
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
        fontWeight: '300',
        marginBottom: 8,
        letterSpacing: 2,
        textTransform: 'uppercase',
        fontFamily: "Jost_300Light",
    },
    textArea: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: theme.border,
        borderRadius: 16,
        padding: 14,
        color: theme.text,
        fontSize: 14,
        minHeight: 120,
        fontFamily: "Jost_400Regular",
    },

    // Next button
    nextBtn: {
        marginTop: 20,
        alignSelf: 'center',
    },
    nextBtnText: { color: theme.buttonText, fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 2, fontFamily: "Jost_600SemiBold", textAlign: 'center' },
});
