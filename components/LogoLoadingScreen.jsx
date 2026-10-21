import React, { useEffect, useRef } from "react";
import { StyleSheet, Dimensions, Platform } from "react-native";
import Animated, { 
  useSharedValue, 
  useAnimatedStyle,
  useAnimatedProps,
  withTiming, 
  withDelay,
  runOnJS,
  Easing,
} from "react-native-reanimated";
import Svg, { Path, Rect, G, Defs, LinearGradient, Stop, ClipPath } from "react-native-svg";
import { useTheme } from "../context/GlobalContext";

const { width, height } = Dimensions.get("window");

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedRect = Animated.createAnimatedComponent(Rect);

// Exact parallelogram path from design
const PARALLELOGRAM_PATH = 
  "M 110 50 L 340 50 Q 350 50 348 58 L 302 242 Q 300 250 290 250 L 60 250 Q 50 250 52 242 L 98 58 Q 100 50 110 50 Z";

// Total path perimeter for drawing animation
const PATH_PERIMETER = 900;

// Thicker stroke width (18px) for crisp visibility at both large scale and small corner size
const STROKE_WIDTH = 18;

// Parallelogram slant angle is arctan(-0.25) = -14.03624 degrees
const SKEW_ANGLE = -14.03624;

// Baseline Y position for the bars inside the parallelogram
const BASELINE_Y = 232;

// Final heights of the 3 ascending metric bars
const BAR1_MAX_H = 56;
const BAR2_MAX_H = 104;
const BAR3_MAX_H = 152;

export default function LogoLoadingScreen({ onComplete }) {
  const { theme } = useTheme();
  const completedRef = useRef(false);

  // Animation values
  const bgOpacity = useSharedValue(1);
  const strokeOffset = useSharedValue(PATH_PERIMETER);
  const fillOpacity = useSharedValue(0);
  
  // Staggered bars height values (grow upward parallel to slant)
  const bar1H = useSharedValue(0);
  const bar2H = useSharedValue(0);
  const bar3H = useSharedValue(0);

  // Logo Flight Transition values
  const logoScale = useSharedValue(3.8);
  const logoTranslateX = useSharedValue(0);
  const logoTranslateY = useSharedValue(0);

  const isDark = theme && (theme.isDark === true || (theme.name && theme.name.toLowerCase().includes("dark")));
  const bgColor = isDark ? "#0B0F19" : (theme?.background || "#FFFFFF");

  const handleFinish = () => {
    if (completedRef.current) return;
    completedRef.current = true;
    if (onComplete) {
      onComplete();
    }
  };

  const triggerFlight = () => {
    const targetTop = Platform.OS === "ios" ? 56 : 36;
    const targetRight = 20;

    const finalWidth = 44;
    const finalHeight = 33;
    const finalScale = 1.0;

    // Center coordinates to target top-right corner coordinates
    const targetX = (width / 2) - targetRight - (finalWidth / 2);
    const targetY = -(height / 2) + targetTop + (finalHeight / 2);

    const flightDuration = 700;
    const flightEasing = Easing.bezier(0.25, 1, 0.5, 1);

    logoScale.value = withTiming(finalScale, { duration: flightDuration, easing: flightEasing });
    logoTranslateX.value = withTiming(targetX, { duration: flightDuration, easing: flightEasing });
    logoTranslateY.value = withTiming(targetY, { duration: flightDuration, easing: flightEasing });

    bgOpacity.value = withDelay(250, withTiming(0, { duration: 450 }, (finished) => {
      if (finished) {
        runOnJS(handleFinish)();
      }
    }));
  };

  useEffect(() => {
    // 1. Act I: Tracing Outline (0ms to 1250ms)
    strokeOffset.value = withTiming(0, {
      duration: 1250,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });

    // 2. Act II: Subtle Matte Blue Fill Fade-In (900ms to 1500ms)
    fillOpacity.value = withDelay(
      900,
      withTiming(0.24, { duration: 600, easing: Easing.out(Easing.quad) })
    );

    // 3. Act III: Staggered Parallel Bars Rising from Baseline (1150ms to 1800ms)
    const barEasing = Easing.bezier(0.16, 1, 0.3, 1);
    const barDuration = 500;

    bar1H.value = withDelay(1150, withTiming(BAR1_MAX_H, { duration: barDuration, easing: barEasing }));
    bar2H.value = withDelay(1280, withTiming(BAR2_MAX_H, { duration: barDuration, easing: barEasing }));
    bar3H.value = withDelay(1410, withTiming(BAR3_MAX_H, { duration: barDuration, easing: barEasing }));

    // 4. Act IV: Flight to the Corner after a brief brand appreciation pause
    const flightTimer = setTimeout(() => {
      triggerFlight();
    }, 2250);

    // Safety fallback to guarantee transition never freezes
    const safetyTimer = setTimeout(() => {
      handleFinish();
    }, 3800);

    return () => {
      clearTimeout(flightTimer);
      clearTimeout(safetyTimer);
    };
  }, []);

  // Animated styles
  const containerStyle = useAnimatedStyle(() => ({
    backgroundColor: bgColor,
    opacity: bgOpacity.value,
  }));

  const logoContainerStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: logoTranslateX.value },
      { translateY: logoTranslateY.value },
      { scale: logoScale.value },
    ],
  }));

  // Animated SVG Props
  const animatedOutlineProps = useAnimatedProps(() => ({
    strokeDashoffset: strokeOffset.value,
  }));

  const animatedFillProps = useAnimatedProps(() => ({
    opacity: fillOpacity.value,
  }));

  const animatedBar1Props = useAnimatedProps(() => ({
    height: bar1H.value,
    y: BASELINE_Y - bar1H.value,
  }));

  const animatedBar2Props = useAnimatedProps(() => ({
    height: bar2H.value,
    y: BASELINE_Y - bar2H.value,
  }));

  const animatedBar3Props = useAnimatedProps(() => ({
    height: bar3H.value,
    y: BASELINE_Y - bar3H.value,
  }));

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      <Animated.View style={[styles.logoWrapper, logoContainerStyle]}>
        <Svg 
          width={44} 
          height={33} 
          viewBox="0 0 400 300"
          style={styles.svgGlow}
        >
          <Defs>
            {/* Subtle, Matte Blue for Parallelogram Fill */}
            <LinearGradient id="matteBlue" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#60A5FA" />
              <Stop offset="50%" stopColor="#3B82F6" />
              <Stop offset="100%" stopColor="#1E3A8A" />
            </LinearGradient>

            {/* Bright, Vibrant Premium Gradient for Outline Stroke */}
            <LinearGradient id="strokeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#93C5FD" />
              <Stop offset="50%" stopColor="#3B82F6" />
              <Stop offset="100%" stopColor="#1D4ED8" />
            </LinearGradient>

            {/* High-Contrast Lighter Blue Gradient for Bars */}
            <LinearGradient id="barBlue" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor="#93C5FD" />
              <Stop offset="100%" stopColor="#2563EB" />
            </LinearGradient>

            {/* Clip path of the exact same parallelogram */}
            <ClipPath id="paraClip">
              <Path d={PARALLELOGRAM_PATH} />
            </ClipPath>
          </Defs>

          {/* ACT II: The Matte Background Fill */}
          <AnimatedPath
            d={PARALLELOGRAM_PATH}
            fill="url(#matteBlue)"
            animatedProps={animatedFillProps}
          />

          {/* ACT III: The Staggered Bars (Parallel to Parallelogram Slanted Sides) */}
          <G clipPath="url(#paraClip)">
            <G transform={`skewX(${SKEW_ANGLE})`}>
              {/* Bar 1 */}
              <AnimatedRect
                x={166}
                width={34}
                rx={6}
                ry={6}
                fill="url(#barBlue)"
                animatedProps={animatedBar1Props}
              />
              {/* Bar 2 */}
              <AnimatedRect
                x={222}
                width={34}
                rx={6}
                ry={6}
                fill="url(#barBlue)"
                animatedProps={animatedBar2Props}
              />
              {/* Bar 3 */}
              <AnimatedRect
                x={278}
                width={34}
                rx={6}
                ry={6}
                fill="url(#barBlue)"
                animatedProps={animatedBar3Props}
              />
            </G>
          </G>

          {/* ACT I: The Tracing Outline (Thickened 18px stroke) */}
          <AnimatedPath
            d={PARALLELOGRAM_PATH}
            fill="none"
            stroke="url(#strokeGradient)"
            strokeWidth={STROKE_WIDTH}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={PATH_PERIMETER}
            animatedProps={animatedOutlineProps}
          />
        </Svg>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    justifyContent: "center",
    alignItems: "center",
  },
  logoWrapper: {
    width: 44,
    height: 33,
    justifyContent: "center",
    alignItems: "center",
  },
  svgGlow: {
    ...Platform.select({
      web: {
        filter: "drop-shadow(0 10px 25px rgba(37, 99, 235, 0.22))",
      },
    }),
  },
});
