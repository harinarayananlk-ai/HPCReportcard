import React, { useEffect } from "react";
import { StyleSheet, View, Dimensions, Platform } from "react-native";
import Animated, { 
  useSharedValue, 
  withTiming, 
  withDelay,
  runOnJS,
  useAnimatedStyle,
  Easing,
} from "react-native-reanimated";
import Svg, { Rect, G, Defs, ClipPath } from "react-native-svg";
import { useTheme } from "../context/GlobalContext";

const { width, height } = Dimensions.get("window");

const AnimatedRect = Animated.createAnimatedComponent(Rect);
const AnimatedG = Animated.createAnimatedComponent(G);

// Perfect logo dimensions in a 240x150 viewBox
const VIEWBOX_WIDTH = 240;
const VIEWBOX_HEIGHT = 150;
const STROKE_WIDTH = 13;
const CORNER_RADIUS = 15;
const FRAME_WIDTH = 160;
const FRAME_HEIGHT = 120;
const FRAME_X = 20;
const FRAME_Y = 15;

// Inside background coordinates (centered, leaving a perfect thin separation gap from the outer frame)
const INSIDE_GAP = 15;
const INSIDE_X = FRAME_X + INSIDE_GAP;
const INSIDE_Y = FRAME_Y + INSIDE_GAP;
const INSIDE_WIDTH = FRAME_WIDTH - (2 * INSIDE_GAP);
const INSIDE_HEIGHT = FRAME_HEIGHT - (2 * INSIDE_GAP);
const INSIDE_RADIUS = 8;

const PATH_PERIMETER = 535; 

export default function LogoLoadingScreen({ onComplete }) {
  const { theme } = useTheme();

  // Animation values
  const bgOpacity = useSharedValue(1);
  const strokeOffset = useSharedValue(PATH_PERIMETER);
  const insideOpacity = useSharedValue(0); // Fills inside with color after frame completes
  
  // Staggered bars translation values
  const bar1Translation = useSharedValue(120);
  const bar2Translation = useSharedValue(120);
  const bar3Translation = useSharedValue(120);
  const bar4Translation = useSharedValue(120);

  // Logo Flight Transition values
  const logoScale = useSharedValue(3.2);
  const logoTranslateX = useSharedValue(0);
  const logoTranslateY = useSharedValue(0);

  const isDark = theme && (theme.isDark === true || (theme.name && theme.name.toLowerCase().includes("dark")));
  const logoColor = "#2E5894"; // Permanently Sapphire Blue
  const bgColor = isDark ? "#0A0A0A" : "#FFFFFF";
  
  // Dynamic bar colors based on theme
  const outsideBarColor = isDark ? "#FFFFFF" : "#000000"; // Visible against background
  const insideBarColor = bgColor; // White in light theme, Black in dark theme

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

  const insideStyle = useAnimatedStyle(() => ({
    opacity: insideOpacity.value,
  }));

  const bar1Style = useAnimatedStyle(() => ({
    transform: [{ translateY: bar1Translation.value }],
  }));

  const bar2Style = useAnimatedStyle(() => ({
    transform: [{ translateY: bar2Translation.value }],
  }));

  const bar3Style = useAnimatedStyle(() => ({
    transform: [{ translateY: bar3Translation.value }],
  }));

  const bar4Style = useAnimatedStyle(() => ({
    transform: [{ translateY: bar4Translation.value }],
  }));

  useEffect(() => {
    // 1. Draw the frame outline
    strokeOffset.value = withTiming(0, { duration: 1100 }, (finished) => {
      if (finished) {
        // 2. Smoothly color in the inside background
        insideOpacity.value = withTiming(1, { duration: 300 }, (insideDone) => {
          if (insideDone) {
            // 3. Staggered bars entry (Using smooth ease-out timing to prevent any jiggling/overshoot)
            const transitionConfig = {
              duration: 380,
              easing: Easing.out(Easing.quad),
            };

            bar1Translation.value = withTiming(0, transitionConfig);
            bar2Translation.value = withDelay(100, withTiming(0, transitionConfig));
            bar3Translation.value = withDelay(200, withTiming(0, transitionConfig));
            bar4Translation.value = withDelay(300, withTiming(0, transitionConfig, (barsDone) => {
              if (barsDone) {
                runOnJS(triggerFlight)();
              }
            }));
          }
        });
      }
    });
  }, []);

  const triggerFlight = () => {
    const targetTop = Platform.OS === "ios" ? 56 : 36;
    const targetRight = 20;

    const finalWidth = 40;
    const finalScale = 1.0;

    const targetX = (width / 2) - targetRight - (finalWidth / 2) - 10;
    const targetY = -(height / 2) + targetTop + 20;

    logoScale.value = withTiming(finalScale, { duration: 800 });
    logoTranslateX.value = withTiming(targetX, { duration: 800 });
    logoTranslateY.value = withTiming(targetY, { duration: 800 });

    bgOpacity.value = withDelay(400, withTiming(0, { duration: 400 }, (finished) => {
      if (finished) {
        runOnJS(onComplete)();
      }
    }));
  };

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      <Animated.View style={[styles.logoWrapper, logoContainerStyle]}>
        <Svg width={40} height={30} viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}>
          <Defs>
            {/* The ClipPath for the inside background area */}
            <ClipPath id="insideClip">
              <Rect
                x={INSIDE_X}
                y={INSIDE_Y}
                width={INSIDE_WIDTH}
                height={INSIDE_HEIGHT}
                rx={INSIDE_RADIUS}
                ry={INSIDE_RADIUS}
              />
            </ClipPath>
          </Defs>

          {/* Shift X by 65 and skewX by -29 for a perfectly contained slanted parallelogram */}
          <G transform="translate(65, 0) skewX(-29)">
            {/* 1. Perfect Rounded Parallelogram Frame Outline */}
            <AnimatedRect
              x={FRAME_X}
              y={FRAME_Y}
              width={FRAME_WIDTH}
              height={FRAME_HEIGHT}
              rx={CORNER_RADIUS}
              ry={CORNER_RADIUS}
              fill="none"
              stroke={logoColor}
              strokeWidth={STROKE_WIDTH}
              strokeDasharray={PATH_PERIMETER}
              strokeDashoffset={strokeOffset}
            />

            {/* 2. Black/Dark Outside Bars (Visible outside the logo before entering) */}
            <AnimatedRect
              x={64}
              y={100}
              width={20}
              height={20}
              fill={outsideBarColor}
              style={bar1Style}
            />
            <AnimatedRect
              x={90}
              y={80}
              width={20}
              height={40}
              fill={outsideBarColor}
              style={bar2Style}
            />
            <AnimatedRect
              x={116}
              y={60}
              width={20}
              height={60}
              fill={outsideBarColor}
              style={bar3Style}
            />
            <AnimatedRect
              x={142}
              y={40}
              width={20}
              height={80}
              fill={outsideBarColor}
              style={bar4Style}
            />

            {/* 3. The Inside Background Fill (Fades in once outline completes, separated by gap) */}
            <AnimatedRect
              x={INSIDE_X}
              y={INSIDE_Y}
              width={INSIDE_WIDTH}
              height={INSIDE_HEIGHT}
              rx={INSIDE_RADIUS}
              ry={INSIDE_RADIUS}
              fill={logoColor}
              style={insideStyle}
            />

            {/* 4. White Inside Bars (Clipped inside the colored background) */}
            <G clipPath="url(#insideClip)">
              <AnimatedRect
                x={64}
                y={100}
                width={20}
                height={20}
                fill={insideBarColor}
                style={bar1Style}
              />
              <AnimatedRect
                x={90}
                y={80}
                width={20}
                height={40}
                fill={insideBarColor}
                style={bar2Style}
              />
              <AnimatedRect
                x={116}
                y={60}
                width={20}
                height={60}
                fill={insideBarColor}
                style={bar3Style}
              />
              <AnimatedRect
                x={142}
                y={40}
                width={20}
                height={80}
                fill={insideBarColor}
                style={bar4Style}
              />
            </G>
          </G>
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
    width: 40,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
  },
});
