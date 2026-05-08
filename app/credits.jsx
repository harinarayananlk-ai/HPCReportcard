import React from 'react';
import { StyleSheet, View, Text, ScrollView, Dimensions, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/GlobalContext';
import PremiumBackground from '../components/PremiumBackground';
import SoundButton from '../components/SoundButton';

const { width } = Dimensions.get('window');

const CREDIT_ITEMS = [
  { role: "Executive Producer", name: "Laksh" },
  { role: "Lead Developer", name: "Antigravity AI" },
  { role: "UI Design", name: "Premium Minimalist Systems" },
  { role: "Backend Architecture", name: "FastAPI / Python" },
  { role: "Visual Assets", name: "DALL-E 3 / Custom Textures" },
  { role: "Core Framework", name: "React Native & Expo" },
];

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
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>ACADEMIA</Text>
          <View style={[styles.line, { backgroundColor: theme.primary }]} />
          <Text style={[styles.subtitle, { color: theme.secondaryText }]}>DEVELOPMENT_CREDITS</Text>
        </View>

        <View style={styles.listContainer}>
          {CREDIT_ITEMS.map((item, index) => (
            <View key={index} style={styles.creditItem}>
              <Text style={[styles.roleText, { color: theme.secondaryText }]}>{item.role.toUpperCase()}</Text>
              <Text style={[styles.nameText, { color: theme.text }]}>{item.name}</Text>
            </View>
          ))}
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.secondaryText }]}>© 2026 ACADEMIA PORTAL // UPLINK_ENCRYPTED</Text>
        </View>
      </ScrollView>

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
    paddingTop: 140,
    paddingBottom: 80,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 80,
  },
  title: {
    fontSize: 28,
    letterSpacing: 12,
    fontFamily: 'Jost_600SemiBold',
  },
  line: {
    width: 30,
    height: 1,
    marginVertical: 24,
    opacity: 0.5,
  },
  subtitle: {
    fontSize: 10,
    letterSpacing: 6,
    fontFamily: 'Jost_300Light',
    opacity: 0.7,
  },
  listContainer: {
    width: width * 0.8,
  },
  creditItem: {
    marginBottom: 48,
    alignItems: 'center',
  },
  roleText: {
    fontSize: 9,
    letterSpacing: 3,
    marginBottom: 12,
    fontFamily: 'Jost_600SemiBold',
    opacity: 0.5,
  },
  nameText: {
    fontSize: 18,
    fontFamily: 'Jost_300Light',
    letterSpacing: 1,
  },
  footer: {
    marginTop: 60,
  },
  footerText: {
    fontSize: 8,
    letterSpacing: 2,
    fontFamily: 'Jost_600SemiBold',
    opacity: 0.4,
  },
  backButton: {
    position: 'absolute',
    top: 60,
    right: 30,
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  }
});
