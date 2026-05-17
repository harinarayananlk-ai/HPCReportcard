import React from 'react';
import { View, Image, StyleSheet, Platform } from 'react-native';
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

export default function PremiumBackground() {
  const { theme } = useTheme();
  
  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      <Image
        source={require("../assets/images/ultra_monochrome_silver_gold_folds.png")}
        style={StyleSheet.absoluteFillObject}
        resizeMode="cover"
        blurRadius={Platform.OS === 'ios' ? 10 : 3} 
      />
      
      {/* Dynamic Ambient Glow Orbs */}
      <View style={StyleSheet.absoluteFillObject}>
        <GlowOrb color={gems.sapphire} opacity={theme.isDark ? 0.3 : 0.15} size={400} style={{ top: -150, left: -100 }} />
        <GlowOrb color={gems.emerald} opacity={theme.isDark ? 0.25 : 0.1} size={350} style={{ bottom: -100, right: -100 }} />
        <GlowOrb color={gems.topaz} opacity={theme.isDark ? 0.2 : 0.08} size={300} style={{ top: '35%', right: -50 }} />
      </View>

      {/* Matte overlay to reduce shine and improve readability */}
      <View style={[
        StyleSheet.absoluteFillObject, 
        { 
          backgroundColor: theme.isDark ? '#000' : '#FFF', 
          opacity: theme.isDark ? 0.3 : 0.02 
        }
      ]} />
    </View>
  );
}

const styles = StyleSheet.create({
  orb: {
    position: 'absolute',
    transform: [{ scale: 1.2 }],
    filter: Platform.OS === 'ios' ? 'blur(60px)' : undefined, // blur prop doesn't work on View usually
  }
});
