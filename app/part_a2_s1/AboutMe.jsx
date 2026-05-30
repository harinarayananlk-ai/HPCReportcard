import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Image,
  Dimensions,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

import { useTheme, useAuth, API_URL } from '../../context/GlobalContext';
import PremiumBackground from '../../components/PremiumBackground';
import SoundButton from '../../components/SoundButton';
import GemButton from '../../components/GemButton';
import FavoritesBottomSheet from '../../components/FavoritesBottomSheet';
import { gems } from '../../colour_themes';
import useAutoSave from '../../hooks/useAutoSave';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PAGE_WIDTH = SCREEN_WIDTH - 20;

const emojiMap = {
  red: '🔴', blue: '🔵', green: '🟢', yellow: '🟡', orange: '🟠', pink: '🌸', purple: '🟣', black: '⚫', white: '⚪', gold: '👑', silver: '🥈',
  pizza: '🍕', burger: '🍔', samosa: '🥟', mango: '🥭', apple: '🍎', banana: '🍌', chocolate: '🍫', 'ice cream': '🍦', icecream: '🍦', cake: '🍰', rice: '🍚', milk: '🥛', pasta: '🍝', maggi: '🍜',
  cat: '🐱', dog: '🐶', lion: '🦁', tiger: '🐯', rabbit: '🐰', monkey: '🐵', panda: '🐼', elephant: '🐘', bear: '🐻', deer: '🦌', cow: '🐮', horse: '🐴', fox: '🦊', bengal: '🐯',
  rose: '🌹', sunflower: '🌻', lotus: '🪷', tulip: '🌷', hibiscus: '🌺', marigold: '🌼', lily: '🪻', jasmine: '🌸',
  cricket: '🏏', football: '⚽', soccer: '⚽', badminton: '🏸', tennis: '🎾', basketball: '🏀', chess: '♟️', running: '🏃', swimming: '🏊', kabaddi: '🤼',
  math: '🧮', maths: '🧮', science: '🔬', english: '📖', hindi: '✍️', art: '🎨', music: '🎵', history: '📜', geography: '🗺️', computer: '💻', drawing: '🎨'
};

function getMatchingEmoji(text) {
  if (!text) return null;
  const normalized = text.toLowerCase().trim();
  if (emojiMap[normalized]) {
    return emojiMap[normalized];
  }
  for (const [key, value] of Object.entries(emojiMap)) {
    if (normalized.includes(key)) {
      return value;
    }
  }
  return null;
}

function getDisplayEmoji(cardKey, text, defaultEmoji) {
  if (!text) return defaultEmoji;
  const matched = getMatchingEmoji(text);
  return matched || '';
}

export default function AboutMe() {
  const { user, profile, setProfile: setAuthProfile, activeStudentId, activeStudentProfile, setActiveStudentProfile } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();

  const isTeacher = user?.role === 'teacher' || user?.role === 'superadmin';
  const targetUserId = (isTeacher && activeStudentId) ? activeStudentId : user?.id;
  const targetProfile = (isTeacher && activeStudentProfile) ? activeStudentProfile : profile;

  // Local States
  const [loading, setLoading] = useState(false);
  const [currentTab, setCurrentTab] = useState(0); // 0: Me, 1: My World, 2: Favorites
  const translateX = useSharedValue(0);

  // Form Fields State
  const [photo, setPhoto] = useState(null);
  const [familyPhoto, setFamilyPhoto] = useState(null);
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [birthday, setBirthday] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [liveIn, setLiveIn] = useState('');
  const [friends, setFriends] = useState(['']);
  const [aspiration, setAspiration] = useState('');
  const [favourites, setFavourites] = useState({
    colour: '', food: '', animal: '', flower: '', sport: '', subject: ''
  });

  // Favorites Bottom Sheet State
  const [sheetVisible, setSheetVisible] = useState(false);
  const [activeCategory, setActiveCategory] = useState('colour');

  // Load Initial Data
  useEffect(() => {
    if (targetProfile) {
      const fd = typeof targetProfile.family_details === 'string'
        ? JSON.parse(targetProfile.family_details || '{}')
        : (targetProfile.family_details || {});
      const a2 = targetProfile.a2_data || fd.a2_foundational || {};
      const prefs = typeof targetProfile.preferences === 'string'
        ? JSON.parse(targetProfile.preferences || '{}')
        : (targetProfile.preferences || {});

      setName(prev => prev || targetProfile.full_name || a2.name || '');
      setAge(prev => prev || targetProfile.age || a2.age || '');
      setBirthday(prev => prev || a2.birthday || targetProfile.dob || fd.dob || '');
      setLiveIn(prev => prev || a2.liveIn || fd.location || targetProfile.address || '');
      setPhoto(prev => prev || a2.photo || fd.subjectPhoto || '');
      setFamilyPhoto(prev => prev || a2.familyPhoto || '');
      
      if (a2.friends && Array.isArray(a2.friends)) {
        setFriends(prev => prev[0] ? prev : a2.friends);
      }
      if (a2.aspiration) {
        setAspiration(prev => prev || a2.aspiration);
      }

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

  // Fetch full profile if stub
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
        } catch (e) {
          console.warn('Profile fetch failed', e);
        }
      })();
    }
  }, [targetUserId]);

  // Debounced auto-save payload selector
  const getPayload = useCallback(() => ({
    userId: targetUserId,
    fullName: name,
    a2Data: { name, age, birthday, liveIn, photo, familyPhoto, friends, aspiration, favourites },
    preferences: favourites,
  }), [targetUserId, name, age, birthday, liveIn, photo, familyPhoto, friends, aspiration, favourites]);

  useAutoSave(targetUserId, getPayload, [name, age, birthday, liveIn, aspiration, favourites]);

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

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate && !isNaN(selectedDate.getTime())) {
      const formatted = selectedDate.toISOString().split('T')[0];
      setBirthday(formatted);
    }
  };

  const addFriend = () => {
    if (friends.length < 6) {
      setFriends([...friends, '']);
    }
  };

  const removeFriend = (index) => {
    if (friends.length > 1) {
      setFriends(friends.filter((_, idx) => idx !== index));
    } else {
      setFriends(['']);
    }
  };

  const updateFriend = (index, value) => {
    const updated = [...friends];
    updated[index] = value;
    setFriends(updated);
  };

  const openFavoritesSheet = (category) => {
    setActiveCategory(category);
    setSheetVisible(true);
  };

  const handleFavoriteChange = (value) => {
    setFavourites(prev => ({ ...prev, [activeCategory]: value }));
  };

  const handleSave = async () => {
    if (!targetUserId) return;
    setLoading(true);
    try {
      const fd = typeof targetProfile?.family_details === 'string'
        ? JSON.parse(targetProfile.family_details || '{}')
        : (targetProfile?.family_details || {});
      const a2Data = { name, age, birthday, liveIn, photo, familyPhoto, friends, aspiration, favourites };
      const familyDetails = { ...fd, a2_foundational: a2Data };

      const res = await fetch(`${API_URL}/students/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: targetUserId,
          fullName: name,
          familyDetails,
          a2Data,
          preferences: favourites,
        }),
      });

      if (res.ok) {
        const updated = { ...targetProfile, family_details: familyDetails, a2_data: a2Data, preferences: favourites };
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
    router.push('/part_b_s1/SelectionPage');
  };

  const swipeNext = () => {
    if (currentTab < 2) {
      translateX.value = withTiming(-SCREEN_WIDTH, { duration: 200 }, (finished) => {
        if (finished) {
          runOnJS(setCurrentTab)(currentTab + 1);
          translateX.value = SCREEN_WIDTH;
          translateX.value = withSpring(0, { stiffness: 300, damping: 30, mass: 0.8 });
        }
      });
    } else {
      translateX.value = withSpring(0, { stiffness: 300, damping: 30, mass: 0.8 });
    }
  };

  const swipePrev = () => {
    if (currentTab > 0) {
      translateX.value = withTiming(SCREEN_WIDTH, { duration: 200 }, (finished) => {
        if (finished) {
          runOnJS(setCurrentTab)(currentTab - 1);
          translateX.value = -SCREEN_WIDTH;
          translateX.value = withSpring(0, { stiffness: 300, damping: 30, mass: 0.8 });
        }
      });
    } else {
      translateX.value = withSpring(0, { stiffness: 300, damping: 30, mass: 0.8 });
    }
  };

  const scrollToTab = (index) => {
    if (index === currentTab) return;
    const direction = index > currentTab ? 1 : -1;
    translateX.value = withTiming(direction > 0 ? -SCREEN_WIDTH : SCREEN_WIDTH, { duration: 200 }, (finished) => {
      if (finished) {
        runOnJS(setCurrentTab)(index);
        translateX.value = direction > 0 ? SCREEN_WIDTH : -SCREEN_WIDTH;
        translateX.value = withSpring(0, { stiffness: 300, damping: 30, mass: 0.8 });
      }
    });
  };

  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .onUpdate((event) => {
      translateX.value = event.translationX;
    })
    .onEnd((event) => {
      const velocity = event.velocityX;
      const offset = event.translationX;
      const swipe = offset * velocity;
      
      const swipeConfidenceThreshold = 8000;
      
      if (swipe < -swipeConfidenceThreshold || offset < -120) {
        runOnJS(swipeNext)();
      } else if (swipe > swipeConfidenceThreshold || offset > 120) {
        runOnJS(swipePrev)();
      } else {
        translateX.value = withSpring(0, { stiffness: 300, damping: 30, mass: 0.8 });
      }
    });

  const cardAnimatedStyle = useAnimatedStyle(() => {
    const rotate = interpolate(
      translateX.value,
      [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
      [-10, 0, 10],
      'clamp'
    );
    const opacity = interpolate(
      translateX.value,
      [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
      [0.6, 1, 0.6],
      'clamp'
    );
    const scale = interpolate(
      Math.abs(translateX.value),
      [0, SCREEN_WIDTH],
      [1, 0.95],
      'clamp'
    );

    return {
      transform: [
        { translateX: translateX.value },
        { rotate: `${rotate}deg` },
        { scale }
      ],
      opacity,
    };
  });

  const favoriteCards = [
    { key: 'colour', emoji: '🎨', label: 'Colour', color: gems.ruby },
    { key: 'food', emoji: '🍕', label: 'Food', color: gems.topaz },
    { key: 'animal', emoji: '🐱', label: 'Animal', color: gems.emerald },
    { key: 'flower', emoji: '🌸', label: 'Flower', color: gems.amethyst },
    { key: 'sport', emoji: '⚽', label: 'Sport', color: gems.sapphire },
    { key: 'subject', emoji: '📚', label: 'Subject', color: gems.moonstone },
  ];

  const renderSlideContent = () => {
    switch (currentTab) {
      case 0:
        return (
          <ScrollView style={styles.slideScroll} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
            <Text style={[styles.slideTitle, { color: theme.text }]}>This is Me</Text>
            
            {/* Profile Photo */}
            <TouchableOpacity
              onPress={() => pickImage(setPhoto)}
              style={[styles.photoDropzone, { borderColor: gems.sapphire, backgroundColor: 'rgba(255,255,255,0.05)' }]}
            >
              {photo ? (
                <Image source={{ uri: photo }} style={styles.photoImage} />
              ) : (
                <View style={styles.placeholderContainer}>
                  <Ionicons name="camera-outline" size={32} color={gems.sapphire} />
                  <Text style={[styles.hintText, { color: theme.secondaryText }]}>Add Photo</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Identity Fields */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.secondaryText }]}>My Name</Text>
              <TextInput
                style={[styles.textInput, { color: theme.text, borderColor: gems.sapphire }]}
                placeholder="What is your name?"
                placeholderTextColor={theme.secondaryText + '60'}
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.inputLabel, { color: theme.secondaryText }]}>Age</Text>
                <TextInput
                  style={[styles.textInput, { color: theme.text, borderColor: gems.sapphire }]}
                  placeholder="Age"
                  placeholderTextColor={theme.secondaryText + '60'}
                  value={age}
                  onChangeText={setAge}
                  keyboardType="numeric"
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1.5 }]}>
                <Text style={[styles.inputLabel, { color: theme.secondaryText }]}>Birthday</Text>
                <TouchableOpacity
                  style={[styles.textInput, { borderColor: gems.sapphire, justifyContent: 'center' }]}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text style={{ color: birthday ? theme.text : theme.secondaryText + '60' }}>
                    {birthday || 'YYYY-MM-DD'}
                  </Text>
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={(() => {
                      if (birthday) {
                        const d = new Date(birthday);
                        if (!isNaN(d.getTime())) return d;
                      }
                      return new Date();
                    })()}
                    mode="date"
                    display="default"
                    onChange={handleDateChange}
                  />
                )}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.secondaryText }]}>I Live In</Text>
              <TextInput
                style={[styles.textInput, { color: theme.text, borderColor: gems.sapphire }]}
                placeholder="City / Town"
                placeholderTextColor={theme.secondaryText + '60'}
                value={liveIn}
                onChangeText={setLiveIn}
              />
            </View>

            <GemButton
              gemType="sapphire"
              onPress={() => scrollToTab(1)}
              style={{ marginTop: 20 }}
            >
              <Text style={styles.btnText}>{"NEXT: MY WORLD"}</Text>
            </GemButton>
          </ScrollView>
        );

      case 1:
        return (
          <ScrollView style={styles.slideScroll} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
            <Text style={[styles.slideTitle, { color: theme.text }]}>My World</Text>

            {/* Family Photo */}
            <TouchableOpacity
              onPress={() => pickImage(setFamilyPhoto)}
              style={[styles.familyDropzone, { borderColor: gems.sapphire, backgroundColor: 'rgba(255,255,255,0.05)' }]}
            >
              {familyPhoto ? (
                <Image source={{ uri: familyPhoto }} style={styles.familyImage} />
              ) : (
                <View style={styles.placeholderContainer}>
                  <Ionicons name="people-outline" size={32} color={gems.sapphire} />
                  <Text style={[styles.hintText, { color: theme.secondaryText }]}>Add Family Photo or Drawing</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Friends Dynamic List */}
            <View style={styles.friendsSection}>
              <View style={styles.friendsHeader}>
                <Text style={[styles.inputLabel, { color: theme.secondaryText }]}>My Best Friends (Max 6)</Text>
                {friends.length < 6 && (
                  <TouchableOpacity onPress={addFriend} style={styles.addFriendBtn}>
                    <Ionicons name="add-circle" size={24} color={gems.emerald} />
                  </TouchableOpacity>
                )}
              </View>
              
              {friends.map((friend, idx) => (
                <View key={idx} style={styles.friendRow}>
                  <TextInput
                    style={[styles.textInput, { flex: 1, color: theme.text, borderColor: gems.sapphire }]}
                    placeholder={`Friend #${idx + 1}`}
                    placeholderTextColor={theme.secondaryText + '60'}
                    value={friend}
                    onChangeText={(val) => updateFriend(idx, val)}
                  />
                  <TouchableOpacity onPress={() => removeFriend(idx)} style={styles.removeFriendBtn}>
                    <Ionicons name="trash-outline" size={20} color={gems.ruby} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            {/* Ambition */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.secondaryText }]}>When I Grow Up, I want to be a...</Text>
              <TextInput
                style={[styles.textInput, { color: theme.text, borderColor: gems.sapphire }]}
                placeholder="Astronaut, Doctor, Artist..."
                placeholderTextColor={theme.secondaryText + '60'}
                value={aspiration}
                onChangeText={setAspiration}
              />
            </View>

            <GemButton
              gemType="sapphire"
              onPress={() => scrollToTab(2)}
              style={{ marginTop: 20 }}
            >
              <Text style={styles.btnText}>{"NEXT: MY FAVORITES"}</Text>
            </GemButton>
          </ScrollView>
        );

      case 2:
        return (
          <ScrollView style={styles.slideScroll} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
            <Text style={[styles.slideTitle, { color: theme.text }]}>My Favorites</Text>
            
            <View style={styles.favoritesGrid}>
              {favoriteCards.map(card => {
                const val = favourites[card.key];
                const hasValue = !!val;
                const displayEmoji = getDisplayEmoji(card.key, val, card.emoji);
                
                return (
                  <TouchableOpacity
                    key={card.key}
                    style={[
                      styles.favCard,
                      {
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        borderColor: 'transparent',
                        borderWidth: 0,
                        shadowColor: 'transparent',
                      },
                    ]}
                    onPress={() => openFavoritesSheet(card.key)}
                  >
                    {displayEmoji ? (
                      <Text style={styles.favEmoji}>{displayEmoji}</Text>
                    ) : (
                      <View style={{ height: 28 }} />
                    )}
                    <Text style={[styles.favLabel, { color: card.color }]}>{card.label}</Text>
                    <Text style={[styles.favValueText, { color: theme.text }]} numberOfLines={1}>
                      {val || 'Tap to choose'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Action Buttons inside Card */}
            <View style={styles.actionRow}>
              <GemButton
                onPress={handleNext}
                disabled={loading}
                style={styles.halfBtn}
                gemType="sapphire"
              >
                <Text style={styles.btnText}>{"GO TO\nPART B"}</Text>
              </GemButton>
            </View>
          </ScrollView>
        );

      default:
        return null;
    }
  };

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
            <Text style={[styles.title, { color: theme.text }]}>ME AND MY SURROUNDINGS</Text>
            <Text style={[styles.subtitle, { color: theme.secondaryText }]}>✨ Foundational Stage ✨</Text>
          </View>
          <SoundButton onPress={handleSave} style={[styles.backBtn, { borderColor: gems.topaz + '80' }]}>
            <Ionicons name="sparkles" size={20} color={gems.topaz} />
          </SoundButton>
        </View>

        {/* Sleek Dot Indicator */}
        <View style={styles.dotsContainer}>
          {[0, 1, 2].map((idx) => {
            const isSel = currentTab === idx;
            return (
              <TouchableOpacity
                key={idx}
                onPress={() => scrollToTab(idx)}
                style={[
                  styles.dot,
                  isSel && styles.activeDot
                ]}
              />
            );
          })}
        </View>

        {/* Sliding horizontal carousel */}
        <GestureDetector gesture={panGesture}>
          <View style={styles.cardContainer}>
            <Animated.View 
              style={[
                styles.card, 
                cardAnimatedStyle, 
                { width: PAGE_WIDTH, height: '95%', touchAction: 'pan-y' }
              ]}
            >
              {renderSlideContent()}
            </Animated.View>
          </View>
        </GestureDetector>

        {/* Favorites Bottom Sheet */}
        <FavoritesBottomSheet
          visible={sheetVisible}
          category={activeCategory}
          value={favourites[activeCategory]}
          onChangeText={handleFavoriteChange}
          onClose={() => setSheetVisible(false)}
        />
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
    fontSize: 15,
    fontWeight: '300',
    letterSpacing: 2,
    fontFamily: 'Jost_300Light',
  },
  subtitle: {
    fontSize: 9,
    letterSpacing: 1,
    marginTop: 2,
    textTransform: 'uppercase',
    fontFamily: 'Jost_400Regular',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    marginVertical: 14,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  activeDot: {
    width: 24,
    backgroundColor: gems.sapphire,
  },
  cardContainer: {
    flex: 1,
    paddingHorizontal: 10,
    paddingBottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    alignItems: 'stretch',
  },
  card: {
    width: PAGE_WIDTH,
    height: '95%',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderColor: 'rgba(255, 255, 255, 0.25)',
    borderWidth: 0.5,
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    overflow: 'hidden',
  },
  slideScroll: {
    flex: 1,
  },
  slideContent: {
    paddingBottom: 20,
  },
  slideTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 20,
    fontFamily: 'Jost_600SemiBold',
  },
  photoDropzone: {
    width: '100%',
    height: 140,
    borderRadius: 20,
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginBottom: 20,
  },
  photoImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderContainer: {
    alignItems: 'center',
    gap: 8,
  },
  hintText: {
    fontSize: 12,
    fontFamily: 'Jost_400Regular',
  },
  inputGroup: {
    marginBottom: 16,
    width: '100%',
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 6,
    fontFamily: 'Jost_600SemiBold',
  },
  textInput: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: 'Jost_400Regular',
    minHeight: 48,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  familyDropzone: {
    width: '100%',
    height: 160,
    borderRadius: 20,
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginBottom: 20,
  },
  familyImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  friendsSection: {
    marginBottom: 20,
  },
  friendsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  addFriendBtn: {
    padding: 4,
  },
  friendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  removeFriendBtn: {
    padding: 8,
  },
  favoritesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  favCard: {
    width: '47%',
    borderRadius: 18,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  favEmoji: {
    fontSize: 28,
    marginBottom: 6,
  },
  favLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
    fontFamily: 'Jost_600SemiBold',
  },
  favValueText: {
    fontSize: 13,
    fontWeight: '500',
    fontFamily: 'Jost_400Regular',
  },
  actionRow: {
    flexDirection: 'column',
    gap: 10,
    marginTop: 10,
  },
  halfBtn: {
    width: '100%',
    borderRadius: 16,
  },
  btnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.5,
    fontFamily: 'Jost_600SemiBold',
    textAlign: 'center',
  },
});
