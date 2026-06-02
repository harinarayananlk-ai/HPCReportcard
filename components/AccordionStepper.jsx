import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '../context/GlobalContext';
import { gems } from '../colour_themes';
import { Ionicons } from '@expo/vector-icons';
import GemCutCard from './GemCutCard';
import GemButton from './GemButton';

export default function AccordionStepper({ steps, activeStep, onStepChange }) {
  const { theme } = useTheme();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {steps.map((step, index) => {
        const isActive = activeStep === index;
        const isComplete = step.isComplete;

        return (
          <View key={index} style={styles.stepContainer}>
            {/* Left Rail (Step Indicator) */}
            <View style={styles.leftRail}>
              <View
                style={[
                  styles.circle,
                  isComplete
                    ? { backgroundColor: '#22c55e', borderColor: '#22c55e' }
                    : isActive
                    ? { backgroundColor: '#B8972E', borderColor: '#B8972E' }
                    : { backgroundColor: 'transparent', borderColor: '#B8972E' },
                ]}
              >
                {isComplete ? (
                  <Ionicons name="checkmark" size={14} color="#FFF" />
                ) : (
                  <Text
                    style={[
                      styles.circleText,
                      isActive ? { color: '#FFF' } : { color: '#B8972E' },
                    ]}
                  >
                    {index + 1}
                  </Text>
                )}
              </View>
              {index < steps.length && (
                <View
                  style={[
                    styles.line,
                    {
                      backgroundColor: isComplete
                        ? '#22c55e'
                        : '#B8972E',
                    },
                  ]}
                />
              )}
            </View>

            {/* Right Card Content */}
            <View style={styles.rightContent}>
              <GemCutCard
                borderColor={isActive ? gems.sapphire : theme.border}
                contentStyle={{ padding: 0 }}
              >
                <TouchableOpacity
                  onPress={() => onStepChange(index)}
                  activeOpacity={0.7}
                  style={styles.stepHeader}
                >
                  <Text style={[styles.stepTitle, { color: theme.text }]}>
                    {step.title}
                  </Text>
                  <Ionicons
                    name={isActive ? 'chevron-up' : 'chevron-down'}
                    size={16}
                    color={theme.secondaryText}
                  />
                </TouchableOpacity>
              </GemCutCard>

              {isActive && (
                <GemCutCard
                  borderColor={theme.border}
                  style={{ marginTop: 8 }}
                  contentStyle={{ padding: 16 }}
                >
                  {step.content()}
                  
                  {index < steps.length - 1 && (
                    <GemButton
                      gemType="emerald"
                      width={120}
                      onPress={() => onStepChange(index + 1)}
                      style={styles.nextBtn}
                    >
                      <Text style={styles.nextBtnText}>NEXT</Text>
                    </GemButton>
                  )}
                </GemCutCard>
              )}
            </View>
          </View>
        );
      })}

      {/* 4th circle "Finished" indicator */}
      <View style={styles.stepContainer}>
        <View style={styles.leftRail}>
          <View
            style={[
              styles.circle,
              steps.every(s => s.isComplete)
                ? { backgroundColor: '#22c55e', borderColor: '#22c55e' }
                : { backgroundColor: 'transparent', borderColor: '#B8972E' },
            ]}
          >
            {steps.every(s => s.isComplete) ? (
              <Ionicons name="checkmark" size={14} color="#FFF" />
            ) : (
              <Ionicons name="flag-outline" size={14} color="#B8972E" />
            )}
          </View>
        </View>
        <View style={[styles.rightContent, { justifyContent: 'center' }]}>
          <View
            style={[
              styles.stepHeader,
              {
                backgroundColor: theme.isDark ? 'rgba(30, 30, 35, 0.4)' : 'rgba(255, 255, 255, 0.3)',
                borderColor: 'transparent',
                borderWidth: 0,
                paddingVertical: 12,
              },
            ]}
          >
            <Text style={[styles.stepTitle, { color: theme.secondaryText }]}>Finished</Text>
            <Ionicons name="checkmark-done-circle" size={18} color={steps.every(s => s.isComplete) ? '#22c55e' : '#B8972E'} />
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  stepContainer: {
    flexDirection: 'row',
    marginBottom: 0,
  },
  leftRail: {
    alignItems: 'center',
    width: 40,
  },
  circle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  circleText: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'Jost_600SemiBold',
  },
  line: {
    width: 2,
    flex: 1,
    minHeight: 40,
    marginVertical: 4,
    zIndex: 1,
  },
  rightContent: {
    flex: 1,
    marginLeft: 8,
    marginBottom: 16,
  },
  stepHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    borderWidth: 0,
    overflow: 'hidden',
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
    fontFamily: 'Jost_600SemiBold',
  },
  stepBody: {
    marginTop: 8,
    padding: 16,
    borderRadius: 14,
    borderWidth: 0,
    overflow: 'hidden',
  },
  nextBtn: {
    marginTop: 16,
    alignSelf: 'flex-end',
  },
  nextBtnText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    fontFamily: 'Jost_600SemiBold',
  },
});
