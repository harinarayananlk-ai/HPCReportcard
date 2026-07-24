import React, { useEffect, useRef } from "react";
import { View, StyleSheet, TouchableOpacity, Platform } from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import Svg, { Path, Circle, Defs, LinearGradient, RadialGradient, Stop, G, Rect } from "react-native-svg";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  Easing,
} from "react-native-reanimated";
import { useTheme } from "../context/GlobalContext";
import { gems } from "../colour_themes";

// Helper to generate a 24-point fluted watch crown perimeter path (64x64 container)
const generateWatchCrownPath = (cx, cy, outerR, innerR, teeth = 24) => {
  let path = "";
  const angleStep = (2 * Math.PI) / teeth;
  for (let i = 0; i < teeth; i++) {
    const angle1 = i * angleStep;
    const angle2 = angle1 + angleStep * 0.4;
    const angle3 = angle1 + angleStep * 0.5;
    const angle4 = angle1 + angleStep * 0.9;

    const x1 = cx + outerR * Math.cos(angle1);
    const y1 = cy + outerR * Math.sin(angle1);
    const x2 = cx + outerR * Math.cos(angle2);
    const y2 = cy + outerR * Math.sin(angle2);

    const x3 = cx + innerR * Math.cos(angle3);
    const y3 = cy + innerR * Math.sin(angle3);
    const x4 = cx + innerR * Math.cos(angle4);
    const y4 = cy + innerR * Math.sin(angle4);

    if (i === 0) {
      path += `M ${x1} ${y1} `;
    } else {
      path += `L ${x1} ${y1} `;
    }
    path += `L ${x2} ${y2} L ${x3} ${y3} L ${x4} ${y4} `;
  }
  path += "Z";
  return path;
};

// Helper to generate a laser-engraved gear path
const generateGearPath = (cx, cy, outerR, innerR, teeth = 8) => {
  let d = "";
  const step = (2 * Math.PI) / teeth;
  for (let i = 0; i < teeth; i++) {
    const a1 = i * step;
    const a2 = a1 + step * 0.35;
    const a3 = a1 + step * 0.5;
    const a4 = a1 + step * 0.85;

    const x1 = cx + outerR * Math.cos(a1);
    const y1 = cy + outerR * Math.sin(a1);
    const x2 = cx + outerR * Math.cos(a2);
    const y2 = cy + outerR * Math.sin(a2);
    const x3 = cx + innerR * Math.cos(a3);
    const y3 = cy + innerR * Math.sin(a3);
    const x4 = cx + innerR * Math.cos(a4);
    const y4 = cy + innerR * Math.sin(a4);

    if (i === 0) d += `M ${x1} ${y1} `;
    else d += `L ${x1} ${y1} `;
    d += `L ${x2} ${y2} L ${x3} ${y3} L ${x4} ${y4} `;
  }
  d += "Z";
  return d;
};

const AnimatedG = Animated.createAnimatedComponent(G);

export default function GearGroup({ style }) {
  const { theme } = useTheme();
  const router = useRouter();

  // Animation Shared Values
  const scale = useSharedValue(1);
  const depthZ = useSharedValue(0);
  const highlightOpacity = useSharedValue(0.3);
  const shadowOpacity = useSharedValue(0.18);
  const shadowRadius = useSharedValue(6);

  // Gear Rotation Shared Values (Degrees)
  // Large Center Gear: CW (+24 deg)
  // Medium Top-Left Gear: CCW (-24 deg)
  // Small Bottom-Right Gear: CCW (-24 deg)
  const rotLarge = useSharedValue(0);
  const rotMedium = useSharedValue(0);
  const rotSmall = useSharedValue(0);

  const crownFluteD = useRef(generateWatchCrownPath(32, 32, 30, 26, 24)).current;
  const largeGearD = useRef(generateGearPath(32, 32, 15, 11, 10)).current;
  const mediumGearD = useRef(generateGearPath(20, 20, 9, 6.5, 7)).current;
  const smallGearD = useRef(generateGearPath(44, 43, 7.5, 5, 6)).current;

  // Trigger one 4-Phase Luxury Watch Animation Cycle (Duration: ~1.6s)
  const runMechanicalCycle = () => {
    const mechanicalEase = Easing.bezier(0.25, 0.1, 0.25, 1.0);

    // Phase 1: Anticipation (150ms) -> Scale 1.00 to 1.02
    scale.value = withTiming(1.02, { duration: 150, easing: Easing.out(Easing.quad) });

    // Phase 2 & 3: Depth move toward user (Scale 1.08, specular highlight, depth shadow) + Gear engagement (+24deg CW / -24deg CCW)
    scale.value = withDelay(
      150,
      withTiming(1.08, { duration: 600, easing: mechanicalEase })
    );
    highlightOpacity.value = withDelay(150, withTiming(0.75, { duration: 600 }));
    shadowOpacity.value = withDelay(150, withTiming(0.4, { duration: 600 }));
    shadowRadius.value = withDelay(150, withTiming(14, { duration: 600 }));

    rotLarge.value = withDelay(150, withTiming(24, { duration: 600, easing: mechanicalEase }));
    rotMedium.value = withDelay(150, withTiming(-24, { duration: 600, easing: mechanicalEase }));
    rotSmall.value = withDelay(150, withTiming(-24, { duration: 600, easing: mechanicalEase }));

    // Phase 4: Gentle return to resting state
    const returnDelay = 800; // 150 + 650
    scale.value = withDelay(
      returnDelay,
      withTiming(1.0, { duration: 750, easing: Easing.inOut(Easing.quad) })
    );
    highlightOpacity.value = withDelay(returnDelay, withTiming(0.3, { duration: 750 }));
    shadowOpacity.value = withDelay(returnDelay, withTiming(0.18, { duration: 750 }));
    shadowRadius.value = withDelay(returnDelay, withTiming(6, { duration: 750 }));

    rotLarge.value = withDelay(returnDelay, withTiming(0, { duration: 750, easing: Easing.inOut(Easing.quad) }));
    rotMedium.value = withDelay(returnDelay, withTiming(0, { duration: 750, easing: Easing.inOut(Easing.quad) }));
    rotSmall.value = withDelay(returnDelay, withTiming(0, { duration: 750, easing: Easing.inOut(Easing.quad) }));
  };

  // Idle Loop: Every 10 to 16 seconds (randomized)
  useEffect(() => {
    let timer;
    const scheduleNextCycle = () => {
      const randomInterval = 10000 + Math.random() * 6000; // 10s - 16s
      timer = setTimeout(() => {
        runMechanicalCycle();
        scheduleNextCycle();
      }, randomInterval);
    };

    scheduleNextCycle();
    return () => clearTimeout(timer);
  }, []);

  const handlePressIn = () => {
    if (Platform.OS !== 'web') {
      try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch(e) {}
    }
    scale.value = withTiming(0.92, { duration: 120 });
  };

  const handlePressOut = () => {
    scale.value = withTiming(1.0, { duration: 200 });
  };

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 600 },
      { scale: scale.value }
    ],
    shadowOpacity: shadowOpacity.value,
    shadowRadius: shadowRadius.value,
  }));

  const largeGearStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: 32 },
      { translateY: 32 },
      { rotate: `${rotLarge.value}deg` },
      { translateX: -32 },
      { translateY: -32 }
    ]
  }));

  const mediumGearStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: 20 },
      { translateY: 20 },
      { rotate: `${rotMedium.value}deg` },
      { translateX: -20 },
      { translateY: -20 }
    ]
  }));

  const smallGearStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: 44 },
      { translateY: 43 },
      { rotate: `${rotSmall.value}deg` },
      { translateX: -44 },
      { translateY: -43 }
    ]
  }));

  return (
    <Animated.View style={[styles.container, containerAnimatedStyle, style]}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={() => router.push("/Settings")}
      >
        <Svg width={64} height={64} viewBox="0 0 64 64">
          <Defs>
            {/* Metallic Crown Body Linear Gradient */}
            <LinearGradient id="crownMetal" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#E2E8F0" />
              <Stop offset="30%" stopColor="#CBD5E1" />
              <Stop offset="70%" stopColor="#94A3B8" />
              <Stop offset="100%" stopColor="#64748B" />
            </LinearGradient>

            {/* Recessed Engraved Face Radial Gradient */}
            <RadialGradient id="engravedFace" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="#1E293B" />
              <Stop offset="70%" stopColor="#0F172A" />
              <Stop offset="100%" stopColor="#020617" />
            </RadialGradient>

            {/* Sapphire Metal Gear Gradient */}
            <LinearGradient id="sapphireGear" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#60A5FA" />
              <Stop offset="50%" stopColor="#2563EB" />
              <Stop offset="100%" stopColor="#1D4ED8" />
            </LinearGradient>

            {/* Silver Metal Gear Gradient */}
            <LinearGradient id="silverGear" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#F8FAFC" />
              <Stop offset="60%" stopColor="#CBD5E1" />
              <Stop offset="100%" stopColor="#64748B" />
            </LinearGradient>
          </Defs>

          {/* 1. CNC Fluted Watch Crown Outer Perimeter */}
          <Path d={crownFluteD} fill="url(#crownMetal)" stroke="rgba(0,0,0,0.25)" strokeWidth={1} />

          {/* 2. Bezel Inner Ring */}
          <Circle cx={32} cy={32} r={24} fill="url(#engravedFace)" stroke="#475569" strokeWidth={1.2} />

          {/* 3. Engraved Recessed Inner Shadow Groove */}
          <Circle cx={32} cy={32} r={23.2} fill="none" stroke="rgba(0,0,0,0.6)" strokeWidth={0.8} />

          {/* 4. Engraved 3-Gear Mechanism */}
          
          {/* Top-Left Medium Gear (CCW) */}
          <AnimatedG style={mediumGearStyle}>
            <Path d={mediumGearD} fill="url(#silverGear)" stroke="#1E293B" strokeWidth={0.8} />
            <Circle cx={20} cy={20} r={2.5} fill="#0F172A" />
          </AnimatedG>

          {/* Bottom-Right Small Gear (CCW) */}
          <AnimatedG style={smallGearStyle}>
            <Path d={smallGearD} fill="url(#silverGear)" stroke="#1E293B" strokeWidth={0.8} />
            <Circle cx={44} cy={43} r={2} fill="#0F172A" />
          </AnimatedG>

          {/* Center Large Gear (CW) */}
          <AnimatedG style={largeGearStyle}>
            <Path d={largeGearD} fill="url(#sapphireGear)" stroke="#0F172A" strokeWidth={1} />
            <Circle cx={32} cy={32} r={4.5} fill="#F8FAFC" stroke="#1E293B" strokeWidth={0.8} />
            <Circle cx={32} cy={32} r={2} fill="#1E293B" />
          </AnimatedG>

          {/* 5. Specular Top Highlight Crescent */}
          <Path
            d="M 14 22 A 22 22 0 0 1 50 22"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth={1.5}
            strokeLinecap="round"
            opacity={0.5}
          />
        </Svg>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    zIndex: 999999,
    elevation: 999999,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
});
