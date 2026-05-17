import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, StatusBar, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useAuth, API_URL } from '../../context/GlobalContext';
import PremiumBackground from '../../components/PremiumBackground';
import SoundButton from '../../components/SoundButton';
import GemButton from '../../components/GemButton';
import GemAccent from '../../components/GemAccent';
import { gems } from '../../colour_themes';

// ── Sparkle Decoration ────────────────────────────────────────────────
const Sparkle = ({ style, size = 15, color = '#FFF', delay = 0 }) => (
    <Animated.View 
        entering={FadeInDown.delay(delay).springify()}
        style={[{ position: 'absolute', zIndex: 10 }, style]}
    >
        <Ionicons name="sparkles" size={size} color={color} style={{ opacity: 0.8 }} />
    </Animated.View>
);

// ── Shared sub-components ───────────────────────────────────────────────

const Section = ({ gemType, label, children, theme, delay = 0 }) => (
    <Animated.View 
        entering={FadeInDown.delay(delay).springify()} 
        style={[
            scs.card, 
            { 
                backgroundColor: theme.isDark ? 'rgba(40,40,40,0.7)' : 'rgba(255,255,255,0.7)', 
                borderColor: gems[gemType] + '40',
                shadowColor: gems[gemType],
            }
        ]}
    >
        <View style={scs.cardHeader}>
            <View style={[scs.iconBox, { backgroundColor: gems[gemType] + '20' }]}>
                <GemAccent gemType={gemType} size={24} />
            </View>
            <Text style={[scs.cardLabel, { color: theme.text }]}>{label}</Text>
        </View>
        <View style={[scs.divider, { backgroundColor: theme.border }]} />
        {children}
        <Sparkle style={{ top: 10, right: 10 }} color={gems[gemType]} delay={delay + 200} />
    </Animated.View>
);

const scs = StyleSheet.create({
    card: { 
        borderRadius: 28, 
        borderWidth: 1.5, 
        padding: 22, 
        marginBottom: 24,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 5,
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 },
    iconBox: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    cardLabel: { fontSize: 13, fontWeight: '800', letterSpacing: 1.5, fontFamily: 'Jost_700Bold', textTransform: 'uppercase' },
    divider: { height: 1, marginBottom: 20, opacity: 0.3 },
});

const GoldInput = ({ label, value, onChangeText, placeholder, theme, multiline }) => (
    <View style={{ marginBottom: 16 }}>
        {label && <Text style={[gis.label, { color: theme.secondaryText }]}>{label}</Text>}
        <TextInput
            style={[gis.input, { color: theme.text, borderBottomColor: gems.topaz + '50' }, multiline && { minHeight: 60 }]}
            placeholder={placeholder || ''}
            placeholderTextColor={theme.secondaryText + '40'}
            value={value} onChangeText={onChangeText}
            multiline={multiline}
            textAlignVertical={multiline ? 'top' : 'center'}
        />
    </View>
);

const gis = StyleSheet.create({
    label: { fontSize: 9, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6, fontFamily: 'Jost_600SemiBold' },
    input: { fontSize: 14, fontFamily: 'Jost_400Regular', paddingVertical: 8, paddingHorizontal: 4, borderBottomWidth: 1.5 },
});

// ── Prompt Input (inline sentence with blank) ───────────────────────────

const PromptInput = ({ prefix, suffix, value, onChangeText, theme }) => (
    <View style={pis.row}>
        {prefix && <Text style={[pis.text, { color: theme.text }]}>{prefix}</Text>}
        <TextInput
            style={[pis.inline, { color: theme.text, borderBottomColor: gems.topaz + '50' }]}
            value={value} onChangeText={onChangeText}
            placeholder="___" placeholderTextColor={theme.secondaryText + '30'}
        />
        {suffix && <Text style={[pis.text, { color: theme.text }]}>{suffix}</Text>}
    </View>
);

const pis = StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginBottom: 14 },
    text: { fontSize: 14, fontFamily: 'Jost_400Regular' },
    inline: { flex: 1, minWidth: 80, fontSize: 14, fontFamily: 'Jost_400Regular', borderBottomWidth: 1, marginHorizontal: 4, paddingVertical: 4 },
});

// ── Goal Card ───────────────────────────────────────────────────────────

const GoalCard = ({ title, emoji, goal, setGoal, theme }) => (
    <View style={[gcs.card, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', borderColor: gems.topaz + '40' }]}>
        <View style={gcs.header}>
            <Text style={gcs.emoji}>{emoji}</Text>
            <Text style={[gcs.title, { color: theme.text }]}>{title}</Text>
        </View>
        <GoldInput label="This goal is important because..." value={goal.why} onChangeText={(v) => setGoal({ ...goal, why: v })} theme={theme} multiline />
        <View style={gcs.steps}>
            <GoldInput label="Step 1" value={goal.step1} onChangeText={(v) => setGoal({ ...goal, step1: v })} theme={theme} />
            <GoldInput label="Step 2" value={goal.step2} onChangeText={(v) => setGoal({ ...goal, step2: v })} theme={theme} />
        </View>
    </View>
);

const gcs = StyleSheet.create({
    card: { borderWidth: 1.5, borderRadius: 20, padding: 20, marginBottom: 16 },
    header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
    emoji: { fontSize: 24 },
    title: { fontSize: 15, fontWeight: '700', fontFamily: 'Jost_700Bold', letterSpacing: 0.5 },
    steps: { flexDirection: 'row', gap: 12 },
});

// ── Main Page ───────────────────────────────────────────────────────────

export default function AboutMe() {
    const { user, profile, setProfile: setAuthProfile, activeStudentId, activeStudentProfile, setActiveStudentProfile } = useAuth();
    const { theme } = useTheme();
    const router = useRouter();

    const isTeacher = user?.role === 'teacher' || user?.role === 'superadmin';
    const targetUserId = (isTeacher && activeStudentId) ? activeStudentId : user?.id;
    const targetProfile = (isTeacher && activeStudentProfile) ? activeStudentProfile : profile;

    const [loading, setLoading] = useState(false);
    const [photo, setPhoto] = useState(null);

    // About Me prompts
    const [liveWith, setLiveWith] = useState('');
    const [stayAt, setStayAt] = useState('');
    const [freeTime, setFreeTime] = useState('');
    const [doWell, setDoWell] = useState('');
    const [responsible, setResponsible] = useState('');
    const [doBetter, setDoBetter] = useState('');
    const [careOthers, setCareOthers] = useState('');
    const [proudOf, setProudOf] = useState('');

    // Goals
    const [academicGoal, setAcademicGoal] = useState({ why: '', step1: '', step2: '' });
    const [personalGoal, setPersonalGoal] = useState({ why: '', step1: '', step2: '' });

    // Learnings
    const [schoolLearnings, setSchoolLearnings] = useState(['', '', '']);
    const [outsideLearnings, setOutsideLearnings] = useState(['', '', '']);

    // Teacher
    const [teacherHelp, setTeacherHelp] = useState('');
    const [teacherKnow, setTeacherKnow] = useState('');

    const allFields = [photo, liveWith, freeTime, doWell, responsible, academicGoal.why, personalGoal.why, schoolLearnings[0], teacherHelp];
    const filled = allFields.filter(Boolean).length;
    const progress = Math.round((filled / allFields.length) * 100);

    useEffect(() => {
        if (targetProfile) {
            const fd = typeof targetProfile.family_details === 'string' ? JSON.parse(targetProfile.family_details || '{}') : (targetProfile.family_details || {});
            const a2 = fd.a2_preparatory || {};
            setPhoto(a2.photo || fd.subjectPhoto || '');
            setLiveWith(a2.liveWith || ''); setStayAt(a2.stayAt || '');
            setFreeTime(a2.freeTime || ''); setDoWell(a2.doWell || '');
            setResponsible(a2.responsible || ''); setDoBetter(a2.doBetter || '');
            setCareOthers(a2.careOthers || ''); setProudOf(a2.proudOf || '');
            if (a2.academicGoal) setAcademicGoal(a2.academicGoal);
            if (a2.personalGoal) setPersonalGoal(a2.personalGoal);
            if (a2.schoolLearnings) setSchoolLearnings(a2.schoolLearnings);
            if (a2.outsideLearnings) setOutsideLearnings(a2.outsideLearnings);
            if (a2.teacherHelp) setTeacherHelp(a2.teacherHelp);
            if (a2.teacherKnow) setTeacherKnow(a2.teacherKnow);
        }
    }, [targetProfile]);

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.5, base64: true });
        if (!result.canceled) setPhoto(`data:image/jpeg;base64,${result.assets[0].base64}`);
    };

    const updateLearning = (arr, setter, idx, val) => { const n = [...arr]; n[idx] = val; setter(n); };

    const handleSave = async () => {
        if (!targetUserId) return;
        setLoading(true);
        try {
            const fd = typeof targetProfile?.family_details === 'string' ? JSON.parse(targetProfile.family_details || '{}') : (targetProfile?.family_details || {});
            const a2Data = { photo, liveWith, stayAt, freeTime, doWell, responsible, doBetter, careOthers, proudOf, academicGoal, personalGoal, schoolLearnings, outsideLearnings, teacherHelp, teacherKnow };
            const familyDetails = { ...fd, a2_preparatory: a2Data };

            const res = await fetch(`${API_URL}/students/profile`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: targetUserId, registrationNumber: targetProfile?.registration_number, familyDetails })
            });
            if (res.ok) {
                const updated = { ...targetProfile, family_details: familyDetails };
                if (isTeacher && activeStudentId) setActiveStudentProfile(updated);
                else setAuthProfile(updated);
                Alert.alert('Saved', 'Profile updated!');
            }
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleNext = async () => { await handleSave(); router.push('/part_b_preparatory/SelectionPage'); };

    const styles = getStyles(theme);

    return (
        <View style={{ flex: 1, backgroundColor: theme.background }}>
            <PremiumBackground />
            <SafeAreaView style={{ flex: 1 }}>
                <StatusBar translucent barStyle={theme.isDark ? 'light-content' : 'dark-content'} backgroundColor="transparent" />

                <View style={styles.header}>
                    <SoundButton onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="chevron-back" size={22} color={theme.text} />
                    </SoundButton>
                    <View style={{ flex: 1, alignItems: 'center' }}>
                        <Text style={[styles.title, { color: theme.text }]}>MY ACHIEVEMENT RECORD</Text>
                        <Text style={[styles.subtitle, { color: theme.secondaryText }]}>✨ Reflecting on Growth ✨</Text>
                    </View>
                    <SoundButton onPress={handleSave} style={[styles.backBtn, { borderColor: gems.topaz + '80' }]}>
                        <Ionicons name="sparkles" size={20} color={gems.topaz} />
                    </SoundButton>
                </View>

                <Animated.View entering={FadeInDown.delay(50)} style={styles.progressWrap}>
                    <View style={styles.progressTrack}>
                        <View style={[styles.progressFill, { width: `${progress}%` }]} />
                    </View>
                    <Text style={[styles.progressText, { color: theme.secondaryText }]}>{progress}%</Text>
                </Animated.View>

                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                    {/* Photo */}
                    <Section gemType="sapphire" label="My Photo" theme={theme} delay={100}>
                        <TouchableOpacity onPress={pickImage} style={[styles.photoCircle, { borderColor: gems.topaz }]}>
                            {photo ? <Image source={{ uri: photo }} style={styles.photoImage} /> : (
                                <View style={styles.photoPlaceholder}>
                                    <Ionicons name="camera-outline" size={28} color={gems.topaz} />
                                    <Text style={[styles.photoHint, { color: theme.secondaryText }]}>Tap to add</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </Section>

                    {/* About Me */}
                    <Section gemType="sapphire" label="About Me" theme={theme} delay={200}>
                        <PromptInput prefix="I live with my" value={liveWith} onChangeText={setLiveWith} theme={theme} />
                        <PromptInput prefix="We stay at" value={stayAt} onChangeText={setStayAt} theme={theme} />
                        <PromptInput prefix="I spend my free time doing" value={freeTime} onChangeText={setFreeTime} theme={theme} />
                        <PromptInput prefix="I" value={doWell} onChangeText={setDoWell} suffix="very well" theme={theme} />
                        <PromptInput prefix="I am responsible" value={responsible} onChangeText={setResponsible} theme={theme} />
                        <PromptInput prefix="I could do better when it comes to" value={doBetter} onChangeText={setDoBetter} theme={theme} />
                        <PromptInput prefix="I care about others. I show it by" value={careOthers} onChangeText={setCareOthers} theme={theme} />
                        <PromptInput prefix="I feel proud of myself when" value={proudOf} onChangeText={setProudOf} theme={theme} />
                    </Section>

                    {/* Goals */}
                    <Section gemType="emerald" label="My Goals" theme={theme} delay={300}>
                        <GoalCard title="My Academic Goal" emoji="🎓" goal={academicGoal} setGoal={setAcademicGoal} theme={theme} />
                        <GoalCard title="My Personal Goal" emoji="🌱" goal={personalGoal} setGoal={setPersonalGoal} theme={theme} />
                    </Section>

                    {/* Learnings */}
                    <Section gemType="topaz" label="My Learnings" theme={theme} delay={400}>
                        <View style={{ flexDirection: 'row', gap: 16 }}>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.colTitle, { color: theme.primary }]}>At School</Text>
                                {schoolLearnings.map((l, i) => (
                                    <GoldInput key={i} label={`${i + 1}.`} value={l} onChangeText={(v) => updateLearning(schoolLearnings, setSchoolLearnings, i, v)} theme={theme} />
                                ))}
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.colTitle, { color: theme.primary }]}>Outside School</Text>
                                {outsideLearnings.map((l, i) => (
                                    <GoldInput key={i} label={`${i + 1}.`} value={l} onChangeText={(v) => updateLearning(outsideLearnings, setOutsideLearnings, i, v)} theme={theme} />
                                ))}
                            </View>
                        </View>
                    </Section>

                    {/* For My Teacher */}
                    <Section gemType="ruby" label="For My Teacher" theme={theme} delay={500}>
                        <GoldInput label="I would like my teacher to help me with..." value={teacherHelp} onChangeText={setTeacherHelp} theme={theme} multiline />
                        <GoldInput label="I would like my teacher to know..." value={teacherKnow} onChangeText={setTeacherKnow} theme={theme} multiline />
                    </Section>

                    <GemButton onPress={handleNext} disabled={loading} style={{ borderRadius: 16, marginBottom: 40 }}>
                        {loading ? <ActivityIndicator color="#FFF" /> : (
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 16 }}>
                                <Text style={styles.btnText}>SAVE & PROCEED</Text>
                                <Ionicons name="arrow-forward" size={18} color="#FFF" />
                            </View>
                        )}
                    </GemButton>

                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

const getStyles = (theme) => StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 },
    backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: theme.card, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: theme.border },
    title: { fontSize: 18, fontWeight: '300', letterSpacing: 4, fontFamily: 'Jost_300Light' },
    subtitle: { fontSize: 9, letterSpacing: 1, marginTop: 2, textTransform: 'uppercase', fontFamily: 'Jost_400Regular' },
    progressWrap: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 30, marginBottom: 16, gap: 10 },
    progressTrack: { flex: 1, height: 3, backgroundColor: theme.border, borderRadius: 2 },
    progressFill: { height: '100%', backgroundColor: gems.topaz, borderRadius: 2 },
    progressText: { fontSize: 10, fontWeight: '700', fontFamily: 'Jost_600SemiBold', letterSpacing: 1 },
    scrollContent: { padding: 16, paddingBottom: 40 },
    photoCircle: { width: 120, height: 120, borderRadius: 60, borderWidth: 2.5, alignSelf: 'center', overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
    photoImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    photoPlaceholder: { alignItems: 'center', gap: 4 },
    photoHint: { fontSize: 9, fontWeight: '600', letterSpacing: 1, fontFamily: 'Jost_400Regular' },
    colTitle: { fontSize: 11, fontWeight: '700', fontFamily: 'Jost_600SemiBold', letterSpacing: 1, marginBottom: 12 },
    btnText: { color: '#FFF', fontSize: 14, fontWeight: '700', letterSpacing: 2, fontFamily: 'Jost_600SemiBold' },
});
