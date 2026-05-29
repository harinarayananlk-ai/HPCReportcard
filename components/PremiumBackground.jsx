import React from 'react';
import { View, Image, StyleSheet, Platform } from 'react-native';
import { usePathname } from 'expo-router';
import { useTheme } from '../context/GlobalContext';
import { gems } from '../colour_themes';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';

// A soft glowing orb using SVG
const GlowOrb = ({ color, opacity, size, style }) => (
  <View style={[{ width: size, height: size, position: 'absolute' }, style]}>
    <Svg width="100%" height="100%" viewBox="0 0 100 100">
      <Defs>
        <RadialGradient id={`glow-${color}`} cx="50%" cy="50%" rx="50%" ry="50%" fx="50%" fy="50%">
          <Stop offset="0%" stopColor={color} stopOpacity={opacity} />
          <Stop offset="100%" stopColor={color} stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill={`url(#glow-${color})`} />
    </Svg>
  </View>
);

const backgrounds = [
  require("../assets/images/Background images/ultra_monochrome_silver_gold_folds.png"),
  require("../assets/images/Background images/smooth_silver_gold_folds.png"),
  require("../assets/images/Background images/premium_login_background.png"),
  require("../assets/images/river.png"),
  require("../assets/images/mountain+river.png"),
];

export default function PremiumBackground({ bgIndex, gemColor }) {
  const { theme } = useTheme();
  const pathname = usePathname();

  // Resolve background image
  let selectedBg = backgrounds[0];

  if (typeof bgIndex === 'number' && bgIndex >= 0 && bgIndex < backgrounds.length) {
    selectedBg = backgrounds[bgIndex];
  } else {
    if (pathname === '/' || pathname === '/index') {
      selectedBg = backgrounds[2]; // Login Screen gets premium_login_background
    } else {
      // Dynamic mapping based on path hash to make pages have different backgrounds
      let hash = 0;
      const pathStr = pathname || '';
      for (let i = 0; i < pathStr.length; i++) {
        hash = pathStr.charCodeAt(i) + ((hash << 5) - hash);
      }
      // Pick strictly between index 0 and 1 (the metallic sheet folds backgrounds)
      const index = Math.abs(hash) % 2;
      selectedBg = backgrounds[index];
    }
  }
  
  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      <Image
        source={selectedBg}
        style={StyleSheet.absoluteFillObject}
        resizeMode="cover"
        blurRadius={Platform.OS === 'ios' ? 10 : 3} 
      />
      
      {/* Dynamic Ambient Glow Orbs */}
      <View style={StyleSheet.absoluteFillObject}>
        <GlowOrb color={gemColor || gems.sapphire} opacity={theme.isDark ? 0.3 : 0.12} size={400} style={{ top: -150, left: -100 }} />
        <GlowOrb color={gems.emerald} opacity={theme.isDark ? 0.25 : 0.08} size={350} style={{ bottom: -100, right: -100 }} />
        <GlowOrb color={gems.topaz} opacity={theme.isDark ? 0.2 : 0.06} size={300} style={{ top: '35%', right: -50 }} />
      </View>

      {/* Matte overlay: high opacity white in light mode to make it light/matte, dark overlay in dark mode */}
      <View style={[
        StyleSheet.absoluteFillObject, 
        { 
          backgroundColor: theme.isDark ? '#000' : '#FFF', 
          opacity: theme.isDark ? 0.3 : 0.35 // Made significantly lighter/softer for light mode (from 0.02 to 0.35)
        }
      ]} />
    </View>
  );
}

const styles = StyleSheet.create({
  orb: {
    position: 'absolute',
    transform: [{ scale: 1.2 }],
    filter: Platform.OS === 'ios' ? 'blur(60px)' : undefined,
  }
});
