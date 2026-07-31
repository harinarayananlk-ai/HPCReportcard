import React, { useState, useEffect } from "react";
import { View, StyleSheet, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
} from "react-native-reanimated";
import { useTheme, useAuth } from "../context/GlobalContext";
import SoundButton from "./SoundButton";
import { gems } from "../colour_themes";
import { getPartBRoute } from "../utils/stageRouter";

export default function MenuDropdown() {
  const router = useRouter();
  const { theme } = useTheme();
  const { profile, activeStudentProfile } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Trigger button coin-flip rotation (0 to 180 degrees)
  const buttonRotation = useSharedValue(0);

  // Domino cards shared values — only A and B now
  const translateY_A = useSharedValue(0);
  const rotateX_A = useSharedValue(-90);
  const rotateZ_A = useSharedValue(0);
  const opacity_A = useSharedValue(0);

  const translateY_B = useSharedValue(0);
  const rotateX_B = useSharedValue(-90);
  const rotateZ_B = useSharedValue(0);
  const opacity_B = useSharedValue(0);

  // Toggle menu state and trigger flip & cascade animations
  const toggleMenu = () => {
    const nextState = !isMenuOpen;
    setIsMenuOpen(nextState);

    buttonRotation.value = withSpring(nextState ? 180 : 0, {
      damping: 14,
      stiffness: 95,
    });
  };

  useEffect(() => {
    const dropSpringConfig = { damping: 10, stiffness: 110, mass: 1.1 };
    const swingSpringConfig = { damping: 3.8, stiffness: 28 };

    if (isMenuOpen) {
      // Card A (Part A) - No delay
      translateY_A.value = withSpring(56, dropSpringConfig);
      rotateX_A.value = withSpring(0, dropSpringConfig);
      opacity_A.value = withTiming(1, { duration: 150 });
      rotateZ_A.value = -7;
      rotateZ_A.value = withSpring(0, swingSpringConfig);

      // Card B (Part B) - 120ms delay
      translateY_B.value = withDelay(120, withSpring(106, dropSpringConfig));
      rotateX_B.value = withDelay(120, withSpring(0, dropSpringConfig));
      opacity_B.value = withDelay(120, withTiming(1, { duration: 150 }));
      rotateZ_B.value = 7;
      rotateZ_B.value = withDelay(120, withSpring(0, swingSpringConfig));
    } else {
      // Reverse collapse: B first, then A
      translateY_B.value = withSpring(0, dropSpringConfig);
      rotateX_B.value = withSpring(-90, dropSpringConfig);
      opacity_B.value = withTiming(0, { duration: 150 });
      rotateZ_B.value = withTiming(0, { duration: 150 });

      translateY_A.value = withDelay(120, withSpring(0, dropSpringConfig));
      rotateX_A.value = withDelay(120, withSpring(-90, dropSpringConfig));
      opacity_A.value = withDelay(120, withTiming(0, { duration: 150 }));
      rotateZ_A.value = withDelay(120, withTiming(0, { duration: 150 }));
    }
  }, [isMenuOpen]);

  const handleNavigate = (route) => {
    setIsMenuOpen(false);
    buttonRotation.value = 0;
    router.push(route);
  };

  // 3D Flip Animated Styles for the Trigger Button
  const animatedButtonStyle = useAnimatedStyle(() => {
    const rot = buttonRotation.value;
    return {
      width: rot < 90 ? 44 : 100,
      transform: [{ perspective: 400 }, { rotateY: `${rot}deg` }],
    };
  });

  const frontBtnStyle = useAnimatedStyle(() => ({
    opacity: buttonRotation.value >= 90 ? 0 : 1,
    position: "absolute",
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  }));

  const backBtnStyle = useAnimatedStyle(() => ({
    opacity: buttonRotation.value < 90 ? 0 : 1,
    transform: [{ rotateY: "180deg" }],
    position: "absolute",
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  }));

  // Domino card animated styles
  const useCardStyle = (translateY, rotateX, rotateZ, opacity) =>
    useAnimatedStyle(() => ({
      opacity: opacity.value,
      transform: [
        { translateY: translateY.value },
        { translateY: -18 },
        { rotateX: `${rotateX.value}deg` },
        { rotateZ: `${rotateZ.value}deg` },
        { translateY: 18 },
      ],
    }));

  const cardStyle_A = useCardStyle(translateY_A, rotateX_A, rotateZ_A, opacity_A);
  const cardStyle_B = useCardStyle(translateY_B, rotateX_B, rotateZ_B, opacity_B);

  // Thread stretches to height of Card B (last card now)
  const threadStyle = useAnimatedStyle(() => ({
    height: Math.max(0, translateY_B.value - 44),
    opacity: translateY_B.value > 44 ? 1 : 0,
  }));

  const isDark = theme?.isDark;
  const solidBg = isDark ? "#222222" : "#FFFFFF";
  const borderCol = isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.08)";
  const textColor = theme?.text || "#000000";

  // Resolve the right Part B route for the current student
  const targetProfile = activeStudentProfile || profile;
  const partBRoute = getPartBRoute(targetProfile?.class_name);

  return (
    <View style={styles.container}>
      {/* Parallel Dual Golden Threads — right-aligned */}
      <Animated.View style={[styles.threadLine, { right: 11 }, threadStyle]} />
      <Animated.View style={[styles.threadLine, { right: 47 }, threadStyle]} />

      {/* 3D Y-Axis Flipping Menu Wrapper */}
      <Animated.View style={[styles.triggerButton, animatedButtonStyle]}>
        <SoundButton
          onPress={toggleMenu}
          style={{ width: "100%", height: "100%", justifyContent: "center", alignItems: "center" }}
        >
          {/* Front Face: List Icon */}
          <Animated.View style={[styles.btnFace, frontBtnStyle]}>
            <Ionicons name="list" size={28} color={textColor} />
          </Animated.View>

          {/* Back Face: MENU text */}
          <Animated.View style={[styles.btnFace, backBtnStyle]}>
            <Text style={[styles.menuText, { color: gems.sapphire }]}>MENU</Text>
          </Animated.View>
        </SoundButton>
      </Animated.View>

      {/* Card A — Part A */}
      <Animated.View
        pointerEvents={isMenuOpen ? "auto" : "none"}
        style={[styles.domino, cardStyle_A]}
      >
        <TouchableOpacity
          onPress={() => handleNavigate("/part_a1/StudentRegistration")}
          style={[styles.cardBody, { backgroundColor: solidBg, borderColor: gems.sapphire }]}
        >
          <Text style={[styles.cardText, { color: gems.sapphire }]}>PART A</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Card B — Part B */}
      <Animated.View
        pointerEvents={isMenuOpen ? "auto" : "none"}
        style={[styles.domino, cardStyle_B]}
      >
        <TouchableOpacity
          onPress={() => handleNavigate(partBRoute)}
          style={[styles.cardBody, { backgroundColor: solidBg, borderColor: gems.silver }]}
        >
          <Text style={[styles.cardText, { color: gems.silver }]}>PART B</Text>
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
    fontFamily: "Outfit_600SemiBold",
    letterSpacing: 1.5,
    textAlign: "center",
  },
  threadLine: {
    position: "absolute",
    top: 44,
    width: 1.5,
    backgroundColor: gems.sapphire,
    zIndex: -1,
  },
  domino: {
    position: "absolute",
    right: 0,          // ← Aligned to right edge of container
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
    fontFamily: "Outfit_600SemiBold",
    letterSpacing: 1,
    textAlign: "center",
  },
});
