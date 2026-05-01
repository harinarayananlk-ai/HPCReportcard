import React, { useEffect, useRef, useState } from "react";
import { View, StyleSheet, TouchableOpacity, Animated, Easing, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/GlobalContext";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";

export default function GearGroup({ style }) {
  const { theme } = useTheme();
  const router = useRouter();
  
  // States for interaction
  const [isHeld, setIsHeld] = useState(false);
  
  // Animation Values
  const rotation = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const pressAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  // Manual rotation tracking for full control
  const currentRotation = useRef(0);
  const speed = useRef(0.5); // Initial slow speed (degrees per frame)
  const targetSpeed = useRef(0.5);
  const lastUpdate = useRef(Date.now());

  useEffect(() => {
    // Entrance animation
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 40,
      friction: 8,
      useNativeDriver: true,
      delay: 500,
    }).start();

    // Frame-based animation loop for smooth mechanical feel
    let frame;
    const animate = () => {
      const now = Date.now();
      const delta = (now - lastUpdate.current) / 16.67; // Normalize to 60fps
      lastUpdate.current = now;

      // Smoothly approach target speed (Acceleration/Deceleration)
      const lerpFactor = isHeld ? 0.05 : 0.02;
      speed.current += (targetSpeed.current - speed.current) * lerpFactor;
      
      currentRotation.current += speed.current * delta;
      rotation.setValue(currentRotation.current);
      
      frame = requestAnimationFrame(animate);
    };
    
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [isHeld]);

  // Logic for Random Idle Speeds & Directions
  useEffect(() => {
    let interval;
    if (isHeld) {
      targetSpeed.current = 8; // High speed torque
      // Pulse glow
      Animated.timing(glowAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      // Return to idle glow
      Animated.timing(glowAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start();

      const pickNewTarget = () => {
        // Slow random speed between -1.5 and 1.5, avoiding 0
        let newSpeed = (Math.random() * 2 - 1) * 1.2;
        if (Math.abs(newSpeed) < 0.3) newSpeed = 0.5; // Ensure it keeps moving
        targetSpeed.current = newSpeed;
      };

      pickNewTarget();
      interval = setInterval(pickNewTarget, 4000 + Math.random() * 6000);
    }
    return () => clearInterval(interval);
  }, [isHeld]);

  // Interpolations
  const largeSpin = rotation.interpolate({
    inputRange: [0, 360],
    outputRange: ["0deg", "-360deg"], // Base CCW
  });

  const mediumSpin = rotation.interpolate({
    inputRange: [0, 360],
    outputRange: ["0deg", "576deg"], // 1.6x faster CW
  });

  const smallSpin = rotation.interpolate({
    inputRange: [0, 360],
    outputRange: ["0deg", "864deg"], // 2.4x faster CW
  });

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.1, 0.4],
  });

  const handlePressIn = () => {
    setIsHeld(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Animated.spring(pressAnim, {
      toValue: 0.85,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    setIsHeld(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.spring(pressAnim, {
      toValue: 1,
      friction: 4,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View 
      style={[
        styles.container, 
        style,
        { transform: [{ scale: Animated.multiply(scaleAnim, pressAnim) }] }
      ]}
    >
      <TouchableOpacity 
        activeOpacity={1}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={() => router.push("/Settings")}
      >
        {/* Aesthetic background glow */}
        <Animated.View 
          style={[
            styles.glowCircle, 
            { 
              backgroundColor: theme.primary,
              opacity: glowOpacity,
              transform: [{ scale: Animated.add(1, Animated.multiply(glowAnim, 0.2)) }]
            }
          ]} 
        />
        
        <View style={[styles.bgCircle, { backgroundColor: theme.card, borderColor: theme.border }]} />
        
        <View style={styles.gearsContainer}>
          {/* Top left gear - Medium */}
          <Animated.View style={[styles.mediumGear, { transform: [{ rotate: mediumSpin }] }]}>
            <Ionicons name="settings-sharp" size={26} color={theme.text} />
          </Animated.View>

          {/* Center gear - Large */}
          <Animated.View style={[styles.largeGear, { transform: [{ rotate: largeSpin }] }]}>
            <View style={styles.largeGearShadow} />
            <Ionicons name="settings-sharp" size={42} color={theme.primary} />
          </Animated.View>

          {/* Bottom right gear - Small */}
          <Animated.View style={[styles.smallGear, { transform: [{ rotate: smallSpin }] }]}>
            <Ionicons name="settings-sharp" size={20} color={theme.secondaryText} />
          </Animated.View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    zIndex: 2000, // Higher than everything
  },
  glowCircle: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    top: -5,
    left: -5,
    zIndex: 0,
  },
  bgCircle: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1.5,
    top: 0,
    left: 0,
    opacity: 0.95,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 1,
  },
  gearsContainer: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  mediumGear: {
    position: 'absolute',
    top: 10,
    left: 8,
    zIndex: 3,
  },
  largeGear: {
    position: 'absolute',
    top: 19,
    left: 19,
    zIndex: 4,
  },
  largeGearShadow: {
    position: 'absolute',
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.15)',
    top: 4,
    left: 4,
  },
  smallGear: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    zIndex: 3,
  }
});


