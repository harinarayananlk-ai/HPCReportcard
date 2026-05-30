import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  Dimensions,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { gems } from '../colour_themes';
import { Ionicons } from '@expo/vector-icons';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_HEIGHT = 280;

// Emoji auto-match mapping
const emojiMap = {
  // Colour
  red: '🔴', blue: '🔵', green: '🟢', yellow: '🟡', orange: '🟠', pink: '🌸', purple: '🟣', black: '⚫', white: '⚪', gold: '👑', silver: '🥈',
  // Food
  pizza: '🍕', burger: '🍔', samosa: '🥟', mango: '🥭', apple: '🍎', banana: '🍌', chocolate: '🍫', 'ice cream': '🍦', icecream: '🍦', cake: '🍰', rice: '🍚', milk: '🥛', pasta: '🍝', maggi: '🍜',
  // Animal
  cat: '🐱', dog: '🐶', lion: '🦁', tiger: '🐯', rabbit: '🐰', monkey: '🐵', panda: '🐼', elephant: '🐘', bear: '🐻', deer: '🦌', cow: '🐮', horse: '🐴', fox: '🦊',
  // Flower
  rose: '🌹', sunflower: '🌻', lotus: '🪷', tulip: '🌷', hibiscus: '🌺', marigold: '🌼', lily: '🪻', jasmine: '🌸',
  // Sport
  cricket: '🏏', football: '⚽', soccer: '⚽', badminton: '🏸', tennis: '🎾', basketball: '🏀', chess: '♟️', running: '🏃', swimming: '🏊', kabaddi: '🤼',
  // Subject
  math: '🧮', maths: '🧮', science: '🔬', english: '📖', hindi: '✍️', art: '🎨', music: '🎵', history: '📜', geography: '🗺️', computer: '💻', drawing: '🎨'
};

function getMatchingEmoji(text) {
  if (!text) return null;
  const normalized = text.toLowerCase().trim();
  // Check exact matches or containing words
  if (emojiMap[normalized]) {
    return emojiMap[normalized];
  }
  // Check if any key is contained in the typed text
  for (const [key, value] of Object.entries(emojiMap)) {
    if (normalized.includes(key)) {
      return value;
    }
  }
  return null;
}

export default function FavoritesBottomSheet({ visible, category, value, onChangeText, onClose }) {
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const startY = useSharedValue(0);
  const [inputText, setInputText] = useState(value || '');

  useEffect(() => {
    if (visible) {
      setInputText(value || '');
      translateY.value = withSpring(0, { damping: 20, stiffness: 120 });
    } else {
      translateY.value = withSpring(SCREEN_HEIGHT, { damping: 20, stiffness: 120 });
    }
  }, [visible, value]);

  const handleClose = () => {
    translateY.value = withSpring(SCREEN_HEIGHT, { damping: 20, stiffness: 120 }, (finished) => {
      'worklet';
      if (finished) {
        runOnJS(onClose)();
      }
    });
  };

  const handleSave = () => {
    onChangeText(inputText);
    handleClose();
  };

  const panGesture = Gesture.Pan()
    .onStart(() => {
      'worklet';
      startY.value = translateY.value;
    })
    .onUpdate((event) => {
      'worklet';
      // Only allow dragging downwards
      const nextY = startY.value + event.translationY;
      translateY.value = Math.max(0, nextY);
    })
    .onEnd((event) => {
      'worklet';
      if (event.velocityY > 500 || event.translationY > SHEET_HEIGHT * 0.4) {
        runOnJS(handleClose)();
      } else {
        translateY.value = withSpring(0, { damping: 15, stiffness: 120 });
      }
    });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

  const matchedEmoji = getMatchingEmoji(inputText);

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={handleClose}
    >
      <TouchableWithoutFeedback onPress={() => { Keyboard.dismiss(); handleClose(); }}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <Animated.View style={[styles.sheet, animatedStyle]}>
              <GestureDetector gesture={panGesture}>
                <Animated.View style={styles.dragHandler}>
                  <View style={styles.bar} />
                </Animated.View>
              </GestureDetector>

              <View style={styles.content}>
                <Text style={styles.title}>{"What's your favorite"} {category}?</Text>
                
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder={`Type favorite ${category} here...`}
                    placeholderTextColor="rgba(0,0,0,0.35)"
                    value={inputText}
                    onChangeText={setInputText}
                    autoFocus
                  />
                  {matchedEmoji ? (
                    <Text style={styles.emojiText}>{matchedEmoji}</Text>
                  ) : null}
                </View>

                <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                  <Text style={styles.saveBtnText}>DONE</Text>
                  <Ionicons name="checkmark" size={18} color="#FFF" />
                </TouchableOpacity>
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    height: SHEET_HEIGHT,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1.5,
    borderColor: gems.topaz, // Gold trim
    paddingHorizontal: 20,
    paddingBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 10,
  },
  dragHandler: {
    alignItems: 'center',
    paddingVertical: 12,
    width: '100%',
  },
  bar: {
    width: 44,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    letterSpacing: 0.5,
    fontFamily: 'Jost_600SemiBold',
    textTransform: 'capitalize',
    marginTop: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    borderBottomWidth: 1.5,
    borderColor: '#ccc',
    paddingBottom: 8,
    marginVertical: 16,
  },
  input: {
    flex: 1,
    fontSize: 18,
    color: '#222',
    fontFamily: 'Jost_400Regular',
    paddingHorizontal: 8,
  },
  emojiText: {
    fontSize: 28,
    marginLeft: 8,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0D47A1', // Sapphire primary
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 24,
    gap: 8,
    width: '60%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  saveBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 2,
    fontFamily: 'Jost_600SemiBold',
  },
});
