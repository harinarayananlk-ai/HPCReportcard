import React from "react";
import { StyleSheet, Platform, Pressable } from "react-native";
import Svg, { Path, Rect, G, Defs, LinearGradient, Stop, ClipPath } from "react-native-svg";
import { useRouter } from "expo-router";

// Exact parallelogram path matching LogoLoadingScreen
const PARALLELOGRAM_PATH = 
  "M 110 50 L 340 50 Q 350 50 348 58 L 302 242 Q 300 250 290 250 L 60 250 Q 50 250 52 242 L 98 58 Q 100 50 110 50 Z";

// Thicker stroke (18px) for crisp visibility at small corner size
const STROKE_WIDTH = 18;

// Parallelogram slant angle arctan(-0.25)
const SKEW_ANGLE = -14.03624;

// Baseline Y position and final heights of the 3 ascending metric bars
const BASELINE_Y = 232;
const BAR1_MAX_H = 56;
const BAR2_MAX_H = 104;
const BAR3_MAX_H = 152;

export default function CornerLogo() {
  const router = useRouter();

  return (
    <Pressable 
      style={styles.container} 
      onPress={() => router.push("/credits")}
      accessibilityLabel="App Logo"
      accessibilityRole="button"
    >
      <Svg 
        width={44} 
        height={33} 
        viewBox="0 0 400 300"
        style={styles.svg}
      >
        <Defs>
          {/* Subtle Matte Blue Gradient for Parallelogram Fill */}
          <LinearGradient id="cornerMatteBlue" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#60A5FA" />
            <Stop offset="50%" stopColor="#3B82F6" />
            <Stop offset="100%" stopColor="#1E3A8A" />
          </LinearGradient>

          {/* Bright, Vibrant Premium Gradient for Outline Stroke */}
          <LinearGradient id="cornerStrokeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#93C5FD" />
            <Stop offset="50%" stopColor="#3B82F6" />
            <Stop offset="100%" stopColor="#1D4ED8" />
          </LinearGradient>

          {/* High-Contrast Lighter Blue Gradient for Bars */}
          <LinearGradient id="cornerBarBlue" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#93C5FD" />
            <Stop offset="100%" stopColor="#2563EB" />
          </LinearGradient>

          {/* Clip path matching the parallelogram */}
          <ClipPath id="cornerParaClip">
            <Path d={PARALLELOGRAM_PATH} />
          </ClipPath>
        </Defs>

        {/* 1. Matte Background Fill */}
        <Path
          d={PARALLELOGRAM_PATH}
          fill="url(#cornerMatteBlue)"
          opacity={0.24}
        />

        {/* 2. Symmetrical Parallel Bars (Exact matching angle to parallelogram) */}
        <G clipPath="url(#cornerParaClip)">
          <G transform={`skewX(${SKEW_ANGLE})`}>
            {/* Bar 1 */}
            <Rect
              x={166}
              y={BASELINE_Y - BAR1_MAX_H}
              width={34}
              height={BAR1_MAX_H}
              rx={6}
              ry={6}
              fill="url(#cornerBarBlue)"
            />
            {/* Bar 2 */}
            <Rect
              x={222}
              y={BASELINE_Y - BAR2_MAX_H}
              width={34}
              height={BAR2_MAX_H}
              rx={6}
              ry={6}
              fill="url(#cornerBarBlue)"
            />
            {/* Bar 3 */}
            <Rect
              x={278}
              y={BASELINE_Y - BAR3_MAX_H}
              width={34}
              height={BAR3_MAX_H}
              rx={6}
              ry={6}
              fill="url(#cornerBarBlue)"
            />
          </G>
        </G>

        {/* 3. The Thickened Frame Outline */}
        <Path
          d={PARALLELOGRAM_PATH}
          fill="none"
          stroke="url(#cornerStrokeGradient)"
          strokeWidth={STROKE_WIDTH}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: Platform.OS === 'ios' ? 56 : 36,
    right: 20,
    zIndex: 1000,
  },
  svg: {
    ...Platform.select({
      web: {
        filter: "drop-shadow(0 4px 12px rgba(37, 99, 235, 0.25))",
      },
    }),
  },
});
