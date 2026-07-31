import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView, TextInput, StatusBar, Alert, ActivityIndicator, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme, useAuth, API_URL } from '../../context/GlobalContext';
import PremiumBackground from '../../components/PremiumBackground';
import SoundButton from '../../components/SoundButton';
import MenuDropdown from '../../components/MenuDropdown';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import GemButton from '../../components/GemButton';

const { width: W } = Dimensions.get('window');

export default function SelfPeerAssessmentPage() {
    const { user, profile, setProfile: setAuthProfile, activeStudentId, activeStudentProfile, setActiveStudentProfile } = useAuth();
    const { theme } = useTheme();
    const router = useRouter();
    const styles = getStyles(theme);

    useEffect(() => {
        router.replace('/part_b_s1/SelectionPage');
    }, []);

    const targetUserId = activeStudentId || user?.id;
    const targetProfile = activeStudentProfile || profile;

    const [isLoading, setIsLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);

    // State for Self Assessment
    const [selfLiked, setSelfLiked] = useState(""); // Yes, No, DontKnow
    const [selfEasy, setSelfEasy] = useState("");
    const [selfNeeded, setSelfNeeded] = useState([]); // Array of strings

    // State for Peer Assessment
    const [peerLiked, setPeerLiked] = useState("");
    const [peerEasy, setPeerEasy] = useState("");
    const [peerNeeded, setPeerNeeded] = useState([]);

    // ── Internal Components (Inside to access styles directly) ───────────

    const EmojiOption = ({ label, emoji, selected, onSelect }) => (
        <TouchableOpacity 
            onPress={onSelect} 
            style={[styles.emojiOption, selected && { backgroundColor: 'rgba(255,165,0,0.1)', borderColor: 'orange' }]}
        >
            <Text style={{ fontSize: 20 }}>{emoji}</Text>
            <Text style={[styles.emojiLabel, { color: theme.text }]}>{label}</Text>
        </TouchableOpacity>
    );

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
                        if (assess.selfPeer) {
                            const sp = assess.selfPeer;
                            setSelfLiked(sp.selfLiked || "");
                            setSelfEasy(sp.selfEasy || "");
                            setSelfNeeded(sp.selfNeeded || []);
                            setPeerLiked(sp.peerLiked || "");
                            setPeerEasy(sp.peerEasy || "");
                            setPeerNeeded(sp.peerNeeded || []);
                        }
                    }
                } catch (err) {
                    console.warn("[SelfPeerAssessmentPage] Fetch failed:", err);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchProfile();
        } else {
            setIsLoading(false);
        }
    }, [targetUserId]);

    const toggleNeeded = (list, setList, item) => {
        if (list.includes(item)) {
            setList(list.filter(i => i !== item));
        } else {
            setList([...list, item]);
        }
    };

    const handleNext = async () => {
        if (isLoading) return;
        setIsSyncing(true);
        if (targetUserId) {
            try {
                const currentAssess = typeof targetProfile?.assessments === 'string'
                    ? JSON.parse(targetProfile.assessments) : (targetProfile?.assessments || {});

                const selfPeer = {
                    selfLiked, selfEasy, selfNeeded,
                    peerLiked, peerEasy, peerNeeded
                };

                const updatedAssess = { ...currentAssess, selfPeer };

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

                if (res.ok) {
                    if (activeStudentId) {
                        setActiveStudentProfile({ ...targetProfile, assessments: updatedAssess });
                    } else {
                        setAuthProfile({ ...targetProfile, assessments: updatedAssess });
                    }
                }
            } catch (err) {
                console.error("[SelfPeerAssessmentPage] Save error:", err);
            } finally {
                setIsSyncing(false);
            }
        }
        router.push('/part_b_s1/ParentObservationPage');
    };

    return (
        <View style={{ flex: 1, backgroundColor: theme.background }}>
            <PremiumBackground />

            <SafeAreaView style={{ flex: 1 }}>
            <StatusBar translucent barStyle={theme.isDark ? "light-content" : "dark-content"} backgroundColor="transparent" />

            <View style={styles.header}>
                <MenuDropdown />
                <View style={{ flex: 1, marginLeft: 16 }}>
                    <Text style={styles.title}>Part B4: Self & Peer Assessment</Text>
                </View>
            </View>

            <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
                
                {/* SELF ASSESSMENT SECTION */}
                <Animated.View entering={FadeInDown.delay(100)} style={styles.sectionContainer}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionHeaderText}>SELF ASSESSMENT</Text>
                    </View>

                    <View style={styles.table}>
                        {/* Q1 */}
                        <View style={styles.row}>
                            <View style={styles.questionCell}>
                                <Text style={styles.questionText}>I liked doing this work.</Text>
                            </View>
                            <View style={styles.optionsCell}>
                                <EmojiOption label="Yes" emoji="😊" selected={selfLiked === "Yes"} onSelect={() => setSelfLiked("Yes")} />
                                <EmojiOption label="No" emoji="😟" selected={selfLiked === "No"} onSelect={() => setSelfLiked("No")} />
                                <EmojiOption label="Don't Know" emoji="🤔" selected={selfLiked === "DontKnow"} onSelect={() => setSelfLiked("DontKnow")} />
                            </View>
                        </View>

                        {/* Q2 */}
                        <View style={styles.row}>
                            <View style={styles.questionCell}>
                                <Text style={styles.questionText}>I found this work easy.</Text>
                            </View>
                            <View style={styles.optionsCell}>
                                <EmojiOption label="Yes" emoji="😊" selected={selfEasy === "Yes"} onSelect={() => setSelfEasy("Yes")} />
                                <EmojiOption label="No" emoji="😟" selected={selfEasy === "No"} onSelect={() => setSelfEasy("No")} />
                                <EmojiOption label="Don't Know" emoji="🤔" selected={selfEasy === "DontKnow"} onSelect={() => setSelfEasy("DontKnow")} />
                            </View>
                        </View>

                        {/* Q3 */}
                        <View style={[styles.row, { borderBottomWidth: 0 }]}>
                            <View style={styles.questionCell}>
                                <Text style={styles.questionText}>To do this work, I needed.</Text>
                            </View>
                            <View style={styles.checkboxGrid}>
                                <CheckboxItem label="📚 Classmate" checked={selfNeeded.includes("Classmate")} onPress={() => toggleNeeded(selfNeeded, setSelfNeeded, "Classmate")} />
                                <CheckboxItem label="💻 Computer" checked={selfNeeded.includes("Computer")} onPress={() => toggleNeeded(selfNeeded, setSelfNeeded, "Computer")} />
                                <CheckboxItem label="👩‍🏫 Teacher" checked={selfNeeded.includes("Teacher")} onPress={() => toggleNeeded(selfNeeded, setSelfNeeded, "Teacher")} />
                                <CheckboxItem label="🚫 None" checked={selfNeeded.includes("None")} onPress={() => toggleNeeded(selfNeeded, setSelfNeeded, "None")} />
                                <CheckboxItem label="📖 Books" checked={selfNeeded.includes("Books")} onPress={() => toggleNeeded(selfNeeded, setSelfNeeded, "Books")} />
                            </View>
                        </View>
                    </View>
                </Animated.View>

                {/* PEER ASSESSMENT SECTION */}
                <Animated.View entering={FadeInDown.delay(300)} style={[styles.sectionContainer, { marginTop: 30 }]}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionHeaderText}>PEER ASSESSMENT</Text>
                    </View>

                    <View style={styles.table}>
                        {/* Q1 */}
                        <View style={styles.row}>
                            <View style={styles.questionCell}>
                                <Text style={styles.questionText}>My friend liked doing this work.</Text>
                            </View>
                            <View style={styles.optionsCell}>
                                <EmojiOption label="Yes" emoji="😊" selected={peerLiked === "Yes"} onSelect={() => setPeerLiked("Yes")} />
                                <EmojiOption label="No" emoji="😟" selected={peerLiked === "No"} onSelect={() => setPeerLiked("No")} />
                                <EmojiOption label="Don't Know" emoji="🤔" selected={peerLiked === "DontKnow"} onSelect={() => setPeerLiked("DontKnow")} />
                            </View>
                        </View>

                        {/* Q2 */}
                        <View style={styles.row}>
                            <View style={styles.questionCell}>
                                <Text style={styles.questionText}>My friend found this work easy.</Text>
                            </View>
                            <View style={styles.optionsCell}>
                                <EmojiOption label="Yes" emoji="😊" selected={peerEasy === "Yes"} onSelect={() => setPeerEasy("Yes")} />
                                <EmojiOption label="No" emoji="😟" selected={peerEasy === "No"} onSelect={() => setPeerEasy("No")} />
                                <EmojiOption label="Don't Know" emoji="🤔" selected={peerEasy === "DontKnow"} onSelect={() => setPeerEasy("DontKnow")} />
                            </View>
                        </View>

                        {/* Q3 */}
                        <View style={[styles.row, { borderBottomWidth: 0 }]}>
                            <View style={styles.questionCell}>
                                <Text style={styles.questionText}>To do this work, My friend needed...</Text>
                            </View>
                            <View style={styles.checkboxGrid}>
                                <CheckboxItem label="📚 Classmate" checked={peerNeeded.includes("Classmate")} onPress={() => toggleNeeded(peerNeeded, setPeerNeeded, "Classmate")} />
                                <CheckboxItem label="💻 Computer" checked={peerNeeded.includes("Computer")} onPress={() => toggleNeeded(peerNeeded, setPeerNeeded, "Computer")} />
                                <CheckboxItem label="👩‍🏫 Teacher" checked={peerNeeded.includes("Teacher")} onPress={() => toggleNeeded(peerNeeded, setPeerNeeded, "Teacher")} />
                                <CheckboxItem label="🚫 None" checked={peerNeeded.includes("None")} onPress={() => toggleNeeded(peerNeeded, setPeerNeeded, "None")} />
                                <CheckboxItem label="📖 Books" checked={peerNeeded.includes("Books")} onPress={() => toggleNeeded(peerNeeded, setPeerNeeded, "Books")} />
                            </View>
                        </View>
                    </View>
                </Animated.View>

                <GemButton
                    gemType="sapphire"
                    onPress={handleNext}
                    disabled={isSyncing}
                    width={180}
                    style={styles.finishBtn}
                >
                    {isSyncing ? (
                        <ActivityIndicator color={theme.buttonText} />
                    ) : (
                        <View style={{ alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                            <Text style={[styles.finishBtnText, { textAlign: 'center' }]}>Proceed to{"\n"}Parent{"\n"}Observation</Text>
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
    title: { fontSize: 18, fontWeight: '800', color: theme.text },
    scrollContent: { padding: 15 },
    sectionContainer: {
        borderWidth: 1.5,
        borderColor: 'orange',
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: 'rgba(255,255,255,0.02)'
    },
    sectionHeader: {
        backgroundColor: 'rgba(255,165,0,0.05)',
        paddingVertical: 12,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: 'orange'
    },
    sectionHeaderText: {
        color: 'orange',
        fontWeight: '800',
        fontSize: 16,
        letterSpacing: 1.5
    },
    table: { backgroundColor: theme.card },
    row: { 
        flexDirection: 'row', 
        borderBottomWidth: 1, 
        borderBottomColor: 'rgba(255,165,0,0.3)',
        minHeight: 80
    },
    questionCell: {
        width: '50%',
        padding: 12,
        justifyContent: 'center',
        backgroundColor: 'rgba(255,165,0,0.08)',
        borderRightWidth: 1,
        borderRightColor: 'rgba(255,165,0,0.3)'
    },
    questionText: {
        color: theme.text,
        fontSize: 14,
        fontWeight: '500'
    },
    optionsCell: {
        width: '50%',
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingHorizontal: 4
    },
    emojiOption: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 6,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'transparent',
        flex: 1
    },
    emojiLabel: {
        fontSize: 9,
        marginTop: 4,
        fontWeight: '600',
        textAlign: 'center'
    },
    checkboxGrid: {
        width: '50%',
        flexDirection: 'column',
        padding: 12,
        gap: 10,
    },
    checkboxColumn: {
        flex: 1,
        gap: 12
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
        fontSize: 10,
        fontWeight: '500'
    },
    finishBtn: { 
        marginTop: 30,
        alignSelf: 'center',
    },
    finishBtnText: { color: theme.buttonText, fontWeight: '800', fontSize: 11, textAlign: 'center' }
});
