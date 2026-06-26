import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  ScrollView,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

import { useTheme, useAuth, API_URL } from '../../context/GlobalContext';
import PremiumBackground from '../../components/PremiumBackground';
import SoundButton from '../../components/SoundButton';
import MenuDropdown from '../../components/MenuDropdown';
import GemButton from '../../components/GemButton';
import AccordionStepper from '../../components/AccordionStepper';
import AutoResizingInput from '../../components/AutoResizingInput';
import { gems } from '../../colour_themes';
import useAutoSave from '../../hooks/useAutoSave';

export default function AboutMe() {
  const { user, profile, setProfile: setAuthProfile, activeStudentId, activeStudentProfile, setActiveStudentProfile } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();

  const isTeacher = user?.role === 'teacher' || user?.role === 'superadmin';
  const targetUserId = (isTeacher && activeStudentId) ? activeStudentId : user?.id;
  const targetProfile = (isTeacher && activeStudentProfile) ? activeStudentProfile : profile;

  // Local States
  const [loading, setLoading] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  // Form Fields State
  const [photo, setPhoto] = useState(null);
  const [familyPhoto, setFamilyPhoto] = useState(null);
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [goodAt, setGoodAt] = useState('');
  const [improveSkill, setImproveSkill] = useState('');
  const [likeTo, setLikeTo] = useState('');
  const [dontLikeTo, setDontLikeTo] = useState('');
  const [heroName, setHeroName] = useState('');
  const [heroPhoto, setHeroPhoto] = useState(null);
  const [favFood, setFavFood] = useState(['', '', '']);
  const [favGames, setFavGames] = useState(['', '', '']);
  const [favFestivals, setFavFestivals] = useState(['', '', '']);
  const [favThingsToLearn, setFavThingsToLearn] = useState(['', '', '']);

  // Load Initial Data
  useEffect(() => {
    if (targetProfile) {
      const fd = typeof targetProfile.family_details === 'string'
        ? JSON.parse(targetProfile.family_details || '{}')
        : (targetProfile.family_details || {});
      const a2 = fd.a2_preparatory || {};

      setPhoto(a2.photo || fd.subjectPhoto || '');
      setFamilyPhoto(a2.familyPhoto || '');
      setName(prev => prev || targetProfile.full_name || a2.name || '');
      setAge(prev => prev || targetProfile.age || a2.age || '');
      setGoodAt(a2.goodAt || '');
      setImproveSkill(a2.improveSkill || '');
      setLikeTo(a2.likeTo || '');
      setDontLikeTo(a2.dontLikeTo || '');
      setHeroName(a2.heroName || '');
      setHeroPhoto(a2.heroPhoto || null);
      
      if (a2.favFood) setFavFood(a2.favFood);
      if (a2.favGames) setFavGames(a2.favGames);
      if (a2.favFestivals) setFavFestivals(a2.favFestivals);
      if (a2.favThingsToLearn) setFavThingsToLearn(a2.favThingsToLearn);
    }
  }, [targetProfile]);

  // Debounced auto-save payload
  const getPayload = useCallback(() => ({
    userId: targetUserId,
    a2Data: {
      photo, familyPhoto, name, age, goodAt, improveSkill, likeTo, dontLikeTo, heroName, heroPhoto,
      favFood, favGames, favFestivals, favThingsToLearn
    }
  }), [targetUserId, photo, familyPhoto, name, age, goodAt, improveSkill, likeTo, dontLikeTo, heroName, heroPhoto, favFood, favGames, favFestivals, favThingsToLearn]);

  useAutoSave(targetUserId, getPayload, [name, age, goodAt, improveSkill, likeTo, dontLikeTo, heroName, favFood, favGames, favFestivals, favThingsToLearn]);

  const pickImage = async (setter) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.5,
      base64: true,
    });
    if (!result.canceled) {
      setter(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  const handleSave = async () => {
    if (!targetUserId) return;
    setLoading(true);
    try {
      const fd = typeof targetProfile?.family_details === 'string'
        ? JSON.parse(targetProfile.family_details || '{}')
        : (targetProfile?.family_details || {});
      const a2Data = {
        photo, familyPhoto, name, age, goodAt, improveSkill, likeTo, dontLikeTo, heroName, heroPhoto,
        favFood, favGames, favFestivals, favThingsToLearn
      };
      const familyDetails = { ...fd, a2_preparatory: a2Data };

      const res = await fetch(`${API_URL}/students/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: targetUserId,
          registrationNumber: targetProfile?.registration_number,
          familyDetails,
        }),
      });

      if (res.ok) {
        const updated = { ...targetProfile, family_details: familyDetails };
        if (isTeacher && activeStudentId) setActiveStudentProfile(updated);
        else setAuthProfile(updated);
        Alert.alert('Saved', 'Me and My Surroundings updated!');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async () => {
    await handleSave();
    router.push('/part_a3_s2/AssessmentCards');
  };

  const updateMiniList = (list, setter, idx, val) => {
    const updated = [...list];
    updated[idx] = val;
    setter(updated);
  };

  // Check completions for stepper
  const isStepComplete = (index) => {
    switch (index) {
      case 0: return !!name && !!age && !!photo;
      case 1: return !!goodAt.trim() && !!improveSkill.trim() && !!likeTo.trim() && !!dontLikeTo.trim();
      case 2: return !!heroName.trim() && favFood.some(Boolean) && favGames.some(Boolean) && favFestivals.some(Boolean) && favThingsToLearn.some(Boolean);
      default: return false;
    }
  };

  // Steps definition
  const steps = [
    {
      title: '1. The Basics',
      isComplete: isStepComplete(0),
      content: () => (
        <View style={styles.stepForm}>
          <View style={styles.photoContainer}>
            <TouchableOpacity onPress={() => pickImage(setPhoto)} style={[styles.avatarCircle, { borderColor: gems.sapphire }]}>
              {photo ? (
                <Image source={{ uri: photo }} style={styles.avatarImage} />
              ) : (
                <Ionicons name="camera-outline" size={24} color={gems.sapphire} />
              )}
            </TouchableOpacity>
            <Text style={[styles.photoLabel, { color: theme.secondaryText }]}>Profile Photo</Text>
          </View>

          <AutoResizingInput
            placeholder="My Name"
            value={name}
            onChangeText={setName}
            minHeight={40}
            style={styles.blueUnderline}
          />

          <AutoResizingInput
            placeholder="My Age"
            value={age}
            onChangeText={setAge}
            keyboardType="numeric"
            minHeight={40}
            style={styles.blueUnderline}
          />

          <View style={{ marginTop: 12 }}>
            <Text style={[styles.inputHeading, { color: theme.secondaryText }]}>My Family Photo</Text>
            <TouchableOpacity onPress={() => pickImage(setFamilyPhoto)} style={[styles.familyBox, { borderColor: theme.border }]}>
              {familyPhoto ? (
                <Image source={{ uri: familyPhoto }} style={styles.familyImage} />
              ) : (
                <View style={styles.centerPlaceholder}>
                  <Ionicons name="people-outline" size={28} color={theme.secondaryText} />
                  <Text style={{ fontSize: 10, color: theme.secondaryText }}>Add Family Photo</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      ),
    },
    {
      title: '2. My Strengths & Interests',
      isComplete: isStepComplete(1),
      content: () => (
        <View style={styles.stepForm}>
          <Text style={[styles.inputHeading, { color: theme.secondaryText }]}>I am good at...</Text>
          <AutoResizingInput
            placeholder="Things I do well..."
            value={goodAt}
            onChangeText={setGoodAt}
            minHeight={60}
            style={styles.blueUnderline}
          />

          <Text style={[styles.inputHeading, { color: theme.secondaryText, marginTop: 10 }]}>I improve my skill of...</Text>
          <AutoResizingInput
            placeholder="Skills I want to build..."
            value={improveSkill}
            onChangeText={setImproveSkill}
            minHeight={60}
            style={styles.blueUnderline}
          />

          <Text style={[styles.inputHeading, { color: theme.secondaryText, marginTop: 10 }]}>I like to...</Text>
          <AutoResizingInput
            placeholder="Activities I enjoy..."
            value={likeTo}
            onChangeText={setLikeTo}
            minHeight={60}
            style={styles.blueUnderline}
          />

          <Text style={[styles.inputHeading, { color: theme.secondaryText, marginTop: 10 }]}>{"I don't like to..."}</Text>
          <AutoResizingInput
            placeholder="Things I dislike or avoid..."
            value={dontLikeTo}
            onChangeText={setDontLikeTo}
            minHeight={60}
            style={styles.blueUnderline}
          />
        </View>
      ),
    },
    {
      title: '3. My Hero & Favorites',
      isComplete: isStepComplete(2),
      content: () => (
        <View style={styles.stepForm}>
          <View style={[styles.favBox, { borderColor: gems.sapphire + '30' }]}>
            <Text style={[styles.inputHeading, { color: theme.secondaryText }]}>My Hero is...</Text>
            <AutoResizingInput
              placeholder="Name of my hero..."
              value={heroName}
              onChangeText={setHeroName}
              minHeight={40}
              style={styles.blueUnderline}
            />
            <TouchableOpacity onPress={() => pickImage(setHeroPhoto)} style={[styles.heroBox, { borderColor: theme.border }]}>
              {heroPhoto ? (
                <Image source={{ uri: heroPhoto }} style={styles.heroImage} />
              ) : (
                <View style={styles.centerPlaceholder}>
                  <Ionicons name="image-outline" size={24} color={theme.secondaryText} />
                  <Text style={{ fontSize: 10, color: theme.secondaryText }}>Add Hero Photo (Optional)</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Favorites Food */}
          <View style={[styles.favBox, { borderColor: gems.sapphire + '30' }]}>
            <Text style={[styles.miniListHeader, { color: gems.silver }]}>🍔 Food</Text>
            {favFood.map((food, i) => (
              <TextInput
                key={`food-${i}`}
                style={[styles.favListItemInput, { color: theme.text, borderBottomColor: gems.sapphire }]}
                placeholder={`Favorite Food #${i + 1}`}
                placeholderTextColor={theme.secondaryText + '50'}
                value={food}
                onChangeText={(v) => updateMiniList(favFood, setFavFood, i, v)}
              />
            ))}
          </View>

          {/* Favorites Games */}
          <View style={[styles.favBox, { borderColor: gems.sapphire + '30' }]}>
            <Text style={[styles.miniListHeader, { color: gems.silver }]}>⚽ Games</Text>
            {favGames.map((game, i) => (
              <TextInput
                key={`game-${i}`}
                style={[styles.favListItemInput, { color: theme.text, borderBottomColor: gems.sapphire }]}
                placeholder={`Favorite Game #${i + 1}`}
                placeholderTextColor={theme.secondaryText + '50'}
                value={game}
                onChangeText={(v) => updateMiniList(favGames, setFavGames, i, v)}
              />
            ))}
          </View>

          {/* Favorites Festivals */}
          <View style={[styles.favBox, { borderColor: gems.sapphire + '30' }]}>
            <Text style={[styles.miniListHeader, { color: gems.silver }]}>✨ Festivals</Text>
            {favFestivals.map((fest, i) => (
              <TextInput
                key={`fest-${i}`}
                style={[styles.favListItemInput, { color: theme.text, borderBottomColor: gems.sapphire }]}
                placeholder={`Favorite Festival #${i + 1}`}
                placeholderTextColor={theme.secondaryText + '50'}
                value={fest}
                onChangeText={(v) => updateMiniList(favFestivals, setFavFestivals, i, v)}
              />
            ))}
          </View>

          {/* Things to learn */}
          <View style={[styles.favBox, { borderColor: gems.sapphire + '30' }]}>
            <Text style={[styles.miniListHeader, { color: gems.silver }]}>🎓 Things to learn</Text>
            {favThingsToLearn.map((thing, i) => (
              <TextInput
                key={`thing-${i}`}
                style={[styles.favListItemInput, { color: theme.text, borderBottomColor: gems.sapphire }]}
                placeholder={`Things I want to learn #${i + 1}`}
                placeholderTextColor={theme.secondaryText + '50'}
                value={thing}
                onChangeText={(v) => updateMiniList(favThingsToLearn, setFavThingsToLearn, i, v)}
              />
            ))}
          </View>

          {/* Actions Button Columns */}
          <View style={styles.buttonCol}>
            <GemButton
              onPress={handleNext}
              disabled={loading}
              gemType="sapphire"
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.btnText}>{"PROCEED TO\nPART A3\n➔"}</Text>
              )}
            </GemButton>
          </View>
        </View>
      ),
    },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <PremiumBackground />
      <SafeAreaView style={{ flex: 1 }}>
        <StatusBar translucent barStyle={theme.isDark ? 'light-content' : 'dark-content'} backgroundColor="transparent" />

        {/* Header */}
        <View style={styles.header}>
          <MenuDropdown />
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={[styles.title, { color: theme.text }]}>ME AND MY SURROUNDINGS</Text>
            <Text style={[styles.subtitle, { color: theme.secondaryText }]}>✨ Preparatory Stage (S2) ✨</Text>
          </View>
          <SoundButton onPress={handleSave} style={[styles.backBtn, { borderColor: gems.silver + '80' }]}>
            <Ionicons name="sparkles" size={20} color={gems.silver} />
          </SoundButton>
        </View>

        {/* Stepper container */}
        <View style={styles.stepperContainer}>
          <AccordionStepper
            steps={steps}
            activeStep={activeStep}
            onStepChange={setActiveStep}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  title: {
    fontSize: 16,
    fontWeight: '300',
    letterSpacing: 3,
    fontFamily: 'Inter_400Regular',
  },
  subtitle: {
    fontSize: 9,
    letterSpacing: 1,
    marginTop: 2,
    textTransform: 'uppercase',
    fontFamily: 'Inter_400Regular',
  },
  stepperContainer: {
    flex: 1,
    paddingHorizontal: 12,
    marginTop: 10,
  },
  stepForm: {
    width: '100%',
    gap: 14,
  },
  photoContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  photoLabel: {
    fontSize: 10,
    marginTop: 4,
    fontFamily: 'Inter_400Regular',
  },
  inputHeading: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
    fontFamily: 'Outfit_600SemiBold',
  },
  familyBox: {
    width: '100%',
    height: 120,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  familyImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  centerPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  heroBox: {
    width: '100%',
    height: 120,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginTop: 8,
  },
  heroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  favBox: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    backgroundColor: 'rgba(46, 88, 148, 0.08)',
    marginVertical: 4,
  },
  miniListHeader: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    fontFamily: 'Outfit_600SemiBold',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  favListItemInput: {
    borderBottomWidth: 1.5,
    paddingVertical: 6,
    paddingHorizontal: 4,
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    marginBottom: 10,
  },
  blueUnderline: {
    borderBottomColor: gems.sapphire,
    borderBottomWidth: 1.5,
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
  },
  buttonCol: {
    flexDirection: 'column',
    gap: 12,
    marginTop: 20,
    alignItems: 'center',
    width: '100%',
  },
  actionBtn: {
    borderRadius: 16,
  },
  btnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
    fontFamily: 'Outfit_600SemiBold',
    textAlign: 'center',
  },
});
