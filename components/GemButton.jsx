import React from 'react';
import { StyleSheet, View, ImageBackground, Text, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import SoundButton from './SoundButton';
import { useTheme } from '../context/GlobalContext';

// Image map for gem types
const gemImages = {
  sapphire: require('../assets/images/gems/gem_sapphire.png'),
  ice: require('../assets/images/gems/gem_ice.png'),
  teal: require('../assets/images/gems/gem_teal.png'),
  silver: require('../assets/images/gems/gem_silver.png'),
  onyx: require('../assets/images/gems/gem_onyx.png'),
};

// Map original aspect ratios of the PNGs to avoid empty letterboxing
const gemAspectRatios = {
  sapphire: 384 / 309, // ~1.24
  ice: 352 / 284,      // ~1.24
  teal: 386 / 302,     // ~1.28
  silver: 376 / 306,   // ~1.23
  onyx: 347 / 313,     // ~1.11
};

// Legacy gemType mapping → new image keys
const gemTypeMap = {
  sapphire: 'sapphire',
  emerald: 'teal',
  jade: 'teal',
  topaz: 'silver',
  citrine: 'silver',
  aquamarine: 'ice',
  onyx: 'onyx',
};

export default function GemButton({ children, onPress, style, disabled, gemType, goldOutline, width }) {
  const { theme } = useTheme();

  // Resolve which image to use
  const imageKey = gemTypeMap[gemType] || 'sapphire';
  const gemImage = gemImages[imageKey];
  const aspect = gemAspectRatios[imageKey] || 1.24;

  // Set sizing based on aspect ratio
  const buttonWidth = width || 220; // Default width is larger now (220)
  const buttonHeight = buttonWidth / aspect;

  const content = (
    <SoundButton 
      onPress={onPress} 
      activeOpacity={0.8} 
      style={styles.buttonContainer}
      disabled={disabled}
    >
      <ImageBackground
        source={gemImage}
        style={{ width: buttonWidth, height: buttonHeight, justifyContent: 'center', alignItems: 'center' }}
        imageStyle={styles.gemImageInner}
        resizeMode="contain"
      >
        <View style={styles.content}>
          {children}
        </View>
      </ImageBackground>
    </SoundButton>
  );

  return (
    <View style={[styles.container, style]}>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
    alignItems: 'center',
  },
  buttonContainer: {
    backgroundColor: 'transparent',
  },
  gemImageInner: {
    borderRadius: 8,
  },
  content: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    zIndex: 10,
  }
});
