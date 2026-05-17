import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView, TextInput, StatusBar, Alert, ActivityIndicator, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme, useAuth, API_URL } from '../../context/GlobalContext';
import PremiumBackground from '../../components/PremiumBackground';
import SoundButton from '../../components/SoundButton';
import Animated, { FadeInDown, useSharedValue, useAnimatedStyle, withTiming, withSpring, interpolate, runOnJS } from 'react-native-reanimated';
import { Waves, Mountain, Cloud, Eye, Feather, Wand2 } from 'lucide-react-native';
import { Image } from 'expo-image';
import { gems } from '../../colour_themes';

const IMAGE_SOURCES = {
    none: require('../../assets/images/visily-image-removebg-preview.png'),
    river: require('../../assets/images/river.png'),
    mountain: require('../../assets/images/mountain+river.png'),
    sky: require('../../assets/images/ChatGPT_Image_May_11__2026__02_55_58_PM-removebg-preview.png'),
};

const DOMAINS = [
    { key: 'd1', title: 'Physical Development', icon: '🏃', accent: gems.sapphire },
    { key: 'd2', title: 'Socio-Emotional', icon: '💛', accent: gems.topaz },
    { key: 'd3', title: 'Cognitive', icon: '🧠', accent: gems.emerald },
    { key: 'd4', title: 'Language & Literacy', icon: '📖', accent: gems.sapphire },
    { key: 'd5', title: 'Aesthetic & Cultural', icon: '🎨', accent: gems.ruby },
    { key: 'd6', title: 'Positive Learning Habits', icon: '🌟', accent: gems.topaz },
];

const EMPTY_MATRIX = { "0-0":"","0-1":"","0-2":"","1-0":"","1-1":"","1-2":"","2-0":"","2-1":"","2-2":"" };
const COL_LEVELS = ['river', 'mountain', 'sky'];

// ── Flippable Domain Card (with embedded RMS) ──────────────────────────

const FlipCard = ({ domain, matrix, onCellChange, theme, isStudent }) => {
    const flipAnim = useSharedValue(0);
    const [flipped, setFlipped] = useState(false);
    const [cardLevel, setCardLevel] = useState('none');

    const handleFlip = () => {
        setFlipped(prev => !prev);
        flipAnim.value = withSpring(flipped ? 0 : 1, { damping: 14, stiffness: 90 });
    };

    // Front: visible 0–0.5, hidden after
    const frontAnimStyle = useAnimatedStyle(() => {
        const rotate = interpolate(flipAnim.value, [0, 0.5, 1], [0, 90, 90]);
        const opacity = interpolate(flipAnim.value, [0, 0.45, 0.5], [1, 1, 0]);
        return {
            transform: [{ perspective: 1200 }, { rotateY: `${rotate}deg` }],
            opacity, zIndex: flipAnim.value < 0.5 ? 2 : 0,
        };
    });

    // Back: hidden 0–0.5, visible after
    const backAnimStyle = useAnimatedStyle(() => {
        const rotate = interpolate(flipAnim.value, [0, 0.5, 1], [-90, -90, 0]);
        const opacity = interpolate(flipAnim.value, [0.5, 0.55, 1], [0, 1, 1]);
        return {
            transform: [{ perspective: 1200 }, { rotateY: `${rotate}deg` }],
            opacity, zIndex: flipAnim.value >= 0.5 ? 2 : 0,
        };
    });

    const currentImage = IMAGE_SOURCES[cardLevel] || IMAGE_SOURCES.none;

    return (
        <View style={fcs.cardWrapper}>
            {/* ── Front ─────────────────────────────────────────────── */}
            <Animated.View style={[fcs.cardFace, frontAnimStyle]}>
                <TouchableOpacity
                    style={[fcs.frontContent, { backgroundColor: theme.card, borderColor: theme.border, borderLeftColor: domain.accent + '60' }]}
                    onPress={handleFlip}
                    activeOpacity={0.85}
                >
                    {/* RMS Image on front */}
                    <View style={fcs.frontImageWrap}>
                        <Image source={currentImage} style={fcs.frontImage} contentFit="contain" />
                    </View>
                    <View style={fcs.frontInfo}>
                        <Text style={fcs.frontIcon}>{domain.icon}</Text>
                        <Text style={[fcs.frontTitle, { color: theme.text }]}>{domain.title}</Text>
                        <Text style={[fcs.frontSub, { color: theme.secondaryText }]}>Domain Assessment</Text>
                        <View style={[fcs.tapBadge, { borderColor: domain.accent + '30', backgroundColor: domain.accent + '08' }]}>
                            <Text style={[fcs.tapText, { color: domain.accent }]}>TAP TO ASSESS ›</Text>
                        </View>
                    </View>
                </TouchableOpacity>
            </Animated.View>

            {/* ── Back ──────────────────────────────────────────────── */}
            <Animated.View style={[fcs.cardFace, backAnimStyle]}>
                <View style={[fcs.backContent, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    {/* Back header with RMS + close */}
                    <View style={fcs.backTop}>
                        <Image source={currentImage} style={fcs.backImage} contentFit="contain" />
                        <View style={fcs.backHeaderRight}>
                            <Text style={[fcs.backTitle, { color: theme.primary }]}>{domain.icon} {domain.title}</Text>
                            <Text style={[fcs.levelHint, { color: theme.secondaryText }]}>
                                {cardLevel === 'none' ? 'Tap a cell' : cardLevel === 'river' ? '◈ Stream' : cardLevel === 'mountain' ? '◈ Mountain' : '◈ Sky'}
                            </Text>
                        </View>
                        <TouchableOpacity onPress={handleFlip} style={[fcs.closePill, { backgroundColor: theme.border }]}>
                            <Text style={[fcs.closeText, { color: theme.secondaryText }]}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    {/* 3x3 Matrix */}
                    <View style={[fcs.table, { borderColor: theme.border }]}>
                        {/* Column Headers */}
                        <View style={[fcs.tRow, { borderBottomColor: theme.border }]}>
                            <View style={[fcs.hCell, fcs.labelCol, { borderRightColor: theme.border, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }]} />
                            {[
                                { icon: <Waves color={gems.sapphire} size={14} />, label: 'STR', color: gems.sapphire, level: 'river' },
                                { icon: <Mountain color={gems.emerald} size={14} />, label: 'MTN', color: gems.emerald, level: 'mountain' },
                                { icon: <Cloud color={gems.topaz} size={14} />, label: 'SKY', color: gems.topaz, level: 'sky' },
                            ].map((col, ci) => (
                                <TouchableOpacity
                                    key={ci}
                                    style={[fcs.hCell, fcs.dataCol, { borderRightColor: theme.border }, ci === 2 && { borderRightWidth: 0 },
                                        cardLevel === col.level && { backgroundColor: col.color + '10' }]}
                                    onPress={() => setCardLevel(col.level)}
                                >
                                    {col.icon}
                                    <Text style={[fcs.colLabel, { color: col.color }]}>{col.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Data Rows */}
                        {[
                            { label: 'AWR', icon: <Eye color={theme.text} size={13} />, row: 0 },
                            { label: 'SEN', icon: <Feather color={theme.text} size={13} />, row: 1 },
                            { label: 'CRE', icon: <Wand2 color={theme.text} size={13} />, row: 2 },
                        ].map((r, ri) => (
                            <View key={ri} style={[fcs.tRow, ri === 2 && { borderBottomWidth: 0 }, { borderBottomColor: theme.border }]}>
                                <View style={[fcs.hCell, fcs.labelCol, { borderRightColor: theme.border, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }]}>
                                    {r.icon}
                                    <Text style={[fcs.rowLabel, { color: theme.text }]}>{r.label}</Text>
                                </View>
                                {[0, 1, 2].map(col => (
                                    <View key={col} style={[fcs.cell, fcs.dataCol, { borderRightColor: theme.border }, col === 2 && { borderRightWidth: 0 }]}
                                        pointerEvents={isStudent ? "none" : "auto"}>
                                        <TextInput
                                            style={[fcs.cellInput, { color: theme.text }]}
                                            placeholder="..."
                                            placeholderTextColor={theme.secondaryText + '35'}
                                            multiline
                                            value={matrix[`${r.row}-${col}`]}
                                            onChangeText={(t) => onCellChange(domain.key, r.row, col, t)}
                                            onFocus={() => setCardLevel(COL_LEVELS[col])}
                                            editable={!isStudent}
                                        />
                                    </View>
                                ))}
                            </View>
                        ))}
                    </View>
                </View>
            </Animated.View>
        </View>
    );
};

const fcs = StyleSheet.create({
    cardWrapper: { width: '100%', height: 280, marginBottom: 18 },
    cardFace: {
        position: 'absolute', width: '100%', height: '100%',
        borderRadius: 20, overflow: 'hidden',
        shadowColor: '#000', shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.18, shadowRadius: 16, elevation: 8,
    },
    // Front
    frontContent: {
        flex: 1, flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 16, paddingVertical: 20,
        borderLeftWidth: 5, borderWidth: 1,
        borderRadius: 20,
    },
    frontImageWrap: {
        width: 100, height: 100,
        borderRadius: 50, overflow: 'hidden',
        backgroundColor: 'rgba(0,0,0,0.03)',
        justifyContent: 'center', alignItems: 'center',
    },
    frontImage: { width: 90, height: 90 },
    frontInfo: { flex: 1, marginLeft: 16 },
    frontIcon: { fontSize: 28, marginBottom: 4 },
    frontTitle: { fontSize: 16, fontWeight: '700', fontFamily: 'Jost_600SemiBold', letterSpacing: 0.5 },
    frontSub: { fontSize: 10, marginTop: 2, letterSpacing: 1, fontFamily: 'Jost_300Light', textTransform: 'uppercase' },
    tapBadge: { marginTop: 12, alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, borderWidth: 1 },
    tapText: { fontSize: 9, fontWeight: '700', letterSpacing: 2, fontFamily: 'Jost_600SemiBold' },
    // Back
    backContent: { flex: 1, padding: 10, borderRadius: 20, borderWidth: 1 },
    backTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 6, gap: 8 },
    backImage: { width: 44, height: 44 },
    backHeaderRight: { flex: 1 },
    backTitle: { fontSize: 12, fontWeight: '700', fontFamily: 'Jost_600SemiBold', letterSpacing: 0.5 },
    levelHint: { fontSize: 9, fontWeight: '600', letterSpacing: 1, marginTop: 1 },
    closePill: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    closeText: { fontSize: 14, fontWeight: '300' },
    // Table
    table: { flex: 1, borderWidth: 1, borderRadius: 12, overflow: 'hidden' },
    tRow: { flexDirection: 'row', flex: 1, borderBottomWidth: 1 },
    labelCol: { width: '24%' },
    dataCol: { width: '25.33%' },
    hCell: { justifyContent: 'center', alignItems: 'center', borderRightWidth: 1, paddingVertical: 2 },
    cell: { justifyContent: 'center', borderRightWidth: 1 },
    colLabel: { fontSize: 7, fontWeight: '800', marginTop: 1, letterSpacing: 0.5 },
    rowLabel: { fontSize: 7, fontWeight: '800', marginTop: 2 },
    cellInput: { flex: 1, fontSize: 9, textAlignVertical: 'top', textAlign: 'center', padding: 3 },
});

// ── Main Page ───────────────────────────────────────────────────────────

export default function YearEndSummary() {
    const { user, profile, activeStudentId, activeStudentProfile, setActiveStudentProfile } = useAuth();
    const { theme } = useTheme();
    const router = useRouter();
    const styles = getStyles(theme);

    const targetUserId = activeStudentId || user?.id;
    const targetProfile = activeStudentProfile || profile;
    const isStudent = user?.role === 'student';

    const [isLoading, setIsLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);

    const [domainMatrices, setDomainMatrices] = useState({
        d1: { ...EMPTY_MATRIX }, d2: { ...EMPTY_MATRIX }, d3: { ...EMPTY_MATRIX },
        d4: { ...EMPTY_MATRIX }, d5: { ...EMPTY_MATRIX }, d6: { ...EMPTY_MATRIX },
    });

    const handleCellChange = useCallback((domainKey, row, col, text) => {
        setDomainMatrices(prev => ({
            ...prev,
            [domainKey]: { ...prev[domainKey], [`${row}-${col}`]: text }
        }));
    }, []);

    useEffect(() => {
        if (targetUserId) {
            const fetchProfile = async () => {
                try {
                    setIsLoading(true);
                    const res = await fetch(`${API_URL}/students/profile/${targetUserId}`);
                    const data = await res.json();
                    if (data?.assessments) {
                        const assess = typeof data.assessments === 'string' ? JSON.parse(data.assessments) : data.assessments;
                        if (assess.domainMatricesV2) {
                            setDomainMatrices(prev => ({ ...prev, ...assess.domainMatricesV2 }));
                        }
                    }
                } catch (err) {
                    console.warn("[YearEndSummary] Fetch failed:", err);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchProfile();
        } else {
            setIsLoading(false);
        }
    }, [targetUserId]);

    const handleProceed = async () => {
        if (isLoading) return;
        if (user?.role !== 'student' && !activeStudentId) {
            Alert.alert("No Student Selected", "Please select a student first.");
            router.replace("/TeacherTracking");
            return;
        }
        setIsSyncing(true);
        try {
            const currentAssess = typeof targetProfile?.assessments === 'string'
                ? JSON.parse(targetProfile.assessments) : (targetProfile?.assessments || {});
            const updatedAssess = { ...currentAssess, domainMatricesV2: domainMatrices };
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
            Alert.alert("Saved", "Year-End Summary saved.");
        } catch (err) {
            console.error("[YearEndSummary] Save error:", err);
        } finally {
            setIsSyncing(false);
        }
        router.push('/part_b/transition');
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
                    <Text style={styles.title}>Part C: Year-End Summary</Text>
                    <Text style={styles.subtitle}>Tap each domain card to assess</Text>
                </View>
            </View>

            <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                {DOMAINS.map((domain, idx) => (
                    <Animated.View key={domain.key} entering={FadeInDown.delay(100 + idx * 60)}>
                        <FlipCard
                            domain={domain}
                            matrix={domainMatrices[domain.key]}
                            onCellChange={handleCellChange}
                            theme={theme}
                            isStudent={isStudent}
                        />
                    </Animated.View>
                ))}

                <TouchableOpacity
                    style={[styles.proceedBtn, (isLoading || isSyncing) && { opacity: 0.5 }]}
                    onPress={handleProceed}
                    disabled={isLoading || isSyncing}
                >
                    {isSyncing ? <ActivityIndicator color={theme.buttonText} /> : <Text style={styles.proceedText}>Proceed to Export  →</Text>}
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
    title: { fontSize: 20, fontWeight: '800', color: theme.text, fontFamily: 'Jost_600SemiBold', letterSpacing: 1 },
    subtitle: { fontSize: 11, color: theme.secondaryText, marginTop: 2, letterSpacing: 1, fontFamily: 'Jost_300Light', textTransform: 'uppercase' },
    scrollContent: { padding: 15 },
    proceedBtn: {
        marginTop: 10, paddingVertical: 18, borderRadius: 16,
        alignItems: 'center', backgroundColor: theme.primary,
        shadowColor: theme.primary, shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
    },
    proceedText: { color: theme.buttonText, fontWeight: '800', fontSize: 16, letterSpacing: 1, fontFamily: 'Jost_600SemiBold' },
});
