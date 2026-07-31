import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../context/GlobalContext';
import { gems } from '../colour_themes';
import SoundButton from './SoundButton';

export default function ActionChip({ label, isActive, onToggle }) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const handlePress = () => {
    scale.value = withSequence(
      withTiming(0.9, { duration: 100 }),
      withTiming(1, { duration: 100 })
    );
    onToggle();
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const chipContent = (
    <Text
      style={[
        styles.text,
        {
          color: isActive ? '#FFFFFF' : theme.text,
          fontWeight: isActive ? '700' : '400',
        },
      ]}
    >
      {label}
    </Text>
  );

  return (
    <Animated.View
      style={[
        styles.chipContainer,
        animatedStyle,
        !isActive && {
          backgroundColor: theme.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
          borderColor: theme.border,
        },
        isActive && {
          borderColor: gems.sapphire,
        },
      ]}
    >
      <SoundButton
        onPress={handlePress}
        activeOpacity={0.85}
        style={styles.soundButton}
      >
        {isActive ? (
          <LinearGradient
            colors={[gems.sapphire, gems.moonstone]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradient}
          >
            {chipContent}
          </LinearGradient>
        ) : (
          <View style={styles.nonActiveContent}>
            {chipContent}
          </View>
        )}
      </SoundButton>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  chipContainer: {
    borderRadius: 20,
    borderWidth: 1.2,
    marginRight: 8,
    marginBottom: 8,
    overflow: 'hidden',
    alignSelf: 'flex-start',
  },
  soundButton: {
    alignSelf: 'flex-start',
  },
  gradient: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nonActiveContent: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    letterSpacing: 0.5,
  },
});
