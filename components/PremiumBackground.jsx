import React from 'react';
import { View, Image, StyleSheet, Platform } from 'react-native';
import { useTheme } from '../context/GlobalContext';

// A clean, strictly monochromatic background component.
// No blue, no purple, just silver and gold.
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
      
      {/* Matte overlay to reduce shine and improve readability */}
      <View style={[
        StyleSheet.absoluteFillObject, 
        { 
          backgroundColor: '#000', 
          opacity: theme.isDark ? 0.6 : 0.05 // Extreme light mode brightness
        }
      ]} />
    </View>
  );
}
