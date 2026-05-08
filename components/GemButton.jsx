import React from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import Svg, { Polygon, Defs, LinearGradient, Stop, Path, Rect } from 'react-native-svg';
import SoundButton from './SoundButton';
import { useTheme } from '../context/GlobalContext';
import { gems } from '../colour_themes';

export default function GemButton({ children, onPress, style, disabled, gemType }) {
  const { theme } = useTheme();

  // Determine base gem color
  const baseColor = gemType && gems[gemType] ? gems[gemType] : theme.accent;
  
  // Refraction shades and "Cut" parameters
  let centerColor, topColor1, topColor2, leftColor1, leftColor2, bottomColor1, bottomColor2, rightColor1, rightColor2;
  let topDepth = 20, sideDepth = 5; // Default "Sapphire" cut

  if (gemType === 'emerald' || baseColor === gems.emerald) {
    centerColor = '#10A858'; topColor1 = '#FFFFFF'; topColor2 = '#A0F0C0';
    leftColor1 = '#D0F8E0'; leftColor2 = '#40D880'; bottomColor1 = '#086830';
    bottomColor2 = '#043018'; rightColor1 = '#0C8848'; rightColor2 = '#064820';
    topDepth = 20; sideDepth = 10; 
  } else if (gemType === 'jade' || baseColor === gems.jade) {
    centerColor = '#008B58'; topColor1 = '#FFFFFF'; topColor2 = '#80D8B0';
    leftColor1 = '#C0F0D8'; leftColor2 = '#20C080'; bottomColor1 = '#005838';
    bottomColor2 = '#002818'; rightColor1 = '#007848'; rightColor2 = '#004028';
    topDepth = 20; sideDepth = 8;
  } else if (gemType === 'topaz' || baseColor === gems.topaz) {
    centerColor = '#E65C00'; topColor1 = '#FFFFFF'; topColor2 = '#FFC080';
    leftColor1 = '#FFE0C0'; leftColor2 = '#FF8C40'; bottomColor1 = '#8C3800';
    bottomColor2 = '#401800'; rightColor1 = '#B34700'; rightColor2 = '#662200';
    topDepth = 20; sideDepth = 12; 
  } else if (gemType === 'citrine' || baseColor === gems.citrine) {
    centerColor = '#C8D800'; topColor1 = '#FFFFFF'; topColor2 = '#F8FF99';
    leftColor1 = '#FCFFCC'; leftColor2 = '#E6F233'; bottomColor1 = '#7A8C00';
    bottomColor2 = '#3D4D00'; rightColor1 = '#A3B800'; rightColor2 = '#5C7300';
    topDepth = 20; sideDepth = 10;
  } else {
    // Sapphire fallback
    centerColor = '#1460D9'; topColor1 = '#FFFFFF'; topColor2 = '#8ABBF5';
    leftColor1 = '#D0E3F8'; leftColor2 = '#3F8DF5'; bottomColor1 = '#0B3A82';
    bottomColor2 = '#041530'; rightColor1 = '#0D4499'; rightColor2 = '#061C40';
    topDepth = 20; sideDepth = 5;
  }

  // Balanced proportions: ensure depth doesn't exceed 35% of height and 15% of width
  const finalTopDepth = Math.min(topDepth, 35);
  const finalSideDepth = Math.min(sideDepth, 15);

  // Calculate polygon points based on depth
  const p1 = `${finalSideDepth},${finalTopDepth}`;
  const p2 = `${100 - finalSideDepth},${finalTopDepth}`;
  const p3 = `${100 - finalSideDepth},${100 - finalTopDepth}`;
  const p4 = `${finalSideDepth},${100 - finalTopDepth}`;

  return (
    <View style={[styles.container, style]}>
      <SoundButton 
        onPress={onPress} 
        activeOpacity={0.8} 
        style={styles.buttonContainer}
        disabled={disabled}
      >
        <View style={StyleSheet.absoluteFill}>
          <Svg height="100%" width="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
            <Defs>
              <LinearGradient id="topGradient" x1="0%" y1="0%" x2="0%" y2="100%"><Stop offset="0%" stopColor={topColor1} /><Stop offset="100%" stopColor={topColor2} /></LinearGradient>
              <LinearGradient id="leftGradient" x1="0%" y1="0%" x2="100%" y2="0%"><Stop offset="0%" stopColor={leftColor1} /><Stop offset="100%" stopColor={leftColor2} /></LinearGradient>
              <LinearGradient id="bottomGradient" x1="0%" y1="100%" x2="0%" y2="0%"><Stop offset="0%" stopColor={bottomColor1} /><Stop offset="100%" stopColor={bottomColor2} /></LinearGradient>
              <LinearGradient id="rightGradient" x1="100%" y1="0%" x2="0%" y2="0%"><Stop offset="0%" stopColor={rightColor1} /><Stop offset="100%" stopColor={rightColor2} /></LinearGradient>
              <LinearGradient id="centerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor={centerColor} /><Stop offset="100%" stopColor={bottomColor1} />
              </LinearGradient>
            </Defs>

            {/* Facets - Dynamically Shaped */}
            <Polygon points={`0,0 100,0 ${p2} ${p1}`} fill="url(#topGradient)" opacity={0.6} />
            <Polygon points={`0,100 100,100 ${p3} ${p4}`} fill="url(#bottomGradient)" opacity={0.6} />
            <Polygon points={`0,0 ${p1} ${p4} 0,100`} fill="url(#leftGradient)" opacity={0.6} />
            <Polygon points={`100,0 ${p2} ${p3} 100,100`} fill="url(#rightGradient)" opacity={0.6} />
            <Polygon points={`${p1} ${p2} ${p3} ${p4}`} fill="url(#centerGradient)" />
            
            {/* The new single sharp diagonal highlight - Centre Left Shard */}
            <Path d="M 5 0 L 12 0 L 32 100 L 25 100 Z" fill="rgba(255, 255, 255, 0.25)" />
            
            {/* Thin minimalist border */}
            <Rect x="0.5" y="0.5" width="99" height="99" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.5" />
          </Svg>
        </View>

        <View style={styles.content}>
          {children}
        </View>
      </SoundButton>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
    borderRadius: 8,
    overflow: 'hidden',
  },
  buttonContainer: {
    borderRadius: 8,
    minHeight: 52,
    backgroundColor: 'transparent',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    zIndex: 10,
  }
});
