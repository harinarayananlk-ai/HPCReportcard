import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { gems } from '../colour_themes';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.2;

export default function SwipeableCarousel({ slides, currentIndex, onSlideChange }) {
  const translateX = useSharedValue(0);
  const startX = useSharedValue(0);

  const panGesture = Gesture.Pan()
    .onStart(() => {
      'worklet';
      startX.value = translateX.value;
    })
    .onUpdate((event) => {
      'worklet';
      translateX.value = startX.value + event.translationX;
    })
    .onEnd((event) => {
      'worklet';
      const dragDistance = event.translationX;

      if (dragDistance < -SWIPE_THRESHOLD && currentIndex < slides.length - 1) {
        // Swipe left -> Next slide
        translateX.value = withSpring(-SCREEN_WIDTH, { damping: 20, stiffness: 150 }, (finished) => {
          'worklet';
          if (finished) {
            translateX.value = 0;
            runOnJS(onSlideChange)(currentIndex + 1);
          }
        });
      } else if (dragDistance > SWIPE_THRESHOLD && currentIndex > 0) {
        // Swipe right -> Previous slide
        translateX.value = withSpring(SCREEN_WIDTH, { damping: 20, stiffness: 150 }, (finished) => {
          'worklet';
          if (finished) {
            translateX.value = 0;
            runOnJS(onSlideChange)(currentIndex - 1);
          }
        });
      } else {
        // Snap back to center
        translateX.value = withSpring(0, { damping: 15, stiffness: 100 });
      }
    });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  return (
    <View style={styles.container}>
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.slidesContainer, animatedStyle]}>
          {/* Render active slide */}
          <View style={styles.slideWrapper}>
            {slides[currentIndex]}
          </View>
        </Animated.View>
      </GestureDetector>

      {/* Pagination Dots */}
      <View style={styles.dotsContainer}>
        {slides.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              currentIndex === index
                ? { backgroundColor: gems.sapphire, width: 20 }
                : { backgroundColor: 'rgba(0, 0, 0, 0.15)' },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  slidesContainer: {
    flex: 1,
    width: SCREEN_WIDTH,
  },
  slideWrapper: {
    width: SCREEN_WIDTH,
    flex: 1,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 15,
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    width: 8,
  },
});
