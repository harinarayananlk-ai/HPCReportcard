import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView, TextInput, StatusBar, Alert, ActivityIndicator, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme, useAuth, API_URL } from '../../context/GlobalContext';
import PremiumBackground from '../../components/PremiumBackground';
import SoundButton from '../../components/SoundButton';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import GemButton from '../../components/GemButton';

export default function ParentObservationPage() {
    const { user, profile, activeStudentId, activeStudentProfile, setActiveStudentProfile } = useAuth();
    const { theme } = useTheme();
    const router = useRouter();
    const styles = getStyles(theme);

    const targetUserId = activeStudentId || user?.id;
    const targetProfile = activeStudentProfile || profile;

    const [isLoading, setIsLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);

    // State for Parent Observation
    const [resources, setResources] = useState([]); // Array of strings
    const [remarks, setRemarks] = useState("");

    // ── Internal Component ──────────────────────────────────────────────

    const CheckboxItem = ({ label, checked, onPress }) => (
        <TouchableOpacity onPress={onPress} style={styles.checkboxItem}>
            <View style={[styles.checkboxBox, checked && { backgroundColor: 'orange', borderColor: 'orange' }]}>
                {checked && <Ionicons name="checkmark" size={12} color="#fff" />}
            </View>
            <Text style={[styles.checkboxLabel, { color: theme.text }]}>{label}</Text>
        </TouchableOpacity>
    );

    useEffect(() => {
        if (targetUserId) {
            const fetchProfile = async () => {
                try {
                    setIsLoading(true);
                    const res = await fetch(`${API_URL}/students/profile/${targetUserId}`);
                    const data = await res.json();
                    
                    if (data && data.assessments) {
                        const assess = typeof data.assessments === 'string' ? JSON.parse(data.assessments) : data.assessments;
                        if (assess.parentObservation) {
                            setResources(assess.parentObservation.resources || []);
                            setRemarks(assess.parentObservation.remarks || "");
                        }
                    }
                } catch (err) {
                    console.warn("[ParentObservationPage] Fetch failed:", err);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchProfile();
        } else {
            setIsLoading(false);
        }
    }, [targetUserId]);

    const toggleResource = (item) => {
        if (resources.includes(item)) {
            setResources(resources.filter(i => i !== item));
        } else {
            setResources([...resources, item]);
        }
    };

    const handleFinish = async () => {
        if (isLoading) return;
        setIsSyncing(true);
        if (targetUserId) {
            try {
                const currentAssess = typeof targetProfile?.assessments === 'string'
                    ? JSON.parse(targetProfile.assessments) : (targetProfile?.assessments || {});

                const parentObservation = { resources, remarks };
                const updatedAssess = { ...currentAssess, parentObservation };

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
                Alert.alert("Success", "Parent observation saved!");
            } catch (err) {
                console.error("[ParentObservationPage] Save error:", err);
            } finally {
                setIsSyncing(false);
            }
        }
        router.push('/part_c_s1/YearEndSummary');
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
                    <Text style={styles.title}>Part B5: Parent/Caregiver Observation</Text>
                </View>
            </View>

            <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
                
                <Animated.Text entering={FadeInDown.delay(100)} style={styles.note}>
                    {"NOTE: This form is to be completed by the parent/caregiver/guardian. Please select one or more appropriate options below based on your observations at home. Additionally, kindly provide a suitable remark regarding your child's behavior at home."}
                </Animated.Text>

                <Animated.View entering={FadeInDown.delay(200)} style={styles.sectionContainer}>
                    <View style={styles.table}>
                        {/* Resources Row */}
                        <View style={styles.row}>
                            <View style={styles.labelCell}>
                                <Text style={styles.labelText}>Learning teaching resources at home</Text>
                            </View>
                            <View style={styles.checkboxGrid}>
                                <CheckboxItem label="📚 Books / Magazine" checked={resources.includes("Books/magazine")} onPress={() => toggleResource("Books/magazine")} />
                                <CheckboxItem label="📱 Phone / Computer" checked={resources.includes("Phone/computer")} onPress={() => toggleResource("Phone/computer")} />
                                <CheckboxItem label="📰 Newspaper" checked={resources.includes("Newspaper")} onPress={() => toggleResource("Newspaper")} />
                                <CheckboxItem label="🌐 Internet" checked={resources.includes("Internet")} onPress={() => toggleResource("Internet")} />
                                <CheckboxItem label="🎮 Toys / Games / Sports" checked={resources.includes("Toys/games/sports")} onPress={() => toggleResource("Toys/games/sports")} />
                            </View>
                        </View>

                        {/* Remarks Row */}
                        <View style={[styles.row, { borderBottomWidth: 0, flexDirection: 'column' }]}>
                            <View style={[styles.labelCell, { width: '100%', borderRightWidth: 0 }]}>
                                <Text style={styles.labelText}>Comments/Remarks</Text>
                            </View>
                            <View style={styles.inputCell}>
                                <TextInput
                                    style={styles.textArea}
                                    multiline
                                    numberOfLines={6}
                                    placeholder="Write something here..."
                                    placeholderTextColor={theme.muted}
                                    value={remarks}
                                    onChangeText={setRemarks}
                                    textAlignVertical="top"
                                />
                            </View>
                        </View>
                    </View>
                </Animated.View>

                <GemButton
                    gemType="silver"
                    onPress={handleFinish}
                    disabled={isSyncing}
                    width={180}
                    style={styles.finishBtn}
                >
                    {isSyncing ? (
                        <ActivityIndicator color={theme.buttonText} />
                    ) : (
                        <View style={{ alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                            <Text style={[styles.finishBtnText, { textAlign: 'center' }]}>Complete &{"\n"}Go to Part C</Text>
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
    title: { fontSize: 16, fontWeight: '800', color: theme.text },
    scrollContent: { padding: 15 },
    note: { fontSize: 12, color: theme.text, marginBottom: 20, lineHeight: 18, opacity: 0.8 },
    sectionContainer: {
        borderWidth: 1.5,
        borderColor: 'orange',
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: 'rgba(255,255,255,0.02)'
    },
    table: { backgroundColor: theme.card },
    row: { 
        flexDirection: 'row', 
        borderBottomWidth: 1, 
        borderBottomColor: 'rgba(255,165,0,0.3)',
        minHeight: 100
    },
    labelCell: {
        width: '35%',
        padding: 12,
        justifyContent: 'center',
        backgroundColor: 'rgba(255,165,0,0.15)',
        borderRightWidth: 1,
        borderRightColor: 'rgba(255,165,0,0.3)'
    },
    labelText: {
        color: theme.text,
        fontSize: 13,
        fontWeight: '600'
    },
    checkboxGrid: {
        width: '65%',
        flexDirection: 'column',
        padding: 12,
        gap: 10,
    },
    checkboxItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 2,
    },
    checkboxBox: {
        width: 18,
        height: 18,
        borderWidth: 1,
        borderColor: theme.muted,
        borderRadius: 4,
        justifyContent: 'center',
        alignItems: 'center'
    },
    checkboxLabel: {
        fontSize: 11,
        fontWeight: '500'
    },
    inputCell: {
        padding: 12,
        backgroundColor: theme.card
    },
    textArea: {
        color: theme.text,
        fontSize: 14,
        minHeight: 120,
        paddingTop: 8
    },
    finishBtn: { 
        marginTop: 30,
        alignSelf: 'center',
    },
    finishBtnText: { color: theme.buttonText, fontWeight: '800', fontSize: 11, textAlign: 'center' }
});
