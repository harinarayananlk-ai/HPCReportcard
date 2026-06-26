import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp, FadeOut } from 'react-native-reanimated';
import { useTheme } from '../context/GlobalContext';
import { gems } from '../colour_themes';
import { Ionicons } from '@expo/vector-icons';
import GemCutCard from './GemCutCard';
import SoundButton from './SoundButton';

export default function TimelineNode({
  title,
  icon,
  isExpanded,
  isComplete,
  onToggle,
  children,
}) {
  const { theme } = useTheme();

  return (
    <View style={styles.nodeContainer}>
      {/* Left Timeline Spine & Bullet */}
      <View style={styles.spineContainer}>
        <LinearGradient
          colors={[gems.sapphire + '40', gems.sapphire, gems.sapphire + '40']}
          style={styles.spine}
        />
        <View
          style={[
            styles.bullet,
            {
              backgroundColor: isComplete ? gems.silver : theme.border,
              borderColor: isComplete ? gems.silver : theme.border,
              shadowColor: isComplete ? gems.silver : 'transparent',
            },
          ]}
        >
          {isComplete && <Ionicons name="checkmark" size={10} color="#FFF" />}
        </View>
      </View>

      {/* Right Content Area */}
      <View style={styles.rightContent}>
        {/* Header (Touchable) */}
        <GemCutCard
          borderColor={isExpanded ? gems.sapphire : theme.border}
          contentStyle={{ padding: 0 }}
        >
          <SoundButton
            onPress={onToggle}
            activeOpacity={0.7}
            style={styles.header}
          >
            <View style={styles.headerTitleRow}>
              {icon && (
                <Ionicons
                  name={icon}
                  size={18}
                  color={isComplete ? gems.silver : gems.sapphire}
                  style={styles.headerIcon}
                />
              )}
              <Text style={[styles.titleText, { color: theme.text }]}>{title}</Text>
            </View>
            <Ionicons
              name={isExpanded ? 'chevron-up' : 'chevron-down'}
              size={16}
              color={theme.secondaryText}
            />
          </SoundButton>
        </GemCutCard>

        {/* Expandable Body */}
        {isExpanded && (
          <Animated.View
            entering={FadeInUp.duration(200)}
            exiting={FadeOut.duration(150)}
            style={{ marginTop: 6 }}
          >
            <GemCutCard
              borderColor={theme.border}
              contentStyle={{ padding: 16 }}
            >
              {children}
            </GemCutCard>
          </Animated.View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  nodeContainer: {
    flexDirection: 'row',
    width: '100%',
  },
  spineContainer: {
    width: 32,
    alignItems: 'center',
    position: 'relative',
  },
  spine: {
    width: 2.5,
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 14.75,
  },
  bullet: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    position: 'absolute',
    top: 14,
    left: 7,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 3,
  },
  rightContent: {
    flex: 1,
    marginLeft: 6,
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    marginRight: 10,
  },
  titleText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
    fontFamily: 'Outfit_600SemiBold',
  },
});
