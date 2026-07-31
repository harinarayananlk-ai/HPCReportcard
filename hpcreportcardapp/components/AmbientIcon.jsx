import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const AmbientIcon = ({ name, size = 24, color = '#FFF', type = 'hop', duration = 2000 }) => {
  const animValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animValue, {
          toValue: 1,
          duration: duration,
          useNativeDriver: false, // SVG doesn't support native driver for strokeDashoffset
        }),
        Animated.timing(animValue, {
          toValue: 0,
          duration: duration,
          useNativeDriver: false,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [animValue, duration]);

  const renderIcon = () => (
    <Ionicons name={name} size={size} color={color} />
  );

  if (type === 'hop') {
    const translateY = animValue.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0, -size * 0.2, 0],
    });
    const scaleX = animValue.interpolate({
      inputRange: [0, 0.4, 0.5, 0.6, 1],
      outputRange: [1, 1, 1.2, 1, 1],
    });

    return (
      <Animated.View style={{ transform: [{ translateY }, { scaleX }] }}>
        {renderIcon()}
      </Animated.View>
    );
  }

  if (type === 'circle') {
    const circumference = 2 * Math.PI * (size * 0.7);
    const strokeDashoffset = animValue.interpolate({
      inputRange: [0, 1],
      outputRange: [circumference, 0],
    });

    return (
      <View style={{ width: size * 1.5, height: size * 1.5, justifyContent: 'center', alignItems: 'center' }}>
        <Svg height={size * 1.5} width={size * 1.5} style={StyleSheet.absoluteFill}>
          <AnimatedCircle
            cx={size * 0.75}
            cy={size * 0.75}
            r={size * 0.7}
            stroke={color}
            strokeWidth="2"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </Svg>
        {renderIcon()}
      </View>
    );
  }

  if (type === 'glow') {
    const opacity = animValue.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0.3, 0.8, 0.3],
    });
    const scale = animValue.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [1, 1.2, 1],
    });

    return (
      <View style={{ justifyContent: 'center', alignItems: 'center' }}>
        <Animated.View 
          style={[
            StyleSheet.absoluteFill, 
            { 
              backgroundColor: color, 
              borderRadius: size, 
              opacity, 
              transform: [{ scale }] 
            }
          ]} 
        />
        {renderIcon()}
      </View>
    );
  }

  return renderIcon();
};

export default AmbientIcon;
