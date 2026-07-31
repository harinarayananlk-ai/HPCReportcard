import React, { useCallback } from "react";
import { TouchableOpacity } from "react-native";
import { createAudioPlayer } from "expo-audio";
import * as Haptics from "expo-haptics";
import { useAuth } from "../context/GlobalContext";

const SOUND_FILE = require("../assets/Sounds/notification_sound.mp3");

// Shared sound instance so we don't reload the file on every press
let _sound = null;

async function playNotificationSound(enabled) {
  if (!enabled) return;
  try {
    if (!_sound) {
      _sound = createAudioPlayer(SOUND_FILE);
    }
    _sound.play();
  } catch (e) {
    // Fail silently
  }
}

export default function SoundButton({ onPress, children, ...props }) {
  const { soundEnabled } = useAuth();
  
  const handlePress = useCallback(
    async (...args) => {
      // Trigger subtle haptic feedback
      if (process.env.EXPO_OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      
      await playNotificationSound(soundEnabled);
      onPress?.(...args);
    },
    [onPress, soundEnabled]
  );

  return (
    <TouchableOpacity {...props} onPress={handlePress}>
      {children}
    </TouchableOpacity>
  );
}
