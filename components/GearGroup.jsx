import React, { useEffect, useRef } from "react";
import { View, StyleSheet, TouchableOpacity, Animated, Easing, Platform } from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import Svg, { Path, Circle, Defs, LinearGradient, RadialGradient, Stop } from "react-native-svg";

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
  const router = useRouter();

  // Animated Values
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const depthAnim = useRef(new Animated.Value(0)).current;
  const gearAnim = useRef(new Animated.Value(0)).current;

  // Track dynamic rotation degrees for the current cycle
  const currentRotationTarget = useRef(180);

  // Exact pitch circle geometry
  const crownFluteD = useRef(generateWatchCrownPath(32, 32, 30, 26.5, 24)).current;
  const largeGearD = useRef(generateGearPath(32, 32, 11.5, 8.5, 10)).current;
  const mediumGearD = useRef(generateGearPath(20.1, 20.1, 7.8, 5.2, 7)).current;
  const smallGearD = useRef(generateGearPath(43.3, 43.3, 6.8, 4.4, 6)).current;

  // 4-Phase Luxury Watch Animation Sequence (150-250 deg randomized rotation)
  const runMechanicalCycle = () => {
    // Pick random rotation angle between 150° and 250°
    const randomDeg = 150 + Math.floor(Math.random() * 100);
    currentRotationTarget.current = randomDeg;

    // Calculate rotation duration maintaining same angular velocity (24 deg / 600ms = 40 deg/sec)
    const rotationDuration = Math.round((randomDeg / 24) * 350); // smooth luxury mechanical pace
    const easeOut = Easing.bezier(0.25, 0.1, 0.25, 1.0);

    gearAnim.setValue(0);

    Animated.sequence([
      // Phase 1: Anticipation (150ms) -> Scale 1.00 to 1.02
      Animated.timing(scaleAnim, {
        toValue: 1.02,
        duration: 150,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }),

      // Phase 2 & 3: Move toward user (Scale 1.08, depth shadow) + Gear engagement (150-250deg CW / CCW)
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1.08,
          duration: rotationDuration,
          easing: easeOut,
          useNativeDriver: false,
        }),
        Animated.timing(depthAnim, {
          toValue: 1,
          duration: rotationDuration,
          easing: easeOut,
          useNativeDriver: false,
        }),
        Animated.timing(gearAnim, {
          toValue: randomDeg,
          duration: rotationDuration,
          easing: easeOut,
          useNativeDriver: false,
        }),
      ]),

      // Phase 4: Gentle return to resting state (Scale 1.00, shadow return, gear rotation eases back to 0° resting offset)
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1.0,
          duration: Math.round(rotationDuration * 0.8),
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: false,
        }),
        Animated.timing(depthAnim, {
          toValue: 0,
          duration: Math.round(rotationDuration * 0.8),
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: false,
        }),
        Animated.timing(gearAnim, {
          toValue: 0,
          duration: Math.round(rotationDuration * 0.8),
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: false,
        }),
      ]),
    ]).start();
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
    Animated.timing(scaleAnim, {
      toValue: 0.92,
      duration: 120,
      useNativeDriver: false,
    }).start();
  };

  const handlePressOut = () => {
    Animated.timing(scaleAnim, {
      toValue: 1.0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  // Interpolations (Large Center Gear starts with 18° resting offset to mesh perfectly with Medium and Small gears!)
  const rotLargeStr = gearAnim.interpolate({
    inputRange: [0, 360],
    outputRange: ["18deg", "378deg"], // Resting offset 18° + Clockwise rotation
  });

  const rotMediumStr = gearAnim.interpolate({
    inputRange: [0, 360],
    outputRange: ["0deg", "-360deg"], // Counter-Clockwise rotation
  });

  const rotSmallStr = gearAnim.interpolate({
    inputRange: [0, 360],
    outputRange: ["0deg", "-360deg"], // Counter-Clockwise rotation
  });

  const shadowRadiusVal = depthAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [6, 14],
  });

  const shadowOpacityVal = depthAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.15, 0.35],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        style,
        {
          transform: [{ scale: scaleAnim }],
          shadowRadius: shadowRadiusVal,
          shadowOpacity: shadowOpacityVal,
        },
      ]}
    >
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

        {/* 4. Engraved 3-Gear Layer (18° Resting Alignment Offset + 150-250° Randomized Rotation) */}

        {/* Medium Gear Top-Left (CCW) */}
        <Animated.View style={[styles.gearLayer, { top: 12.3, left: 12.3, width: 15.6, height: 15.6, transform: [{ rotate: rotMediumStr }] }]}>
          <Svg width={15.6} height={15.6} viewBox="12.3 12.3 15.6 15.6">
            <Path d={mediumGearD} fill="url(#silverMatteGear)" stroke="#475569" strokeWidth={0.7} />
            <Circle cx={20.1} cy={20.1} r={2} fill="#475569" />
          </Svg>
        </Animated.View>

        {/* Small Gear Bottom-Right (CCW) */}
        <Animated.View style={[styles.gearLayer, { top: 36.5, left: 36.5, width: 13.6, height: 13.6, transform: [{ rotate: rotSmallStr }] }]}>
          <Svg width={13.6} height={13.6} viewBox="36.5 36.5 13.6 13.6">
            <Path d={smallGearD} fill="url(#silverMatteGear)" stroke="#475569" strokeWidth={0.7} />
            <Circle cx={43.3} cy={43.3} r={1.5} fill="#475569" />
          </Svg>
        </Animated.View>

        {/* Center Large Gear (CW with 18° Resting Alignment Offset) */}
        <Animated.View style={[styles.gearLayer, { top: 20.5, left: 20.5, width: 23, height: 23, transform: [{ rotate: rotLargeStr }] }]}>
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
