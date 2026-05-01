import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { 
  useSharedValue, 
  withTiming, 
  runOnJS,
  useAnimatedStyle,
} from "react-native-reanimated";
import { useVideoPlayer, VideoView } from "expo-video";
import { useTheme } from "../context/GlobalContext";

const videoSource = require("../assets/images/WhatsApp Video 2026-04-29 at 8.56.35 PM.mp4");

export default function LogoLoadingScreen({ onComplete }) {
  const { theme } = useTheme();
  const masterOpacity = useSharedValue(1);

  const player = useVideoPlayer(videoSource, (player) => {
    player.loop = false; // Play once then transition
    player.play();
  });

  const containerStyle = useAnimatedStyle(() => ({
    opacity: masterOpacity.value,
  }));

  useEffect(() => {
    // Transition trigger when video ends
    const subscription = player.addListener('playToEnd', () => {
      masterOpacity.value = withTiming(0, { duration: 600 }, (finished) => {
        if (finished) runOnJS(onComplete)();
      });
    });

    return () => {
      subscription.remove();
    };
  }, [player, onComplete]);

  return (
    <Animated.View style={[styles.container, { backgroundColor: '#FFFFFF' }, containerStyle]}>
      <VideoView
        player={player}
        style={styles.video}
        contentFit="contain"
        fullscreenOptions={{ isAutoStart: false }}
        showsControls={false}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden', // Ensures scaled video doesn't bleed out
  },
  video: {
    width: '100%',
    height: '100%',
    transform: [{ scale: 1.30 }], // Zoom in 30% to completely hide black bars
  }
});
