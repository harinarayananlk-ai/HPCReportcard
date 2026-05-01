import React from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import { WebView } from "react-native-webview";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

export default function ShootingStars({ theme }) {
  // Use the HTML from assets as a high-performance canvas background
  const htmlAsset = require("../assets/images/index.html");

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={[styles.container, { backgroundColor: theme.background }]}>
      <WebView
        source={htmlAsset}
        style={[
          styles.webview,
          {
            opacity: theme.isDark ? 0.8 : 0.4,
          }
        ]}
        scrollEnabled={false}
        overScrollMode="never"
        containerStyle={{ backgroundColor: 'transparent' }}
        transparent={true}
      />
      </View>
      
      {/* Overlay to further blend the animation with the theme color */}
      <View 
        style={[
          StyleSheet.absoluteFill, 
          { 
            backgroundColor: theme.background, 
            opacity: theme.isDark ? 0.2 : 0.88 
          }
        ]} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: "hidden",
  },
  webview: {
    width: SCREEN_W,
    height: SCREEN_H,
    backgroundColor: 'transparent',
  },
});
