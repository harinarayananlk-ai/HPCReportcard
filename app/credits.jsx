import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { WebView } from 'react-native-webview';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/GlobalContext';

export default function CreditsPage() {
  const router = useRouter();
  const { theme } = useTheme();

  // On native, we use the local HTML file. On web, we might need a different approach.
  // For Expo, local files in 'app' are not automatically assets.
  // But we can use require() if configured, or just point to the file.
  
  return (
    <View style={styles.container}>
      <WebView 
        source={require('./credits_animation.html')} 
        style={styles.webview}
        originWhitelist={['*']}
      />
      <TouchableOpacity 
        style={[styles.backButton, { backgroundColor: theme.surface }]} 
        onPress={() => router.back()}
      >
        <Ionicons name="close" size={24} color={theme.text} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  webview: {
    flex: 1,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  }
});
