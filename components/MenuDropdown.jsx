import React, { useState, useEffect } from "react";
import { View, StyleSheet, Text, TouchableOpacity, Modal, TouchableWithoutFeedback } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, usePathname } from "expo-router";
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

export default function MenuDropdown() {
  const router = useRouter();
  const pathname = usePathname();
  const { theme } = useTheme();
  const { user, profile, teacherInfo, activeStudentProfile } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const targetProfile = activeStudentProfile || profile;
  const cls = (targetProfile?.class_name || '').toLowerCase().trim();
  const isStage4 = pathname?.includes('/stage4/') || cls === 'grade 9' || cls === 'grade 10' || cls === 'grade 11' || cls === 'grade 12';
  const isTeacher = user?.role === 'teacher' || user?.role === 'superadmin';

  // Trigger button coin-flip rotation (0 to 180 degrees)
  const buttonRotation = useSharedValue(0);

  // Shared values for cards A-F + HOME
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

  const translateY_D = useSharedValue(0);
  const rotateX_D = useSharedValue(-90);
  const rotateZ_D = useSharedValue(0);
  const opacity_D = useSharedValue(0);

  const translateY_E = useSharedValue(0);
  const rotateX_E = useSharedValue(-90);
  const rotateZ_E = useSharedValue(0);
  const opacity_E = useSharedValue(0);

  const translateY_F = useSharedValue(0);
  const rotateX_F = useSharedValue(-90);
  const rotateZ_F = useSharedValue(0);
  const opacity_F = useSharedValue(0);

  const translateY_Home = useSharedValue(0);
  const rotateX_Home = useSharedValue(-90);
  const rotateZ_Home = useSharedValue(0);
  const opacity_Home = useSharedValue(0);

  const toggleMenu = () => {
    const nextState = !isMenuOpen;
    setIsMenuOpen(nextState);

    buttonRotation.value = withSpring(nextState ? 180 : 0, {
      damping: 14,
      stiffness: 95,
    });
  };

  useEffect(() => {
    const dropSpringConfig = {
      damping: 10,
      stiffness: 110,
      mass: 1.1,
    };

    const swingSpringConfig = {
      damping: 3.8,
      stiffness: 28,
    };

    if (isMenuOpen) {
      // Card A
      translateY_A.value = withSpring(52, dropSpringConfig);
      rotateX_A.value = withSpring(0, dropSpringConfig);
      opacity_A.value = withTiming(1, { duration: 150 });
      rotateZ_A.value = -7;
      rotateZ_A.value = withSpring(0, swingSpringConfig);

      // Card B
      translateY_B.value = withDelay(70, withSpring(94, dropSpringConfig));
      rotateX_B.value = withDelay(70, withSpring(0, dropSpringConfig));
      opacity_B.value = withDelay(70, withTiming(1, { duration: 150 }));
      rotateZ_B.value = 7;
      rotateZ_B.value = withDelay(70, withSpring(0, swingSpringConfig));

      // Card C
      translateY_C.value = withDelay(140, withSpring(136, dropSpringConfig));
      rotateX_C.value = withDelay(140, withSpring(0, dropSpringConfig));
      opacity_C.value = withDelay(140, withTiming(1, { duration: 150 }));
      rotateZ_C.value = -7;
      rotateZ_C.value = withDelay(140, withSpring(0, swingSpringConfig));

      if (isStage4) {
        // Card D
        translateY_D.value = withDelay(210, withSpring(178, dropSpringConfig));
        rotateX_D.value = withDelay(210, withSpring(0, dropSpringConfig));
        opacity_D.value = withDelay(210, withTiming(1, { duration: 150 }));
        rotateZ_D.value = 7;
        rotateZ_D.value = withDelay(210, withSpring(0, swingSpringConfig));

        // Card E
        translateY_E.value = withDelay(280, withSpring(220, dropSpringConfig));
        rotateX_E.value = withDelay(280, withSpring(0, dropSpringConfig));
        opacity_E.value = withDelay(280, withTiming(1, { duration: 150 }));
        rotateZ_E.value = -7;
        rotateZ_E.value = withDelay(280, withSpring(0, swingSpringConfig));

        // Card F
        translateY_F.value = withDelay(350, withSpring(262, dropSpringConfig));
        rotateX_F.value = withDelay(350, withSpring(0, dropSpringConfig));
        opacity_F.value = withDelay(350, withTiming(1, { duration: 150 }));
        rotateZ_F.value = 7;
        rotateZ_F.value = withDelay(350, withSpring(0, swingSpringConfig));

        // Card HOME
        translateY_Home.value = withDelay(420, withSpring(304, dropSpringConfig));
        rotateX_Home.value = withDelay(420, withSpring(0, dropSpringConfig));
        opacity_Home.value = withDelay(420, withTiming(1, { duration: 150 }));
        rotateZ_Home.value = -7;
        rotateZ_Home.value = withDelay(420, withSpring(0, swingSpringConfig));
      } else {
        // Card HOME for non-stage 4
        translateY_Home.value = withDelay(210, withSpring(178, dropSpringConfig));
        rotateX_Home.value = withDelay(210, withSpring(0, dropSpringConfig));
        opacity_Home.value = withDelay(210, withTiming(1, { duration: 150 }));
        rotateZ_Home.value = 7;
        rotateZ_Home.value = withDelay(210, withSpring(0, swingSpringConfig));
      }
    } else {
      // Collapse
      const cardsToReset = isStage4
        ? [
            { y: translateY_Home, rx: rotateX_Home, op: opacity_Home, rz: rotateZ_Home, delay: 0 },
            { y: translateY_F, rx: rotateX_F, op: opacity_F, rz: rotateZ_F, delay: 50 },
            { y: translateY_E, rx: rotateX_E, op: opacity_E, rz: rotateZ_E, delay: 100 },
            { y: translateY_D, rx: rotateX_D, op: opacity_D, rz: rotateZ_D, delay: 150 },
            { y: translateY_C, rx: rotateX_C, op: opacity_C, rz: rotateZ_C, delay: 200 },
            { y: translateY_B, rx: rotateX_B, op: opacity_B, rz: rotateZ_B, delay: 250 },
            { y: translateY_A, rx: rotateX_A, op: opacity_A, rz: rotateZ_A, delay: 300 },
          ]
        : [
            { y: translateY_Home, rx: rotateX_Home, op: opacity_Home, rz: rotateZ_Home, delay: 0 },
            { y: translateY_C, rx: rotateX_C, op: opacity_C, rz: rotateZ_C, delay: 60 },
            { y: translateY_B, rx: rotateX_B, op: opacity_B, rz: rotateZ_B, delay: 120 },
            { y: translateY_A, rx: rotateX_A, op: opacity_A, rz: rotateZ_A, delay: 180 },
          ];

      cardsToReset.forEach(item => {
        item.y.value = withDelay(item.delay, withSpring(0, dropSpringConfig));
        item.rx.value = withDelay(item.delay, withSpring(-90, dropSpringConfig));
        item.op.value = withDelay(item.delay, withTiming(0, { duration: 150 }));
        item.rz.value = withDelay(item.delay, withTiming(0, { duration: 150 }));
      });
    }
  }, [isMenuOpen, isStage4]);

  const handleNavigate = (route) => {
    setIsMenuOpen(false);
    buttonRotation.value = 0;
    router.push(route);
  };

  const handleGoHome = () => {
    setIsMenuOpen(false);
    buttonRotation.value = 0;
    const isTeacherRole = user?.role === 'teacher' || user?.role === 'superadmin' || teacherInfo != null;
    const target = isTeacherRole ? "/TeacherTracking" : "/StudentHomepage";
    router.replace(target);
  };

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

  const useCardStyle = (translateY, rotateX, rotateZ, opacity) => {
    return useAnimatedStyle(() => {
      return {
        opacity: opacity.value,
        transform: [
          { translateY: translateY.value },
          { translateY: -18 },
          { rotateX: `${rotateX.value}deg` },
          { rotateZ: `${rotateZ.value}deg` },
          { translateY: 18 },
        ],
      };
    });
  };

  const cardStyle_A = useCardStyle(translateY_A, rotateX_A, rotateZ_A, opacity_A);
  const cardStyle_B = useCardStyle(translateY_B, rotateX_B, rotateZ_B, opacity_B);
  const cardStyle_C = useCardStyle(translateY_C, rotateX_C, rotateZ_C, opacity_C);
  const cardStyle_D = useCardStyle(translateY_D, rotateX_D, rotateZ_D, opacity_D);
  const cardStyle_E = useCardStyle(translateY_E, rotateX_E, rotateZ_E, opacity_E);
  const cardStyle_F = useCardStyle(translateY_F, rotateX_F, rotateZ_F, opacity_F);
  const cardStyle_Home = useCardStyle(translateY_Home, rotateX_Home, rotateZ_Home, opacity_Home);

  const threadStyle = useAnimatedStyle(() => {
    const maxVal = translateY_Home.value;
    const height = Math.max(0, maxVal - 44);
    return {
      height: height,
      opacity: maxVal > 44 ? 1 : 0,
    };
  });

  const isDark = theme?.isDark;
  const solidBg = isDark ? "#222222" : "#FFFFFF";

  return (
    <View style={styles.container}>
      {/* Trigger Button (Always visible on header) */}
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
          <Animated.View style={[styles.btnFace, frontBtnStyle]}>
            <Ionicons name="list" size={28} color={theme?.text || "#000"} />
          </Animated.View>

          <Animated.View style={[styles.btnFace, backBtnStyle]}>
            <Text style={[styles.menuText, { color: gems.sapphire }]}>MENU</Text>
          </Animated.View>
        </SoundButton>
      </Animated.View>

      {/* Top Portal Overlay for Domino Cards when Menu is Open */}
      {isMenuOpen && (
        <Modal
          transparent
          visible={isMenuOpen}
          animationType="none"
          onRequestClose={() => setIsMenuOpen(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={styles.modalOverlay}
            onPress={() => setIsMenuOpen(false)}
          >
            <View style={styles.modalContentWrapper} pointerEvents="box-none">
              <Animated.View style={[styles.threadLine, { left: 32 - 0.75 }, threadStyle]} />
              <Animated.View style={[styles.threadLine, { left: 68 - 0.75 }, threadStyle]} />

              {/* Domino Cards */}
              <Animated.View pointerEvents="auto" style={[styles.domino, cardStyle_A]}>
                <TouchableOpacity
                  onPress={() => handleNavigate("/part_a1/StudentRegistration")}
                  style={[styles.cardBody, { backgroundColor: solidBg, borderColor: gems.sapphire }]}
                >
                  <Text style={[styles.cardText, { color: gems.sapphire }]}>PART A</Text>
                </TouchableOpacity>
              </Animated.View>

              <Animated.View pointerEvents="auto" style={[styles.domino, cardStyle_B]}>
                <TouchableOpacity
                  onPress={() => {
                    const partBRoute = isStage4
                      ? "/stage4/PartB_GroupProject"
                      : (cls === 'grade 3' || cls === 'grade 4' || cls === 'grade 5')
                        ? "/part_b_s2/SelectionPage"
                        : (cls === 'grade 6' || cls === 'grade 7' || cls === 'grade 8')
                          ? "/part_b_s3/SelectionPage"
                          : "/part_b_s1/SelectionPage";
                    handleNavigate(partBRoute);
                  }}
                  style={[styles.cardBody, { backgroundColor: solidBg, borderColor: gems.silver }]}
                >
                  <Text style={[styles.cardText, { color: gems.silver }]}>PART B</Text>
                </TouchableOpacity>
              </Animated.View>

              <Animated.View pointerEvents="auto" style={[styles.domino, cardStyle_C]}>
                <TouchableOpacity
                  onPress={() => handleNavigate(isStage4 ? "/stage4/PartC_ProblemBasedInquiry" : "/part_c_s1/YearEndSummary")}
                  style={[styles.cardBody, { backgroundColor: solidBg, borderColor: gems.sapphire }]}
                >
                  <Text style={[styles.cardText, { color: gems.sapphire }]}>PART C</Text>
                </TouchableOpacity>
              </Animated.View>

              {isStage4 && (
                <>
                  <Animated.View pointerEvents="auto" style={[styles.domino, cardStyle_D]}>
                    <TouchableOpacity
                      onPress={() => handleNavigate("/stage4/PartD_ClassroomInteractions")}
                      style={[styles.cardBody, { backgroundColor: solidBg, borderColor: gems.silver }]}
                    >
                      <Text style={[styles.cardText, { color: gems.silver }]}>PART D</Text>
                    </TouchableOpacity>
                  </Animated.View>

                  <Animated.View pointerEvents="auto" style={[styles.domino, cardStyle_E]}>
                    <TouchableOpacity
                      onPress={() => handleNavigate("/stage4/PartEF_TimeInventories")}
                      style={[styles.cardBody, { backgroundColor: solidBg, borderColor: gems.sapphire }]}
                    >
                      <Text style={[styles.cardText, { color: gems.sapphire }]}>PART E</Text>
                    </TouchableOpacity>
                  </Animated.View>

                  <Animated.View pointerEvents="auto" style={[styles.domino, cardStyle_F]}>
                    <TouchableOpacity
                      onPress={() => handleNavigate("/stage4/CompetencyProfile")}
                      style={[styles.cardBody, { backgroundColor: solidBg, borderColor: gems.silver }]}
                    >
                      <Text style={[styles.cardText, { color: gems.silver }]}>PART F</Text>
                    </TouchableOpacity>
                  </Animated.View>
                </>
              )}

              {/* HOME CARD (Go back to Homepage) */}
              <Animated.View pointerEvents="auto" style={[styles.domino, cardStyle_Home]}>
                <TouchableOpacity
                  onPress={handleGoHome}
                  style={[
                    styles.cardBody,
                    { backgroundColor: gems.sapphire, borderColor: gems.sapphire }
                  ]}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Ionicons name="home" size={13} color="#FFF" />
                    <Text style={[styles.cardText, { color: '#FFF', fontWeight: 'bold' }]}>HOME</Text>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            </View>
          </TouchableOpacity>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
    zIndex: 9999999,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "transparent",
    position: "relative",
    zIndex: 999999999,
  },
  modalContentWrapper: {
    position: "absolute",
    top: 24,
    left: 24,
    width: 120,
    height: 400,
    zIndex: 999999999,
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
    left: 50 - 0.75,
    top: 44,
    width: 1.5,
    backgroundColor: gems.sapphire,
    zIndex: -1,
  },
  domino: {
    position: "absolute",
    left: 50 - 60,
    width: 120,
    height: 32,
    zIndex: 999999999,
    elevation: 999999999,
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
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  cardText: {
    fontSize: 10,
    fontFamily: "Outfit_600SemiBold",
    letterSpacing: 1,
    textAlign: "center",
  },
});
