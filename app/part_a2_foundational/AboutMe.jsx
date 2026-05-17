import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, StatusBar, TouchableOpacity, Image, Dimensions, Platform, Alert, ActivityIndicator } from 'react-native';
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
import useAutoSave from '../../hooks/useAutoSave';

const { width: W } = Dimensions.get('window');

// ── Sparkle Decoration ────────────────────────────────────────────────
const Sparkle = ({ style, size = 15, color = '#FFF', delay = 0 }) => (
    <Animated.View 
        entering={FadeInDown.delay(delay).springify()}
        style={[{ position: 'absolute', zIndex: 10 }, style]}
    >
        <Ionicons name="sparkles" size={size} color={color} style={{ opacity: 0.8 }} />
    </Animated.View>
);

// ── Section Card (Glassmorphism) ───────────────────────────────────────

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

// ── Gold Underline Input ────────────────────────────────────────────────

const GoldInput = ({ label, value, onChangeText, placeholder, theme, keyboardType, multiline }) => (
    <View style={{ marginBottom: 16 }}>
        {label && <Text style={[gis.label, { color: theme.secondaryText }]}>{label}</Text>}
        <TextInput
            style={[gis.input, { color: theme.text, borderBottomColor: gems.topaz + '50' }]}
            placeholder={placeholder || ''}
            placeholderTextColor={theme.secondaryText + '40'}
            value={value}
            onChangeText={onChangeText}
            keyboardType={keyboardType}
            multiline={multiline}
            textAlignVertical={multiline ? 'top' : 'center'}
        />
    </View>
);

const gis = StyleSheet.create({
    label: { fontSize: 9, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6, fontFamily: 'Jost_600SemiBold' },
    input: { fontSize: 14, fontFamily: 'Jost_400Regular', paddingVertical: 8, paddingHorizontal: 4, borderBottomWidth: 1.5 },
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
    const [familyPhoto, setFamilyPhoto] = useState(null);
    const [name, setName] = useState('');
    const [age, setAge] = useState('');
    const [birthday, setBirthday] = useState('');
    const [liveIn, setLiveIn] = useState('');
    const [friends, setFriends] = useState(['', '', '']);
    const [aspiration, setAspiration] = useState('');
    const [favourites, setFavourites] = useState({
        colour: '', food: '', animal: '', flower: '', sport: '', subject: ''
    });

    // Compute progress
    const allFields = [photo, name, age, birthday, liveIn, familyPhoto, friends[0], aspiration, favourites.colour, favourites.food];
    const filled = allFields.filter(Boolean).length;
    const progress = Math.round((filled / allFields.length) * 100);

    useEffect(() => {
        if (targetProfile) {
            const fd = typeof targetProfile.family_details === 'string' ? JSON.parse(targetProfile.family_details || '{}') : (targetProfile.family_details || {});
            const a2 = targetProfile.a2_data || fd.a2_foundational || {};
            const prefs = typeof targetProfile.preferences === 'string' ? JSON.parse(targetProfile.preferences || '{}') : (targetProfile.preferences || {});
            setName(prev => prev || targetProfile.full_name || a2.name || '');
            setAge(prev => prev || targetProfile.age || a2.age || '');
            setBirthday(prev => prev || a2.birthday || targetProfile.dob || fd.dob || '');
            setLiveIn(prev => prev || a2.liveIn || fd.location || targetProfile.address || '');
            setPhoto(prev => prev || a2.photo || fd.subjectPhoto || '');
            setFamilyPhoto(prev => prev || a2.familyPhoto || '');
            if (a2.friends) setFriends(prev => prev[0] ? prev : a2.friends);
            if (a2.aspiration) setAspiration(prev => prev || a2.aspiration);
            // Merge favourites from preferences table + a2_data
            const mergedFavs = { ...prefs, ...(a2.favourites || {}) };
            if (Object.keys(mergedFavs).length > 0) {
                setFavourites(prev => ({
                    colour: prev.colour || mergedFavs.colour || '',
                    food: prev.food || mergedFavs.food || '',
                    animal: prev.animal || mergedFavs.animal || '',
                    flower: prev.flower || mergedFavs.flower || '',
                    sport: prev.sport || mergedFavs.sport || '',
                    subject: prev.subject || mergedFavs.subject || '',
                }));
            }
        }
    }, [targetProfile]);

    // Fetch full profile if we only have a stub
    useEffect(() => {
        if (targetUserId && (!targetProfile || !targetProfile.full_name)) {
            (async () => {
                try {
                    const res = await fetch(`${API_URL}/students/profile/${targetUserId}`);
                    const data = await res.json();
                    if (data && data.full_name) {
                        if (isTeacher && activeStudentId) setActiveStudentProfile(data);
                        else setAuthProfile(data);
                    }
                } catch (e) { console.warn('Profile fetch failed', e); }
            })();
        }
    }, [targetUserId]);

    // AutoSave on page exit
    const getPayload = useCallback(() => ({
        userId: targetUserId,
        fullName: name,
        a2Data: { name, age, birthday, liveIn, photo, familyPhoto, friends, aspiration, favourites },
        preferences: favourites,
    }), [targetUserId, name, age, birthday, liveIn, photo, familyPhoto, friends, aspiration, favourites]);

    useAutoSave(targetUserId, getPayload, [name, age, birthday, liveIn, aspiration, favourites]);

    const pickImage = async (setter) => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.5, base64: true,
        });
        if (!result.canceled) {
            setter(`data:image/jpeg;base64,${result.assets[0].base64}`);
        }
    };

    const updateFriend = (idx, val) => {
        const f = [...friends]; f[idx] = val; setFriends(f);
    };

    const handleSave = async () => {
        if (!targetUserId) return;
        setLoading(true);
        try {
            const fd = typeof targetProfile?.family_details === 'string' ? JSON.parse(targetProfile.family_details || '{}') : (targetProfile?.family_details || {});
            const a2Data = { name, age, birthday, liveIn, photo, familyPhoto, friends, aspiration, favourites };
            const familyDetails = { ...fd, a2_foundational: a2Data };

            const res = await fetch(`${API_URL}/students/profile`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: targetUserId,
                    fullName: name,
                    familyDetails,
                    a2Data,
                    preferences: favourites,
                })
            });
            if (res.ok) {
                const updated = { ...targetProfile, family_details: familyDetails, a2_data: a2Data, preferences: favourites };
                if (isTeacher && activeStudentId) setActiveStudentProfile(updated);
                else setAuthProfile(updated);
                Alert.alert('Saved', 'Profile updated!');
            }
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleNext = async () => {
        await handleSave();
        router.push('/part_b_preparatory/SelectionPage');
    };

    const styles = getStyles(theme);

    return (
        <View style={{ flex: 1, backgroundColor: theme.background }}>
            <PremiumBackground />
            <SafeAreaView style={{ flex: 1 }}>
                <StatusBar translucent barStyle={theme.isDark ? 'light-content' : 'dark-content'} backgroundColor="transparent" />

                {/* Header */}
                <View style={styles.header}>
                    <SoundButton onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="chevron-back" size={22} color={theme.text} />
                    </SoundButton>
                    <View style={{ flex: 1, alignItems: 'center' }}>
                        <Text style={[styles.title, { color: theme.text }]}>MY TREASURE CARD</Text>
                        <Text style={[styles.subtitle, { color: theme.secondaryText }]}>✨ Magical Memories ✨</Text>
                    </View>
                    <SoundButton onPress={handleSave} style={[styles.backBtn, { borderColor: gems.topaz + '80' }]}>
                        <Ionicons name="sparkles" size={20} color={gems.topaz} />
                    </SoundButton>
                </View>

                {/* Gold Progress Bar */}
                <Animated.View entering={FadeInDown.delay(50)} style={styles.progressWrap}>
                    <View style={styles.progressTrack}>
                        <View style={[styles.progressFill, { width: `${progress}%` }]} />
                    </View>
                    <Text style={[styles.progressText, { color: theme.secondaryText }]}>{progress}%</Text>
                </Animated.View>

                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                    {/* ── My Photo ────────────────────────────────────── */}
                    <Section gemType="sapphire" label="My Photo" theme={theme} delay={100}>
                        <TouchableOpacity onPress={() => pickImage(setPhoto)} style={[styles.photoCircle, { borderColor: gems.topaz }]}>
                            {photo ? (
                                <Image source={{ uri: photo }} style={styles.photoImage} />
                            ) : (
                                <View style={styles.photoPlaceholder}>
                                    <Ionicons name="camera-outline" size={28} color={gems.topaz} />
                                    <Text style={[styles.photoHint, { color: theme.secondaryText }]}>Tap to add</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </Section>

                    {/* ── Identity ────────────────────────────────────── */}
                    <Section gemType="emerald" label="Identity" theme={theme} delay={200}>
                        <GoldInput label="My Name" value={name} onChangeText={setName} placeholder="What is your name?" theme={theme} />
                        <View style={{ flexDirection: 'row', gap: 16 }}>
                            <View style={{ flex: 1 }}>
                                <GoldInput label="My Age" value={age} onChangeText={setAge} placeholder="5" theme={theme} keyboardType="numeric" />
                            </View>
                            <View style={{ flex: 2 }}>
                                <GoldInput label="My Birthday" value={birthday} onChangeText={setBirthday} placeholder="DD/MM/YYYY" theme={theme} />
                            </View>
                        </View>
                        <GoldInput label="I Live In" value={liveIn} onChangeText={setLiveIn} placeholder="City / Town" theme={theme} />
                    </Section>

                    {/* ── My Family ───────────────────────────────────── */}
                    <Section gemType="topaz" label="My Family" theme={theme} delay={300}>
                        <TouchableOpacity onPress={() => pickImage(setFamilyPhoto)} style={[styles.familyFrame, { borderColor: gems.topaz + '60' }]}>
                            {familyPhoto ? (
                                <Image source={{ uri: familyPhoto }} style={styles.familyImage} />
                            ) : (
                                <View style={styles.familyPlaceholder}>
                                    <Ionicons name="people-outline" size={32} color={gems.topaz} />
                                    <Text style={[styles.photoHint, { color: theme.secondaryText }]}>Tap to add family photo or drawing</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </Section>

                    {/* ── My Friends ──────────────────────────────────── */}
                    <Section gemType="ruby" label="My Friends" theme={theme} delay={400}>
                        {friends.map((f, i) => (
                            <GoldInput key={i} label={`Friend ${i + 1}`} value={f} onChangeText={(v) => updateFriend(i, v)} placeholder="Friend's name" theme={theme} />
                        ))}
                    </Section>

                    {/* ── When I Grow Up ──────────────────────────────── */}
                    <Section gemType="sapphire" label="Aspiration" theme={theme} delay={500}>
                        <Text style={[styles.promptText, { color: theme.text }]}>I want to be a</Text>
                        <GoldInput value={aspiration} onChangeText={setAspiration} placeholder="Doctor, Astronaut, Teacher..." theme={theme} />
                        <Text style={[styles.promptText, { color: theme.text }]}>when I grow up ✨</Text>
                    </Section>

                    {/* ── My Favourites ───────────────────────────────── */}
                    <Section gemType="emerald" label="My Favourites" theme={theme} delay={600}>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                            {[
                                { key: 'colour', emoji: '🎨', label: 'Colour', color: gems.ruby },
                                { key: 'food', emoji: '🍕', label: 'Food', color: gems.topaz },
                                { key: 'animal', emoji: '🐾', label: 'Animal', color: gems.emerald },
                                { key: 'flower', emoji: '🌸', label: 'Flower', color: gems.amethyst },
                                { key: 'sport', emoji: '⚽', label: 'Sport', color: gems.sapphire },
                                { key: 'subject', emoji: '📚', label: 'Subject', color: gems.moonstone },
                            ].map(fav => (
                                <View key={fav.key} style={[styles.favItem, { backgroundColor: fav.color + '15', borderColor: fav.color + '30' }]}>
                                    <Text style={styles.favEmoji}>{fav.emoji}</Text>
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.favLabel, { color: fav.color }]}>{fav.label}</Text>
                                        <TextInput
                                            style={[styles.favInput, { color: theme.text }]}
                                            value={favourites[fav.key]}
                                            onChangeText={(v) => setFavourites(prev => ({ ...prev, [fav.key]: v }))}
                                            placeholder="..."
                                            placeholderTextColor={theme.secondaryText + '30'}
                                        />
                                    </View>
                                </View>
                            ))}
                        </View>
                    </Section>

                    {/* ── Proceed Button ──────────────────────────────── */}
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

    // Photo
    photoCircle: { width: 120, height: 120, borderRadius: 60, borderWidth: 2.5, alignSelf: 'center', overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
    photoImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    photoPlaceholder: { alignItems: 'center', gap: 4 },
    photoHint: { fontSize: 9, fontWeight: '600', letterSpacing: 1, fontFamily: 'Jost_400Regular' },

    // Family
    familyFrame: { width: '100%', height: 160, borderRadius: 16, borderWidth: 2, borderStyle: 'dashed', overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
    familyImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    familyPlaceholder: { alignItems: 'center', gap: 8 },

    // Prompt
    promptText: { fontSize: 15, fontFamily: 'Jost_400Regular', marginBottom: 4 },

    // Favourites
    favItem: { 
        width: '47%', 
        flexDirection: 'row', 
        alignItems: 'center', 
        padding: 12, 
        borderRadius: 16, 
        borderWidth: 1,
        gap: 8,
    },
    favEmoji: { fontSize: 22 },
    favLabel: { fontSize: 8, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase', fontFamily: 'Jost_700Bold' },
    favInput: { fontSize: 13, fontFamily: 'Jost_400Regular', paddingVertical: 2 },

    btnText: { color: '#FFF', fontSize: 14, fontWeight: '700', letterSpacing: 2, fontFamily: 'Jost_600SemiBold' },
});
