import React, { useState, useEffect } from "react";
import { View, StyleSheet, Text, TouchableOpacity, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  interpolate,
} from "react-native-reanimated";
import { useTheme, useAuth } from "../context/GlobalContext";
import SoundButton from "./SoundButton";
import { gems } from "../colour_themes";

export default function MenuDropdown() {
  const router = useRouter();
  const { theme } = useTheme();
  const { profile, activeStudentProfile } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Trigger button coin-flip rotation (0 to 180 degrees)
  const buttonRotation = useSharedValue(0);

  // Domino cards shared values
  const translateY_A = useSharedValue(0);
  const rotateX_A = useSharedValue(-90);
  const rotateZ_A = useSharedValue(0);
  const opacity_A = useSharedValue(0);

  const translateY_B = useSharedValue(0);
  const rotateX_B = useSharedValue(-90);
  const rotateZ_B = useSharedValue(0);
  const opacity_B = useSharedValue(0);

  const translateY_C = useSharedValue(0);
  const rotateX_C = useSharedValue(-90);
  const rotateZ_C = useSharedValue(0);
  const opacity_C = useSharedValue(0);

  // Toggle menu state and trigger flip & cascade animations
  const toggleMenu = () => {
    const nextState = !isMenuOpen;
    setIsMenuOpen(nextState);

    // Flip trigger button
    buttonRotation.value = withSpring(nextState ? 180 : 0, {
      damping: 14,
      stiffness: 95,
    });
  };

  useEffect(() => {
    // Custom spring configuration for heavy card drop & tug
    const dropSpringConfig = {
      damping: 10,
      stiffness: 110,
      mass: 1.1,
    };

    // Low damping for swinging pendulum oscillations
    const swingSpringConfig = {
      damping: 3.8,
      stiffness: 28,
    };

    if (isMenuOpen) {
      // Staggered Cascade Drop
      // Card A (Part A) - No delay
      translateY_A.value = withSpring(56, dropSpringConfig);
      rotateX_A.value = withSpring(0, dropSpringConfig);
      opacity_A.value = withTiming(1, { duration: 150 });
      rotateZ_A.value = -7; // Start tilted tighter
      rotateZ_A.value = withSpring(0, swingSpringConfig);

      // Card B (Part B) - 120ms delay
      translateY_B.value = withDelay(120, withSpring(106, dropSpringConfig));
      rotateX_B.value = withDelay(120, withSpring(0, dropSpringConfig));
      opacity_B.value = withDelay(120, withTiming(1, { duration: 150 }));
      rotateZ_B.value = 7; // Start tilted opposite tighter
      rotateZ_B.value = withDelay(120, withSpring(0, swingSpringConfig));

      // Card C (Part C) - 240ms delay
      translateY_C.value = withDelay(240, withSpring(156, dropSpringConfig));
      rotateX_C.value = withDelay(240, withSpring(0, dropSpringConfig));
      opacity_C.value = withDelay(240, withTiming(1, { duration: 150 }));
      rotateZ_C.value = -7;
      rotateZ_C.value = withDelay(240, withSpring(0, swingSpringConfig));
    } else {
      // Reverse Staggered Collapse
      // Card C collapses first - No delay
      translateY_C.value = withSpring(0, dropSpringConfig);
      rotateX_C.value = withSpring(-90, dropSpringConfig);
      opacity_C.value = withTiming(0, { duration: 150 });
      rotateZ_C.value = withTiming(0, { duration: 150 });

      // Card B collapses second - 120ms delay
      translateY_B.value = withDelay(120, withSpring(0, dropSpringConfig));
      rotateX_B.value = withDelay(120, withSpring(-90, dropSpringConfig));
      opacity_B.value = withDelay(120, withTiming(0, { duration: 150 }));
      rotateZ_B.value = withDelay(120, withTiming(0, { duration: 150 }));

      // Card A collapses last - 240ms delay
      translateY_A.value = withDelay(240, withSpring(0, dropSpringConfig));
      rotateX_A.value = withDelay(240, withSpring(-90, dropSpringConfig));
      opacity_A.value = withDelay(240, withTiming(0, { duration: 150 }));
      rotateZ_A.value = withDelay(240, withTiming(0, { duration: 150 }));
    }
  }, [isMenuOpen]);

  // Handle navigation and auto-collapse the menu
  const handleNavigate = (route) => {
    setIsMenuOpen(false);
    buttonRotation.value = 0;
    router.push(route);
  };

  // 3D Flip Animated Styles for the Entire Trigger Button Container
  const animatedButtonStyle = useAnimatedStyle(() => {
    const rot = buttonRotation.value;
    const width = rot < 90 ? 44 : 100;
    return {
      width: width,
      transform: [
        { perspective: 400 },
        { rotateY: `${rot}deg` },
      ],
    };
  });

  const frontBtnStyle = useAnimatedStyle(() => {
    const rot = buttonRotation.value;
    return {
      opacity: rot >= 90 ? 0 : 1,
      position: "absolute",
      width: "100%",
      height: "100%",
      justifyContent: "center",
      alignItems: "center",
    };
  });

  const backBtnStyle = useAnimatedStyle(() => {
    const rot = buttonRotation.value;
    return {
      opacity: rot < 90 ? 0 : 1,
      transform: [{ rotateY: "180deg" }],
      position: "absolute",
      width: "100%",
      height: "100%",
      justifyContent: "center",
      alignItems: "center",
    };
  });

  // Domino Cards Hanging Pivot Animated Styles
  const useCardStyle = (translateY, rotateX, rotateZ, opacity) => {
    return useAnimatedStyle(() => {
      return {
        opacity: opacity.value,
        transform: [
          { translateY: translateY.value },
          { translateY: -18 }, // Shift pivot point to top edge of card
          { rotateX: `${rotateX.value}deg` },
          { rotateZ: `${rotateZ.value}deg` },
          { translateY: 18 }, // Shift back
        ],
      };
    });
  };

  const cardStyle_A = useCardStyle(translateY_A, rotateX_A, rotateZ_A, opacity_A);
  const cardStyle_B = useCardStyle(translateY_B, rotateX_B, rotateZ_B, opacity_B);
  const cardStyle_C = useCardStyle(translateY_C, rotateX_C, rotateZ_C, opacity_C);

  // Dynamic Golden Thread stretching in sync with Card C
  const threadStyle = useAnimatedStyle(() => {
    const height = Math.max(0, translateY_C.value - 44);
    return {
      height: height,
      opacity: translateY_C.value > 44 ? 1 : 0,
    };
  });

  const isDark = theme?.isDark;
  const solidBg = isDark ? "#222222" : "#FFFFFF";
  const borderCol = isDark ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.08)";
  const textColor = theme?.text || "#000000";

  return (
    <View style={styles.container}>
      {/* Parallel Dual Golden Threads */}
      <Animated.View style={[styles.threadLine, { left: 32 - 0.75 }, threadStyle]} />
      <Animated.View style={[styles.threadLine, { left: 68 - 0.75 }, threadStyle]} />

      {/* 3D Y-Axis Flipping Menu Wrapper */}
      <Animated.View style={[styles.triggerButton, animatedButtonStyle]}>
        <SoundButton
          onPress={toggleMenu}
          style={{
            width: "100%",
            height: "100%",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {/* Front Face: List Icon (Larger size: 28) */}
          <Animated.View style={[styles.btnFace, frontBtnStyle]}>
            <Ionicons name="list" size={28} color={textColor} />
          </Animated.View>

          {/* Back Face: Clean Text "MENU" (Larger bold text) */}
          <Animated.View style={[styles.btnFace, backBtnStyle]}>
            <Text style={[styles.menuText, { color: gems.topaz }]}>MENU</Text>
          </Animated.View>
        </SoundButton>
      </Animated.View>

      {/* Staggered Domino Cards list */}
      <Animated.View
        pointerEvents={isMenuOpen ? "auto" : "none"}
        style={[styles.domino, cardStyle_A]}
      >
        <TouchableOpacity
          onPress={() => handleNavigate("/part_a1/StudentRegistration")}
          style={[
            styles.cardBody,
            { backgroundColor: solidBg, borderColor: gems.sapphire },
          ]}
        >
          <Text style={[styles.cardText, { color: gems.sapphire }]}>PART A</Text>
        </TouchableOpacity>
      </Animated.View>

      <Animated.View
        pointerEvents={isMenuOpen ? "auto" : "none"}
        style={[styles.domino, cardStyle_B]}
      >
        <TouchableOpacity
          onPress={() => {
            const targetProfile = activeStudentProfile || profile;
            const cls = (targetProfile?.class_name || '').toLowerCase().trim();
            const partBRoute = (cls === 'grade 3' || cls === 'grade 4' || cls === 'grade 5')
              ? "/part_b_s2/SelectionPage"
              : (cls === 'grade 6' || cls === 'grade 7' || cls === 'grade 8')
                ? "/part_b_s3/SelectionPage"
                : "/part_b_s1/SelectionPage";
            handleNavigate(partBRoute);
          }}
          style={[
            styles.cardBody,
            { backgroundColor: solidBg, borderColor: gems.emerald },
          ]}
        >
          <Text style={[styles.cardText, { color: gems.emerald }]}>PART B</Text>
        </TouchableOpacity>
      </Animated.View>

      <Animated.View
        pointerEvents={isMenuOpen ? "auto" : "none"}
        style={[styles.domino, cardStyle_C]}
      >
        <TouchableOpacity
          onPress={() => handleNavigate("/part_c_s1/YearEndSummary")}
          style={[
            styles.cardBody,
            { backgroundColor: solidBg, borderColor: gems.topaz },
          ]}
        >
          <Text style={[styles.cardText, { color: gems.topaz }]}>PART C</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
    zIndex: 2000,
  },
  triggerButton: {
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: gems.sapphire,
  },
  btnFace: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  menuText: {
    fontSize: 15,
    fontWeight: "bold",
    fontFamily: "Jost_600SemiBold",
    letterSpacing: 1.5,
    textAlign: "center",
  },
  threadLine: {
    position: "absolute",
    left: 50 - 0.75, // Centered under the 100px button (half width is 50)
    top: 44,
    width: 1.5,
    backgroundColor: gems.topaz, // Gold thread
    zIndex: -1,
  },
  domino: {
    position: "absolute",
    left: 50 - 60, // Centered horizontally relative to trigger button center (width 120)
    width: 120,
    height: 36,
    zIndex: 1999,
  },
  cardBody: {
    width: "100%",
    height: "100%",
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  cardText: {
    fontSize: 10,
    fontFamily: "Jost_600SemiBold",
    letterSpacing: 1,
    textAlign: "center",
  },
});
