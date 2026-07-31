import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, Dimensions, StatusBar, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming, 
  Layout, 
  FadeInUp 
} from 'react-native-reanimated';
import { useTheme } from '../context/GlobalContext';
import PremiumBackground from '../components/PremiumBackground';
import SoundButton from '../components/SoundButton';
import GemCutCard from '../components/GemCutCard';
import { gems } from '../colour_themes';

const { width } = Dimensions.get('window');

// Epic over-the-top details for the developers!
const DEVELOPERS = [
  {
    name: "Akshay Raghav Dibbur",
    title: "Master of Frontend Engineering and Aesthetic Precision",
    description: "Front-end operations lead who keeps a watchful eye on visual layouts and ensures the development velocity remains on track and aligned.",
    gemColor: gems.silver
  },
  {
    name: "Chirag Krishna T. N.",
    title: "Creative Consultant of Digital Layout and Visual Flow",
    description: "Strategic consultant who monitors the layout, ensures absolute system stability, and provides vital creative oversight during design iterations.",
    gemColor: gems.sapphire
  },
  {
    name: "Hari Narayanan",
    title: "Lead Architect of Core Application Engineering & Supreme Engineer of Database Design",
    description: "The primary architect behind the core codebase, responsible for database design and bringing the application pipeline to life.",
    gemColor: gems.sapphire
  },
  {
    name: "Md. Umair",
    title: "Project Operations Strategist & Engineering Director",
    description: "The group leader who coordinates operations, commands resources, and holds the ultimate organizational vision for the entire project lifecycle.",
    gemColor: gems.silver
  }
];

function DeveloperCard({ dev, index }) {
  const { theme } = useTheme();
  const [expanded, setExpanded] = useState(false);
  
  // Animation values for scale and card height expansion
  const cardScale = useSharedValue(1);
  const cardElevation = useSharedValue(0);

  const handlePress = () => {
    setExpanded(!expanded);
    cardScale.value = withSpring(expanded ? 1 : 1.03, { damping: 10 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
  }));

  return (
    <SoundButton 
      onPress={handlePress}
      activeOpacity={0.9}
      style={styles.cardWrapper}
    >
      <Animated.View style={[animatedStyle]}>
        <GemCutCard 
          style={styles.devCard} 
          contentStyle={{ padding: 24 }}
        >
          {/* Gem Indicator & Name */}
          <View style={styles.cardHeader}>
            <View style={[styles.gemDot, { backgroundColor: dev.gemColor }]} />
            <Text style={[styles.nameText, { color: theme.text }]}>{dev.name}</Text>
            <Ionicons 
              name={expanded ? "chevron-up" : "chevron-down"} 
              size={18} 
              color={theme.secondaryText} 
              style={styles.chevron}
            />
          </View>

          {/* Over-the-top Title */}
          <Text style={[styles.titleText, { color: theme.primary }]}>
            {dev.title.toUpperCase()}
          </Text>

          {/* Expandable description with slide/fade */}
          {expanded && (
            <Animated.View entering={FadeInUp.duration(300)} style={styles.expandedContent}>
              <View style={[styles.divider, { backgroundColor: theme.primary + '30' }]} />
              <Text style={[styles.descriptionText, { color: theme.secondaryText }]}>
                {dev.description}
              </Text>
            </Animated.View>
          )}
        </GemCutCard>
      </Animated.View>
    </SoundButton>
  );
}

export default function CreditsPage() {
  const router = useRouter();
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      <PremiumBackground />
      <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* School Logo & Title Block */}
        <View style={styles.header}>
          <View style={[styles.logoContainer, { borderColor: theme.primary + '40' }]}>
            <Image 
              source={require('../assets/images/icon.png')}
              style={styles.schoolLogo}
              resizeMode="contain"
            />
          </View>
          <Text style={[styles.schoolName, { color: theme.primary }]}>NPS JNR</Text>
          <Text style={[styles.title, { color: theme.text }]}>DEVELOPER PORTAL</Text>
          <Text style={[styles.subtitle, { color: theme.secondaryText }]}>INTERACTIVE_CREDITS_DECK</Text>
        </View>

        {/* Developer List (Gem Deck) */}
        <View style={styles.listContainer}>
          {DEVELOPERS.map((dev, index) => (
            <DeveloperCard key={index} dev={dev} index={index} />
          ))}
        </View>

        {/* Light & Sincere Dedication to Miss Janani */}
        <GemCutCard style={styles.dedicationCard} contentStyle={{ padding: 24 }}>
          <View style={styles.dedicationHeader}>
            <Ionicons name="heart" size={16} color="#D2042D" style={{ marginRight: 8 }} />
            <Text style={[styles.dedicationTitle, { color: theme.text }]}>SPECIAL THANKS</Text>
          </View>
          <Text style={[styles.dedicationText, { color: theme.secondaryText }]}>
            We extend our sincere thanks to <Text style={{ color: theme.text, fontFamily: 'Outfit_600SemiBold' }}>Miss Janani</Text>, our computer science teacher, who supported us and gave us this incredible opportunity to build this app.
          </Text>
        </GemCutCard>



        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.secondaryText }]}>© 2026 ACADEMIA PORTAL // UPLINK_ENCRYPTED</Text>
        </View>
      </ScrollView>

      {/* Back Button */}
      <SoundButton 
        style={[styles.backButton, { backgroundColor: theme.surface + '80' }]} 
        onPress={() => router.back()}
      >
        <Ionicons name="close" size={24} color={theme.text} />
      </SoundButton>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    paddingTop: 80,
    paddingBottom: 80,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginBottom: 20,
    padding: 10,
    overflow: 'hidden',
  },
  schoolName: {
    fontSize: 14,
    letterSpacing: 4,
    fontFamily: 'Outfit_600SemiBold',
    marginBottom: 8,
  },
  schoolLogo: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: 22,
    letterSpacing: 8,
    fontFamily: 'Outfit_600SemiBold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 9,
    letterSpacing: 4,
    fontFamily: 'Inter_400Regular',
    opacity: 0.8,
  },
  listContainer: {
    width: width * 0.9,
    marginBottom: 24,
  },
  cardWrapper: {
    width: '100%',
    marginBottom: 16,
  },
  devCard: {
    width: '100%',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gemDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  nameText: {
    fontSize: 18,
    fontFamily: 'Outfit_600SemiBold',
    flex: 1,
  },
  chevron: {
    marginLeft: 8,
  },
  titleText: {
    fontSize: 8.5,
    letterSpacing: 2,
    fontFamily: 'Outfit_600SemiBold',
    marginTop: 8,
    lineHeight: 14,
  },
  expandedContent: {
    marginTop: 16,
  },
  divider: {
    height: 1,
    width: '100%',
    marginBottom: 14,
  },
  descriptionText: {
    fontSize: 12,
    lineHeight: 18,
    fontFamily: 'Inter_400Regular',
  },
  dedicationCard: {
    width: width * 0.9,
    marginBottom: 36,
  },
  dedicationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  dedicationTitle: {
    fontSize: 11,
    letterSpacing: 4,
    fontFamily: 'Outfit_600SemiBold',
  },
  dedicationText: {
    fontSize: 13,
    lineHeight: 20,
    fontFamily: 'Inter_400Regular',
  },
  techStackContainer: {
    alignItems: 'center',
    marginBottom: 40,
    paddingHorizontal: 24,
  },
  techLabel: {
    fontSize: 8,
    letterSpacing: 4,
    fontFamily: 'Outfit_600SemiBold',
    marginBottom: 8,
  },
  techText: {
    fontSize: 10,
    textAlign: 'center',
    fontFamily: 'Inter_400Regular',
    opacity: 0.8,
  },
  footer: {
    marginTop: 20,
  },
  footerText: {
    fontSize: 8,
    letterSpacing: 2,
    fontFamily: 'Outfit_600SemiBold',
    opacity: 0.4,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  }
});
