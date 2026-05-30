import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { useTheme } from '../context/GlobalContext';
import { gems } from '../colour_themes';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function FlashcardDeck({ questions, onAnswer, onComplete }) {
  const { theme } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});

  const cardTranslateX = useSharedValue(0);
  const cardOpacity = useSharedValue(1);

  // Restart/Reset card styles on load
  useEffect(() => {
    cardTranslateX.value = 0;
    cardOpacity.value = 1;
  }, [currentIndex]);

  const handleComplete = (nextAnswers) => {
    setTimeout(() => {
      onComplete(nextAnswers);
    }, 150);
  };

  const handleSelectOption = (value) => {
    const nextAnswers = { ...answers, [currentIndex]: value };
    setAnswers(nextAnswers);

    // Call onAnswer prop
    onAnswer(currentIndex, value);

    // Animate Card Out
    cardTranslateX.value = withTiming(-SCREEN_WIDTH, { duration: 250 }, (finished) => {
      if (finished) {
        if (currentIndex < questions.length - 1) {
          runOnJS(setCurrentIndex)(currentIndex + 1);
          // Set translation to right for entry animation
          cardTranslateX.value = SCREEN_WIDTH;
          cardOpacity.value = 0;
          
          // Animate Card In
          cardTranslateX.value = withSpring(0, { damping: 15, stiffness: 100 });
          cardOpacity.value = withTiming(1, { duration: 250 });
        } else {
          // Assessment Complete
          runOnJS(handleComplete)(nextAnswers);
        }
      }
    });
  };

  const currentQuestion = questions[currentIndex];
  const progress = questions.length > 0 ? (currentIndex + 1) / questions.length : 0;

  const cardAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: cardTranslateX.value }],
      opacity: cardOpacity.value,
    };
  });

  return (
    <View style={styles.container}>
      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        <Text style={[styles.progressText, { color: theme.secondaryText }]}>
          Card {currentIndex + 1} of {questions.length}
        </Text>
        <View style={[styles.progressBarBg, { backgroundColor: theme.border }]}>
          <View style={[styles.progressBarFill, { width: `${progress * 100}%`, backgroundColor: '#0D47A1' }]} />
        </View>
      </View>

      {/* Center Card */}
      <Animated.View style={[styles.cardFrame, cardAnimatedStyle]}>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: '#B8972E' }]}>
          <Text style={[styles.categoryLabel, { color: '#B8972E' }]}>QUESTION</Text>
          <Text style={[styles.questionText, { color: theme.text }]}>
            {currentQuestion}
          </Text>
        </View>
      </Animated.View>

      {/* 2x2 Option Buttons Grid */}
      <View style={styles.optionsGrid}>
        <View style={styles.row}>
          <TouchableOpacity
            style={[styles.optionBtn, { borderColor: gems.emerald, backgroundColor: gems.emerald + '15' }]}
            onPress={() => handleSelectOption('Yes')}
          >
            <Text style={styles.emoji}>😊</Text>
            <Text style={[styles.btnText, { color: gems.emerald }]}>Yes</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.optionBtn, { borderColor: gems.topaz, backgroundColor: gems.topaz + '15' }]}
            onPress={() => handleSelectOption('Sometimes')}
          >
            <Text style={styles.emoji}>🤔</Text>
            <Text style={[styles.btnText, { color: gems.topaz }]}>Sometimes</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.row}>
          <TouchableOpacity
            style={[styles.optionBtn, { borderColor: gems.ruby, backgroundColor: gems.ruby + '15' }]}
            onPress={() => handleSelectOption('No')}
          >
            <Text style={styles.emoji}>😟</Text>
            <Text style={[styles.btnText, { color: gems.ruby }]}>No</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.optionBtn, { borderColor: gems.moonstone, backgroundColor: gems.moonstone + '15' }]}
            onPress={() => handleSelectOption('Not Sure')}
          >
            <Text style={styles.emoji}>❓</Text>
            <Text style={[styles.btnText, { color: gems.moonstone }]}>Not Sure</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    width: '100%',
  },
  progressContainer: {
    width: '90%',
    marginBottom: 20,
  },
  progressText: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'Jost_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    width: '100%',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  cardFrame: {
    width: '90%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  card: {
    width: '100%',
    minHeight: 200,
    borderRadius: 24,
    borderWidth: 2,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  categoryLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 16,
    fontFamily: 'Jost_600SemiBold',
  },
  questionText: {
    fontSize: 18,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 26,
    fontFamily: 'Jost_400Regular',
  },
  optionsGrid: {
    width: '90%',
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  optionBtn: {
    flex: 1,
    height: 70,
    borderRadius: 16,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  emoji: {
    fontSize: 24,
  },
  btnText: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'Jost_600SemiBold',
  },
});
