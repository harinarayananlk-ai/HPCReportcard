import React, { useEffect, useRef } from "react";
import { View, StyleSheet, TouchableOpacity, Platform } from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import Svg, { Path, Circle, Defs, LinearGradient, RadialGradient, Stop } from "react-native-svg";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
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

// Helper to generate an engraved gear path
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

export default function GearGroup({ style }) {
  const { theme } = useTheme();
  const router = useRouter();

  // Animation Shared Values
  const scale = useSharedValue(1);
  const shadowOpacity = useSharedValue(0.15);
  const shadowRadius = useSharedValue(6);

  // Gear Rotation Shared Values (Degrees)
  // Large Center Gear: CW (+24 deg)
  // Medium Top-Left Gear: CCW (-24 deg)
  // Small Bottom-Right Gear: CCW (-24 deg)
  const rotLarge = useSharedValue(0);
  const rotMedium = useSharedValue(0);
  const rotSmall = useSharedValue(0);

  const crownFluteD = useRef(generateWatchCrownPath(32, 32, 30, 26.5, 24)).current;
  const largeGearD = useRef(generateGearPath(32, 32, 11.5, 8.5, 9)).current;
  const mediumGearD = useRef(generateGearPath(16, 16, 7.5, 5.2, 7)).current;
  const smallGearD = useRef(generateGearPath(47, 47, 6, 4.2, 6)).current;

  // Trigger one 4-Phase Mechanical Animation Cycle (~1.6 seconds)
  const runMechanicalCycle = () => {
    const mechanicalEase = Easing.bezier(0.25, 0.1, 0.25, 1.0);

    // Phase 1: Anticipation (150ms) -> Scale 1.00 to 1.02
    scale.value = withTiming(1.02, { duration: 150, easing: Easing.out(Easing.quad) });

    // Phase 2 & 3: Depth move toward user (Scale 1.08) + Gear engagement (+24deg CW / -24deg CCW)
    scale.value = withDelay(
      150,
      withTiming(1.08, { duration: 600, easing: mechanicalEase })
    );
    shadowOpacity.value = withDelay(150, withTiming(0.3, { duration: 600 }));
    shadowRadius.value = withDelay(150, withTiming(12, { duration: 600 }));

    rotLarge.value = withDelay(150, withTiming(24, { duration: 600, easing: mechanicalEase }));
    rotMedium.value = withDelay(150, withTiming(-24, { duration: 600, easing: mechanicalEase }));
    rotSmall.value = withDelay(150, withTiming(-24, { duration: 600, easing: mechanicalEase }));

    // Phase 4: Gentle return to resting state
    const returnDelay = 800; // 150 + 650
    scale.value = withDelay(
      returnDelay,
      withTiming(1.0, { duration: 750, easing: Easing.inOut(Easing.quad) })
    );
    shadowOpacity.value = withDelay(returnDelay, withTiming(0.15, { duration: 750 }));
    shadowRadius.value = withDelay(returnDelay, withTiming(6, { duration: 750 }));

    rotLarge.value = withDelay(returnDelay, withTiming(0, { duration: 750, easing: Easing.inOut(Easing.quad) }));
    rotMedium.value = withDelay(returnDelay, withTiming(0, { duration: 750, easing: Easing.inOut(Easing.quad) }));
    rotSmall.value = withDelay(returnDelay, withTiming(0, { duration: 750, easing: Easing.inOut(Easing.quad) }));
  };

  // Idle Loop: Runs initial cycle 1.5s after mount, then every 10 to 16 seconds
  useEffect(() => {
    let timer;
    const initialTimer = setTimeout(() => {
      runMechanicalCycle();
      scheduleNextCycle();
    }, 1500);

    const scheduleNextCycle = () => {
      const randomInterval = 10000 + Math.random() * 6000; // 10s - 16s
      timer = setTimeout(() => {
        runMechanicalCycle();
        scheduleNextCycle();
      }, randomInterval);
    };

    return () => {
      clearTimeout(initialTimer);
      clearTimeout(timer);
    };
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
    transform: [{ rotate: `${rotLarge.value}deg` }]
  }));

  const mediumGearStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotMedium.value}deg` }]
  }));

  const smallGearStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotSmall.value}deg` }]
  }));

  return (
    <Animated.View style={[styles.container, containerAnimatedStyle, style]}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={() => router.push("/Settings")}
        style={styles.touchArea}
      >
        {/* Base Watch Crown SVG */}
        <Svg width={64} height={64} viewBox="0 0 64 64" style={StyleSheet.absoluteFill}>
          <Defs>
            {/* Matte Crown Flute Gradient */}
            <LinearGradient id="crownMatte" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#E2E8F0" />
              <Stop offset="50%" stopColor="#CBD5E1" />
              <Stop offset="100%" stopColor="#94A3B8" />
            </LinearGradient>

            {/* Inset Face Radial Gradient - Soft Matte Light Metallic */}
            <RadialGradient id="matteFace" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="#F8FAFC" />
              <Stop offset="65%" stopColor="#E2E8F0" />
              <Stop offset="100%" stopColor="#CBD5E1" />
            </RadialGradient>

            {/* Sapphire Gear Gradient */}
            <LinearGradient id="sapphireMatteGear" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#3B82F6" />
              <Stop offset="100%" stopColor="#1E40AF" />
            </LinearGradient>

            {/* Silver Gear Gradient */}
            <LinearGradient id="silverMatteGear" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#FFFFFF" />
              <Stop offset="100%" stopColor="#94A3B8" />
            </LinearGradient>
          </Defs>

          {/* 1. CNC Fluted Watch Crown Outer Perimeter */}
          <Path d={crownFluteD} fill="url(#crownMatte)" stroke="#94A3B8" strokeWidth={0.8} />

          {/* 2. Bezel Inner Ring - Matte Silver */}
          <Circle cx={32} cy={32} r={24.5} fill="url(#matteFace)" stroke="#94A3B8" strokeWidth={1} />

          {/* 3. Engraved Recessed Inner Groove Line */}
          <Circle cx={32} cy={32} r={23.8} fill="none" stroke="rgba(71,85,105,0.25)" strokeWidth={0.7} />
        </Svg>

        {/* 4. Engraved 3-Gear Layer (Positioned Side-by-Side with 0 Overlap) */}

        {/* Medium Gear Top-Left (CCW) */}
        <Animated.View style={[styles.gearLayer, { top: 8, left: 8, width: 16, height: 16 }, mediumGearStyle]}>
          <Svg width={16} height={16} viewBox="8 8 16 16">
            <Path d={mediumGearD} fill="url(#silverMatteGear)" stroke="#475569" strokeWidth={0.7} />
            <Circle cx={16} cy={16} r={2} fill="#475569" />
          </Svg>
        </Animated.View>

        {/* Small Gear Bottom-Right (CCW) */}
        <Animated.View style={[styles.gearLayer, { top: 40.5, left: 40.5, width: 13, height: 13 }, smallGearStyle]}>
          <Svg width={13} height={13} viewBox="40.5 40.5 13 13">
            <Path d={smallGearD} fill="url(#silverMatteGear)" stroke="#475569" strokeWidth={0.7} />
            <Circle cx={47} cy={47} r={1.5} fill="#475569" />
          </Svg>
        </Animated.View>

        {/* Center Large Gear (CW) */}
        <Animated.View style={[styles.gearLayer, { top: 20.5, left: 20.5, width: 23, height: 23 }, largeGearStyle]}>
          <Svg width={23} height={23} viewBox="20.5 20.5 23 23">
            <Path d={largeGearD} fill="url(#sapphireMatteGear)" stroke="#1E3A8A" strokeWidth={0.8} />
            <Circle cx={32} cy={32} r={3.5} fill="#F8FAFC" stroke="#1E3A8A" strokeWidth={0.6} />
            <Circle cx={32} cy={32} r={1.5} fill="#1E3A8A" />
          </Svg>
        </Animated.View>

        {/* Matte Crescent Highlight */}
        <Svg width={64} height={64} viewBox="0 0 64 64" style={StyleSheet.absoluteFill} pointerEvents="none">
          <Path
            d="M 14 20 A 22 22 0 0 1 50 20"
            fill="none"
            stroke="rgba(255,255,255,0.4)"
            strokeWidth={1.2}
            strokeLinecap="round"
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
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  touchArea: {
    width: 64,
    height: 64,
    borderRadius: 32,
    position: 'relative',
  },
  gearLayer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
